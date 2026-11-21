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


/**
 * The two NIBE Compact R300 preview roles share ONE authenticated source GLB:
 * __scene759 includes the clear screen, __scene760 suppresses ONLY that screen.
 * Caller independently verifies SHA-256 of the complete original GLB bytes.
 * Read-only receipt, not a model registration or publication permission.
 */
export const C80_R31_R300_SOURCE=Object.freeze({
 glbSha256:'0ec686edc2c36b1230b81edf7e27237e2ee95b34ac2fe18768519c255ad1ec13',
 glbBytes:63630516,
 zipDriveId:'13SUVUJEtaoLFkACF_LQ2I3wLKiv47ktW',
 zipSha256:'03c221aaf9ea4883c743c6c5ec0ef767643c58385d3002238331ce03b8b121c8',
 sceneCount:761,nodeCount:13495,meshCount:5165,materialCount:812,
 accessorCount:11254,bufferViewCount:11260,defaultScene:292,
 parentSceneIndex:758,parentSceneName:'Ylisrinne_C80_R31_R300_ETUPUOLI_WCHUONEESEEN_WORK_TEST_HOST_HOLD__scene758',
 parentRootCount:494,parentRootFnv32:'b4f58f98',
 parentGlbSha256:'bbb0ff168255d2b56454be25df0550802cc6c658e18a76c70d84c78533fbba7e',
 newR300Root:13488,screenRoot:11625,copperRoot:13494,
 copperLeaves:Object.freeze([13492,13493]),copperMeshes:Object.freeze([5163,5164]),
});
export const C80_R31_R300_VIEWS=Object.freeze({
 normal:Object.freeze({
  role:'R300_VISIBLE_COPPER_NORMAL_SCREEN_ON',sceneIndex:759,
  sceneName:'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
  rootCount:495,rootFnv32:'0cd5a96a',screenVisible:true,
 }),
 service:Object.freeze({
  role:'R300_VISIBLE_COPPER_SERVICE_SCREEN_OFF',sceneIndex:760,
  sceneName:'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760',
  rootCount:494,rootFnv32:'09cac651',screenVisible:false,
 }),
});
export function isC80R31R300CopperSource(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_R300_SOURCE,views=C80_R31_R300_VIEWS;
 const view=Object.values(views).find(v=>v.role===role);
 const a=json?.asset?.extras;
 if(!view||sceneIndex!==view.sceneIndex||
  authenticatedSha!==s.glbSha256||(floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||json?.scenes?.length!==s.sceneCount||
  json?.nodes?.length!==s.nodeCount||json?.meshes?.length!==s.meshCount||
  json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||
  a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const prior=json.scenes[s.parentSceneIndex],target=json.scenes[sceneIndex];
 const old=prior?.nodes,roots=target?.nodes,e=target?.extras;
 if(prior?.name!==s.parentSceneName||target?.name!==view.sceneName||
  !Array.isArray(old)||!Array.isArray(roots)||
  old.length!==s.parentRootCount||roots.length!==view.rootCount||
  new Set(old).size!==old.length||new Set(roots).size!==roots.length||
  c80R31Scene752RootsFnv32(old)!==s.parentRootFnv32||
  c80R31Scene752RootsFnv32(roots)!==view.rootFnv32||
  prior?.extras?.newR300Root!==s.newR300Root||
  !old.includes(s.screenRoot)||!old.includes(s.newR300Root)||
  !exactly(roots,view.screenVisible?
   [...old,s.copperRoot]:
   [...old.filter(x=>x!==s.screenRoot),s.copperRoot])||
  e?.stage!=='WORK_TEST_HOST_HOLD'||
  e?.sourceSceneIndex!==s.parentSceneIndex||
  e?.sourceGLBSHA256!==s.parentGlbSha256||
  e?.visibleCopperRoot!==s.copperRoot||
  e?.normalSceneIndex!==views.normal.sceneIndex||
  e?.serviceSceneIndex!==views.service.sceneIndex||
  e?.splashScreenVisible!==view.screenVisible||
  e?.maintenanceAccessPhysicallyVerified!==false||
  e?.physicalWaterConnectionsVerified!==0||
  e?.r300FrontOrientationG1!=='N'||
  e?.newR300Root!==s.newR300Root||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.sourceLinksOutputShaBound!==false||
  e?.productionWebGL!=='NOT_RUN'||
  e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.humanReview!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false)return false;
 const copper=json.nodes[s.copperRoot],children=copper?.children;
 if(!exactly(children,s.copperLeaves)||copper?.mesh!==undefined)return false;
 for(let i=0;i<s.copperLeaves.length;i++){
  const n=json.nodes[s.copperLeaves[i]],x=n?.extras;
  if(n?.mesh!==s.copperMeshes[i]||x?.stage!=='WORK_TEST_HOST_HOLD'||
   x?.sourceGLBSHA256!==s.parentGlbSha256||
   x?.visualOnly!==true||x?.visibleGeometryOnly!==true||
   x?.wallXYZMeasured!==false||x?.copperFunction!=='UNASSIGNED'||
   x?.physicalConnectionsVerified!==0||
   x?.current!==false||x?.asBuilt!==false)return false;
 }
 return true;
}
export function c80R31R300CopperSourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31R300CopperSource(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,
  asBuilt:false,physicalHostVerified:false,physicalConnectionsVerified:false,
  serviceClearanceVerified:false,
 });
}


