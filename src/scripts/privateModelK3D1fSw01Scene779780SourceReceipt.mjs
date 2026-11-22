/**
 * SOURCE_ONLY receipt for the independent K3 1F SW01 donor.
 * Do not confuse its scene779/780 with the separate 2F SW03 scene779/780:
 * authenticated GLB SHA and scene lineage must match.
 *
 * Callers must calculate the digest from the entire original GLB byte stream.
 * glTF extras, URLs and file names cannot authenticate source bytes.
 * This module does not register a viewer model or authorize publication.
 */
export const K3_D1F_SW01_SOURCE = Object.freeze({
  zipDriveId: '12YV4wyvZLwxaYLT9mc_bqSjun6GDRIqv',
  zipSha256: '92a668adb0a7e21aa398a4e75e168e86a10f1746931894270cdafd922b87187c',
  glbSha256: '1dacc21ec78e9de4a746e362ed06d5495e22ecf6df26113a5fb4244f844661ab',
  glbBytes: 63874436,
  parentZipDriveId: '1QREA5stxJShXNupCf0gsEaag2lo0zQPM',
  parentGlbSha256: '9a33adeed011d7605cb84cf7897a0fa64206ce9f7405d44542b7bf8a3f984ec8',
  sceneCount: 781, nodeCount: 13519, meshCount: 5177,
  materialCount: 815, accessorCount: 11283, bufferViewCount: 11289,
  defaultScene: 292,
  oldRoot: 13237, newRoot: 13516, leaves: Object.freeze([13517, 13518]),
  leafMeshes: Object.freeze([5175, 5176]),
  hostNode: 13495, hostMesh: 5165, hostTriangle: 19,
  retainedMarkerRoots: Object.freeze({
    'D1F-SW-02': 13238,
    'D1F-SW-03': 13239,
    'D2F-SW-01': 13242,
    'D2F-SW-02': 13243,
    'D2F-SW-04': 13245,
  }),
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 779, parentScene: 769, role: 'D1F_SW01_BOTH_NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 780, parentScene: 770, role: 'D1F_SW01_BOTH_SERVICE', plexi: false }),
  }),
});
const SHA64 = /^[a-f0-9]{64}$/;
const same = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((x, i) => x === b[i]);
const unique = a => Array.isArray(a) && a.length === new Set(a).size;

/** Exact SHA-bound opt-in source gate. Never makes a production assertion. */
export function isK3D1fSw01Scene779780Source(json, authenticatedSha, sceneIndex, role, floor) {
  const s = K3_D1F_SW01_SOURCE;
  const v = Object.values(s.views).find(view => view.sceneIndex === sceneIndex);
  if (!v || role !== v.role || floor !== 'D1F' ||
      typeof authenticatedSha !== 'string' || !SHA64.test(authenticatedSha) ||
      authenticatedSha !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount || json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount || json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false) return false;

  const child = json.scenes[sceneIndex];
  const parent = json.scenes[v.parentScene];
  const roots = child?.nodes, before = parent?.nodes, extras = child?.extras;
  if (typeof child?.name !== 'string' ||
      !child.name.endsWith('__scene' + sceneIndex) ||
      !child.name.includes('_K3_D1F_SW01_') ||
      !child.name.includes('_BOTH_') ||
      !child.name.includes('WORK_TEST_HOST_HOLD') ||
      (v.plexi ? !child.name.includes('_NORMAL_') : !child.name.includes('_SERVICE_')) ||
      !unique(roots) || !unique(before) ||
      roots.length !== before.length ||
      !before.includes(s.oldRoot) || before.includes(s.newRoot) ||
      roots.includes(s.oldRoot) || !roots.includes(s.newRoot) ||
      (roots.includes(11625) !== v.plexi) ||
      !same(roots, before.map(n => n === s.oldRoot ? s.newRoot : n)) ||
      extras?.stage !== 'WORK_TEST_HOST_HOLD' ||
      extras?.sourceGLBSHA256 !== s.parentGlbSha256 ||
      extras?.sourceRootOFF !== s.oldRoot ||
      extras?.newRootON !== s.newRoot ||
      extras?.sourceLinksNewSHABound !== false ||
      extras?.viewerPublished !== false ||
      extras?.current !== false || extras?.asBuilt !== false) return false;

  const newNode = json.nodes[s.newRoot], x = newNode?.extras;
  if (!newNode?.name?.includes('D1F_SW01') ||
      !same(newNode?.children, s.leaves) ||
      json.nodes[s.leaves[0]]?.mesh !== s.leafMeshes[0] ||
      json.nodes[s.leaves[1]]?.mesh !== s.leafMeshes[1] ||
      x?.stableID !== 'D1F-SW-01' || x?.floor !== 'D1F' ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.previousSourceRoot !== s.oldRoot ||
      !same(x?.previousSourceLeaves, [13199, 13200]) ||
      x?.activeWallNode !== s.hostNode || x?.activeWallMesh !== s.hostMesh ||
      x?.activeWallTriangle !== s.hostTriangle ||
      x?.activeWallPlaneX_M !== 3.788 ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh ||
      x?.hostHold !== true || x?.workTest !== true ||
      x?.physicalWallInstallationNotVerified !== true ||
      x?.sourceLinksOutputSHABound !== false ||
      x?.productionWebGLVerified !== false ||
      x?.humanReview !== false || x?.current !== false || x?.asBuilt !== false) return false;

  for (const [stableID, node] of Object.entries(s.retainedMarkerRoots)) {
    if (!roots.includes(node) || json.nodes[node]?.extras?.stableID !== stableID ||
        json.nodes[node]?.extras?.current !== false ||
        json.nodes[node]?.extras?.asBuilt !== false) return false;
  }
  // This independent BOTH donor is not the merged 2F Exxact chain.
  if ([13507, 13510, 13513].some(n => roots.includes(n))) return false;
  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  if (!unique(normal) || !unique(service) ||
      !normal.includes(11625) || service.includes(11625) ||
      !same(normal.filter(n => n !== 11625), service)) return false;
  return true;
}

export function k3D1fSw01Scene779780SourceReceipt(json, sha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3D1fSw01Scene779780Source(json, sha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false, viewerRegistered: false, publishAllowed: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
    current: false, asBuilt: false, physicalHostVerified: false,
    installedProductVerified: false,
  });
}
