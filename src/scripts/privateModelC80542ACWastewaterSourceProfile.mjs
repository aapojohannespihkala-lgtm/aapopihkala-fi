/**
 * C80 542 A-C L100 branches: exact original GLB SOURCE_ONLY receipt.
 * Do not use this as sourceLinks binding, publication, or physical approval.
 */
export const C80_542_AC_GLB_SHA256='0c2d67bbc526edef308d0f4aa25e417959787ffb6afc25f20015d02ba93d6c69';
export const C80_542_AC_GLB_BYTES=55699316;
export const C80_542_AC_ZIP_SHA256='c12ba99d137fe1ed21e12cab862b64bd393c08120cf3c6564e50c12e07f66cad';
export const C80_542_AC_ZIP_DRIVE_ID='1IDzYbJzKxBuhM1fbZ6l7H0Hv4osnbWdS';
export const C80_542_AC_PARENT_SHA256='726d91ba2dda846af6d672c6a2d2edd2b031e50aa50035a991bb61e35c29a041';
export const C80_542_AC_1974_PLAN_DRIVE_ID='1_RzfxbLM-iz9SlkOwM24HJsJMuX4WmFX';
export const C80_542_AC_V12_DRIVE_ID='1bwpgeIPlH5ehpkYOBihbZQmo5_2dnTL-';
export const C80_542_AC_G3_DRIVE_ID='1HxWKdDjjc6iYmd50pemgjrYy93-jeTXvhWbTl0FcuxI';

// glTF scene index, source scene, floor, exact root count, exact source/new
// FNV hashes from the authenticated original 542 GLB (not ZIP __scene538).
const rows=[
 [536,530,'1F',294,'ec59054e','df39b592',true],
 [537,531,'2F',190,'b6394bd0','b6394bd0',false],
 [538,532,'BOTH',477,'7fd1b2fa','89038706',true],
 [539,533,'BOTH',477,'f5f5b2e2','4cd077ae',true],
 [540,534,'BOTH',477,'bc287404','c87c8488',true],
 [541,535,'BOTH',477,'ea085853','f9ad462f',true],
];
export const C80_542_AC_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,branches])=>
 [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,branches})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.every((v,i)=>v===b[i]);
