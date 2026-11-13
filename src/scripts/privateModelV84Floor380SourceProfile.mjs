// C80 V84 wall-top + floor Z-fight combined WORK_TEST source receiver.
// Caller must hash the entire original inner GLB; filename __scene376 is not a glTF scene.
export const V84FLOOR380_GLB_SHA256='7a63c0cba58c62d7b6c9521e6fb2b1c2f07c66bd8e41e67f7157b962349302aa';
export const V84FLOOR380_GLB_BYTES=54081264;
export const V84FLOOR380_ZIP_SHA256='2710c548fff5e441dcd341566c99290513ffc0803b66f9efc0025da53a765112';
export const V84FLOOR380_DRIVE_ID='1P6W3EVr1F6PzZXnd1MTudqbuHb5Kjnfp';
export const V84FLOOR380_WALLTOP_BASE_GLB_SHA256='3ec257e8df3dae29c562baaa58ad8040c1ac72c5322e642e773de30d83aee7f4';
export const V84FLOOR380_FLOOR_DONOR_GLB_SHA256='5784807c11ddc2011b813ae9ce3c81dd7ce44b8eb5f0e8660a0f1f0cbc2ad72f';
export const V84FLOOR380_SCENE_COUNT=380;
export const V84FLOOR380_DEFAULT_SCENE=292;
export const V84FLOOR380_NODE_COUNT=12110;
export const V84FLOOR380_MESH_COUNT=4558;
export const V84FLOOR380_ACCESSOR_COUNT=10206;
export const V84FLOOR380_SCENES=Object.freeze({
  376:{name:'OM_WALLTOP5MM_FLOOR_ZFIGHT_COFIT__OM_WALLTOP_V84_5MM_C80_M6263_MJ72_KIV005_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113',floor:'BOTH',glazing:'CLOSED',cutaway:false,roots:464,fnv:'abb00df9',sourceScene:362},
  377:{name:'OM_WALLTOP5MM_FLOOR_ZFIGHT_COFIT__OM_WALLTOP_V84_5MM_C80_M6263_MJ72_KIV005_BOTH_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113',floor:'BOTH',glazing:'ONE_OPEN',cutaway:false,roots:464,fnv:'b59f123b',sourceScene:364},
  378:{name:'OM_WALLTOP5MM_FLOOR_ZFIGHT_COFIT__OM_WALLTOP_V84_5MM_C80_M6263_MJ72_KIV005_BOTH_STACKED_WORK_TEST_HOST_HOLD_20261113',floor:'BOTH',glazing:'STACKED',cutaway:false,roots:464,fnv:'8402cc59',sourceScene:366},
  379:{name:'OM_WALLTOP5MM_FLOOR_ZFIGHT_COFIT__OM_WALLTOP_V84_5MM_C80_M6263_MJ72_KIV005_PK1_CUTAWAY_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113',floor:'BOTH',glazing:'CLOSED',cutaway:true,roots:464,fnv:'c14adfe2',sourceScene:368},
});
export function v84Floor380RootFnv32(ids){
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const id of ids){
    if(!Number.isInteger(id)||id<0)return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
// Source-profile only: no published sourceLinks, CURRENT, WebGL or HUMAN_REVIEW claim.
export function isV84Floor380SourceScene(gltf,loadedSha,index,floor=null,glazing=null,cutaway=null){
  const spec=V84FLOOR380_SCENES[index],scene=gltf?.scenes?.[index];
  if(loadedSha!==V84FLOOR380_GLB_SHA256||!spec||!scene||
     (floor!==null&&floor!==spec.floor)||
     (glazing!==null&&glazing!==spec.glazing)||
     (cutaway!==null&&cutaway!==spec.cutaway)||
     gltf.scene!==V84FLOOR380_DEFAULT_SCENE||
     gltf.scenes?.length!==V84FLOOR380_SCENE_COUNT||
     gltf.nodes?.length!==V84FLOOR380_NODE_COUNT||
     gltf.meshes?.length!==V84FLOOR380_MESH_COUNT||
     gltf.accessors?.length!==V84FLOOR380_ACCESSOR_COUNT||
     gltf.asset?.extras?.ModelStage!=='WORK_TEST'||
     gltf.asset?.extras?.current!==false||
     gltf.asset?.extras?.asBuilt!==false||
     gltf.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
     scene.name!==spec.name||
     !Array.isArray(scene.nodes)||scene.nodes.length!==spec.roots||
     new Set(scene.nodes).size!==spec.roots||
     scene.nodes.some(i=>!Number.isInteger(i)||i<0||i>=V84FLOOR380_NODE_COUNT)||
     v84Floor380RootFnv32(scene.nodes)!==spec.fnv||
     !scene.nodes.includes(12108)||!scene.nodes.includes(12109)||
     scene.nodes.includes(10793)||scene.nodes.includes(9913)||
     scene.extras?.stage!=='WORK_TEST_HOST_HOLD'||
     scene.extras?.current!==false||scene.extras?.asBuilt!==false||
     scene.extras?.physicalConnectionsVerified!==0||
     scene.extras?.productionWebGL!=='NOT_RUN'||
     scene.extras?.humanReview!=='NOT_RUN')return false;
  const c=scene.extras?.ownerWallFloorCofit20261114;
  if(c?.stage!=='WORK_TEST_HOST_HOLD'||c?.sourceScene!==spec.sourceScene||
     c?.wallTopRootClone!==12108||c?.floorNoCapRootClone!==12109||
     c?.wallTopCorrectionMeters!==0.005||
     c?.floorTopOverlapBeforeMeters!==0.0005||
     c?.sourceLinksBound!==false||
     c?.productionWebGL!=='NOT_RUN'||c?.humanReview!=='NOT_RUN'||
     c?.current!==false||c?.asBuilt!==false)return false;
  const wall=gltf.nodes[12108],floorNode=gltf.nodes[12109];
  const f=floorNode?.extras?.floorZFightFix;
  return wall?.mesh===4556&&floorNode?.mesh===4557&&
    wall?.extras?.originalGlbNodeId===10793&&
    wall?.extras?.originalMeshId===4187&&
    wall?.extras?.correctedTopHeightMeters===5.28&&
    wall?.extras?.correctionDeltaMeters===0.005&&
    wall?.extras?.asBuilt===false&&
    f?.oldNode===9913&&f?.oldMesh===3591&&
    f?.newMesh===4557&&f?.newIndexAccessor===10205&&
    f?.floorNode===9257&&f?.newNode===12109&&
    f?.status==='WORK_TEST_HOST_HOLD'&&
    f?.realWorldGeometryApproval===false&&
    gltf.meshes[4556]?.name==='OM_2F_WALL_V84_UPPER_EDGE_Z5280_COW_5MM_WORK_TEST'&&
    gltf.meshes[4557]?.name==='OM_V84_2F_FLOOR_TOP_COW_ZFIGHT_INTEGRATED_WORK_TEST';
}
export function resolveV84Floor380SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==V84FLOOR380_GLB_SHA256||floor!=='BOTH'||
     !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
     typeof cutaway!=='boolean')return null;
  const hits=Object.entries(V84FLOOR380_SCENES).filter(([,s])=>
     s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
  return hits.length===1?Number(hits[0][0]):null;
}
