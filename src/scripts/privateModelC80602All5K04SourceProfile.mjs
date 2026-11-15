/**
 * C80 602 ALL5/K04 joined WORK_TEST source-only receipt.
 * The SHA parameter MUST come from a trusted hash of complete ORIGINAL GLB bytes.
 * Never grants sourceLinks, physical installation, current/as-built or publication.
 */
export const C80_602_ZIP_DRIVE_ID='1FH4aHwm24niQbVMMK5keZotms1lUYUM7';
export const C80_602_ZIP_SHA256='538c6800dec2a495f51bc8afdc35ef21607bc3306c4eabe3e6a9e43a815a6f9f';
export const C80_602_GLB_SHA256='68022663faeca35955cf2822a34fc531dc6a446bdd4a13bad0169e16ec80bcfc';
export const C80_602_GLB_BYTES=56765356;
export const C80_602_PARENT_GLB_SHA256='10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3';
export const C80_602_K04_DONOR_GLB_SHA256='5a4c217cd486f6dd884bba4cd5d8cbb086a0a5841521b586d79be33d96a1fbdd';

const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const parentFnv=['b1a93af0','922e7205','e18d79af','d5f94459','e3d2d665','ec7415aa'];
const successorFnv=['b1a93af0','1e7d348d','8ff773e7','86e37071','4a369f9d','1526d9e2'];
const counts=[293,191,477,477,477,477];
const off=[11830,11833,11836,11839];
const on=[12340,12343,12346,12337];
export const C80_602_SCENES=Object.freeze(Object.fromEntries(
 floors.map((floor,n)=>[596+n,Object.freeze({
  scene:596+n,parentScene:590+n,donorScene:536+n,
  floor,rootCount:counts[n],parentFnv:parentFnv[n],rootFnv:successorFnv[n],
 })])
));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function c80602RootFnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
function trustedSceneMeta(s,profile,hasK04){
 const x=s?.extras;
 return !!x&&x.WORK_TEST===true&&x.stage==='WORK_TEST_HOST_HOLD'&&
  x.floor===profile.floor&&x.HOST_HOLD===true&&
  x.C80602ParentSceneIndex===profile.parentScene&&
  x.C80602ParentGLBSHA256===C80_602_PARENT_GLB_SHA256&&
  x.C80602K04DonorSceneIndex===profile.donorScene&&
  x.C80602K04DonorGLBSHA256===C80_602_K04_DONOR_GLB_SHA256&&
  x.C80602K04DonorZipDriveID==='1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c'&&
  x.C80602SourceZipDriveID==='1p74OzCIJRrtRhmsHSrYavH7lguZErys7'&&
  x.C80602K04SW01to04===hasK04&&
  x.C80602PreserveAll5K12K09ThemoK16K18===true&&
  same(x.C80602ReplacedK04OriginalRootNodes,hasK04?off:[])&&
  same(x.C80602CorrectedK04RootNodes,hasK04?on:[])&&
  x.originalSourceLinksUnchanged===true&&
  x.sourceLinksBound===false&&x.sourceLinksBoundNewGLBSHA===false&&
  x.current===false&&x.asBuilt===false&&
  x.HUMAN_REVIEW==='NOT_RUN'&&x.productionWebGLVerified===false&&
  x.physicalK04InstallationVerified===false&&
  x.physicalWallHostVerified===false&&x.productSkuVerified===false;
}
function trustedNewNodes(g){
 const ids=[12340,12343,12346,12337];
 const stable=['D2F-SW-01','D2F-SW-02','D2F-SW-03','D2F-SW-04'];
 const kids=[[12338,12339],[12341,12342],[12344,12345],[12335,12336]];
 return ids.every((id,i)=>{
  const n=g.nodes[id],e=n?.extras,children=n?.children;
  return !Number.isInteger(n?.mesh)&&e?.stableID===stable[i]&&
   e?.role==='WALL_LIGHT_SWITCH_OWNER_MARKUP_WORK_TEST'&&
   same(children,kids[i])&&children.every((v,j)=>{
    const child=g.nodes[v],mesh=g.meshes[child?.mesh];
    return child?.mesh===(j===0?4495:4496)&&
     mesh?.primitives?.length>0&&
     child?.extras?.sourceParentGLBSHA256!==C80_602_GLB_SHA256;
   });
 });
}
export function isC80602All5K04SourceScene(g,authenticatedSha,index,floor=null){
 const profile=C80_602_SCENES[index],asset=g?.asset?.extras;
 if(authenticatedSha!==C80_602_GLB_SHA256||!profile||
  (floor!==null&&floor!==profile.floor)||
  g?.scene!==292||g?.scenes?.length!==602||
  g?.nodes?.length!==12347||g?.meshes?.length!==4635||
  g?.accessors?.length!==10434||g?.bufferViews?.length!==10440||
  g?.buffers?.[0]?.byteLength!==33606952||
  asset?.ModelStage!=='WORK_TEST'||asset?.Canonical!==false||
  asset?.asBuilt!==false||asset?.current!==false||
  asset?.HUMAN_REVIEW!=='NOT_RUN'||
  !trustedNewNodes(g))return false;
 for(const [key,spec] of Object.entries(C80_602_SCENES)){
  const i=Number(key),p=g.scenes?.[spec.parentScene],s=g.scenes[i];
  const active=spec.floor!=='1F',old=p?.nodes,now=s?.nodes;
  if(!Array.isArray(old)||!Array.isArray(now)||
   p.name!=='C80_596_ALL5_K12_K09_THEMO_K16_K18_COFIT_FROM_'+(spec.parentScene-6)+'_'+spec.floor+'_WORK_TEST_HOST_HOLD'||
   s.name!=='C80_602_ALL5_K12_K09_THEMO_K16_K18_K04_WALLHOST_COFIT_FROM_'+spec.parentScene+'_'+spec.floor+'_WORK_TEST_HOST_HOLD'||
   p.extras?.current!==false||p.extras?.asBuilt!==false||
   !trustedSceneMeta(s,spec,active)||
   old.length!==spec.rootCount||now.length!==spec.rootCount||
   new Set(now).size!==spec.rootCount||
   c80602RootFnv32(old)!==spec.parentFnv||
   c80602RootFnv32(now)!==spec.rootFnv||
   !same(now,old.map(n=>active?(on[off.indexOf(n)]??n):n))||
   (active&&(off.some(n=>now.includes(n))||on.some(n=>!now.includes(n))))||
   (!active&&on.some(n=>now.includes(n))))return false;
 }
 return true;
}
export function c80602SourceReceipt(g,sha,index){
 return Object.freeze({
  exactSource:isC80602All5K04SourceScene(g,sha,index),
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false
 });
}
