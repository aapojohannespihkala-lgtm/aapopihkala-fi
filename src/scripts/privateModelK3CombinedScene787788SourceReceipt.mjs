/**
 * Fail-closed K3 1F SW01..04 + 2F SW01..04 combined source receipt.
 * Only a SHA-256 computed from full authenticated original GLB bytes qualifies.
 * SOURCE_ONLY: this deliberately does not register, publish or mark CURRENT.
 */
export const K3_COMBINED_787788_SOURCE = Object.freeze({
  zipDriveID: '12hlWp4-qZgBbqkwAS3sXBKQvRhRrRvVh',
  zipSHA256: 'c1fac317e60d637e8cb23192943448aeea61fc5db9d7b9b5cb39d22bb5742928',
  glbSHA256: 'e16bb80f8bee2eeeeecdf1d3de1e5c2f392b224ea77fb164e208ea37dc4d3a8f',
  glbBytes: 63919056,
  baseOriginalDriveID: '1FROUBE_wbS30vfLSzNz4Dm-WB4FdTykY',
  baseOriginalGlbSHA256: '4393ec07c62d0eabf434d76609f61e072454be0a89d4586d9f4a78af0a3e18a2',
  donorOriginalDriveID: '1oi_64PQ5q38H-Kx_zSpxu3Z6sMMklJPq',
  donorOriginalGlbSHA256: '0479e0227604e51ec6835a6e04549cb96ea7f826fcaa98a3d30e2b409f52907e',
  sceneCount: 789, nodeCount: 13531, meshCount: 5185,
  materialCount: 815, accessorCount: 11299, bufferViewCount: 11305,
  defaultScene: 292, newRoot: 13528, newChildren: Object.freeze([13529, 13530]),
  newMeshes: Object.freeze([5183, 5184]),
  existingSwitchRoots: Object.freeze({
    'D1F-SW-01': 13522, 'D1F-SW-02': 13519, 'D1F-SW-03': 13525,
    'D2F-SW-01': 13510, 'D2F-SW-02': 13513, 'D2F-SW-03': 13516, 'D2F-SW-04': 13507,
  }),
  views: Object.freeze({
    NORMAL: Object.freeze({ index: 787, parent: 785, donorScene: 783, plexi: true }),
    SERVICE: Object.freeze({ index: 788, parent: 786, donorScene: 784, plexi: false }),
  }),
});
const hex64 = /^[a-f0-9]{64}$/;
const exact = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((v, i) => v === b[i]);
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const setEquals = (a, b) => unique(a) && unique(b) && a.length === b.length &&
  a.every(v => b.includes(v));

/** Returns true only for the authenticated, exact 787/788 source graph. */
export function isK3CombinedScene787788Source(json, authenticatedGLBSHA256, sceneIndex, role, floor) {
  const s = K3_COMBINED_787788_SOURCE, view = s.views[role];
  if (!view || sceneIndex !== view.index || floor !== 'BOTH' ||
      typeof authenticatedGLBSHA256 !== 'string' || !hex64.test(authenticatedGLBSHA256) ||
      authenticatedGLBSHA256 !== s.glbSHA256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount || json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount || json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount || json?.bufferViews?.length !== s.bufferViewCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false || json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;
  const sc = json.scenes[view.index], par = json.scenes[view.parent], e = sc?.extras;
  const roots = sc?.nodes, oldRoots = par?.nodes;
  if (sc?.name !== 'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_' +
      role + '_WORK_TEST_HOST_HOLD__scene' + view.index ||
      !unique(roots) || !unique(oldRoots) ||
      !setEquals(roots, [...oldRoots, s.newRoot]) ||
      oldRoots.includes(s.newRoot) || roots.includes(11625) !== view.plexi ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' || e?.role !== role ||
      e?.sourceParentScene !== view.parent || e?.normalServiceRole !== role ||
      e?.sourceOriginalGLBSHA256 !== s.baseOriginalGlbSHA256 ||
      e?.donorOriginalGLBSHA256 !== s.donorOriginalGlbSHA256 ||
      e?.donorSourceScene !== view.donorScene || e?.newD1FSW04Root !== s.newRoot ||
      !exact(e?.newD1FSW04Children, s.newChildren) ||
      e?.current !== false || e?.asBuilt !== false || e?.humanReview !== false ||
      e?.productionWebGLVerified !== false || e?.sourceLinksBoundToOutputSHA !== false) return false;
  for (const [id, index] of Object.entries(s.existingSwitchRoots)) {
    const node = json.nodes[index], ex = node?.extras;
    if (!roots.includes(index) || ex?.stableID !== id || ex?.floor !== id.slice(0, 3) ||
        ex?.current !== false || ex?.asBuilt !== false) return false;
  }
  if (!roots.includes(13246)) return false; // 2F SW05 remains legacy until separately integrated
  const sw04 = json.nodes[s.newRoot], x = sw04?.extras;
  if (!sw04?.name?.includes('K3_D1F_SW04') ||
      !exact(sw04.children, s.newChildren) ||
      json.nodes[s.newChildren[0]]?.mesh !== s.newMeshes[0] ||
      json.nodes[s.newChildren[1]]?.mesh !== s.newMeshes[1] ||
      x?.stableID !== 'D1F-SW-04' || x?.floor !== 'D1F' ||
      x?.stage !== 'WORK_TEST_HOST_HOLD' ||
      x?.cofitBaseOriginalGLBSHA256 !== s.baseOriginalGlbSHA256 ||
      x?.cofitDonorOriginalGLBSHA256 !== s.donorOriginalGlbSHA256 ||
      x?.sourceOwnerMarkerNode !== 11779 ||
      x?.activeHostNodeID !== 13495 || x?.activeHostMeshID !== 5165 ||
      x?.activeHostPrimitive !== 1 || x?.activeHostTriangle !== 34 ||
      x?.activeHostPlaneZ_m !== -5.032 ||
      x?.proxyFrameOuter_m !== 0.087 || x?.proxyVisibleRocker_m !== 0.069 ||
      json.nodes[13495]?.mesh !== 5165 ||
      x?.hostHold !== true || x?.sourceLinksBoundToOutputSHA !== false ||
      x?.installedSKUNotVerified !== true || x?.physicalHostNotVerified !== true ||
      x?.electricalCircuitNotVerified !== true ||
      x?.current !== false || x?.asBuilt !== false ||
      x?.productionWebGLVerified !== false || x?.humanReview !== false) return false;
  const n = json.scenes[s.views.NORMAL.index]?.nodes;
  const service = json.scenes[s.views.SERVICE.index]?.nodes;
  if (!unique(n) || !unique(service) || !n.includes(11625) || service.includes(11625) ||
      !setEquals(n.filter(v => v !== 11625), service)) return false;
  return true;
}

/** This receipt is never a production binding or publishing authorization. */
export function k3CombinedScene787788SourceReceipt(json, authenticatedSHA, scene, role, floor) {
  return Object.freeze({
    exactSource: isK3CombinedScene787788Source(json, authenticatedSHA, scene, role, floor),
    sourceOnly: true, stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false, viewerRegistered: false, publishAllowed: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
    current: false, asBuilt: false, installedProductVerified: false,
    physicalHostVerified: false, electricalCircuitVerified: false,
  });
}
