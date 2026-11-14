// Source-only SUCC455 receiver. SHA must be measured over ALL original GLB bytes.
// This is NOT a viewer registration or permission to publish WORK_TEST geometry.
export const SUCC455_GLB_SHA256='f990edd8ddd8277abfd419ab72b424ee360aba462739bda19fab44341c159353';
export const SUCC455_GLB_BYTES=54778060;
export const SUCC455_ZIP_SHA256='3cba36a395e3beacf9726e5d05f5fd47ecf42310c337cc6cf0033eebc6a9b62f';
export const SUCC455_ZIP_DRIVE_ID='1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE';
export const SUCC455_PARENT_GLB_SHA256='caad41802daa0615356dd9f4d610dc087c3d15447475721db304489072fe7c7d';
export const SUCC455_SOURCE_PDF_ID='1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';
export const SUCC455_PUBLISH_ALLOWED=false;
export const SUCC455_SOURCE_LINKS_BOUND=false;
export const SUCC455_PRODUCTION_WEBGL_VERIFIED=false;
export const SUCC455_HUMAN_REVIEW='NOT_RUN';
// [new scene, immutable parent scene, floor, number of root nodes, new/old FNV32]
const rows=[
 [460,453,'2F',185,'bd47ec87','72d1f94d'],
 [461,454,'BOTH',467,'93c8fa2d','7faf3d9e'],
 [462,455,'2F',185,'6eae1917','eea3eaed'],
 [463,456,'BOTH',467,'65ec828b','8dd7aeda'],
 [464,457,'2F',185,'42c45247','358bad15'],
 [465,458,'BOTH',467,'bab795e3','42cacf18'],
 [466,459,'BOTH',467,'eb9d1f34','d3e6bcdb'],
 [467,437,'1F',288,'0836d5c2','0e9c3335'],
 [468,444,'1F',288,'f3be6c43','5fec4df4'],
];
export const SUCC455_SCENES=Object.freeze(Object.fromEntries(rows.map(([id,parent,floor,roots,fnv,parentFnv])=>
 [id,Object.freeze({parent,floor,roots,fnv,parentFnv})])));
