// Immutable source-exact receipt for SUCC455 plan-2015 LED spacing WORK_TEST GLB.
// This does not register a model, bind sourceLinks or authorize publishing.
// authenticatedGlbSha256 MUST be computed from the complete actual GLB bytes.
export const C80_SUCC455_GLB_SHA256='f990edd8ddd8277abfd419ab72b424ee360aba462739bda19fab44341c159353';
export const C80_SUCC455_GLB_BYTES=54778060;
export const C80_SUCC455_ZIP_SHA256='3cba36a395e3beacf9726e5d05f5fd47ecf42310c337cc6cf0033eebc6a9b62f';
export const C80_SUCC455_ZIP_DRIVE_ID='1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE';
export const C80_SUCC455_PARENT_GLB_SHA256='caad41802daa0615356dd9f4d610dc087c3d15447475721db304489072fe7c7d';
export const C80_SUCC455_PARENT_ZIP_DRIVE_ID='1baPZkajTH1s8uVqD05lQQGM32MN9lsgt';
export const C80_SUCC455_PLAN2015_PDF_DRIVE_ID='1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';
export const C80_SUCC455_SOURCE_ONLY=true;
export const C80_SUCC455_SOURCE_LINKS_BOUND=false;
export const C80_SUCC455_PUBLISH_ALLOWED=false;
export const C80_SUCC455_PRODUCTION_WEBGL_VERIFIED=false;
export const C80_SUCC455_HUMAN_REVIEW='NOT_RUN';

const rows=[
  [460,453,'2F',185,'bd47ec87',411],
  [461,454,'BOTH',467,'93c8fa2d',412],
  [462,455,'2F',185,'6eae1917',413],
  [463,456,'BOTH',467,'65ec828b',414],
  [464,457,'2F',185,'42c45247',415],
  [465,458,'BOTH',467,'bab795e3',416],
  [466,459,'BOTH',467,'eb9d1f34',418],
  [467,437,'1F',288,'0836d5c2',410],
  [468,444,'1F',288,'f3be6c43',417]
];
export const C80_SUCC455_SCENES=Object.freeze(Object.fromEntries(rows.map(
  ([index,parentScene,floor,rootCount,rootFnv,sourceSceneIndex])=>[
    index,Object.freeze({
      name:'C80_SUCC455_PLAN2015_LED_SPACING_1000_1015_FROM_SCENE'+parentScene+'_WORK_TEST_HOST_HOLD',
      parentScene,floor,rootCount,rootFnv,sourceSceneIndex
    })
  ]
)));

