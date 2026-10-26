/**
 * T04 SHARED_CD/BOTH material clipping staging adapter.
 *
 * SOURCE_ONLY - no runtime wiring, no physical geometry edits, no display
 * permission granted by this adapter. The main view still has to supply an
 * approved visibility exception for a source-verified clipped wall.
 *
 * Caller responsibilities:
 * - Verify the selected loaded model's ZIP hash out of band, not from labels.
 * - Supply the actual G1_LOCAL_TO_WORLD transform for that model.
 * - Enable renderer.localClippingEnabled once in the viewer configuration.
 * - Maintain original raycast/source identity and enforce fail-closed D scope.
 */
import { deriveSharedCdFloorPlane } from './privateModelSharedBoundaryClip.mjs';

const fail = (reason) => ({ ok: false, reason, sourceVisible: false });
const matchesScope = (mesh, source) => {
  let n = mesh;
  while (n && !Object.prototype.hasOwnProperty.call(n.userData ?? {}, 'ylisViewScope')) n = n.parent;
  const s = n?.userData?.ylisViewScope;
  return !!s && !!source && ['objectKey','apartmentScope','storeyScope','role','phaseScope']
    .every(k => s[k] === source[k]);
};

export function createSharedCdMaterialClip({ mesh, renderer, THREE, derivePlane = deriveSharedCdFloorPlane } = {}) {
  // The original owner may be an array of source materials. Preserve the exact
  // reference and order; never alter the source's clippingPlanes array.
  const original = mesh?.material;
  let staged = null;
  let clones = [];
  let activeFloor = null;
  let activePlane = null;
  let activePlaneSnapshot = null;
  let disposed = false;

  const restore = () => {
    // Never overwrite a newer material installed by another layer or loader.
    const ownsMaterial = staged !== null && mesh?.material === staged;
    if (ownsMaterial) mesh.material = original;
    for (const c of clones) c.dispose();
    clones = [];
    staged = null;
    activeFloor = null;
    activePlane = null;
    activePlaneSnapshot = null;
    return { restored: ownsMaterial || mesh?.material === original };
  };

  const apply = ({ floor, source, expectedZipSha256, expectedObjectKey, g1LocalToWorld, matrixReference } = {}) => {
    if (disposed) return fail('ADAPTER_DISPOSED');
    // Fail closed instead of silently replacing an independently changed mesh
    // material. This should trigger reload or a higher-level HOLD.
    if (staged !== null && mesh.material !== staged) {
      restore();
      return fail('MATERIAL_OWNERSHIP_CHANGED');
    }
    restore();
    if (!mesh?.isMesh || !renderer || !THREE?.Plane || !THREE?.Vector3 ||
        !matchesScope(mesh, source) || !expectedObjectKey ||
        source.objectKey !== expectedObjectKey) return fail('SOURCE_MESH_SCOPE_MISMATCH');

    const result = derivePlane({ floor, source, expectedZipSha256,
      expectedObjectKey, g1LocalToWorld, matrixReference });
    if (!result.ok) return fail(result.reason);

    // WHOLE and BOTH share precisely the original mesh and material. No
    // derived material should survive reset, even on incomplete host data.
    if (!result.plane) return { ok: true, reason: 'SOURCE_ORIGINAL', floor,
      sourceVisible: false, originalMaterial: true };
    if (renderer.localClippingEnabled !== true) return fail('LOCAL_CLIPPING_DISABLED');
    if (!result.plane.normal?.every(Number.isFinite) ||
        result.plane.normal.length !== 3 || !Number.isFinite(result.plane.constant))
      return fail('INVALID_CLIP_PLANE');

    const originals = Array.isArray(original) ? original : [original];
    if (!originals.length || originals.some(m => !m || typeof m.clone !== 'function'))
      return fail('UNCLONEABLE_SOURCE_MATERIAL');
    const plane = new THREE.Plane(new THREE.Vector3(...result.plane.normal), result.plane.constant);
    try {
      for (const m of originals) {
        const clone = m.clone();
        clones.push(clone);
        const previous = Array.isArray(clone.clippingPlanes) ? clone.clippingPlanes : [];
        clone.clippingPlanes = [...previous, plane];
        clone.needsUpdate = true;
      }
      staged = Array.isArray(original) ? clones : clones[0];
      mesh.material = staged;
      activeFloor = floor;
      activePlane = plane;
      activePlaneSnapshot = { normal: [...result.plane.normal], constant: result.plane.constant };
      // sourceVisible deliberately false: the main floor-scope controller has
      // to grant source visibility after verifying that this plane is in place.
      return { ok: true, reason: 'CLIPPED_SOURCE_MATERIAL', floor,
        sourceVisible: false, materialClipped: true, sourceObjectKey: result.sourceObjectKey,
        referenceLocalZ: result.referenceLocalZ };
    } catch (error) {
      restore();
      return fail('CLIP_MATERIAL_INSTALL_FAILED');
    }
  };
  const dispose = () => { restore(); disposed = true; };
  return { apply, restore, dispose,
    get activeFloor() { return activeFloor; },
    get active() {
      return staged !== null && mesh?.material === staged &&
        renderer?.localClippingEnabled === true && !!activePlaneSnapshot &&
        activePlaneSnapshot.normal.every((v, i) => activePlane?.normal?.arr?.[i] === v ||
          (activePlane?.normal && ['x', 'y', 'z'][i] in activePlane.normal && activePlane.normal[['x', 'y', 'z'][i]] === v)) &&
        activePlane?.constant === activePlaneSnapshot.constant &&
        clones.length > 0 && clones.every(c => Array.isArray(c.clippingPlanes) &&
          c.clippingPlanes.includes(activePlane));
    } };
}
