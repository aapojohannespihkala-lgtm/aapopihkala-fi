// Read-only exact-source receipt for 410 + V84 walltop and storage floor COW.
// A trusted caller MUST hash every byte of the INNER GLB independently.
// This module does not fetch, bind sourceLinks, publish, or certify WebGL/HR/as-built.
export const C80_419_GLB_SHA256='720c7d2cf65c15fb196c44454eda2f71b07eab1c0f52b106a2099ac818a4fd9a';
export const C80_419_GLB_BYTES=54335408;
export const C80_419_ZIP_SHA256='23ee7c3b3c15487a59ecc25219d12808ec66f37c4073838209f6d750d4ba59fa';
export const C80_419_ZIP_DRIVE_ID='1QxdFsdmMtT7tyX8y4049gXrIezU8OE-K';
export const C80_419_PARENT_GLB_SHA256='39d8ecbd5195bd52734274bae2e5041b8e6d6fe0a32722bc545cf03ecfd0ed21';
export const C80_419_V84_DONOR_GLB_SHA256='7a63c0cba58c62d7b6c9521e6fb2b1c2f07c66bd8e41e67f7157b962349302aa';
export const C80_419_SCENE_COUNT=419;
export const C80_419_NODE_COUNT=12146;
export const C80_419_MESH_COUNT=4572;
export const C80_419_ACCESSOR_COUNT=10233;
export const C80_419_DEFAULT_SCENE=292;
export const C80_419_SCENES=Object.freeze({"410":{"name":"C80_410_V84FLOOR_COW_FROM_401_WORK_TEST_HOST_HOLD","parent":401,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_392_WORK_TEST_HOST_HOLD","floor":"1F","glazing":"CLOSED","cutaway":false,"count":288,"fnv":"6918dbd0","parentFnv":"7c9a8408","wall":false,"storage":true},"411":{"name":"C80_410_V84FLOOR_COW_FROM_402_WORK_TEST_HOST_HOLD","parent":402,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_393_WORK_TEST_HOST_HOLD","floor":"2F","glazing":"CLOSED","cutaway":false,"count":181,"fnv":"f8ef8caa","parentFnv":"84c3e923","wall":true,"storage":false},"412":{"name":"C80_410_V84FLOOR_COW_FROM_403_WORK_TEST_HOST_HOLD","parent":403,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_394_WORK_TEST_HOST_HOLD","floor":"BOTH","glazing":"CLOSED","cutaway":false,"count":463,"fnv":"3e2325a3","parentFnv":"3616298e","wall":true,"storage":true},"413":{"name":"C80_410_V84FLOOR_COW_FROM_404_WORK_TEST_HOST_HOLD","parent":404,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_395_WORK_TEST_HOST_HOLD","floor":"2F","glazing":"ONE_OPEN","cutaway":false,"count":181,"fnv":"e2aa983c","parentFnv":"c93d3d47","wall":true,"storage":false},"414":{"name":"C80_410_V84FLOOR_COW_FROM_405_WORK_TEST_HOST_HOLD","parent":405,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_396_WORK_TEST_HOST_HOLD","floor":"BOTH","glazing":"ONE_OPEN","cutaway":false,"count":463,"fnv":"b3ee1711","parentFnv":"c26176ba","wall":true,"storage":true},"415":{"name":"C80_410_V84FLOOR_COW_FROM_406_WORK_TEST_HOST_HOLD","parent":406,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_397_WORK_TEST_HOST_HOLD","floor":"2F","glazing":"STACKED","cutaway":false,"count":181,"fnv":"2d009f82","parentFnv":"0a53c2d3","wall":true,"storage":false},"416":{"name":"C80_410_V84FLOOR_COW_FROM_407_WORK_TEST_HOST_HOLD","parent":407,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_398_WORK_TEST_HOST_HOLD","floor":"BOTH","glazing":"STACKED","cutaway":false,"count":463,"fnv":"0d62ee19","parentFnv":"00b2ef10","wall":true,"storage":true},"417":{"name":"C80_410_V84FLOOR_COW_FROM_408_WORK_TEST_HOST_HOLD","parent":408,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_399_WORK_TEST_HOST_HOLD","floor":"1F","glazing":"CLOSED","cutaway":true,"count":288,"fnv":"235684c5","parentFnv":"2723e8dd","wall":false,"storage":true},"418":{"name":"C80_410_V84FLOOR_COW_FROM_409_WORK_TEST_HOST_HOLD","parent":409,"parentName":"C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_400_WORK_TEST_HOST_HOLD","floor":"BOTH","glazing":"CLOSED","cutaway":true,"count":463,"fnv":"2b5ea272","parentFnv":"28115747","wall":true,"storage":true}});
const WALL_NODE=12144, STORAGE_NODE=12145;
const WALL_OLD=10793, STORAGE_OLD=9913;
export function c80419RootFnv32(ids){
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const n of ids){if(!Number.isInteger(n)||n<0)return null;h=Math.imul(h^n,16777619)>>>0;}
  return h.toString(16).padStart(8,'0');
}
function exactReplacementRoots(oldRoots,newRoots){
  return oldRoots.length===newRoots.length&&oldRoots.every((v,i)=>
    newRoots[i]===(v===WALL_OLD?WALL_NODE:v===STORAGE_OLD?STORAGE_NODE:v));
}
function validCOWNodes(gltf){
  const nodes=gltf?.nodes,meshes=gltf?.meshes;
  if(!Array.isArray(nodes)||nodes.length!==C80_419_NODE_COUNT||
     !Array.isArray(meshes)||meshes.length!==C80_419_MESH_COUNT)return false;
  const w=nodes[WALL_NODE],s=nodes[STORAGE_NODE],we=w?.extras,se=s?.extras;
  return w?.name==='OM_2F_WALL_V84_RAISED_TOP_TO_Z5_280_5MM_COW_WORK_TEST'&&w?.mesh===4570&&
    we?.stage==='WORK_TEST_HOST_HOLD'&&we?.current===false&&we?.asBuilt===false&&
    we?.originalGlbNodeId===WALL_OLD&&we?.originalMeshId===4187&&
    we?.correctedTopHeightMeters===5.28&&we?.originalTopHeightMeters===5.275&&
    we?.correctionDeltaMeters===0.005&&
    we?.commonBaseGlbSHA256===C80_419_PARENT_GLB_SHA256&&
    we?.integratedFromDonorGlbSHA256===C80_419_V84_DONOR_GLB_SHA256&&
    we?.humanReviewApproved===false&&we?.productionWebGLVerified===false&&
    s?.name==='OM_V84_2F_STORAGE_WALL_NO_TOP_CAP_COFIT_FLOOR_ZFIGHT_WORK_TEST'&&s?.mesh===4571&&
    se?.stage==='WORK_TEST'&&se?.presentationOnly===true&&se?.physicalHost==='HOST_HOLD'&&
    se?.current===false&&se?.asBuilt===false&&se?.canPublish===false&&se?.canApplyToViewer===false&&
    se?.representationKind==='DISPLAY_VOLUME_NOT_PHYSICAL_STRUCTURE'&&
    se?.sourceMetadata?.floorHostValidated===false&&
    meshes[4570]?.name==='OM_2F_WALL_V84_UPPER_EDGE_Z5280_COW_5MM_WORK_TEST'&&
    meshes[4571]?.name==='OM_V84_2F_FLOOR_TOP_COW_ZFIGHT_INTEGRATED_WORK_TEST'&&
    meshes[4570]?.primitives?.[0]?.attributes?.POSITION===10231&&
    meshes[4571]?.primitives?.[0]?.indices===10232;
}
// Returns TRUE only for a SHA-authenticated opt-in glTF scene. A true result
// cannot imply SOURCE_LINKS_BOUND, CURRENT, real mounting or HUMAN_REVIEW.
export function isC80419SourceScene(gltf,authenticatedGlbSHA256,index,floor=null,glazing=null,cutaway=null){
  const spec=C80_419_SCENES[index],scene=gltf?.scenes?.[index],old=gltf?.scenes?.[spec?.parent];
  const x=scene?.extras,asset=gltf?.asset?.extras,roots=scene?.nodes,oldRoots=old?.nodes;
  if(authenticatedGlbSHA256!==C80_419_GLB_SHA256||!spec||!scene||!old||
     (floor!==null&&floor!==spec.floor)||(glazing!==null&&glazing!==spec.glazing)||
     (cutaway!==null&&cutaway!==spec.cutaway)||
     gltf?.scene!==C80_419_DEFAULT_SCENE||gltf?.scenes?.length!==C80_419_SCENE_COUNT||
     gltf?.nodes?.length!==C80_419_NODE_COUNT||gltf?.meshes?.length!==C80_419_MESH_COUNT||
     gltf?.accessors?.length!==C80_419_ACCESSOR_COUNT||
     asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||asset?.asBuilt!==false||
     asset?.HUMAN_REVIEW!=='NOT_RUN'||asset?.Canonical!==false||
     scene.name!==spec.name||old.name!==spec.parentName||
     !Array.isArray(roots)||roots.length!==spec.count||new Set(roots).size!==roots.length||
     roots.some(n=>!Number.isInteger(n)||n<0||n>=C80_419_NODE_COUNT)||
     c80419RootFnv32(roots)!==spec.fnv||
     !Array.isArray(oldRoots)||oldRoots.length!==spec.count||new Set(oldRoots).size!==oldRoots.length||
     c80419RootFnv32(oldRoots)!==spec.parentFnv||
     !exactReplacementRoots(oldRoots,roots)||
     roots.includes(WALL_OLD)||roots.includes(STORAGE_OLD)||
     roots.includes(WALL_NODE)!==spec.wall||roots.includes(STORAGE_NODE)!==spec.storage||
     x?.stage!=='WORK_TEST_HOST_HOLD'||x?.sourceSceneIndex!==spec.parent||
     x?.sourceGlbSHA256!==C80_419_PARENT_GLB_SHA256||
     x?.donorGlbSHA256!==C80_419_V84_DONOR_GLB_SHA256||
     x?.sourceLinksBindingVerified!==false||x?.productionWebGLVerified!==false||
     x?.humanReviewApproved!==false||x?.nonPhysicalStorageProxyRetained!==true||
     x?.rejectedHigh3Excluded!==true||!validCOWNodes(gltf))return false;
  return true;
}
export function resolveC80419SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==C80_419_GLB_SHA256||!['1F','2F','BOTH'].includes(floor)||
     !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||typeof cutaway!=='boolean')return null;
  const matches=Object.entries(C80_419_SCENES).filter(([,s])=>
    s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
  return matches.length===1?Number(matches[0][0]):null;
}
