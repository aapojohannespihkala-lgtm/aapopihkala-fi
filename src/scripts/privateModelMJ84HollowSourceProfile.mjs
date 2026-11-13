// SHA-locked receiver for MJ84's local open-ended duct sleeve, NOT for
// physical E220S continuity or as-built exhaust. Separate from the earlier
// PR1935 GLB SHA396f1abe... scene352/353 profile.
// Original G2b TYÖ EI AUTO: https://drive.google.com/file/d/1U0hds8jsf2xbjO87sAqFha4iIYv0Eo_Q/view
export const MJ84_HOLLOW_SOURCE_SHA256 = '55dd33c8fcb5501abc47fa8d0050c42ea7c141184005f025d00dae139ea4b5dc';
export const MJ84_HOLLOW_PARENT_SHA256 = 'ce7d3fd0360be7ed90267705c7db3798b7099d67f09d9b07c8513e8705852f70';
export const MJ84_HOLLOW_OLD_SHA256 = '396f1abe0f2be4b40c84ba886686906f141c8cf22aa9d8a40ed0416916030a80';
export const MJ84_HOLLOW_V2_SHA256 = 'd31e794b2e1cc6c76e60b83560b972b869dd68f476fb574a119e41ebdc0448b7';
export const MJ84_HOLLOW_SCENE_COUNT = 360;
export const MJ84_HOLLOW_NODE_COUNT = 11922;
export const MJ84_HOLLOW_MESH_COUNT = 4521;
export const MJ84_HOLLOW_DEFAULT_SCENE = 292;
export const MJ84_HOLLOW_BASE_FLOORS = Object.freeze({'1F':347,'2F':348,BOTH:349});
export const MJ84_HOLLOW_FLOORS = Object.freeze({'2F':358,BOTH:359});
export const MJ84_HOLLOW_SCENES = Object.freeze({
  358: Object.freeze({
    floor:'2F', name:'C80_MJ84_ONE_FORK_OPEN_HOLLOW_GAP_SLEEVE_2F_WORK_TEST_20261112',
    count:179, fnv:'a4f8ab72', priorScene:356, historyScene:354,
    priorSourceRoot:11729, priorCowRoot:11913, ownerScene:352,
  }),
  359: Object.freeze({
    floor:'BOTH', name:'C80_MJ84_ONE_FORK_OPEN_HOLLOW_GAP_SLEEVE_BOTH_WORK_TEST_20261112',
    count:445, fnv:'c4a9594a', priorScene:357, historyScene:355,
    priorSourceRoot:11714, priorCowRoot:11914, ownerScene:353,
  }),
});
export const MJ84_HOLLOW_COMPONENTS = Object.freeze({
  wallDuct: Object.freeze({node:11910,mesh:4516,name:'D2F_KSO125_OWNER_WALL_TO_EXISTING_FORK_20261111_WORK_TEST'}),
  wallValve: Object.freeze({node:11911,mesh:4517,name:'D2F_KSO125_OWNER_WALL_VALVE_20261111_WORK_TEST'}),
  wallTrim: Object.freeze({node:11912,mesh:4518,name:'D2F_KSO125_OWNER_WALL_INNER_20261111_WORK_TEST'}),
  correctFork: Object.freeze({node:11919,mesh:4434,name:'D2FWC_OWNER2026_PREFERRED_ONE_D125_COMMON_FORK_LOW_TRI_WORK_TEST_MJ84_EXACT_SOURCE_IDS_CORRECTED_20261112'}),
  hollowSleeve: Object.freeze({node:11921,mesh:4520,name:'MJ84_D2F_GAP_BRIDGE_OPEN_HOLLOW_SLEEVE_WORK_TEST_20261112'}),
});
export const MJ84_HOLLOW_WC_CEILING = Object.freeze([11620,11621,11622]);
export const MJ84_HOLLOW_HISTORIC_DISABLED = Object.freeze([10122,11617,11618,11619,11656,11915]);
export const MJ84_HOLLOW_FORK_ROOT = 11920;
export const MJ84_HOLLOW_FOLLOWING_DUCT = 10104;
export function mj84HollowRootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let h=2166136261;
  for(const x of ids) {
    if(!Number.isInteger(x)||x<0) return null;
    h=Math.imul(h^x,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function activeNodes(json,roots) {
  if(!Array.isArray(json?.nodes)) return null;
  const active=new Set(), pending=[...roots], nodes=json.nodes;
  while(pending.length) {
    const n=pending.pop();
    if(!Number.isInteger(n)||n<0||n>=nodes.length||!nodes[n]) return null;
    if(active.has(n)) continue;
    active.add(n);
    const children=nodes[n].children;
    if(children!==undefined&&!Array.isArray(children)) return null;
    if(children) pending.push(...children);
  }
  return active;
}
const validLinks = (links) => Array.isArray(links) &&
  links.some(x=>x?.docId==='DOC:13JgMhHVCFqHjR0PP-J6KDWZOnz6GkIl5UZoaozbA7IA') &&
  links.some(x=>x?.docId==='DOC:1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9');
// Caller must pass SHA256 of actual loaded GLB bytes. A ZIP hash, title or scene
// name is never accepted. Only exact 2F/BOTH opt-in scenes are authorized.
export function isMJ84HollowSourceScene(json,loadedSha,sceneIndex,floor=null) {
  const p=Object.hasOwn(MJ84_HOLLOW_SCENES,sceneIndex) ? MJ84_HOLLOW_SCENES[sceneIndex] : null;
  const scene=json?.scenes?.[sceneIndex],roots=scene?.nodes,ext=scene?.extras;
  const asset=json?.asset?.extras,hol=ext?.MJ84HollowSleeve,sem=ext?.MJ84SemanticIndexCorrection,src=ext?.MJ84SourceRootUpdate;
  if(loadedSha!==MJ84_HOLLOW_SOURCE_SHA256||!p||
    (floor!==null&&floor!==p.floor)||
    json?.scene!==MJ84_HOLLOW_DEFAULT_SCENE||
    json?.scenes?.length!==MJ84_HOLLOW_SCENE_COUNT||
    json?.nodes?.length!==MJ84_HOLLOW_NODE_COUNT||
    json?.meshes?.length!==MJ84_HOLLOW_MESH_COUNT||
    asset?.current!==false||asset?.canonical!==false||
    asset?.asBuilt!==false||asset?.ModelStage!=='WORK_TEST'||
    !Object.entries(MJ84_HOLLOW_BASE_FLOORS).every(([f,n])=>asset?.viewerFloorScenes?.[f]===n)||
    scene?.name!==p.name||!Array.isArray(roots)||roots.length!==p.count||
    roots.length!==new Set(roots).size||
    mj84HollowRootFnv32(roots)!==p.fnv||
    ext?.verificationStage!=='WORK_TEST_HOST_HOLD'||
    ext?.physicalConnectionVerified!==false||
    ext?.ductInternalBoreOpenVerified!==false||
    ext?.verifiedAirflowLps!==null||
    ext?.ownerG1XYZ?.join(',')!=='5.004,5.494,5.195'||
    !validLinks(ext?.sourceLinks)||
    ext?.sourceRoot!==p.priorSourceRoot||
    ext?.COWRoot!==p.priorCowRoot||
    src?.fromGLBSHA256!==MJ84_HOLLOW_OLD_SHA256||
    src?.fromScene!==p.ownerScene||
    src?.modelStage!=='WORK_TEST_HOST_HOLD'||
    sem?.sourceGLBSHA256!==MJ84_HOLLOW_V2_SHA256||
    sem?.sourceScene!==p.historyScene||
    sem?.replacementCorrectSceneRoot!==MJ84_HOLLOW_FORK_ROOT||
    sem?.replacementForkGeometryNode!==MJ84_HOLLOW_COMPONENTS.correctFork.node||
    sem?.badReferencesRemovedFromClone?.sourceDuctNode!==11655||
    sem.badReferencesRemovedFromClone.sourceOutlets?.join(',')!=='11637,11640'||
    sem?.NO_PHYSICAL_FLOW_CLAIM!==true||
    hol?.parentGLBSHA256!==MJ84_HOLLOW_PARENT_SHA256||
    hol?.parentSceneIndex!==p.priorScene||
    hol?.newNode!==MJ84_HOLLOW_COMPONENTS.hollowSleeve.node||
    hol?.oldSingleSurfaceNodeInactiveOnlyHere!==11915||
    hol?.localAnnulusThroughBore!==true||
    hol?.closedEndcap!==false||
    hol?.globalNetworkThroughBore!=='NOT_VERIFIED'||
    hol?.stage!=='WORK_TEST_HOST_HOLD'||
    hol?.productionWebGL!=='NOT_RUN'||
    hol?.humanReview!=='NOT_RUN') return false;
  const a=activeNodes(json,roots),nodes=json?.nodes;
  if(!a||roots.filter(n=>n===MJ84_HOLLOW_FORK_ROOT).length!==1||
    roots.filter(n=>n===MJ84_HOLLOW_COMPONENTS.hollowSleeve.node).length!==1||
    !a.has(MJ84_HOLLOW_FORK_ROOT)||
    !a.has(MJ84_HOLLOW_FOLLOWING_DUCT)||
    !MJ84_HOLLOW_WC_CEILING.every(n=>a.has(n))||
    MJ84_HOLLOW_HISTORIC_DISABLED.some(n=>a.has(n))) return false;
  const forkRoot=nodes[MJ84_HOLLOW_FORK_ROOT];
  const fork=nodes[MJ84_HOLLOW_COMPONENTS.correctFork.node];
  const sleeve=nodes[MJ84_HOLLOW_COMPONENTS.hollowSleeve.node];
  if(!Array.isArray(forkRoot?.children)||!forkRoot.children.includes(MJ84_HOLLOW_COMPONENTS.correctFork.node)||
    !validLinks(forkRoot.extras?.sourceLinks)||
    forkRoot.extras?.physicalConnectionVerified!==false||
    fork?.extras?.sourceDuctNode!==undefined||
    fork?.extras?.sourceOutlets!==undefined||
    fork?.extras?.physicalConnectionVerified!==false||
    fork?.extras?.physicalJunctionOpenVerified!==false||
    !validLinks(fork?.extras?.sourceLinks)||
    sleeve?.extras?.sourceGLBSHA256!==MJ84_HOLLOW_PARENT_SHA256||
    sleeve?.extras?.hollowBoreLocalVerified!==true||
    sleeve?.extras?.throughOpenEndcapsLocalVerified!==true||
    sleeve?.extras?.entireSystemContinuityVerified!==false||
    sleeve?.extras?.junctionOpenVerified!==false||
    sleeve?.extras?.hostCavityVerified!==false||
    sleeve?.extras?.physicalConnectionVerified!==false||
    sleeve?.extras?.designDiameterAssumption_mm!==125||
    sleeve?.extras?.wallThicknessIllustrative_m!==0.0015||
    !validLinks(sleeve?.extras?.sourceLinks)) return false;
  for(const part of Object.values(MJ84_HOLLOW_COMPONENTS)) {
    const n=nodes[part.node];
    if(!a.has(part.node)||n?.mesh!==part.mesh||n?.name!==part.name||
      n?.extras?.asBuilt===true||n?.extras?.physicalConnectionVerified!==false) return false;
  }
  return true;
}
