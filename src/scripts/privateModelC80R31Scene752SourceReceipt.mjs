/**
 * R31 has two separate __scene752 models: K5 pink-host off and G2S13 RAIN5.
 * A scene index (or suffix) alone is never a source identity.
 * Caller MUST independently SHA-256 the complete authenticated GLB.
 * Read-only receipt: no viewer registration, sourceLinks, publish or as-built.
 */
export const C80_R31_SCENE752_SOURCES=Object.freeze({
 k5:Object.freeze({
  role:'K5_WHITE_KITCHEN_PINK_HOST_OFF',sceneIndex:752,
  glbSha256:'09ad189a0a32b498c2a558c8792217ba72840c42600583a569c810dab53ba1bd',
  glbBytes:63502224,zipDriveId:'1hxIt360q3ZVEh0Jyl4uYOJZGKuLaXkpX',
  zipSha256:'fa246ed9185027c3aaa3188fde7ce20f7f4ef440817fbfd618888778efb27442',
  sceneName:'Ylisrinne_C80_R31_K5_PINK_HOST_OFF_EXISTING_FRIDGE_OUTLET_RETAINED_REVIEW_WORK_TEST_HOST_HOLD__scene752',
  sceneCount:753,nodeCount:13473,meshCount:5162,materialCount:812,accessorCount:11247,bufferViewCount:11253,
  rootCount:492,rootFnv32:'1d0c2816',sourceScene:751,removedPinkRoot:13176,preservedKitchenRoot:12497,
 }),
 rain5:Object.freeze({
  role:'G2S13_WHOLE_ROOF_FIVE_RAIN_ZONES',sceneIndex:752,
  glbSha256:'c15324e9c765a3fb765f672200eabb3d19ca6944db0f3951909787edda14f415',
  glbBytes:63510392,zipDriveId:'1kZlaqSFK3N3QN5P5Z5-9_R8ga2fNdoaf',
  zipSha256:'a09c4f5d34bf06690eb3d18a74aac4d75205fa60f021abc6713f05c8470c183d',
  sceneName:'Ylisrinne_C80_R31_WHOLE_ROOF8_R300_K18FOUR_D2FHOSES_RAIN5_REVIEW_WORK_TEST_HOST_HOLD__scene752',
  sceneCount:753,nodeCount:13477,meshCount:5162,materialCount:812,accessorCount:11247,bufferViewCount:11253,
  rootCount:494,rootFnv32:'42249326',sourceScene:751,
  parentGlbSha256:'09f54dad702e7b95e3b2e4fecad9e3938aac6ac1c90911e3821f7b5672862f31',
  newMarkerRoot:13476,
 }),
});
export function c80R31Scene752RootsFnv32(values){
 if(!Array.isArray(values))return null;
 let hash=2166136261;
 for(const id of values){
  if(!Number.isInteger(id)||id<0)return null;
  hash=Math.imul(hash^id,16777619)>>>0;
 }
 return hash.toString(16).padStart(8,'0');
}
const exactly=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
export function isC80R31Scene752Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_SCENE752_SOURCES[role],asset=json?.asset?.extras;
 if(!s||sceneIndex!==752||authenticatedSha!==s.glbSha256||
  (floor!==undefined&&floor!=='BOTH')||json?.scene!==292||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||json?.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[752],parent=json.scenes[s.sourceScene];
 const roots=target?.nodes,prev=parent?.nodes,e=target?.extras;
 if(target?.name!==s.sceneName||!Array.isArray(roots)||
  roots.length!==s.rootCount||new Set(roots).size!==roots.length||
  c80R31Scene752RootsFnv32(roots)!==s.rootFnv32||
  !Array.isArray(prev)||prev.length!==493)return false;
 if(role==='k5'){
  if(e?.status!=='WORK_TEST_HOST_HOLD'||e?.reviewOnly!==true||
   e?.oldRootExcluded!==s.removedPinkRoot||
   e?.existingKitchenRootPreserved!==s.preservedKitchenRoot||
   e?.outputShaSourceLinks!=='NOT_BOUND; no production promotion'||
   !roots.includes(s.preservedKitchenRoot)||roots.includes(s.removedPinkRoot))return false;
  return exactly(roots,prev.filter(n=>n!==s.removedPinkRoot));
 }
 if(role==='rain5'){
  if(e?.stage!=='WORK_TEST_HOST_HOLD'||e?.parentSceneIndex!==s.sourceScene||
   e?.parentGLBSHA256!==s.parentGlbSha256||
   e?.newMarkerRoot!==s.newMarkerRoot||
   !exactly(e?.newMarkerNodeIds,[13473,13474,13475])||
   !exactly(e?.existingWestMarkerIds,[12249,12250])||
   e?.roofP166BReviewGuides!=='8/8'||e?.rainZonesReviewOnly!=='5/5'||
   e?.physicalDownspoutModelled!==false||
   e?.rainwaterDischargeModelled!==false||
   e?.sourceLinksOutputShaBound!==false||e?.productionWebGL!=='NOT_RUN'||
   e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||
   !roots.includes(s.newMarkerRoot))return false;
  return exactly(roots,[...prev,s.newMarkerRoot]);
 }
 return false;
}
export function c80R31Scene752SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene752Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,
  publishAllowed:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',current:false,asBuilt:false,physicalHostVerified:false,
 });
}