const near=(x,y)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x-y)<1e-6;
const hash=ids=>{
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const id of ids){
  if(!Number.isInteger(id)||id<0)return null;
  h=Math.imul(h^id,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
};
const descendants=(nodes,roots)=>{
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const i=todo.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length||!nodes[i])return null;
  if(seen.has(i))continue;
  seen.add(i);
  const children=nodes[i].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)todo.push(...children);
 }
 return seen;
};
export function isC80542ACBranchEvidence(json){
 const nodes=json?.nodes,root=nodes?.[12261],old=nodes?.[12257],main=nodes?.[12226];
 const re=root?.extras;
 if(main?.mesh!==4602||old?.name!=='M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD'||
  !eq(old.children,[12225,12226,12255,12256])||
  root?.name!=='M5_WW74_C80_542_WITH_A_C_CONCEPTUAL_L100_BRANCHES_WORK_TEST_HOST_HOLD'||
  !eq(root.children,[12225,12226,12255,12256,12258,12259,12260])||
  re?.stage!=='WORK_TEST_HOST_HOLD'||re?.WORK_TEST!==true||re?.m5System!=='VIEMARI'||
  re?.sourceGLBSHA256!==C80_542_AC_PARENT_SHA256||
  re?.sourceParentIndex!==12257||re?.newAtoCBranches!==3||
  re?.oldRootStillExists!==true||re?.oldSiteNode12227ExcludedFromNewScenes!==true||
  re?.g3SourceMarkersAreNotPipeEndpoints!==true||re?.sourceXYIsWorkAssumption!==true||
  re?.preserveD1FSourceBranch!==true||re?.streetJunctionStillOpenUnverified!==true||
  re?.physicalBoreOrRoutingVerified!==false||re?.physicalRouteVerified!==false||
  re?.sourceLinksBound!==false||re?.current!==false||re?.asBuilt!==false)return false;
 const xs=[24.6,18.9,12.5];
 for(let k=0;k<3;k++){
  const node=nodes?.[12258+k],e=node?.extras;
  if(node?.name!==`WW_1974_${'ABC'[k]}_APPROX_L100_STACK_TO_L150_WORK_TEST_HOST_HOLD`||
   node.mesh!==4622+k||e?.m5System!=='VIEMARI'||e?.stage!=='WORK_TEST_HOST_HOLD'||
   e?.WORK_TEST!==true||e?.workAssumption!==true||
   e?.represents!=='CONCEPTUAL_GRAVITY_BRANCH_NOT_BUILT_ASSET'||
   e?.sourceGLBSHA256!==C80_542_AC_PARENT_SHA256||
   e?.sourceDrawingDriveId!==C80_542_AC_V12_DRIVE_ID||
   e?.sourceG3SheetDriveId!==C80_542_AC_G3_DRIVE_ID||
   e?.['1974SourceRasterAnchor']!==`G3_KVV_1974_V12_WW_1F_STACK_ANCHOR_00${k+1}`||
   e?.g3CoordinateBasis!=='TIFF_RASTER_TOPLEFT_PT_600DPI_NO_TRANSFORM'||
   e?.sourceMarkerIsNotPhysicalPipeLocation!==true||
   e?.planRouteNotSurveyed!==true||
   e?.mainSourceNodeIndex!==12226||e?.mainSourceMeshIndex!==4602||
   !near(e?.nominalStackXYModelWorldM?.[0],xs[k])||
   !near(e?.mainCenterlineConnectionWorkTest?.[0],xs[k])||
   !near(e?.nominalHorizontalLengthM,1.4)||
   !near(e?.nominalHorizontalFallM,0.04)||
   e?.current!==false||e?.asBuilt!==false||
   e?.sourceLinksBound!==false||e?.physicalRouteVerified!==false||
   e?.physicalStack!==false||e?.physicalOpeningClaim!==false||
   e?.physicalMainJunctionBoreVerified!==false)return false;
 }
 return true;
}
export function isC80542ACSourceScene(json,sha,id,floor){
 const spec=C80_542_AC_SCENES[id],asset=json?.asset?.extras;
 if(sha!==C80_542_AC_GLB_SHA256||!spec||
  (floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||asset?.ModelStage!=='WORK_TEST'||
  asset?.current!==false||asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
  json.scenes?.length!==542||json.nodes?.length!==12262||
  json.meshes?.length!==4625||json.materials?.length!==744||
  json.accessors?.length!==10420||json.bufferViews?.length!==10424)return false;
 const scene=json.scenes[id],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_542_WW_ABC_L100_FROM_C80_536_SCENE_${spec.parent}_WORK_TEST_HOST_HOLD`||
  roots?.length!==spec.rootCount||prior?.length!==spec.rootCount||
  new Set(roots).size!==roots.length||
  hash(roots)!==spec.rootHash||hash(prior)!==spec.parentRootHash||
  e?.WORK_TEST!==true||e?.stage!=='WORK_TEST_HOST_HOLD'||
  e?.sourceScene!==spec.parent||e?.sourceGLBSHA256!==C80_542_AC_PARENT_SHA256||
  e?.designInvertSourceDriveId!==C80_542_AC_1974_PLAN_DRIVE_ID||
  e?.physicalABCStackLocationVerified!==false||
  e?.streetPhysicalInterfaceVerified!==false||e?.modelOnly!==true||
  e?.terrainNotModified!==true||e?.physicalStreetConnectionVerified!==false||
  e?.sourceLinksBound!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.ABCBranchesActive!==spec.branches||e?.newSewerInThisScene!==spec.branches)return false;
 const diffs=roots.flatMap((n,i)=>n===prior[i]?[]:[[prior[i],n]]);
 if(spec.branches){
  if(diffs.length!==1||!eq(diffs[0],[12257,12261])||
   !isC80542ACBranchEvidence(json))return false;
 }else if(diffs.length!==0||roots.includes(12261))return false;
 const reachable=descendants(json.nodes,roots);
 if(!reachable||reachable.has(12227)||reachable.has(12257))return false;
 if(spec.branches){
  if(![12225,12226,12255,12256,12258,12259,12260,12261].every(n=>reachable.has(n)))return false;
 }else if([12258,12259,12260,12261].some(n=>reachable.has(n)))return false;
 return true;
}
export function c80542ACSourceReceipt(json,sha,id,floor){
 return Object.freeze({
  exactSource:isC80542ACSourceScene(json,sha,id,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalRoutingVerified:false,physicalJunctionBoreVerified:false,
  actualStacksVerified:false,crossSourceDatumVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
