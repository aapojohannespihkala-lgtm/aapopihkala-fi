/**
 * Source-exact floor/glazing preview receiver for C80 584 ALL5 + K12 tiles.
 * Not registered with the production viewer. The KPH tile is a photo-based
 * WORK_TEST assumption, and sauna 2015 catalog is not 2026 as-built.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_584_GLB_SHA256 as SHA,
 C80_584_SCENES as SPECS,
 isC80584ExactSourceScene as exactScene,
} from './privateModelC80584All5K12TileSourceProfile.mjs';

export const C80_584_VIEWER_ROLES=Object.freeze({
 '1F':578,'2F':579,
 BOTH:Object.freeze({CLOSED:580,ONE_OPEN:581,STACKED:582,CUTAWAY:583}),
});
export function resolveC80584SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return glazing==='CLOSED'&&!cutaway?
  C80_584_VIEWER_ROLES[floor]:null;
 return cutaway?(glazing==='CLOSED'?583:null):
  C80_584_VIEWER_ROLES.BOTH[glazing]??null;
}
export function resolveC80584Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||
    gltf.scenes.length!==584)return null;
 const scenes=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,obj=gltf.scenes[i];
  if(!obj||obj.name!==json.scenes?.[i]?.name||
     !exactScene(json,sha,i,spec.floor)||
     !c80530RenderedRootPathMatches(json,obj,i,gltf.parser?.associations))
    return null;
  scenes[i]=obj;
 }
 return new Set(Object.values(scenes)).size===6?scenes:null;
}
/** Fail-closed mount transaction. A failed rollback is NEVER a live view. */
export function c80584AtomicMount({mount,mounted,target,previous}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_584_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target)throw new Error('C80_584_SCENE_MOUNT_MISMATCH');
  return {ok:true};
 }catch(cause){error=cause;}
 try{
  mount(previous);
  if(mounted()!==previous)throw new Error('C80_584_SCENE_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){
  return {ok:false,restored:false,error,rollbackError};
 }
}
export function createC80584All5K12FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_584_MOUNT_CONTRACT');
 const scenes=resolveC80584Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_584_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json,proof=Object.create(null);
 for(const spec of Object.values(SPECS)){
  proof[spec.scene]=c80530SnapshotRenderedSourceTree(
   scenes[spec.scene],json.scenes[spec.scene].nodes.length);
  if(!proof[spec.scene])
   throw new Error('C80_584_RENDERED_SOURCE_GRAPH_MISMATCH');
 }
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=580;
 let active=false,disposed=false,quarantined=false;
 const isLive=i=>gltf.scenes?.[i]===scenes[i]&&
  scenes[i]?.name===json.scenes?.[i]?.name&&
  c80530RenderedSourceTreeUnchanged(scenes[i],proof[i])&&
  c80530RenderedRootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
  exactScene(json,sha,i,SPECS[i]?.floor);
 const mountedHere=()=>!disposed&&!quarantined&&mounted()===scenes[sceneIndex];
 const commitMount=target=>{
  const result=c80584AtomicMount({
   mount,mounted,target:scenes[target],previous:scenes[sceneIndex]});
  if(result.ok)return;
  if(!result.restored){
   quarantined=true;disposed=true;active=false;
   throw new Error('C80_584_SCENE_ROLLBACK_FAILED',{cause:result.rollbackError});
  }
  throw result.error;
 };
 const swap=(f,g,c)=>{
  const target=resolveC80584SceneIndex(f,g,c);
  if(disposed||target===null||!mountedHere()||
     !isLive(sceneIndex)||!isLive(target))return null;
  const priorActive=active;active=false;
  try{commitMount(target);}finally{if(!quarantined)active=priorActive;}
  floor=f;glazing=g;cutaway=c;sceneIndex=target;
  let included=0;
  scenes[target].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return Object.freeze({
  get available(){return !disposed&&!quarantined;},
  isC80R2Chain:true,isC80584All5K12:true,
  chainLabel:'C80 584 ALL5 K12 WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_584_ALL5_K12_SOURCE_ONLY',
  sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[578].name,'2F':scenes[579].name,BOTH:scenes[580].name},
  floorOptions:['1F','2F','BOTH'],supportsFirstFloor:true,
  defaultScene:scenes[580],
  get selectedScene(){return quarantined?null:scenes[sceneIndex];},
  get sceneIndex(){return quarantined?null:sceneIndex;},
  get quarantined(){return quarantined;},
  get floor(){return floor;},get glazing(){return glazing;},
  get cutaway(){return cutaway;},get active(){return active;},
  get physicalHostStatus(){return 'NOT_VERIFIED';},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get productionWebGLStatus(){return 'NOT_RUN';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  get k12PhotoAsBuiltStatus(){return 'WORK_ASSUMPTION_ONLY';},
  apply(f,g=f==='BOTH'?glazing:'CLOSED'){
   const result=swap(f,g,f==='BOTH'?cutaway:false);
   if(result)active=true;
   return result;
  },
  setGlazing(g){return swap(floor,g,cutaway);},
  setCutaway(c){return typeof c==='boolean'?swap(floor,glazing,c):null;},
  restore(){
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(580))
    return false;
   commitMount(580);
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=580;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 });
}
