/**
 * C80 530 V27 no-trench terrain: authenticated source-only WORK_TEST receipt.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 * The new terrain replaces the old root in 1F/BOTH, not in untouched 2F.
 * No sourceLinks, CURRENT, physical-foundation or publication authorization.
 */
export const C80_530_V27_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_530_V27_GLB_BYTES=55645812;
export const C80_530_V27_ZIP_SHA256='bee3f2acfdb0f2ca54c27b093241bfe93cf1c2c87ad1f4c6c273eba89c411322';
export const C80_530_V27_ZIP_DRIVE_ID='1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s';
export const C80_530_V27_PARENT_GLB_SHA256='b9b04ba2f9dfc85c4519052ab0fd05e71669ea61fa37e755d85cd438da3df285';
export const C80_530_V27_PARENT_ZIP_DRIVE_ID='1M5ToN7C_tKnhGwLH8D3fMNueMqbjKQZ8';
export const C80_530_V27_DONOR_GLB_SHA256='d07d22ad560b74f24229793dd3f7415205a30f6c29fc9f10142da3af2ca63b9b';
export const C80_530_V27_DONOR_ZIP_DRIVE_ID='1h9sTz9GyaAj-rO8ZhECKBEPLEyXow4HC';
// [glTF scene, parent scene, floorProfile, FNV root hash, parent hash, clip].
const rows=[
 [524,518,'1F','ef21913f','80fb54b5',true],
 [525,519,'2F','b6394bd0','b6394bd0',false],
 [526,520,'BOTH_A','6847aefb','40b12645',true],
 [527,521,'BOTH_B','9d3081c3','60b4fe91',true],
 [528,522,'BOTH_C','c0e4d46d','cb74f51f',true],
 [529,523,'BOTH_D','2b0e6572','ef731aec',true],
];
export const C80_530_V27_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash,parentRootHash,clip])=>
 [scene,Object.freeze({scene,parent,profile,floor:profile.startsWith('BOTH')?'BOTH':profile,
  rootHash,parentRootHash,clip})]
)));
export function c80530Fnv32(ids) {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.every((n,i)=>n===b[i]);
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-6;
const vec=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((n,i)=>near(n,b[i]));
function reach(nodes,roots){
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const index=todo.pop();
  if(!Number.isInteger(index)||index<0||index>=nodes.length)return null;
  if(seen.has(index))continue;
  seen.add(index);
  const children=nodes[index]?.children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)todo.push(...children);
 }
 return seen;
}
/** Ground replacement is source-proven, NOT a surveyed physical foundation. */
export function isC80530V27TerrainEvidence(json){
 const root=json?.nodes?.[12254],soil=json?.nodes?.[12252],seal=json?.nodes?.[12253];
 const e=root?.extras,a=soil?.extras,b=seal?.extras;
 const soilMesh=json?.meshes?.[4619],sealMesh=json?.meshes?.[4620];
 if(root?.name!=='C80_530_SOURCE_CONTEXT_V27_NO_TRENCH_PRESENTATION_ONLY_ROOT'||
    !eq(root.children,[9007,12252,5145,5148,5154,5167,5180,7318,12253])||
    e?.baseC80GLBSHA256!==C80_530_V27_PARENT_GLB_SHA256||
    e?.donorGlbSHA256!==C80_530_V27_DONOR_GLB_SHA256||
    e?.donorDriveZIP!==C80_530_V27_DONOR_ZIP_DRIVE_ID||
    e?.sourceNodeToReplace!==8755||e?.sourceMeshToReplace!==3018||
    e?.newVisibleSoilNode!==12252||e?.newSealNode!==12253||
    !vec(e?.clipXZ_m,[6.295,6.337,0.025,1.55])||
    e?.terrainElevationDelta_m!==0||
    e?.sourceLinksBoundForNewSHA!==false||e?.physicalFoundationClaim!==false||
    e?.presentationOnly!==true||e?.current!==false||e?.asBuilt!==false||
    e?.physicalHost!=='HOST_HOLD'||e?.groundNotASlab!==true||
    soil?.mesh!==4619||!soil.name?.startsWith('C80_530_HI12_SOIL_V27_')||
    a?.presentationOnly!==true||a?.sourceOnly!==true||
    a?.physicalStructureApproved!==false||a?.current!==false||
    a?.asBuilt!==false||a?.physicalHost!=='HOST_HOLD'||
    seal?.mesh!==4620||!seal.name?.startsWith('C80_530_V27_PLINTH_WALL_SOIL_JOINT_')||
    b?.donorGlbSHA256!==C80_530_V27_DONOR_GLB_SHA256||
    b?.sourceDonorZIP!==C80_530_V27_DONOR_ZIP_DRIVE_ID||
    b?.sourceC80SHA256!==C80_530_V27_PARENT_GLB_SHA256||
    b?.physicalFoundationClaim!==false||b?.physicalTerrainSurveyVerified!==false||
    b?.sourceLinksBoundForNewSHA!==false||b?.current!==false||b?.asBuilt!==false||
    soilMesh?.extras?.sourceDonorSHA256!==C80_530_V27_DONOR_GLB_SHA256||
    soilMesh.extras.parentC80GLBSHA256!==C80_530_V27_PARENT_GLB_SHA256||
    soilMesh.extras.asBuilt!==false||soilMesh.extras.CURRENT!==false||
    sealMesh?.extras?.sourceDonorSHA256!==C80_530_V27_DONOR_GLB_SHA256||
    sealMesh.extras.parentC80GLBSHA256!==C80_530_V27_PARENT_GLB_SHA256||
    sealMesh.extras.asBuilt!==false||sealMesh.extras.CURRENT!==false)return false;
 return true;
}
export function isC80530V27SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_530_V27_SCENES[sceneIndex];
 if(sha!==C80_530_V27_GLB_SHA256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==530||json.nodes?.length!==12255||
    json.meshes?.length!==4621||json.materials?.length!==744||
    json.accessors?.length!==10408||json.bufferViews?.length!==10412)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!=='C80_530_V27_NO_TRENCH_FROM_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(roots)||!Array.isArray(prior)||
    roots.length!==prior.length||roots.length!==(spec.floor==='1F'?294:spec.floor==='2F'?190:477)||
    c80530Fnv32(roots)!==spec.rootHash||c80530Fnv32(prior)!==spec.parentRootHash||
    new Set(roots).size!==roots.length||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e?.floorProfile!==spec.profile||
    e?.floor!==spec.floor||e?.sourceSceneIndex!==spec.parent||
    e?.glTFSceneIndex!==spec.parent||
    e?.parentC80GLBSHA256!==C80_530_V27_PARENT_GLB_SHA256||
    e?.v27DonorGLBSHA256!==C80_530_V27_DONOR_GLB_SHA256||
    e?.v27DonorDriveZIP!==C80_530_V27_DONOR_ZIP_DRIVE_ID||
    e?.v27ClipApplied!==spec.clip||e?.v27SoilSourceRoot!==9008||
    e?.v27SoilReplacementRoot!==(spec.clip?12254:null)||
    e?.v27PhysicalTerrainCorrection!==false||e?.newSourceLinksBound!==false||
    e?.sourceLinks!=='NOT_BOUND_FOR_NEW_SHA'||
    e?.sourceLinksBindingVerified!==false||e?.productionWebGLVerified!==false||
    e?.humanReviewApproved!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
    e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true||
    e?.defaultSceneUnchanged!==true||e?.physicalDownspoutNodeCountAdded!==0)return false;
 if(spec.clip){
  const different=prior.flatMap((n,i)=>n!==roots[i]?[i]:[]);
  if(different.length!==1||prior[different[0]]!==9008||roots[different[0]]!==12254||
    !isC80530V27TerrainEvidence(json))return false;
 }else if(!eq(roots,prior)||roots.includes(12254))return false;
 const active=reach(json.nodes,roots);
 if(!active||!active.has(12251)||active.has(8755)||active.has(9008)||
    (spec.clip?!([12254,12252,12253].every(n=>active.has(n))):
      [12254,12252,12253].some(n=>active.has(n))))return false;
 return true;
}
export function c80530V27Receipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80530V27SourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',presentationOnly:true,
  current:false,asBuilt:false,sourceLinksBound:false,publishAllowed:false,
  physicalTerrainSurveyVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
