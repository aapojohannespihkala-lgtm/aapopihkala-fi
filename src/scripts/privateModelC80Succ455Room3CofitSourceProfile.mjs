// Immutable source identity for the SUCC455 + ROOM3 photo-door cofit.
// Standalone receipt only: no Work Test registration, sourceLinks binding, publishing,
// CURRENT/as-built or authenticated production WebGL approval.
// authenticatedSha MUST be derived from all bytes of the loaded GLB, not a filename.
export const C80_SUCC455_ROOM3_GLB_SHA256 = 'dbb310a015a545d4c2b3ca4175265adc1f6bc7be3fb06d840f921491e572162f';
export const C80_SUCC455_ROOM3_GLB_BYTES = 54926032;
export const C80_SUCC455_ROOM3_ZIP_SHA256 = 'a24a6d096349def1259edd0d4b57f2f6d21cb0b7371f3bc1b1994ca48865bc6e';
export const C80_SUCC455_ROOM3_ZIP_DRIVE_ID = '1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl';
export const C80_SUCC455_ROOM3_SOURCE_ZIP_ID = '1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE';
export const C80_SUCC455_ROOM3_SOURCE_GLB_SHA256 = 'f990edd8ddd8277abfd419ab72b424ee360aba462739bda19fab44341c159353';
export const C80_SUCC455_ROOM3_DONOR_ZIP_ID = '1izRtVEQzVSjxp6e6ezejTh_RdCMUZFXz';
export const C80_SUCC455_ROOM3_DONOR_GLB_SHA256 = '5c35a5e4d8d6ee52db6352461121df5037838a7b6526452391a2c07507354d33';
export const C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND = false;
export const C80_SUCC455_ROOM3_PUBLISH_ALLOWED = false;
export const C80_SUCC455_ROOM3_HUMAN_REVIEW = 'NOT_RUN';
export const C80_SUCC455_ROOM3_PRODUCTION_WEBGL = 'NOT_RUN';

// Actual raw glTF scene indices, NOT archive filename __scene470.
// index, predecessor scene, floor, glazing, cutaway, root count, ordered FNV32,
// original 2015 source scene index. 1F scenes 467/468 are unchanged and are
// intentionally NOT newly numbered in this 2F/BOTH cofit.
const rows = [
  [469,460,'2F','CLOSED',false,185,'e31c32ee',411],
  [470,461,'BOTH','CLOSED',false,467,'bddf3b00',412],
  [471,462,'2F','ONE_OPEN',false,185,'61f8fbc2',413],
  [472,463,'BOTH','ONE_OPEN',false,467,'88b3ece2',414],
  [473,464,'2F','STACKED',false,185,'670f7d2e',415],
  [474,465,'BOTH','STACKED',false,467,'6441901a',416],
  [475,466,'BOTH','CLOSED',true,467,'59f05f11',418],
];
export const C80_SUCC455_ROOM3_SCENES = Object.freeze(Object.fromEntries(rows.map(
  ([index,sourceScene,floor,glazing,cutaway,rootCount,rootFnv,sourceSceneIndex]) => [
    index,Object.freeze({
      index,sourceScene,floor,glazing,cutaway,rootCount,rootFnv,sourceSceneIndex,
      name:'C80_SUCC455_ROOM3_PHOTO_DOOR_COFIT_'+floor+'_FROM_SCENE'+sourceScene+'_WORK_TEST_HOST_HOLD',
    }),
  ]
)));

