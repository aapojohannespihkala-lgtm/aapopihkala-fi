/**
 * Source-only receipt for the PRIMARY C80 536 WP-D K05 ROOM3 handle correction.
 * The original model is read-only. This is NOT a sourceLinks registration, a
 * viewer mount, a physical as-built approval or a publication permission.
 * sha256 must be computed over the COMPLETE original GLB by the caller.
 */
export const C80_K05_PRIMARY=Object.freeze({
 zipDriveId:'1kjUpRz7Jf4fclyQawNiw6hf3ny3KF1X8',
 zipSha256:'daf2528de3522ba708232f87c7af8fdb68c31b7340763d50d50d51e7050fa71b',
 glbSha256:'fe385142516a82d179a4b72f0f34b65521d6734d9908c3ef86bd7630108ed0e6',
 glbBytes:55664796,
 original530GlbSha256:'1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e',
 source530ZipDriveId:'1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s',
 stage:'WORK_TEST_HOST_HOLD',
});
// The metadata-different sibling is not an interchangeable SHA alias.
export const C80_K05_SIBLING_GLB_SHA256=
 '61538f95f06a7405592c5d1949437c626eef10dfc5a0c25112e454a09591745d';
const rows=[
 [530,524,'1F',294,'ef21913f',false],
 [531,525,'2F',188,'b708650b',true],
 [532,526,'BOTH',475,'17026826',true],
 [533,527,'BOTH',475,'5d6d4b82',true],
 [534,528,'BOTH',475,'bc3198bc',true],
 [535,529,'BOTH',475,'30fea9ff',true],
];
export const C80_K05_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([index,parent,floor,roots,rootFnv,hasDoor])=>
 [index,Object.freeze({index,parent,floor,roots,rootFnv,hasDoor})]
)));
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.every((v,i)=>v===b[i]);
export function c80536K05Fnv32(ids){
 if(!Array.isArray(ids)||ids.some(n=>!Number.isInteger(n)||n<0))return null;
 let h=2166136261;
 for(const id of ids)h=Math.imul(h^id,16777619)>>>0;
 return h.toString(16).padStart(8,'0');
}
export function c80536K05RootReplacement(original,current,hasDoor){
 if(!Array.isArray(original)||new Set(original).size!==original.length||
    !Array.isArray(current)||new Set(current).size!==current.length)return false;
 if(!hasDoor)return equal(original,current);
 if(original.filter(v=>v===9195).length!==1||
    original.filter(v=>v===9196).length!==1||
    !original.includes(12222)||!original.includes(9197)||!original.includes(9198))return false;
 return equal(current,original.filter(v=>v!==9195&&v!==9196));
}
function reachable(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const id=todo.pop();
  if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
  if(seen.has(id))continue;
  seen.add(id);
  const children=nodes[id].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)todo.push(...children);
 }
 return seen;
}
export function isC80536K05PrimarySourceScene(json,glbSha256,index,floor){
 const spec=C80_K05_SCENES[index],asset=json?.asset?.extras;
 if(glbSha256!==C80_K05_PRIMARY.glbSha256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.scenes?.length!==536||
    json?.nodes?.length!==12255||json?.meshes?.length!==4621||
    json?.materials?.length!==744||json?.accessors?.length!==10408||
    json?.bufferViews?.length!==10412||
    asset?.ModelStage!=='WORK_TEST'||asset?.asBuilt!==false||
    asset?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const scene=json.scenes[index],prior=json.scenes[spec.parent],e=scene?.extras;
 if(scene?.name!=='C80_536_OWNER_WPD_K05_ROOM3_SINGLE_PHOTO_HANDLE_FROM_530_SCENE_'+
    spec.parent+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(scene?.nodes)||scene.nodes.length!==spec.roots||
    c80536K05Fnv32(scene.nodes)!==spec.rootFnv||
    !c80536K05RootReplacement(prior?.nodes,scene.nodes,spec.hasDoor)||
    e?.sourceGLBSHA256!==C80_K05_PRIMARY.original530GlbSha256||
    e?.sourceZIPDriveId!==C80_K05_PRIMARY.source530ZipDriveId||
    e?.stage!=='WORK_TEST_HOST_HOLD'||
    e?.sourceScene!==spec.parent||e?.targetGlTFSceneIndex!==index||
    e?.floor!==spec.floor||e?.WORK_TEST!==true||e?.HOST_HOLD!==true||
    e?.onlyLegacyHandleVisibilityChanged!==true||
    e?.sceneDerivedFromOriginalWithoutChangingGeometry!==true||
    e?.photoWoodMaterialId!==731||e?.sourcePhotoWoodTextureIndex!==2||
    e?.woodColorChangeClaim!==false||e?.textureRenderVerified!==false||
    e?.sourceLinksBound!==false||e?.newSourceLinksBound!==false||
    e?.current!==false||e?.asBuilt!==false||e?.physicalDoorVerified!==false||
    e?.productionWebGLVerified!==false||
    !equal(e?.legacyHandleNodesExcluded,spec.hasDoor?[9195,9196]:[])||
    e?.photoDoorCOWRootRetained!==(spec.hasDoor?12222:null))return false;
 const live=reachable(json.nodes,scene.nodes);
 if(!live)return false;
 if(spec.hasDoor){
  if([9195,9196].some(id=>live.has(id))||
     ![9197,9198,12195,12207,12222].every(id=>live.has(id)))return false;
 }else if([12195,12207,12222].some(id=>live.has(id)))return false;
 return true;
}
export function c80536K05SourceReceipt(json,glbSha256,index,floor){
 return Object.freeze({
  exactSource:isC80536K05PrimarySourceScene(json,glbSha256,index,floor),
  primarySourceOnly:true,stage:'WORK_TEST_HOST_HOLD',
  viewerMounted:false,sourceLinksBound:false,publishAllowed:false,
  current:false,asBuilt:false,physicalHostVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
