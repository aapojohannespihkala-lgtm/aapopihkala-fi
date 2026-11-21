/**
 * C80 R31 independent opt-in viewer handoff for ONE authenticated source GLB.
 * Requires caller-calculated SHA-256 of the complete, authenticated GLB.
 * Never switches between distinct GLB assets, registers viewer routes, or
 * binds sourceLinks. A real production WebGL acceptance is still required.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_R31_SCENE752_SOURCES,
 C80_R31_SCENE753_SOURCE,
 C80_R31_SCENE754_SOURCE,
 C80_R31_SCENE756_SOURCE,
 C80_R31_R300_SOURCE,
 C80_R31_R300_VIEWS,
 isC80R31Scene752Source,
 isC80R31Scene753Source,
 isC80R31Scene754Source,
 isC80R31Scene756Source,
 isC80R31R300CopperSource,
} from './privateModelC80R31Scene752SourceReceipt.mjs';
import {rehydrateIncompleteScene} from './privateModelSourceSceneRehydrate.mjs';

export const C80_R31_R300_WORK_TEST_ID='c80-r31-r300-sc759-sc760-work-test';

/** Bind the R300 review to the one canonical protected catalog entry. */
export function r300WorkTestSource(candidate){
 if(candidate.id!==C80_R31_R300_WORK_TEST_ID)return undefined;
 if(candidate.path!==`/private-model/work-test/${C80_R31_R300_WORK_TEST_ID}.glb`)
  throw new Error('C80_R31_R300_CANDIDATE_PATH_MISMATCH');
 return C80_R31_R300_SOURCE;
}

const r300Role=view=>Object.freeze({
 spec:Object.freeze({...C80_R31_R300_SOURCE,...view}),
 verify:(json,sha,i)=>isC80R31R300CopperSource(json,sha,i,view.role,'BOTH'),
 exactRootCount:true,
});

export const C80_R31_REVIEW_ROLES=Object.freeze({
 K5_PINK_OFF:Object.freeze({
  spec:C80_R31_SCENE752_SOURCES.k5,
  verify:(json,sha,i)=>isC80R31Scene752Source(json,sha,i,'k5','BOTH'),
 }),
 RAIN5:Object.freeze({
  spec:C80_R31_SCENE752_SOURCES.rain5,
  verify:(json,sha,i)=>isC80R31Scene752Source(json,sha,i,'rain5','BOTH'),
 }),
 RAIN5_K5_OFF:Object.freeze({
  spec:C80_R31_SCENE753_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene753Source(
   json,sha,i,C80_R31_SCENE753_SOURCE.role,'BOTH'),
 }),
 RAIN5_K5_OFF_H18116_VISUAL:Object.freeze({
  spec:C80_R31_SCENE754_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene754Source(
   json,sha,i,C80_R31_SCENE754_SOURCE.role,'BOTH'),
 }),
 L16_CURVE_KIV_CASE_COMBINED:Object.freeze({
  spec:C80_R31_SCENE756_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene756Source(
   json,sha,i,C80_R31_SCENE756_SOURCE.role,'BOTH'),
 }),
 [C80_R31_R300_VIEWS.normal.role]:r300Role(C80_R31_R300_VIEWS.normal),
 [C80_R31_R300_VIEWS.service.role]:r300Role(C80_R31_R300_VIEWS.service),
});

const matchesRenderedScene=(gltf,scene,i,cfg)=>{
 const json=gltf.parser?.json;
 return !!scene&&scene.name===json?.scenes?.[i]?.name&&
  (!cfg.exactRootCount||scene.children?.length===cfg.spec.rootCount)&&
  c80530RenderedRootPathMatches(json,scene,i,gltf.parser?.associations);
};

/** Restore any shared glTF children moved by the loader before mounting either R300 view. */
export async function prepareC80R31R300ReviewScenes(gltf,authenticatedSha){
 const views=Object.values(C80_R31_R300_VIEWS);
 const json=gltf?.parser?.json;
 if(!Array.isArray(gltf?.scenes)||gltf.scenes.length!==C80_R31_R300_SOURCE.sceneCount||
  !views.every(view=>isC80R31R300CopperSource(
   json,authenticatedSha,view.sceneIndex,view.role,'BOTH')))
  throw new Error('C80_R31_REVIEW_SOURCE_MISMATCH');
 for(const view of views){
  if(!resolveC80R31ReviewScene(gltf,authenticatedSha,view.role)){
   await rehydrateIncompleteScene(gltf,view.sceneIndex,{force:true});
   if(!resolveC80R31ReviewScene(gltf,authenticatedSha,view.role))
    throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
  }
 }
}

/** Exact source role and Object3D binding, not a viewer mount or publication. */
export function resolveC80R31ReviewScene(gltf,authenticatedSha,role){
 const cfg=Object.hasOwn(C80_R31_REVIEW_ROLES,role)?C80_R31_REVIEW_ROLES[role]:null;
 const json=gltf?.parser?.json;
 if(!cfg||typeof authenticatedSha!=='string'||!json||
  !Array.isArray(gltf?.scenes)||
  gltf.scenes.length!==cfg.spec.sceneCount||
  authenticatedSha!==cfg.spec.glbSha256)return null;
 const i=cfg.spec.sceneIndex,scene=gltf.scenes[i];
 if(!cfg.verify(json,authenticatedSha,i)||!matchesRenderedScene(gltf,scene,i,cfg))return null;
 return Object.freeze({scene,sceneIndex:i,role,authenticatedSha,
  sceneName:scene.name,rootCount:json.scenes[i].nodes.length});
}

