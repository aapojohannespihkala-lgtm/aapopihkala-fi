/**
 * C80 602 canonical ALL5+K04 source-only opt-in floor runtime.
 * Never registers a model in the live viewer or approves publication.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_602_GLB_SHA256 as SHA,
 C80_602_SCENES as SPECS,
 isC80602All5K04SourceScene as exactSource,
} from './privateModelC80602All5K04SourceProfile.mjs';

export const C80_602_VIEWER_ROLES=Object.freeze({
 '1F':596,'2F':597,
 BOTH:Object.freeze({CLOSED:598,ONE_OPEN:599,STACKED:600,CUTAWAY:601})
});
export function resolveC80602SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
   !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
   typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return glazing==='CLOSED'&&!cutaway?C80_602_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?601:null;
 return C80_602_VIEWER_ROLES.BOTH[glazing]??null;
}
export function resolveC80602RenderedScenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||
    gltf.scenes.length!==602)return null;
 const scenes=Object.create(null);
 for(const [key,spec] of Object.entries(SPECS)){
  const i=Number(key),obj=gltf.scenes[i];
  if(!obj||obj.name!==json.scenes?.[i]?.name||
     !exactSource(json,sha,i,spec.floor)||
     !c80530RenderedRootPathMatches(json,obj,i,gltf.parser?.associations))return null;
  scenes[i]=obj;
 }
 return new Set(Object.values(scenes)).size===6?scenes:null;
}
/** Target must be verifiably mounted, or a rollback must be verifiably restored. */
export function c80602AtomicMount({mount,mounted,previous,target}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_602_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target)throw new Error('C80_602_SCENE_MOUNT_MISMATCH');
  return {ok:true};
 }catch(e){error=e;}
 try{
  mount(previous);
  if(mounted()!==previous)throw new Error('C80_602_SCENE_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){return {ok:false,restored:false,error,rollbackError};}
}
export function createC80602FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_602_MOUNT_CONTRACT');
 const scenes=resolveC80602RenderedScenes(gltf,sha);
 if(!scenes)throw new Error('C80_602_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 const proofs=Object.create(null);
 for(const key of Object.keys(SPECS)){
  const i=Number(key);
  proofs[i]=c80530SnapshotRenderedSourceTree(
   scenes[i],json.scenes[i].nodes.length);
  if(!proofs[i])throw new Error('C80_602_RENDERED_GRAPH_MISMATCH');
 }
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=598;
 let active=false,disposed=false,quarantined=false;
 const live=i=>{
  const spec=SPECS[i],obj=scenes[i];
  return !!spec&&gltf.scenes?.[i]===obj&&
   obj?.name===json.scenes?.[i]?.name&&
   c80530RenderedSourceTreeUnchanged(obj,proofs[i])&&
   c80530RenderedRootPathMatches(json,obj,i,gltf.parser?.associations)&&
   exactSource(json,sha,i,spec.floor);
 };
 const mountedHere=()=>{
  try{return !quarantined&&mounted()===scenes[sceneIndex];}
  catch{return false;}
 };
 const commit=i=>{
  const outcome=c80602AtomicMount({
   mount,mounted,previous:scenes[sceneIndex],target:scenes[i]});
  if(outcome.ok)return;
  if(!outcome.restored){
   quarantined=true;disposed=true;active=false;
   throw new Error('C80_602_ROLLBACK_UNVERIFIED',{cause:outcome.rollbackError});
  }
  throw outcome.error;
 };
 const swap=(f,g,c)=>{
  const i=resolveC80602SceneIndex(f,g,c);
  if(disposed||i===null||!mountedHere()||!live(sceneIndex)||!live(i))return null;
  const wasActive=active;active=false;
  try{commit(i);}
  finally{if(!quarantined)active=wasActive;}
  floor=f;glazing=g;cutaway=c;sceneIndex=i;
  let included=0;
  scenes[i].traverse?.(x=>{if(x?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  isC80R2Chain:true,isC80602:true,
  chainLabel:'C80 602 ALL5+K04 source-exact WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_602_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[596].name,'2F':scenes[597].name,BOTH:scenes[598].name},
  floorOptions:['1F','2F','BOTH'],supportsFirstFloor:true,
  defaultScene:scenes[598],
  get available(){return !disposed&&!quarantined;},
  get selectedScene(){return quarantined?null:scenes[sceneIndex];},
  get sceneIndex(){return quarantined?null:sceneIndex;},
  get quarantined(){return quarantined;},
  get floor(){return floor;},get glazing(){return glazing;},
  get cutaway(){return cutaway;},get active(){return active;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get physicalHostStatus(){return 'NOT_VERIFIED';},
  get productionWebGLStatus(){return 'NOT_RUN';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  apply(f,g=f==='BOTH'?glazing:'CLOSED'){
   const result=swap(f,g,f==='BOTH'?cutaway:false);
   if(result)active=true;
   return result;
  },
  setGlazing(g){return swap(floor,g,cutaway);},
  setCutaway(c){return typeof c==='boolean'?swap(floor,glazing,c):null;},
  restore(){
   if(disposed||!mountedHere()||!live(sceneIndex)||!live(598))return false;
   commit(598);sceneIndex=598;floor='BOTH';glazing='CLOSED';
   cutaway=false;active=false;return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
