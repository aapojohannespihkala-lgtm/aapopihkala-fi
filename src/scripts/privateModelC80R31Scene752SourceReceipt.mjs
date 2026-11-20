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
