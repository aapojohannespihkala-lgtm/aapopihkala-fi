/**
 * Authenticated, nonpublishing K3 D1F-SW02 source receipt.
 * Caller MUST compute SHA-256 over the complete original GLB bytes.
 * The returned receipt never authorizes publication, CURRENT or as-built.
 */
export const K3_D1F_SW02_781782_SOURCE = Object.freeze({
  zipDriveId: '1L7igjoQELiJVgqhiKsg9LgJbvzj-Y3ag',
  zipSha256: 'c9b73992ee912f843aaaed8337453870b98abea1a93a66f315b5417f90ca0e2e',
  glbSha256: 'fba0e0aa4e8e59a9736aa27fa476ceb67446f07a6019f6ecde8653bd2d224326',
  glbBytes: 63881140,
  parentZipDriveId: '1BC0fogL2GqWikJizWgyXLU58yhLBptjz',
  parentGlbSha256: 'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3e',
  sceneCount: 783,
  nodeCount: 13522,
  meshCount: 5179,
  materialCount: 815,
  accessorCount: 11287,
  bufferViewCount: 11293,
  defaultScene: 292,
  sourceRoot: 13238,
  newRoot: 13519,
  hostNode: 13495,
  hostMesh: 5165,
  legacyD1fRoots: Object.freeze([13237, 13239]),
  replacedRoots: Object.freeze({
    13238: 13519, // D1F SW02
    13245: 13507, // D2F SW04
    13242: 13510, // D2F SW01
    13243: 13513, // D2F SW02 corrected
    13244: 13516, // D2F SW03 corrected cofit
  }),
  activeD2f: Object.freeze({
    'D2F-SW-04': 13507,
    'D2F-SW-01': 13510,
    'D2F-SW-02': 13513,
    'D2F-SW-03': 13516,
  }),
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 781, parentScene: 769, source2fScene: 779, role: 'NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 782, parentScene: 770, source2fScene: 780, role: 'SERVICE', plexi: false }),
  }),
});
const HEX64 = /^[a-f0-9]{64}$/;
const exact = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((value, i) => value === b[i]);
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const sameSet = (a, b) => unique(a) && unique(b) &&
  a.length === b.length && a.every(x => b.includes(x));

/**
 * SOURCE_ONLY provenance, never a viewer scene registration or publish gate.
 * Parent root order is not inherited; root SET is exact after COW replacements.
 */
export function isK3D1fSw02Scene781782Source(json, authenticatedGlbSha, sceneIndex, role, floor) {
  const s = K3_D1F_SW02_781782_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  if (!view || role !== view.role || floor !== 'D1F' ||
      typeof authenticatedGlbSha !== 'string' || !HEX64.test(authenticatedGlbSha) ||
      authenticatedGlbSha !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const scene = json.scenes[sceneIndex];
  const parent = json.scenes[view.parentScene];
  const e = scene?.extras;
  const roots = scene?.nodes, originals = parent?.nodes;
  if (typeof scene?.name !== 'string' ||
      !scene.name.endsWith('__scene' + sceneIndex) ||
      !scene.name.includes('K3_D1F_SW02_D2F_SW01_02_03_04') ||
      !scene.name.includes(view.plexi ? '_NORMAL_' : '_SERVICE_') ||
      !scene.name.includes('WORK_TEST_HOST_HOLD') ||
      !unique(roots) || !unique(originals) ||
      !sameSet(roots, originals.map(id => s.replacedRoots[id] ?? id)) ||
      roots.includes(11625) !== view.plexi ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.humanReview !== false || e?.productionWebGLVerified !== false ||
      e?.sourceCombinedOriginalGLBSHA256 !== s.parentGlbSha256 ||
      e?.sourceParentScene !== view.parentScene ||
      e?.sourceK3D2FScene !== view.source2fScene ||
      e?.role !== view.role ||
      e?.newD1FSW02Root !== s.newRoot ||
      e?.oldD1FSW02RootDisabled !== s.sourceRoot ||
      !exact(e?.inheritedD2FRoots, Object.values(s.activeD2f)) ||
      e?.retainsOldD1FSW01AndSW03 !== true ||
      e?.sourceLinksBoundToOutputSHA !== false) return false;

  for (const [oldRoot, newRoot] of Object.entries(s.replacedRoots)) {
    if (!originals.includes(Number(oldRoot)) || roots.includes(Number(oldRoot)) ||
        !roots.includes(newRoot)) return false;
  }
  for (const legacy of s.legacyD1fRoots) {
    if (!originals.includes(legacy) || !roots.includes(legacy)) return false;
  }
  for (const [identity, root] of Object.entries(s.activeD2f)) {
    const x = json.nodes[root]?.extras;
    if (!roots.includes(root) || x?.stableID !== identity || x?.floor !== 'D2F' ||
        x?.current !== false || x?.asBuilt !== false || x?.hostHold !== true) return false;
  }
  const node = json.nodes[s.newRoot];
  const x = node?.extras;
  if (!node?.name?.includes('D1F_SW02') ||
      !exact(node?.children, [13520, 13521]) ||
      json.nodes[13520]?.mesh !== 5177 ||
      json.nodes[13521]?.mesh !== 5178 ||
      x?.stableID !== 'D1F-SW-02' || x?.floor !== 'D1F' ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.sourceRoot !== s.sourceRoot ||
      !exact(x?.sourceLeafNodes, [13201, 13202]) ||
      x?.activeHostNodeID !== s.hostNode ||
      x?.activeHostMeshID !== s.hostMesh ||
      x?.activeHostPrimitive !== 1 ||
      !exact(x?.activeHostTriangles, [2, 3]) ||
      x?.activeHostPlaneZ_m !== -3.194 ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh ||
      x?.hostHold !== true ||
      x?.sourceLinksBoundToOutputSHA !== false ||
      x?.installedSKUNotVerified !== true ||
      x?.physicalHostNotVerified !== true ||
      x?.electricalCircuitNotVerified !== true ||
      x?.current !== false || x?.asBuilt !== false ||
      x?.productionWebGLVerified !== false || x?.humanReview !== false) return false;

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  if (!unique(normal) || !unique(service) ||
      !normal.includes(11625) || service.includes(11625) ||
      !sameSet(normal.filter(id => id !== 11625), service)) return false;
  return true;
}

export function k3D1fSw02Scene781782SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3D1fSw02Scene781782Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false,
    publishAllowed: false,
    viewerRegistered: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    physicalHostVerified: false,
    installedProductVerified: false,
  });
}