export function c80Succ455RootFnv32(ids) {
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const n of ids){
    if(!Number.isInteger(n)||n<0)return null;
    h=Math.imul(h^n,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const near=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-7;
const moved2F=[12173,12174,12175,12176,12177,12178,12179,12180];
const moved1F=[12181,12182,12183,12184,12185,12186,12187,12188,12189,12190,12191,12192];

// Exact geometry node identities and local glTF translations from raw SUCC455;
// these are not surveyed 2026 as-built light positions.
function movedNodeMatch(nodes){
  for(let i=0;i<moved2F.length;i++){
    const n=nodes[moved2F[i]],t=n?.translation;
    if(n?.mesh!==(i%2===0?4497:4498)||
       !n?.name?.includes('PLAN2015_SPACING_CORRECTED_WORK_TEST_HOST_HOLD')||
       !Array.isArray(t)||t.length!==3||!near(t[0],0.56732)||
       !near(t[1],i%2===0?5.255:5.2565)||
       !near(t[2],[-1.59328,-2.59328,-3.59328,-4.59328][Math.floor(i/2)]))return false;
  }
  for(let i=0;i<moved1F.length;i++){
    const n=nodes[moved1F[i]],t=n?.translation;
    if(n?.mesh!==(i%2===0?4497:4498)||
       !n?.name?.includes('PLAN2015_SPACING_CORRECTED_WORK_TEST_HOST_HOLD')||
       !Array.isArray(t)||t.length!==3||
       !near(t[0],Math.floor((i%4)/2)===0?4.05556:5.07056)||
       !near(t[1],i%2===0?2.421:2.4225)||
       !near(t[2],[-5.46312,-6.72693,-7.99074][Math.floor(i/4)]))return false;
  }
  return true;
}
function rootMatch(root,floor){
  if(!root||!Array.isArray(root.children)||root.mesh!==undefined)return false;
  const p=root.extras?.owner20261114PlanSpacingCorrection;
  if(p?.group!==floor||p.sourcePdfDriveId!==C80_SUCC455_PLAN2015_PDF_DRIVE_ID||
     p.modelSourceDriveId!==C80_SUCC455_PARENT_ZIP_DRIVE_ID||
     p.modelSourceGLBSha256!==C80_SUCC455_PARENT_GLB_SHA256||
     p.ownerUnchangedSince2015!==true||p.sourceLinksBound!==false||
     p.stage!=='WORK_TEST_HOST_HOLD'||p.current!==false||p.asBuilt!==false)return false;
  if(floor==='1F'){
    return root.name==='LED24_GRID_ACCEPTED_1F_MARKERS_SG04_05_06_07_09_REPLACED_BY_PRODUCTS_LED08_HOLD_WORK_TEST_PLAN2015_LED_INTERVAL_COW_WORK_TEST_HOST_HOLD'&&
      p.changedChildCount===12&&root.children.length===26&&
      moved1F.every(i=>root.children.includes(i))&&moved2F.every(i=>!root.children.includes(i));
  }
  return root.name==='OWNER20261114_2F_LED24_P06_RELOCATED_ROOT_METADATA_FIXED_WORK_TEST_HOST_HOLD_PLAN2015_LED_INTERVAL_COW_WORK_TEST_HOST_HOLD'&&
    p.changedChildCount===8&&root.children.length===12&&
    moved2F.every(i=>root.children.includes(i))&&moved1F.every(i=>!root.children.includes(i))&&
    eq(root.children.slice(-2),[12169,12170])&&
    eq(root.extras?.new2FWCNodes,[12169,12170])&&root.extras?.noDuplicateWC===true;
}

// Accepts only authenticated source metadata; this is not a production-viewer test.
export function isC80Succ455LedSpacingSourceScene(gltf,authenticatedGlbSha256,index,floor=null){
  const sp=C80_SUCC455_SCENES[index],s=gltf?.scenes?.[index],nodes=gltf?.nodes;
  if(authenticatedGlbSha256!==C80_SUCC455_GLB_SHA256||!sp||!s||
     (floor!==null&&floor!==sp.floor)||gltf?.scene!==292||
     gltf?.scenes?.length!==469||nodes?.length!==12195||gltf?.meshes?.length!==4577||
     gltf?.asset?.extras?.ModelStage!=='WORK_TEST'||
     gltf?.asset?.extras?.current!==false||gltf?.asset?.extras?.asBuilt!==false||
     gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
     s.name!==sp.name||!Array.isArray(s.nodes)||s.nodes.length!==sp.rootCount||
     new Set(s.nodes).size!==sp.rootCount||
     s.nodes.some(n=>!Number.isInteger(n)||n<0||n>=nodes.length)||
     c80Succ455RootFnv32(s.nodes)!==sp.rootFnv||
     s.extras?.floor!==sp.floor||s.extras?.stage!=='WORK_TEST_HOST_HOLD'||
     s.extras?.sourceLinksBindingVerified!==false||
     s.extras?.sourceSceneIndex!==sp.sourceSceneIndex||
     s.extras?.asBuilt!==false||s.extras?.humanReviewApproved!==false||
     s.extras?.productionWebGLVerified!==false||
     (sp.floor!=='1F'&&(s.extras?.sourceLinks!=='NOT_BOUND'||
       s.extras?.publishState!=='HOST_HOLD'||s.extras?.humanReview!=='NOT_RUN'))||
     !movedNodeMatch(nodes)||!rootMatch(nodes[12193],'1F')||!rootMatch(nodes[12194],'2F'))return false;
  const p=s.extras?.plan2015SpacingCorrection;
  const has1F=sp.floor!=='2F',has2F=sp.floor!=='1F';
  if(p?.stage!=='WORK_TEST_HOST_HOLD'||p.ownerConfirmedUnchangedSince2015!==true||
     p.sourceDocId!==C80_SUCC455_PLAN2015_PDF_DRIVE_ID||
     p.sourceOriginalModelId!==C80_SUCC455_PARENT_ZIP_DRIVE_ID||
     p.sourceOriginalModelGLBSha256!==C80_SUCC455_PARENT_GLB_SHA256||
     p.parentScene!==sp.parentScene||p.spacing2Fmm!==1000||
     p.spacing1Fmm!==1015||p['1FgridAllThreeRows']!==true||
     p.changedRoot1F!==has1F||p.changedRoot2F!==has2F||
     p.root1F!==(has1F?12193:null)||p.root2F!==(has2F?12194:null)||
     p.sourceLinksBound!==false||p.productionWebGL!=='NOT_RUN'||
     p.humanReview!=='NOT_RUN'||p.CURRENT!==false||p.asBuilt!==false||
     s.nodes.includes(12193)!==has1F||s.nodes.includes(12194)!==has2F||
     s.nodes.includes(12171)||s.nodes.includes(12172))return false;
  return true;
}
export function resolveC80Succ455LedSpacingSceneIndex(authenticatedSha,parentScene,floor){
  if(authenticatedSha!==C80_SUCC455_GLB_SHA256||!Number.isInteger(parentScene)||
     !['1F','2F','BOTH'].includes(floor))return null;
  const matching=Object.entries(C80_SUCC455_SCENES).filter(([,s])=>
    s.parentScene===parentScene&&s.floor===floor);
  return matching.length===1?Number(matching[0][0]):null;
}
export function c80Succ455LedSpacingSourceReceipt(gltf,sha,index){
  const exactSource=isC80Succ455LedSpacingSourceScene(gltf,sha,index);
  return Object.freeze({exactSource,sourceLinksBound:false,publishAllowed:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
}
