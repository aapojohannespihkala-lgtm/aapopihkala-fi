// Exact source receiver for MJ84's two WORK_TEST-only 2F exhaust scenes.
// Source: https://drive.google.com/file/d/1Oa8c0Kp8Ad4adJHQ5wL4SNg7bSKtCoZW/view
// Physical duct bore, concealed host and E220S continuity remain unverified.
// Do not infer CURRENT, as-built, production WebGL or HUMAN_REVIEW.
export const MJ84_SOURCE_SHA256 = '396f1abe0f2be4b40c84ba886686906f141c8cf22aa9d8a40ed0416916030a80';
export const MJ84_PARENT_SHA256 = '6b365a36278a7a4e4e90201926bcabc59395129a762c619302f11fa642328c89';
export const MJ84_SCENE_COUNT = 354;
export const MJ84_NODE_COUNT = 11916;
export const MJ84_DEFAULT_SCENE = 292;
export const MJ84_PARENT_FLOORS = Object.freeze({ '1F': 347, '2F': 348, BOTH: 349 });
export const MJ84_FLOORS = Object.freeze({ '2F': 352, BOTH: 353 });
export const MJ84_SCENES = Object.freeze({
  352: Object.freeze({
    floor: '2F', parentScene: 350, sourceRoot: 11729, cowRoot: 11913,
    name: 'C80_MJ84_OWNER_2F_KSO_ONE_BRANCH_2F_WORK_TEST_HOST_HOLD_20261111',
    rootCount: 179, rootFnv: '3adbf845',
  }),
  353: Object.freeze({
    floor: 'BOTH', parentScene: 351, sourceRoot: 11714, cowRoot: 11914,
    name: 'C80_MJ84_OWNER_2F_KSO_ONE_BRANCH_BOTH_WORK_TEST_HOST_HOLD_20261111',
    rootCount: 445, rootFnv: 'f6348165',
  }),
});
export const MJ84_COMPONENTS = Object.freeze({
  ownerDuct: Object.freeze({node:11910,mesh:4516,name:'D2F_KSO125_OWNER_WALL_TO_EXISTING_FORK_20261111_WORK_TEST'}),
  ownerValve: Object.freeze({node:11911,mesh:4517,name:'D2F_KSO125_OWNER_WALL_VALVE_20261111_WORK_TEST'}),
  ownerInnerTrim: Object.freeze({node:11912,mesh:4518,name:'D2F_KSO125_OWNER_WALL_INNER_20261111_WORK_TEST'}),
  gapAdapter: Object.freeze({node:11915,mesh:4519,name:'MJ84_D2F_ONE_D125_GAP_BRIDGE_WORK_TEST_OPEN_BORE_NOT_VERIFIED'}),
});
export const MJ84_EXISTING = Object.freeze({
  preferredFork: 11656, followingDuct: 10104,
  ceilingKso: Object.freeze([11620,11621,11622]),
  historicalT: 10122, obsoleteHall: Object.freeze([11617,11618,11619]),
});
export function mj84RootFnv32(roots) {
  let hash=2166136261;
  for (const id of roots) {
    if (!Number.isInteger(id) || id < 0) return null;
    hash=Math.imul(hash ^ id, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8,'0');
}
function activeNodeSet(json, roots) {
  const nodes=json?.nodes;
  if (!Array.isArray(nodes)) return null;
  const active=new Set();
  const todo=[...roots];
  while (todo.length) {
    const id=todo.pop();
    if (!Number.isInteger(id) || id < 0 || id >= nodes.length || !nodes[id]) return null;
    if (active.has(id)) continue;
    active.add(id);
    const children=nodes[id].children;
    if (children !== undefined && !Array.isArray(children)) return null;
    if (children) todo.push(...children);
  }
  return active;
}
// The caller must provide the SHA of the actual loaded GLB bytes, not a ZIP
// digest or a source label. Scene names alone never authorize a source.
export function isMJ84SourceScene(json, loadedSha, sceneIndex, floor=null) {
  const profile=Object.hasOwn(MJ84_SCENES,sceneIndex) ? MJ84_SCENES[sceneIndex] : null;
  const scene=json?.scenes?.[sceneIndex], roots=scene?.nodes;
  const asset=json?.asset?.extras, meta=scene?.extras;
  if (loadedSha !== MJ84_SOURCE_SHA256 || !profile ||
      (floor !== null && floor !== profile.floor) ||
      json?.scene !== MJ84_DEFAULT_SCENE ||
      json?.scenes?.length !== MJ84_SCENE_COUNT ||
      json?.nodes?.length !== MJ84_NODE_COUNT ||
      asset?.current !== false || asset?.asBuilt !== false ||
      asset?.canonical !== false || asset?.ModelStage !== 'WORK_TEST' ||
      !Object.entries(MJ84_PARENT_FLOORS).every(([key,n]) => asset?.viewerFloorScenes?.[key] === n) ||
      scene?.name !== profile.name ||
      !Array.isArray(roots) || roots.length !== profile.rootCount ||
      roots.length !== new Set(roots).size ||
      mj84RootFnv32(roots) !== profile.rootFnv ||
      meta?.parentGLBSHA256 !== MJ84_PARENT_SHA256 ||
      meta?.parentScene !== profile.parentScene ||
      meta?.sourceRoot !== profile.sourceRoot || meta?.COWRoot !== profile.cowRoot ||
      meta?.verificationStage !== 'WORK_TEST_HOST_HOLD' ||
      meta?.physicalConnectionVerified !== false ||
      meta?.ductInternalBoreOpenVerified !== false ||
      meta?.verifiedAirflowLps !== null ||
      !Array.isArray(meta?.ownerG1XYZ) ||
      meta.ownerG1XYZ.join(',') !== '5.004,5.494,5.195' ||
      !Array.isArray(meta?.sourceLinks) ||
      !meta.sourceLinks.some(s=>s.docId==='DOC:13JgMhHVCFqHjR0PP-J6KDWZOnz6GkIl5UZoaozbA7IA') ||
      !meta.sourceLinks.some(s=>s.docId==='DOC:1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9') ||
      roots.filter(n=>n===profile.cowRoot).length !== 1) return false;
  const active=activeNodeSet(json,roots);
  if (!active || !active.has(profile.cowRoot) ||
      !active.has(MJ84_EXISTING.preferredFork) ||
      !active.has(MJ84_EXISTING.followingDuct) ||
      !MJ84_EXISTING.ceilingKso.every(n=>active.has(n)) ||
      active.has(MJ84_EXISTING.historicalT) ||
      MJ84_EXISTING.obsoleteHall.some(n=>active.has(n))) return false;
  for (const component of Object.values(MJ84_COMPONENTS)) {
    if (roots.filter(n=>n===component.node).length !== 1 || !active.has(component.node)) return false;
    const node=json.nodes[component.node];
    if (node.name !== component.name || node.mesh !== component.mesh ||
        node.extras?.asBuilt === true ||
        node.extras?.physicalConnectionVerified !== false) return false;
  }
  return true;
}
