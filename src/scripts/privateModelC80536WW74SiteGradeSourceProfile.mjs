/**
 * Authenticated SOURCE_ONLY C80 536 historical site sewer-grade model.
 * The caller provides SHA256 computed from the complete GLB. This does
 * NOT grant sourceLinks, physical construction approval, or publication.
 */
import {c80530Fnv32} from './privateModelC80530V27SourceProfile.mjs';
export const C80_536_WW74_GLB_SHA256='726d91ba2dda846af6d672c6a2d2edd2b031e50aa50035a991bb61e35c29a041';
export const C80_536_WW74_GLB_BYTES=55668584;
export const C80_536_WW74_ZIP_SHA256='fce80ec054ec105a59f1e395857204e14c91a2c7757010392077105cddc0e084';
export const C80_536_WW74_ZIP_DRIVE_ID='1lv2GPTEfZcpCpCWFUuLLwkyt_Su8OQbV';
export const C80_536_WW74_PARENT_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_536_WW74_1974_PLAN_DRIVE_ID='1_RzfxbLM-iz9SlkOwM24HJsJMuX4WmFX';
// glTF scene index, parent index, floor, rootCount, root FNV, parent FNV, new sewer.
const rows=[
 [530,524,'1F',294,'df39b592','ef21913f',true],
 [531,525,'2F',190,'b6394bd0','b6394bd0',false],
 [532,526,'BOTH',477,'89038706','6847aefb',true],
 [533,527,'BOTH',477,'4cd077ae','9d3081c3',true],
 [534,528,'BOTH',477,'c87c8488','c0e4d46d',true],
 [535,529,'BOTH',477,'f9ad462f','2b0e6572',true],
];
export const C80_536_WW74_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,designRoute])=>[
  scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,designRoute}),
 ])));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((n,i)=>n===b[i]);
