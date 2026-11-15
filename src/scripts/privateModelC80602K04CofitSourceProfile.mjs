/**
 * C80 602 ALL5/K12/K09/Themo/K16/K18 + K04 SW01..04 exact source.
 * Original 56.7 MB G2b GLB is authenticated by the caller's full SHA-256.
 * This is a SOURCE_ONLY receipt, NOT a viewer registration, sourceLinks
 * rebinding, as-built approval, physical-wall verification or publication.
 */
export const C80602_GLB_SHA256='68022663faeca35955cf2822a34fc531dc6a446bdd4a13bad0169e16ec80bcfc';
export const C80602_GLB_BYTES=56765356;
export const C80602_ZIP_SHA256='538c6800dec2a495f51bc8afdc35ef21607bc3306c4eabe3e6a9e43a815a6f9f';
export const C80602_ZIP_DRIVE_ID='1FH4aHwm24niQbVMMK5keZotms1lUYUM7';
export const C80602_PARENT_596_GLB_SHA256='10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3';
export const C80602_K04_DONOR_542_GLB_SHA256='5a4c217cd486f6dd884bba4cd5d8cbb086a0a5841521b586d79be33d96a1fbdd';
export const C80602_K04_DONOR_542_ZIP_DRIVE_ID='1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c';
export const C80602_SOURCE_ONLY=true;
export const C80602_SOURCE_LINKS_BOUND=false;
export const C80602_PUBLISH_ALLOWED=false;
const OLD_K04=[11830,11833,11836,11839];
const NEW_K04=[12340,12343,12346,12337];
const FLOOR=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const PARENT_FNV=['b1a93af0','922e7205','e18d79af','d5f94459','e3d2d665','ec7415aa'];
const RESULT_FNV=['b1a93af0','1e7d348d','8ff773e7','86e37071','4a369f9d','1526d9e2'];
const COUNTS=[293,191,477,477,477,477];
export const C80602_SCENES=Object.freeze(Object.fromEntries(FLOOR.map((floor,n)=>
 [596+n,Object.freeze({scene:596+n,parent:590+n,donor:536+n,floor,
   rootCount:COUNTS[n],parentFnv:PARENT_FNV[n],rootFnv:RESULT_FNV[n],
   k04Active:n!==0})]
)));
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.length===b.length&&a.every((x,i)=>x===b[i]);
export function c80602RootFnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const id of ids){
  if(!Number.isInteger(id)||id<0)return null;
  h=Math.imul(h^id,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
/** Array-order exact, preserving all non-K04 roots. */
export function c80602K04RootReplacement(parent,next,active){
 if(!Array.isArray(parent)||!Array.isArray(next)||parent.length!==next.length||
   new Set(parent).size!==parent.length||new Set(next).size!==next.length)return false;
 const expected=active?parent.map(i=>{
  const k=OLD_K04.indexOf(i);
  return k<0?i:NEW_K04[k];
 }):parent;
 return same(expected,next)&&
   (active?OLD_K04.every(n=>parent.includes(n)&&!next.includes(n))&&
     NEW_K04.every(n=>next.includes(n)&&!parent.includes(n)):
     !NEW_K04.some(n=>next.includes(n)));
}
const K04_CHILDREN=[[12338,12339],[12341,12342],[12344,12345],[12335,12336]];
const K04_DONOR_ORIG=[12260,12263,12266,12257];
export function c80602K04SourceNodesExact(json){
 const nodes=json?.nodes;
 if(!Array.isArray(nodes)||nodes.length!==12347)return false;
 return NEW_K04.every((id,k)=>{
  const n=nodes[id],e=n?.extras,children=K04_CHILDREN[k];
  return same(n?.children,children)&&
   n?.name?.startsWith('K04_')&&
   e?.C80602CofitParentGLBSHA256===C80602_PARENT_596_GLB_SHA256&&
   e?.C80602K04DonorGLBSHA256===C80602_K04_DONOR_542_GLB_SHA256&&
   e?.C80602DonorOriginalNodeId===K04_DONOR_ORIG[k]&&
   e?.C80602SourceExactMeshUnchanged===true&&
   e?.C80602WorkAssumptionNotAsBuilt===true&&
   e?.sourceLinksBoundNewGLBSHA===false&&
   e?.current===false&&e?.asBuilt===false&&
   e?.physicalPositionVerified===false&&e?.productSkuVerified===false&&
   e?.productionWebGL==='NOT_VERIFIED'&&
   children.every((child,j)=>{
    const x=nodes[child],y=x?.extras;
    return x?.mesh===(j===0?4495:4496)&&
     x?.name?.startsWith('K04_')&&
     y?.C80602CofitParentGLBSHA256===C80602_PARENT_596_GLB_SHA256&&
     y?.C80602K04DonorGLBSHA256===C80602_K04_DONOR_542_GLB_SHA256&&
     y?.C80602SourceExactMeshUnchanged===true&&
     y?.sourceLinksBoundNewGLBSHA===false&&
     y?.current===false&&y?.asBuilt===false;
   });
 });
}
function reachable(nodes,roots){
 const todo=[...roots],seen=new Set();
 while(todo.length){
  const i=todo.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length)return null;
  if(seen.has(i))continue;
  seen.add(i);
  const c=nodes[i]?.children;
  if(c!==undefined&&!Array.isArray(c))return null;
  if(c)todo.push(...c);
 }
 return seen;
}
function stage(s,f){
 const e=s?.extras;
 return e?.stage==='WORK_TEST_HOST_HOLD'&&e?.WORK_TEST===true&&
  e?.floor===f&&e?.sourceLinksBound===false&&
  e?.sourceLinksBoundNewSHA===false&&e?.current===false&&e?.asBuilt===false&&
  e?.productionWebGLVerified===false&&e?.HUMAN_REVIEW==='NOT_RUN';
}
export function isC80602K04SourceScene(g,sha,index,floor=null){
 const spec=C80602_SCENES[index],asset=g?.asset?.extras;
 if(sha!==C80602_GLB_SHA256||!spec||
   (floor!==null&&floor!==spec.floor)||
   g?.scene!==292||g?.scenes?.length!==602||g?.nodes?.length!==12347||
   g?.meshes?.length!==4635||g?.materials?.length!==751||
   g?.accessors?.length!==10434||g?.bufferViews?.length!==10440||
   g?.buffers?.[0]?.byteLength!==33606952||
   asset?.ModelStage!=='WORK_TEST'||asset?.Canonical!==false||
   asset?.current!==false||asset?.asBuilt!==false||
   asset?.HUMAN_REVIEW!=='NOT_RUN'||
   !c80602K04SourceNodesExact(g))return false;
 for(let i=0;i<6;i++){
  const s=C80602_SCENES[596+i],parent=g.scenes[s.parent],next=g.scenes[s.scene],e=next?.extras;
  const name=`C80_602_ALL5_K12_K09_THEMO_K16_K18_K04_WALLHOST_COFIT_FROM_${s.parent}_${s.floor}_WORK_TEST_HOST_HOLD`;
  if(!stage(parent,s.floor)||!stage(next,s.floor)||
   next?.name!==name||
   parent.nodes?.length!==s.rootCount||next.nodes?.length!==s.rootCount||
   c80602RootFnv32(parent.nodes)!==s.parentFnv||
   c80602RootFnv32(next.nodes)!==s.rootFnv||
   !c80602K04RootReplacement(parent.nodes,next.nodes,s.k04Active)||
   e?.C80602K04SW01to04!==s.k04Active||
   e?.C80602K04DonorSceneIndex!==s.donor||
   e?.C80602K04DonorGLBSHA256!==C80602_K04_DONOR_542_GLB_SHA256||
   e?.C80602K04DonorZipDriveID!==C80602_K04_DONOR_542_ZIP_DRIVE_ID||
   e?.sourceLinksBoundNewGLBSHA!==false||
   e?.physicalK04InstallationVerified!==false||
   !same(e?.C80602CorrectedK04RootNodes,s.k04Active?NEW_K04:[])||
   !same(e?.C80602ReplacedK04OriginalRootNodes,s.k04Active?OLD_K04:[]))return false;
  const live=reachable(g.nodes,next.nodes);
  if(!live)return false;
  if(s.k04Active){
   if(!NEW_K04.every(n=>live.has(n))||OLD_K04.some(n=>live.has(n))||
     !live.has(12312)||!live.has(12315)||!live.has(12316))return false;
  }else if(NEW_K04.some(n=>live.has(n))||!live.has(12315))return false;
  // Shared 1F/BOTH corrections must remain. 2F has no K09/Themo/K16/K18.
  if(s.floor!=='2F'&&![12329,12331,12332,12333,12334].every(n=>live.has(n)))
   return false;
 }
 return true;
}
export function c80602K04SourceReceipt(g,sha,scene){
 const exactSource=isC80602K04SourceScene(g,sha,scene);
 return Object.freeze({exactSource,sourceLinksBound:false,
  current:false,asBuilt:false,physicalHostVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',publishAllowed:false});
}