/**
 * H1911-3 D1F VM20 access-hatch review COW.
 * Both scenes are in ONE authenticated GLB, based on __scene759 (screen ON),
 * NOT the R300 service __scene760 (screen OFF). Scene761 replaces only the
 * wall host; scene762 additionally replaces the S2 upper hatch leaf.
 * No measured 2026 opening, plumbing connection, publication or as-built.
 */
export const C80_R31_VM20_HATCH_SOURCE=Object.freeze({
 glbSha256:'8ce36626b5a9133091076721cac6940c9dbb5b47e3dad719508d20dde3b4f0de',
 glbBytes:63670812,
 zipDriveId:'1aLLTVDoKfqTSHVa64unEjYLJ5i9XF7AB',
 zipSha256:'32df8053cae5ee2a8b40cca39e28221a973712868f380e3d41335f1d8bac59b8',
 sceneCount:763,nodeCount:13498,meshCount:5166,materialCount:812,
 accessorCount:11260,bufferViewCount:11266,defaultScene:292,
 parentSceneIndex:759,
 parentName:'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
 parentRootCount:495,parentRootFnv32:'0cd5a96a',
 parentGlbSha256:'0ec686edc2c36b1230b81edf7e27237e2ee95b34ac2fe18768519c255ad1ec13',
 parentZipDriveId:'13SUVUJEtaoLFkACF_LQ2I3wLKiv47ktW',
 oldWallRoot:12436,newWallRoot:13495,wallMesh:5165,
 oldS2Root:13167,newS2Root:13497,
 oldLeafNode:1727,newLeafNode:13496,leafMesh:833,
 screenRoot:11625,copperRoot:13494,
 sourcePhotoOpenId:'1YthoZIlCmDnLg1y5nnfvmLbZbXo2fEA1',
 sourcePhotoOverviewId:'16vATBxFzEd1270VKv4wvxCRHYu3O8O5l',
});
export const C80_R31_VM20_HATCH_VIEWS=Object.freeze({
 closed:Object.freeze({
  role:'VM20_D1F_UPPER_ACCESS_HATCH_CLOSED',sceneIndex:761,
  sceneName:'H1911-3_R31_VM20_WC_ACCESS_CLOSED_WORK_TEST_HOST_HOLD__scene761',
  rootCount:495,rootFnv32:'da71cd8f',openDoor:false,
 }),
 opened:Object.freeze({
  role:'VM20_D1F_UPPER_ACCESS_HATCH_OPEN_RIGHT_HINGE',sceneIndex:762,
  sceneName:'H1911-3_R31_VM20_WC_ACCESS_OPEN_RIGHT_HINGE_WORK_TEST_HOST_HOLD__scene762',
  rootCount:495,rootFnv32:'ecb5f9e5',openDoor:true,
 }),
});
export function isC80R31Vm20HatchSource(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_VM20_HATCH_SOURCE,views=C80_R31_VM20_HATCH_VIEWS;
 const view=Object.values(views).find(v=>v.role===role),a=json?.asset?.extras;
 if(!view||sceneIndex!==view.sceneIndex||
  authenticatedSha!==s.glbSha256||(floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||json?.scenes?.length!==s.sceneCount||
  json?.nodes?.length!==s.nodeCount||json?.meshes?.length!==s.meshCount||
  json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||
  a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const parent=json.scenes[s.parentSceneIndex],closed=json.scenes[761];
 const opened=json.scenes[762],target=json.scenes[sceneIndex];
 const p=parent?.nodes,c=closed?.nodes,o=opened?.nodes,roots=target?.nodes;
 if(parent?.name!==s.parentName||
  closed?.name!==views.closed.sceneName||
  opened?.name!==views.opened.sceneName||
  target?.name!==view.sceneName||
  !Array.isArray(p)||!Array.isArray(c)||!Array.isArray(o)||
  !Array.isArray(roots)||
  p.length!==s.parentRootCount||
  c.length!==views.closed.rootCount||o.length!==views.opened.rootCount||
  roots.length!==view.rootCount||
  new Set(p).size!==p.length||
  new Set(c).size!==c.length||new Set(o).size!==o.length||
  c80R31Scene752RootsFnv32(p)!==s.parentRootFnv32||
  c80R31Scene752RootsFnv32(c)!==views.closed.rootFnv32||
  c80R31Scene752RootsFnv32(o)!==views.opened.rootFnv32||
  !exactly(c,p.map(n=>n===s.oldWallRoot?s.newWallRoot:n))||
  !exactly(o,c.map(n=>n===s.oldS2Root?s.newS2Root:n))||
  p.filter(n=>n===s.oldWallRoot).length!==1||
  c.filter(n=>n===s.oldS2Root).length!==1||
  !p.includes(s.screenRoot)||!c.includes(s.screenRoot)||
  !o.includes(s.screenRoot)||!o.includes(s.copperRoot)||
  !c.includes(s.newWallRoot)||o.includes(s.oldWallRoot)||
  o.includes(s.oldS2Root))return false;
 for(const [v,scene] of [[views.closed,closed],[views.opened,opened]]){
  const e=scene?.extras;
  if(e?.stage!=='WORK_TEST_HOST_HOLD'||
   e?.parentSceneIndex!==s.parentSceneIndex||
   e?.parentGLBSHA256!==s.parentGlbSha256||
   e?.sourceParentZipDriveID!==s.parentZipDriveId||
   e?.sourcePhotoOpenCabinetID!==s.sourcePhotoOpenId||
   e?.sourcePhotoWCOverviewID!==s.sourcePhotoOverviewId||
   e?.localWallReplacementRoot!==s.newWallRoot||
   e?.originalWallNode!==s.oldWallRoot||
   e?.closedDoorOriginalNode!==s.oldLeafNode||
   e?.openDoorCOWNode!==(v.openDoor?s.newLeafNode:null)||
   e?.photoRelativeNotMeasured!==true||
   e?.activePhysicalPlumbingUnmodified!==true||
   e?.sourceLinksOutputSHA!=='NOT_BOUND'||
   e?.sourceLinksOutputShaBound!==false||
   e?.productionWebGL!=='NOT_RUN'||e?.HUMAN_REVIEW!=='NOT_RUN'||
   e?.current!==false||e?.asBuilt!==false||e?.canonical!==false)return false;
 }
 const wall=json.nodes[s.newWallRoot],w=wall?.extras;
 const leaf=json.nodes[s.newLeafNode],l=leaf?.extras;
 const oldS2=json.nodes[s.oldS2Root],newS2=json.nodes[s.newS2Root];
 const r=newS2?.extras;
 if(wall?.mesh!==s.wallMesh||w?.replacesNode!==s.oldWallRoot||
  !exactly(w?.evidencePhotos,[s.sourcePhotoOpenId,s.sourcePhotoOverviewId])||
  w?.fitStatus!=='PHOTO_RELATIVE_TO_EXISTING_MODEL_HATCH_NOT_FIELD_MEASURED'||
  w?.sourceLinksOutputSHA!=='NOT_BOUND'||
  leaf?.mesh!==s.leafMesh||l?.originalLeafNode!==s.oldLeafNode||
  l?.photoRightHinge!==true||
  l?.swing!=='90deg_visual_only_not_measured'||
  l?.sourceLinksOutputSHA!=='NOT_BOUND'||
  !exactly(newS2?.translation,oldS2?.translation)||
  !exactly(newS2?.children,
   oldS2?.children?.map(n=>n===s.oldLeafNode?s.newLeafNode:n))||
  oldS2?.children?.filter(n=>n===s.oldLeafNode).length!==1||
  r?.replacesRoot!==s.oldS2Root||
  r?.originalLeafNode!==s.oldLeafNode||
  r?.openLeafNode!==s.newLeafNode||
  r?.allOtherChildrenExact!==true||
  r?.sourceLinksRuntimeBound!==false||
  r?.current!==false||r?.asBuilt!==false)return false;
 return true;
}
export function c80R31Vm20HatchSourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Vm20HatchSource(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,
  asBuilt:false,physicalHostVerified:false,physicalOpeningMeasured:false,
  plumbingConnectivityVerified:false,
 });
}


