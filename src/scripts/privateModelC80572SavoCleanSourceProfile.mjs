/**
 * C80 572: original SHA-locked Savo K07 clean, horizontal typography.
 * SOURCE_ONLY receipt. Not mounted in the viewer, no sourceLinks or
 * production/CURRENT/as-built/HUMAN_REVIEW authorization.
 * The 1F scene is intentionally unchanged; 2F/BOTH replace only the
 * legacy distorted K07 vector root with the new clean typography root.
 */
import {c80530Fnv32 as fnv} from './privateModelC80530V27SourceProfile.mjs';

export const C80_572_GLB_SHA256='a222b8b4b2b302055e5a090e50149eb2972c8f99a5b3d7c866509b0590f6c9ef';
export const C80_572_GLB_BYTES=56525464;
export const C80_572_ZIP_SHA256='c4f433fd818073980d8a148d26c19072833bf42f5c84897043b0208a80b60c8b';
export const C80_572_ZIP_DRIVE_ID='15RZerMjyHIpY-ccx8GOFTMKKJNl2_FHh';
export const C80_572_PARENT_GLB_SHA256='fb1f24bac4050c5d7b4c01587da12b5858f10043cade658a49eb7fa7d7bed878';
const rows=[
 [566,560,'1F',294,'682f5b29','682f5b29',false],
 [567,561,'2F',190,'c6c5565b','93b54812',true],
 [568,562,'BOTH',477,'c0fda87a','0410f5f3',true],
 [569,563,'BOTH',477,'54f191b8','83d0ccb5',true],
 [570,564,'BOTH',477,'27625c38','564fc235',true],
 [571,565,'BOTH',477,'86d43853','03f2e61a',true],
];
export const C80_572_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,count,hash,parentHash,k07Active])=>
 [scene,Object.freeze({scene,parent,floor,count,hash,parentHash,k07Active})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-6;
function reachable(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),stack=[...roots];
 while(stack.length){
  const id=stack.pop();
  if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
  if(seen.has(id))continue;
  seen.add(id);
  const children=nodes[id].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)stack.push(...children);
 }
 return seen;
}
export function isC80572SavoRootReplacement(roots,parent,k07Active){
 if(!Array.isArray(roots)||!Array.isArray(parent))return false;
 if(!k07Active)return eq(roots,parent)&&!roots.includes(12312);
 if(parent.filter(n=>n===12263).length!==1||parent.includes(12312))return false;
 return eq(roots,parent.map(n=>n===12263?12312:n))&&
        roots.filter(n=>n===12312).length===1&&!roots.includes(12263);
}
export function isC80572SavoEvidence(json){
 const n=json?.nodes?.[12312],e=n?.extras;
 return n?.name==='SAVO_K07_NOSKEW_NO_PHOTO_TRACE_CYLINDRICAL_HORIZONTAL_LOGO'&&
  n.mesh===4629&&Boolean(json?.meshes?.[4629])&&
  e?.modelRole==='K07_SAVO_CONTROL_PANEL'&&
  e?.origin==='vector_font_source_not_photo_traced'&&
  e?.correctModelTypeplate==='Savo I-7603/ISASC505'&&
  e?.sourceGLBSHA256===C80_572_PARENT_GLB_SHA256&&
  near(e?.wordmarkBaselineY,4.6313)&&near(e?.controlAxisZ,-3.55)&&
  near(e?.cylindricalRadiusMetres,0.1602)&&
  e?.textKerningMode==='single font path common baseline'&&
  e?.imageGenerated===false&&e?.photoTraced===false&&
  e?.sourceLinksNewGLBSHA==='NOT_BOUND'&&
  e?.productionWebGL==='NOT_VERIFIED'&&e?.current===false&&e?.asBuilt===false;
}
export function isC80572SavoSourceScene(json,sha,sceneIndex,floor){
 const spec=C80_572_SCENES[sceneIndex],a=json?.asset?.extras;
 if(sha!==C80_572_GLB_SHA256||!spec||
  (floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||a?.ModelStage!=='WORK_TEST'||
  a?.current!==false||a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
  json?.scenes?.length!==572||json?.nodes?.length!==12313||
  json?.meshes?.length!==4630||json?.materials?.length!==749||
  json?.accessors?.length!==10429||json?.bufferViews?.length!==10433||
  !isC80572SavoEvidence(json))return false;
 const s=json.scenes[sceneIndex],p=json.scenes[spec.parent],e=s?.extras;
 const roots=s?.nodes,old=p?.nodes;
 if(s?.name!=='C80_572_K07_CLEAN_PARAMETRIC_LABELS_SOURCE_SCENE_'+spec.parent||
  !Array.isArray(roots)||!Array.isArray(old)||roots.length!==spec.count||
  fnv(roots)!==spec.hash||fnv(old)!==spec.parentHash||
  new Set(roots).size!==roots.length||
  !isC80572SavoRootReplacement(roots,old,spec.k07Active)||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.sourceScene!==spec.parent||
  e?.floor!==spec.floor||e?.sourceGLBSHA256!=='fc9f921cc1f5da9118f27cab70a9d8ee3f6a0746934b4ec64a4d804a40be3eb1'||
  e?.parentGLBSHA256!==C80_572_PARENT_GLB_SHA256||
  e?.sourceLinksBound!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.physicalWallAndPlumbingVerified!==false||
  e?.productionWebGLVerified!==false||e?.HOST_HOLD!==true||
  e?.current!==false||e?.asBuilt!==false)return false;
 const active=reachable(json.nodes,roots);
 if(!active||active.has(12263))return false;
 return spec.k07Active?active.has(12312):!active.has(12312);
}
export function c80572SavoReceipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80572SavoSourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalSavoMountVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',
 });
}
