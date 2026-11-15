import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {
 C80_608C_GLB_SHA256 as SHA,
 C80_608C_SCENES as SPECS,
 C80_608C_COW_ALIASES as ALIASES,
 C80_608C_DUCT_ROOT,
 isC80608CSourceScene as exactScene,
} from './privateModelC80608CSourceProfile.mjs';
// Reuse the authenticated rendered-graph pinning of the C80 530 receiver.
import {
 c80530RenderedRootPathMatches as rootPathMatches,
 c80530SnapshotRenderedSourceTree as snapshotTree,
 c80530RenderedSourceTreeUnchanged as treeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';

// 604..607 copy 598..601 (closed, one open, stacked glazing, closed cutaway).
export const C80_608C_VIEWER_ROLES=Object.freeze({
 '1F':602,'2F':603,
 BOTH:Object.freeze({CLOSED:604,ONE_OPEN:605,STACKED:606,CUTAWAY:607}),
});
export function resolveC80608CSceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_608C_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?607:null;
 return C80_608C_VIEWER_ROLES.BOTH[glazing]??null;
}
function liveRole(json,sha,i){
 const spec=SPECS[i];
 return !!spec&&exactScene(json,sha,i,spec.floor);
}
export function resolveC80608CScenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==608)return null;
 const out=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,scene=gltf.scenes[i];
  if(!scene||scene.name!==json.scenes?.[i]?.name||
     !rootPathMatches(json,scene,i,gltf.parser?.associations)||
     !liveRole(json,sha,i))return null;
  out[i]=scene;
 }
 return new Set(Object.values(out)).size===6?out:null;
}

export function createC80608CFloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_608C_MOUNT_CONTRACT');
 const scenes=resolveC80608CScenes(gltf,sha);
 if(!scenes)throw new Error('C80_608C_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=604;
 let active=false,disposed=false;
 const graphProof=Object.fromEntries(Object.keys(scenes).map(k=>{
  const i=Number(k),count=json.scenes[i].nodes.length;
  return [i,snapshotTree(scenes[i],count)];
 }));
 if(Object.values(graphProof).some(proof=>!proof))
  throw new Error('C80_608C_RENDERED_SOURCE_GRAPH_MISMATCH');
 const pinned=i=>treeUnchanged(scenes[i],graphProof[i]);
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&pinned(i)&&
   rootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
   liveRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const swap=(f,g,c)=>{
  const next=resolveC80608CSceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_608C_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80608C:true,
  chainLabel:'C80 608C omistajakorjaukset (katkaisijat, LED, kanava, ILP) WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_608C_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[602].name,'2F':scenes[603].name,BOTH:scenes[604].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[604],
  get selectedScene(){return scenes[sceneIndex];},
  get sceneIndex(){return sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get ownerFixesPhysicalStatus(){return 'NOT_VERIFIED';},
  get productionWebGLStatus(){return 'NOT_RUN';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  apply(next,nextGlazing=glazing){
   const result=swap(next,next==='BOTH'?nextGlazing:'CLOSED',next==='BOTH'?cutaway:false);
   if(result)active=true;
   return result;
  },
  setGlazing(next){return swap(floor,next,cutaway);},
  setCutaway(v){return typeof v==='boolean'?swap(floor,glazing,v):null;},
  restore(){
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(604))return false;
   mount(scenes[604]);
   if(mounted()!==scenes[604])throw new Error('C80_608C_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=604;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
// Same verified technical review roots as the C80 530 receiver.
const BASE_REVIEW=[
 ...Object.values(C80_437_SCENES).flatMap(s=>s.review??[]),
 12193,12194,12224,12228,12230,12237,12239,12242,
 12243,12244,12245,12246,12247,12248,
];
// COW roots inherit the review role of their original root; the new
// KSO125 connection duct is ventilation.
const REVIEW_MEP=new Set([...BASE_REVIEW,
 ...Object.entries(ALIASES).filter(([,a])=>BASE_REVIEW.includes(a.orig)).map(([n])=>Number(n)),
 C80_608C_DUCT_ROOT]);
export function c80608CReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  // Asset-level viewerFloorScenes (unchanged 350..352), as in the 530 profile.
  count:608,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  publicationAllowed:false,humanReview:'NOT_RUN',current:false,
 };
}
