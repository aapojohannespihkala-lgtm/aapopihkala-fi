// Exact-source receipt for the 2026-11-15 C80 536 K16 doorframe rectification.
// Only a source gate: no sourceLinks, production mounting or as-built approval.
export const C80_K16_ZIP_DRIVE_ID = '1V6LLRyMd5oOFdfduTzlve6SqTQ0a-1-a';
export const C80_K16_ZIP_SHA256 = '78520eb62eae5c5905f127bf7508778f96a6d4deb49b80f4f9bb4d387d979bfd';
export const C80_K16_GLB_SHA256 = '5e2f0c561ac3db0cc1c6f171a14e50dc311ccccb89a28e69478bdef3fee805c3';
export const C80_K16_GLB_BYTES = 55701484;
export const C80_K16_PARENT_GLB_SHA256 = '1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_K16_PARENT_ZIP_DRIVE_ID = '1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s';
export const C80_K16_SOURCE_ONLY = true;
export const C80_K16_SOURCE_LINKS_BOUND = false;
export const C80_K16_PUBLISH_ALLOWED = false;

const originalFnv = ['ef21913f', 'b6394bd0', '6847aefb', '9d3081c3', 'c0e4d46d', '2b0e6572'];
const targetFnv = ['d3214bba', 'b6394bd0', '8c0e83bc', '13d729cc', 'bf8b9dd2', '11164159'];
const floors = ['1F', '2F', 'BOTH', 'BOTH', 'BOTH', 'BOTH'];
const roots = [294, 190, 477, 477, 477, 477];
export const C80_K16_SCENES = Object.freeze(Object.fromEntries(floors.map((floor, n) => [530 + n,
  Object.freeze({ parentScene: 524 + n, floor, rootCount: roots[n], rootFnv: targetFnv[n] })
])));

