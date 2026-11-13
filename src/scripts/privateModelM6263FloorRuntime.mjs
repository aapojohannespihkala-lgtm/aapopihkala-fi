import { TATE4_MJ6263_SCENES, TATE4_MJ6263_SOURCE_SHA256 } from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import { resolveTate4Mj6263ViewerScene } from './privateModelTate4Mj6263SceneSelection.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// Mount the seven already-authored scenes through the existing model owner.
// This module creates no geometry, changes no materials, and owns no camera.
export function resolveM6263Scenes(gltf,sha) {
  const json=gltf?.parser?.json;
  if (sha!==TATE4_MJ6263_SOURCE_SHA256 || gltf?.scenes?.length!==360) return null;
  /** @type {Record<number, import('three').Group>} */
  const scenes={};
  for (const [index,spec] of Object.entries(TATE4_MJ6263_SCENES)) {
    const selected=resolveTate4Mj6263ViewerScene({sourceJson:json,loadedGlbSha256:sha,floor:spec.floor,glazingState:spec.glazing});
    const i=Number(index),scene=gltf.scenes[i],roots=json?.scenes?.[i]?.nodes;
    if (!selected.ok || !scene || !sameSourceName(scene.name,json.scenes[i].name) ||
        !Array.isArray(roots) || scene.children.length<roots.length ||
        !roots.every((id,n)=>nameMatches(scene.children[n],json.nodes[id]))) return null;
    scenes[i]=scene;
  }
  return scenes;
}

export function createM6263FloorRuntime({gltf,sha,mount,mounted}) {
  const scenes=resolveM6263Scenes(gltf,sha);
  if (!scenes) throw new Error('M6263_SOURCE_SCENE_MISMATCH');
  let floor='BOTH',glazing='CLOSED',sceneIndex=355,active=false,disposed=false;
  const mountedHere=()=>Object.values(scenes).includes(mounted());
  const change=(nextFloor,nextGlazing)=>{
    if (disposed || !mountedHere()) return null;
    const selected=resolveTate4Mj6263ViewerScene({sourceJson:gltf.parser.json,loadedGlbSha256:sha,floor:nextFloor,glazingState:nextGlazing});
    if (!selected.ok) return null;
    floor=nextFloor;glazing=nextGlazing;sceneIndex=selected.sceneIndex;
    mount(scenes[sceneIndex]);
    if (mounted()!==scenes[sceneIndex]) throw new Error('M6263_SCENE_MOUNT_MISMATCH');
    let included=0;scenes[sceneIndex].traverse(node=>{if(node.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isM6263:true,chainLabel:'TATE + parvekelasit + korjattu poisto',
    floorSceneSource:'M6263_EXACT_SOURCE',sourceModel:'D_C80',sourceSha256:sha,
    floorSceneNames:Object.fromEntries(['1F','2F','BOTH'].map(f=>[f,gltf.scenes[f==='1F'?353:f==='2F'?354:355].name])),
    defaultScene:scenes[355],
    get selectedScene(){return scenes[sceneIndex];},get sceneIndex(){return sceneIndex;},
    get active(){return active;},get floor(){return floor;},get glazing(){return glazing;},
    get stairStatus(){return 'HOST_HOLD';},get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
    apply(next){const report=change(next,glazing);if(report)active=true;return report;},
    setGlazing(next){return change(floor,next);},
    restore(){if(disposed)return;if(mountedHere())mount(scenes[355]);floor='BOTH';glazing='CLOSED';sceneIndex=355;active=false;},
    enforce(){},referenceCandidates(){return [];},dispose(){disposed=true;active=false;},
  };
}
