// SHA-locked source-only receiver for the owner's 2F floor z-fighting WORK_TEST.
// A trusted caller must first SHA256 the complete inner GLB, not the outer ZIP.
// The returned true is not sourceLinks rebind, publication, WebGL or human review.
export const FLOOR_ZFIGHT_DRIVE_ID='183YkkoV6_9bU-i3U2SbtdKAb8H5v7HCG';
export const FLOOR_ZFIGHT_ZIP_SHA256='caf3a7b5c1975f12fa2647538990e4e569515566d95bbf172e9179f7a6c70b09';
export const FLOOR_ZFIGHT_GLB_SHA256='5784807c11ddc2011b813ae9ce3c81dd7ce44b8eb5f0e8660a0f1f0cbc2ad72f';
export const FLOOR_ZFIGHT_GLB_BYTES=54044948;
export const FLOOR_ZFIGHT_PARENT_GLB_SHA256='31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2';
export const FLOOR_ZFIGHT_DEFAULT_SCENE=292;
export const FLOOR_ZFIGHT_COUNTS=Object.freeze({scenes:373,nodes:12109,meshes:4557});
// These are INTERNAL glTF scene indexes, not a filename suffix.
export const FLOOR_ZFIGHT_SCENES=Object.freeze({
  369:Object.freeze({name:'C80_M6263_MJ72_KIV005_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113_FLOOR_ZFIGHT_FIX_OPTIN',floor:'BOTH',glazing:'CLOSED',cutaway:false,sourceScene:362,roots:464,rootFnv:'2dc4be49'}),
  370:Object.freeze({name:'C80_M6263_MJ72_KIV005_BOTH_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113_FLOOR_ZFIGHT_FIX_OPTIN',floor:'BOTH',glazing:'ONE_OPEN',cutaway:false,sourceScene:364,roots:464,rootFnv:'46300329'}),
  371:Object.freeze({name:'C80_M6263_MJ72_KIV005_BOTH_STACKED_WORK_TEST_HOST_HOLD_20261113_FLOOR_ZFIGHT_FIX_OPTIN',floor:'BOTH',glazing:'STACKED',cutaway:false,sourceScene:366,roots:464,rootFnv:'1bbefa31'}),
  372:Object.freeze({name:'C80_M6263_MJ72_KIV005_PK1_CUTAWAY_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113_FLOOR_ZFIGHT_FIX_OPTIN',floor:'BOTH',glazing:'CLOSED',cutaway:true,sourceScene:368,roots:464,rootFnv:'fbcfb452'}),
});
export function floorZfightRootsFnv32(ids){
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const id of ids){
    if(!Number.isInteger(id)||id<0)return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
export function resolveFloorZfightSceneIndex(loadedSha,floor,glazing='CLOSED',cutaway=false){
  if(loadedSha!==FLOOR_ZFIGHT_GLB_SHA256 || floor!=='BOTH' ||
     !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||typeof cutaway!=='boolean')return null;
  const matches=Object.entries(FLOOR_ZFIGHT_SCENES).filter(([,s])=>
    s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
  return matches.length===1?Number(matches[0][0]):null;
}
export function isFloorZfightSourceScene(gltf,loadedSha,index,floor=null,glazing=null,cutaway=null){
  const spec=FLOOR_ZFIGHT_SCENES[index],scene=gltf?.scenes?.[index];
  const asset=gltf?.asset?.extras,fx=scene?.extras?.floorZFightFix;
  if(loadedSha!==FLOOR_ZFIGHT_GLB_SHA256||!spec||!scene||
     (floor!==null&&spec.floor!==floor)||
     (glazing!==null&&spec.glazing!==glazing)||
     (cutaway!==null&&spec.cutaway!==cutaway)||
     gltf?.scene!==FLOOR_ZFIGHT_DEFAULT_SCENE||
     gltf?.scenes?.length!==FLOOR_ZFIGHT_COUNTS.scenes||
     gltf?.nodes?.length!==FLOOR_ZFIGHT_COUNTS.nodes||
     gltf?.meshes?.length!==FLOOR_ZFIGHT_COUNTS.meshes||
     asset?.ModelStage!=='WORK_TEST'||asset?.Canonical!==false||
     asset?.current!==false||asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
     scene.name!==spec.name||
     !Array.isArray(scene.nodes)||scene.nodes.length!==spec.roots||
     new Set(scene.nodes).size!==spec.roots||
     scene.nodes.some(i=>!Number.isInteger(i)||i<0||i>=FLOOR_ZFIGHT_COUNTS.nodes)||
     floorZfightRootsFnv32(scene.nodes)!==spec.rootFnv||
     !scene.nodes.includes(9257)||!scene.nodes.includes(12108)||scene.nodes.includes(9913)||
     scene.extras?.stage!=='WORK_TEST_HOST_HOLD'||
     scene.extras?.current!==false||scene.extras?.asBuilt!==false||
     scene.extras?.productionWebGL!=='NOT_RUN'||scene.extras?.humanReview!=='NOT_RUN'||
     fx?.sourceScene!==spec.sourceScene||fx?.replacedRootNode!==9913||
     fx?.newRootNode!==12108||fx?.sourceSHA256!==FLOOR_ZFIGHT_PARENT_GLB_SHA256||
     fx?.status!=='WORK_TEST_HOST_HOLD'||fx?.sourceLinksBindingVerified!==false||
     fx?.productionWebGLVerified!==false||fx?.humanReview!=='NOT_RUN'||
     fx?.current!==false||fx?.asBuilt!==false)return false;
  const floorNode=gltf.nodes[9257],wallOld=gltf.nodes[9913],wallNew=gltf.nodes[12108];
  const floorMesh=gltf.meshes[3271],wallMeshOld=gltf.meshes[3591],wallMeshNew=gltf.meshes[4556];
  return floorNode?.mesh===3271&&wallOld?.mesh===3591&&wallNew?.mesh===4556&&
    floorMesh?.name==='C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE_LIGHT_GAPS'&&
    wallMeshOld?.name==='H4_C80_047_D1F_STORAGE_DOORWALL_100MM_WORK_ASSUMPTION_OPTIN'&&
    wallMeshNew?.name==='C80_D2F_FLOOR_ZFIGHT_STORAGE_WALL_NO_UPPER_CAP_WORK_TEST'&&
    wallNew?.name==='C80_D1F_STORAGE_WALL_TOP_CAP_REMOVED_UNDER_D2F_FLOOR_WORK_TEST_HOST_HOLD'&&
    wallNew?.extras?.sourceLinksRequireRebind===true&&
    wallNew?.extras?.asBuilt===false&&
    wallMeshOld?.primitives?.[0]?.indices===3031&&
    wallMeshNew?.primitives?.[0]?.indices===10204&&
    wallMeshNew?.primitives?.[0]?.attributes?.POSITION===wallMeshOld?.primitives?.[0]?.attributes?.POSITION&&
    gltf.accessors?.[10204]?.count===78;
}
