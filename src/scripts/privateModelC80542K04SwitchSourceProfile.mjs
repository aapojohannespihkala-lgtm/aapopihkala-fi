/**
 * Exact original C80 542 WP-B K04 SW01..SW04 opt-in source receipt.
 * Source-only: no permission to publish, bind sourceLinks or claim as-built.
 * sha must be SHA256 of the complete ORIGINAL GLB bytes, not its ZIP.
 */
export const K04_GLB_SHA256 = '5a4c217cd486f6dd884bba4cd5d8cbb086a0a5841521b586d79be33d96a1fbdd';
export const K04_GLB_BYTES = 55769792;
export const K04_ZIP_SHA256 = '4ad4d09e109b3c80a7180b82aef5383bd6899b50d737f2f095b786f4a0574204';
export const K04_ZIP_DRIVE_ID = '1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c';
export const K04_PARENT_SHA256 = '852566ab8d2d7265ef78e5cc060201ca975ef79d04a6484d81ffa0b0dd21e882';
export const K04_PARENT_ZIP_ID = '1aTCGnm0f9QfZ3FMznYKcLYgUCStWEK-4';

// [scene, parent scene, scope, root count, root FNV, parent-root FNV, switches present]
const rows = [
  [536,530,'1F',294,'ef21913f','ef21913f',false],
  [537,531,'2F',190,'21e85048','66d0334a',true],
  [538,532,'BOTH',477,'6e6ab2f3','6c06fe5d',true],
  [539,533,'BOTH',477,'3acd707b','d88b92f1',true],
  [540,534,'BOTH',477,'e9b28665','d7b5397f',true],
  [541,535,'BOTH',477,'9f3d9cfa','024d25d0',true],
];
export const K04_SCENES = Object.freeze(Object.fromEntries(rows.map(
  ([scene,parent,floor,rootCount,rootHash,parentHash,hasSwitches]) =>
    [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentHash,hasSwitches})]
)));

export function k04Fnv32(ids) {
  if (!Array.isArray(ids) || ids.some(i => !Number.isInteger(i) || i<0)) return null;
  let h=2166136261;
  for(const i of ids) h = Math.imul(h ^ i,16777619) >>> 0;
  return h.toString(16).padStart(8,'0');
}
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.length===b.length && a.every((v,i)=>v===b[i]);
const xyzNear=(a,b)=>Array.isArray(a)&&a.length===3&&
  a.every((x,i)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x-b[i])<1e-6);

/** Existing 1F roots are untouched; 2F/BOTH replace 3 legacy switch roots only. */
export function isK04RootReplacement(roots,parent,hasSwitches) {
  if (!Array.isArray(roots) || !Array.isArray(parent)) return false;
  if (!hasSwitches) return equal(roots,parent) &&
    !roots.some(i=>i>=12257 && i<=12266);
  for (const id of [11830,11833,11836])
    if (parent.filter(i=>i===id).length!==1) return false;
  if (parent.some(id=>id>=12258 && id<=12266)) return false;
  const expected=parent.map(id=>id===11830?12260:id===11833?12263:id===11836?12266:id);
  return equal(roots,expected) && new Set(roots).size===roots.length;
}
function activeNodes(nodes,roots) {
  if (!Array.isArray(nodes)||!Array.isArray(roots)) return null;
  const found=new Set(), stack=[...roots];
  while (stack.length) {
    const id=stack.pop();
    if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
    if(found.has(id))continue;
    found.add(id);
    const children=nodes[id].children;
    if(children!==undefined && !Array.isArray(children))return null;
    if(children) stack.push(...children);
  }
  return found;
}