/**
 * Source-locked follow-on to R31 RAIN5, adding only the K5 wrong-pink-root OFF
 * opt-in __scene753. Same scene index in another GLB is NOT interchangeable.
 * This is a read-only WORK_TEST receipt, never a runtime registration.
 */
export const C80_R31_SCENE753_SOURCE=Object.freeze({
 role:'RAIN5_K5_PINK_HOST_OFF',sceneIndex:753,
 glbSha256:'1cd3433ee6abeb246b58bc04433a3d5d8a2516800d9e4a7ecc7742ac33288165',
 glbBytes:63514444,zipDriveId:'1c-Ube_nteMUa3NAIF40DENrx4t27v6sE',
 zipSha256:'21d92ec1d4c60e209ef2ef83aead90abd9870c732c29c205a4299c10dbaabbc3',
 sceneName:'Ylisrinne_C80_R31_WHOLE_ROOF8_R300_K18FOUR_D2FHOSES_RAIN5_K5_WRONG_PINK_OFF_REVIEW_WORK_TEST_HOST_HOLD__scene753',
 sceneCount:754,nodeCount:13477,meshCount:5162,materialCount:812,
 accessorCount:11247,bufferViewCount:11253,rootCount:493,rootFnv32:'6c112c36',
 sourceScene:752,parentRootCount:494,parentRootFnv32:'42249326',
 parentGlbSha256:'c15324e9c765a3fb765f672200eabb3d19ca6944db0f3951909787edda14f415',
 k5DonorGlbSha256:'09ad189a0a32b498c2a558c8792217ba72840c42600583a569c810dab53ba1bd',
 k5DonorDriveId:'1hxIt360q3ZVEh0Jyl4uYOJZGKuLaXkpX',
 suppressedRoot:13176,preservedKitchenNode:12497,rainMarkerRoot:13476,
});
export function isC80R31Scene753Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_SCENE753_SOURCE,asset=json?.asset?.extras;
 if(role!==s.role||sceneIndex!==s.sceneIndex||authenticatedSha!==s.glbSha256||
  (floor!==undefined&&floor!=='BOTH')||json?.scene!==292||
  json.scenes?.length!==s.sceneCount||json.nodes?.length!==s.nodeCount||
  json.meshes?.length!==s.meshCount||json.materials?.length!==s.materialCount||
  json.accessors?.length!==s.accessorCount||
  json.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[sceneIndex],parent=json.scenes[s.sourceScene];
 const roots=target?.nodes,old=parent?.nodes,e=target?.extras;
 if(target?.name!==s.sceneName||!Array.isArray(roots)||!Array.isArray(old)||
  roots.length!==s.rootCount||old.length!==s.parentRootCount||
  new Set(roots).size!==roots.length||new Set(old).size!==old.length||
  c80R31Scene752RootsFnv32(roots)!==s.rootFnv32||
  c80R31Scene752RootsFnv32(old)!==s.parentRootFnv32||
  parent?.name!==C80_R31_SCENE752_SOURCES.rain5.sceneName||
  parent?.extras?.rainZonesReviewOnly!=='5/5'||
  parent?.extras?.sourceLinksOutputShaBound!==false||
  e?.stage!=='WORK_TEST_HOST_HOLD'||
  e?.parentSceneIndex!==s.sourceScene||
  e?.parentGLBSHA256!==s.parentGlbSha256||
  e?.sourceDonorK5OffGLBSHA256!==s.k5DonorGlbSha256||
  e?.sourceDonorK5OffDriveID!==s.k5DonorDriveId||
  e?.oldIncorrectRootSuppressed!==s.suppressedRoot||
  e?.existingFridgeOutletKept!==s.preservedKitchenNode||
  e?.K5SamePhysicalDeviceAsN12497!=='STRONG_CANDIDATE_NOT_CONFIRMED'||
  e?.H18116LivingRoomPhotoHasSeparateSocket!==true||
  e?.H18116Exact3DHost!=='NOT_CONFIRMED_NOT_PROMOTED'||
  e?.rainZonesPresentationOnly!=='5/5'||
  e?.roofP166BReviewGuides!=='8/8'||
  e?.newMeshes!==0||e?.newPhysicalSocketNodes!==0||
  e?.physicalDownspoutClaims!==0||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.productionWebGL!=='NOT_RUN'||e?.humanReview!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||
  roots.includes(s.suppressedRoot)||
  !roots.includes(s.preservedKitchenNode)||
  !roots.includes(s.rainMarkerRoot))return false;
 return exactly(roots,old.filter(id=>id!==s.suppressedRoot));
}
export function c80R31Scene753SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene753Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,
  publishAllowed:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',current:false,asBuilt:false,
  physicalHostVerified:false,physicalDownspoutVerified:false,
 });
}


