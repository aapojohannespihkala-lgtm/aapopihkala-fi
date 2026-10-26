/**
 * T04 SOURCE_ONLY: recover renderable glTF primitive children from their one
 * source-scoped SHARED_CD node. GLTFLoader represents a multi-primitive mesh
 * as a Group; the glTF node's extras belong to that Group, not its children.
 *
 * This helper does NOT install clipping, change visibility, propagate
 * ylisViewScope to children, or grant MainViewScope's T04 visibility permit.
 * The caller must hash the actual loaded ZIP/GLB bytes independently and
 * verify the transform and clipping of every returned child before showing
 * the shared boundary. String equality here is NOT a file-hash calculation.
 */
const sha64 = v => typeof v === 'string' && /^[0-9a-f]{64}$/i.test(v);
const fail = reason => ({ ok: false, reason, sharedMeshes: null, source: null });
const same = (a, b) => typeof a === 'string' && a.length > 0 && a === b;

export function resolveT04PrimitiveSourceBinding({
  root, sourceGroup, loadedZipSha256, expectedZipSha256,
  expectedObjectKey, expectedNodeIndex, expectedMeshIndex,
  expectedPrimitiveCount = 2,
} = {}) {
  if (!sha64(loadedZipSha256) || !sha64(expectedZipSha256) ||
      loadedZipSha256.toLowerCase() !== expectedZipSha256.toLowerCase())
    return fail('SOURCE_BYTES_NOT_ATTESTED');
  if (!same(expectedObjectKey, expectedObjectKey?.trim()) ||
      !Number.isInteger(expectedNodeIndex) || expectedNodeIndex < 0 ||
      !Number.isInteger(expectedMeshIndex) || expectedMeshIndex < 0 ||
      expectedPrimitiveCount !== 2)
    return fail('SOURCE_BINDING_PARAMETERS_INVALID');
  if (!root || !sourceGroup || root === sourceGroup ||
      sourceGroup.isGroup !== true || sourceGroup.isMesh === true)
    return fail('SOURCE_GROUP_NOT_VERIFIED');

  // Check object identity, not a name or world coordinate. A cloned or
  // unrelated group outside the selected loaded glTF scene is not permitted.
  const visited = new Set();
  let ancestor = sourceGroup;
  while (ancestor && ancestor !== root && !visited.has(ancestor)) {
    visited.add(ancestor);
    ancestor = ancestor.parent;
  }
  if (ancestor !== root) return fail('SOURCE_GROUP_OUTSIDE_LOADED_ROOT');

  const scope = sourceGroup.userData?.ylisViewScope;
  if (!scope || scope.objectKey !== expectedObjectKey ||
      scope.sourceNodeIndex !== expectedNodeIndex ||
      scope.sourceMeshIndex !== expectedMeshIndex ||
      scope.apartmentScope !== 'SHARED_CD' ||
      scope.storeyScope !== 'BOTH' ||
      scope.role !== 'SHARED_BOUNDARY' ||
      scope.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST')
    return fail('SOURCE_GROUP_SCOPE_NOT_VERIFIED');

  const children = sourceGroup.children;
  if (!Array.isArray(children) || children.length !== expectedPrimitiveCount ||
      new Set(children).size !== expectedPrimitiveCount ||
      children.some(mesh => !mesh?.isMesh || mesh.parent !== sourceGroup ||
        !mesh.geometry || !mesh.material ||
        !Array.isArray(mesh.children) || mesh.children.length !== 0 ||
        Object.prototype.hasOwnProperty.call(mesh.userData ?? {}, 'ylisViewScope')))
    return fail('PRIMITIVE_CHILDREN_NOT_VERIFIED');

  // One semantic objectKey represents BOTH renderable primitives. Spreading
  // the same scope onto each Mesh would create duplicate-key rejection in
  // MainViewScope; instead return exactly one group-level source claim.
  const source = Object.freeze({
    objectKey: scope.objectKey,
    apartmentScope: scope.apartmentScope,
    storeyScope: scope.storeyScope,
    role: scope.role,
    phaseScope: scope.phaseScope,
    zipSha256: loadedZipSha256.toLowerCase(),
  });
  return Object.freeze({
    ok: true, reason: 'T04_SOURCE_PRIMITIVES_IDENTIFIED_ONLY',
    source, sourceObjectKey: scope.objectKey,
    sharedMeshes: Object.freeze([...children]),
    primitiveCount: children.length,
    canApplyToViewer: false, canPublish: false,
  });
}
