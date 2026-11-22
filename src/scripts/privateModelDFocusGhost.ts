import { Box3, Mesh, Plane, Vector3, type Material, type Object3D } from 'three';

/**
 * D-focus presentation (owner 22.11.2026): the whole D apartment at full
 * strength, everything outside its footprint as a very faint reference.
 * Presentation only: the GLB, its nodes, source materials and metadata are
 * not changed; every swap is restored by `restore()`.
 *
 * The footprint is horizontal (world X/Z, viewer Y up). Meshes inside it stay
 * untouched, meshes outside get a faint copy of their material, and meshes
 * crossing it (roof, terrain) are split with local clipping planes: the D part
 * keeps its material, the rest is drawn faint by a child mesh.
 */
export type DFootprint = { x0: number; x1: number; z0: number; z1: number };

/** R22/R31 D-scoped objects (ylisViewScope D, active) span this world box. */
export const D_FOOTPRINT_FALLBACK: DFootprint = Object.freeze({ x0: -0.4, x1: 6.75, z0: -11.1, z1: 6.2 });

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

/** Fraction of a mesh's horizontal bbox that lies inside the footprint. */
export const footprintOverlap = (box: Box3, f: DFootprint) => {
  const ox = Math.max(0, Math.min(box.max.x, f.x1) - Math.max(box.min.x, f.x0));
  const oz = Math.max(0, Math.min(box.max.z, f.z1) - Math.max(box.min.z, f.z0));
  const ax = Math.max(box.max.x - box.min.x, 1e-3), az = Math.max(box.max.z - box.min.z, 1e-3);
  return Math.min(1, (Math.min(ox, ax) / ax) * (Math.min(oz, az) / az));
};

type Snapshot = {
  material: Material | Material[];
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

  const ghostMaterial = (source: Material, clip: Plane[] | null) => {
    const material = source.clone() as Material & { color?: { lerp?: (c: any, t: number) => void } };
    material.transparent = true;
    material.opacity = level * (source.transparent ? Math.max(0.3, source.opacity ?? 1) : 1);
    material.depthWrite = false;
    if (clip) {
      material.clippingPlanes = [...(source.clippingPlanes ?? []), ...clip];
      material.clipIntersection = true;
    }
    material.needsUpdate = true;
    return material;
  };

  const restore = () => {
    for (const [mesh, s] of snapshots) {
      mesh.material = s.material;
      if (s.ownRaycast) mesh.raycast = s.raycast;
      else delete (mesh as any).raycast;
      if (s.hadSuppressEdges) mesh.userData.viewerSuppressEdgeOverlay = s.suppressEdges;
      else delete mesh.userData.viewerSuppressEdgeOverlay;
      if (s.ghostChild) mesh.remove(s.ghostChild);
      for (const material of s.temporary) material.dispose();
    }
    snapshots.clear();
  };

  /** Apply to the visible meshes under `root`. Returns counts for QA. */
  const apply = (root: Object3D, footprint: DFootprint) => {
    restore();
    root.updateMatrixWorld(true);
    // Keep-inside planes (fragment kept where all distances >= 0).
    const keepInside = [
      new Plane(new Vector3(1, 0, 0), -footprint.x0),
      new Plane(new Vector3(-1, 0, 0), footprint.x1),
      new Plane(new Vector3(0, 0, 1), -footprint.z0),
      new Plane(new Vector3(0, 0, -1), footprint.z1),
    ];
    // Clip-inside planes for the faint remainder (clipIntersection: clipped only inside the box).
    const clipInside = [
      new Plane(new Vector3(-1, 0, 0), footprint.x0),
      new Plane(new Vector3(1, 0, 0), -footprint.x1),
      new Plane(new Vector3(0, 0, -1), footprint.z0),
      new Plane(new Vector3(0, 0, 1), -footprint.z1),
    ];
    const meshes: Mesh[] = [];
    root.traverseVisible((object) => { if (renderableMesh(object)) meshes.push(object); });
    const box = new Box3();
    let inside = 0, outside = 0, split = 0;
    for (const mesh of meshes) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
      const overlap = footprintOverlap(box, footprint);
      if (overlap >= 0.999) { inside += 1; continue; }
      const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const snapshot: Snapshot = {
        material: mesh.material,
        raycast: mesh.raycast,
        ownRaycast: Object.prototype.hasOwnProperty.call(mesh, 'raycast'),
        suppressEdges: mesh.userData.viewerSuppressEdgeOverlay,
        hadSuppressEdges: Object.prototype.hasOwnProperty.call(mesh.userData, 'viewerSuppressEdgeOverlay'),
        ghostChild: null,
        temporary: [],
      };
      snapshots.set(mesh, snapshot);
      mesh.userData.viewerSuppressEdgeOverlay = true;
      if (overlap <= 0) {
        const ghosts = sources.map((m) => ghostMaterial(m, null));
        snapshot.temporary.push(...ghosts);
        mesh.material = Array.isArray(mesh.material) ? ghosts : ghosts[0];
        mesh.raycast = noRaycast;
        outside += 1;
        continue;
      }
      // Crossing the footprint: D part with its own look, the rest faint.
      const kept = sources.map((m) => {
        const c = m.clone();
        c.clippingPlanes = [...(m.clippingPlanes ?? []), ...keepInside];
        c.clipIntersection = false;
        return c;
      });
      const ghosts = sources.map((m) => ghostMaterial(m, clipInside));
      snapshot.temporary.push(...kept, ...ghosts);
      mesh.material = Array.isArray(mesh.material) ? kept : kept[0];
      const child = new Mesh(mesh.geometry, Array.isArray(mesh.material) ? ghosts : ghosts[0]);
      child.name = `${mesh.name}__D_FOCUS_GHOST`;
      child.userData = { viewerSuppressEdgeOverlay: true, dFocusGhost: true };
      child.raycast = noRaycast;
      child.renderOrder = mesh.renderOrder;
      mesh.add(child);
      snapshot.ghostChild = child;
      split += 1;
    }
    return { inside, outside, split };
  };

  return { apply, restore, get active() { return snapshots.size > 0; } };
};
