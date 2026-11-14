// SHA-locked read-only receiver for the opt-in 2015 SK1 transfer grille presentation.
// Not a registration, sourceLinks binding, publication or as-built approval.
// Caller must authenticate the SHA256 of the full raw GLB before passing it here.
export const C80_SK1_GLB_SHA256='b4b9e1c39ed11caeb6fa5633ef46d33f08a921adcb20e82bd4aaec03beea4d4b';
export const C80_SK1_GLB_BYTES=54789656;
export const C80_SK1_ZIP_SHA256='235ab19518e6049549f9d1b6b0c48ebec8321f27f63a146307ffd9bd1acad01e';
export const C80_SK1_ZIP_DRIVE_ID='1C3PjezB-nyh-lZbiIZbwkpFrzQhZ7NTS';
export const C80_SK1_PARENT_GLB_SHA256='f990edd8ddd8277abfd419ab72b424ee360aba462739bda19fab44341c159353';
export const C80_SK1_PARENT_ZIP_DRIVE_ID='1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE';
export const C80_SK1_IV2015_1F_PLAN_DRIVE_ID='1cbo8g7mcs9zAWgUE9w2EOm_t9R1vIl1X';
export const C80_SK1_IV2015_2F_PLAN_DRIVE_ID='1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9';
export const C80_SK1_SOURCE_ONLY=true;
export const C80_SK1_SOURCE_LINKS_BOUND=false;
export const C80_SK1_PUBLISH_ALLOWED=false;
export const C80_SK1_PRODUCTION_WEBGL_VERIFIED=false;
export const C80_SK1_HUMAN_REVIEW='NOT_RUN';
const originalDonorSha='025593dbbef895f207a846d409e5cc2281125c4511b3380148ae0de9cf712b23';
const originalDonorDrive='1vFJExfZ7l30BXmwNOsuhtN_T-SNlShxz';
export const C80_SK1_SCENES=Object.freeze({
  469:Object.freeze({
    name:'C80_G2S04_IV2015_SK1_400x150_1F_SUCC455_OPTIN_WORK_TEST_HOST_HOLD',
    floor:'1F',parentScene:467,previousRootCount:288,rootCount:290,rootFnv:'20bd9bcc',
    roots:Object.freeze([10156,10158]),sourceSceneIndex:410
  }),
  470:Object.freeze({
    name:'C80_G2S04_IV2015_SK1_400x150_BOTH_SUCC455_OPTIN_WORK_TEST_HOST_HOLD',
    floor:'BOTH',parentScene:461,previousRootCount:467,rootCount:469,rootFnv:'c0c9fefd',
    roots:Object.freeze([10157,10159]),sourceSceneIndex:412
  })
});
export function c80Sk1RootFnv32(indices){
  if(!Array.isArray(indices))return null;
  let hash=2166136261;
  for(const index of indices){
    if(!Number.isInteger(index)||index<0)return null;
    hash=Math.imul(hash^index,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function validGrilleNode(gltf,index,ordinal){
  const node=gltf.nodes[index];
  const isFirst=ordinal===0;
  const sourceNode=isFirst?10142:10143;
  const mesh=isFirst?3706:3707;
  const donorMesh=isFirst?470:471;
  return node?.mesh===mesh&&
    node?.name===('M5_IV2015_D1F_SK1_TRANSFER_GRILLE_00'+(ordinal+1)+'_C80_YUP_NEWVISIBLE_REF_FROM_NODE'+(isFirst?452:453))&&
    node.extras?.m5System==='IV'&&node.extras.sourceDonor==='C80CHAIN:M5_IV2015_D1F_TWO_SK1_SOURCE_PLATES_C80_WORLD_YUP_ROTATION_R'&&
    node.extras.sourceDriveId===originalDonorDrive&&node.extras.sourceGLBSHA256===originalDonorSha&&
    node.extras.sourceScene===319&&node.extras.sourceNode===sourceNode&&
    node.extras.sourceMesh===donorMesh&&node.extras.modelStage==='WORK_TEST'&&
    node.extras.hostHold===true&&node.extras.verifiedConnections===0&&
    Array.isArray(node.matrix)&&node.matrix.length===16&&
    gltf.meshes?.[mesh]?.primitives?.length>0;
}
function validScopeExtras(s,spec){
  const e=s.extras,g=e?.G2S04_SK1_20261114;
  const expectedRefs=[
    {role:'primary-2015-1F-plan',url:'https://drive.google.com/file/d/'+C80_SK1_IV2015_1F_PLAN_DRIVE_ID+'/view'},
    {role:'primary-2015-2F-plan-context',url:'https://drive.google.com/file/d/'+C80_SK1_IV2015_2F_PLAN_DRIVE_ID+'/view'},
    {role:'source-GLB-SUCC455',driveId:C80_SK1_PARENT_ZIP_DRIVE_ID,sha256:C80_SK1_PARENT_GLB_SHA256}
  ];
  return e?.stage==='WORK_TEST_HOST_HOLD'&&e.floor===spec.floor&&
    e.sourceLinksBindingVerified===false&&e.productionWebGLVerified===false&&
    e.humanReviewApproved===false&&e.asBuilt===false&&
    e.sourceSceneIndex===spec.sourceSceneIndex&&
    g?.stage==='WORK_TEST_HOST_HOLD'&&g.modelStage==='WORK_TEST'&&
    g.current===false&&g.asBuilt===false&&g.humanReview==='NOT_RUN'&&
    g.productionWebGL==='NOT_RUN'&&g.sourceParentGlbSHA256===C80_SK1_PARENT_GLB_SHA256&&
    g.sourceSceneIndex===spec.parentScene&&g.sceneScope===spec.floor&&
    same(g.newVisibilityRoots,spec.roots)&&g.meshIdentity==='REUSE_ORIGINAL_C80_MESH3706_3707_NO_GEOMETRY_CHANGE'&&
    g.planDesignation==='SK1-400-150 FLÄKTWOODS (2 pieces)'&&
    g.hostHold===true&&g.physicalXYZVerified===false&&g.verifiedConnections===0&&
    same(g.sourceLinks,expectedRefs);
}
export function isC80Sk1TransferGrillesSourceScene(gltf,authenticatedGlbSha256,index,floor=null){
  const spec=C80_SK1_SCENES[index];
  const scene=gltf?.scenes?.[index], parent=gltf?.scenes?.[spec?.parentScene];
  if(authenticatedGlbSha256!==C80_SK1_GLB_SHA256||!spec||!scene||!parent||
     (floor!==null&&floor!==spec.floor)||gltf?.scene!==292||
     gltf.scenes?.length!==471||gltf.nodes?.length!==12195||gltf.meshes?.length!==4577||
     gltf.asset?.extras?.ModelStage!=='WORK_TEST'||gltf.asset.extras.current!==false||
     gltf.asset.extras.asBuilt!==false||gltf.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
     scene.name!==spec.name||!Array.isArray(scene.nodes)||!Array.isArray(parent.nodes)||
     scene.nodes.length!==spec.rootCount||parent.nodes.length!==spec.previousRootCount||
     new Set(scene.nodes).size!==scene.nodes.length||
     scene.nodes.some(n=>!Number.isInteger(n)||n<0||n>=gltf.nodes.length)||
     !same(scene.nodes.slice(0,spec.previousRootCount),parent.nodes)||
     !same(scene.nodes.slice(spec.previousRootCount),spec.roots)||
     c80Sk1RootFnv32(scene.nodes)!==spec.rootFnv||
     !validScopeExtras(scene,spec)||
     !validGrilleNode(gltf,spec.roots[0],0)||
     !validGrilleNode(gltf,spec.roots[1],1))return false;
  return true;
}
export function resolveC80Sk1TransferGrillesSceneIndex(authenticatedSha,parentScene,floor){
  if(authenticatedSha!==C80_SK1_GLB_SHA256||!Number.isInteger(parentScene)||
     !['1F','BOTH'].includes(floor))return null;
  const found=Object.entries(C80_SK1_SCENES).filter(([,s])=>s.parentScene===parentScene&&s.floor===floor);
  return found.length===1?Number(found[0][0]):null;
}
export function c80Sk1TransferGrillesSourceReceipt(gltf,authenticatedSha,index){
  const exactSource=isC80Sk1TransferGrillesSourceScene(gltf,authenticatedSha,index);
  return Object.freeze({exactSource,publishAllowed:false,sourceLinksBound:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
    physicalHostVerified:false});
}
