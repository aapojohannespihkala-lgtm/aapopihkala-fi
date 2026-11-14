import {
  C80_SUCC455_GLB_SHA256,
  C80_SUCC455_SCENES,
  isC80Succ455LedSpacingSourceScene,
} from './privateModelC80Succ455LedSpacingSourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// Read-only scene mounting for the nine authentic SUCC455 LED spacing variants.
// This module does not authorize new sourceLinks, production publication,
// physical positioning, CURRENT/as-built or HUMAN_REVIEW.
const roles = Object.freeze({
  460: Object.freeze({floor:'2F',glazing:'CLOSED',cutaway:false}),
  461: Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:false}),
  462: Object.freeze({floor:'2F',glazing:'ONE_OPEN',cutaway:false}),
  463: Object.freeze({floor:'BOTH',glazing:'ONE_OPEN',cutaway:false}),
  464: Object.freeze({floor:'2F',glazing:'STACKED',cutaway:false}),
  465: Object.freeze({floor:'BOTH',glazing:'STACKED',cutaway:false}),
  466: Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:true}),
  467: Object.freeze({floor:'1F',glazing:'CLOSED',cutaway:false}),
  468: Object.freeze({floor:'1F',glazing:'CLOSED',cutaway:true}),
});
export const C80_SUCC455_VIEWER_ROLES=roles;
const knownFloors=['1F','2F','BOTH'], knownGlazing=['CLOSED','ONE_OPEN','STACKED'];
export function normalizeC80Succ455Options(floor,glazing,cutaway){
  if(!knownFloors.includes(floor)||!knownGlazing.includes(glazing)||typeof cutaway!=='boolean')return null;
  const nextGlazing=floor==='1F'?'CLOSED':glazing;
  return {floor,glazing:nextGlazing,cutaway:cutaway&&floor!=='2F'&&nextGlazing==='CLOSED'};
}
export function resolveC80Succ455SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==C80_SUCC455_GLB_SHA256||!knownFloors.includes(floor)||
     !knownGlazing.includes(glazing)||typeof cutaway!=='boolean')return null;
  const ids=Object.entries(roles).filter(([,r])=>r.floor===floor&&r.glazing===glazing&&r.cutaway===cutaway);
  return ids.length===1?Number(ids[0][0]):null;
}
export function resolveC80Succ455Scenes(gltf,sha){
  if(sha!==C80_SUCC455_GLB_SHA256||gltf?.scenes?.length!==469||
     !gltf?.parser?.json||Object.keys(C80_SUCC455_SCENES).length!==9)return null;
  const json=gltf.parser.json;
  const scenes={};
  for(const [key,r] of Object.entries(roles)){
    const id=Number(key),s=gltf.scenes[id],source=json.scenes?.[id],roots=source?.nodes;
    if(C80_SUCC455_SCENES[id]?.floor!==r.floor||
       !isC80Succ455LedSpacingSourceScene(json,sha,id,r.floor)||
       !s||!source||!sameSourceName(s.name,source.name)||!Array.isArray(roots)||
       !Array.isArray(s.children)||s.children.length<roots.length||
       !roots.every((node,i)=>nameMatches(s.children[i],json.nodes[node])))return null;
    scenes[id]=s;
  }
  return scenes;
}
export function createC80Succ455FloorRuntime({gltf,sha,mount,mounted}){
  if(typeof mount!=='function'||typeof mounted!=='function')throw new Error('SUCC455_MOUNT_CONTRACT');
  const scenes=resolveC80Succ455Scenes(gltf,sha);
  if(!scenes)throw new Error('SUCC455_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=461,active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const change=(requestedFloor,requestedGlazing,requestedCutaway)=>{
    if(disposed||!mountedHere())return null;
    const next=normalizeC80Succ455Options(requestedFloor,requestedGlazing,requestedCutaway);
    if(!next)return null;
    const id=resolveC80Succ455SceneIndex(sha,next.floor,next.glazing,next.cutaway);
    if(id===null)return null;
    const previousActive=active;active=false;
    try{mount(scenes[id]);}finally{active=previousActive;}
    if(mounted()!==scenes[id])throw new Error('SUCC455_SCENE_MOUNT_MISMATCH');
    floor=next.floor;glazing=next.glazing;cutaway=next.cutaway;sceneIndex=id;
    let included=0;
    scenes[id].traverse?.(obj=>{if(obj?.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isC80Succ455:true,
    chainLabel:'C80 455 vuoden 2015 valaisinvälit',
    floorSceneSource:'SUCC455_EXACT_SOURCE',sourceModel:'D_C80',sourceSha256:sha,
    floorSceneNames:{'1F':scenes[467].name,'2F':scenes[460].name,BOTH:scenes[461].name},
    defaultScene:scenes[461],
    get selectedScene(){return scenes[sceneIndex];},
    get sceneIndex(){return sceneIndex;},
    get active(){return active;},
    get floor(){return floor;},
    get glazing(){return glazing;},
    get cutaway(){return cutaway;},
    get stairStatus(){return 'HOST_HOLD';},
    get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
    apply(next,nextGlazing=glazing){const result=change(next,nextGlazing,cutaway);if(result)active=true;return result;},
    setGlazing(next){return change(floor,next,cutaway);},
    setCutaway(enabled){
      if(typeof enabled!=='boolean'||(enabled&&(floor==='2F'||glazing!=='CLOSED')))return null;
      return change(floor,glazing,enabled);
    },
    restore(){
      if(disposed)return;
      if(mountedHere())mount(scenes[461]);
      floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=461;active=false;
    },
    enforce(){},referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
