import {
  SUCCESSOR_R1_SHA256, SUCCESSOR_R1_SCENES,
  isM6263Mj72Kiv005Pk1SuccessorSourceScene,
} from './privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// This runtime only mounts the nine pre-authored source scenes, and owns no
// geometry, parent transform, sourceLink assertion, renderer or publication.
// Work-test identity is checked against the complete inner GLB SHA256 by the
// caller and then against each internal scene, source root and donor scope.
export function resolveSuccessor369SceneIndex(loadedSha, floor, glazing='CLOSED', cutaway=false) {
  if (loadedSha !== SUCCESSOR_R1_SHA256 ||
      !['1F','2F','BOTH'].includes(floor) ||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
      typeof cutaway !== 'boolean') return null;
  const hits=Object.entries(SUCCESSOR_R1_SCENES)
    .filter(([,spec])=>spec.floor===floor && spec.glazing===glazing && spec.cutaway===cutaway);
  return hits.length===1 ? Number(hits[0][0]) : null;
}

// UI transitions explicitly cancel an option that the authored source GLB
// doesn't contain. The strict resolver itself never silently aliases it.
export function normalizeSuccessor369Options(floor, glazing, cutaway) {
  if (!['1F','2F','BOTH'].includes(floor) ||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
      typeof cutaway !== 'boolean') return null;
  const nextGlazing=floor==='1F' ? 'CLOSED' : glazing;
  const nextCutaway=cutaway && floor!=='2F' && nextGlazing==='CLOSED';
  return {floor,glazing:nextGlazing,cutaway:nextCutaway};
}

export function resolveSuccessor369Scenes(gltf,sha) {
  const json=gltf?.parser?.json;
  if(sha!==SUCCESSOR_R1_SHA256 || gltf?.scenes?.length!==369) return null;
  /** @type {Record<number, import('three').Group>} */
  const scenes={};
  for (const [key,spec] of Object.entries(SUCCESSOR_R1_SCENES)) {
    const id=Number(key),scene=gltf.scenes[id],sourceScene=json?.scenes?.[id];
    const roots=sourceScene?.nodes;
    if(!isM6263Mj72Kiv005Pk1SuccessorSourceScene(
      json,sha,id,spec.floor,spec.glazing,spec.cutaway) ||
      !scene || !sourceScene || !sameSourceName(scene.name,sourceScene.name) ||
      !Array.isArray(roots) || scene.children.length<roots.length ||
      !roots.every((n,i)=>nameMatches(scene.children[i],json.nodes[n])))return null;
    scenes[id]=scene;
  }
  return scenes;
}

export function createSuccessor369FloorRuntime({gltf,sha,mount,mounted}) {
  const scenes=resolveSuccessor369Scenes(gltf,sha);
  if(!scenes)throw new Error('SUCC369_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=362,active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const change=(requestedFloor,requestedGlazing,requestedCutaway)=>{
    if(disposed || !mountedHere())return null;
    const next=normalizeSuccessor369Options(requestedFloor,requestedGlazing,requestedCutaway);
    if(!next)return null;
    const id=resolveSuccessor369SceneIndex(sha,next.floor,next.glazing,next.cutaway);
    if(id===null)return null;
    const wasActive=active;active=false;
    try{mount(scenes[id]);}finally{active=wasActive;}
    if(mounted()!==scenes[id])throw new Error('SUCC369_SCENE_MOUNT_MISMATCH');
    floor=next.floor;glazing=next.glazing;cutaway=next.cutaway;sceneIndex=id;
    let included=0;
    scenes[id].traverse(node=>{if(node.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isSuccessor369:true,
    chainLabel:'TATE + parvekelasit + MJ72 + KIV005 + PK1',
    floorSceneSource:'SUCC369_EXACT_SOURCE',sourceModel:'D_C80',sourceSha256:sha,
    floorSceneNames:{'1F':scenes[360].name,'2F':scenes[361].name,BOTH:scenes[362].name},
    defaultScene:scenes[362],
    get selectedScene(){return scenes[sceneIndex];},
    get sceneIndex(){return sceneIndex;},
    get active(){return active;},
    get floor(){return floor;},
    get glazing(){return glazing;},
    get cutaway(){return cutaway;},
    get stairStatus(){return 'HOST_HOLD';},
    get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
    apply(next,nextGlazing=glazing){const r=change(next,nextGlazing,cutaway);if(r)active=true;return r;},
    setGlazing(next){return change(floor,next,cutaway);},
    setCutaway(enabled){
      if(typeof enabled!=='boolean' || enabled &&
        (floor==='2F' || glazing!=='CLOSED'))return null;
      return change(floor,glazing,enabled);
    },
    restore(){
      if(disposed)return;
      if(mountedHere())mount(scenes[362]);
      floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=362;active=false;
    },
    enforce(){},referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
