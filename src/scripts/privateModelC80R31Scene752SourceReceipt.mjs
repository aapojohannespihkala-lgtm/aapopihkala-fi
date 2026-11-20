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
