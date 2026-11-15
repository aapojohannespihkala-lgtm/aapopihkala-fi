/**
 * C80 578 ALL5+clean Savo floor/glazing runtime for authenticated local
 * WORK_TEST previews only. Intentionally NOT registered in the viewer.
 * No sourceLinks, publication, CURRENT/as-built or HUMAN_REVIEW rights.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_578_GLB_SHA256 as SHA,C80_578_SCENES as SPECS,
 isC80578All5SourceScene as exactScene,
} from './privateModelC80578All5PureSavoSourceProfile.mjs';

export const C80_578_VIEWER_ROLES=Object.freeze({
 '1F':572,'2F':573,
 BOTH:Object.freeze({CLOSED:574,ONE_OPEN:575,STACKED:576,CUTAWAY:577}),
});
export function resolveC80578SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')
  return glazing==='CLOSED'&&!cutaway?C80_578_VIEWER_ROLES[floor]:null;
 return cutaway?(glazing==='CLOSED'?577:null):
  C80_578_VIEWER_ROLES.BOTH[glazing]??null;
}
/** Verify SHA+source scene AND the actual GLTFLoader object graph. */
export function resolveC80578Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||
    gltf.scenes.length!==578)return null;
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
/**
 * One mount attempt plus verified rollback to the previous scene on failure.
 * An unverified rollback must quarantine the caller, not retain a live claim.
 * Exported for required CI without the private 56 MB GLB fixture.
 */
export function c80578AtomicMount({mount,mounted,target,previous}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_578_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target)
   throw new Error('C80_578_SCENE_MOUNT_MISMATCH');
  return {ok:true};
 }catch(cause){error=cause;}
 try{
  mount(previous);
  if(mounted()!==previous)
   throw new Error('C80_578_SCENE_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){
  return {ok:false,restored:false,error,rollbackError};
 }
}
export function createC80578All5FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_578_MOUNT_CONTRACT');
 const scenes=resolveC80578Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_578_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json,proof=Object.create(null);
 for(const spec of Object.values(SPECS)){
  proof[spec.scene]=c80530SnapshotRenderedSourceTree(
   scenes[spec.scene],json.scenes[spec.scene].nodes.length);
  if(!proof[spec.scene])
   throw new Error('C80_578_RENDERED_SOURCE_GRAPH_MISMATCH');
 }
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=574;
 let active=false,disposed=false,quarantined=false;
 const isLive=i=>gltf.scenes?.[i]===scenes[i]&&
  scenes[i]?.name===json.scenes?.[i]?.name&&
  c80530RenderedSourceTreeUnchanged(scenes[i],proof[i])&&
  c80530RenderedRootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
  exactScene(json,sha,i,SPECS[i]?.floor);
 const mountedHere=()=>!quarantined&&mounted()===scenes[sceneIndex];
 // An attempted target mount is not a committed scene switch until mounted()
 // proves it. If rollback also fails, permanently disable this runtime.
 const commitMount=target=>{
  const result=c80578AtomicMount({
   mount,mounted,target:scenes[target],previous:scenes[sceneIndex],
  });
  if(result.ok)return;
  if(!result.restored){
   quarantined=true;disposed=true;active=false;
   throw new Error('C80_578_SCENE_ROLLBACK_FAILED',{cause:result.rollbackError});
  }
  throw result.error;
 };
 const swap=(f,g,c)=>{
  const target=resolveC80578SceneIndex(f,g,c);
  if(disposed||target===null||!mountedHere()||
    !isLive(sceneIndex)||!isLive(target))return null;
  const priorActive=active;active=false;
  try{commitMount(target);}finally{if(!quarantined)active=priorActive;}
  floor=f;glazing=g;cutaway=c;sceneIndex=target;
  let included=0;
  scenes[target].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  get available(){return !disposed&&!quarantined;},
  isC80R2Chain:true,isC80578All5:true,
  chainLabel:'C80 578 ALL5 K07 clean WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_578_ALL5_SOURCE_ONLY',
  sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[572].name,'2F':scenes[573].name,BOTH:scenes[574].name},
  floorOptions:['1F','2F','BOTH'],supportsFirstFloor:true,
  defaultScene:scenes[574],
  get selectedScene(){return quarantined?null:scenes[sceneIndex];},
  get sceneIndex(){return quarantined?null:sceneIndex;},
  get quarantined(){return quarantined;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get physicalHostStatus(){return 'NOT_VERIFIED';},
  get sourceLinksStatus(){return 'NOT_BOUND';},
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
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(574))
    return false;
   commitMount(574);
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=574;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
