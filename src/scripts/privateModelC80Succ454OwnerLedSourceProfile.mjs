// SUCC454: immutable, authenticated source-only 3D receiver; not a viewer registration.
// SHA must be computed by caller from ALL raw GLB bytes. Never trust filename/declared hashes.
export const SUCC454_GLB_SHA256='caad41802daa0615356dd9f4d610dc087c3d15447475721db304489072fe7c7d';
export const SUCC454_GLB_BYTES=54687172;
export const SUCC454_ZIP_SHA256='b9c4f3537716bc9842e75fcdddd1447edfa004dfd03d0fd93e2c770d3def6551';
export const SUCC454_ZIP_DRIVE_ID='1baPZkajTH1s8uVqD05lQQGM32MN9lsgt';
export const SUCC454_PARENT_GLB_SHA256='5a3d857bc08fb18cb1a992727a2409923291e5a5577d9f2e34253d3765973351';
export const SUCC454_SOURCE_ONLY=true;
export const SUCC454_SOURCE_LINKS_BOUND=false;
export const SUCC454_PUBLISH_ALLOWED=false;
export const SUCC454_PRODUCTION_WEBGL_VERIFIED=false;
export const SUCC454_HUMAN_REVIEW='NOT_RUN';
export const SUCC454_SCENES=Object.freeze({
  "453": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE446_WORK_TEST_HOST_HOLD",
    "parent": 446,
    "floor": "2F",
    "roots": 185,
    "fnv": "72d1f94d",
    "parentFnv": "6633cd82"
  },
  "454": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE447_WORK_TEST_HOST_HOLD",
    "parent": 447,
    "floor": "BOTH",
    "roots": 467,
    "fnv": "7faf3d9e",
    "parentFnv": "56d9d08f"
  },
  "455": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE448_WORK_TEST_HOST_HOLD",
    "parent": 448,
    "floor": "2F",
    "roots": 185,
    "fnv": "eea3eaed",
    "parentFnv": "623cf080"
  },
  "456": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE449_WORK_TEST_HOST_HOLD",
    "parent": 449,
    "floor": "BOTH",
    "roots": 467,
    "fnv": "8dd7aeda",
    "parentFnv": "ca131e25"
  },
  "457": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE450_WORK_TEST_HOST_HOLD",
    "parent": 450,
    "floor": "2F",
    "roots": 185,
    "fnv": "358bad15",
    "parentFnv": "6f89435a"
  },
  "458": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE451_WORK_TEST_HOST_HOLD",
    "parent": 451,
    "floor": "BOTH",
    "roots": 467,
    "fnv": "42cacf18",
    "parentFnv": "ba927a35"
  },
  "459": {
    "name": "C80_SUCC454_WC_LED_METADATA_FIXED_FROM_SCENE452_WORK_TEST_HOST_HOLD",
    "parent": 452,
    "floor": "BOTH",
    "roots": 467,
    "fnv": "d3e6bcdb",
    "parentFnv": "41250562"
  }
});
const equal=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
export function succ454RootsFnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){if(!Number.isInteger(n)||n<0)return null;h=Math.imul(h^n,16777619)>>>0;}
 return h.toString(16).padStart(8,'0');
}
export function isSucc454OwnerLedScene(gltf,authenticatedRawGLBSha,index,floor=null){
 const spec=SUCC454_SCENES[index],s=gltf?.scenes?.[index],
  parent=gltf?.scenes?.[spec?.parent],n=gltf?.nodes,m=gltf?.meshes;
 if(authenticatedRawGLBSha!==SUCC454_GLB_SHA256||!spec||!s||!parent||
  (floor!==null&&floor!==spec.floor)||
  gltf?.scene!==292||gltf?.scenes?.length!==460||n?.length!==12173||m?.length!==4577||
  gltf?.asset?.extras?.ModelStage!=='WORK_TEST'||gltf?.asset?.extras?.current!==false||
  gltf?.asset?.extras?.asBuilt!==false||gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
  s.name!==spec.name||s.extras?.floor!==spec.floor||s.extras?.stage!=='WORK_TEST_HOST_HOLD'||
  s.extras?.wcLEDRelocatedCount!==1||s.extras?.wcLEDNewCount!==0||
  s.extras?.sourceLinks!=='NOT_BOUND'||s.extras?.sourceLinksBindingVerified!==false||
  s.extras?.publishState!=='HOST_HOLD'||s.extras?.humanReview!=='NOT_RUN'||
  s.extras?.v85WhitePlinthSUCC437Cofit?.newNode!==12164||
  !Array.isArray(s.nodes)||s.nodes.length!==spec.roots||new Set(s.nodes).size!==spec.roots||
  s.nodes.some(x=>!Number.isInteger(x)||x<0||x>=12173)||
  succ454RootsFnv32(s.nodes)!==spec.fnv||
  !Array.isArray(parent.nodes)||parent.nodes.length!==spec.roots||
  succ454RootsFnv32(parent.nodes)!==spec.parentFnv)return false;
 // Exactly one substitution of WC root, not a reordered floor/scene or duplicate lamp.
 const changed=parent.nodes.map((v,i)=>[v,s.nodes[i]]).filter(([a,b])=>a!==b);
 if(changed.length!==1||changed[0][0]!==12171||changed[0][1]!==12172||
   !s.nodes.includes(12172)||s.nodes.includes(12171)||
   ![12164,12165,12166,12167,12168].every(i=>s.nodes.includes(i))||
   [11845,11856,11857,12169,12170].some(i=>s.nodes.includes(i)))return false;
 const wc=n[12172],old=n[12171],meta=wc?.extras?.metadataFixOnly;
 if(wc?.name!=='OWNER20261114_2F_LED24_P06_RELOCATED_ROOT_METADATA_FIXED_WORK_TEST_HOST_HOLD'||
   !equal(wc?.children,[11846,11847,11848,11849,11850,11851,11852,11853,11854,11855,12169,12170])||
   !equal(wc?.children,old?.children)||
   !equal(wc?.extras?.new2FWCNodes,[12169,12170])||
   !equal(old?.extras?.new2FWCNodes,[12168,12169])||
   !equal(meta?.correctedExtrasPair,[12169,12170])||
   !equal(meta?.incorrectOriginalExtrasPair,[12168,12169])||
   meta?.originalNodeIndex!==12171||meta?.oldGLBSHA256!==SUCC454_PARENT_GLB_SHA256||
   meta?.geometryChanged!==false||meta?.sourceLinksBindingVerified!==false||
   meta?.productionWebGLVerified!==false||meta?.humanReview!=='NOT_RUN'||
   wc?.extras?.noDuplicateWC!==true||n[12164]?.mesh!==4576||
   n[12165]?.mesh!==2405||n[12166]?.mesh!==2406||
   n[12167]?.mesh!==2405||n[12168]?.mesh!==2406||
   n[12169]?.mesh!==4497||n[12170]?.mesh!==4498||
   m[4576]?.primitives?.[0]?.material!==534)return false;
 const se=s.extras?.wcLedMetadataCorrection;
 return se?.sourceGLBSHA256===SUCC454_PARENT_GLB_SHA256&&
  se?.sourceSceneIndex===spec.parent&&se?.originalWCRoot===12171&&
  se?.correctedWCRoot===12172&&equal(se?.new2FWCNodes,[12169,12170])&&
  se?.changedVisibleGeometry===false&&se?.sourceLinksBound===false&&
  se?.stage==='WORK_TEST_HOST_HOLD'&&se?.current===false&&se?.asBuilt===false&&
  se?.humanReview==='NOT_RUN';
}
export function resolveSucc454SceneIndex(sha,parentScene,floor){
 if(sha!==SUCC454_GLB_SHA256||!Number.isInteger(parentScene)||
  !['2F','BOTH'].includes(floor))return null;
 const all=Object.entries(SUCC454_SCENES).filter(([,s])=>s.parent===parentScene&&s.floor===floor);
 return all.length===1?Number(all[0][0]):null;
}
export function getSucc454SourceReceipt(gltf,sha,sceneIndex){
 const exactSource=isSucc454OwnerLedScene(gltf,sha,sceneIndex);
 return Object.freeze({exactSource,sourceOnly:true,publishAllowed:false,sourceLinksBound:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
}
