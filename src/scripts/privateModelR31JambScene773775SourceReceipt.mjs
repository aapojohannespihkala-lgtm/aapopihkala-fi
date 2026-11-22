/**
 * R31 HIGH4 OM-KORJ7-04: SHA-locked SOURCE_ONLY identity receipt.
 * G2b work package has three independently opt-in scene names 773-775.
 * They are NOT the same as unrelated R31 scene773 from other ZIP/SHA branches.
 * Caller MUST independently authenticate SHA-256 of complete GLB bytes.
 * This metadata alone does not prove original provenance or authorize publish.
 */
export const R31_JAMB_773775 = Object.freeze({
  zipDriveId:'1rwDYl0xkaAuD7kwEWMzL4k2tf3xHz0K-',
  zipSha256:'e0435b7bb832f5cc8f23d87cb354ce953a631821e376116d2f0edae8e93125d2',
  glbSha256:'5ff22fafa70a3f43c560d923dcdd844130df1902ae361ccef605bd996856617e',
  glbBytes:63843080,
  originalDriveId:'1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7',
  originalGlbSha256:'9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  defaultScene:292, sceneCount:776, nodeCount:13507, meshCount:5169,
  materialCount:815, accessorCount:11267, bufferViewCount:11273,
  addedRoot:12135, repairMesh:4568, historicalDefectiveRoot:9391,
  historicalDefectiveMesh:3341,
  views:Object.freeze({
    773: Object.freeze({ index:773, sourceScene:769, role:'NORMAL', floor:'BOTH', roots:500, sourceRoots:499, rootsFnv:'03dd651d', sourceRootsFnv:'c493c3e8', name:"Ylisrinne_C80_R31_HIGH4_V49_RIGHT_JAMB_EXISTING_COW_BOTH_NORMAL_WORK_TEST_HOST_HOLD__scene773", sourceName:"Ylisrinne_C80_R31_R300_ROOF_VM20_CLOSED_2F_L12_V75V110_RK141_RK142_RK143_MJ83_BOTH_REVIEW_WORK_TEST_HOST_HOLD__scene769" }),
    774: Object.freeze({ index:774, sourceScene:770, role:'SERVICE', floor:'BOTH', roots:499, sourceRoots:498, rootsFnv:'5a6b8042', sourceRootsFnv:'1f600091', name:"Ylisrinne_C80_R31_HIGH4_V49_RIGHT_JAMB_EXISTING_COW_BOTH_SERVICE_WORK_TEST_HOST_HOLD__scene774", sourceName:"Ylisrinne_C80_R31_BOTH_R300_KUPARIT_HUOLTO_PLEKSI_POIS_RK141_RK142_RK143_MJ83_VM20_CLOSED_WORK_TEST_HOST_HOLD__scene770" }),
    775: Object.freeze({ index:775, sourceScene:742, role:'REFERENCE', floor:'1F', roots:301, sourceRoots:300, rootsFnv:'fb7063d7', sourceRootsFnv:'7195a04a', name:"Ylisrinne_C80_R31_HIGH4_V49_RIGHT_JAMB_EXISTING_COW_1F_REFERENCE_WORK_TEST_HOST_HOLD__scene775", sourceName:"C80_R31_R30_G2S13_D_WEST_GABLE_2_SOURCE_PRESENCE_1F_OPTIN_WORK_TEST_HOST_HOLD__scene742" })
  }),
});
export function r31JambRootsFnv32(values) {
  if(!Array.isArray(values)) return null;
  let hash = 2166136261;
  for(const value of values) {
    if(!Number.isSafeInteger(value) || value<0) return null;
    hash=Math.imul(hash^value,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
export function isR31Jamb773775Original(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const S=R31_JAMB_773775;
  const v=S.views[sceneIndex];
  const a=json?.asset?.extras;
  if (!v || authenticatedGlbSha256!==S.glbSha256 ||
      role!==v.role || floor!==v.floor ||
      json?.scene!==S.defaultScene || json?.scenes?.length!==S.sceneCount ||
      json?.nodes?.length!==S.nodeCount || json?.meshes?.length!==S.meshCount ||
      json?.materials?.length!==S.materialCount ||
      json?.accessors?.length!==S.accessorCount ||
      json?.bufferViews?.length!==S.bufferViewCount ||
      a?.ModelStage!=='WORK_TEST' || a?.Canonical!==false ||
      a?.canonical!==false || a?.current!==false || a?.asBuilt!==false ||
      a?.HUMAN_REVIEW!=='NOT_RUN') return false;
  const s=json.scenes[sceneIndex], parent=json.scenes[v.sourceScene];
  const e=s?.extras;
  const roots=s?.nodes, oldRoots=parent?.nodes;
  if (s?.name!==v.name || parent?.name!==v.sourceName ||
      parent?.extras?.stage!=='WORK_TEST_HOST_HOLD' ||
      e?.stage!=='WORK_TEST_HOST_HOLD' || e?.WORK_TEST!==true ||
      e?.current!==false || e?.asBuilt!==false ||
      e?.sourceGLBDriveId!==S.originalDriveId ||
      e?.sourceGLBSHA256!==S.originalGlbSha256 ||
      e?.sourceSceneIndex!==v.sourceScene ||
      e?.repairNode!==S.addedRoot || e?.repairMesh!==S.repairMesh ||
      e?.originalCorruptedNode!==S.historicalDefectiveRoot ||
      e?.originalCorruptedMesh!==S.historicalDefectiveMesh ||
      e?.repairAlreadyPresentInSource!==true ||
      e?.repairGeometryNew!==false ||
      e?.sourceLinksOutputSHA!=='NOT_BOUND' ||
      e?.humanReview!=='NOT_RUN' || e?.physicalHostVerified!==false ||
      e?.floor!==v.floor || e?.presentation!==v.role ||
      !Array.isArray(roots) || !Array.isArray(oldRoots) ||
      roots.length!==v.roots || oldRoots.length!==v.sourceRoots ||
      new Set(roots).size!==roots.length ||
      new Set(oldRoots).size!==oldRoots.length ||
      r31JambRootsFnv32(roots)!==v.rootsFnv ||
      r31JambRootsFnv32(oldRoots)!==v.sourceRootsFnv ||
      oldRoots.includes(S.addedRoot) || oldRoots.includes(S.historicalDefectiveRoot) ||
      roots.includes(S.historicalDefectiveRoot) ||
      roots[roots.length-1]!==S.addedRoot ||
      !oldRoots.every((n,i)=>n===roots[i])) return false;
  const repair=json.nodes[S.addedRoot], defect=json.nodes[S.historicalDefectiveRoot];
  const ex=repair?.extras;
  if (repair?.mesh!==S.repairMesh || defect?.mesh!==S.historicalDefectiveMesh ||
      repair?.name!=='OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_RECTANGULAR_WORK_TEST' ||
      ex?.status!=='WORK_TEST_HOST_HOLD' || ex?.current!==false ||
      ex?.asBuilt!==false || ex?.unmeasuredHost!==true ||
      ex?.humanReview!=='NOT_RUN' || ex?.sourceLinksVerified!==false ||
      ex?.originalNode!==S.historicalDefectiveRoot ||
      ex?.originalMesh!==S.historicalDefectiveMesh ||
      ex?.geometryBasis!=='existing same-name V49 ghost, not a surveyed host' ||
      ex?.thicknessMm!==105 || ex?.thinSourceMm!==60 ||
      ex?.postDepthMm!==95 || ex?.thermostatReferenceZmm!==-5112 ||
      !Array.isArray(ex?.exactJambX) || ex.exactJambX.length!==2 ||
      ex.exactJambX[0]!==3520 || ex.exactJambX[1]!==3850 ||
      json.meshes[S.repairMesh]?.name!==
        'OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_FIXED_GEOMETRY_WORK_TEST') return false;
  return true;
}
export function r31JambSourceReceipt(json, digest, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource:isR31Jamb773775Original(json,digest,sceneIndex,role,floor),
    sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
    physicalHostVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
    stage:'WORK_TEST_HOST_HOLD',
  });
}
