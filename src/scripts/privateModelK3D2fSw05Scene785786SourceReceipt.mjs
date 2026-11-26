/**
 * K3 D2F-SW-05, original stand-alone WORK_TEST donor.
 * SOURCE_ONLY: caller authenticates SHA-256 of the complete original GLB bytes.
 * No viewer registration, product identity, physical as-built or publication.
 */
export const K3_D2F_SW05_785786_SOURCE = Object.freeze({
  zipDriveId: '1SVBo0x-96dTfzZWIb3Oaf02wca-jlsW7',
  zipSha256: '44823efe01062dc2a0c2035bd4f3c2db73d076720079c9f7d7a21ff8cfe848c3',
  glbSha256: '96832f21fb548edb50b76049c3afe31d55238ffab8b851a11c646c48bd098309',
  glbBytes: 63906532,
  parentZipDriveId: '18QaimiYtMQyZBaZAbr1oksVS8IzZrh6l',
  parentGlbSha256: 'cd07a2d559e6e5c25cf5c0eef77835ba7ccebc062b1cc9c810b8bc279f7428d6',
  sceneCount: 787, nodeCount: 13528, meshCount: 5183,
  materialCount: 815, accessorCount: 11295, bufferViewCount: 11301,
  defaultScene: 292, sourceRoot: 13246, newRoot: 13525,
  children: Object.freeze([13526, 13527]),
  meshes: Object.freeze([5181, 5182]),
  hostNode: 12437, hostMesh: 4679,
  activeEarlier: Object.freeze({
    'D1F-SW-01': 13522, 'D1F-SW-02': 13519,
    'D2F-SW-04': 13507, 'D2F-SW-01': 13510,
    'D2F-SW-02': 13513, 'D2F-SW-03': 13516,
  }),
  views: Object.freeze({
    normal: Object.freeze({
      sceneIndex: 785, parentScene: 783, earlierRootScene: 769,
      role: 'NORMAL', plexi: true,
    }),
    service: Object.freeze({
      sceneIndex: 786, parentScene: 784, earlierRootScene: 770,
      role: 'SERVICE', plexi: false,
    }),
  }),
});
const SHA64 = /^[a-f0-9]{64}$/;
const equalArray = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((item, i) => item === b[i]);
const unique = xs => Array.isArray(xs) && new Set(xs).size === xs.length;
const sameSet = (a, b) => unique(a) && unique(b) &&
  a.length === b.length && a.every(item => b.includes(item));

/**
 * Check structural identity only after authenticating complete RAW GLB bytes.
 * A source SHA from metadata, filename or caller-provided claim is not proof.
 */
export function isK3D2fSw05Scene785786Source(json, authenticatedSha, sceneIndex, role, floor) {
  const s = K3_D2F_SW05_785786_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  if (!view || role !== view.role || floor !== 'D2F' ||
      typeof authenticatedSha !== 'string' || !SHA64.test(authenticatedSha) ||
      authenticatedSha !== s.glbSha256 ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount) return false;

  const current = json.scenes[view.sceneIndex];
  const source = json.scenes[view.parentScene];
  const roots = current?.nodes, originals = source?.nodes;
  const e = current?.extras;
  if (typeof current?.name !== 'string' ||
      !current.name.includes('K3_D2F_SW05_WHITE_87MM_') ||
      !current.name.includes(view.plexi ? '_NORMAL_' : '_SERVICE_') ||
      !current.name.endsWith('__scene' + view.sceneIndex) ||
      !current.name.includes('WORK_TEST_HOST_HOLD') ||
      !unique(roots) || !unique(originals) ||
      !originals.includes(s.sourceRoot) || originals.includes(s.newRoot) ||
      !sameSet(roots, originals.map(id => id === s.sourceRoot ? s.newRoot : id)) ||
      !roots.includes(s.newRoot) || roots.includes(s.sourceRoot) ||
      roots.includes(11625) !== view.plexi ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.humanReview !== false || e?.productionWebGLVerified !== false ||
      e?.sourceBaseScene !== view.parentScene ||
      e?.sourceBaseGLBSHA256 !== s.parentGlbSha256 ||
      e?.sourceParentScene !== view.earlierRootScene ||
      e?.sourceLinksBoundToOutputSHA !== false ||
      e?.role !== view.role || e?.normalServiceRole !== view.role ||
      e?.oldD2FSW05RootDisabled !== s.sourceRoot ||
      e?.newD2FSW05Root !== s.newRoot) return false;

  for (const [stableID, id] of Object.entries(s.activeEarlier)) {
    const x = json.nodes[id]?.extras;
    if (!roots.includes(id) || x?.stableID !== stableID ||
        x?.current !== false || x?.asBuilt !== false) return false;
  }
  const root = json.nodes[s.newRoot];
  const x = root?.extras;
  if (!root?.name?.includes('K3_D2F_SW05_WHITE_87x87MM_') ||
      !equalArray(root.children, s.children) ||
      json.nodes[s.children[0]]?.mesh !== s.meshes[0] ||
      json.nodes[s.children[1]]?.mesh !== s.meshes[1] ||
      x?.stableID !== 'D2F-SW-05' || x?.floor !== 'D2F' ||
      x?.stage !== 'WORK_TEST_HOST_HOLD' ||
      x?.current !== false || x?.asBuilt !== false ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.sourceOriginalRoot !== s.sourceRoot ||
      x?.sourceWallActiveNode !== s.hostNode ||
      x?.sourceWallMesh !== s.hostMesh ||
      x?.sourceWallPrimitive !== 3 ||
      !equalArray(x?.sourceWallTriangleIndices, [0, 1]) ||
      !equalArray(x?.targetGLTFWorld_XYZ_WORK_TEST, [2.37, 3.85, -7.335]) ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh ||
      x?.sourceLinksOutputSHA !== 'NOT_BOUND' ||
      x?.physicalXYZ !== 'NOT_VERIFIED' ||
      x?.physicalInstallationNotVerified !== true ||
      x?.humanReview !== 'NOT_RUN') return false;

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  return unique(normal) && unique(service) && normal.includes(11625) &&
    !service.includes(11625) &&
    sameSet(normal.filter(id => id !== 11625), service);
}

export function k3D2fSw05Scene785786SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3D2fSw05Scene785786Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false, publishAllowed: false,
    viewerRegistered: false, productionWebGLVerified: false,
    humanReview: 'NOT_RUN', current: false, asBuilt: false,
    physicalHostVerified: false, installedProductVerified: false,
  });
}
