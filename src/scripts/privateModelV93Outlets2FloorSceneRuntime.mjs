// Mount the original V93 double-covered outdoor socket scenes in the existing
// D-apartment floor selector. No GLB edits, sourceLinks rebind or CURRENT claim.
import {
  OUTLETS2_SOURCE_SHA256 as SOURCE_SHA,
  OUTLETS2_OPTIN_SCENES as INDICES,
  OUTLETS2_BUILDING_SCENES as SPECS,
  OUTLETS2_SOURCE_ROOTS as SOCKETS,
} from './privateModelC80R2V93DoubleOutletLayerSourceProfile.mjs';
import {nameMatches, sameSourceName} from './privateModelSourceNodeAssociations.mjs';

export const V93_OUTLETS2_FLOOR_SCENES = INDICES;
const ROOT_FNV = Object.freeze({'1F':'fd7209af','2F':'900b22cf',BOTH:'27048bc0'});
const ROOT_COUNT = Object.freeze({'1F':241,'2F':155,BOTH:394});
const PARENT_SCENE = Object.freeze({'1F':303,'2F':304,BOTH:305});
const FLOOR_ROOTS = Object.freeze({'1F':[11500],'2F':[11514],BOTH:[11500,11514]});
const OLD_SOCKET_ROOTS = [11482,11486];

export function v93Outlets2RootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let hash=2166136261;
  for(const id of ids) {
    if(!Number.isInteger(id)||id<0) return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

export function resolveV93Outlets2Scenes(gltf,verifiedSha) {
  const json=gltf?.parser?.json, sourceScenes=json?.scenes, nodes=json?.nodes;
  if(verifiedSha!==SOURCE_SHA || gltf?.scene!==gltf?.scenes?.[292] ||
     gltf?.scenes?.length!==309 || sourceScenes?.length!==309 ||
     json?.scene!==292 || nodes?.length!==11515 || json?.meshes?.length!==4350 ||
     json?.asset?.extras?.ModelStage!=='WORK_TEST' ||
     json?.asset?.extras?.current!==false ||
     json?.asset?.extras?.asBuilt!==false ||
     json?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN') return null;
  if(nodes[11500]?.name!==SOCKETS['1F'].name ||
     nodes[11514]?.name!==SOCKETS['2F'].name ||
     nodes[11500]?.extras?.numSocketPositions!==2 ||
     nodes[11514]?.extras?.numSocketPositions!==2 ||
     nodes[11500]?.extras?.oneProtectivePlasticCover!==true ||
     nodes[11514]?.extras?.oneProtectivePlasticCover!==true ||
     nodes[11500]?.extras?.hostHold!==true || nodes[11514]?.extras?.hostHold!==true ||
     nodes[11500]?.extras?.asBuilt!==false || nodes[11514]?.extras?.asBuilt!==false ||
     nodes[11500]?.extras?.physicalWiring!=='NOT_MODELED_OR_VERIFIED' ||
     nodes[11514]?.extras?.physicalWiring!=='NOT_MODELED_OR_VERIFIED') return null;
  const scenes={};
  for(const floor of ['1F','2F','BOTH']){
    const i=INDICES[floor], source=sourceScenes[i], scene=gltf.scenes[i],
          expected=SPECS[i]?.rootNodes, roots=source?.nodes, meta=source?.extras;
    if(!scene || !source || !Array.isArray(roots) || !Array.isArray(expected) ||
       source.name!==SPECS[i].name || !sameSourceName(scene.name,source.name) ||
       roots.length!==ROOT_COUNT[floor] || new Set(roots).size!==roots.length ||
       roots.some((id,pos)=>id!==expected[pos]) ||
       v93Outlets2RootFnv32(roots)!==ROOT_FNV[floor] ||
       OLD_SOCKET_ROOTS.some(id=>roots.includes(id)) ||
       !FLOOR_ROOTS[floor].every(id=>roots.includes(id)) ||
       [11500,11514].some(id=>roots.includes(id)!==FLOOR_ROOTS[floor].includes(id)) ||
       meta?.sourceScene!==PARENT_SCENE[floor] ||
       meta?.workTest!==true || meta?.hostHold!==true ||
       meta?.current!==false || meta?.asBuilt!==false ||
       meta?.productionApproved!==false ||
       meta?.electricalWiringVerified!==false ||
       JSON.stringify(meta?.replacesOldGenericSingleSocketNodesOnlyInThisOptInScene)!==
         JSON.stringify(floor==='1F'?[11482]:floor==='2F'?[11486]:[11482,11486]) ||
       scene.children?.length<roots.length ||
       !roots.every((id,pos)=>nameMatches(scene.children[pos],nodes[id]))) return null;
    scenes[floor]=scene;
  }
  return scenes;
}

// Only the pre-authored 306/307/308 can be mounted. The original default
// glTF scene292 is a reversible whole-building baseline, never rewritten.
export function createV93Outlets2FloorRuntime({gltf,sha,mount,mounted}){
  const scenes=resolveV93Outlets2Scenes(gltf,sha);
  if(!scenes)throw new Error('V93_OUTLETS2_SOURCE_SCENE_MISMATCH');
  const baseline=gltf.scene;
  let floor='BOTH',sceneIndex=292,active=false,disposed=false;
  const owned=()=>mounted()===baseline || Object.values(scenes).includes(mounted());
  const change=next=>{
    if(disposed || !Object.hasOwn(scenes,next) || !owned())return null;
    const index=INDICES[next],previous=mounted(),wasActive=active;
    active=false;
    try{
      mount(scenes[next]);
      if(mounted()!==scenes[next])throw new Error('V93_OUTLETS2_MOUNT_MISMATCH');
    }catch(e){
      if(mounted()!==previous)mount(previous);
      throw e;
    }finally{active=wasActive;}
    floor=next;sceneIndex=index;active=true;
    let included=0;
    scenes[next].traverse(node=>{if(node?.isMesh)included++;});
    return {included,exceptions:[]};
  };
  return {
    available:true,isC80R2Chain:true,isV93Outlets2:true,
    chainLabel:'V93 kaksoissuojakannelliset ulkopistorasiat',
    floorSceneSource:'V93_OUTLETS2_EXACT_SHA_SOURCE',
    floorSceneNames:Object.fromEntries(Object.entries(INDICES).map(([f,i])=>[f,gltf.scenes[i].name])),
    sourceModel:'D_C80',sourceSha256:sha,defaultScene:baseline,
    get selectedScene(){return active?scenes[floor]:baseline;},
    get sceneIndex(){return sceneIndex;},get active(){return active;},
    get floor(){return floor;},get stairStatus(){return 'HOST_HOLD';},
    get t04Status(){return 'SOURCE_SCENE_UNMODIFIED';},
    apply(next){return change(next);},
    restore(){
      if(disposed)return;
      const wasActive=active;active=false;
      try{if(Object.values(scenes).includes(mounted()))mount(baseline);}
      finally{active=false;}
      floor='BOTH';sceneIndex=292;
    },
    enforce(){},referenceCandidates(){return [];},
    dispose(){disposed=true;active=false;},
  };
}
