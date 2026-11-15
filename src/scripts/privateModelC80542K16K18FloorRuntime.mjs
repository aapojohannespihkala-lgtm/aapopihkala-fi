/**
 * Authenticated C80 542 K16 doorframe + K18 stairwall six-scene runtime.
 * Opt-in WORK_TEST/HOST_HOLD, deliberately not registered in the viewer.
 * Source SHA must be computed independently from original COMPLETE GLB bytes.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_WPD_K16K18_GLB_SHA256 as SHA,
 C80_WPD_K16K18_SCENES as SPECS,
 isC80WpdK16K18SourceScene as exactSource,
} from './privateModelC80542K16K18SourceProfile.mjs';

export const C80_542_K16K18_ROLES=Object.freeze({
 '1F':536,'2F':537,
 BOTH:Object.freeze({CLOSED:538,ONE_OPEN:539,STACKED:540,CUTAWAY:541}),
});

export function resolveC80542K16K18SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_542_K16K18_ROLES[floor]:null;
 return cutaway?(glazing==='CLOSED'?541:null):
    C80_542_K16K18_ROLES.BOTH[glazing]??null;
}

export function resolveC80542K16K18RenderedScenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||
    gltf.scenes.length!==542)return null;
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

/** Exactly one attempted switch. Failed switch must prove rollback. */
export function c80542K16K18AtomicMount({mount,mounted,target,previous}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_542_K16K18_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target)throw new Error('C80_542_K16K18_SCENE_MOUNT_MISMATCH');
  return {ok:true};
 }catch(cause){error=cause;}
 try{
  mount(previous);
  if(mounted()!==previous)
   throw new Error('C80_542_K16K18_SCENE_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){return {ok:false,restored:false,error,rollbackError};}
}

export function createC80542K16K18FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_542_K16K18_MOUNT_CONTRACT');
 const scenes=resolveC80542K16K18RenderedScenes(gltf,sha);
 if(!scenes)throw new Error('C80_542_K16K18_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json,evidence=Object.create(null);
 for(const key of Object.keys(SPECS)){
  const i=Number(key);
  evidence[i]=c80530SnapshotRenderedSourceTree(
   scenes[i],json.scenes[i].nodes.length);
  if(!evidence[i])throw new Error('C80_542_K16K18_RENDERED_GRAPH_MISMATCH');
 }
 let sceneIndex=538,floor='BOTH',glazing='CLOSED',cutaway=false;
 let active=false,disposed=false,quarantined=false;
 const live=i=>{
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
 const commitMount=i=>{
  const outcome=c80542K16K18AtomicMount({
   mount,mounted,target:scenes[i],previous:scenes[sceneIndex]});
  if(outcome.ok)return;
  if(!outcome.restored){
   quarantined=true;disposed=true;active=false;
   throw new Error('C80_542_K16K18_ROLLBACK_UNVERIFIED',{cause:outcome.rollbackError});
  }
  throw outcome.error;
 };
 const swap=(f,g,c)=>{
  const target=resolveC80542K16K18SceneIndex(f,g,c);
  if(disposed||target===null||!mountedHere()||
     !live(sceneIndex)||!live(target))return null;
  const wasActive=active;active=false;
  try{commitMount(target);}
  finally{if(!quarantined)active=wasActive;}
  floor=f;glazing=g;cutaway=c;sceneIndex=target;
  let included=0;
  scenes[target].traverse?.(x=>{if(x?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  isC80R2Chain:true,isC80542K16K18:true,
  chainLabel:'C80 542 K16/K18 owner doorframe and stairwall WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_542_K16K18_SOURCE_ONLY',
  sourceModel:'D_C80',sourceSha256:sha,
  defaultScene:scenes[538],
  floorSceneNames:{'1F':scenes[536].name,'2F':scenes[537].name,BOTH:scenes[538].name},
  floorOptions:['1F','2F','BOTH'],supportsFirstFloor:true,
  get available(){return !disposed&&!quarantined;},
  get quarantined(){return quarantined;},
  get selectedScene(){return quarantined?null:scenes[sceneIndex];},
  get sceneIndex(){return quarantined?null:sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
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
   if(disposed||!mountedHere()||!live(sceneIndex)||!live(538))return false;
   commitMount(538);
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=538;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