/**
 * R31 __scene763 is the 2015 RK14.2 wine-cooler C10 circuit SCHEMATIC.
 * It is not the measured physical cable or 2026 installation.
 * The parent __scene762 comes from another GLB. Scene indices alone do NOT
 * authenticate the parent, while GLB SHA and exact glTF hierarchy do.
 * Source-only, no runtime viewer registration or publish permission.
 */
export const C80_R31_RK142_SOURCE=Object.freeze({
 role:'RK14_2_WINE_COOLER_2015_SCHEMATIC_ONLY',
 sceneIndex:763,
 sceneName:'K8_R31_RK14_2_D2F_WINE_PLAN_ONLY_SCHEMA_WORK_TEST_HOST_HOLD__scene763',
 glbSha256:'4613c7098722b581a14d9a808efb21b7fcd6d980b363bbc52a8a49a399e5633e',
 glbBytes:63693736,
 zipDriveId:'1lfBlnQ6LdPExwa0NDNO7YvEZ7qUNk74j',
 zipSha256:'38b483663c463fbc047b941bfbd1d6b6803e8df4f228ec3e00ff438d5b91428c',
 sceneCount:764,nodeCount:13500,meshCount:5167,materialCount:813,
 accessorCount:11263,bufferViewCount:11269,defaultScene:292,
 parentScene:762, parentSceneName:'H1911-3_R31_VM20_WC_ACCESS_OPEN_RIGHT_HINGE_WORK_TEST_HOST_HOLD__scene762',
 parentGLBSHA256:'8ce36626b5a9133091076721cac6940c9dbb5b47e3dad719508d20dde3b4f0de',
 parentRootCount:495,parentRootFnv32:'ecb5f9e5',
 targetRootCount:496,targetRootFnv32:'00324afa',
 newRoot:13499,newLeaf:13498,newMesh:5166,
 breaker:13013,wine:12695,island:12633,board:12989,
 circuitSourceId:'1-dioYKOAol67GyH0rl5cQ-omRcoeWAkP',
 routingSourceId:'1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
});
export function isC80R31RK142Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_RK142_SOURCE,a=json?.asset?.extras;
 if(authenticatedSha!==s.glbSha256||sceneIndex!==s.sceneIndex||
  role!==s.role||(floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||
  a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[sceneIndex],parent=json.scenes[s.parentScene];
 const roots=target?.nodes,prev=parent?.nodes,e=target?.extras;
 const root=json.nodes[s.newRoot],r=root?.extras,leaf=json.nodes[s.newLeaf],l=leaf?.extras;
 if(target?.name!==s.sceneName||parent?.name!==s.parentSceneName||
  !Array.isArray(roots)||!Array.isArray(prev)||
  roots.length!==s.targetRootCount||prev.length!==s.parentRootCount||
  new Set(roots).size!==roots.length||new Set(prev).size!==prev.length||
  c80R31Scene752RootsFnv32(roots)!==s.targetRootFnv32||
  c80R31Scene752RootsFnv32(prev)!==s.parentRootFnv32||
  !exactly(roots,[...prev,s.newRoot])||
  e?.scope!=='HIGH-TEHTÄVÄT-1911R22-L14-K8-RK142-D2F-WINE'||
  e?.sourceParentSceneIndex!==s.parentScene||
  e?.sourceParentGLBSHA256!==s.parentGLBSHA256||
  e?.sourceCircuitBreakerNode!==s.breaker||
  e?.sourceWineDeviceRoot!==s.wine||
  e?.addedRoot!==s.newRoot||e?.addedMeshNode!==s.newLeaf||
  e?.sourceRole!=='2014_15_PLAN_ONLY'||
  e?.warning!=='SCHEMATIC_VISUAL_ONLY - route points approximate review convention, not real installed wiring'||
  e?.physicalCableConnectionVerified!==false||
  e?.sourceLinksBoundForOutputSHA!==false||
  e?.current!==false||e?.asBuilt!==false||e?.humanReview!=='NOT_RUN'||
  root?.name!=='K8_R31_RK14_2_2015_SOURCE_ASSOCIATION_OPTIN_ROOT'||
  !exactly(root?.children,[s.newLeaf])||
  r?.stage!=='WORK_TEST_HOST_HOLD'||
  r?.sourceParentSceneIndex!==s.parentScene||
  r?.sourceParentGLBSHA256!==s.parentGLBSHA256||
  r?.outputSceneRole!=='VISUAL_PLAN_ONLY_NOT_REAL_CABLE'||
  r?.breakerNode!==s.breaker||r?.wineCoolerRoot!==s.wine||
  r?.physicalConnectionVerified!==false||
  r?.sourceLinksBoundForOutputSHA!==false||r?.humanReview!=='NOT_RUN'||
  leaf?.mesh!==s.newMesh||
  l?.stage!=='WORK_TEST_HOST_HOLD'||l?.m5System!=='SAHKO'||
  l?.circuitId!=='RK14.2'||l?.['2015DeviceLabel']!=='Viinikaappi'||
  l?.circuitRating!=='C10'||l?.sourceCircuitBreakerNode!==s.breaker||
  l?.sourceProductRootNode!==s.wine||
  l?.sourceIslandBodyNode!==s.island||
  l?.sourceBoardEnclosureNode!==s.board||
  l?.visualGeometryRole!=='SCHEMATIC_ASSOCIATION_DIAGRAM_NON_PHYSICAL'||
  l?.physicalWiringRouteVerified!==false||
  l?.cableLengthIsNotMeaningful!==true||
  l?.['2026CircuitConnectionVerified']!==false||
  l?.hostGeometryVerified!==false||
  l?.CURRENT!==false||l?.asBuilt!==false||
  l?.HUMAN_REVIEW!=='NOT_RUN'||
  l?.sourceLinksBoundForOutputSHA!==false)return false;
 for(const refs of [r?.sourceLinks,l?.sourceLinks]){
  if(!Array.isArray(refs)||refs.length!==2||
   refs[0]?.docId!=='DOC:'+s.circuitSourceId||
   refs[1]?.docId!=='DOC:'+s.routingSourceId||
   refs[0]?.role!=='2014_2015_circuit_label_source'||
   refs[1]?.role!=='2015_routing_plan')return false;
 }
 return true;
}
export function c80R31RK142SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31RK142Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
  physicalCableRouteVerified:false,physicalConnectionVerified:false,
 });
}