/**
 * __scene754 adds a separate H1811-6 living-room visual review proxy to the
 * RELEASED RAIN5+K5-off __scene753, without reactivating the wrong K5 socket.
 * Original source-provenance receipt only. No browser runtime registration,
 * geometry promotion, physical-location validation or publish approval.
 */
export const C80_R31_SCENE754_SOURCE=Object.freeze({
 role:'RAIN5_K5_OFF_H18116_PINK_VISUAL_REUSE',sceneIndex:754,
 glbSha256:'970efad28889f4bdbda8a0f4775846855cb9d217901e72fbf68ccf1b2e38aa03',
 glbBytes:63529080,zipDriveId:'1OswwSeo2s8H04qvjcv0S0kk7QYnq_jI6',
 zipSha256:'b427cb43b0bfc516e3e3501c4d530b488ca38a193cca373e2b59942d2f9c2f1a',
 sceneName:'Ylisrinne_C80_R31_ROOF5_K5_OFF_H18116_PINK_VISUAL_REUSE_REVIEW_WORK_TEST_HOST_HOLD__scene754',
 sceneCount:755,nodeCount:13483,meshCount:5162,materialCount:812,
 accessorCount:11247,bufferViewCount:11253,rootCount:494,rootFnv32:'bae9bd94',
 sourceScene:753,parentRootCount:493,parentRootFnv32:'6c112c36',
 parentGlbSha256:'1cd3433ee6abeb246b58bc04433a3d5d8a2516800d9e4a7ecc7742ac33288165',
 visualDonorGlbSha256:'4359768a1d37f091c807b3cb3a13628d5a42688e801297609fae8676a87bc046',
 visualDonorDriveId:'18RWpd1gUbkhkz-LYfWc6FIvfAYEQzCfv',
 visualDonorSceneIndex:747,visualDonorRoot:13338,
 visualRoot:13482,visualLeaves:[13477,13478,13479,13480,13481],
 oldIncorrectK5Root:13176,preservedKitchenNode:12497,rainMarkerRoot:13476,
});
export function isC80R31Scene754Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_SCENE754_SOURCE,asset=json?.asset?.extras;
 if(role!==s.role||sceneIndex!==s.sceneIndex||authenticatedSha!==s.glbSha256||
  (floor!==undefined&&floor!=='BOTH')||json?.scene!==292||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[sceneIndex],parent=json.scenes[s.sourceScene];
 const roots=target?.nodes,old=parent?.nodes,e=target?.extras;
 const visual=json.nodes[s.visualRoot],v=visual?.extras;
 if(target?.name!==s.sceneName||parent?.name!==C80_R31_SCENE753_SOURCE.sceneName||
  !Array.isArray(roots)||!Array.isArray(old)||
  roots.length!==s.rootCount||old.length!==s.parentRootCount||
  new Set(roots).size!==roots.length||new Set(old).size!==old.length||
  c80R31Scene752RootsFnv32(roots)!==s.rootFnv32||
  c80R31Scene752RootsFnv32(old)!==s.parentRootFnv32||
  !exactly(roots,[...old,s.visualRoot])||
  roots.includes(s.oldIncorrectK5Root)||old.includes(s.oldIncorrectK5Root)||
  !roots.includes(s.preservedKitchenNode)||!roots.includes(s.rainMarkerRoot)||
  parent?.extras?.stage!=='WORK_TEST_HOST_HOLD'||
  parent?.extras?.oldIncorrectRootSuppressed!==s.oldIncorrectK5Root||
  parent?.extras?.H18116Exact3DHost!=='NOT_CONFIRMED_NOT_PROMOTED'||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.parentSceneIndex!==s.sourceScene||
  e?.parentGLBSHA256!==s.parentGlbSha256||
  e?.sourceVisualDonorGLBSHA256!==s.visualDonorGlbSha256||
  e?.sourceVisualDonorDriveID!==s.visualDonorDriveId||
  e?.sourceVisualDonorSceneIndex!==s.visualDonorSceneIndex||
  e?.sourceVisualDonorRoot!==s.visualDonorRoot||
  e?.H18116VisualReviewRoot!==s.visualRoot||
  e?.H18116VisualRole!=='D2F_PINK_WEST_WALL_PHOTO_PROXY_ONLY'||
  e?.H18116ExactXYZ!=='NOT_MEASURED'||
  e?.H18116PhysicalExistence!=='OWNER_PHOTO_2026'||
  e?.H18116OldWrongK5SourceInactive!==true||
  e?.K5KitchenExistingNode12497!=='ACTIVE_CANDIDATE_NOT_CONFIRMED'||
  e?.additionalVisualProxyNodes!==6||e?.additionalPhysicalSocketClaims!==0||
  e?.additionalMeshData!==0||e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.productionWebGL!=='NOT_RUN'||e?.humanReview!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||
  !exactly(visual?.children,s.visualLeaves)||
  v?.sourceOriginalR31Root!==s.oldIncorrectK5Root||
  !exactly(v?.sourceOriginalR31Leaves,[13171,13172,13173,13174,13175])||
  v?.sourceDonorRoot!==s.visualDonorRoot||
  v?.sourceRoleDonorDriveID!==s.visualDonorDriveId||
  v?.sourceRoleDonorGLBSHA256!==s.visualDonorGlbSha256||
  v?.presentationOnly!==true||v?.exactPhysicalPositionVerified!==false||
  v?.sourceLinksOutputSHABound!==false||v?.humanReview!=='NOT_RUN'||
  v?.placementStatus!=='VISUAL_REVIEW_PIN_NOT_FIELD_MEASURED')return false;
 for(let i=0;i<s.visualLeaves.length;i++){
  const leaf=json.nodes[s.visualLeaves[i]],x=leaf?.extras;
  if(!leaf||leaf.mesh!==[397,397,398,399,400][i]||
   x?.newRoleCOW!=='H1811-6_PHOTO_VISUAL_REUSE'||
   x?.sourceOriginalR31Node!==13171+i||
   x?.sourceDonorNodeIndex!==13333+i||
   x?.sourceRoleDonorDriveID!==s.visualDonorDriveId||
   x?.sourceRoleDonorGLBSHA256!==s.visualDonorGlbSha256||
   x?.pinLocationStatus!=='NOT_FIELD_SURVEYED'||
   x?.exactPhysicalPositionVerified!==false||
   x?.sourceLinksOutputSHABound!==false||
   x?.current!==false||x?.asBuilt!==false||
   x?.WORK_TEST!==true||x?.HOST_HOLD!==true)return false;
 }
 return true;
}
export function c80R31Scene754SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene754Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,
  publishAllowed:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',current:false,asBuilt:false,
  physicalHostVerified:false,physicalLocationMeasured:false,
  physicalDownspoutVerified:false,
 });
}


