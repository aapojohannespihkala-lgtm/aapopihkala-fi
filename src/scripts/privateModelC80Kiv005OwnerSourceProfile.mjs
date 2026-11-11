// Exact, opt-in 2F/BOTH receiver for the existing owner-marked KIV005 C80 model.
// This is only a WORK_TEST/HOST_HOLD source lock, not as-built or WebGL approval.
// The SHA is the GLB byte digest (not ZIP SHA, filename, scene label or user input).
export const KIV005_SOURCE_SHA256 = '113c3e027c7e210a3b1d20417c9be0d78070b739bc1650c88bcb5ae47db3abbf';
export const KIV005_PARENT_SHA256 = 'aaed73b25363b4da5585e72060baf911bd339a92c995763edf5a546ad1f3c0f1';
export const KIV005_DONOR_SHA256 = '9bcaa53c05592f56b28a3d9514c1bbcb16a6bc96144f3c9c0c318a094fa6818f';
export const KIV005_SOURCE_SCENE_COUNT = 358;
export const KIV005_SOURCE_NODE_COUNT = 11967;
export const KIV005_FLOORS = Object.freeze({ '2F': 356, BOTH: 357 });
export const KIV005_SCENES = Object.freeze({
  356: Object.freeze({
    floor: '2F', sourceParentScene: 354, donorScene: 350,
    name: 'C80_TATE_PK1_PA1_APK_SW11_LK75_AULA_KSO_KIV005_OWNERPOINT_2F_OPTIN_WORK_TEST_HOST_HOLD',
    rootCount: 178, rootFnv: '2575885f', replacementRootPosition: 62,
  }),
  357: Object.freeze({
    floor: 'BOTH', sourceParentScene: 355, donorScene: 351,
    name: 'C80_TATE_PK1_PA1_APK_SW11_LK75_AULA_KSO_KIV005_OWNERPOINT_BOTH_OPTIN_WORK_TEST_HOST_HOLD',
    rootCount: 447, rootFnv: '08bf3c2b', replacementRootPosition: 312,
  }),
});
export const KIV005_NODES = Object.freeze({
  oldGroup: 8913, oldValve: 8912, group: 11966, valve: 11965,
  unchangedGroupChildren: Object.freeze([8908, 8909, 8910, 8911]),
  valveMeshChildren: Object.freeze(Array.from({length: 19}, (_,i) => 8397 + i)),
});
export const kiv005OrderedRootFnv = roots => {
  let hash = 2166136261;
  for (const n of roots) {
    if (!Number.isInteger(n) || n < 0) return null;
    hash = Math.imul(hash ^ n, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};
const same = (a,b) => Array.isArray(a) && a.length === b.length && b.every((v,i) => a[i] === v);
const approx = (a,b) => Array.isArray(a) && same(a.map(v => Math.round(v * 1e8)), b.map(v => Math.round(v * 1e8)));
const sourceLinkIs = (link, role, sha, scene) =>
  link?.role === role && link?.glb_sha256 === sha && link?.sceneIndex === scene;
// A source-only receipt, not inherited from older similarly named scenes.
export function isKiv005OwnerSourceScene(json, loadedSha, index, floor = null) {
  const expected = Object.hasOwn(KIV005_SCENES, index) ? KIV005_SCENES[index] : null;
  const s = json?.scenes?.[index], e = s?.extras, ax = json?.asset?.extras;
  const roots = s?.nodes, nodes = json?.nodes;
  if (loadedSha !== KIV005_SOURCE_SHA256 || !expected ||
      (floor !== null && floor !== expected.floor) ||
      json?.scene !== 292 || json.scenes?.length !== KIV005_SOURCE_SCENE_COUNT ||
      nodes?.length !== KIV005_SOURCE_NODE_COUNT ||
      ax?.current !== false || ax?.asBuilt !== false || ax?.canonical !== false ||
      ax?.ModelStage !== 'WORK_TEST' ||
      ax?.viewerFloorScenes?.['1F'] !== 347 ||
      ax?.viewerFloorScenes?.['2F'] !== 348 ||
      ax?.viewerFloorScenes?.BOTH !== 349 ||
      s?.name !== expected.name || !Array.isArray(roots) ||
      roots.length !== expected.rootCount || new Set(roots).size !== roots.length ||
      kiv005OrderedRootFnv(roots) !== expected.rootFnv ||
      roots[expected.replacementRootPosition] !== KIV005_NODES.group ||
      roots.filter(n => n === KIV005_NODES.group).length !== 1 ||
      roots.includes(KIV005_NODES.oldGroup) || roots.includes(KIV005_NODES.oldValve) ||
      e?.stage !== 'WORK_TEST/HOST_HOLD' || e?.asBuilt !== false ||
      e?.current !== false || e?.productionWebGL !== 'NOT_RUN' ||
      e?.humanReview !== 'NOT_RUN' ||
      e?.sourceParentGlbSHA256 !== KIV005_PARENT_SHA256 ||
      e?.donorGlbSHA256 !== KIV005_DONOR_SHA256 ||
      e?.sourceParentScene !== expected.sourceParentScene ||
      e?.donorScene !== expected.donorScene ||
      e?.oldKivGroup !== KIV005_NODES.oldGroup ||
      e?.newKivGroup !== KIV005_NODES.group ||
      e?.oldKivNode !== KIV005_NODES.oldValve ||
      e?.newKivNode !== KIV005_NODES.valve ||
      !same(e?.ownerApproxPointG1M,[2.897,10.59,5.045]) ||
      typeof e?.wallDepthAssumptionM !== 'number' ||
      e.wallDepthAssumptionM < 0.03 || e.wallDepthAssumptionM > 0.04 ||
      !Array.isArray(e?.sourceLinks) || e.sourceLinks.length !== 2 ||
      !sourceLinkIs(e.sourceLinks[0],'WORK_TEST_PARENT_COMBINED',KIV005_PARENT_SHA256,expected.sourceParentScene) ||
      !sourceLinkIs(e.sourceLinks[1],'SOURCE_EXACT_KIV005_REPLACEMENT',KIV005_DONOR_SHA256,expected.donorScene))
    return false;
  const n = nodes[KIV005_NODES.valve], group = nodes[KIV005_NODES.group];
  const before = nodes[KIV005_NODES.oldGroup], oldValve = nodes[KIV005_NODES.oldValve];
  if (!same(group?.children,[...KIV005_NODES.unchangedGroupChildren,KIV005_NODES.valve]) ||
      !same(before?.children,[...KIV005_NODES.unchangedGroupChildren,KIV005_NODES.oldValve]) ||
      !same(n?.children,KIV005_NODES.valveMeshChildren) ||
      !same(oldValve?.children,KIV005_NODES.valveMeshChildren) ||
      !approx(n?.translation,[2.897,10.623583493828773,5.045]) ||
      n?.extras?.pointObservation !== 'OWNER_APPROX_VISUAL_MARK_2026-11-11' ||
      !same(n?.extras?.ownerMarkedWallPointG1M,[2.897,10.59,5.045]) ||
      n?.extras?.exactDonorGlbSHA256 !== KIV005_DONOR_SHA256 ||
      group?.extras?.sourceParentGlbSHA256 !== KIV005_PARENT_SHA256 ||
      group?.extras?.exactDonorGlbSHA256 !== KIV005_DONOR_SHA256 ||
      group?.extras?.modelStatus !== 'WORK_TEST/HOST_HOLD' ||
      !same(group?.extras?.ownerApproxPointG1M,[2.897,10.59,5.045]) ||
      group?.extras?.sourceLinks?.[0]?.role !== 'OWNER2026_APPROX_VISUAL_MARK')
    return false;
  return true;
}
