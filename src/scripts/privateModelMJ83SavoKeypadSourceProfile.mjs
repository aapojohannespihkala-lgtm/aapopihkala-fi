// SHA-locked, read-only C80 MJ83 Savo keypad source receiver.
// The caller must independently SHA256-hash the ENTIRE embedded GLB. A ZIP
// filename __sceneN never identifies an internal glTF scene. Source identity
// does not imply binding, publication, CURRENT, as-built or HUMAN_REVIEW.
export const MJ83_KEYPAD_GLB_SHA256='dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56';
export const MJ83_KEYPAD_GLB_BYTES=54066016;
export const MJ83_KEYPAD_ZIP_SHA256='89f7f8146e4d1d7b90a517cda98fe3739a00a586723c7b50cbe42c5ab8ef8fee';
export const MJ83_KEYPAD_ZIP_DRIVE_ID='1RAVTbylCZwQKB0siLZnr0i_NcGwF5v9K';
export const MJ83_KEYPAD_PARENT_GLB_SHA256='a16d6275c1c4dee190830f73a9e757b21de5fe5a22e8f10b8186af44137e9de4';
export const MJ83_KEYPAD_PARENT_ZIP_DRIVE_ID='13yB7eu32uF50ppm4hhzQdDMyhxY7IH3U';
export const MJ83_KEYPAD_SCENE_COUNT=379;
export const MJ83_KEYPAD_NODE_COUNT=12112;
export const MJ83_KEYPAD_MESH_COUNT=4556;
export const MJ83_KEYPAD_DEFAULT_SCENE=292;
export const MJ83_KEYPAD_SCENES=Object.freeze({
  376:Object.freeze({name:'MJ83_SAVO_KEYPAD_TO_OWNER_POINT_2F_WORK_TEST_HOST_HOLD_20261114',floor:'2F',count:184,fnv:'2b00de02',parent:369}),
  377:Object.freeze({name:'MJ83_SAVO_KEYPAD_TO_OWNER_POINT_BOTH_WORK_TEST_HOST_HOLD_20261114',floor:'BOTH',count:464,fnv:'0cef8fba',parent:370}),
  378:Object.freeze({name:'MJ83_SAVO_KEYPAD_SOURCE_EXACT_FOCUS_WORK_TEST_HOST_HOLD_20261114',floor:'FOCUS',count:9,fnv:'3fe3fb4c',parent:361}),
});
export const MJ83_KEYPAD_OWNER_POINT_G1=Object.freeze([4.178,3.547,4.577]);
const PANEL_NAME='MJ83_SAVO_I7603_OWNERPHOTO05_CONTROL_DECAL_AT_SCREEN_POINT_XPOS_20261114';
const ROOT_NAME='MJ83_SAVO_I7603_KEYPAD_PHOTO05_OWNER_POINT_CORRECTED_COMPONENT_ROOT';
const PANEL_MESH_NAME='SAVO_IH7603W_REAL_OWNERPHOTO_VERTICAL_CONTROLS_REPOSITIONED_LOWER_BODY_20261111';
const PHOTO_DONOR='https://drive.google.com/file/d/1FNCe2RX7cj1XEf8qiwHTF9imaA6WqB7u/view';
export function mj83KeypadRootFnv32(roots){
  if(!Array.isArray(roots))return null;
  let hash=2166136261;
  for(const id of roots){
    if(!Number.isInteger(id)||id<0)return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
const equalInts=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const pointExact=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>typeof v==='number'&&Math.abs(v-b[i])<1e-9);
function validKeypadNodes(gltf){
  const nodes=gltf?.nodes,meshes=gltf?.meshes;
  if(!Array.isArray(nodes)||nodes.length!==MJ83_KEYPAD_NODE_COUNT||
     !Array.isArray(meshes)||meshes.length!==MJ83_KEYPAD_MESH_COUNT)return false;
  const panel=nodes[12110],root=nodes[12111],pe=panel?.extras,re=root?.extras;
  if(panel?.name!==PANEL_NAME||panel?.mesh!==4540||
     panel?.children!==undefined||
     pe?.stage!=='WORK_TEST_HOST_HOLD'||pe?.kind!=='PHOTO_DERIVED_TRANSPARENT_CURVED_KEYPAD_DECAL'||
     pe?.current!==false||pe?.asBuilt!==false||
     pe?.sourceGlbSha256!==MJ83_KEYPAD_PARENT_GLB_SHA256||
     !Array.isArray(pe?.sourceLinks)||
     !pe.sourceLinks.some(link=>link?.url===PHOTO_DONOR&&link?.role==='OWNER_2026_11_01_ACTUAL_DEVICE_PHOTO')||
     meshes[4540]?.name!==PANEL_MESH_NAME||
     root?.name!==ROOT_NAME||!equalInts(root?.children,[12110])||
     re?.stage!=='WORK_TEST_HOST_HOLD'||re?.current!==false||re?.asBuilt!==false||
     re?.sourceGlbSha256!==MJ83_KEYPAD_PARENT_GLB_SHA256||
     !pointExact(re?.ownerPointG1,MJ83_KEYPAD_OWNER_POINT_G1)||
     !equalInts(re?.sourceSceneRefs,[369,370])||
     re?.surface!=='source photo-textured 3D mesh; no duplicate raised keys')return false;
  // Source-exact 90-degree +Z to +X front-face transform (glTF Y-up).
  const expected=[0,0,-1,0,0,1,0,0,1,0,0,0,7.569,0,0.469,1];
  return pointExact(panel?.matrix,expected);
}
// A successful result identifies one optional WORK_TEST/HOST_HOLD source
// scene. It MUST NOT cause automatic sourceLinks rebinding or publication.
export function isMJ83SavoKeypadSourceScene(gltf,loadedGlbSha,sceneIndex,floor=null){
  const spec=MJ83_KEYPAD_SCENES[sceneIndex],scene=gltf?.scenes?.[sceneIndex];
  const asset=gltf?.asset?.extras,x=scene?.extras,roots=scene?.nodes;
  if(loadedGlbSha!==MJ83_KEYPAD_GLB_SHA256||!spec||!scene||
     (floor!==null&&spec.floor!==floor)||
     gltf?.scene!==MJ83_KEYPAD_DEFAULT_SCENE||
     gltf?.scenes?.length!==MJ83_KEYPAD_SCENE_COUNT||
     asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
     asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
     scene.name!==spec.name||!Array.isArray(roots)||roots.length!==spec.count||
     new Set(roots).size!==roots.length||
     roots.some(i=>!Number.isInteger(i)||i<0||i>=MJ83_KEYPAD_NODE_COUNT)||
     mj83KeypadRootFnv32(roots)!==spec.fnv||
     !roots.includes(12111)||roots.includes(12057)||roots.includes(12110)||
     x?.stage!=='WORK_TEST_HOST_HOLD'||x?.current!==false||x?.asBuilt!==false||
     x?.humanReview!=='NOT_RUN'||x?.productionWebGL!=='NOT_RUN'||
     x?.physicalConnectionsVerified!==0||x?.sourceSceneIndex!==spec.parent||
     !validKeypadNodes(gltf))return false;
  if(sceneIndex!==378){
    if(x.sourceGlbSha256!==MJ83_KEYPAD_PARENT_GLB_SHA256||
       x.sourceZipDriveId!==MJ83_KEYPAD_PARENT_ZIP_DRIVE_ID||
       !pointExact(x.ownerPointG1,MJ83_KEYPAD_OWNER_POINT_G1))return false;
  } else if(!equalInts(roots,[12048,12051,12053,12054,12055,12056,12108,12109,12111])){
    return false;
  }
  return true;
}
export function resolveMJ83SavoKeypadSourceSceneIndex(loadedSha,floor){
  if(loadedSha!==MJ83_KEYPAD_GLB_SHA256||typeof floor!=='string')return null;
  const found=Object.entries(MJ83_KEYPAD_SCENES).filter(([,s])=>s.floor===floor);
  return found.length===1?Number(found[0][0]):null;
}