/** A mount is accepted only when its target identity and optional proof hold.
 * All failures attempt to restore the exact previous mount. If rollback is
 * unverified, caller MUST permanently quarantine this staging handle.
 */
export function c80R31AtomicReviewMount({mount,mounted,previous,target,verifyTarget}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_R31_REVIEW_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target||
   (typeof verifyTarget==='function'&&!verifyTarget()))
   throw new Error('C80_R31_REVIEW_MOUNT_MISMATCH');
  return {ok:true};
 }catch(e){error=e;}
 try{
  mount(previous);
  if(mounted()!==previous)
   throw new Error('C80_R31_REVIEW_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){
  return {ok:false,restored:false,error,rollbackError};
 }
}

/** Switch only between the prepared R300 pair in the existing viewer mount. */
export async function createC80R31R300ViewSwitch({gltf,authenticatedSha,mount,mounted}){
 await prepareC80R31R300ReviewScenes(gltf,authenticatedSha);
 const byView=Object.fromEntries(Object.entries(C80_R31_R300_VIEWS).map(([name,view])=>{
  const proof=resolveC80R31ReviewScene(gltf,authenticatedSha,view.role);
  return [name,{
   ...proof,snapshot:c80530SnapshotRenderedSourceTree(proof.scene,proof.rootCount),
  }];
 }));
 if(Object.values(byView).some(view=>!view.snapshot))
  throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
 let quarantined=false;
 const activeView=()=>{
  if(quarantined)return null;
  return Object.keys(byView).find(name=>byView[name].scene===mounted())??null;
 };
 return Object.freeze({
  normalScene:byView.normal.scene,
  activeView,
  select(name){
   const current=activeView();
   if(!current||!Object.hasOwn(byView,name))return false;
   if(current===name)return true;
   const target=byView[name];
   const valid=()=>c80530RenderedSourceTreeUnchanged(target.scene,target.snapshot)&&
    resolveC80R31ReviewScene(gltf,authenticatedSha,target.role)?.scene===target.scene;
   if(!valid())return false;
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:byView[current].scene,target:target.scene,verifyTarget:valid,
   });
   if(!outcome.ok&&!outcome.restored){
    quarantined=true;
    throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',{cause:outcome.rollbackError});
   }
   return outcome.ok;
  },
 });
}

export function createC80R31ReviewRuntime({
 gltf,authenticatedSha,role,mount,mounted,
}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_R31_REVIEW_MOUNT_CONTRACT');
 const proof=resolveC80R31ReviewScene(gltf,authenticatedSha,role);
 if(!proof)throw new Error('C80_R31_REVIEW_SOURCE_MISMATCH');
 const {scene,sceneIndex,rootCount}=proof,json=gltf.parser.json;
 const cfg=C80_R31_REVIEW_ROLES[role];
 const snapshot=c80530SnapshotRenderedSourceTree(scene,rootCount);
 if(!snapshot)throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
 let previous=null,active=false,disposed=false,quarantined=false;
 const live=()=>!disposed&&!quarantined&&
  gltf.scenes?.[sceneIndex]===scene&&
  c80530RenderedSourceTreeUnchanged(scene,snapshot)&&
  matchesRenderedScene(gltf,scene,sceneIndex,cfg)&&
  cfg.verify(json,authenticatedSha,sceneIndex);
 const quarantine=()=>{
  quarantined=true;disposed=true;active=false;previous=null;
 };
 return Object.freeze({
  role,sceneIndex,sourceSha256:authenticatedSha,
  sceneName:proof.sceneName,rootCount,
  stage:'WORK_TEST_HOST_HOLD',
  get available(){return !disposed&&!quarantined;},
  get active(){return active;},
  get quarantined(){return quarantined;},
  get selectedScene(){return quarantined?null:scene;},
  get sourceLinksBound(){return false;},
  get publicationAllowed(){return false;},
  get physicalHostVerified(){return false;},
  get productionWebGLVerified(){return false;},
  get humanReview(){return 'NOT_RUN';},
  get current(){return false;},
  get asBuilt(){return false;},
  /** Preview only after external authentication. Never called automatically. */
  preview(){
   if(active||!live())return null;
   let before;
   try{before=mounted();}catch{return null;}
   if(before===scene)return null;
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:before,target:scene,verifyTarget:live,
   });
   if(!outcome.ok){
    if(!outcome.restored){
     quarantine();
     throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',
      {cause:outcome.rollbackError});
    }
    return null;
   }
   previous=before;active=true;
   return Object.freeze({sceneIndex,role,stage:'WORK_TEST_HOST_HOLD'});
  },
  /** Restore the exact earlier mount; do not promote or retain this model. */
  restore(){
   if(disposed||quarantined||!active)return false;
   let found;
   try{found=mounted();}catch{quarantine();return false;}
   if(found!==scene){quarantine();return false;}
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:scene,target:previous,
   });
   if(!outcome.ok){
    if(!outcome.restored){
     quarantine();
     throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',
      {cause:outcome.rollbackError});
    }
    return false;
   }
   previous=null;active=false;
   return true;
  },
  dispose(){
   if(active)throw new Error('C80_R31_REVIEW_RESTORE_FIRST');
   disposed=true;
  },
 });
}