/**
 * Independent, SHA-bound original __scene763 for RK14.3 2015 hood C10.
 * IMPORTANT: RK14.2 wine cooler also has scene index 763 in another GLB.
 * This is a read-only WORK_TEST/HOST_HOLD receipt, NOT installed wiring.
 */
export const C80_R31_RK143_SOURCE=Object.freeze({
 role:'RK14_3_HOOD_2015_SCHEMATIC_ONLY',
 sceneIndex:763,
 sceneName:'Ylisrinne_C80_R31_RK14_3_LIESITUULETIN_2015_LOGICAL_CIRCUIT_WORK_TEST_HOST_HOLD__scene763',
 glbSha256:'02f21add60b0fabba1a3884ab55d7d6941e819466deaf8772dd6a1a99d68a693',
 glbBytes:63729524,
 zipDriveId:'1kM9m6dwbeWgiuZJ06aZkSdDNIH_nNXn2',
 zipSha256:'07d9f7516fed1b94dfb07c2e14dcd8e4291ad4283f9f285afe1b232241b4aee3',
 sceneCount:764,nodeCount:13499,meshCount:5167,materialCount:813,
 accessorCount:11262,bufferViewCount:11268,defaultScene:292,
 parentScene:761,
 parentSceneName:'H1911-3_R31_VM20_WC_ACCESS_CLOSED_WORK_TEST_HOST_HOLD__scene761',
 parentGlbSha256:'8ce36626b5a9133091076721cac6940c9dbb5b47e3dad719508d20dde3b4f0de',
 parentRootCount:495,parentRootFnv32:'da71cd8f',
 targetRootCount:496,targetRootFnv32:'166b4e6f',
 newNode:13498,newMesh:5166,originalPanel:12412,originalHood:12622,
 circuitSourceId:'1-dioYKOAol67GyH0rl5cQ-omRcoeWAkP',
 planSourceId:'1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
 parentZipDriveId:'1aLLTVDoKfqTSHVa64unEjYLJ5i9XF7AB',
});
export function isC80R31RK143Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_RK143_SOURCE,a=json?.asset?.extras;
 if(authenticatedSha!==s.glbSha256||sceneIndex!==s.sceneIndex||
  role!==s.role||(floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||
  a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[sceneIndex],parent=json.scenes[s.parentScene];
 const roots=target?.nodes,prior=parent?.nodes,e=target?.extras;
 const node=json.nodes[s.newNode],n=node?.extras,links=n?.sourceLinks;
 if(parent?.name!==s.parentSceneName||target?.name!==s.sceneName||
  !Array.isArray(roots)||!Array.isArray(prior)||
  prior.length!==s.parentRootCount||roots.length!==s.targetRootCount||
  new Set(prior).size!==prior.length||new Set(roots).size!==roots.length||
  c80R31Scene752RootsFnv32(prior)!==s.parentRootFnv32||
  c80R31Scene752RootsFnv32(roots)!==s.targetRootFnv32||
  !exactly(roots,[...prior,s.newNode])||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.sourceSceneIndex!==s.parentScene||
  e?.sourceGLBSHA256!==s.parentGlbSha256||
  e?.circuit2015!=='RK14.3'||
  e?.deviceExistingNode!==s.originalHood||
  e?.panelExistingNode!==s.originalPanel||
  e?.routeVisualRoot!==s.newNode||
  e?.newPhysicalElectricalCableClaims!==0||
  e?.visualDiagramOnly!==true||
  e?.physical2026ConnectionsVerified!==false||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.productionWebGL!=='NOT_RUN'||e?.HUMAN_REVIEW!=='NOT_RUN'||
  node?.name!=='D2F_RK14_3_2015_LIESITUULETIN_TO_SAVO_LOGICAL_DIAGRAM_WORK_TEST_HOST_HOLD'||
  node?.mesh!==s.newMesh||n?.m5System!=='SAHKO'||
  n?.circuitId!=='RK14.3'||n?.sourceRole!=='HISTORICAL_2015_GROUP_TO_EXISTING_2026_HOOD_VISUAL'||
  n?.stage!=='WORK_TEST_HOST_HOLD'||n?.WORK_TEST!==true||
  n?.HOST_HOLD!==true||n?.current!==false||n?.asBuilt!==false||
  n?.HUMAN_REVIEW!=='NOT_RUN'||n?.productionWebGL!=='NOT_RUN'||
  n?.sourceLinksOutputSHA!=='NOT_BOUND'||
  n?.physical2026GroupVerified!==false||
  n?.actualCableRouteVerified!==false||
  n?.endToEndConductorContinuityVerified!==false||
  n?.electricalSafetyApproval!==false||
  n?.schematicOnly!==true||
  n?.sourceSceneIndex!==s.parentScene||
  n?.originalGLBSHA256!==s.parentGlbSha256||
  n?.panelVisualNode!==s.originalPanel||
  n?.hoodVisualRoot!==s.originalHood||
  n?.physicalCableHost!=='NOT_SURVEYED'||
  n?.exactCeilingPenetration!=='NOT_VERIFIED'||
  n?.newElectricalConnectionsVerified!==0||
  !Array.isArray(links)||links.length!==3||
  links[0]?.role!=='HISTORICAL_2015_CIRCUIT_LABEL'||
  links[0]?.link!=='https://drive.google.com/file/d/'+s.circuitSourceId+'/view'||
  links[1]?.role!=='HISTORICAL_2015_PLAN_CALLOUT'||
  links[1]?.link!=='https://drive.google.com/file/d/'+s.planSourceId+'/view'||
  links[2]?.role!=='EXACT_PARENT_GLTF_SOURCE'||
  links[2]?.link!=='https://drive.google.com/file/d/'+s.parentZipDriveId+'/view')return false;
 return true;
}
export function c80R31RK143SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31RK143Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
  current:false,asBuilt:false,physicalHostVerified:false,
  physicalCableVerified:false,electricalSafetyVerified:false,
 });
}


