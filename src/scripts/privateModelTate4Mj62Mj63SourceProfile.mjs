// Source-exact read-only receiver for the TATE4 + MJ62 + MJ63R2 WORK_TEST.
// Callers must independently SHA256-check the complete inner GLB before passing
// loadedSha. This is not a publisher, sourceLinks rebind, WebGL or human review.
// G2b TYÖ EI AUTO: https://drive.google.com/file/d/1N5XOx_Nnd51dK2QQ4iOg1FzIyRJzQboz/view
export const TATE4_MJ6263_SOURCE_SHA256='8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5';
export const TATE4_MJ6263_PARENT_SHA256='ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b';
export const TATE4_MJ6263_MJ62_SHA256='4fed8b19d45aae96e6efe7a4dcda173cd4ca8af1da7d11e165d02dccf60f6d8e';
export const TATE4_MJ6263_MJ63_SHA256='2e251b08c94f3f4bee8c51eabf66b93b86b03d2b15c90ee2b306fbc15c7db008';
export const TATE4_MJ6263_DONOR_IDS=Object.freeze({mj62:'13TM02G7KJgi8793IT7l36v9rTSHTMq8m',mj63:'1v8tyPG99W-jglBnHO7VHnxEUj7Sz8S2i'});
export const TATE4_MJ6263_PARENT_FLOORS=Object.freeze({'1F':350,'2F':351,BOTH:352});
export const TATE4_MJ6263_FLOORS=Object.freeze({'1F':353,'2F':354,BOTH:355});
export const TATE4_MJ6263_DEFAULT_SCENE=292;
export const TATE4_MJ6263_SCENE_COUNT=360;
export const TATE4_MJ6263_NODE_COUNT=12097;
export const TATE4_MJ6263_MESH_COUNT=4549;
export const TATE4_MJ6263_SCENES=Object.freeze({
  353:Object.freeze({floor:'1F',glazing:'CLOSED',parent:350,roots:289,fnv:'5441c54f'}),
  354:Object.freeze({floor:'2F',glazing:'CLOSED',parent:351,roots:184,fnv:'4e28cbb7'}),
  355:Object.freeze({floor:'BOTH',glazing:'CLOSED',parent:352,roots:464,fnv:'51902f0b'}),
  356:Object.freeze({floor:'2F',glazing:'ONE_OPEN',parent:351,roots:184,fnv:'7929c305'}),
  357:Object.freeze({floor:'BOTH',glazing:'ONE_OPEN',parent:352,roots:464,fnv:'ef3d35c7'}),
  358:Object.freeze({floor:'2F',glazing:'STACKED',parent:351,roots:184,fnv:'7c88cd5f'}),
  359:Object.freeze({floor:'BOTH',glazing:'STACKED',parent:352,roots:464,fnv:'e3608573'}),
});
export function tate4Mj6263RootsFnv32(roots) {
  if(!Array.isArray(roots)) return null;
  let hash=2166136261;
  for(const id of roots){
    if(!Number.isInteger(id)||id<0) return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
function validNewNodes(nodes){
  for(let i=12077;i<=12096;i++){
    const n=nodes[i],ex=n?.extras,src=ex?.integrationSource;
    const isMJ62=i<=12085;
    if(!n||ex?.current!==false||ex?.asBuilt!==false||ex?.modelStage!=='WORK_TEST'||
       ex?.humanReview!=='NOT_RUN'||ex?.productionWebGL!=='NOT_RUN'||
       !Array.isArray(ex.sourceLinks)||ex.sourceLinks.length===0||
       src?.donorGLBSHA256!==(isMJ62?TATE4_MJ6263_MJ62_SHA256:TATE4_MJ6263_MJ63_SHA256)||
       src?.donorDriveId!==(isMJ62?TATE4_MJ6263_DONOR_IDS.mj62:TATE4_MJ6263_DONOR_IDS.mj63))return false;
  }
  return JSON.stringify(nodes[12092]?.children)==='[12093,12094,12095]' &&
    nodes[12096]?.name==='MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST' &&
    nodes[12092]?.name==='MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE';
}
// Scene indexes are glTF indexes, not filename __sceneN conventions.
// The exact source hash is an external precondition. A positive result only
// allows this WORK_TEST scene to enter the existing viewer's guarded receiver.
export function isTate4Mj62Mj63SourceScene(json,loadedSha,sceneIndex,floor=null,glazing=null){
  const e=TATE4_MJ6263_SCENES[sceneIndex];
  const a=json?.asset?.extras,s=json?.scenes?.[sceneIndex],x=s?.extras,integr=x?.integration;
  const roots=s?.nodes;
  const expectedName='C80_TATE_MJ62_MJ63_'+e?.floor+'_'+e?.glazing+'_WORK_TEST_HOST_HOLD_20261113__scene'+sceneIndex;
  if(loadedSha!==TATE4_MJ6263_SOURCE_SHA256||!e||
     (floor!==null&&floor!==e.floor)||(glazing!==null&&glazing!==e.glazing)||
     json?.scene!==TATE4_MJ6263_DEFAULT_SCENE||
     json?.scenes?.length!==TATE4_MJ6263_SCENE_COUNT||
     json?.nodes?.length!==TATE4_MJ6263_NODE_COUNT||
     json?.meshes?.length!==TATE4_MJ6263_MESH_COUNT||
     a?.Canonical!==false||a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||
     a?.HUMAN_REVIEW!=='NOT_RUN'||
     !Object.entries(TATE4_MJ6263_PARENT_FLOORS).every(([f,i])=>a?.viewerFloorScenes?.[f]===i)||
     s?.name!==expectedName||
     !Array.isArray(roots)||roots.length!==e.roots||roots.length!==new Set(roots).size||
     roots.some(id=>!Number.isInteger(id)||id<0||id>=TATE4_MJ6263_NODE_COUNT)||
     tate4Mj6263RootsFnv32(roots)!==e.fnv||roots.includes(11315)||
     x?.current!==false||x?.asBuilt!==false||x?.stage!=='WORK_TEST_HOST_HOLD'||
     x?.physicalConnectionsVerified!==0||x?.sourceParentGLBSHA256!==TATE4_MJ6263_PARENT_SHA256||
     x?.productionWebGL!=='NOT_RUN'||x?.humanReview!=='NOT_RUN'||
     integr?.task!=='GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113'||
     integr?.parentScene!==e.parent||integr?.floor!==e.floor||integr?.glazingState!==e.glazing||
     integr?.sourceGLBSHA256?.tate4!==TATE4_MJ6263_PARENT_SHA256||
     integr?.sourceGLBSHA256?.mj62!==TATE4_MJ6263_MJ62_SHA256||
     integr?.sourceGLBSHA256?.mj63!==TATE4_MJ6263_MJ63_SHA256||
     !validNewNodes(json.nodes))return false;
  const d1=e.floor!=='2F',isOne=e.glazing==='ONE_OPEN',isStack=e.glazing==='STACKED';
  if(d1!==[12086,12087,12088,12089,12090,12091,12092,12096].every(id=>roots.includes(id)))return false;
  if(roots.includes(12077)!==isOne)return false;
  if((Array.from({length:8},(_,i)=>12078+i).every(id=>roots.includes(id)))!==isStack)return false;
  if(!isStack && roots.some(id=>id>=12078&&id<=12085))return false;
  return true;
}
