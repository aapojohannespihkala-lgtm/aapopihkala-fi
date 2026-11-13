import {
  VP1_383_GLB_SHA256,
  VP1_383_SCENES,
  isVP1383SourceScene,
  resolveVP1383SourceSceneIndex,
} from './privateModelVP1383HiddenHoseSourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// Opt-in WORK_TEST presentation only. Never changes source geometry, current
// classification, sourceLinks, publisher state, or the default scene 292.
// Only the five authored private inner glTF scenes 378..382 are selectable.
export function normalizeVP1383Options(floor,glazing,cutaway){
  if(!['1F','BOTH'].includes(floor) ||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
    typeof cutaway!=='boolean')return null;
  const nextGlazing=floor==='1F'?'CLOSED':glazing;
  const nextCutaway=cutaway && floor==='BOTH' && nextGlazing==='CLOSED';
  return {floor,glazing:nextGlazing,cutaway:nextCutaway};
}

export function resolveVP1383Scenes(gltf,sha){
  const json=gltf?.parser?.json;
  if(sha!==VP1_383_GLB_SHA256 ||
    gltf?.scenes?.length!==383 ||
    json?.scenes?.length!==383)return null;
  const available={};
  for(const [key,spec] of Object.entries(VP1_383_SCENES)){
    const i=Number(key),source=json.scenes[i],scene=gltf.scenes[i],roots=source?.nodes;
    if(!isVP1383SourceScene(json,sha,i,spec.floor,spec.glazing,spec.cutaway) ||
      !scene || !source || !sameSourceName(scene.name,source.name) ||
      !Array.isArray(roots) || !Array.isArray(scene.children) ||
      scene.children.length<roots.length ||
      !roots.every((node,j)=>nameMatches(scene.children[j],json.nodes[node])))return null;
    available[i]=scene;
  }
  return available;
}

export function createVP1383FloorRuntime({gltf,sha,mount,mounted}){
  if(typeof mount!=='function'||typeof mounted!=='function')
    throw new Error('VP1_383_RUNTIME_CALLBACKS_REQUIRED');
  const scenes=resolveVP1383Scenes(gltf,sha);
  if(!scenes)throw new Error('VP1_383_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',cutaway=false,index=379,active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const change=(nextFloor,nextGlazing,nextCutaway)=>{
    if(disposed || !mountedHere())return null;
    const next=normalizeVP1383Options(nextFloor,nextGlazing,nextCutaway);
    if(!next)return null;
    const wanted=resolveVP1383SourceSceneIndex(
      sha,next.floor,next.glazing,next.cutaway);
    if(wanted===null || !scenes[wanted])return null;
    const wasActive=active;
    active=false;
    try{mount(scenes[wanted]);}
    finally{active=wasActive;}
    if(mounted()!==scenes[wanted])
      throw new Error('VP1_383_SCENE_MOUNT_MISMATCH');
    floor=next.floor;
    glazing=next.glazing;
    cutaway=next.cutaway;
    index=wanted;
    let included=0;
    scenes[wanted].traverse(node=>{if(node.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,
    isC80R2Chain:true,
    isVP1383WorkTest:true,
    sourceModel:'D_C80',
    sourceSha256:sha,
    floorSceneSource:'VP1_383_EXACT_SOURCE',
    chainLabel:'C80 + MJ89 + KP010 + VP1 piilossa - WORK_TEST',
    floorSceneNames:{'1F':scenes[378].name,BOTH:scenes[379].name},
    defaultScene:scenes[379],
    get selectedScene(){return scenes[index];},
    get sceneIndex(){return index;},
    get active(){return active;},
    get floor(){return floor;},
    get glazing(){return glazing;},
    get cutaway(){return cutaway;},
    get stairStatus(){return 'HOST_HOLD';},
    get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
    apply(f,glass=glazing){const result=change(f,glass,cutaway);if(result)active=true;return result;},
    setGlazing(glass){return change(floor,glass,cutaway);},
    setCutaway(value){
      if(typeof value!=='boolean' || (value &&
        (floor!=='BOTH'||glazing!=='CLOSED')))return null;
      return change(floor,glazing,value);
    },
    restore(){
      if(disposed)return;
      if(mountedHere())mount(scenes[379]);
      floor='BOTH';glazing='CLOSED';cutaway=false;index=379;active=false;
    },
    enforce(){},
    referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
