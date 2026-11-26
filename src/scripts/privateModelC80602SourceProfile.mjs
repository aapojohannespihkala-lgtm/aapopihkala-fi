/**
 * C80 602: ALL5 + K12 + K09/Themo + K16/K18 (C80 596 canonical) with the
 * owner K04 2F wall switch hosts SW01..SW04. Source-only WORK_TEST receipt.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 * 2F/BOTH replace exactly the four old K04 roots; 1F is unchanged from 590.
 * No sourceLinks, CURRENT, physical installation or publication authorization.
 */
export const C80_602_GLB_SHA256='68022663faeca35955cf2822a34fc531dc6a446bdd4a13bad0169e16ec80bcfc';
export const C80_602_GLB_BYTES=56765356;
export const C80_602_ZIP_SHA256='538c6800dec2a495f51bc8afdc35ef21607bc3306c4eabe3e6a9e43a815a6f9f';
export const C80_602_ZIP_DRIVE_ID='1FH4aHwm24niQbVMMK5keZotms1lUYUM7';
export const C80_602_PARENT_GLB_SHA256='10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3';
export const C80_602_PARENT_ZIP_DRIVE_ID='1p74OzCIJRrtRhmsHSrYavH7lguZErys7';
export const C80_602_K04_DONOR_GLB_SHA256='5a4c217cd486f6dd884bba4cd5d8cbb086a0a5841521b586d79be33d96a1fbdd';
export const C80_602_K04_DONOR_ZIP_DRIVE_ID='1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c';
// Old owner-markup switch roots -> new wall-hosted roots, in scene order.
export const C80_602_K04_REPLACED=Object.freeze([11830,11833,11836,11839]);
export const C80_602_K04_ROOTS=Object.freeze([12340,12343,12346,12337]);
// [glTF scene, parent scene, floorProfile, FNV root hash, parent hash, k04].
const rows=[
 [596,590,'1F','b1a93af0','b1a93af0',false],
 [597,591,'2F','1e7d348d','922e7205',true],
 [598,592,'BOTH_A','8ff773e7','e18d79af',true],
 [599,593,'BOTH_B','86e37071','d5f94459',true],
 [600,594,'BOTH_C','4a369f9d','e3d2d665',true],
 [601,595,'BOTH_D','1526d9e2','ec7415aa',true],
];
export const C80_602_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash,parentRootHash,k04])=>
 [scene,Object.freeze({scene,parent,profile,floor:profile.startsWith('BOTH')?'BOTH':profile,
  rootHash,parentRootHash,k04})]
)));
export function c80602Fnv32(ids) {
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
/** New K04 hosts are source-host visual WORK_ASSUMPTION, not installation proof. */
export function isC80602K04Evidence(json){
 const names=['K04_WALLHOST_D2F-SW-01_ROOT_WORK_TEST_HOST_HOLD',
  'K04_WALLHOST_D2F-SW-02_ROOT_WORK_TEST_HOST_HOLD',
  'K04_WALLHOST_D2F-SW-03_ROOT_WORK_TEST_HOST_HOLD',
  'K04_SW04_D2F_JAMB_WORK_TEST_HOST_ROOT'];
 const children=[[12338,12339],[12341,12342],[12344,12345],[12335,12336]];
 return C80_602_K04_ROOTS.every((n,i)=>{
  const root=json?.nodes?.[n],e=root?.extras;
  return root?.name===names[i]&&root.mesh===undefined&&eq(root.children,children[i])&&
   e?.role==='WALL_LIGHT_SWITCH_OWNER_MARKUP_WORK_TEST'&&
   e?.stableID===`D2F-SW-0${i===3?4:i+1}`&&
   children[i].every(c=>Number.isInteger(json.nodes[c]?.mesh)&&
    json.nodes[c].extras?.physicalInstalledPositionVerified!==true);
 });
}
export function isC80602SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_602_SCENES[sceneIndex];
 if(sha!==C80_602_GLB_SHA256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==602||json.nodes?.length!==12347||
    json.meshes?.length!==4635||json.materials?.length!==751||
    json.accessors?.length!==10434||json.bufferViews?.length!==10440)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_602_ALL5_K12_K09_THEMO_K16_K18_K04_WALLHOST_COFIT_FROM_${spec.parent}_${spec.floor}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    roots.length!==prior.length||roots.length!==(spec.floor==='1F'?293:spec.floor==='2F'?191:477)||
    c80602Fnv32(roots)!==spec.rootHash||c80602Fnv32(prior)!==spec.parentRootHash||
    new Set(roots).size!==roots.length||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e?.floor!==spec.floor||
    e?.C80602ParentSceneIndex!==spec.parent||
    e?.C80602ParentGLBSHA256!==C80_602_PARENT_GLB_SHA256||
    e?.C80602K04DonorGLBSHA256!==C80_602_K04_DONOR_GLB_SHA256||
    e?.C80602K04SW01to04!==spec.k04||
    e?.physicalK04InstallationVerified!==false||e?.sourceLinksBound!==false||
    e?.productionWebGLVerified!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
    e?.current!==false||e?.CURRENT!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 if(spec.k04){
  const different=prior.flatMap((n,i)=>n!==roots[i]?[i]:[]);
  if(different.length!==4||
     !eq(different.map(i=>prior[i]),C80_602_K04_REPLACED)||
     !eq(different.map(i=>roots[i]),C80_602_K04_ROOTS)||
     !eq(e?.C80602CorrectedK04RootNodes,C80_602_K04_ROOTS)||
     !eq(e?.C80602ReplacedK04OriginalRootNodes,C80_602_K04_REPLACED)||
     !isC80602K04Evidence(json))return false;
 }else if(!eq(roots,prior)||C80_602_K04_ROOTS.some(n=>roots.includes(n)))return false;
 const active=reach(json.nodes,roots);
 if(!active||C80_602_K04_REPLACED.some(n=>active.has(n))||
    (spec.k04?!C80_602_K04_ROOTS.every(n=>active.has(n)):
      C80_602_K04_ROOTS.some(n=>active.has(n))))return false;
 return true;
}
export function c80602Receipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80602SourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',presentationOnly:false,
  current:false,asBuilt:false,sourceLinksBound:false,publishAllowed:false,
  physicalK04InstallationVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
