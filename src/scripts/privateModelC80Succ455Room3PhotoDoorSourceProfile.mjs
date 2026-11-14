/**
 * Source-only exact receipt for the completed SUCC455 + ROOM3 owner-photo door
 * WORK_TEST/HOST_HOLD COW. Never call this a CURRENT/as-built model or publish it.
 * The sha argument MUST be measured from the complete authenticated GLB bytes.
 */
export const C80_SUCC455_ROOM3_GLB_SHA256 = 'dbb310a015a545d4c2b3ca4175265adc1f6bc7be3fb06d840f921491e572162f';
export const C80_SUCC455_ROOM3_GLB_BYTES = 54926032;
export const C80_SUCC455_ROOM3_ZIP_SHA256 = 'a24a6d096349def1259edd0d4b57f2f6d21cb0b7371f3bc1b1994ca48865bc6e';
export const C80_SUCC455_ROOM3_ZIP_DRIVE_ID = '1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl';
export const C80_SUCC455_ROOM3_PARENT_GLB_SHA256 = 'f990edd8ddd8277abfd419ab72b424ee360aba462739bda19fab44341c159353';
export const C80_SUCC455_ROOM3_PARENT_ZIP_DRIVE_ID = '1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE';
export const C80_SUCC455_ROOM3_DONOR_GLB_SHA256 = '5c35a5e4d8d6ee52db6352461121df5037838a7b6526452391a2c07507354d33';
export const C80_SUCC455_ROOM3_DONOR_ZIP_DRIVE_ID = '1izRtVEQzVSjxp6e6ezejTh_RdCMUZFXz';
export const C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND = false;
export const C80_SUCC455_ROOM3_PUBLISH_ALLOWED = false;
export const C80_SUCC455_ROOM3_PRODUCTION_WEBGL_VERIFIED = false;
export const C80_SUCC455_ROOM3_HUMAN_REVIEW = 'NOT_RUN';

// glTF internal scene indices, never the ZIP filename suffix. Source scene
// 460..466 preserved; precisely one root pointer 10837 -> 12222 at index 78/324.
const rows = [
  [469,460,'2F',185,78,'e31c32ee',411],
  [470,461,'BOTH',467,324,'bddf3b00',412],
  [471,462,'2F',185,78,'61f8fbc2',413],
  [472,463,'BOTH',467,324,'88b3ece2',414],
  [473,464,'2F',185,78,'670f7d2e',415],
  [474,465,'BOTH',467,324,'6441901a',416],
  [475,466,'BOTH',467,324,'59f05f11',418],
];
export const C80_SUCC455_ROOM3_SCENES = Object.freeze(Object.fromEntries(rows.map(
  ([scene,parentScene,floor,rootCount,replaceAt,rootFnv,sourceSceneIndex]) =>
    [scene,Object.freeze({scene,parentScene,floor,rootCount,replaceAt,rootFnv,sourceSceneIndex,
      name:'C80_SUCC455_ROOM3_PHOTO_DOOR_COFIT_'+floor+'_FROM_SCENE'+parentScene+'_WORK_TEST_HOST_HOLD'})]
)));
export function c80Succ455Room3RootFnv32(ids) {
  if(!Array.isArray(ids)) return null;
  let h=2166136261;
  for(const id of ids){if(!Number.isInteger(id)||id<0) return null;h=Math.imul(h^id,16777619)>>>0;}
  return h.toString(16).padStart(8,'0');
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const descendants=(json,roots)=>{
  const visited=new Set(),stack=[...roots];
  while(stack.length){
    const id=stack.pop();
    if(!Number.isInteger(id)||id<0||id>=json.nodes.length||visited.has(id))continue;
    visited.add(id);
    const kids=json.nodes[id]?.children;
    if(Array.isArray(kids))stack.push(...kids);
  }
  return visited;
};
/** Exactly the seven independently source-locked new scenes, fail closed. */
export function isC80Succ455Room3PhotoDoorSourceScene(json,authenticatedGlbSha256,sceneIndex,floor) {
  const spec=C80_SUCC455_ROOM3_SCENES[sceneIndex];
  if(authenticatedGlbSha256!==C80_SUCC455_ROOM3_GLB_SHA256 || !spec ||
    (floor!==undefined && floor!==spec.floor) ||
    !json || json.scene!==292 || json.scenes?.length!==476 ||
    json.nodes?.length!==12223 || json.meshes?.length!==4601)return false;
  const s=json.scenes[sceneIndex],parent=json.scenes[spec.parentScene];
  const roots=s?.nodes,original=parent?.nodes,e=s?.extras;
  if(s?.name!==spec.name || !Array.isArray(roots)||roots.length!==spec.rootCount ||
     !Array.isArray(original)||original.length!==roots.length ||
     c80Succ455Room3RootFnv32(roots)!==spec.rootFnv ||
     original[spec.replaceAt]!==10837||roots[spec.replaceAt]!==12222 ||
     !roots.every((v,i)=>i===spec.replaceAt||v===original[i]) ||
     !e ||e.stage!=='WORK_TEST_HOST_HOLD'||e.status!=='WORK_TEST_HOST_HOLD'||
     e.floor!==spec.floor||e.sourceSceneIndex!==spec.sourceSceneIndex||
     e.sourceScene!==spec.parentScene||e.newCOWRootNode!==12222||
     e.newDoorLeaf!==12195||e.oldDoorLeafHiddenInThisSceneOnly!==8028||
     e.sourceSUCC455ZIPDriveID!==C80_SUCC455_ROOM3_PARENT_ZIP_DRIVE_ID||
     e.sourceSUCC455GLBSHA256!==C80_SUCC455_ROOM3_PARENT_GLB_SHA256||
     e.photoDoorDonorZIPDriveID!==C80_SUCC455_ROOM3_DONOR_ZIP_DRIVE_ID||
     e.photoDoorDonorGLBSHA256!==C80_SUCC455_ROOM3_DONOR_GLB_SHA256||
     e.sourceLinks!=='NOT_BOUND'||e.sourceLinksBound!==false||
     e.sourceLinksBindingVerified!==false||e.productionWebGLVerified!==false||
     e.current!==false||e.asBuilt!==false||e.notPhysicalAsBuilt!==true||
     e.notVisibleStairTransferGrilles!==true||
     !equal(json.nodes[12222]?.children,[12221]) ||
     json.nodes[12195]?.mesh!==4577||json.nodes[12218]?.mesh!==4600)return false;
  const reach=descendants(json,roots);
  if(reach.has(8028)||[10156,10157,10158,10159].some(n=>reach.has(n)))return false;
  for(let i=12195;i<=12222;i++)if(!reach.has(i))return false;
  return true;
}
export const c80Succ455Room3SourceReceipt=(json,sha,sceneIndex,floor)=>Object.freeze({
  exactSource:isC80Succ455Room3PhotoDoorSourceScene(json,sha,sceneIndex,floor),
  sourceLinksBound:false,publishAllowed:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD'
});
