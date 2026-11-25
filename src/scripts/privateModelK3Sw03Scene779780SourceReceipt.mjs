/**
 * Authenticated SOURCE_ONLY receipt for K3 D2F-SW03 on the corrected SW02 base.
 *
 * The caller MUST hash all original GLB bytes and pass that digest. Neither
 * glTF extras, filenames, ZIP names nor a server URL prove authenticity.
 * This gate never registers a viewer scene or authorizes publishing.
 */
export const K3_SW03_779780_SOURCE = Object.freeze({
  zipDriveId: '1BC0fogL2GqWikJizWgyXLU58yhLBptjz',
  zipSha256: '1340a23f235bd52fbf6ae230cab4ab29a80f866fb970452eb03d79fe4ad5d35e',
  glbSha256: 'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3e',
  glbBytes: 63870196,
  parentZipDriveId: '1QREA5stxJShXNupCf0gsEaag2lo0zQPM',
  parentGlbSha256: '9a33adeed011d7605cb84cf7897a0fa64206ce9f7405d44542b7bf8a3f984ec8',
  defaultScene: 292,
  sceneCount: 781,
  nodeCount: 13519,
  meshCount: 5177,
  materialCount: 815,
  accessorCount: 11283,
  bufferViewCount: 11289,
  oldRoot: 13244,
  newRoot: 13516,
  hostNode: 12437,
  hostMesh: 4679,
  activeRoots: Object.freeze({
    'D2F-SW-04': 13507,
    'D2F-SW-01': 13510,
    'D2F-SW-02': 13513,
    'D2F-SW-03': 13516,
  }),
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 779, parentScene: 777, role: 'D2F_SW03_NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 780, parentScene: 778, role: 'D2F_SW03_SERVICE', plexi: false }),
  }),
});
const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((value, index) => value === b[index]);
const unique = items => Array.isArray(items) && new Set(items).size === items.length;
const SHA64 = /^[0-9a-f]{64}$/;

/**
 * Validate exact SHA-bound donor scene and parent parity, never production.
 * Indices are glTF JSON scenes, not filename __sceneN guesses.
 */
export function isK3Sw03Scene779780Source(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const s = K3_SW03_779780_SOURCE;
  const v = Object.values(s.views).find(view => view.sceneIndex === sceneIndex);
  if (!v || role !== v.role || floor !== 'D2F' ||
      typeof authenticatedGlbSha256 !== 'string' ||
      !SHA64.test(authenticatedGlbSha256) ||
      authenticatedGlbSha256 !== s.glbSha256 ||
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

  const child = json.scenes[sceneIndex];
  const parent = json.scenes[v.parentScene];
  const roots = child?.nodes;
  const previousRoots = parent?.nodes;
  const e = child?.extras;
  if (typeof child?.name !== 'string' ||
      !child.name.endsWith('__scene' + sceneIndex) ||
      !child.name.includes('_SW03_') ||
      !child.name.includes('WORK_TEST_HOST_HOLD') ||
      (v.plexi ? !child.name.includes('NORMAL_PLEX_ON') : !child.name.includes('SERVICE_PLEX_OFF')) ||
      !unique(roots) || !unique(previousRoots) ||
      roots.length !== previousRoots.length ||
      !previousRoots.includes(s.oldRoot) || previousRoots.includes(s.newRoot) ||
      roots.includes(s.oldRoot) || !roots.includes(s.newRoot) ||
      roots.includes(11625) !== v.plexi ||
      !exact(roots, previousRoots.map(id => id === s.oldRoot ? s.newRoot : id)) ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.sourceScene !== v.parentScene ||
      e?.sourceGLBsha256 !== s.parentGlbSha256 ||
      e?.sourceRootOFF !== s.oldRoot || e?.newRootON !== s.newRoot ||
      e?.sourceLinksNewShaBound !== false ||
      e?.sourceLinksNewSHA !== 'NOT_BOUND' ||
      e?.productSkuInstalledVerified !== false ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.productionWebGL !== 'NOT_RUN' || e?.humanReview !== 'NOT_RUN') return false;

  const rootsSet = new Set(roots);
  const parentSet = new Set(previousRoots);
  for (const [identity, root] of Object.entries(s.activeRoots)) {
    if (!rootsSet.has(root) ||
        (root !== s.newRoot && !parentSet.has(root)) ||
        json.nodes[root]?.extras?.stableID !== identity ||
        json.nodes[root]?.extras?.floor !== 'D2F' ||
        json.nodes[root]?.extras?.current !== false ||
        json.nodes[root]?.extras?.asBuilt !== false) return false;
  }
  const node = json.nodes[s.newRoot];
  const x = node?.extras;
  if (!node?.name?.includes('SW03') ||
      !exact(node?.children, [13517, 13518]) ||
      json.nodes[13517]?.mesh !== 5175 ||
      json.nodes[13518]?.mesh !== 5176 ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.sourcePreviousRoot !== s.oldRoot ||
      x?.activeHostNodeID !== s.hostNode ||
      x?.activeHostMeshID !== s.hostMesh ||
      !exact(x?.activeHostTriangles, [6, 7]) ||
      x?.activeHostPlaneZ_m !== -7.225 ||
      x?.hostHold !== true ||
      x?.productSkuVerified !== false ||
      x?.sourceLinksBoundToOutputSHA !== false ||
      x?.productionWebGLVerified !== false ||
      x?.humanReview !== false ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh) return false;

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  if (!unique(normal) || !unique(service) ||
      !normal.includes(11625) || service.includes(11625) ||
      !exact(normal.filter(id => id !== 11625), service)) return false;

  return true;
}

export function k3Sw03Scene779780SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3Sw03Scene779780Source(json, authenticatedSha, sceneIndex, role, floor),
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