export function succ455RootsFnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){if(!Number.isInteger(n)||n<0)return null;h=Math.imul(h^n,16777619)>>>0;}
 return h.toString(16).padStart(8,'0');
}
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<0.00001;
function ledPair(gltf,trim,center,x,y,z){
 const a=gltf.nodes[trim],b=gltf.nodes[center];
 return a?.mesh===4497&&b?.mesh===4498&&
  [a,b].every((n,i)=>Array.isArray(n.translation)&&n.translation.length===3&&
    near(n.translation[0],x)&&near(n.translation[1],y+0.0015*i)&&near(n.translation[2],z))&&
  a.extras?.stage==='WORK_TEST_HOST_HOLD'&&b.extras?.stage==='WORK_TEST_HOST_HOLD';
}
function measuredPlanGeometry(gltf){
 const z2=[-0.59328,-1.59328,-2.59328,-3.59328,-4.59328];
 const n2=[[11846,11847],[12173,12174],[12175,12176],[12177,12178],[12179,12180]];
 if(!n2.every(([a,b],i)=>ledPair(gltf,a,b,0.56732,5.255,z2[i])))return false;
 const z1=[-5.46312,-6.72693,-7.99074],x1=[3.04056,4.05556,5.07056];
 const n1=[[[11805,11806],[12181,12182],[12183,12184]],
           [[11811,11812],[12185,12186],[12187,12188]],
           [[11817,11818],[12189,12190],[12191,12192]]];
 return n1.every((row,r)=>row.every(([a,b],c)=>ledPair(gltf,a,b,x1[c],2.421,z1[r])));
}
export function isSucc455LedScene(gltf,authenticatedRawGLBSha,index,floor=null){
 const spec=SUCC455_SCENES[index],s=gltf?.scenes?.[index],p=gltf?.scenes?.[spec?.parent];
 const n=gltf?.nodes,m=gltf?.meshes,a=gltf?.asset?.extras;
 if(authenticatedRawGLBSha!==SUCC455_GLB_SHA256||!spec||!s||!p||
  (floor!==null&&floor!==spec.floor)||gltf?.scene!==292||
  gltf?.scenes?.length!==469||n?.length!==12195||m?.length!==4577||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
  s.name!==`C80_SUCC455_PLAN2015_LED_SPACING_1000_1015_FROM_SCENE${spec.parent}_WORK_TEST_HOST_HOLD`||
  !Array.isArray(s.nodes)||s.nodes.length!==spec.roots||new Set(s.nodes).size!==spec.roots||
  !Array.isArray(p.nodes)||p.nodes.length!==spec.roots||
  s.nodes.some(i=>!Number.isInteger(i)||i<0||i>=n.length)||
  succ455RootsFnv32(s.nodes)!==spec.fnv||succ455RootsFnv32(p.nodes)!==spec.parentFnv)return false;
 const e=s.extras,fix=e?.plan2015SpacingCorrection;
 if(e?.floor!==spec.floor||e?.stage!=='WORK_TEST_HOST_HOLD'||
  (spec.floor!=='1F'&&(e?.publishState!=='HOST_HOLD'||e?.sourceLinks!=='NOT_BOUND'||
   e?.humanReview!=='NOT_RUN'||e?.newKitchenLedCount!==2||
   e?.wcLEDRelocatedCount!==1||e?.wcLEDNewCount!==0))||
  e?.sourceLinksBindingVerified!==false||e?.asBuilt!==false||e?.rejectedHigh3Excluded!==true||
  fix?.parentScene!==spec.parent||fix?.sourceDocId!==SUCC455_SOURCE_PDF_ID||
  fix?.sourceOriginalModelId!=='1baPZkajTH1s8uVqD05lQQGM32MN9lsgt'||
  fix?.sourceOriginalModelGLBSha256!==SUCC455_PARENT_GLB_SHA256||
  fix?.ownerConfirmedUnchangedSince2015!==true||fix?.spacing2Fmm!==1000||
  fix?.spacing1Fmm!==1015||fix?.['1FgridAllThreeRows']!==true||
  fix?.changedRoot1F!==(spec.floor!=='2F')||fix?.changedRoot2F!==(spec.floor!=='1F')||
  fix?.root1F!==(spec.floor==='2F'?null:12193)||fix?.root2F!==(spec.floor==='1F'?null:12194)||
  fix?.sourceLinksBound!==false||fix?.productionWebGL!=='NOT_RUN'||
  fix?.humanReview!=='NOT_RUN'||fix?.CURRENT!==false||fix?.asBuilt!==false||
  fix?.stage!=='WORK_TEST_HOST_HOLD')return false;
 const substitutions=new Map(spec.floor==='2F'?[[12172,12194]]:
   spec.floor==='1F'?[[11910,12193]]:[[12172,12194],[11910,12193]]);
 const diff=p.nodes.map((id,i)=>[id,s.nodes[i]]).filter(([x,y])=>x!==y);
 if(diff.length!==substitutions.size||diff.some(([x,y])=>substitutions.get(x)!==y)||
   [...substitutions].some(([x,y])=>!p.nodes.includes(x)||!s.nodes.includes(y)||s.nodes.includes(x)))return false;
 const r1=n[12193],r2=n[12194];
 if(r1?.children?.length!==26||r2?.children?.length!==12||
   ![12181,12183,12185,12187,12189,12191].every(i=>r1.children.includes(i))||
   ![12173,12175,12177,12179,12169,12170].every(i=>r2.children.includes(i))||
   r1.extras?.owner20261114PlanSpacingCorrection?.changedChildCount!==12||
   r2.extras?.owner20261114PlanSpacingCorrection?.changedChildCount!==8||
   r2.extras?.new2FWCNodes?.join(',')!=='12169,12170'||
   n[12164]?.mesh!==4576||m[4576]?.primitives?.[0]?.material!==534)return false;
 return measuredPlanGeometry(gltf);
}
export function resolveSucc455SceneIndex(sha,parentScene,floor){
 if(sha!==SUCC455_GLB_SHA256||!Number.isInteger(parentScene)||
    !['1F','2F','BOTH'].includes(floor))return null;
 const matches=Object.entries(SUCC455_SCENES).filter(([,s])=>s.parent===parentScene&&s.floor===floor);
 return matches.length===1?Number(matches[0][0]):null;
}
export function getSucc455SourceReceipt(gltf,sha,index){
 return Object.freeze({exactSource:isSucc455LedScene(gltf,sha,index),sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',current:false,asBuilt:false});
}
