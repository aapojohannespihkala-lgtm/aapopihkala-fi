import {
  C80_437_GLB_SHA256, C80_437_SCENES,
  isC80437SourceScene,
} from './privateModelC80437SourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// This runtime only mounts the nine pre-authored source scenes, and owns no
// geometry, parent transform, sourceLink assertion, renderer or publication.
// Work-test identity is checked against the complete inner GLB SHA256 by the
// caller and then against each internal scene, source root and donor scope.
export function resolveC80437SceneIndex(loadedSha, floor, glazing='CLOSED', cutaway=false) {
  if (loadedSha !== C80_437_GLB_SHA256 ||
      !['1F','2F','BOTH'].includes(floor) ||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
      typeof cutaway !== 'boolean') return null;
  const hits=Object.entries(C80_437_SCENES)
    .filter(([,spec])=>spec.floor===floor && spec.glazing===glazing && spec.cutaway===cutaway);
  return hits.length===1 ? Number(hits[0][0]) : null;
}

// UI transitions explicitly cancel an option that the authored source GLB
// doesn't contain. The strict resolver itself never silently aliases it.
export function normalizeC80437Options(floor, glazing, cutaway) {
  if (!['1F','2F','BOTH'].includes(floor) ||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
      typeof cutaway !== 'boolean') return null;
  const nextGlazing=floor==='1F' ? 'CLOSED' : glazing;
  const nextCutaway=cutaway && floor!=='2F' && nextGlazing==='CLOSED';
  return {floor,glazing:nextGlazing,cutaway:nextCutaway};
}

export function resolveC80437Scenes(gltf,sha) {
  const json=gltf?.parser?.json;
  if(sha!==C80_437_GLB_SHA256 || gltf?.scenes?.length!==437) return null;
  /** @type {Record<number, import('three').Group>} */
  const scenes={};
  for (const [key,spec] of Object.entries(C80_437_SCENES)) {
    const id=Number(key),scene=gltf.scenes[id],sourceScene=json?.scenes?.[id];
    const roots=sourceScene?.nodes;
    if(!isC80437SourceScene(
      json,sha,id,spec.floor,spec.glazing,spec.cutaway) ||
      !scene || !sourceScene || !sameSourceName(scene.name,sourceScene.name) ||
      !Array.isArray(roots) || scene.children.length<roots.length ||
      !roots.every((n,i)=>nameMatches(scene.children[i],json.nodes[n])))return null;
    scenes[id]=scene;
  }
  return scenes;
}

export function createC80437FloorRuntime({gltf,sha,mount,mounted}) {
  const scenes=resolveC80437Scenes(gltf,sha);
  if(!scenes)throw new Error('SUCC437_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=430,active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const change=(requestedFloor,requestedGlazing,requestedCutaway)=>{
    if(disposed || !mountedHere())return null;
    const next=normalizeC80437Options(requestedFloor,requestedGlazing,requestedCutaway);
    if(!next)return null;
    const id=resolveC80437SceneIndex(sha,next.floor,next.glazing,next.cutaway);
    if(id===null)return null;
    const wasActive=active;active=false;
    try{mount(scenes[id]);}finally{active=wasActive;}
    if(mounted()!==scenes[id])throw new Error('SUCC437_SCENE_MOUNT_MISMATCH');
    floor=next.floor;glazing=next.glazing;cutaway=next.cutaway;sceneIndex=id;
    let included=0;
    scenes[id].traverse(node=>{if(node.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isC80437:true,
    chainLabel:'C80 437 yhteismalli',
    floorSceneSource:'SUCC437_EXACT_SOURCE',sourceModel:'D_C80',sourceSha256:sha,
    floorSceneNames:{'1F':scenes[428].name,'2F':scenes[429].name,BOTH:scenes[430].name},
    defaultScene:scenes[430],
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
      if(mountedHere())mount(scenes[430]);
      floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=430;active=false;
    },
    enforce(){},referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
