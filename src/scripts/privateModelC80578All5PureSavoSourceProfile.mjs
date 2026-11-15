/**
 * C80 578 ALL5 K01/K02/K03/K07 CLEAN/K08 source-only exact GLB receipt.
 * No runtime viewer registration, no sourceLinks binding, publication,
 * physical installation, CURRENT/as-built, or HUMAN_REVIEW authorization.
 * Unlike the inherited scene.extras.savoVectorNode12263Active flag, live
 * reachability governs the actual active clean K07 node.
 */
import {c80530Fnv32 as fnv} from './privateModelC80530V27SourceProfile.mjs';

export const C80_578_GLB_SHA256='26157dedc60d1c48b1c0e94b83d713e82324931a9ae866a032456a263c9b09bc';
export const C80_578_GLB_BYTES=56568384;
export const C80_578_ZIP_SHA256='99d55663ffcda43759df9b7b0bf5d029b3a996a3831a1c1a012fd13e15b407bb';
export const C80_578_ZIP_DRIVE_ID='1qlWVFgSvoiX3Rj0xG_5kQHTWOwPkFxp0';
export const C80_578_PARENT_GLB_SHA256='a222b8b4b2b302055e5a090e50149eb2972c8f99a5b3d7c866509b0590f6c9ef';
export const C80_578_ALL5_DONOR_GLB_SHA256='92f6f80994119a99360995b797788c9d0659da14b756c37b57ee75411a82c07e';
export const C80_578_ALL5_DONOR_ZIP_DRIVE_ID='1ZICOiI5S2Pyb51bifBOVjFUwOpCxRbOF';
const rows=[
 [572,566,'1F',294,'a81cdbe9','682f5b29',false],
 [573,567,'2F',191,'922e7205','c6c5565b',true],
 [574,568,'BOTH',478,'d5fd1952','c0fda87a',true],
 [575,569,'BOTH',478,'1a0dbbec','54f191b8',true],
 [576,570,'BOTH',478,'ecb6146c','27625c38',true],
 [577,571,'BOTH',478,'7e74ff1d','86d43853',true],
];
export const C80_578_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,count,rootHash,parentHash,k03Active])=>
 [scene,Object.freeze({scene,parent,floor,count,rootHash,parentHash,k03Active})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-6;
function reach(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const id=todo.pop();
  if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
  if(seen.has(id))continue;
  seen.add(id);
  const kids=nodes[id].children;
  if(kids!==undefined&&!Array.isArray(kids))return null;
  if(kids)todo.push(...kids);
 }
 return seen;
}
export function isC80578RootReplacement(roots,parent,k03Active){
 if(!Array.isArray(parent)||!Array.isArray(roots)||
    parent.filter(n=>n===12251).length!==1||parent.includes(12315)||parent.includes(12316))
  return false;
 const expected=parent.map(n=>n===12251?12315:n);
 if(k03Active)expected.push(12316);
 return eq(roots,expected)&&new Set(roots).size===roots.length;
}
export function isC80578All5Evidence(json){
 const nodes=json?.nodes;
 if(!Array.isArray(nodes)||nodes.length!==12320)return false;
 const k01=nodes[12315],k03=nodes[12316],logo=nodes[12312];
 const e1=k01?.extras,e3=k03?.extras,el=logo?.extras;
 if(k01?.name!=='WPA_K01_D_GABLE_TWO_PRESENCE_ZONES_SW_OWNER_LOCATION_CORRECTED_ROOT_WORK_TEST_HOST_HOLD__C80578_COW'||
  !eq(k01.children,[12313,12314])||
  e1?.m5System!=='SADEVESI'||e1?.presentationOnly!==true||
  e1?.workAssumption!==true||e1?.physicalRouteClaim!==false||
  e1?.asBuiltClaim!==false||e1?.sourceLinksBound!==false||
  e1?.current!==false||e1?.asBuilt!==false||
  e1?.C80578ParentGLBSHA256!==C80_578_PARENT_GLB_SHA256||
  e1?.C80578OriginalDonorGLBSHA256!==C80_578_ALL5_DONOR_GLB_SHA256||
  k03?.name!=='C80_548_K03_D2F_WC_KSO125_WALL_VISUAL_ROOT_WORK_TEST_HOST_HOLD__C80578_COW'||
  !eq(k03.children,[12317,12318,12319])||
  e3?.m5System!=='IV'||e3?.sourceMode!=='WORK_TEST_VISUAL_ONLY'||
  !eq(e3?.ownerPointYLIS_G1_LOCAL_XYZ,[5,5.45,5.2])||
  e3?.sourceLinksBound!==false||e3?.physicalDuctConnectionVerified!==false||
  e3?.realWallOpeningVerified!==false||e3?.diameterAndSKUVerified!==false||
  e3?.CURRENT!==false||e3?.asBuilt!==false||
  e3?.C80578ParentGLBSHA256!==C80_578_PARENT_GLB_SHA256||
  e3?.C80578OriginalDonorGLBSHA256!==C80_578_ALL5_DONOR_GLB_SHA256||
  logo?.mesh!==4629||!json?.meshes?.[4629]||
  logo?.name!=='SAVO_K07_NOSKEW_NO_PHOTO_TRACE_CYLINDRICAL_HORIZONTAL_LOGO'||
  el?.origin!=='vector_font_source_not_photo_traced'||
  el?.correctModelTypeplate!=='Savo I-7603/ISASC505'||
  !near(el?.wordmarkBaselineY,4.6313)||!near(el?.controlAxisZ,-3.55)||
  el?.photoTraced!==false||el?.sourceLinksNewGLBSHA!=='NOT_BOUND'||
  el?.current!==false||el?.asBuilt!==false)return false;
 for(let i=0;i<2;i++){
  const x=nodes[12313+i],e=x?.extras;
  if(x?.mesh!==4618||e?.presentationOnly!==true||e?.sourceLinksBound!==false||
   e?.asBuilt!==false||e?.physicalRouteClaim!==false)return false;
 }
 for(let i=0;i<3;i++){
  const x=nodes[12317+i],e=x?.extras;
  if(x?.mesh!==460+i||e?.m5System!=='IV'||
   e?.sourceMeshReusedUnmodified!==true||e?.physicalDuctConnectionVerified!==false||
   e?.current!==false||e?.asBuilt!==false||
   !Array.isArray(x.matrix)||x.matrix.length!==16||!x.matrix.every(Number.isFinite)||
   !near(x.matrix[12],2.69)||!near(x.matrix[13],0.859775)||!near(x.matrix[14],-3.02))return false;
 }
 return true;
}
export function isC80578All5SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_578_SCENES[sceneIndex],asset=json?.asset?.extras;
 if(sha!==C80_578_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||asset?.ModelStage!=='WORK_TEST'||
  asset?.current!==false||asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
  json?.scenes?.length!==578||json?.nodes?.length!==12320||
  json?.meshes?.length!==4630||json?.materials?.length!==749||
  json?.accessors?.length!==10429||json?.bufferViews?.length!==10433||
  !isC80578All5Evidence(json))return false;
 const s=json.scenes[sceneIndex],p=json.scenes[spec.parent],e=s?.extras;
 const roots=s?.nodes,prior=p?.nodes;
 if(s?.name!=='C80_578_WPA_ALL5_K01_K02_K03_K07_PURE_SAVO_K08_FROM_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD'||
  !Array.isArray(roots)||!Array.isArray(prior)||roots.length!==spec.count||
  fnv(roots)!==spec.rootHash||fnv(prior)!==spec.parentHash||
  !isC80578RootReplacement(roots,prior,spec.k03Active)||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.floor!==spec.floor||
  e?.sourceScene!==spec.parent||e?.sourceGLBSHA256!==C80_578_PARENT_GLB_SHA256||
  e?.cofitOriginalDonorGLBSHA256!==C80_578_ALL5_DONOR_GLB_SHA256||
  e?.sourceLinksBound!==false||e?.newSourceLinksBound!==false||
  e?.HUMAN_REVIEW!=='NOT_RUN'||e?.CURRENT!=='NOT_APPROVED'||
  e?.current!==false||e?.asBuilt!==false||
  e?.physicalWallAndPlumbingVerified!==false||
  e?.productionWebGL!=='NOT_VERIFIED')return false;
 const live=reach(json.nodes,roots);
 if(!live||live.has(12251)||live.has(12262)||live.has(12263)||!live.has(12315)||
  ![12313,12314].every(i=>live.has(i)))return false;
 const active=[12312,12316,12317,12318,12319,12264,12271];
 return spec.k03Active?active.every(i=>live.has(i)):active.every(i=>!live.has(i));
}
export function c80578All5Receipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80578All5SourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,sourceLinksBound:false,
  publishAllowed:false,current:false,asBuilt:false,
  physicalDownspoutVerified:false,physicalVentConnectionVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
}
