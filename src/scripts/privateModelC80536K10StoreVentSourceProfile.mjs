/**
 * C80 536 K10 indoor-storage exhaust vent: exact SOURCE_ONLY receipt.
 * The SHA argument must come from a separately authenticated GLB-byte hash.
 * This module does not authorize sourceLinks, CURRENT, production or publishing.
 */
export const C80_536_K10_GLB_SHA256 = '8aa2bce9276c23fad4a122174acb33f99d47104a10ca6d1e86f67f3f60eedd05';
export const C80_536_K10_GLB_BYTES = 55663680;
export const C80_536_K10_ZIP_SHA256 = '9f00ca090306f3fbb5aff2c6b05fb622e508a9a6a53736110f88d41fce0901a1';
export const C80_536_K10_ZIP_DRIVE_ID = '1HsbK-wFOk-PBeymBdCWB-XegGzBZZGST';
export const C80_536_K10_PARENT_GLB_SHA256 = '1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_536_K10_PHOTO_DRIVE_ID = '18aEvLLW5WoxSxb4TLtwIN2UP-9rpUSQz';
export const C80_536_K10_OWNER_PDF_DRIVE_ID = '1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT';

const entries = [
 [530,524,'1F',295,'521f7aa0','ef21913f',true],
 [531,525,'2F',190,'b6394bd0','b6394bd0',false],
 [532,526,'BOTH',478,'4c904bac','6847aefb',true],
 [533,527,'BOTH',478,'8fa21614','9d3081c3',true],
 [534,528,'BOTH',478,'5a783936','c0e4d46d',true],
 [535,529,'BOTH',478,'747f8e57','2b0e6572',true],
];
export const C80_536_K10_SCENES = Object.freeze(Object.fromEntries(entries.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,ventActive])=>
 [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,ventActive})]
)));
const same = (a,b) => Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const near = (x,y) => typeof x==='number'&&Number.isFinite(x)&&Math.abs(x-y)<1e-6;
const fnv = ids => {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const id of ids){
  if(!Number.isInteger(id)||id<0)return null;
  h=Math.imul(h^id,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
};
const graph = (nodes,roots) => {
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const visited=new Set(),stack=[...roots];
 while(stack.length){
  const i=stack.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length||!nodes[i])return null;
  if(visited.has(i))continue;
  visited.add(i);
  const children=nodes[i].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)stack.push(...children);
 }
 return visited;
};

/** Visible parts are reused geometry, not an approved physical vent model. */
export function isC80536K10VisibleAssembly(json){
 const ns=json?.nodes,root=ns?.[12255],plate=ns?.[12256],core=ns?.[12257];
 const r=root?.extras,p=plate?.extras,c=core?.extras;
 if(root?.name!=='K10_OWNER20261115_D1F_INDOOR_STORAGE_EXHAUST_VISIBLE_ONLY_OPTIN_ROOT_WORK_TEST_HOST_HOLD'||
  !same(root.children,[12256,12257])||r?.modelStage!=='WORK_TEST_HOST_HOLD'||
  r?.systemLayer!=='ILMANVAIHTO'||r?.m5System!=='IV'||
  r?.sourceOriginalGLBSHA256!==C80_536_K10_PARENT_GLB_SHA256||
  !same(r?.sourceEvidenceDriveIds,[C80_536_K10_PHOTO_DRIVE_ID,C80_536_K10_OWNER_PDF_DRIVE_ID])||
  !near(r?.ownerPoint20261115G1?.x,0.356)||!near(r?.ownerPoint20261115G1?.y,8.79)||
  !near(r?.ownerPoint20261115G1?.z,2.362)||r?.hostNodeIndex2015!==7999||
  r?.hostMeshIndex!==2449||!near(r?.hostPlaneGLBz,-8.79)||
  r?.hostConfidence!=='OWNER_POINT_ON_REAL_WALL_TRIANGLE'||
  r?.deviceExactSKUVerified!==false||r?.diameterMeasured!==false||
  r?.ductBehindWallVerified!==false||r?.connectedToE220SVerified!==false||
  r?.airflowVerified!==false||r?.maintenanceClearanceVerified!==false||
  r?.physicalAsBuilt!==false||r?.current!==false||r?.asBuilt!==false||
  r?.sourceLinksRebindRequired!==true)return false;
 for(const [node,extras,mesh,source] of [[plate,p,460,12093],[core,c,461,12094]]){
  if(node?.mesh!==mesh||extras?.sourceMeshIndex!==mesh||
   extras?.sourceNodeIndex!==source||extras?.sourceReusedPhysicalDevice!==false||
   extras?.ductOrNeckModeled!==false||extras?.ownerSourceDriveId!==C80_536_K10_PHOTO_DRIVE_ID||
   extras?.current!==false||extras?.asBuilt!==false||
   extras?.sourceLinksRebindRequired!==true||
   !Array.isArray(node.matrix)||node.matrix.length!==16)return false;
 }
 return true;
}

export function isC80536K10SourceScene(json,sha,id,floor){
 const spec=C80_536_K10_SCENES[id],a=json?.asset?.extras;
 if(sha!==C80_536_K10_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||
  a?.HUMAN_REVIEW!=='NOT_RUN'||json.scenes?.length!==536||json.nodes?.length!==12258||
  json.meshes?.length!==4621||json.materials?.length!==744||
  json.accessors?.length!==10408||json.bufferViews?.length!==10412)return false;
 const current=json.scenes[id],parent=json.scenes[spec.parent];
 const roots=current?.nodes,prior=parent?.nodes,e=current?.extras;
 if(current?.name!==`K10_INDOOR_STORAGE_EXHAUST_VISIBLE_ONLY_20261115__scene${id}_${spec.floor}${spec.floor==='2F'?'_UNCHANGED':''}`||
  roots?.length!==spec.rootCount||prior?.length!==spec.rootCount-(spec.ventActive?1:0)||
  new Set(roots).size!==roots.length||
  fnv(roots)!==spec.rootHash||fnv(prior)!==spec.parentRootHash||
  e?.modelStage!=='WORK_TEST_HOST_HOLD'||e?.parentSourceSceneIndex!==spec.parent||
  e?.sourceGLBSHA256!==C80_536_K10_PARENT_GLB_SHA256||
  e?.ownerK10Added!==spec.ventActive||e?.current!==false||e?.asBuilt!==false||
  e?.sourceLinksRebindRequired!==true)return false;
 if(spec.ventActive){
  if(!same(roots,[...prior,12255])||!isC80536K10VisibleAssembly(json))return false;
 } else if(!same(roots,prior)||roots.includes(12255))return false;
 const active=graph(json.nodes,roots);
 if(!active||active.has(12255)!==spec.ventActive||
   active.has(12256)!==spec.ventActive||active.has(12257)!==spec.ventActive)return false;
 // The pre-existing wardrobe exhaust is not reclassified as storage exhaust.
 if(spec.ventActive&&(!active.has(12092)||!active.has(12093)||!active.has(12094)))return false;
 return true;
}
export function c80536K10SourceReceipt(json,sha,id,floor){
 return Object.freeze({
  exactSource:isC80536K10SourceScene(json,sha,id,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,sourceLinksBound:false,
  publishAllowed:false,current:false,asBuilt:false,physicalVentSkuVerified:false,
  physicalDuctVerified:false,airflowVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',
 });
}