export function c80K16RootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let hash = 2166136261;
  for (const id of ids) {
    if (!Number.isInteger(id) || id < 0) return null;
    hash = Math.imul(hash ^ id, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const expectedName = (index, parent) =>
  `C80_536_K16_DOOR_HEAD_WESTJAMB_RECTIFIED_FROM_530_SCENE_${parent}_WORK_TEST_HOST_HOLD`;
const expectedOriginalName = (parent) =>
  `C80_530_V27_NO_TRENCH_FROM_SCENE_${parent - 6}_WORK_TEST_HOST_HOLD`;
const isSafeScene = (s, floor, sourceScene) => Boolean(s &&
  s.extras?.stage === 'WORK_TEST_HOST_HOLD' &&
  s.extras?.floor === floor && s.extras?.sourceSceneIndex === sourceScene &&
  s.extras?.sourceLinksBindingVerified === false &&
  s.extras?.physicalHiddenRouteVerified === false &&
  s.extras?.productionWebGLVerified === false &&
  s.extras?.humanReviewApproved === false && s.extras?.asBuilt === false);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) < 0.000002;

function correctedNode(gltf, id, originalId, originalMesh, correctedMesh, posAccessor) {
  const node = gltf.nodes[id];
  const x = node?.extras;
  const mesh = gltf.meshes?.[correctedMesh];
  const primitive = mesh?.primitives?.[0];
  const accessor = gltf.accessors?.[posAccessor];
  return node?.mesh === correctedMesh &&
    node.name === (id === 12255 ? 'K16_CORRECTED_V48_D1F_700_WEST_JAMB_X2620_2820' :
      'K16_CORRECTED_V48_D1F_700_OPENING_HEAD_ABOVE_Y2090') &&
    x?.stage === 'WORK_TEST_NONCURRENT' && x?.modelStage === 'WORK_TEST' &&
    x?.ownerCorrection === 'K16_20261115_DOOR_FACE_SPIKE_REPAIR' &&
    x?.originalNodeIndex === originalId && x?.originalMeshIndex === originalMesh &&
    x?.sourceFaceTemplateNodeIndex === 9383 && x?.repairedDamagedVertexCount === 12 &&
    eq(x?.badVertexCoordinate, [2.762, 2.762, -2.762]) &&
    x?.physicalHostVerified === false && x?.sourceLinksBound === false &&
    x?.current === false && x?.asBuilt === false &&
    x?.geometryRectificationMethod === 'intact face-order donor 9383 plus unaffected 12 original vertices' &&
    gltf.nodes[originalId]?.mesh === originalMesh && gltf.nodes[9383]?.mesh === 3333 &&
    mesh?.primitives?.length === 1 && primitive?.mode === 4 &&
    primitive?.attributes?.POSITION === posAccessor &&
    primitive?.attributes?.NORMAL === 6325 && primitive?.indices === 6326 &&
    primitive?.material === 333 &&
    accessor?.componentType === 5126 && accessor?.type === 'VEC3' &&
    accessor?.count === 24 && accessor?.bufferView === (id === 12255 ? 10412 : 10413) &&
    Array.isArray(accessor?.min) && Array.isArray(accessor?.max) &&
    close(accessor.min[2], -5.0945) && close(accessor.max[2], -5.0295) &&
    close(accessor.max[2] - accessor.min[2], 0.065);
}

// Pass only with SHA256 independently authenticated from complete GLB bytes.
// The JSON check protects against stale or mutated scene objects after authentication.
export function isC80K16DoorframeSourceScene(gltf, authenticatedGlbSha256, index, floor = null) {
  const info = C80_K16_SCENES[index];
  if (!info || authenticatedGlbSha256 !== C80_K16_GLB_SHA256 ||
      (floor !== null && info.floor !== floor) ||
      gltf?.scene !== 292 || gltf.scenes?.length !== 536 ||
      gltf.nodes?.length !== 12257 || gltf.meshes?.length !== 4623 ||
      gltf.accessors?.length !== 10410 || gltf.bufferViews?.length !== 10414 ||
      gltf.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      gltf.asset?.extras?.Canonical !== false ||
      gltf.asset?.extras?.current !== false ||
      gltf.asset?.extras?.asBuilt !== false ||
      gltf.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      !correctedNode(gltf, 12255, 9382, 3332, 4621, 10408) ||
      !correctedNode(gltf, 12256, 9384, 3334, 4622, 10409)) return false;

  // Validate all six parent/target scenes, including unchanged second floor.
  for (let n = 0; n < 6; n++) {
    const parentIndex = 524 + n, targetIndex = 530 + n;
    const p = gltf.scenes[parentIndex], t = gltf.scenes[targetIndex];
    if (!p || !t || p.name !== expectedOriginalName(parentIndex) ||
        t.name !== expectedName(targetIndex, parentIndex) ||
        !isSafeScene(p, floors[n], parentIndex - 6) ||
        !isSafeScene(t, floors[n], parentIndex) ||
        p.nodes?.length !== roots[n] || t.nodes?.length !== roots[n] ||
        new Set(p.nodes).size !== roots[n] || new Set(t.nodes).size !== roots[n] ||
        p.nodes.some(id => !Number.isInteger(id) || id < 0 || id >= 12255) ||
        c80K16RootFnv32(p.nodes) !== originalFnv[n] ||
        c80K16RootFnv32(t.nodes) !== targetFnv[n]) return false;
    const expected = n === 1 ? p.nodes : p.nodes.map(id =>
      id === 9382 ? 12255 : id === 9384 ? 12256 : id);
    if (!eq(t.nodes, expected) ||
        p.nodes.includes(12255) || p.nodes.includes(12256) ||
        (n !== 1 && (!p.nodes.includes(9382) || !p.nodes.includes(9384))) ||
        t.nodes.includes(9382) || t.nodes.includes(9384) ||
        (n !== 1 && (!t.nodes.includes(12255) || !t.nodes.includes(12256)))) return false;
  }
  return true;
}

export function resolveC80K16DoorframeSceneIndex(authenticatedSha, parentScene, floor) {
  if (authenticatedSha !== C80_K16_GLB_SHA256 || !Number.isInteger(parentScene)) return null;
  const index = parentScene + 6;
  return C80_K16_SCENES[index]?.parentScene === parentScene &&
    C80_K16_SCENES[index].floor === floor ? index : null;
}

export function c80K16DoorframeSourceReceipt(gltf, sha, index) {
  return Object.freeze({ exactSource: isC80K16DoorframeSourceScene(gltf, sha, index),
    sourceLinksBound: false, publishAllowed: false, productionWebGLVerified: false,
    humanReview: 'NOT_RUN', current: false, asBuilt: false, physicalHostVerified: false });
}
