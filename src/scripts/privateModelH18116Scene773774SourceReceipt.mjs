/**
 * SOURCE_ONLY fail-closed receipt for ORIGINAL H1811-6 R31 2F source-role
 * correction. It registers NO viewer scene and grants NO publication.
 * The caller MUST SHA256-authenticate complete original GLB bytes; a string
 * supplied as "authenticatedSha" alone does not establish provenance.
 */
export const H18116_SCENE773774 = Object.freeze({
  zipDriveId: '1Vb6zADB1_bcWytIi31BuKMS8F_d1AE6i',
  zipSha256: '48c4d367f765288ffb7a63769efb09b1c0cf06b32bbbbb80a17e4cf5db4c4c7c',
  glbSha256: '5cc1129753f66943e0e85355193702a5e511980ca893931049f94bb6360c489a',
  glbBytes: 63837784,
  sourceZipDriveId: '1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7',
  sourceGlbSha256: '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  inheritedSourceId: '1N34goHGseX62ZubtLJZVRz4CvUqiFo6_',
  inheritedSourceSha: '06a30d42db7f8510a7405c0741e74b3dc4d8ea7d2c32c373b30817d236f7a5e4',
  defaultScene: 292, scenes: 775, nodes: 13507, meshes: 5169,
  materials: 815, accessors: 11267, bufferViews: 11273,
  oldRoot: 13176, livingRoot: 13482, plexi: 11625,
  oldLeaves: Object.freeze([13171,13172,13173,13174,13175]),
  livingLeaves: Object.freeze([13477,13478,13479,13480,13481]),
  meshesPerLeaf: Object.freeze([397,397,398,399,400]),
  views: Object.freeze({
    normal: Object.freeze({
      index: 773, parent: 771, otherReference: 769, role: 'NORMAL',
      roots: 204, parentFnv: 'a9e2f210', targetFnv: 'bf25f6fe',
      name: 'Ylisrinne_R31_H1811-6_D2F_PINK_LIVING_SOURCE_ROLE_COW_NORMAL_WORK_TEST_HOST_HOLD__scene773',
      parentName: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_NORMAL_WORK_TEST_HOST_HOLD__scene771',
      plexi: true,
    }),
    service: Object.freeze({
      index: 774, parent: 772, otherReference: 770, role: 'SERVICE',
      roots: 203, parentFnv: '49047c9d', targetFnv: '7eaee9d7',
      name: 'Ylisrinne_R31_H1811-6_D2F_PINK_LIVING_SOURCE_ROLE_COW_SERVICE_WORK_TEST_HOST_HOLD__scene774',
      parentName: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_SERVICE_WORK_TEST_HOST_HOLD__scene772',
      plexi: false,
    }),
  }),
});
const same = (a,b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((x,i) => x === b[i]);
export function h18116RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let hash = 2166136261;
  for (const x of roots) {
    if (!Number.isSafeInteger(x) || x < 0) return null;
    hash = Math.imul(hash ^ x, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8,'0');
}
export function isH18116Scene773774Source(json, authenticatedSha, sceneIndex, role, floor) {
  const S = H18116_SCENE773774;
  const v = Object.values(S.views).find(x => x.index === sceneIndex);
  const asset = json?.asset?.extras;
  if (!v || authenticatedSha !== S.glbSha256 || role !== v.role ||
      floor !== 'D2F' || json?.scene !== S.defaultScene ||
      json?.scenes?.length !== S.scenes || json?.nodes?.length !== S.nodes ||
      json?.meshes?.length !== S.meshes || json?.materials?.length !== S.materials ||
      json?.accessors?.length !== S.accessors || json?.bufferViews?.length !== S.bufferViews ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.canonical !== false ||
      asset?.current !== false || asset?.asBuilt !== false ||
      asset?.HUMAN_REVIEW !== 'NOT_RUN') return false;
  const selected = json.scenes[sceneIndex], parent = json.scenes[v.parent];
  const reference = json.scenes[v.otherReference];
  const target = selected?.nodes, prev = parent?.nodes, refRoots = reference?.nodes;
  const e = selected?.extras;
  if (selected?.name !== v.name || parent?.name !== v.parentName ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.sourceDriveId !== S.inheritedSourceId ||
      e?.sourceGLBSHA256 !== S.inheritedSourceSha ||
      e?.source2FSceneIndex !== 768 ||
      e?.donorBOTHNormalSceneIndex !== 769 ||
      e?.donorBOTHServiceSceneIndex !== 770 ||
      e?.sourceLinksForOutputSHA !== 'NOT_BOUND' ||
      e?.productionWebGL !== 'NOT_RUN' || e?.humanReview !== 'NOT_RUN' ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.plexyState !== (v.plexi ? 'PLEX_ON':'PLEX_OFF') ||
      e?.r300SKU !== 'NOT_VERIFIED' ||
      e?.L12 !== 'VIEMARI_SOURCE_REVIEW' ||
      JSON.stringify(e) !== JSON.stringify(parent?.extras) ||
      !Array.isArray(prev) || !Array.isArray(target) || !Array.isArray(refRoots) ||
      prev.length !== v.roots || target.length !== v.roots ||
      new Set(prev).size !== prev.length || new Set(target).size !== target.length ||
      h18116RootsFnv32(prev) !== v.parentFnv ||
      h18116RootsFnv32(target) !== v.targetFnv ||
      prev.filter(x => x === S.oldRoot).length !== 1 ||
      !same(target,prev.map(x => x === S.oldRoot ? S.livingRoot : x)) ||
      target.includes(S.oldRoot) || target.filter(x=>x===S.livingRoot).length !== 1 ||
      prev.includes(S.livingRoot) || !refRoots.includes(S.livingRoot) ||
      refRoots.includes(S.oldRoot) ||
      target.includes(S.plexi) !== v.plexi) return false;
  const old = json.nodes[S.oldRoot], living = json.nodes[S.livingRoot];
  const ex = living?.extras;
  if (!same(old?.children, S.oldLeaves) || !same(living?.children,S.livingLeaves) ||
      !old?.name?.startsWith('K5_R21_2F_KITCHEN_') ||
      living?.name !== 'H18116_D2F_PINK_LIVING_EXPLICIT_RECLASSIFIED_VISUAL_ROOT_HOST_HOLD' ||
      ex?.stage !== 'WORK_TEST_HOST_HOLD' || ex?.current !== false ||
      ex?.asBuilt !== false || ex?.sourceLinksBound !== false ||
      ex?.sourceOriginalR31Root !== S.oldRoot ||
      ex?.identityStatus !== 'SEPARATE_PHYSICAL_OUTLET_FROM_K5_2026_PHOTOS' ||
      ex?.placementStatus !== 'VISUAL_REVIEW_PIN_NOT_FIELD_MEASURED' ||
      ex?.exactPhysicalPositionVerified !== false ||
      ex?.sourceLinksOutputSHABound !== false ||
      ex?.humanReview !== 'NOT_RUN' || ex?.presentationOnly !== true ||
      !Array.isArray(ex?.ownerPhotoSources) || ex.ownerPhotoSources.length !== 2) return false;
  for(let i=0;i<5;i++) {
    const a=json.nodes[S.oldLeaves[i]], b=json.nodes[S.livingLeaves[i]];
    if (a?.mesh !== S.meshesPerLeaf[i] || b?.mesh !== S.meshesPerLeaf[i] ||
        !same(a?.matrix,b?.matrix) || b?.extras?.current !== false ||
        b?.extras?.asBuilt !== false) return false;
  }
  return true;
}
export function h18116SourceReceipt(json, authenticatedSha, index, role, floor) {
  return Object.freeze({
    exactSource: isH18116Scene773774Source(json,authenticatedSha,index,role,floor),
    stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
    current:false,asBuilt:false,physicalPlacementVerified:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',
  });
}
