/**
 * K3 C80 R31 1F SW01..04 + 2F SW01..05, source-only receipt.
 * Input authenticatedGLBSHA256 MUST be calculated from the COMPLETE original GLB.
 * Matching metadata, a filename, or a caller-provided unverified string is not proof.
 * This module does not register scenes, bind sourceLinks, publish, or approve as-built.
 */
export const K3_COMBINED_789790_SOURCE = Object.freeze({
  zipDriveId: '1SyK3Tj8Jjb8LC_G4D8Zjhr6uJOmlSVA6',
  zipSha256: '6fadf4dfb3f483cd16f111fd0fa51480984a1f264ece26e1e26bd3b234cb286e',
  glbSha256: '9966103080fb273e3bb20076618b6a3afd111e9ba42f3ed20109f2b6528223b9',
  glbBytes: 63933744,
  parentZipDriveId: '12hlWp4-qZgBbqkwAS3sXBKQvRhRrRvVh',
  parentGlbSha256: 'e16bb80f8bee2eeeeecdf1d3de1e5c2f392b224ea77fb164e208ea37dc4d3a8f',
  donorZipDriveId: '1SVBo0x-96dTfzZWIb3Oaf02wca-jlsW7',
  donorGlbSha256: '96832f21fb548edb50b76049c3afe31d55238ffab8b851a11c646c48bd098309',
  defaultScene: 292, sceneCount: 791, nodeCount: 13534, meshCount: 5187,
  legacySw05Root: 13246, newSw05Root: 13531,
  newChildren: Object.freeze([13532, 13533]), newMeshes: Object.freeze([5185, 5186]),
  retainedRoots: Object.freeze({
    'D1F-SW-01': 13522, 'D1F-SW-02': 13519,
    'D1F-SW-03': 13525, 'D1F-SW-04': 13528,
    'D2F-SW-01': 13510, 'D2F-SW-02': 13513,
    'D2F-SW-03': 13516, 'D2F-SW-04': 13507,
  }),
  views: Object.freeze({
    NORMAL: Object.freeze({ index: 789, parent: 787, plexi: true }),
    SERVICE: Object.freeze({ index: 790, parent: 788, plexi: false }),
  }),
});
const SHA64 = /^[0-9a-f]{64}$/;
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const equalSet = (a,b) => unique(a) && unique(b) && a.length === b.length &&
  a.every(v => b.includes(v));
const same = (a,b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((v,i) => v === b[i]);

/**
 * Checks a SHA-authenticated exact source graph, not whether it is safe to publish.
 * The immutable SHA must be computed from raw, complete GLB bytes by the caller.
 */
export function isK3CombinedScene789790Source(json, authenticatedGLBSHA256, sceneIndex, role, floor) {
  const s = K3_COMBINED_789790_SOURCE;
  const v = s.views[role];
  if (!v || sceneIndex !== v.index || floor !== 'BOTH' ||
      typeof authenticatedGLBSHA256 !== 'string' || !SHA64.test(authenticatedGLBSHA256) ||
      authenticatedGLBSHA256 !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const view = json.scenes[v.index], parent = json.scenes[v.parent];
  const roots = view?.nodes, parentRoots = parent?.nodes;
  if (!unique(roots) || !unique(parentRoots) ||
      !parentRoots.includes(s.legacySw05Root) ||
      parentRoots.includes(s.newSw05Root) ||
      !equalSet(roots, [...parentRoots.filter(x => x !== s.legacySw05Root), s.newSw05Root]) ||
      roots.includes(s.legacySw05Root) ||
      roots.includes(11625) !== v.plexi ||
      typeof view?.name !== 'string' ||
      !view.name.endsWith('__scene' + v.index) ||
      !view.name.includes(role) ||
      !view.name.includes('WORK_TEST_HOST_HOLD')) return false;
  const e = view.extras;
  if (e?.current === true || e?.asBuilt === true ||
      e?.sourceLinksBoundToOutputSHA === true ||
      e?.productionWebGLVerified === true ||
      e?.humanReview === true ||
      (e?.sourceParentScene !== undefined && e.sourceParentScene !== v.parent) ||
      (e?.role !== undefined && e.role !== role) ||
      (e?.stage !== undefined && e.stage !== 'WORK_TEST_HOST_HOLD')) return false;

  const node = json.nodes[s.newSw05Root];
  if (!same(node?.children, s.newChildren) ||
      node?.extras?.stableID !== 'D2F-SW-05' ||
      node?.extras?.floor !== 'D2F' ||
      node?.extras?.current === true || node?.extras?.asBuilt === true ||
      json.nodes[s.newChildren[0]]?.mesh !== s.newMeshes[0] ||
      json.nodes[s.newChildren[1]]?.mesh !== s.newMeshes[1]) return false;
  const seen = [s.newSw05Root];
  for (const [stableID, index] of Object.entries(s.retainedRoots)) {
    if (!roots.includes(index) || json.nodes[index]?.extras?.stableID !== stableID ||
        json.nodes[index]?.extras?.current === true ||
        json.nodes[index]?.extras?.asBuilt === true) return false;
    seen.push(index);
  }
  if (new Set(seen.map(i => json.nodes[i]?.extras?.stableID)).size !== 9) return false;
  const normal = json.scenes[s.views.NORMAL.index]?.nodes;
  const service = json.scenes[s.views.SERVICE.index]?.nodes;
  return unique(normal) && unique(service) &&
    normal.includes(11625) && !service.includes(11625) &&
    equalSet(normal.filter(x => x !== 11625), service);
}

/** Never authorizes publishing, production WebGL or physical installation claims. */
export function k3CombinedScene789790SourceReceipt(json, authenticatedSHA, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3CombinedScene789790Source(json, authenticatedSHA, sceneIndex, role, floor),
    sourceOnly: true, stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false, viewerRegistered: false, publishAllowed: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
    current: false, asBuilt: false, installedProductVerified: false,
    physicalHostVerified: false, electricalCircuitVerified: false,
  });
}
