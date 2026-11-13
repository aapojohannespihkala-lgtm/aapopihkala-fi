import {
 SUCCESSOR_R1_SHA256,SUCCESSOR_R1_SCENES,SUCCESSOR_R1_SCENE_COUNT,
 isM6263Mj72Kiv005Pk1SuccessorSourceScene,
} from './privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import {nameMatches,sameSourceName} from './privateModelSourceNodeAssociations.mjs';

// Only explicit scene combinations authored in the exact source GLB are allowed.
// In particular, 1F ONE_OPEN/STACKED and 2F PK1_CUTAWAY never fall back.
// Index-only projection of the nine opt-in source variants. It grants no access.
export function successorR1IndexFor(floor,glazing='CLOSED',cutaway=false){
 if(typeof cutaway!=='boolean')return null;
 const found=Object.entries(SUCCESSOR_R1_SCENES).find(([,e])=>
   e.floor===floor&&e.glazing===glazing&&e.cutaway===cutaway);
 return found?Number(found[0]):null;
}

export function selectSuccessorR1Scene({json,sha,floor,glazing='CLOSED',cutaway=false}={}) {
 if(!['1F','2F','BOTH'].includes(floor) ||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
    typeof cutaway!=='boolean') return {ok:false,reason:'SUCC_R1_INVALID_SELECTION'};
 const index=successorR1IndexFor(floor,glazing,cutaway);
 if(index===null) return {ok:false,reason:'SUCC_R1_UNSUPPORTED_COMBINATION'};
 if(!isM6263Mj72Kiv005Pk1SuccessorSourceScene(json,sha,index,floor,glazing,cutaway))
   return {ok:false,reason:'SUCC_R1_SOURCE_MISMATCH'};
 return {ok:true,sceneIndex:index,floor,glazing,cutaway,modelStage:'WORK_TEST',
   sourceLinksBound:false,physicalConnectionsVerified:false,productionWebGLVerified:false,
   humanReviewVerified:false};
}

// No geometry/material/camera mutation. Verify the actual GLTFLoader scene
// objects against their parser JSON roots before allowing any mount.
export function resolveSuccessorR1Scenes(gltf,sha) {
 const json=gltf?.parser?.json;
 if(sha!==SUCCESSOR_R1_SHA256 || json?.scenes?.length!==SUCCESSOR_R1_SCENE_COUNT ||
    gltf?.scenes?.length!==SUCCESSOR_R1_SCENE_COUNT) return null;
 const scenes={};
 for(const [key,e] of Object.entries(SUCCESSOR_R1_SCENES)){
   const i=Number(key),scene=gltf.scenes[i],roots=json.scenes[i]?.nodes;
   if(!isM6263Mj72Kiv005Pk1SuccessorSourceScene(json,sha,i,e.floor,e.glazing,e.cutaway)||
      !scene || !sameSourceName(scene.name,e.name) || !Array.isArray(roots) ||
      !Array.isArray(scene.children) || scene.children.length!==roots.length ||
      !roots.every((id,n)=>nameMatches(scene.children[n],json.nodes[id])))return null;
   scenes[i]=scene;
 }
 return scenes;
}

export function createSuccessorR1FloorRuntime({gltf,sha,mount,mounted}) {
 if(typeof mount!=='function'||typeof mounted!=='function')
   throw new Error('SUCC_R1_MOUNT_API_MISSING');
 const scenes=resolveSuccessorR1Scenes(gltf,sha);
 if(!scenes)throw new Error('SUCC_R1_SOURCE_SCENE_MISMATCH');
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=362,active=false,disposed=false;
 const isOwned=()=>Object.values(scenes).includes(mounted());
 function change(nextFloor,nextGlazing,nextCutaway){
   if(disposed||!isOwned())return null;
   const selection=selectSuccessorR1Scene({json:gltf.parser.json,sha,
     floor:nextFloor,glazing:nextGlazing,cutaway:nextCutaway});
   if(!selection.ok)return null;
   const nextScene=scenes[selection.sceneIndex];
   const wasActive=active;
   active=false;
   try {mount(nextScene);}
   finally {active=wasActive;}
   if(mounted()!==nextScene)throw new Error('SUCC_R1_SCENE_MOUNT_MISMATCH');
   floor=nextFloor;glazing=nextGlazing;cutaway=nextCutaway;
   sceneIndex=selection.sceneIndex;
   let included=0;
   nextScene.traverse?.(node=>{if(node.isMesh)included++;});
   return {included,exceptions:[],sceneIndex,modelStage:'WORK_TEST'};
 }
 return {
   available:true,isC80R2Chain:true,isM6263:true,isSuccessorR1:true,
   chainLabel:'TATE + MJ62/MJ63 + MJ72 + KIV005 + PK1',
   floorSceneSource:'SUCC_R1_EXACT_SOURCE',sourceModel:'D_C80',
   sourceSha256:sha,sourceLinksBound:false,
   floorSceneNames:{'1F':scenes[360].name,'2F':scenes[361].name,BOTH:scenes[362].name},
   defaultScene:scenes[362],
   get selectedScene(){return scenes[sceneIndex];},
   get sceneIndex(){return sceneIndex;},
   get active(){return active;},get floor(){return floor;},
   get glazing(){return glazing;},get cutaway(){return cutaway;},
   get stairStatus(){return 'HOST_HOLD';},
   get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
   apply(nextFloor,nextGlazing=glazing){const r=change(nextFloor,nextGlazing,cutaway);if(r)active=true;return r;},
   setGlazing(next){return change(floor,next,cutaway);},
   setCutaway(next){return change(floor,glazing,next);},
   restore(){if(disposed||!isOwned())return;
     const wasActive=active;active=false;
     try{mount(scenes[362]);}finally{active=wasActive;}
     if(mounted()!==scenes[362])throw new Error('SUCC_R1_SCENE_MOUNT_MISMATCH');
     floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=362;active=false;},
   enforce(){},referenceCandidates(){return [];},
   dispose(){disposed=true;active=false;},
 };
}
