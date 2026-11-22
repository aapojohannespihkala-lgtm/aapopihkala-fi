/**
 * K3 1F SW01+SW02 cofit source-only receipt; NEVER a publication gate.
 * The caller must compute SHA256 from all authenticated original GLB bytes.
 * GLB scene indices are not inferred from filename __sceneN suffixes.
 */
export const K3_D1F_SW01SW02_783784_SOURCE = Object.freeze({
  zipDriveId: '18QaimiYtMQyZBaZAbr1oksVS8IzZrh6l',
  zipSha256: 'da13efedf2aa18a6c122c43a012bcb64096cd1edfd5d5ac14a87a1fc20b0d2d9',
  glbSha256: 'cd07a2d559e6e5c25cf5c0eef77835ba7ccebc062b1cc9c810b8bc279f7428d6',
  glbBytes: 63893428,
  baseZipDriveId: '1L7igjoQELiJVgqhiKsg9LgJbvzj-Y3ag',
  baseGlbSha256: 'fba0e0aa4e8e59a9736aa27fa476ceb67446f07a6019f6ecde8653bd2d224326',
  donorZipDriveId: '12YV4wyvZLwxaYLT9mc_bqSjun6GDRIqv',
  donorGlbSha256: '1dacc21ec78e9de4a746e362ed06d5495e22ecf6df26113a5fb4244f844661ab',
  original2fGlbSha256: 'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3e',
  defaultScene: 292,
  sceneCount: 785,
  nodeCount: 13525,
  meshCount: 5181,
  materialCount: 815,
  accessorCount: 11291,
  bufferViewCount: 11297,
  sourceRoot: 13237,
  newRoot: 13522,
  sw02Root: 13519,
  oldSw03Root: 13239,
  activeD2f: Object.freeze({
    'D2F-SW-04': 13507,
    'D2F-SW-01': 13510,
    'D2F-SW-02': 13513,
    'D2F-SW-03': 13516,
  }),
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 783, sourceBaseScene: 781, sourceDonorScene: 779, role: 'NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 784, sourceBaseScene: 782, sourceDonorScene: 780, role: 'SERVICE', plexi: false }),
  }),
});
const SHA64 = /^[0-9a-f]{64}$/;
const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((x, i) => x === b[i]);
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const sameSet = (a, b) =>
  unique(a) && unique(b) && a.length === b.length && a.every(x => b.includes(x));

/**
 * True only for a caller-authenticated exact WORK_TEST source scene.
 * No sourceLinks rebind, viewer registration, SKU or as-built inference.
 */
export function isK3D1fSw01Sw02Scene783784Source(json, authenticatedSha, sceneIndex, role, floor) {
  const s = K3_D1F_SW01SW02_783784_SOURCE;
  const v = Object.values(s.views).find(view => view.sceneIndex === sceneIndex);
  if (!v || role !== v.role || floor !== 'D1F' ||
      typeof authenticatedSha !== 'string' || !SHA64.test(authenticatedSha) ||
      authenticatedSha !== s.glbSha256 ||
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
  const parent = json.scenes[v.sourceBaseScene];
  const roots = child?.nodes, previous = parent?.nodes;
  const e = child?.extras;
  if (typeof child?.name !== 'string' ||
      !child.name.endsWith('__scene' + sceneIndex) ||
      !child.name.includes('K3_D1F_SW01_SW02_PLUS_D2F_SWITCHES') ||
      !child.name.includes('_' + v.role + '_WORK_TEST_HOST_HOLD') ||
      !sameSet(roots, previous?.map(n => n === s.sourceRoot ? s.newRoot : n)) ||
      !previous.includes(s.sourceRoot) || previous.includes(s.newRoot) ||
      roots.includes(s.sourceRoot) || !roots.includes(s.newRoot) ||
      roots.includes(11625) !== v.plexi ||
      !roots.includes(s.sw02Root) || !previous.includes(s.sw02Root) ||
      !roots.includes(s.oldSw03Root) || !previous.includes(s.oldSw03Root) ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.sourceBaseScene !== v.sourceBaseScene ||
      e?.sourceDonorScene !== v.sourceDonorScene ||
      e?.sourceBaseGLBSHA256 !== s.baseGlbSha256 ||
      e?.sourceDonorGLBSHA256 !== s.donorGlbSha256 ||
      !exact(e?.sourceDonorGLBRootRemap, [13516, s.newRoot]) ||
      e?.visualRootD1FSW01 !== s.newRoot ||
      e?.visualRootD1FSW02 !== s.sw02Root ||
      e?.originalD1FSW01RootDisabled !== s.sourceRoot ||
      e?.normalServiceRole !== v.role ||
      e?.sourceCombinedOriginalGLBSHA256 !== s.original2fGlbSha256 ||
      e?.sourceLinksBoundToOutputSHA !== false ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.humanReview !== false || e?.productionWebGLVerified !== false) return false;

  const root = json.nodes[s.newRoot], x = root?.extras;
  if (typeof root?.name !== 'string' || !root.name.includes('D1F_SW01') ||
      !exact(root?.children, [13523, 13524]) ||
      json.nodes[13523]?.mesh !== 5179 ||
      json.nodes[13524]?.mesh !== 5180 ||
      x?.stableID !== 'D1F-SW-01' || x?.floor !== 'D1F' ||
      x?.previousSourceRoot !== s.sourceRoot ||
      x?.activeWallNode !== 13495 ||
      x?.activeWallMesh !== 5165 ||
      x?.activeWallPrimitive !== 0 ||
      x?.activeWallTriangle !== 19 ||
      x?.hostHold !== true ||
      x?.cofitSourceDonorZipDriveID !== s.donorZipDriveId ||
      x?.cofitSourceDonorGLBSHA256 !== s.donorGlbSha256 ||
      x?.cofitSourceBaseZipDriveID !== s.baseZipDriveId ||
      x?.cofitSourceBaseGLBSHA256 !== s.baseGlbSha256 ||
      !exact(x?.cofitRemapOldRootToNewRoot, [13516, s.newRoot]) ||
      x?.sourceLinksOutputSHABound !== false ||
      x?.cofitSourceLinksOutputSHA !== 'NOT_BOUND' ||
      x?.current !== false || x?.asBuilt !== false ||
      x?.productionWebGLVerified !== false || x?.humanReview !== false) return false;

  const sw02 = json.nodes[s.sw02Root]?.extras;
  if (sw02?.stableID !== 'D1F-SW-02' || sw02?.floor !== 'D1F' ||
      sw02?.hostHold !== true || sw02?.current !== false || sw02?.asBuilt !== false) return false;
  for (const [identity, index] of Object.entries(s.activeD2f)) {
    const candidate = json.nodes[index]?.extras;
    if (!roots.includes(index) || !previous.includes(index) ||
        candidate?.stableID !== identity || candidate?.floor !== 'D2F' ||
        candidate?.hostHold !== true || candidate?.current !== false ||
        candidate?.asBuilt !== false) return false;
  }

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  return unique(normal) && unique(service) &&
    normal.includes(11625) && !service.includes(11625) &&
    sameSet(normal.filter(id => id !== 11625), service);
}

export function k3D1fSw01Sw02Scene783784SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3D1fSw01Sw02Scene783784Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false,
    viewerRegistered: false,
    publishAllowed: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    installedProductVerified: false,
    physicalHostVerified: false,
    electricalCircuitVerified: false,
  });
}