export function c80Succ455Room3RootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let h=2166136261;
  for (const n of ids) {
    if (!Number.isInteger(n)||n<0) return null;
    h=Math.imul(h^n,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}

function sourceReachable(nodes,roots) {
  const seen=new Set(),stack=[...roots];
  while(stack.length) {
    const n=stack.pop();
    if(!Number.isInteger(n)||n<0||n>=nodes.length||!nodes[n]) return null;
    if(seen.has(n))continue;
    seen.add(n);
    const children=nodes[n].children;
    if(children!==undefined){
      if(!Array.isArray(children))return null;
      stack.push(...children);
    }
  }
  return seen;
}

// Fail closed if the complete authenticated GLB identity, source scene, ordered
// roots, actual donor tree, preserved other doors, or HOST_HOLD gates drift.
export function isC80Succ455Room3CofitSourceScene(glb,authenticatedSha,index,floor=null) {
  const s=C80_SUCC455_ROOM3_SCENES[index],scene=glb?.scenes?.[index],e=scene?.extras;
  if(authenticatedSha!==C80_SUCC455_ROOM3_GLB_SHA256||!s||
     (floor!==null&&floor!==s.floor)||glb?.scene!==292||
     glb?.scenes?.length!==476||glb?.nodes?.length!==12223||
     glb?.meshes?.length!==4601||
     glb?.asset?.extras?.ModelStage!=='WORK_TEST'||
     glb?.asset?.extras?.current!==false||
     glb?.asset?.extras?.asBuilt!==false||
     glb?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
     scene?.name!==s.name||!Array.isArray(scene?.nodes)||
     scene.nodes.length!==s.rootCount||
     new Set(scene.nodes).size!==s.rootCount||
     c80Succ455Room3RootFnv32(scene.nodes)!==s.rootFnv||
     e?.floor!==s.floor||e?.sourceScene!==s.sourceScene||
     e?.sourceSceneIndex!==s.sourceSceneIndex||
     e?.stage!=='WORK_TEST_HOST_HOLD'||e?.publishState!=='HOST_HOLD'||
     e?.current!==false||e?.asBuilt!==false||
     e?.humanReview!=='NOT_RUN'||e?.productionWebGL!=='NOT_RUN'||
     e?.productionWebGLVerified!==false||e?.sourceLinksBound!==false||
     e?.sourceLinksBindingVerified!==false||
     e?.notPhysicalAsBuilt!==true||e?.ownerPhotoRelative2026!==true||
     e?.notVisibleStairTransferGrilles!==true||
     e?.photoDoorDonorZIPDriveID!==C80_SUCC455_ROOM3_DONOR_ZIP_ID||
     e?.photoDoorDonorGLBSHA256!==C80_SUCC455_ROOM3_DONOR_GLB_SHA256||
     e?.sourceSUCC455ZIPDriveID!==C80_SUCC455_ROOM3_SOURCE_ZIP_ID||
     e?.sourceSUCC455GLBSHA256!==C80_SUCC455_ROOM3_SOURCE_GLB_SHA256||
     e?.newCOWRootNode!==12222||e?.newDoorLeaf!==12195||
     e?.oldDoorLeafHiddenInThisSceneOnly!==8028) return false;
  const root=glb.nodes[12222];
  if(root?.name!=='ROOM3_OWNERPHOTO20261114_COW_2F_ROOT'||
     root?.extras?.modelStage!=='WORK_TEST'||
     root?.extras?.current!==false||root?.extras?.asBuilt!==false||
     root?.extras?.HUMAN_REVIEW!=='NOT_RUN')return false;
  const active=sourceReachable(glb.nodes,scene.nodes);
  if(!active||active.has(8028)||[10156,10157,10158,10159].some(n=>active.has(n))||
     ![8030,8031,12164,12173,12194,12195,12222].every(n=>active.has(n))||
     (s.floor==='BOTH'&&![12181,12193].every(n=>active.has(n))))return false;
  let count=0;
  for(const n of active)if(n>=12195&&n<=12222)count++;
  return count===28;
}

export function resolveC80Succ455Room3CofitSceneIndex(sha,sourceScene,floor) {
  if(sha!==C80_SUCC455_ROOM3_GLB_SHA256||!Number.isInteger(sourceScene)||
     !['2F','BOTH'].includes(floor))return null;
  const hits=Object.values(C80_SUCC455_ROOM3_SCENES).filter(
    s=>s.sourceScene===sourceScene&&s.floor===floor);
  return hits.length===1?hits[0].index:null;
}

export function c80Succ455Room3CofitSourceReceipt(glb,sha,index) {
  return Object.freeze({
    exactSource:isC80Succ455Room3CofitSourceScene(glb,sha,index),
    sourceLinksBound:false,publishAllowed:false,productionWebGL:'NOT_RUN',
    humanReview:'NOT_RUN',current:false,asBuilt:false,
  });
}
