/**
 * Runtime for opt-in authenticated C80 536 K11 sauna WORK_TEST scenes.
 * Not registered in the viewer/catalogue, not a publishing or WebGL gate.
 * The full original GLB SHA must be authenticated before use.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_K11_GLB_SHA256 as SHA,
 C80_K11_SCENES as SPECS,
 isC80K11SaunaSourceScene as exactSource,
} from './privateModelC80536K11SaunaSourceProfile.mjs';

export const C80_K11_VIEWER_ROLES=Object.freeze({
 '1F':530,'2F':531,
 BOTH:Object.freeze({CLOSED:532,ONE_OPEN:533,STACKED:534,CUTAWAY:535}),
});

export function resolveC80K11SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return glazing==='CLOSED'&&!cutaway?C80_K11_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?535:null;
 return C80_K11_VIEWER_ROLES.BOTH[glazing]??null;
}

export function resolveC80K11RenderedScenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||
    gltf.scenes.length!==536)return null;
 const result=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,obj=gltf.scenes[i];
  if(!obj||obj.name!==json.scenes?.[i]?.name||
     !exactSource(json,sha,i,spec.floor)||
     !c80530RenderedRootPathMatches(json,obj,i,gltf.parser?.associations))
   return null;
  result[i]=obj;
 }
 return new Set(Object.values(result)).size===6?result:null;
}

/**
 * Fail-closed synchronous mount. A failed target can only be recovered by
 * confirming the previous object is mounted. Otherwise the caller must
 * quarantine this runtime and require a fresh authenticated load.
 */
export function c80K11AtomicMount({mount,mounted,previous,target}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_K11_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target)throw new Error('C80_K11_SCENE_MOUNT_MISMATCH');
  return {ok:true};
 }catch(e){error=e;}
 try{
  mount(previous);
  if(mounted()!==previous)throw new Error('C80_K11_SCENE_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){
  return {ok:false,restored:false,error,rollbackError};
 }
}

export function createC80K11FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_K11_MOUNT_CONTRACT');
 const scenes=resolveC80K11RenderedScenes(gltf,sha);
 if(!scenes)throw new Error('C80_K11_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 const evidence=Object.create(null);
 for(const spec of Object.values(SPECS)){
  evidence[spec.scene]=c80530SnapshotRenderedSourceTree(
   scenes[spec.scene],json.scenes[spec.scene].nodes.length);
  if(!evidence[spec.scene])throw new Error('C80_K11_RENDERED_GRAPH_MISMATCH');
 }
 let sceneIndex=532,floor='BOTH',glazing='CLOSED',cutaway=false;
 let active=false,disposed=false,quarantined=false;
 const isLive=i=>{
  const spec=SPECS[i],obj=scenes[i];
  return !!spec&&gltf.scenes?.[i]===obj&&
    obj?.name===json.scenes?.[i]?.name&&
    c80530RenderedSourceTreeUnchanged(obj,evidence[i])&&
    c80530RenderedRootPathMatches(json,obj,i,gltf.parser?.associations)&&
    exactSource(json,sha,i,spec.floor);
 };
 const mountedHere=()=>{
  try{return !quarantined&&mounted()===scenes[sceneIndex];}
  catch{return false;}
 };
 const commitMount=(targetIndex)=>{
  const trial=c80K11AtomicMount({
   mount,mounted,previous:scenes[sceneIndex],target:scenes[targetIndex]});
  if(trial.ok)return;
  if(!trial.restored){
   quarantined=true;disposed=true;active=false;
   throw new Error('C80_K11_ROLLBACK_UNVERIFIED',{cause:trial.rollbackError});
  }
  throw trial.error;
 };
 const swap=(nextFloor,nextGlazing,nextCutaway)=>{
  const index=resolveC80K11SceneIndex(nextFloor,nextGlazing,nextCutaway);
  if(disposed||index===null||!mountedHere()||
     !isLive(sceneIndex)||!isLive(index))return null;
  const wasActive=active;active=false;
  try{commitMount(index);}
  finally{if(!quarantined)active=wasActive;}
  floor=nextFloor;glazing=nextGlazing;cutaway=nextCutaway;
  sceneIndex=index;
  let included=0;
  scenes[index].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  isC80R2Chain:true,isC80K11:true,
  chainLabel:'C80 536 K11 sauna wide-board photo-derived WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_536_K11_SOURCE_ONLY',
  sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[530].name,'2F':scenes[531].name,BOTH:scenes[532].name},
  floorOptions:['1F','2F','BOTH'],supportsFirstFloor:true,
  defaultScene:scenes[532],
  get available(){return !disposed&&!quarantined;},
  get active(){return active;},
  get sceneIndex(){return quarantined?null:sceneIndex;},
  get selectedScene(){return quarantined?null:scenes[sceneIndex];},
  get quarantined(){return quarantined;},
  get floor(){return floor;},get glazing(){return glazing;},get cutaway(){return cutaway;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get physicalInstallStatus(){return 'NOT_VERIFIED';},
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
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(532))return false;
   commitMount(532);
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=532;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