const near=(v,n)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v-n)<1e-6;
const vec=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>near(v,b[i]));
const reach=(nodes,roots)=>{
 const visited=new Set(),todo=[...roots];
 while(todo.length){
  const id=todo.pop();
  if(!Number.isInteger(id)||id<0||id>=nodes.length)return null;
  if(visited.has(id))continue;
  const node=nodes[id];
  if(!node)return null;
  visited.add(id);
  if(node.children!==undefined){
   if(!Array.isArray(node.children))return null;
   todo.push(...node.children);
  }
 }
 return visited;
};
/** The 2.4 m drop is a WORK_ASSUMPTION, never a verified well. */
export function isC80536WW74GradeEvidence(json){
 const oldRoot=json?.nodes?.[12228],oldPipe=json?.nodes?.[12227];
 const root=json?.nodes?.[12257],pipe=json?.nodes?.[12255],drop=json?.nodes?.[12256];
 const r=root?.extras,p=pipe?.extras,d=drop?.extras;
 if(oldRoot?.name!=='M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD'||
  !eq(oldRoot.children,[12225,12226,12227])||
  oldPipe?.mesh!==4603||!oldPipe.name?.startsWith('WW74_SITE150_SOURCE_EXACT_TO_STREET_DRAIN_')||
  root?.name!=='M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD'||
  !eq(root.children,[12225,12226,12255,12256])||
  r?.sourceParentNode!==12228||r?.oldSiteNode12227ExcludedFromNewScenes!==true||
  r?.oldRootStillExists!==true||r?.openEnds!==1||
  r?.m5System!=='VIEMARI'||r?.stage!=='WORK_TEST_HOST_HOLD'||
  r?.sourceGLBSHA256!==C80_536_WW74_PARENT_GLB_SHA256||
  r?.current!==false||r?.asBuilt!==false||r?.sourceLinksBound!==false||
  r?.physicalRouteVerified!==false||
  pipe?.name!=='WW74_SITE150_1974_1815_TO_1790_TRANSLATED_WORK_TEST_HOST_HOLD'||
  pipe.mesh!==4603||!vec(pipe.translation,[0,-2.4,0])||
  p?.sourceNode!==12227||p?.sourceMesh!==4603||
  p?.sourceGeometryPositionIndexExact!==true||
  p?.sourceGLBSHA256!==C80_536_WW74_PARENT_GLB_SHA256||
  p?.transformOnlyVerticalShiftM!==-2.4||p?.referenceLevelLocalZ0M!==21.75||
  p?.crossSourceDatum!=='UNVERIFIED'||
  p?.['1974UpstreamDesignInvertM']!==18.15||p?.['1974StreetDesignInvertM']!==17.9||
  p?.streetConnection!=='NOT_PHYSICALLY_VERIFIED'||
  p?.workAssumption!==true||p?.m5System!=='VIEMARI'||
  p?.current!==false||p?.asBuilt!==false||p?.sourceLinksBound!==false||
  p?.physicalRouteVerified!==false||
  drop?.name!=='WW74_BUILDING_END_VERTICAL_DROP_2400MM_WORK_ASSUMPTION_NO_WELL_HOST'||
  drop.mesh!==4621||d?.sourceNode!==12226||d?.centerlineDropM!==2.4||
  d?.sourceGLBSHA256!==C80_536_WW74_PARENT_GLB_SHA256||
  d?.physicalWellOrDropChamber!=='NOT_VERIFIED'||
  d?.workAssumption!==true||d?.m5System!=='VIEMARI'||
  d?.current!==false||d?.asBuilt!==false||d?.sourceLinksBound!==false)return false;
 return true;
}
export function isC80536WW74SourceScene(json,sha,id,floor){
 const spec=C80_536_WW74_SCENES[id];
 if(sha!==C80_536_WW74_GLB_SHA256||!spec||
  (floor!==undefined&&floor!==spec.floor)||
  json?.scene!==292||json.asset?.extras?.ModelStage!=='WORK_TEST'||
  json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
  json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
  json.scenes?.length!==536||json.nodes?.length!==12258||
  json.meshes?.length!==4622||json.materials?.length!==744||
  json.accessors?.length!==10411||json.bufferViews?.length!==10415)return false;
 const scene=json.scenes[id],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!=='C80_536_WW74_SITE150_1974_GRADE_FROM_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD'||
  !Array.isArray(roots)||!Array.isArray(prior)||
  roots.length!==spec.rootCount||prior.length!==spec.rootCount||
  c80530Fnv32(roots)!==spec.rootHash||c80530Fnv32(prior)!==spec.parentRootHash||
  new Set(roots).size!==roots.length||
  e?.stage!=='WORK_TEST_HOST_HOLD'||e?.WORK_TEST!==true||
  e?.sourceScene!==spec.parent||e?.sourceGLBSHA256!==C80_536_WW74_PARENT_GLB_SHA256||
  e?.designInvertSourceDriveId!==C80_536_WW74_1974_PLAN_DRIVE_ID||
  e?.terrainNotModified!==true||e?.physicalStreetConnectionVerified!==false||
  e?.sourceLinksBound!==false||e?.HUMAN_REVIEW!=='NOT_RUN'||
  e?.newSewerInThisScene!==spec.designRoute)return false;
 if(spec.designRoute){
  const changes=roots.flatMap((n,i)=>n===prior[i]?[]:[[prior[i],n]]);
  if(changes.length!==1||!eq(changes[0],[12228,12257])||
   !isC80536WW74GradeEvidence(json))return false;
 }else if(!eq(roots,prior)||roots.includes(12257))return false;
 const seen=reach(json.nodes,roots);
 if(!seen||!seen.has(12251)||seen.has(12227)||
  (spec.designRoute
   ? ![12257,12255,12256].every(n=>seen.has(n))||seen.has(12228)
   : [12257,12255,12256].some(n=>seen.has(n))))return false;
 return true;
}
export function c80536WW74Receipt(json,sha,id,floor){
 return Object.freeze({
  exactSource:isC80536WW74SourceScene(json,sha,id,floor),
  stage:'WORK_TEST_HOST_HOLD',historicalDesignOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalWellVerified:false,streetTieInVerified:false,
  crossSourceVerticalDatumVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
