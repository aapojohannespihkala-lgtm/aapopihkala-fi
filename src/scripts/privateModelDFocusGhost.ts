import { Box3, Mesh, MeshBasicMaterial, Plane, Vector3, type Material, type Object3D } from 'three';

/**
 * D-focus presentation (owner 22.11.2026): the D apartment (or one D floor)
 * at full strength, everything else as a very faint reference.
 * Presentation only: the GLB, its nodes, source materials and metadata are
 * not changed; every swap is restored by `restore()`.
 *
 * The focus box is world X/Z (viewer Y up) plus an optional height band for
 * the floor views. Meshes inside stay untouched, meshes without source clipping share ONE faint
 * material. Clipped source materials use a cached faint variant per source
 * (not per mesh), preserving source clips without restoring shader bloat.
 * Only large meshes that cross the box (roof,
 * terrain, two-storey walls) are split with local clipping planes.
 */
export type DFootprint = { x0: number; x1: number; z0: number; z1: number; y0?: number; y1?: number };

/** R22/R31 D-scoped objects (ylisViewScope D, active) span this world box. */
export const D_FOOTPRINT_FALLBACK: DFootprint = Object.freeze({ x0: -0.4, x1: 6.75, z0: -11.1, z1: 6.2 });
/**
 * D storey split in world Y (R22/R31 D scope): 1F content tops at 2.43 m and
 * 1F walls at 2.76 m, 2F content starts at 2.77 m.
 */
export const D_STOREY_SPLIT_Y = 2.77;
/** Meshes at least this long (m) are split at the focus box instead of classified whole. */
export const D_FOCUS_SPLIT_MIN_SIZE = 2.5;
/**
 * Outside small parts (fixtures, pipes, screws of the faint context) are left
 * out instead of drawn at 10 %: they add draw calls but no readable context.
 */
export const D_FOCUS_HIDE_MAX_SIZE = 0.8;

const renderableMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true && !!(object as Mesh).geometry;

/**
 * Footprint from the loaded scene's own D scope (userData.ylisViewScope, the
 * same source-bound contract the D views use). Falls back to the measured box
 * when the scope is missing or implausible.
 */
export const dFootprintFromScope = (root: Object3D, pad = 0.25): DFootprint => {
  const box = new Box3(), part = new Box3();
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    const scope = object.userData?.ylisViewScope;
    if (scope?.apartmentScope !== 'D' || scope?.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST') return;
    object.traverse((child) => {
      if (!renderableMesh(child)) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      part.copy(child.geometry.boundingBox!).applyMatrix4(child.matrixWorld);
      box.union(part);
    });
  });
  if (box.isEmpty()) return D_FOOTPRINT_FALLBACK;
  const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
  if (!(w > 3 && w < 12 && d > 6 && d < 26)) return D_FOOTPRINT_FALLBACK;
  return { x0: box.min.x - pad, x1: box.max.x + pad, z0: box.min.z - pad, z1: box.max.z + pad };
};

/** The same footprint limited to one D storey. */
export const dStoreyFootprint = (f: DFootprint, storey: '1F' | '2F'): DFootprint =>
  storey === '1F' ? { ...f, y0: undefined, y1: D_STOREY_SPLIT_Y } : { ...f, y0: D_STOREY_SPLIT_Y - 0.27, y1: undefined };

const span = (lo: number, hi: number, a: number | undefined, b: number | undefined) => {
  // A flat extent (single-plane wall, window glass, facade face, floor) is
  // inside when its plane lies within the range. Owner 22.11.2026 14.46: 154
  // planar R31 meshes (walls, windows) were measured as 0 % inside and faded.
  if (hi - lo < 1e-3) return lo >= (a ?? -Infinity) - 1e-4 && lo <= (b ?? Infinity) + 1e-4 ? 1 : 0;
  const size = hi - lo;
  const o = Math.max(0, Math.min(hi, b ?? Infinity) - Math.max(lo, a ?? -Infinity));
  return Math.min(1, o / size);
};

/** Fraction of a mesh's bbox that lies inside the focus box. */
export const footprintOverlap = (box: Box3, f: DFootprint) =>
  span(box.min.x, box.max.x, f.x0, f.x1) * span(box.min.z, box.max.z, f.z0, f.z1) *
  span(box.min.y, box.max.y, f.y0, f.y1);

const insideCenter = (box: Box3, f: DFootprint) => {
  const c = box.getCenter(new Vector3());
  return c.x >= f.x0 && c.x <= f.x1 && c.z >= f.z0 && c.z <= f.z1 &&
    c.y >= (f.y0 ?? -Infinity) && c.y <= (f.y1 ?? Infinity);
};

