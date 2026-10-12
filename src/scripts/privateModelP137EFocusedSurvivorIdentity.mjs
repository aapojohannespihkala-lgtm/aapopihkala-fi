import { createHash } from 'node:crypto';

// Authenticates source bytes only, never production pixels, autoload or human review.
export const P137E_FOCUSED_SOURCE = Object.freeze({
  driveFileId: '17FqR79AIjJhScxdydK0HG1RX0P53e0wf',
  bytes: 3258268,
  sha256: '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d',
  sceneName: 'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP',
});
const TARGETS = Object.freeze([
  { node: 1091, room: 'LOBBY', side: 'NORTH', faceYM: 5.112, xy: [3.73, 5.12] },
  { node: 1096, room: 'BEDROOM', side: 'SOUTH', faceYM: 5.032, xy: [3.69, 5.03] },
  { node: 1101, room: 'BATHROOM', side: 'SOUTH', faceYM: 5.032, xy: [4.88, 5.03] },
]);
const fail = (reason) => { throw new Error('P137E focused source: ' + reason); };
const noPromotion = (x) => x?.Canonical === false && x?.asBuilt === false &&
  x?.publishToCURRENT === false && x?.HUMAN_REVIEW === 'NOT_RUN';

// Structure-only inspection must NOT set authenticated=true on synthetic data.
export function inspectP137EFocusedSurvivorSource(gltf) {
  const scene = gltf?.scenes?.[67], nodes = gltf?.nodes;
  if (gltf?.scene !== 67 || !Array.isArray(gltf?.scenes) ||
      gltf.scenes.length !== 68 || !Array.isArray(nodes) || nodes.length < 1108 ||
      !Array.isArray(gltf?.meshes) || scene?.name !== P137E_FOCUSED_SOURCE.sceneName ||
      !Array.isArray(scene?.nodes) || scene.nodes.length !== 1 || scene.nodes[0] !== 1107 ||
      scene.extras?.sourceSceneIndex !== 66 ||
      scene.extras?.sourceOriginalWallMeshIndex !== 406 ||
      scene.extras?.targetLogicalDeviceCount !== 3 ||
      scene.extras?.workTestOnly !== true ||
      scene.extras?.noCurrentPromotion !== true ||
      scene.extras?.focusedSourceOriginalWallAndThreeThemos !== true ||
      scene.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      scene.extras?.viewerAutoloadProof !== 'NOT_RUN' ||
      scene.extras?.productionRenderProof !== 'NOT_RUN') {
    fail('focused scene67 identity or review gate mismatch');
  }
  const root = nodes[1107], r = root?.extras;
  if (root?.name !== 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP' ||
      !Array.isArray(root.children) || root.children.length !== 4 ||
      [1106, 1091, 1096, 1101].some((node, i) => root.children[i] !== node) ||
      r?.Pass !== 'P137E' || r?.sourceSceneIndex !== 66 ||
      r?.sourceWallSceneIndex !== 5 || r?.sourceOriginalWallNode !== 798 ||
      r?.sourceOriginalWallMesh !== 406 || r?.WORK_TEST_ONLY !== true ||
      r?.oldMarkersSuppressedInNewSceneOnly !== true ||
      r?.current !== false || !noPromotion(r)) {
    fail('source wall and three-device root mismatch');
  }
  const wall = nodes[1106], source = nodes[798];
  if (source?.mesh !== 406 || wall?.mesh !== 406 ||
      wall?.name !== 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE' ||
      wall?.extras?.sourceNodeIndex !== 798 || wall.extras?.sourceMeshIndex !== 406 ||
      wall.extras?.originalSourceGeometryUnmodified !== true ||
      wall.extras?.presentationOnly !== true) {
    fail('original P123C source wall node798 mesh406 mismatch');
  }
  const targetIdentities = [];
  for (const { node, room, side, faceYM, xy } of TARGETS) {
    const object = nodes[node], d = object?.extras, logicalDeviceId = `D_THEMO_CURRENT_${room}_01`;
    if (object?.name !== `P137E_THEMO_${room}_WALL_CONTACT_WORK_TEST` ||
        d?.logicalDeviceId !== logicalDeviceId || d?.roomAssignment !== room ||
        d?.representationKind !== 'photoReferencedThermostatWallMountWorkTest' ||
        d?.sourceFaceNodeIndex !== 798 || d?.sourceFaceMeshIndex !== 406 ||
        d?.sourceFaceSide !== side || d?.sourceFaceYM !== faceYM ||
        d?.frontFacesTowardYSign !== (side === 'NORTH' ? 1 : -1) ||
        d?.backplateContactYM !== faceYM || d?.wallBackplateAirGapM !== 0 ||
        !Array.isArray(d?.sourceUserPinXYM) || d.sourceUserPinXYM.length !== 2 ||
        d.sourceUserPinXYM.some((n, i) => n !== xy[i]) ||
        d?.fitOriginalPresentationSourceWallPlanePassed !== true ||
        d?.fitExactPhysicalWallHostVerified !== false ||
        d?.physicalDeviceDimensionsVerified !== false ||
        d?.currentGeometryClaim !== false || d?.exactXYClaim !== false ||
        d?.exactZClaim !== false || d?.wallHostPhysicalAsBuiltClaim !== false ||
        d?.presentationOnly !== true || !noPromotion(d)) {
      fail('invalid Themo identity, face, or physical claim: ' + logicalDeviceId);
    }
    targetIdentities.push(Object.freeze({ sourceNode: node, logicalDeviceId, side }));
  }
  return Object.freeze({
    sourceScene: 67, originalWallNode: 798, originalWallMesh: 406,
    focusedRootCount: 1, targetIdentities,
    originalGlbDigestAuthenticated: false, productionAutoloadVerified: false,
    productionRenderVerified: false, humanReview: 'NOT_RUN',
  });
}

export function authenticateP137EFocusedSurvivorBytes(rawBytes) {
  if (!(rawBytes instanceof Uint8Array) ||
      rawBytes.byteLength !== P137E_FOCUSED_SOURCE.bytes) fail('raw byte length mismatch');
  const bytes = Buffer.from(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== P137E_FOCUSED_SOURCE.sha256) fail('SHA-256 original digest mismatch');
  if (bytes.toString('ascii', 0, 4) !== 'glTF' ||
      bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) fail('GLB header');
  const jsonLength = bytes.readUInt32LE(12);
  if (jsonLength < 4 || jsonLength % 4 !== 0 ||
      bytes.readUInt32LE(16) !== 0x4e4f534a ||
      20 + jsonLength > bytes.length) fail('GLB JSON chunk');
  let gltf;
  try { gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)); }
  catch { fail('GLB JSON parse'); }
  return Object.freeze({
    ...inspectP137EFocusedSurvivorSource(gltf),
    driveFileId: P137E_FOCUSED_SOURCE.driveFileId,
    sha256, byteLength: bytes.length,
    originalGlbDigestAuthenticated: true,
  });
}
