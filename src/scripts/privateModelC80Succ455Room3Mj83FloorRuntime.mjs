import {
  C80_SUCC455_SAVO483_GLB_SHA256,
  C80_SUCC455_SAVO483_SCENES,
  isC80Succ455Savo483SourceScene,
} from './privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// Source-exact, opt-in 2F/BOTH scene switcher for the 483-scene WORK_TEST model.
// 1F is intentionally NOT accepted: 1F scene 467/468 is inherited from an
// older GLB SHA and needs its own 483-SHA identity gate before viewer wiring.
// No sourceLinks binding, candidate registration, publish or CURRENT approval.
export const C80_SUCC455_SAVO483_VIEWER_ROLES = Object.freeze({
  476: Object.freeze({floor:'2F',glazing:'CLOSED',cutaway:false}),
  477: Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:false}),
  478: Object.freeze({floor:'2F',glazing:'ONE_OPEN',cutaway:false}),
  479: Object.freeze({floor:'BOTH',glazing:'ONE_OPEN',cutaway:false}),
  480: Object.freeze({floor:'2F',glazing:'STACKED',cutaway:false}),
  481: Object.freeze({floor:'BOTH',glazing:'STACKED',cutaway:false}),
  482: Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:true}),
});

const floors = ['2F','BOTH'];
const glazingModes = ['CLOSED','ONE_OPEN','STACKED'];
export function normalizeC80Succ455Savo483Options(floor,glazing,cutaway){
  if(!floors.includes(floor)||!glazingModes.includes(glazing)||
     typeof cutaway!=='boolean')return null;
  if(cutaway&&(floor!=='BOTH'||glazing!=='CLOSED'))return null;
  return {floor,glazing,cutaway};
}

export function resolveC80Succ455Savo483SceneIndex(
  sha,floor,glazing='CLOSED',cutaway=false
){
  if(sha!==C80_SUCC455_SAVO483_GLB_SHA256||
     !normalizeC80Succ455Savo483Options(floor,glazing,cutaway))return null;
  const ids=Object.entries(C80_SUCC455_SAVO483_VIEWER_ROLES)
    .filter(([,role])=>role.floor===floor&&role.glazing===glazing&&role.cutaway===cutaway);
  return ids.length===1?Number(ids[0][0]):null;
}

export function resolveC80Succ455Savo483Scenes(gltf,authenticatedSha){
  if(authenticatedSha!==C80_SUCC455_SAVO483_GLB_SHA256||
     gltf?.scenes?.length!==483||!gltf?.parser?.json||
     Object.keys(C80_SUCC455_SAVO483_SCENES).length!==7)return null;
  const json=gltf.parser.json;
  const result={};
  for(const [idString,role] of Object.entries(C80_SUCC455_SAVO483_VIEWER_ROLES)){
    const id=Number(idString),expected=json.scenes?.[id],rendered=gltf.scenes[id];
    if(C80_SUCC455_SAVO483_SCENES[id]?.floor!==role.floor||
       !isC80Succ455Savo483SourceScene(json,authenticatedSha,id,role.floor)||
       !expected||!rendered||!sameSourceName(rendered.name,expected.name)||
       !Array.isArray(expected.nodes)||!Array.isArray(rendered.children)||
       rendered.children.length<expected.nodes.length||
       !expected.nodes.every((node,i)=>nameMatches(rendered.children[i],json.nodes[node])))
      return null;
    result[id]=rendered;
  }
  return result;
}

export function createC80Succ455Savo483FloorRuntime({gltf,sha,mount,mounted}){
  if(typeof mount!=='function'||typeof mounted!=='function')
    throw new Error('SUCC455_SAVO483_MOUNT_CONTRACT');
  const scenes=resolveC80Succ455Savo483Scenes(gltf,sha);
  if(!scenes)throw new Error('SUCC455_SAVO483_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=477;
  let active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const switchTo=(nextFloor,nextGlazing,nextCutaway)=>{
    if(disposed||!mountedHere()||
       !normalizeC80Succ455Savo483Options(nextFloor,nextGlazing,nextCutaway))return null;
    const nextIndex=resolveC80Succ455Savo483SceneIndex(sha,nextFloor,nextGlazing,nextCutaway);
    if(nextIndex===null)return null;
    const previousActive=active;
    active=false;
    try{mount(scenes[nextIndex]);}
    finally{active=previousActive;}
    if(mounted()!==scenes[nextIndex])throw new Error('SUCC455_SAVO483_SCENE_MOUNT_MISMATCH');
    floor=nextFloor;glazing=nextGlazing;cutaway=nextCutaway;sceneIndex=nextIndex;
    let included=0;
    scenes[nextIndex].traverse?.(object=>{if(object?.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isC80Succ455Savo483:true,
    chainLabel:'C80 SUCC455 + ROOM3 + MJ83 (483 WORK_TEST)',
    floorSceneSource:'SUCC455_SAVO483_EXACT_SOURCE',
    sourceModel:'D_C80',sourceSha256:sha,
    floorSceneNames:{'2F':scenes[476].name,BOTH:scenes[477].name},
    defaultScene:scenes[477],
    get selectedScene(){return scenes[sceneIndex];},
    get sceneIndex(){return sceneIndex;},
    get active(){return active;},
    get floor(){return floor;},
    get glazing(){return glazing;},
    get cutaway(){return cutaway;},
    get stairStatus(){return 'HOST_HOLD';},
    get publicationStatus(){return 'NOT_AUTHORIZED';},
    apply(next,nextGlazing=glazing){
      const result=switchTo(next,nextGlazing,cutaway);
      if(result)active=true;
      return result;
    },
    setGlazing(next){return switchTo(floor,next,cutaway);},
    setCutaway(enabled){
      if(typeof enabled!=='boolean')return null;
      return switchTo(floor,glazing,enabled);
    },
    restore(){
      if(disposed)return;
      if(mountedHere())mount(scenes[477]);
      floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=477;active=false;
    },
    enforce(){},referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
