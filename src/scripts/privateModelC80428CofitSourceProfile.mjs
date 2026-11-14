// Source-only authenticated C80 SUCC428 receiver. Never mount, publish, or rebind sourceLinks here.
// Only the full, independently SHA256-verified GLB bytes permit selecting internal glTF scenes.
// No CURRENT/as-built, production WebGL or HUMAN_REVIEW approval is implied.
export const C80_428_GLB_SHA256='b55c10cf1a5a557c6ace8932254ae7c614abb65e515998bd2c2d41f3037240de';
export const C80_428_GLB_BYTES=54503108;
export const C80_428_ZIP_SHA256='80b7f2e5460be309092ee9088eaf8ff8c6144bedc1b774bf58b0331f34eacc7e';
export const C80_428_ZIP_DRIVE_ID='1GkQtgtj_ikweQqgRTOTFFH0xMosuu1OA';
export const C80_428_PARENT_GLB_SHA256='720c7d2cf65c15fb196c44454eda2f71b07eab1c0f52b106a2099ac818a4fd9a';
export const C80_428_PA2_GLB_SHA256='49022c55d50cfc80f5a20382115e74bc92e7f31049eea485b93424493347eb7e';
export const C80_428_RED_GLB_SHA256='d6cdcdbb9e5900eef90aaf4681511d8be55d5ae4e087fa3bc43afe65c7186b1b';
const rows=[
 ['1F','CLOSED',false,288,'c66bc1bd','6918dbd0',[12145,12152]],
 ['2F','CLOSED',false,181,'7c325376','f8ef8caa',[12144,12157]],
 ['BOTH','CLOSED',false,463,'8738308b','3e2325a3',[12144,12145,12155,12157]],
 ['2F','ONE_OPEN',false,181,'a9c20a20','e2aa983c',[12144,12157]],
 ['BOTH','ONE_OPEN',false,463,'e429ac51','b3ee1711',[12144,12145,12155,12157]],
 ['2F','STACKED',false,181,'8a8c0fde','2d009f82',[12144,12157]],
 ['BOTH','STACKED',false,463,'545d6141','0d62ee19',[12144,12145,12155,12157]],
 ['1F','CLOSED',true,288,'0cea537c','235684c5',[12145,12152]],
 ['BOTH','CLOSED',true,463,'af6c7a12','2b5ea272',[12144,12145,12155,12157]]
];
export const C80_428_SCENES=Object.freeze(Object.fromEntries(rows.map((r,i)=>{
 const index=419+i,parent=410+i;
 return [index,Object.freeze({
  floor:r[0],glazing:r[1],cutaway:r[2],count:r[3],rootFnv:r[4],parentRootFnv:r[5],
  roots:Object.freeze(r[6]),parentScene:parent,
  name:'C80_SUCC419_PA2_RED_WALLFLOOR_'+r[0]+'_FROM_'+parent+'_WORK_TEST_HOST_HOLD',
  parentName:'C80_410_V84FLOOR_COW_FROM_'+(401+i)+'_WORK_TEST_HOST_HOLD'
 })];
})));
export function c80428RootFnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){if(!Number.isInteger(n)||n<0)return null;h=Math.imul(h^n,16777619)>>>0;}
 return h.toString(16).padStart(8,'0');
}
const children={
 12152:[12150,12151],12155:[12153,12154],12157:[12156,12112],
 12150:[12025,12026,12027,12028,12029,12146,12031,12138,12033,12034,12035],
 12151:[12037,12038,12039,12147],
 12153:[12058,12059,12060,12061,12062,12148,12064,12139,12066,12067,12068],
 12154:[12070,12071,12072,12149]
};
const meshes={12144:4570,12145:4571,12146:4572,12147:4573,12148:4572,12149:4573,12156:4574};
export function isC80428SourceScene(gltf,authenticatedSha,index,floor=null,glazing=null,cutaway=null){
 const spec=C80_428_SCENES[index],scene=gltf?.scenes?.[index];
 if(authenticatedSha!==C80_428_GLB_SHA256||!spec||!scene||
    (floor!==null&&floor!==spec.floor)||(glazing!==null&&glazing!==spec.glazing)||
    (cutaway!==null&&cutaway!==spec.cutaway)||
    gltf?.scene!==292||gltf?.scenes?.length!==428||gltf?.nodes?.length!==12158||
    gltf?.meshes?.length!==4575||gltf?.accessors?.length!==10242||
    gltf?.bufferViews?.length!==10244||
    gltf?.asset?.extras?.ModelStage!=='WORK_TEST'||
    gltf?.asset?.extras?.current!==false||gltf?.asset?.extras?.asBuilt!==false||
    gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    scene.name!==spec.name||!Array.isArray(scene.nodes)||scene.nodes.length!==spec.count||
    new Set(scene.nodes).size!==spec.count||
    scene.nodes.some(n=>!Number.isInteger(n)||n<0||n>=12158)||
    c80428RootFnv32(scene.nodes)!==spec.rootFnv)return false;
 const x=scene.extras;
 if(x?.stage!=='WORK_TEST_HOST_HOLD'||x.floor!==spec.floor||
    x.sourceSceneIndex!==spec.parentScene||
    x.sourceGlbSHA256!==C80_428_PARENT_GLB_SHA256||
    x.PA2DonorGlbSHA256!==C80_428_PA2_GLB_SHA256||
    x.RedDonorGlbSHA256!==C80_428_RED_GLB_SHA256||
    x.sourceLinksBindingVerified!==false||x.physicalHiddenRouteVerified!==false||
    x.productionWebGLVerified!==false||x.humanReviewApproved!==false||
    x.asBuilt!==false||x.rejectedHigh3Excluded!==true)return false;
 const p=gltf.scenes[spec.parentScene];
 if(p?.name!==spec.parentName||!Array.isArray(p.nodes)||
    p.nodes.length!==spec.count||c80428RootFnv32(p.nodes)!==spec.parentRootFnv)return false;
 const active=scene.nodes.filter(n=>n>=12144);
 if(active.length!==spec.roots.length||
    active.some(n=>!spec.roots.includes(n))||
    spec.roots.some(n=>!scene.nodes.includes(n)))return false;
 if([12141,12143,11829,11908,11912,12032,12065].some(n=>scene.nodes.includes(n)))return false;
 for(const [n,m] of Object.entries(meshes))if(gltf.nodes[Number(n)]?.mesh!==m)return false;
 for(const [n,kids] of Object.entries(children))
    if(JSON.stringify(gltf.nodes[Number(n)]?.children)!==JSON.stringify(kids))return false;
 if([12152,12155,12156,12157].some(n=>
    gltf.nodes[n]?.extras?.sourceLinksBindingVerified!==false))return false;
 return true;
}
// This only resolves an index; source authenticity and scene validation remain mandatory.
export function resolveC80428SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
 if(sha!==C80_428_GLB_SHA256||!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||typeof cutaway!=='boolean')return null;
 const a=Object.entries(C80_428_SCENES).filter(([,s])=>
    s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
 return a.length===1?Number(a[0][0]):null;
}
