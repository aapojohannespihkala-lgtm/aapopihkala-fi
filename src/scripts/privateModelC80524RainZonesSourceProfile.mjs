/**
 * C80 524: R1110 stormwater presence-zone opt-in source receipt.
 * Input SHA must be independently computed from the complete original GLB.
 * No candidate registration, sourceLinks rebinding, publication or as-built claims.
 */
export const C80_524_RAIN_GLB_SHA256='b9b04ba2f9dfc85c4519052ab0fd05e71669ea61fa37e755d85cd438da3df285';
export const C80_524_RAIN_GLB_BYTES=55468056;
export const C80_524_RAIN_ZIP_SHA256='5f747dccb569066cec0f023da9d6a783e50094579de098f9270f152cfebfaa29';
export const C80_524_RAIN_ZIP_DRIVE_ID='1M5ToN7C_tKnhGwLH8D3fMNueMqbjKQZ8';
export const C80_524_RAIN_PARENT_GLB_SHA256='80391a0b63a5f362bc88da59184c14b426098e5db263ff9eafa5b679bfc7c133';
export const C80_524_RAIN_PARENT_ZIP_DRIVE_ID='1oV3H7v-RCUQcQolfc3Zt-G71ewDq9nEH';
export const C80_524_RAIN_DONOR_GLB_SHA256='5e02e0076033bf9afa2b266ccd3d71692ab8f92ff2bbab1fd8b350745e981a2a';
export const C80_524_RAIN_DONOR_ZIP_DRIVE_ID='14R4RXQVqw6f3GTmxTwuZBKIPHi1BbMBb';
// glTF scene indices, never ZIP __scene suffixes.
const rows=[
 [518,512,'1F',294,'80fb54b5','f1f8724c'],
 [519,513,'2F',190,'b6394bd0','cf94092b'],
 [520,514,'BOTH',477,'40b12645','d478501c'],
 [521,515,'BOTH',477,'60b4fe91','c6908a10'],
 [522,516,'BOTH',477,'cb74f51f','0ad08a1e'],
 [523,517,'BOTH',477,'ef731aec','d1a7d33f'],
];
export const C80_524_RAIN_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash])=>[scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash})]
)));
export function c80524RootsFnv32(ids) {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const id of ids){if(!Number.isInteger(id)||id<0)return null;h=Math.imul(h^id,16777619)>>>0;}
 return h.toString(16).padStart(8,'0');
}
const near=(n,value)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n-value)<1e-6;
const vec=(v,expected)=>Array.isArray(v)&&v.length===expected.length&&v.every((n,i)=>near(n,expected[i]));
/** Only the source presence ghost. Never a physical downspout or drainage route. */
export function isC80524RainZoneEvidence(root,first,second) {
 const e=root?.extras,z0=first?.extras,z1=second?.extras;
 if(root?.name!=='C80_524_M5B_R1110_D_GABLE_TWO_SOURCE_PRESENCE_WORK_ROOT'||
    JSON.stringify(root.children)!=='[12249,12250]'||
    !vec(root.rotation,[-Math.SQRT1_2,0,0,Math.SQRT1_2])||
    e?.sourcePresenceCoverage!=='2/5_D_ONLY'||e?.cornerZoneCoverage!=='2/4_D_WEST_GABLE_ONLY'||
    e?.southFacadeCBZoneCoverage!=='0/1_HELD_IN_DONOR'||e?.displayZoneCount!==2||
    e?.sourceDonorGLBSHA256!==C80_524_RAIN_DONOR_GLB_SHA256||
    e?.C80ParentGLBSHA256!==C80_524_RAIN_PARENT_GLB_SHA256||
    e?.sourceDonorDriveZIP!==C80_524_RAIN_DONOR_ZIP_DRIVE_ID||
    e?.noPhysicalPipeOrDrainAdded!==true||e?.workGhostOverlayOnly!==true||
    e?.physicalRouteClaim!==false||e?.publishToCURRENT!==false||e?.presentationOnly!==true||
    e?.downspoutPresenceToCurrentRouteLinkCount!==0)return false;
 for(const [node,z,key,y,donorId] of [
  [first,z0,'SOUTH_WEST_OUTER_CORNER',0.16,1124],
  [second,z1,'NORTH_WEST_OUTER_CORNER',10.65,1125]]) {
  if(node?.mesh!==4618||!node.name?.startsWith('C80_524_M5B-R1110_G2_STORM_DOWNSPOUT_PRESENCE_SHORT_GABLE_ZONE_')||
     !vec(node.translation,[-0.14,y,3.865])||!vec(node.scale,[0.22,0.22,7.73])||
     z?.presentationOnly!==true||z?.sourcePresenceConfirmed!==true||
     z?.sourceDonorNode!==donorId||z?.sourceDonorGLBSHA256!==C80_524_RAIN_DONOR_GLB_SHA256||
     z?.sourceDonorDriveZIP!==C80_524_RAIN_DONOR_ZIP_DRIVE_ID||
     z?.C80ParentGLBSHA256!==C80_524_RAIN_PARENT_GLB_SHA256||
     z?.presentationZoneKey!==key||z?.integrationKind!=='SOURCE_PRESENCE_GHOST_ONLY_NOT_PHYSICAL_DOWNSPOUT'||
     z?.physicalDownspoutHostClaim!==false||z?.physicalRouteClaim!==false||
     z?.exactXYClaim!==false||z?.exactZClaim!==false||
     z?.asBuiltClaim!==false||z?.publishToCURRENT!==false||
     z?.downspoutPresenceToCurrentRouteLinkCount!==0)return false;
 }
 return true;
}
export function isC80524RainSourceScene(json,authenticatedSha,sceneIndex,floor) {
 const spec=C80_524_RAIN_SCENES[sceneIndex];
 if(authenticatedSha!==C80_524_RAIN_GLB_SHA256||!spec||
   (floor!==undefined&&floor!==spec.floor)||json?.scene!==292||
   json.asset?.extras?.ModelStage!=='WORK_TEST'||json.asset.extras.current!==false||
   json.asset.extras.asBuilt!==false||json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
   json.scenes?.length!==524||json.nodes?.length!==12252||json.meshes?.length!==4619||
   json.materials?.length!==744||json.accessors?.length!==10404)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,old=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_524_R1110_GABLE_BC_STORM_SOURCE_ZONES_FROM_SCENE_${spec.parent}_WORK_TEST_HOST_HOLD`||
   !Array.isArray(roots)||!Array.isArray(old)||roots.length!==spec.rootCount||
   old.length!==roots.length-1||roots.at(-1)!==12251||
   !old.every((n,i)=>n===roots[i])||new Set(roots).size!==roots.length||
   c80524RootsFnv32(roots)!==spec.rootHash||c80524RootsFnv32(old)!==spec.parentRootHash||
   e?.sourceBaseScene!==spec.parent||e?.sourceBaseGLBSHA256!==C80_524_RAIN_PARENT_GLB_SHA256||
   e?.sourceDonorR1110GLBSHA256!==C80_524_RAIN_DONOR_GLB_SHA256||
   e?.sourceDonorDriveZIP!==C80_524_RAIN_DONOR_ZIP_DRIVE_ID||
   e?.floor!==spec.floor||e?.stage!=='WORK_TEST_HOST_HOLD'||
   e?.current!==false||e?.asBuilt!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
   e?.productionWebGLVerified!==false||e?.sourceLinksBindingVerified!==false||
   e?.sourceLinksBound!==false||e?.humanReviewApproved!==false||
   e?.presentationOnly!==true||e?.physicalDownspoutNodeCountAdded!==0||
   e?.markerNodeCountAdded!==2||e?.HOST_HOLD!==true||e?.defaultSceneUnchanged!==true)return false;
 const mesh=json.meshes[4618],me=mesh?.extras;
 if(me?.presentationOnly!==true||me?.workAssumption!==true||
   me?.physicalRouteClaim!==false||me?.C80IntegrationParentSHA256!==C80_524_RAIN_PARENT_GLB_SHA256||
   me?.donorExactSHA256!==C80_524_RAIN_DONOR_GLB_SHA256)return false;
 return isC80524RainZoneEvidence(json.nodes[12251],json.nodes[12249],json.nodes[12250]);
}
export function c80524RainReceipt(json,sha,sceneIndex,floor){
 return Object.freeze({
   exactSource:isC80524RainSourceScene(json,sha,sceneIndex,floor),
   stage:'WORK_TEST_HOST_HOLD',presentationOnly:true,
   sourceLinksBound:false,publishAllowed:false,physicalDownspoutVerified:false,
   productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
 });
}