type Snapshot = {
  material: Material | Material[];
  visible: boolean;
  raycast: Mesh['raycast'];
  ownRaycast: boolean;
  suppressEdges: unknown;
  hadSuppressEdges: boolean;
  ghostChild: Mesh | null;
  temporary: Material[];
};

const noRaycast: Mesh['raycast'] = () => {};

export const createDFocusGhost = (opacity = 0.1) => {
  const snapshots = new Map<Mesh, Snapshot>();
  const level = Math.max(0.03, Math.min(0.3, opacity));
  const ghostBase = { color: 0xa9b6bf, transparent: true, opacity: level, depthWrite: false };
  // One shared faint material for everything outside: a single shader program.
  const ghost = new MeshBasicMaterial(ghostBase);
  let ghostClipped: MeshBasicMaterial | null = null;
  const sourceClippedGhosts = new Map<Material, MeshBasicMaterial>();
  const sourceClippedOutside = new Map<Material, MeshBasicMaterial>();

  // Preserve original source clipping while keeping unclipped objects on the
  // shared fast path. Cache special materials by original source identity.
  const ghostForSource = (source: Material, focusClips: Plane[] | null): MeshBasicMaterial => {
    const originalClips = source.clippingPlanes ?? [];
    if (!originalClips.length) return focusClips ? ghostClipped! : ghost;
    const cache = focusClips ? sourceClippedOutside : sourceClippedGhosts;
    let material = cache.get(source);
    if (!material) {
      material = new MeshBasicMaterial({
        ...ghostBase,
        clippingPlanes: focusClips ? [...originalClips, ...focusClips] : [...originalClips],
        clipIntersection: focusClips ? true : source.clipIntersection,
      });
      if (focusClips) {
        // A single Three.js clipIntersection=true mixes ALL supplied planes into
        // one intersection. That leaks source-clipped fragments outside D and
        // leaves a faint duplicate INSIDE D. Instead the discard predicate must
        // be (original source clips) OR (inside the D focus volume).
        // Keep one cached material per original source, never one per mesh.
        const sourceCount = originalClips.length;
        const focusCount = focusClips.length;
        const localCount = sourceCount + focusCount;
        const sourceIntersection = source.clipIntersection;
        material.onBeforeCompile = (shader) => {
          const include = '#include <clipping_planes_fragment>';
          if (!shader.fragmentShader.includes(include)) {
            throw new Error('D-focus mixed clipping: Three.js clipping shader chunk missing');
          }
          const sourcePredicate = sourceIntersection
            ? 'sourceRejected = sourceRejected && rejected;'
            : 'sourceRejected = sourceRejected || rejected;';
          // Three.js places global renderer clips BEFORE the local material clips.
          // Global clips are always rejected as a union; local source clips
          // keep their own union/intersection, then the D box is intersected.
          shader.fragmentShader = shader.fragmentShader.replace(include, `
#if NUM_CLIPPING_PLANES > 0
  vec4 plane;
  for (int i = 0; i < NUM_CLIPPING_PLANES - ${localCount}; i++) {
    plane = clippingPlanes[i];
    if (dot(vClipPosition, plane.xyz) > plane.w) discard;
  }
  bool sourceRejected = ${sourceIntersection ? 'true' : 'false'};
  for (int i = NUM_CLIPPING_PLANES - ${localCount};
       i < NUM_CLIPPING_PLANES - ${focusCount}; i++) {
    plane = clippingPlanes[i];
    bool rejected = dot(vClipPosition, plane.xyz) > plane.w;
    ${sourcePredicate}
  }
  if (sourceRejected) discard;
  bool insideD = true;
  for (int i = NUM_CLIPPING_PLANES - ${focusCount}; i < NUM_CLIPPING_PLANES; i++) {
    plane = clippingPlanes[i];
    insideD = insideD && (dot(vClipPosition, plane.xyz) > plane.w);
  }
  if (insideD) discard;
#endif
`);
        };
        // A changed source/focus plane count needs its own compiled program.
        // Plane positions remain uniforms and do not multiply shader variants.
        material.customProgramCacheKey = () =>
          `d-focus-mixed-clip-v1:${sourceCount}:${focusCount}:${sourceIntersection ? 'I' : 'U'}`;
      }
      cache.set(source, material);
    }
    return material;
  };

  const restore = () => {
    for (const [mesh, s] of snapshots) {
      mesh.material = s.material;
      mesh.visible = s.visible;
      if (s.ownRaycast) mesh.raycast = s.raycast;
      else delete (mesh as any).raycast;
      if (s.hadSuppressEdges) mesh.userData.viewerSuppressEdgeOverlay = s.suppressEdges;
      else delete mesh.userData.viewerSuppressEdgeOverlay;
      if (s.ghostChild) mesh.remove(s.ghostChild);
      for (const material of s.temporary) material.dispose();
    }
    snapshots.clear();
    ghostClipped?.dispose();
    ghostClipped = null;
    for (const cache of [sourceClippedGhosts, sourceClippedOutside]) {
      for (const material of cache.values()) material.dispose();
      cache.clear();
    }
  };

  /** Apply to the visible meshes under `root`. Returns counts for QA. */
  const apply = (root: Object3D, footprint: DFootprint) => {
    restore();
    root.updateMatrixWorld(true);
    const keepInside = [
      new Plane(new Vector3(1, 0, 0), -footprint.x0),
      new Plane(new Vector3(-1, 0, 0), footprint.x1),
      new Plane(new Vector3(0, 0, 1), -footprint.z0),
      new Plane(new Vector3(0, 0, -1), footprint.z1),
    ];
    // Faint remainder: clipIntersection clips only where every plane clips (= inside the box).
    const clipInside = [
      new Plane(new Vector3(-1, 0, 0), footprint.x0),
      new Plane(new Vector3(1, 0, 0), -footprint.x1),
      new Plane(new Vector3(0, 0, -1), footprint.z0),
      new Plane(new Vector3(0, 0, 1), -footprint.z1),
    ];
    if (Number.isFinite(footprint.y0)) {
      keepInside.push(new Plane(new Vector3(0, 1, 0), -footprint.y0!));
      clipInside.push(new Plane(new Vector3(0, -1, 0), footprint.y0!));
    }
    if (Number.isFinite(footprint.y1)) {
      keepInside.push(new Plane(new Vector3(0, -1, 0), footprint.y1!));
      clipInside.push(new Plane(new Vector3(0, 1, 0), -footprint.y1!));
    }
    ghostClipped = new MeshBasicMaterial({ ...ghostBase, clippingPlanes: clipInside, clipIntersection: true });
    const meshes: Mesh[] = [];
    root.traverseVisible((object) => { if (renderableMesh(object)) meshes.push(object); });
    const box = new Box3(), size = new Vector3();
    let inside = 0, outside = 0, split = 0, hidden = 0;
    const keptBySource = new Map<Material, Material>();
    for (const mesh of meshes) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
      const overlap = footprintOverlap(box, footprint);
      const large = Math.max(...box.getSize(size).toArray()) >= D_FOCUS_SPLIT_MIN_SIZE;
      const mode = overlap >= 0.98 ? 'inside'
        : overlap <= 0.02 ? 'outside'
          : large ? 'split'
            : insideCenter(box, footprint) ? 'inside' : 'outside';
      if (mode === 'inside') { inside += 1; continue; }
      const snapshot: Snapshot = {
        material: mesh.material,
        visible: mesh.visible,
        raycast: mesh.raycast,
        ownRaycast: Object.prototype.hasOwnProperty.call(mesh, 'raycast'),
        suppressEdges: mesh.userData.viewerSuppressEdgeOverlay,
        hadSuppressEdges: Object.prototype.hasOwnProperty.call(mesh.userData, 'viewerSuppressEdgeOverlay'),
        ghostChild: null,
        temporary: [],
      };
      snapshots.set(mesh, snapshot);
      mesh.userData.viewerSuppressEdgeOverlay = true;
      if (mode === 'outside' && Math.max(...box.getSize(size).toArray()) < D_FOCUS_HIDE_MAX_SIZE) {
        mesh.visible = false;
        hidden += 1;
        continue;
      }
      if (mode === 'outside') {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => ghostForSource(m, null)) : ghostForSource(mesh.material, null);
        mesh.raycast = noRaycast;
        outside += 1;
        continue;
      }
      // Crossing the box: the D part keeps its look (one clipped clone per
      // source material, shared between meshes), the rest is the faint material.
      const keep = (m: Material) => {
        let c = keptBySource.get(m);
        if (!c) {
          c = m.clone();
          c.clippingPlanes = [...(m.clippingPlanes ?? []), ...keepInside];
          c.clipIntersection = false;
          keptBySource.set(m, c);
          snapshot.temporary.push(c);
        }
        return c;
      };
      const originalMaterial = mesh.material;
      mesh.material = Array.isArray(originalMaterial) ? originalMaterial.map(keep) : keep(originalMaterial);
      const child = new Mesh(mesh.geometry, Array.isArray(originalMaterial)
        ? originalMaterial.map((m) => ghostForSource(m, clipInside)) : ghostForSource(originalMaterial, clipInside));
      child.name = `${mesh.name}__D_FOCUS_GHOST`;
      child.userData = { viewerSuppressEdgeOverlay: true, dFocusGhost: true };
      child.raycast = noRaycast;
      child.renderOrder = mesh.renderOrder;
      mesh.add(child);
      snapshot.ghostChild = child;
      split += 1;
    }
    return { inside, outside, split, hidden };
  };

  return { apply, restore, get active() { return snapshots.size > 0; } };
};
