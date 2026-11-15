/**
 * C80 536 K12 photo/2015-plan wetroom tiles, SOURCE_ONLY.
 * SHA must be computed over the ORIGINAL complete GLB before calling.
 * A correct source receipt NEVER grants sourceLinks, WebGL, current/as-built,
 * physical installation, or permission to publish.
 */
export const C80_536_K12_GLB_SHA256='944d2972baa171c9d402283c21a53ec06189468edbf34b630bf4ced198502a0a';
export const C80_536_K12_GLB_BYTES=55670424;
export const C80_536_K12_ZIP_SHA256='65495ea84b528e4f54d1ad065f05a34ea0492828276ae552b8d9a3247777a8b0';
export const C80_536_K12_ZIP_DRIVE_ID='1JjbWUBS7iMQnkUkgtLYrTHBD5KvbxS4m';
export const C80_536_K12_PARENT_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_536_K12_PLAN_DRIVE_ID='1-OxwgtepDX6wiJZCSPzPbnr0Up6PFDHrVE4TWjRplxY';
// scene, inherited parent scene, 1F/2F/BOTH, root count, new/parent FNV, tiles active
const data=[
 [530,524,'1F',294,'e57dc58b','ef21913f',true],
 [531,525,'2F',190,'b6394bd0','b6394bd0',false],
 [532,526,'BOTH',477,'12bbfe1f','6847aefb',true],
 [533,527,'BOTH',477,'5f35087f','9d3081c3',true],
 [534,528,'BOTH',477,'40906b71','c0e4d46d',true],
 [535,529,'BOTH',477,'607e1c76','2b0e6572',true],
];
export const C80_536_K12_SCENES=Object.freeze(Object.fromEntries(data.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,tilesActive])=>
 [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,tilesActive})]
)));
export function c80536K12Fnv32(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
function reachable(nodes,roots){
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const index=todo.pop();
  if(!Number.isInteger(index)||index<0||index>=nodes.length||!nodes[index])return null;
  if(seen.has(index))continue;
  seen.add(index);
  if(nodes[index].children!==undefined){
   if(!Array.isArray(nodes[index].children))return null;
   todo.push(...nodes[index].children);
  }
 }
 return seen;
}
export function isC80536K12SourceScene(json,wholeGlbSha256,sceneIndex,floor){
 const p=C80_536_K12_SCENES[sceneIndex];
 if(!p||wholeGlbSha256!==C80_536_K12_GLB_SHA256||
  (floor!==undefined&&floor!==p.floor)||json?.scene!==292||
  json.asset?.extras?.ModelStage!=='WORK_TEST'||json.asset.extras.current!==false||
  json.asset.extras.asBuilt!==false||json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
  json.scenes?.length!==536||json.nodes?.length!==12258||
  json.meshes?.length!==4623||json.materials?.length!==746||
  json.accessors?.length!==10410||json.bufferViews?.length!==10416)return false;
 const s=json.scenes[sceneIndex],parent=json.scenes[p.parent],e=s?.extras;
 const r=s?.nodes,old=parent?.nodes;
 if(s?.name!==`C80_536_K12_WETROOM_SAUNA_TILE100_FROM_SOURCE_SCENE_${p.parent}_WORK_TEST_HOST_HOLD`||
  !Array.isArray(r)||!Array.isArray(old)||r.length!==p.rootCount||
  old.length!==p.rootCount||c80536K12Fnv32(r)!==p.rootHash||
  c80536K12Fnv32(old)!==p.parentRootHash||new Set(r).size!==r.length||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.WORK_TEST!==true||
  e?.sourceGLBSHA256!==C80_536_K12_PARENT_GLB_SHA256||
  e?.sourceScene!==p.parent||e?.sourceRootNode!==11613||
  e?.newRootNode!==(p.tilesActive?12257:null)||
  e?.tileVisualUpdateActive!==p.tilesActive||e?.tilePitchM!==0.1||
  e?.KPHPhotoWorkAssumption!==true||e?.saunaTile2015ProductListNot2026AsBuilt!==true||
  e?.sourceLinksBound!==false||e?.current!==false||e?.asBuilt!==false||
  e?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const expected=old.map(x=>x===11613&&p.tilesActive?12257:x);
 if(!eq(r,expected)||p.tilesActive&&old.filter(x=>x===11613).length!==1)return false;
 const newRoot=json.nodes[12257],oldRoot=json.nodes[11613];
 const nr=newRoot?.extras;
 if(newRoot?.name!=='K12_WETROOM_SAUNA_TILE100_SOURCE_EXACT_COW_FROM11613_WORK_TEST_HOST_HOLD'||
  !eq(newRoot.translation,[6.53,0,0])||!eq(newRoot.scale,[-1,1,1])||
  nr?.stage!=='WORK_TEST_HOST_HOLD'||nr?.WORK_TEST!==true||
  nr?.sourceParentGLBSHA256!==C80_536_K12_PARENT_GLB_SHA256||
  nr?.sourceNodeIndex!==11613||!eq(nr.replacedFloorNodes,[1714,1715])||
  !eq(nr.removedOldGroutNodes,[1724,1725,6613])||
  nr?.physicalRoofOrDrainOrSlopeChange!==false||nr?.sourceLinksBound!==false||
  nr?.current!==false||nr?.asBuilt!==false||nr?.HUMAN_REVIEW!=='NOT_RUN'||
  !Array.isArray(oldRoot?.children)||!Array.isArray(newRoot.children))return false;
 const replacement=oldRoot.children.filter(id=>![1724,1725,6613].includes(id))
  .map(id=>id===1714?12255:id===1715?12256:id);
 if(!eq(newRoot.children,replacement))return false;
 for(const [id,sourceNode,sourceMesh,mesh,evidence] of [
  [12255,1714,818,4621,'PHOTO_WORK_ASSUMPTION'],
  [12256,1715,819,4622,'2015_PRODUCT_LIST_PLAN_NOT_AS_BUILT']]){
  const n=json.nodes[id],x=n?.extras;
  if(n?.mesh!==mesh||x?.sourceNodeIndex!==sourceNode||
   x?.sourceMeshIndex!==sourceMesh||x?.sourceParentGLBSHA256!==C80_536_K12_PARENT_GLB_SHA256||
   x?.sourcePlanDriveId!==C80_536_K12_PLAN_DRIVE_ID||x?.sourceTileEvidence!==evidence||
   x?.tileNominalM!==0.1||x?.groutMeasured!==false||
   x?.floorSlopeChanged!==false||x?.drainOpeningGeometryChanged!==false||
   x?.floorSurfaceSourceExact!==true||x?.physicalTileInstallationVerified!==false||
   x?.sourceLinksBound!==false||x?.current!==false||x?.asBuilt!==false||
   x?.HUMAN_REVIEW!=='NOT_RUN')return false;
 }
 const seen=reachable(json.nodes,r);
 if(!seen)return false;
 if(p.tilesActive){
  if(![12257,12255,12256].every(id=>seen.has(id))||
   [11613,1714,1715,1724,1725,6613].some(id=>seen.has(id)))return false;
 }else if([12257,12255,12256].some(id=>seen.has(id)))return false;
 return true;
}
export function c80536K12Receipt(json,sha,scene,floor){
 return Object.freeze({
  exactSource:isC80536K12SourceScene(json,sha,scene,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  photoWorkAssumption:true,saunaProductList2015Only:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalTileInstallationVerified:false,groutMeasured:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