/**
 * Original R31 scene765 = 2015 RK14.2/RK14.3 schematic circuits plus the
 * 2026 owner-photo Savo I7603 right keypad. The exact GLB SHA is mandatory:
 * scene765 alone is not a source identity. This is SOURCE_ONLY, not mounting
 * a view, authorizing an electrical connection or publishing an as-built.
 */
export const C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE=Object.freeze({
 role:'RK14_2_RK14_3_MJ83_RIGHT_KEYPAD_2015_PLAN_2026_PHOTO',sceneIndex:765,
 glbSha256:'1176509e91a5677561476a6a6ca84725b79fd9f2000b6cc2b0a89276f81856a6',
 glbBytes:63763368,zipDriveId:'1oGqzL-P-AOBnE2gGflEUNg8AvmKT-ZGM',
 zipSha256:'1e38a71ddc4d304350486b9b3691bed62494e610c0e311de39e2ffab8d544a9f',
 sceneName:'Ylisrinne_C80_R31_RK14_2_RK14_3_MJ83_RIGHT_KEYPAD_COFIT_2015_PLAN_2026_PHOTO_WORK_TEST_HOST_HOLD__scene765',
 parentSceneName:'Ylisrinne_C80_R31_RK14_2_WINE_RK14_3_HOOD_COMBINED_2015_SCHEMA_WORK_TEST_HOST_HOLD__scene764',
 sceneCount:766,nodeCount:13503,meshCount:5168,materialCount:814,
 accessorCount:11265,bufferViewCount:11271,defaultScene:292,
 parentScene:764,parentRootCount:497,parentRootFnv32:'957cc832',
 targetRootCount:498,targetRootFnv32:'dfc19064',
 parentGlbSha256:'ff283855c3a1160021562b87d918bb98963f06d4844984f6e343c83c2e868017',
 mj83CofitGlbSha256:'99aaa0b9c633e6968a1b964b8b2d7e5abbfa1441d713f82f87d664789be3c6ba',
 mj83OriginalGlbSha256:'dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56',
 newPanelRoot:13502,newPanelLeaf:13501,reusedPanelMesh:4540,
 wineRoot:13499,hoodRoot:13500,
});
export function isC80R31Scene765RK142RK143MJ83Source(json,authenticatedSha,sceneIndex,role,floor){
 const s=C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE,a=json?.asset?.extras;
 if(authenticatedSha!==s.glbSha256||sceneIndex!==s.sceneIndex||role!==s.role||
  (floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||json?.scenes?.length!==s.sceneCount||
  json?.nodes?.length!==s.nodeCount||json?.meshes?.length!==s.meshCount||
  json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||
  a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const parent=json.scenes[s.parentScene],target=json.scenes[sceneIndex];
 const prev=parent?.nodes,roots=target?.nodes,e=target?.extras,p=parent?.extras;
 const r=json.nodes[s.newPanelRoot],leaf=json.nodes[s.newPanelLeaf];
 const x=r?.extras,y=leaf?.extras;
 if(parent?.name!==s.parentSceneName||target?.name!==s.sceneName||
  !Array.isArray(prev)||!Array.isArray(roots)||
  prev.length!==s.parentRootCount||roots.length!==s.targetRootCount||
  new Set(prev).size!==prev.length||new Set(roots).size!==roots.length||
  c80R31Scene752RootsFnv32(prev)!==s.parentRootFnv32||
  c80R31Scene752RootsFnv32(roots)!==s.targetRootFnv32||
  !exactly(roots,[...prev,s.newPanelRoot])||
  !roots.includes(s.wineRoot)||!roots.includes(s.hoodRoot)||
  !exactly(p?.circuitIds,['RK14.2','RK14.3'])||
  p?.sourceRole!=='2014_15_TWO_SEPARATE_PLAN_ONLY_CIRCUITS'||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.WORK_TEST!==true||e?.HOST_HOLD!==true||
  e?.sourceRole!=='2014_15_TWO_SEPARATE_PLAN_ONLY_CIRCUITS'||
  !exactly(e?.circuitIds,['RK14.2','RK14.3'])||
  e?.renderedCableRoutes!=='DIAGRAM_ONLY_NOT_INSTALLED'||
  e?.physical2026GroupConnectionVerified!==false||
  e?.actualCableRouteVerified!==false||e?.electricalSafetyApproval!==false||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||e?.sourceLinksOutputShaBound!==false||
  e?.productionWebGL!=='NOT_RUN'||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false||
  r?.name!=='C80_R31_RK142_RK143_MJ83_OWNER_KEYPAD_COFIT_OPTIN_ROOT'||
  !exactly(r?.children,[s.newPanelLeaf])||
  x?.cofitBaseGLBSHA256!==s.parentGlbSha256||
  x?.cofitBaseSceneIndex!==s.parentScene||
  x?.cofitSourceGLBSHA256!==s.mj83CofitGlbSha256||
  x?.cofitSourceSceneIndex!==762||
  x?.sourceMJ83GLBSHA256!==s.mj83OriginalGlbSha256||
  x?.photoGeometryOwnerRelativeOnly!==true||
  x?.sourceLinksBoundForNewSHA!==false||
  x?.current!==false||x?.asBuilt!==false||
  leaf?.mesh!==s.reusedPanelMesh||
  y?.visualRole!=='SAVO_I7603_OWNER_RIGHT_KEYPAD'||
  y?.cofitSourceGLBSHA256!==s.mj83CofitGlbSha256||
  y?.cofitSourceNode!==13497||
  y?.sourceDonorGLBSha256!==s.mj83OriginalGlbSha256||
  y?.sourceLinksBoundForNewSHA!==false||
  y?.WORK_TEST!==true||y?.current!==false||y?.asBuilt!==false)return false;
 return true;
}
export function c80R31Scene765RK142RK143MJ83SourceReceipt(json,authenticatedSha,sceneIndex,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene765RK142RK143MJ83Source(json,authenticatedSha,sceneIndex,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
  physicalHostVerified:false,physicalCableVerified:false,electricalSafetyVerified:false,
 });
}

/** Source-only SHA gate for R31 __scene766: 2015 circuit diagrams,
 * 2026 Savo keypad, and VM20 CLOSED. No runtime/as-built authorization. */
export const C80_R31_SCENE766_CLOSED_VM20_SOURCE=Object.freeze({
 role:'RK14_2_RK14_3_MJ83_VM20_ACCESS_CLOSED_2015_PLAN_2026_PHOTO',
 sceneIndex:766,
 glbSha256:'6cf2923afaa2b7b0a5028a13465ba13071bd8d9c612885e978d40d1e51904e1d',
 glbBytes:63768192,zipDriveId:'1eP8alIGRVv7w5OfpO1NbKD3U5SG-Mqek',
 zipSha256:'fa65d1cb3df6ed9d55bebd5f85400d4e9049e34da67c7d42cf9764e9a431746c',
 sceneName:'Ylisrinne_C80_R31_RK142_RK143_MJ83_SAVO_VM20_ACCESS_CLOSED_2015_PLAN_2026_PHOTO_WORK_TEST_HOST_HOLD__scene766',
 parentSceneName:C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE.sceneName,
 closedSceneName:'H1911-3_R31_VM20_WC_ACCESS_CLOSED_WORK_TEST_HOST_HOLD__scene761',
 sceneCount:767,nodeCount:13503,meshCount:5168,materialCount:814,
 accessorCount:11265,bufferViewCount:11271,defaultScene:292,
 parentScene:765,parentRootCount:498,parentRootFnv32:'dfc19064',
 rootCount:498,rootFnv32:'aee109ba',
 parentGlbSha256:C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE.glbSha256,
 parentZipDriveId:C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE.zipDriveId,
 closedSourceScene:761,closedSourceRootFnv32:'da71cd8f',
 openRoot:13497,closedRoot:13167,openLeaf:13496,closedLeaf:1727,
 wineRoot:13499,hoodRoot:13500,panelRoot:13502,
});
export function isC80R31Scene766ClosedVm20Source(json,sha,index,role,floor){
 const s=C80_R31_SCENE766_CLOSED_VM20_SOURCE,asset=json?.asset?.extras;
 if(sha!==s.glbSha256||index!==s.sceneIndex||role!==s.role||
  (floor!==undefined&&floor!=='BOTH')||json?.scene!==s.defaultScene||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[index],parent=json.scenes[s.parentScene];
 const source=json.scenes[s.closedSourceScene],r=target?.nodes,p=parent?.nodes,e=target?.extras;
 if(target?.name!==s.sceneName||parent?.name!==s.parentSceneName||
  source?.name!==s.closedSceneName||!Array.isArray(r)||!Array.isArray(p)||
  r.length!==s.rootCount||p.length!==s.parentRootCount||
  new Set(r).size!==r.length||new Set(p).size!==p.length||
  c80R31Scene752RootsFnv32(r)!==s.rootFnv32||
  c80R31Scene752RootsFnv32(p)!==s.parentRootFnv32||
  c80R31Scene752RootsFnv32(source?.nodes)!==s.closedSourceRootFnv32||
  p.filter(x=>x===s.openRoot).length!==1||
  !exactly(r,p.map(x=>x===s.openRoot?s.closedRoot:x))||
  !source?.nodes?.includes(s.closedRoot)||r.includes(s.openRoot)||
  ![s.closedRoot,s.wineRoot,s.hoodRoot,s.panelRoot].every(x=>r.includes(x))||
  json.nodes[s.closedLeaf]?.mesh!==833||json.nodes[s.openLeaf]?.mesh!==833||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.WORK_TEST!==true||e?.HOST_HOLD!==true||
  e?.sourceRole!=='2014_15_TWO_SEPARATE_PLAN_ONLY_CIRCUITS'||
  !exactly(e?.circuitIds,['RK14.2','RK14.3'])||
  e?.renderedCableRoutes!=='DIAGRAM_ONLY_NOT_INSTALLED'||
  e?.sourceDriveId!==s.parentZipDriveId||
  e?.sourceGlbSha256!==s.parentGlbSha256||e?.sourceSceneIndex!==s.parentScene||
  e?.vm20AccessView!=='CLOSED'||e?.vm20ClosedNode!==s.closedLeaf||
  e?.vm20OriginalClosedRoot!==s.closedRoot||
  e?.vm20OpenNodeOff!==s.openLeaf||e?.originRootOpenOff!==s.openRoot||
  e?.sourceLinksForNewShaBound!==false||
  e?.sourceLinksOutputSHA!=='NOT_BOUND'||e?.sourceLinksOutputShaBound!==false||
  e?.physical2026GroupConnectionVerified!==false||
  e?.actualCableRouteVerified!==false||e?.electricalSafetyApproval!==false||
  e?.productionWebGL!=='NOT_RUN'||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false||
  e?.isCurrent!==false)return false;
 return true;
}
export function c80R31Scene766ClosedVm20Receipt(json,sha,index,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene766ClosedVm20Source(json,sha,index,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
  physicalHostVerified:false,physicalCableVerified:false,
  electricalSafetyVerified:false,physicalHatchOpeningVerified:false,
 });
}

/**
 * Original standalone R31 __scene767 is a historical/2F WORK_TEST review:
 * L12 V75/V110 inboard waste + 2015 RK14.2/RK14.3 schematic circuits +
 * 2026 photo-derived MJ83 panel. It rebases scene743 (NOT scene766's
 * BOTH roots), so no modern R300/roof/VM20 2F parity is asserted.
 * Read-only SHA-authenticated receipt, never a viewer/publisher binding.
 */
export const C80_R31_SCENE767_2F_L12_RK14_MJ83_SOURCE=Object.freeze({
 role:'R31_2F_L12_WASTE_RK142_RK143_MJ83_SOURCE_REVIEW',
 sceneIndex:767,
 glbSha256:'9546f3beaa260b24e3396820b216303430e3958c1f9741c41f8fc61b864506cd',
 glbBytes:63793084,
 zipDriveId:'13Djv8gzf4vE8jWdxDsYBSiYlzhZS8ub2',
 zipSha256:'742c435ea4e40ab69d7d67399832de50efa9ce492a2a3fa5a730226c2c677eb3',
 sceneName:'Ylisrinne_C80_R31_2F_L12_V75V110_RK142_RK143_SAVO_MJ83_REVIEW_WORK_TEST_HOST_HOLD__scene767',
 sceneCount:768,nodeCount:13506,meshCount:5168,materialCount:814,
 accessorCount:11265,bufferViewCount:11271,defaultScene:292,
 source2FScene:743,source2FSceneName:'C80_R31_R30_G2S13_D_WEST_GABLE_2_SOURCE_PRESENCE_2F_OFF_OPTIN_WORK_TEST_HOST_HOLD__scene743',
 source2FRootCount:199,source2FRootFnv32:'e89d7b8b',
 rootCount:202,rootFnv32:'aeef8956',
 baseScene:766,baseGlbSha256:'6cf2923afaa2b7b0a5028a13465ba13071bd8d9c612885e978d40d1e51904e1d',
 baseDriveId:'1eP8alIGRVv7w5OfpO1NbKD3U5SG-Mqek',
 donorGlbSha256:'1a05de4ad49cdd43b445ee807c19d7759f3b54f8363da305d1b10bf0d376832a',
 donorDriveId:'1PYtojF_ny9NXBsY8qiDV00r6a4cMcUqs',
 old2FRoot:13321,new2FRoot:13505,
 wasteLeaves:[13503,13504],wasteMeshes:[4991,3702],
 preservedReviewRoots:[13499,13500,13502],
});
export function isC80R31Scene767Source(json,sha,index,role,floor){
 const s=C80_R31_SCENE767_2F_L12_RK14_MJ83_SOURCE,asset=json?.asset?.extras;
 if(sha!==s.glbSha256||index!==s.sceneIndex||role!==s.role||
  (floor!==undefined&&floor!=='2F')||json?.scene!==s.defaultScene||
  json?.scenes?.length!==s.sceneCount||json?.nodes?.length!==s.nodeCount||
  json?.meshes?.length!==s.meshCount||json?.materials?.length!==s.materialCount||
  json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
  asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const target=json.scenes[index],source=json.scenes[s.source2FScene];
 const roots=target?.nodes,prior=source?.nodes,e=target?.extras;
 if(target?.name!==s.sceneName||source?.name!==s.source2FSceneName||
  !Array.isArray(roots)||!Array.isArray(prior)||
  roots.length!==s.rootCount||prior.length!==s.source2FRootCount||
  new Set(roots).size!==roots.length||new Set(prior).size!==prior.length||
  c80R31Scene752RootsFnv32(roots)!==s.rootFnv32||
  c80R31Scene752RootsFnv32(prior)!==s.source2FRootFnv32||
  prior.filter(x=>x===s.old2FRoot).length!==1||
  !exactly(roots,[...prior.map(x=>x===s.old2FRoot?s.new2FRoot:x),...s.preservedReviewRoots])||
  !exactly(e?.additional2FReviewRoots,s.preservedReviewRoots)||
  !exactly(e?.circuitIds,['RK14.2','RK14.3'])||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.WORK_TEST!==true||e?.HOST_HOLD!==true||
  e?.baseOriginalDriveId!==s.baseDriveId||e?.baseOriginalGlbSHA256!==s.baseGlbSha256||
  e?.baseSceneIndex!==s.baseScene||e?.reviewSource2FSceneIndex!==s.source2FScene||
  e?.donorOriginalDriveId!==s.donorDriveId||
  e?.donorOriginalGlbSHA256!==s.donorGlbSha256||
  e?.sourceRootReplaced!==s.old2FRoot||
  e?.l12RebasedMap?.['13500']!==s.wasteLeaves[0]||
  e?.l12RebasedMap?.['13501']!==s.wasteLeaves[1]||
  e?.l12RebasedMap?.['13502']!==s.new2FRoot||
  e?.twoSchematics!=='2015 RK14.2 VIINIKAAPPI + RK14.3 SAVO PLAN ONLY'||
  e?.keypad!=='MJ83 2026 owner photo'||
  e?.fullLatestR3002FParity!==false||e?.physicalDrainJoint!==false||
  e?.physicalCircuitRouting!==false||e?.newMeshes!==0||
  e?.newPhysicalPipes!==0||e?.sourceLinksOutputSHA!=='NOT_BOUND'||
  e?.sourceLinksOutputShaBound!==false||e?.sourceLinksOutputSHABound!==false||
  e?.published!==false||e?.productionWebGL!=='NOT_RUN'||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.current!==false||e?.asBuilt!==false||e?.canonical!==false||
  e?.physicalJointVerified!==false||e?.physicalInstallationVerified!==false||
  e?.physicalRouteVerified!==false)return false;
 const root=json.nodes[s.new2FRoot],rex=root?.extras;
 if(root?.mesh!==undefined||!Array.isArray(root?.children)||
  !s.wasteLeaves.every(x=>root.children.includes(x))||
  rex?.original2FRoot!==s.old2FRoot||rex?.semanticOnlyNoGeometryChange!==true||
  rex?.hostHold!==true||rex?.physicalConnectionsVerified!==0||
  rex?.sourceLinksBoundForOutputSHA!==false||rex?.current!==false||
  rex?.asBuilt!==false)return false;
 for(let i=0;i<s.wasteLeaves.length;i++){
  const n=json.nodes[s.wasteLeaves[i]],x=n?.extras;
  if(n?.mesh!==s.wasteMeshes[i]||x?.m5System!=='VIEMARI'||
   x?.rebasedFromDonorDriveID!=='1oD0iFOK0K5XtB2SSnStV874B2txVfckv'||
   x?.sourceDonorGlbSHA256!==s.donorGlbSha256||
   x?.sourceDonorDriveId!==s.donorDriveId||
   x?.rebasedFromL12DonorNode!==13495+i||
   x?.hostHold!==true||x?.physicalConnectionsVerified!==0||
   x?.physicalJointVerified!==false||x?.sourceLinksBoundForOutputSHA!==false||
   x?.current!==false||x?.asBuilt!==false)return false;
 }
 return true;
}
export function c80R31Scene767SourceReceipt(json,sha,index,role,floor){
 return Object.freeze({
  exactSource:isC80R31Scene767Source(json,sha,index,role,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
  latest2FParityVerified:false,physicalWasteConnectionVerified:false,
  electricalSafetyVerified:false,
 });
}
