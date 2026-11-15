/**
 * C80 560 K01 + K03 cofit. Exact original GLB SOURCE_ONLY receipt.
 * This module is not registered in the viewer and grants no sourceLinks,
 * physical/as-built or publication permission.
 */
import {c80530Fnv32 as fnv} from './privateModelC80530V27SourceProfile.mjs';

export const C80_560_GLB_SHA256='fc1d71ab3efa4d96a31505e7cddced7e1d5990fdf641791fdceda6de7db9182a';
export const C80_560_GLB_BYTES=55711820;
export const C80_560_ZIP_SHA256='17fa8ade0792dd3c5e1e8f7f7e4bf490b6181135569575cfc9e0b8f8cc552e4a';
export const C80_560_ZIP_DRIVE_ID='1_By3tITRJUuKTFmtUlP2EaWbLY2MuJS5';
export const C80_560_PARENT_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_560_OWNER_PDF_DRIVE_ID='1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT';
export const C80_560_IV3002D_DRIVE_ID='1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9';
export const C80_560_K01_ZIP_DRIVE_ID='1jlqYHvSuXAyon7b4FdscHOMkptGnmsi2';
export const C80_560_K03_ZIP_DRIVE_ID='14Ojo2YRrI6Y3FEp9zE4AClmMwNd5VA88';

// glTF scene index, 530 parent index, floor, root count, FNV of new and parent roots.
const rows=[
 [530,524,'1F',294,'e92187cd','ef21913f',false],
 [531,525,'2F',191,'25ed8c14','b6394bd0',true],
 [532,526,'BOTH',478,'417eec81','6847aefb',true],
 [533,527,'BOTH',478,'b461e1a9','9d3081c3',true],
 [534,528,'BOTH',478,'5674f047','c0e4d46d',true],
 [535,529,'BOTH',478,'5ff57b22','2b0e6572',true],
];
export const C80_560_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,k03Active])=>
 [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,k03Active})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-6;
