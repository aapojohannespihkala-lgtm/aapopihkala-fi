// Source-exact, fail-closed host evidence for C80 optional WORK_TEST scenes.
// A rendered pick is never, by itself, permission to move a technical device.
// In particular the 1F storage presentation proxy is NOT a 2F exhaust host.
export const C80_SUCC428_SOURCE_SHA256 = 'b55c10cf1a5a557c6ace8932254ae7c614abb65e515998bd2c2d41f3037240de';
export const C80_SUCC428_FLOOR_SCENES = Object.freeze({
  419: '1F', 420: '2F', 421: 'BOTH',
  422: '2F', 423: 'BOTH', 424: '2F', 425: 'BOTH',
  426: '1F', 427: 'BOTH',
});
const HASH = /^[a-f0-9]{64}$/;
const FLOORS = new Set(['1F', '2F']);
const fail = (reason) => Object.freeze({ status: 'HOST_HOLD', reason, canMoveDevice: false });

function reachablePaths(gltf, sceneIndex, target) {
  const roots = gltf?.scenes?.[sceneIndex]?.nodes;
  const nodes = gltf?.nodes;
  if (!Array.isArray(roots) || !Array.isArray(nodes)) return [];
  const paths = [];
  const visit = (nodeId, path, visited) => {
    if (!Number.isInteger(nodeId) || nodeId < 0 || nodeId >= nodes.length || visited.has(nodeId)) return;
    const np = [...path, nodeId];
    if (nodeId === target) paths.push(np);
    const next = new Set(visited);
    next.add(nodeId);
    for (const child of nodes[nodeId]?.children ?? []) visit(child, np, next);
  };
  for (const root of roots) visit(root, [], new Set());
  return paths;
}

/**
 * Pure source gate. Evidence must originate in independently verified
 * building/owner material, NOT inferred from the same glTF pick or screenshot.
 * The caller must still perform authorized viewer, publisher and human-review
 * gates separately. No node relocation or GLB mutation occurs here.
 */
export function validateC80StoreyHostEvidence({
  gltf, glbSha256, expectedGlbSha256 = C80_SUCC428_SOURCE_SHA256,
  sceneIndex, pickedNodeIndex, pickedMeshIndex, pickedNodePath,
  requestedFloor, ownerIdentifiedFloor, ownerIdentifiedRoom,
  targetDeviceFloor, targetDeviceRoom, evidence,
  sceneFloors = C80_SUCC428_FLOOR_SCENES,
} = {}) {
  if (!HASH.test(glbSha256 ?? '') || !HASH.test(expectedGlbSha256 ?? '') || glbSha256 !== expectedGlbSha256)
    return fail('SOURCE_SHA_MISMATCH');
  if (!gltf || !Number.isInteger(sceneIndex) || !Object.hasOwn(sceneFloors, sceneIndex))
    return fail('SCENE_UNVERIFIED');
  const floor = sceneFloors[sceneIndex];
  if (floor === 'BOTH') return fail('BOTH_SCENE_CANNOT_PROVE_STOREY');
  if (!FLOORS.has(floor) || floor !== requestedFloor || floor !== ownerIdentifiedFloor || floor !== targetDeviceFloor)
    return fail('STOREY_MISMATCH');
  const room = (s) => typeof s === 'string' && s.trim().length > 0 ? s.trim().toUpperCase() : null;
  if (!room(ownerIdentifiedRoom) || room(ownerIdentifiedRoom) !== room(targetDeviceRoom))
    return fail('ROOM_MISMATCH');
  if (!Number.isInteger(pickedNodeIndex) || !Number.isInteger(pickedMeshIndex) ||
      !Array.isArray(pickedNodePath) || pickedNodePath.length === 0 ||
      !pickedNodePath.every(Number.isInteger))
    return fail('PICK_IDENTITY_MISSING');
  const node = gltf.nodes?.[pickedNodeIndex];
  if (!node || node.mesh !== pickedMeshIndex) return fail('NODE_MESH_MISMATCH');
  const paths = reachablePaths(gltf, sceneIndex, pickedNodeIndex);
  if (paths.length !== 1 || JSON.stringify(paths[0]) !== JSON.stringify(pickedNodePath))
    return fail('SCENE_PARENT_PATH_UNVERIFIED');
  const info = node.extras ?? {};
  const s = info.ylisViewScope ?? {};
  if (info.presentationOnly === true || s.presentationOnly === true ||
      info.sourceMetadata?.floorHostValidated === false ||
      info.physicalHost === 'HOST_HOLD' || s.physicalHost === 'HOST_HOLD' ||
      info.hostValidated !== true || info.physicalStructureApproved === false)
    return fail('DISPLAY_GEOMETRY_NOT_PHYSICAL_HOST');
  if (s.storeyScope !== floor || (s.apartmentScope && s.apartmentScope === 'UNKNOWN'))
    return fail('NODE_STOREY_SCOPE_UNVERIFIED');
  if (!evidence || evidence.origin !== 'INDEPENDENT_SOURCE_VERIFIED' ||
      evidence.physicalHostValidated !== true || evidence.ownerConfirmed !== true ||
      evidence.glbSha256 !== glbSha256 || evidence.sceneIndex !== sceneIndex ||
      evidence.nodeIndex !== pickedNodeIndex || evidence.meshIndex !== pickedMeshIndex ||
      JSON.stringify(evidence.nodePath) !== JSON.stringify(pickedNodePath) ||
      evidence.floor !== floor || room(evidence.room) !== room(ownerIdentifiedRoom) ||
      typeof evidence.sourceDocId !== 'string' || !evidence.sourceDocId.trim())
    return fail('INDEPENDENT_HOST_EVIDENCE_MISSING');
  // Identity verification never authorizes model mutation or publication.
  return Object.freeze({
    status: 'SOURCE_HOST_IDENTITY_VERIFIED', reason: 'EXACT_SOURCE_AND_INDEPENDENT_HOST_EVIDENCE',
    canMoveDevice: false, floor, room: room(ownerIdentifiedRoom),
    sceneIndex, nodeIndex: pickedNodeIndex, meshIndex: pickedMeshIndex,
    nodePath: Object.freeze([...pickedNodePath]), glbSha256,
    current: false, asBuilt: false, humanReview: 'NOT_RUN',
  });
}
