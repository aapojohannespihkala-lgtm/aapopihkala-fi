import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {
 C80_620R15_GLB_SHA256 as SHA,
 C80_620R15_SCENES as SPECS,
 C80_620R15_COW_ALIASES as ALIASES,
 C80_620R15_DUCT_ROOT,
 C80_620R15_K10_VALVE_ROOT,
 C80_620R15_CLOSET_VALVE_ROOT,
 C80_620R15_STORE_GRILLE_ROOT,
 C80_620R15_ELECTRICAL_ROOTS,
 isC80620R15SourceScene as exactScene,
} from './privateModelC80620R15SourceProfile.mjs';
// Reuse the authenticated rendered-graph pinning of the C80 530 receiver.
import {
 c80530RenderedRootPathMatches as rootPathMatches,
 c80530SnapshotRenderedSourceTree as snapshotTree,
 c80530RenderedSourceTreeUnchanged as treeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';

// 622..625 copy the BOTH scenes of the 620R14 parent (closed, one open, stacked glazing, closed cutaway).
export const C80_620R15_VIEWER_ROLES=Object.freeze({
 '1F':644,'2F':645,
 BOTH:Object.freeze({CLOSED:646,ONE_OPEN:647,STACKED:648,CUTAWAY:649}),
});
export function resolveC80620R15SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_620R15_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?649:null;
 return C80_620R15_VIEWER_ROLES.BOTH[glazing]??null;
}
function liveRole(json,sha,i){
 const spec=SPECS[i];
 return !!spec&&exactScene(json,sha,i,spec.floor);
}
export function resolveC80620R15Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==650)return null;
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

export function createC80620R15FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_620R15_MOUNT_CONTRACT');
 const scenes=resolveC80620R15Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_620R15_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=646;
 let active=false,disposed=false;
 const graphProof=Object.fromEntries(Object.keys(scenes).map(k=>{
  const i=Number(k),count=json.scenes[i].nodes.length;
  return [i,snapshotTree(scenes[i],count)];
 }));
 if(Object.values(graphProof).some(proof=>!proof))
  throw new Error('C80_620R15_RENDERED_SOURCE_GRAPH_MISMATCH');
 const pinned=i=>treeUnchanged(scenes[i],graphProof[i]);
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&pinned(i)&&
   rootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
   liveRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const swap=(f,g,c)=>{
  const next=resolveC80620R15SceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_620R15_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80620R15:true,
  chainLabel:'C80 620R15 (620R14 + owner review 17.11 late: bathroom ceiling, simple 2F WC duct, cord along the floor, sockets and TV, closet light, hot riser in the wall) WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_620R15_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[644].name,'2F':scenes[645].name,BOTH:scenes[646].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[646],
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
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(646))return false;
   mount(scenes[646]);
   if(mounted()!==scenes[646])throw new Error('C80_620R15_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=646;active=false;
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
 C80_620R15_DUCT_ROOT,
 // The owner-point store exhaust valve is highlighted with its duct (the old duplicate valve is gone).
 C80_620R15_K10_VALVE_ROOT,
 // 620R15: the closet IV end valve and the store outlet grille are ventilation too.
 C80_620R15_CLOSET_VALVE_ROOT,C80_620R15_STORE_GRILLE_ROOT,
 // 620R15: the balcony heat-lamp cord and the owner sockets are electrical.
 ...C80_620R15_ELECTRICAL_ROOTS]);
export function c80620R15ReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  // Asset-level viewerFloorScenes (unchanged 350..352), as in the 530 profile.
  count:650,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  publicationAllowed:false,humanReview:'NOT_RUN',current:false,
 };
}