/** Pin actual clone node/mesh identity and keep the physical-host HOLD. */
export function isK04SwitchEvidence(json) {
  const nodes=json?.nodes;
  if(!Array.isArray(nodes)||nodes.length!==12267||
     !Array.isArray(json?.meshes)||json.meshes.length!==4621)return false;
  const sw04=nodes[12257];
  if(sw04?.name!=='K04_SW04_D2F_JAMB_WORK_TEST_HOST_ROOT' ||
     !equal(sw04.children,[12255,12256]) ||
     sw04.extras?.current!==false || sw04.extras?.asBuilt!==false ||
     sw04.extras?.physicalWallHost!=='HOLD_UNVERIFIED' ||
     sw04.extras?.physicalPositionVerified!==false ||
     sw04.extras?.productSkuVerified!==false ||
     sw04.extras?.sourceLinksBoundToNewGlbSha!==false)return false;
  const positions=[[5.41,3.85,-4.997],[5.9,3.85,-7.217],[5.097,3.85,-6.98]];
  for(let j=0;j<3;j++){
    const plateId=12258+j*3,rockerId=plateId+1,rootId=plateId+2;
    const plate=nodes[plateId],rocker=nodes[rockerId],root=nodes[rootId];
    const oldRoot=[11830,11833,11836][j];
    if(root?.name!=='K04_WALLHOST_D2F-SW-0'+(j+1)+'_ROOT_WORK_TEST_HOST_HOLD' ||
       !equal(root.children,[plateId,rockerId]) ||
       root.extras?.stableID!=='D2F-SW-0'+(j+1) ||
       root.extras?.sourceNodeId!==oldRoot ||
       root.extras?.stage!=='WORK_TEST_HOST_HOLD_NOT_ASBUILT' ||
       root.extras?.physicalWallHost!=='HOLD_UNVERIFIED' ||
       root.extras?.sourceLinksBoundToNewGLBSHA!==false ||
       root.extras?.physicalPositionVerified!==false ||
       root.extras?.productSkuVerified!==false ||
       root.extras?.current!==false || root.extras?.asBuilt!==false)return false;
    for(const [part,node,mesh,src] of [
      ['PLATE',plate,4495,oldRoot+1],['ROCKER',rocker,4496,oldRoot+2]
    ]){
      if(node?.name!=='K04_WALLHOST_D2F-SW-0'+(j+1)+'_'+part+'_SOURCE_MESH_COW_WORK_TEST' ||
         node.mesh!==mesh || !xyzNear(node.translation,positions[j]) ||
         node.extras?.sourceNodeId!==src ||
         node.extras?.sourceParentGLBSHA256!==K04_PARENT_SHA256 ||
         node.extras?.sourceParentDriveId!==K04_PARENT_ZIP_ID ||
         node.extras?.physicalPositionVerified!==false ||
         node.extras?.productSkuVerified!==false ||
         node.extras?.sourceLinksBoundToNewGLBSHA!==false ||
         node.extras?.current!==false ||node.extras?.asBuilt!==false)return false;
    }
  }
  return true;
}

/** Caller must calculate original-file SHA. This never approves a publication. */
export function isK04SwitchSourceScene(json,sha,sceneIndex,floor) {
  const s=K04_SCENES[sceneIndex],a=json?.asset?.extras;
  if(sha!==K04_GLB_SHA256 || !s ||
     (floor!==undefined && floor!==s.floor) ||
     json?.scene!==292 || json?.scenes?.length!==542 ||
     json?.nodes?.length!==12267 || json?.meshes?.length!==4621 ||
     json?.accessors?.length!==10408 || json?.bufferViews?.length!==10412 ||
     a?.ModelStage!=='WORK_TEST' || a?.current!==false ||
     a?.asBuilt!==false || a?.HUMAN_REVIEW!=='NOT_RUN' ||
     !isK04SwitchEvidence(json))return false;
  const row=json.scenes[sceneIndex],parent=json.scenes[s.parent];
  const roots=row?.nodes,prior=parent?.nodes,e=row?.extras;
  if(row?.name!=='C80_542_WPB_K04_SW01_SW04_WALLHOST_FROM_SCENE_'+s.parent+'_WORK_TEST_HOST_HOLD' ||
     roots?.length!==s.rootCount ||
     k04Fnv32(roots)!==s.rootHash || k04Fnv32(prior)!==s.parentHash ||
     !isK04RootReplacement(roots,prior,s.hasSwitches) ||
     e?.stage!=='WORK_TEST_HOST_HOLD' || e?.floor!==s.floor ||
     e?.sourceScene!==s.parent ||
     e?.sourceGLBSHA256!==K04_PARENT_SHA256 ||
     e?.sourceZipDriveId!==K04_PARENT_ZIP_ID ||
     e?.K04SwitchesHosted!=='SW01_SW03_PLUS_SW04' ||
     e?.K04SW04InheritedFromParent!==true ||
     e?.K04SW01SW03WallGeometryVerified!==true ||
     e?.K04SW01SW03PhysicalPositionVerified!==false ||
     e?.sourceLinksBoundToNewGLBSHA!==false ||
     e?.current!==false || e?.asBuilt!==false ||
     e?.HUMAN_REVIEW!=='NOT_RUN')return false;
  const live=activeNodes(json.nodes,roots);
  if(!live)return false;
  const additions=[12257,12258,12259,12260,12261,12262,12263,12264,12265,12266];
  if(s.hasSwitches) {
    if(additions.some(id=>!live.has(id)) ||
       [11830,11833,11836].some(id=>live.has(id)))return false;
  } else if(additions.some(id=>live.has(id)))return false;
  return true;
}
export function k04SwitchReceipt(json,sha,scene,floor){
  return Object.freeze({
    exactSource:isK04SwitchSourceScene(json,sha,scene,floor),
    sourceOnly:true,stage:'WORK_TEST_HOST_HOLD',
    current:false,asBuilt:false,sourceLinksBound:false,
    physicalHostVerified:false,publishAllowed:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',
  });
}