function descendants(nodes,roots){
 const seen=new Set(),stack=[...roots];
 while(stack.length){
  const n=stack.pop();
  if(!Number.isInteger(n)||n<0||n>=nodes?.length||!nodes[n])return null;
  if(seen.has(n))continue;
  seen.add(n);
  const c=nodes[n].children;
  if(c!==undefined&&!Array.isArray(c))return null;
  if(c)stack.push(...c);
 }
 return seen;
}
export function isC80560K01K03Evidence(json){
 const n=json?.nodes;
 const k01=n?.[12257],k03=n?.[12258];
 if(!Array.isArray(n)||n.length!==12262||
  k01?.name!=='WPA_K01_D_GABLE_TWO_PRESENCE_ZONES_SW_OWNER_LOCATION_CORRECTED_ROOT_WORK_TEST_HOST_HOLD'||
  !eq(k01.children,[12255,12256])||
  k01.extras?.m5System!=='SADEVESI'||k01.extras?.stage!=='WORK_TEST_HOST_HOLD'||
  k01.extras?.presentationOnly!==true||k01.extras?.currentGeometryClaim!==false||
  k01.extras?.physicalRouteClaim!==false||k01.extras?.sourceLinksBound!==false||
  k01.extras?.asBuiltClaim!==false||
  k03?.name!=='C80_548_K03_D2F_WC_KSO125_WALL_VISUAL_ROOT_WORK_TEST_HOST_HOLD'||
  !eq(k03.children,[12259,12260,12261])||
  k03.extras?.m5System!=='IV'||k03.extras?.sourceMode!=='WORK_TEST_VISUAL_ONLY'||
  !eq(k03.extras?.ownerPointYLIS_G1_LOCAL_XYZ,[5,5.45,5.2])||
  k03.extras?.ownerWallFacingNormalYLIS_G1!=='Nx-1'||
  k03.extras?.sourcePlanFileId!==C80_560_IV3002D_DRIVE_ID||
  k03.extras?.sourcePlanMark!=='KSO-125 2F WC'||
  k03.extras?.sourceGLBSHA256!==C80_560_PARENT_GLB_SHA256||
  k03.extras?.sourceGLBZIPFileID!=='1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s'||
  k03.extras?.physicalDuctConnectionVerified!==false||
  k03.extras?.realWallOpeningVerified!==false||
  k03.extras?.diameterAndSKUVerified!==false||
  k03.extras?.sourceLinksBound!==false||
  k03.extras?.CURRENT!==false||k03.extras?.asBuilt!==false)return false;
 for(const id of [12255,12256]){
  const x=n[id],e=x?.extras;
  if(x?.mesh!==4618||e?.m5System!=='SADEVESI'||
     e?.presentationOnly!==true||e?.sourceLinksBound!==false||
     e?.physicalRouteClaim!==false||e?.current!==false||
     e?.asBuilt!==false)return false;
 }
 for(let k=0;k<3;k++){
  const x=n[12259+k],e=x?.extras;
  if(x?.mesh!==460+k||e?.m5System!=='IV'||
   e?.sourceMeshReusedUnmodified!==true||
   e?.physicalDuctConnectionVerified!==false||
   e?.realOpeningVerified!==false||e?.current!==false||
   e?.asBuilt!==false||!Array.isArray(x.matrix)||
   x.matrix.length!==16||!x.matrix.every(Number.isFinite)||
   !near(x.matrix[12],2.69)||!near(x.matrix[13],0.859775)||
   !near(x.matrix[14],-3.02))return false;
 }
 return true;
}
export function isC80560K01K03SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_560_SCENES[sceneIndex],asset=json?.asset?.extras;
 if(sha!==C80_560_GLB_SHA256||!spec||
  (floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||asset?.ModelStage!=='WORK_TEST'||
  asset?.current!==false||asset?.asBuilt!==false||
  asset?.HUMAN_REVIEW!=='NOT_RUN'||
  json.scenes?.length!==536||json.nodes?.length!==12262||
  json.meshes?.length!==4621||json.materials?.length!==744||
  json.accessors?.length!==10408||json.bufferViews?.length!==10412||
  !isC80560K01K03Evidence(json))return false;
 const s=json.scenes[sceneIndex],p=json.scenes[spec.parent],e=s?.extras;
 const roots=s?.nodes,prior=p?.nodes;
 if(s?.name!=='C80_560_WPA_K01_K03_COFIT_FROM_530_'+(1048+sceneIndex-530)+'_WORK_TEST_HOST_HOLD'||
  !Array.isArray(roots)||!Array.isArray(prior)||
  roots.length!==spec.rootCount||
  prior.length!==spec.rootCount-(spec.k03Active?1:0)||
  fnv(roots)!==spec.rootHash||fnv(prior)!==spec.parentRootHash||
  new Set(roots).size!==roots.length||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.floor!==spec.floor||
  e?.sourceScene!==spec.parent||
  e?.sourceGLBSHA256!==C80_560_PARENT_GLB_SHA256||
  e?.sourceOwnerPdfId!==C80_560_OWNER_PDF_DRIVE_ID||
  e?.ownerCorrection!=='K01_BLUE_ZONE_INSET_FROM_GABLE_CORNER'||
  e?.newSourcePresentationRoot!==12257||e?.replacedOldPresentationRoot!==12251||
  e?.newActualPhysicalPipe!==false||e?.originalArchitectureMeshesUnchanged!==true||
  e?.structuralHostPhysicalApproval!=='HOLD'||
  e?.newSourceLinksBound!==false||e?.sourceLinksBound!==false||
  e?.sourceLinks!=='NOT_BOUND_FOR_NEW_SHA'||
  e?.HUMAN_REVIEW!=='NOT_RUN'||e?.CURRENT!=='NOT_APPROVED'||
  e?.asBuilt!==false||e?.defaultSceneUnchanged!==true)return false;
 const expected=prior.map(n=>n===12251?12257:n);
 if(spec.k03Active)expected.push(12258);
 if(prior.filter(n=>n===12251).length!==1||!eq(roots,expected))return false;
 const live=descendants(json.nodes,roots);
 if(!live||live.has(12251)||
  ![12255,12256,12257].every(n=>live.has(n)))return false;
 if(spec.k03Active){
  if(![12258,12259,12260,12261].every(n=>live.has(n)))return false;
 }else if([12258,12259,12260,12261].some(n=>live.has(n)))return false;
 return true;
}
export function c80560K01K03Receipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80560K01K03SourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalDownspoutVerified:false,physicalDuctConnectionVerified:false,
  exactKSO125SKUVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