/**
 * L16 __scene756 combines the TWO different __scene755 GLBs (ILP visible
 * curved arc + KIV exterior case). The index 755 does not identify either
 * donor. This is a read-only, SHA-authenticated WORK_TEST/HOST_HOLD receipt.
 */
export const C80_R31_SCENE756_SOURCE=Object.freeze({
 role:'L16_CURVED_ARC_KIV_EXTERNAL_CASE_COMBINED',sceneIndex:756,
 glbSha256:'c08dbafe022dcf836764518283c9f863adc87cbd23df661511c619f7beac3037',
 glbBytes:63556632,zipDriveId:'1zTLCvLeVLaDCGmQKFYAPiq2eR2VTJ5aZ',
 zipSha256:'c40dc484f3b62409fd6b395c971b2ba604c2e822a1361f8e97342b48131061b1',
 sceneName:'Ylisrinne_C80_R31_L16_ILP_CURVE_KIV_EXT_CASE_COMBINED_WORK_TEST_HOST_HOLD__scene756',
 parentName:'Ylisrinne_C80_R31_L16_OWNER_PHOTO_CURVED_ILP_LINK_OPTIN_WORK_TEST_HOST_HOLD__scene755',
 sceneCount:757,nodeCount:13487,meshCount:5163,materialCount:812,
 accessorCount:11250,bufferViewCount:11256,rootCount:495,rootFnv32:'2bebfdbd',
 parentScene:755,parentRootCount:494,parentRootFnv32:'106be574',
 curveDonorGlbSha256:'65526f9849c55c32f5c3658f32271ac0b04c918484faae86eba8a4660f43f1b3',
 curveDonorZipDriveId:'13ti3aRjngBatHfNVYLxVvVenU50jLl0h',
 caseDonorGlbSha256:'119ce45330c36a1fe3a5c7fbf6b58e17cad4f7bbd8ed809f6d9e1ebdfa8ea915',
 caseDonorZipDriveId:'19SwiT-NFb89g4HtKcC3vuDG2QnExjRcJ',
 sharedParentGlbSha256:'970efad28889f4bdbda8a0f4775846855cb9d217901e72fbf68ccf1b2e38aa03',
 oldCurveRoot:13484,newCurveRoot:13485,newCaseRoot:13486,
 visibleCurveNode:13483,oldCaseNode:13259,oldStraightNode:12561,
 kitchenNode:12497,rainMarkerNode:13476,livingVisualNode:13482,
});
export function isC80R31Scene756Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_SCENE756_SOURCE,asset=json?.asset?.extras;
 if(role!==s.role||sceneIndex!==s.sceneIndex||
  authenticatedSha!==s.glbSha256||
  (floor!==undefined&&floor!=='BOTH')||json?.scene!==292||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[sceneIndex],parent=json.scenes[s.parentScene];
 const roots=target?.nodes,prior=parent?.nodes,e=target?.extras;
 const curve=json.nodes[s.newCurveRoot],c=curve?.extras;
 const casing=json.nodes[s.newCaseRoot],v=casing?.extras;
 if(target?.name!==s.sceneName||parent?.name!==s.parentName||
  !Array.isArray(roots)||!Array.isArray(prior)||
  roots.length!==s.rootCount||prior.length!==s.parentRootCount||
  new Set(roots).size!==roots.length||new Set(prior).size!==prior.length||
  c80R31Scene752RootsFnv32(roots)!==s.rootFnv32||
  c80R31Scene752RootsFnv32(prior)!==s.parentRootFnv32||
  prior.filter(x=>x===s.oldCurveRoot).length!==1||
  !exactly(roots,[...prior.map(x=>x===s.oldCurveRoot?s.newCurveRoot:x),s.newCaseRoot])||
  roots.includes(s.oldCurveRoot)||roots.includes(s.oldCaseNode)||
  !roots.includes(s.kitchenNode)||!roots.includes(s.rainMarkerNode)||
  !roots.includes(s.livingVisualNode)||roots.includes(13176)||
  parent?.extras?.WORK_TEST!==true||parent?.extras?.HOST_HOLD!==true||
  parent?.extras?.parentGLBSHA256!==s.sharedParentGlbSha256||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.parentSceneIndex!==s.parentScene||
  e?.parentGLBSHA256!==s.curveDonorGlbSha256||
  e?.otherBranchSceneIndex!==755||
  e?.otherBranchGLBSHA256!==s.caseDonorGlbSha256||
  e?.sourceParentScene754GLBSHA256!==s.sharedParentGlbSha256||
  e?.sourceCurveDonorZipDriveID!==s.curveDonorZipDriveId||
  e?.sourceExternalCaseDonorZipDriveID!==s.caseDonorZipDriveId||
  e?.combinedVisibleArcNode!==s.visibleCurveNode||
  e?.combinedArcCOWRoot!==s.newCurveRoot||
  e?.combinedExternalCaseNode!==s.newCaseRoot||
  e?.removedOnlyActiveLegacyCaseNode!==s.oldCaseNode||
  e?.oldStraightConnectorStillOff!==s.oldStraightNode||
  e?.externalCaseSourceOriginalNode!==12560||
  e?.externalCaseSourceMesh!==4721||
  !exactly(e?.retainedKIVRoots,[13256,13257])||
  e?.newMeshes!==0||e?.newPhysicalRouteClaims!==0||
  e?.arcAndCaseSurfaceIntersectExpectedVisualEnvelopeOnly!==true||
  e?.arcConnectionPhysicalContinuity!=='NOT_VERIFIED'||
  e?.caseLocationStatus!=='PHOTO_RELATIVE_NOT_MEASURED'||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.productionWebGL!=='NOT_RUN'||e?.humanReview!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false||
  !exactly(curve?.children,[s.visibleCurveNode,13139,13138])||
  c?.stage!=='WORK_TEST_HOST_HOLD'||
  c?.integration!=='PHOTO_CURVE_PLUS_SOURCE_EXACT_EXT_CASE_REPLACES_OLD_CASE'||
  c?.suppressedLegacyExteriorCaseNodeOnlyScene756!==s.oldCaseNode||
  c?.newExteriorCaseRootInScene756!==s.newCaseRoot||
  c?.originalCurvedScene755GLBSHA256!==s.curveDonorGlbSha256||
  c?.current!==false||c?.asBuilt!==false||
  c?.physicalConnectionVerified!==false||
  c?.sourceLinksBound!==false||
  casing?.mesh!==4721||!exactly(casing?.translation,[0.056,0,0])||
  v?.stage!=='WORK_TEST_HOST_HOLD'||v?.WORK_TEST!==true||
  v?.HOST_HOLD!==true||v?.sourceNode!==12560||
  v?.sourceMesh!==4721||v?.shiftX_m!==0.056||
  v?.sourceDonorGLBSHA256!==s.caseDonorGlbSha256||
  v?.sourceDonorZipDriveId!==s.caseDonorZipDriveId||
  v?.integratedNewNodeIndex!==s.newCaseRoot||
  v?.physicalXYZMeasured!==false||v?.realWallHostVerified!==false||
  v?.physicalPenetrationVerified!==false||
  v?.sourceLinksOutputSHABound!==false||
  v?.current!==false||v?.asBuilt!==false)return false;
 return true;
}
export function c80R31Scene756SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene756Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,
  publishAllowed:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
  current:false,asBuilt:false,physicalHostVerified:false,
  physicalRouteVerified:false,physicalClearanceVerified:false,
 });
}
