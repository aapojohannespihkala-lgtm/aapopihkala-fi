import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {
 C80_620R10_GLB_SHA256 as SHA,
 C80_620R10_SCENES as SPECS,
 C80_620R10_COW_ALIASES as ALIASES,
 C80_620R10_DUCT_ROOT,
 isC80620R10SourceScene as exactScene,
} from './privateModelC80620R10SourceProfile.mjs';
// Reuse the authenticated rendered-graph pinning of the C80 530 receiver.
import {
 c80530RenderedRootPathMatches as rootPathMatches,
 c80530SnapshotRenderedSourceTree as snapshotTree,
 c80530RenderedSourceTreeUnchanged as treeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';

// 616..619 copy the 614 R10 scenes 610..613 (closed, one open, stacked glazing, closed cutaway).
export const C80_620R10_VIEWER_ROLES=Object.freeze({
 '1F':614,'2F':615,
 BOTH:Object.freeze({CLOSED:616,ONE_OPEN:617,STACKED:618,CUTAWAY:619}),
});
export function resolveC80620R10SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_620R10_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?619:null;
 return C80_620R10_VIEWER_ROLES.BOTH[glazing]??null;
}
function liveRole(json,sha,i){
 const spec=SPECS[i];
 return !!spec&&exactScene(json,sha,i,spec.floor);
}
export function resolveC80620R10Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==620)return null;
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

export function createC80620R10FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_620R10_MOUNT_CONTRACT');
 const scenes=resolveC80620R10Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_620R10_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=616;
 let active=false,disposed=false;
 const graphProof=Object.fromEntries(Object.keys(scenes).map(k=>{
  const i=Number(k),count=json.scenes[i].nodes.length;
  return [i,snapshotTree(scenes[i],count)];
 }));
 if(Object.values(graphProof).some(proof=>!proof))
  throw new Error('C80_620R10_RENDERED_SOURCE_GRAPH_MISMATCH');
 const pinned=i=>treeUnchanged(scenes[i],graphProof[i]);
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&pinned(i)&&
   rootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
   liveRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const swap=(f,g,c)=>{
  const next=resolveC80620R10SceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_620R10_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80620R10:true,
  chainLabel:'C80 620R10 (614 R10 + High J1/J2/K10/K14/G2S09/K05/K13) WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_620R10_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[614].name,'2F':scenes[615].name,BOTH:scenes[616].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[616],
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
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(616))return false;
   mount(scenes[616]);
   if(mounted()!==scenes[616])throw new Error('C80_620R10_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=616;active=false;
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
// 2F WC exhaust root is ventilation.
const REVIEW_MEP=new Set([...BASE_REVIEW,
 ...Object.entries(ALIASES).filter(([,a])=>BASE_REVIEW.includes(a.orig)).map(([n])=>Number(n)),
 C80_620R10_DUCT_ROOT]);
export function c80620R10ReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  // Asset-level viewerFloorScenes (unchanged 350..352), as in the 530 profile.
  count:620,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  publicationAllowed:false,humanReview:'NOT_RUN',current:false,
 };
}
