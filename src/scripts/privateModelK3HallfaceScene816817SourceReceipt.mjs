/**
 * Fail-closed SOURCE_ONLY receipt for RELEASED K3 D2F SW04+SW05 hall-face
 * C80 R31 BOTH append-only donor (__scene816 normal / __scene817 service).
 *
 * No viewer registration, sourceLinks rebind, as-built or publication approval.
 * authenticatedGlbSha256 MUST be independently calculated from all original
 * authorized GLB bytes; JSON extras, filenames and URLs are not authenticators.
 */
export const K3_HALLFACE_816817_SOURCE = Object.freeze({
  zipDriveId: '10BsEyxwkSFmoWiznlpQ5ipdhLxspwA-h',
  zipSha256: '8736812ed751b0241c2e88ba737eec443a21d82f223ba8c7b914148af6d9950c',
  zipBytes: 13462999,
  glbSha256: '1c085106091244683e118c2a4462ee780f91b4d3aa7799a7b5b43f93f58f2691',
  glbBytes: 64400468,
  parentZipDriveId: '13ukjwhsAIHvTke8IqA5CJCtm8eM-1aQg',
  parentGlbSha256: '678fe880f74fb1e804869ab509469caa197648466d4d121da501206884c5ba1b',
  defaultScene: 292,
  sceneCount: 818,
  nodeCount: 13789,
  meshCount: 5212,
  rootCount: 501,
  oldSw04Root: 13507,
  oldSw05Root: 13531,
  photoSw04Root: 13787,
  photoSw05Root: 13788,
  photoHostNode: 12437,
  photoHostMesh: 4679,
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 816, sourceScene: 808, role: 'BOTH_NORMAL' }),
    service: Object.freeze({ sceneIndex: 817, sourceScene: 809, role: 'BOTH_SERVICE' }),
  }),
});

const SHA64 = /^[0-9a-f]{64}$/;
const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((x, i) => x === b[i]);
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const count = (a, id) => a.filter(x => x === id).length;

/**
 * Source structure only. Parent scenes are historic references, not
 * automatically the newest C80 canonical scenes. Do not rebase by name.
 */
export function isK3Hallface816817Source(json, authenticatedGlbSha256, sceneIndex, role) {
  const s = K3_HALLFACE_816817_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  if (!view || role !== view.role ||
      typeof authenticatedGlbSha256 !== 'string' ||
      !SHA64.test(authenticatedGlbSha256) ||
      authenticatedGlbSha256 !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount) return false;

  const child = json.scenes[sceneIndex];
  const parent = json.scenes[view.sourceScene];
  const roots = child?.nodes;
  const former = parent?.nodes;
  if (typeof child?.name !== 'string' ||
      !child.name.endsWith('__scene' + sceneIndex) ||
      !unique(roots) || !unique(former) ||
      roots.length !== s.rootCount || former.length !== s.rootCount ||
      count(former, s.oldSw04Root) !== 1 ||
      count(former, s.oldSw05Root) !== 1 ||
      former.includes(s.photoSw04Root) || former.includes(s.photoSw05Root) ||
      count(roots, s.photoSw04Root) !== 1 ||
      count(roots, s.photoSw05Root) !== 1 ||
      roots.includes(s.oldSw04Root) || roots.includes(s.oldSw05Root)) return false;

  // Root order and every other 499 roots must remain unchanged.
  const expected = former.map(id => id === s.oldSw04Root ? s.photoSw04Root :
    id === s.oldSw05Root ? s.photoSw05Root : id);
  if (!exact(roots, expected) ||
      !json.nodes[s.photoSw04Root] ||
      !exact(json.nodes[s.photoSw05Root]?.children, [s.oldSw05Root]) ||
      json.nodes[s.photoHostNode]?.mesh !== s.photoHostMesh) return false;

  // Original nodes/meshes are immutable; any other donor SHA needs a new gate.
  return true;
}

export function k3Hallface816817SourceReceipt(json, authenticatedGlbSha256, sceneIndex, role) {
  return Object.freeze({
    exactSource: isK3Hallface816817Source(json, authenticatedGlbSha256, sceneIndex, role),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false,
    viewerRegistered: false,
    publishAllowed: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    physicalHostVerified: false,
  });
}
