import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {nameMatches} from './privateModelSourceNodeAssociations.mjs';
import {
 C80_530_V27_GLB_SHA256 as SHA,
 C80_530_V27_SCENES as SPECS,
 isC80530V27SourceScene as exactScene,
} from './privateModelC80530V27SourceProfile.mjs';

// Only the authenticated 530 opt-in source scenes; no viewer/catalog registration.
export const C80_530_V27_VIEWER_ROLES=Object.freeze({
 '1F':524,'2F':525,
 BOTH:Object.freeze({CLOSED:526,ONE_OPEN:527,STACKED:528,CUTAWAY:529}),
});
export function resolveC80530V27SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_530_V27_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?529:null;
 return C80_530_V27_VIEWER_ROLES.BOTH[glazing]??null;
}
function liveRole(json,sha,i){
 const spec=SPECS[i];
 return !!spec&&exactScene(json,sha,i,spec.floor);
}
/** The source SHA authenticates JSON; these checks bind actual rendered
 * Object3D hierarchy (including nested glTF node order) to that JSON.
 * GLTFLoader prefixes primitive-only children and suffixes repeated names.
 * Scene-only viewer helpers appended after source roots are ignored.
 */
function treeMatches(json,obj,nodeId,associations,depth=0){
 if(depth>256||!Number.isInteger(nodeId)||nodeId<0||
    nodeId>=json.nodes.length)return false;
 const def=json.nodes[nodeId];
 if(!def||!obj||!nameMatches(obj,def))return false;
 const known=associations?.get?.(obj)?.nodes;
 if(Number.isInteger(known)&&known!==nodeId)return false;
 const ids=def.children??[];
 const children=obj.children??[];
 if(!Array.isArray(ids)||!Array.isArray(children)||children.length<ids.length)return false;
 const offset=children.length-ids.length;
 return ids.every((id,j)=>treeMatches(json,children[offset+j],id,associations,depth+1));
}
export function c80530RenderedRootPathMatches(json,rendered,sceneIndex,associations=null){
 const roots=json?.scenes?.[sceneIndex]?.nodes;
 if(!Array.isArray(roots)||!Array.isArray(json?.nodes)||
    !Array.isArray(rendered?.children)||rendered.children.length<roots.length)return false;
 return roots.every((nodeId,i)=>treeMatches(json,rendered.children[i],nodeId,associations));
}
export function resolveC80530V27Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==530)return null;
 const out=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,scene=gltf.scenes[i];
  if(!scene||scene.name!==json.scenes?.[i]?.name||
     !c80530RenderedRootPathMatches(json,scene,i,gltf.parser?.associations)||
     !liveRole(json,sha,i))return null;
  out[i]=scene;
 }
 return new Set(Object.values(out)).size===6?out:null;
}
export function createC80530V27FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_530_MOUNT_CONTRACT');
 const scenes=resolveC80530V27Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_530_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=526;
 let active=false,disposed=false;
 // Identity pin after the initial source-tree verification. Same-name fake
 // Object3D replacements can never be mounted later.
 const pinnedRoots=Object.fromEntries(Object.keys(scenes).map(k=>{
  const i=Number(k),count=json.scenes[i].nodes.length;
  return [i,scenes[i].children.slice(0,count)];
 }));
 const pinned=(i)=>Array.isArray(scenes[i]?.children)&&
   pinnedRoots[i]?.every((obj,j)=>scenes[i].children[j]===obj);
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&pinned(i)&&
   c80530RenderedRootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
   liveRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const swap=(f,g,c)=>{
  const next=resolveC80530V27SceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_530_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80530V27:true,
  chainLabel:'C80 530 V27 42 mm maaston seinäleikkaus WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_530_V27_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[524].name,'2F':scenes[525].name,BOTH:scenes[526].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[526],
  get selectedScene(){return scenes[sceneIndex];},
  get sceneIndex(){return sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get terrainPhysicalHostStatus(){return 'NOT_VERIFIED';},
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
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(526))return false;
   mount(scenes[526]);
   if(mounted()!==scenes[526])throw new Error('C80_530_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=526;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
// The terrain root 12254 is architectural site context. The 524 rain-marker
// root 12251 is presentation-only, not technical piping.
const REVIEW_MEP=new Set([
 ...Object.values(C80_437_SCENES).flatMap(s=>s.review??[]),
 12193,12194,12224,12228,12230,12237,12239,12242,
 12243,12244,12245,12246,12247,12248,
]);
export function c80530V27ReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  count:530,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  physicalTerrainSurveyVerified:false,
  publicationAllowed:false,humanReview:'NOT_RUN',current:false,
 };
}
