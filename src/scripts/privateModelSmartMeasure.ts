import * as THREE from 'three';
import type { PointMeasurePoint } from './privateModelPointMeasure';
import { perpendicularToMeasureEdge, perpendicularToMeasurePlane } from './privateModelMeasureGeometry.mjs';
import { snapFromVisibleMeshHit } from './privateModelMeasureSnapAdapter.mjs';
import { pickVisibleWorkTest3DPoint, type WorkTest3DPoint } from './privateModelWorkTest3DPoint';

type Pixel = { x: number; y: number };
type ViewportRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
type SurfaceHit = { point: WorkTest3DPoint; hit: THREE.Intersection; pixel: Pixel };
type Feature = {
  kind: 'corner' | 'edge';
  pointG1: PointMeasurePoint;
  distancePx: number;
  segment?: { a: PointMeasurePoint; b: PointMeasurePoint };
};
export type MeasureCandidate = {
  point: PointMeasurePoint;
  kind: 'free' | 'corner' | 'edge' | 'perpendicular';
  frontmostHit?: THREE.Intersection;
};

const SNAP_RADIUS_PX = 12;
const CLEAR_CORNER_PX = 6;
const PERPENDICULAR_RADIUS_PX = 24;
const MAX_PERPENDICULAR_ADJUSTMENT_M = 0.25;
const DIAGONAL = SNAP_RADIUS_PX / Math.SQRT2;
const SILHOUETTE_PROBES = [
  [SNAP_RADIUS_PX, 0], [-SNAP_RADIUS_PX, 0], [0, SNAP_RADIUS_PX], [0, -SNAP_RADIUS_PX],
  [DIAGONAL, DIAGONAL], [-DIAGONAL, DIAGONAL], [DIAGONAL, -DIAGONAL], [-DIAGONAL, -DIAGONAL],
];

const toWorld = ({ xM, yM, sourceHeightYUpM }: PointMeasurePoint) =>
  new THREE.Vector3(xM, sourceHeightYUpM, -yM);
const pixelDistance = (a: Pixel, b: Pixel) => Math.hypot(a.x - b.x, a.y - b.y);

const projectWorld = (world: THREE.Vector3, camera: THREE.Camera, rect: ViewportRect): Pixel | null => {
  const ndc = world.clone().project(camera);
  if (![ndc.x, ndc.y, ndc.z].every(Number.isFinite) ||
      ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1 || ndc.z < -1 || ndc.z > 1) return null;
  return {
    x: rect.left + (ndc.x + 1) * rect.width / 2,
    y: rect.top + (1 - ndc.y) * rect.height / 2,
  };
};

export const projectMeasurePoint = (point: PointMeasurePoint, camera: THREE.Camera, rect: ViewportRect) =>
  projectWorld(toWorld(point), camera, rect);

/** Shared by the preview and the click. Candidate rays use the normal source
 * picker so clipped, occluded and viewer-generated surfaces stay excluded. */
