// Exact, opt-in source receiver for MJ79 D1F PHOTO12 angled double outlets.
// Private GLB: https://drive.google.com/file/d/1t6XL0H9I-EwEGqGHmjPorbCfYvDjHBeQ/view
// Visual WORK_TEST/HOST_HOLD only. The 2025 photo and 2026 general Exxact
// family observation do not verify installed SKU, as-built, or production WebGL.
export const MJ79_SOURCE_SHA256 = '5da932fb3c3ccdf2f4f38b286734e4388f132690daa37bef35c749cacbece7b7';
export const MJ79_PARENT_SHA256 = '7400a70dc1fc216280daa0d65769527ea3e766dc2f615562733617266d7d47cd';
export const MJ79_SOURCE_SCENE_COUNT = 374;
export const MJ79_SOURCE_NODE_COUNT = 12050;
export const MJ79_SOURCE_MESH_COUNT = 4543;
export const MJ79_BASE_FLOORS = Object.freeze({'1F':344,'2F':345,BOTH:346});
export const MJ79_FLOORS = Object.freeze({'1F':372,BOTH:373});
export const MJ79_SCENES = Object.freeze({
  372: Object.freeze({floor:'1F',parentScene:365,rootCount:283,rootFnv:'b274a700',
    name:'C80_MJ79_PHOTO12_D1F_TWO_EXXACT_ANGLED_DOUBLE_SOCKETS_1F_WORK_TEST_HOST_HOLD_20261112'}),
  373: Object.freeze({floor:'BOTH',parentScene:371,rootCount:459,rootFnv:'e0da6f94',
    name:'C80_MJ79_PHOTO12_D1F_TWO_EXXACT_ANGLED_DOUBLE_SOCKETS_BOTH_WORK_TEST_HOST_HOLD_20261112'}),
});
export const MJ79_COW_ROOT = 12049;
export const MJ79_OLD_ROOT = 11739;
export const MJ79_OLD_SOCKETS = Object.freeze([11748,11749,11750,11751,11752,11753]);
export const MJ79_SOCKETS = Object.freeze([
  Object.freeze({root:12043,stableID:'1F-PR03',oldRoot:11748,children:[12039,12040,12041,12042]}),
  Object.freeze({root:12048,stableID:'1F-PR05',oldRoot:11751,children:[12044,12045,12046,12047]}),
]);
export const MJ79_SOURCES = Object.freeze({
  photo:'https://drive.google.com/file/d/1LmeFZ1zFA1t5aTLO3ruw3KO-TxLNPbSz/view',
  mj79:'https://docs.google.com/document/d/1ASYZJM3g2Ahl8WDDxiZI3kscDdkXxmHbfUrFHcByDMA/edit',
  family:'https://docs.google.com/document/d/1u9kRm44m9vmdQA1mVNAR0HmUQFqiId4rgljo2XXzEpY/edit',
});
export function mj79RootFnv32(roots) {
  let h=2166136261;
  for(const n of roots) {
    if(!Number.isInteger(n) || n<0) return null;
    h=Math.imul(h^n,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
const same = (a,b) => Array.isArray(a) && a.length===b.length && b.every((v,i)=>a[i]===v);
const hasSources = extras => {
  const links=extras?.sourceLinks;
  return Array.isArray(links) &&
    Object.values(MJ79_SOURCES).every(url=>links.some(link=>link?.url===url));
};
function activeNodes(json,roots) {
  const nodes=json?.nodes;
  if(!Array.isArray(nodes)) return null;
  const active=new Set(), pending=[...roots];
  while(pending.length) {
    const id=pending.pop();
    if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id]) return null;
    if(active.has(id)) continue;
    active.add(id);
    const c=nodes[id].children;
    if(c!==undefined&&!Array.isArray(c)) return null;
    if(c) pending.push(...c);
  }
  return active;
}
// The SHA must come from the actual loaded GLB bytes. Never trust ZIP name,
// caller-selected metadata, or previous source versions as identity.
export function isMJ79SourceScene(json,loadedSha,sceneIndex,floor=null) {
  const profile=Object.hasOwn(MJ79_SCENES,sceneIndex)?MJ79_SCENES[sceneIndex]:null;
  const scene=json?.scenes?.[sceneIndex],roots=scene?.nodes;
  const asset=json?.asset?.extras,meta=scene?.extras;
  if(loadedSha!==MJ79_SOURCE_SHA256 || !profile ||
    (floor!==null&&floor!==profile.floor) ||
    json?.scene!==292 || json?.scenes?.length!==MJ79_SOURCE_SCENE_COUNT ||
    json?.nodes?.length!==MJ79_SOURCE_NODE_COUNT ||
    json?.meshes?.length!==MJ79_SOURCE_MESH_COUNT ||
    asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
    asset?.asBuilt!==false||asset?.canonical!==false||
    !Object.entries(MJ79_BASE_FLOORS).every(([key,v])=>asset?.viewerFloorScenes?.[key]===v)||
    scene?.name!==profile.name||!Array.isArray(roots)||
    roots.length!==profile.rootCount||new Set(roots).size!==roots.length||
    mj79RootFnv32(roots)!==profile.rootFnv||
    meta?.parentGlbSHA256!==MJ79_PARENT_SHA256||
    meta?.parentSceneIndex!==profile.parentScene||
    meta?.integrationTask!=='MJ79_PHOTO12_D1F_PR03_PR05_VISUAL_ONLY'||
    meta?.floor!==profile.floor||meta?.modelStage!=='WORK_TEST'||
    meta?.HOST_HOLD!==true||meta?.current!==false||meta?.asBuilt!==false||
    meta?.photo2025!==true||meta?.owner2026GeneralFamilyReference!==true||
    meta?.actualInstalledSKU!=='UNKNOWN'||meta?.exactXYZMeasured!==false||
    meta?.physicalElectricalVerified!==false||
    !same(meta?.nodeCOW,[MJ79_OLD_ROOT,MJ79_COW_ROOT])||
    !same(meta?.replacedOldActiveOutletRoots,[11748,11751])||
    !same(meta?.newOutletRoots,MJ79_SOCKETS.map(x=>x.root))||
    !hasSources(meta)||roots.filter(id=>id===MJ79_COW_ROOT).length!==1||
    roots.includes(MJ79_OLD_ROOT)) return false;
  const cow=json.nodes[MJ79_COW_ROOT], e=cow?.extras;
  if(cow?.name!=='MJ79_D1F_PR03_PR05_SOURCE_EXACT_TWO_ANGLED_DOUBLE_PROXY_COW_ROOT_20261112'||
     e?.sourceRoot!==MJ79_OLD_ROOT||e?.sourceParentGLBSHA256!==MJ79_PARENT_SHA256||
     e?.visualDiffOnly!=='PR03_PR05_TWO_ANGLED_DOUBLE_SOCKETS'||
     e?.notInstalledSKU!==true||e?.asBuilt!==false||
     !hasSources(e)||!Array.isArray(cow.children)||
     !same(cow.children,[11740,11741,11742,11743,11744,11747,12043,12048,11754,11757,11760,11763])) return false;
  const active=activeNodes(json,roots);
  if(!active || MJ79_OLD_SOCKETS.some(id=>active.has(id))||
     active.has(MJ79_OLD_ROOT)) return false;
  for(const {root,stableID,oldRoot,children} of MJ79_SOCKETS) {
    if(!active.has(root)||cow.children.filter(id=>id===root).length!==1) return false;
    const node=json.nodes[root], e=node?.extras;
    if(e?.stableID!==stableID||e?.oldRootNode!==oldRoot||
       e?.ModelStage!=='WORK_TEST'||e?.RepresentationKind!=='PHOTO2025_ANGLED_VISUAL_PROXY'||
       e?.socketCount!==2||e?.installedSKU!=='UNKNOWN'||
       e?.current!==false||e?.asBuilt!==false||
       e?.measured!==false||e?.physicalElectricalValidated!==false||
       e?.sourcePhotoDate!=='2025-04-26'||!hasSources(e)||
       !same(node?.children,children)) return false;
    for(let i=0;i<children.length;i++) {
      const c=json.nodes[children[i]];
      if(!active.has(children[i])||
         c?.mesh!==4539+i||
         !c?.name?.startsWith('MJ79_D1F_'+stableID.slice(3)+'_PHOTO12_EXXACT_ANGLED_TWO_OUTLETS_')||
         c?.extras?.installedSKU!=='UNKNOWN'||
         c?.extras?.current!==false||c?.extras?.asBuilt!==false||
         !hasSources(c.extras)) return false;
    }
  }
  return true;
}