export const resolveMeasureCandidate = ({
  pointer, rect, camera, modelRoot, raycaster, snap, start,
}: {
  pointer: Pixel;
  rect: ViewportRect;
  camera: THREE.Camera;
  modelRoot: THREE.Object3D;
  raycaster: THREE.Raycaster;
  snap: boolean;
  start: PointMeasurePoint | null;
}): MeasureCandidate | null => {
  const pickAt = (pixel: Pixel): SurfaceHit | null => {
    let hit: THREE.Intersection | undefined;
    const point = pickVisibleWorkTest3DPoint({
      clientX: pixel.x, clientY: pixel.y, rect, camera, modelRoot, raycaster,
      onVisibleHit: (visible) => { hit = visible; },
    });
    return point && hit ? { point, hit, pixel } : null;
  };
  const direct = pickAt(pointer);
  if (!snap) return direct ? { point: direct.point, kind: 'free', frontmostHit: direct.hit } : null;

  const confirmsPoint = (world: THREE.Vector3, target: SurfaceHit, toleranceM: number, edge: boolean) => {
    const pixel = projectWorld(world, camera, rect);
    if (!pixel) return false;
    let checked = pickAt(pixel);
    // Recasting on the exact boundary can miss by floating-point roundoff.
    // Sample slightly inside the same visible surface only after a miss.
    if (!checked && edge) {
      const towardHit = pixelDistance(pixel, target.pixel);
      if (towardHit > 0) {
        const step = Math.min(0.35 / towardHit, 1);
        checked = pickAt({
          x: pixel.x + (target.pixel.x - pixel.x) * step,
          y: pixel.y + (target.pixel.y - pixel.y) * step,
        });
      }
    }
    return !!checked && checked.hit.object === target.hit.object &&
      checked.hit.point.distanceTo(world) <= toleranceM;
  };

  // The JS adapter's public options are inferred from its default object.
  const snapVisibleMesh = snapFromVisibleMeshHit as unknown as (options: {
    frontmostHit: THREE.Intersection; camera: THREE.Camera; rect: ViewportRect; pointerPx: Pixel;
    cornerPriorityPx: number; acceptsFrontmostHit: (hit: THREE.Intersection) => boolean;
    isFeatureVisible: (candidate: { pointWorld: THREE.Vector3; sourceMesh: THREE.Mesh }) => boolean;
  }) => Feature | null;
  const featureAt = (target: SurfaceHit) => snapVisibleMesh({
    frontmostHit: target.hit, camera, rect, pointerPx: pointer,
    cornerPriorityPx: CLEAR_CORNER_PX,
    acceptsFrontmostHit: hit => hit === target.hit,
    isFeatureVisible: ({ pointWorld, sourceMesh }) =>
      sourceMesh === target.hit.object && confirmsPoint(pointWorld, target, 0.035, true),
  });

  const deliberateCorner = (feature: Feature | null) =>
    feature?.kind === 'corner' && feature.distancePx <= CLEAR_CORNER_PX;
  let feature = direct ? featureAt(direct) : null;
  let target = direct;
  if (!direct) {
    // A click just outside a silhouette can acquire a feature, but an offset
    // ray is never accepted as a free point.
    const tested = new Set<THREE.Object3D>();
    for (const [dx, dy] of SILHOUETTE_PROBES) {
      const nearby = pickAt({ x: pointer.x + dx, y: pointer.y + dy });
      if (!nearby || tested.has(nearby.hit.object)) continue;
      tested.add(nearby.hit.object);
      const candidate = featureAt(nearby);
      if (!candidate) continue;
      const preferred = Number(deliberateCorner(candidate)) - Number(deliberateCorner(feature));
      if (!feature || preferred > 0 || (preferred === 0 && candidate.distancePx < feature.distancePx)) {
        feature = candidate;
        target = nearby;
      }
    }
  }
  if (feature && deliberateCorner(feature)) return { point: feature.pointG1, kind: 'corner', frontmostHit: target?.hit };

  if (start && target) {
    const foot: PointMeasurePoint | null = feature?.segment
      ? perpendicularToMeasureEdge(start, feature.segment)
      : perpendicularToMeasurePlane(start, target.point, target.point.surfaceNormalG1);
    if (foot) {
      const world = toWorld(foot);
      const pixel = projectWorld(world, camera, rect);
      if (world.distanceToSquared(toWorld(start)) > 1e-10 &&
          world.distanceTo(target.hit.point) <= MAX_PERPENDICULAR_ADJUSTMENT_M &&
          pixel && pixelDistance(pixel, pointer) <= PERPENDICULAR_RADIUS_PX &&
          confirmsPoint(world, target, 0.004, Boolean(feature?.segment))) {
        return { point: foot, kind: 'perpendicular', frontmostHit: target.hit };
      }
    }
  }
  if (feature) return { point: feature.pointG1, kind: feature.kind, frontmostHit: target?.hit };
  return direct ? { point: direct.point, kind: 'free', frontmostHit: direct.hit } : null;
};
