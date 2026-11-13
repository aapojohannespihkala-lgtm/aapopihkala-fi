// SHA-bound source-only viewer opt-in. Exact V93 MJ40 1F/BOTH/FOCUS GLB,
// not CURRENT, as-built, a measured clearance or a production publish permit.
// G2b TYÖ: https://drive.google.com/file/d/1exdakCGErKXBvpDUMCIVy4bIA4wv8aWQ/view
// Parent: e7ed92ab5c82de5d861ac8c6322248413c77312ea0adba37465fb7c5e3cdafa4; donor V26: b36812d7c66c25f83d1c8288cc335adbf9fc83421eeef5bca93f625e456092db.
export const V93_MJ40_SOURCE_SHA256 = '95e1d53386664a94be541c7136aec1800470d5772ba87f1c2ee7221712bc1618';
export const V93_MJ40_SCENE_COUNT = 343;
export const V93_MJ40_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V93_MJ40_OPEN90_ROOT = 11632;
const OPEN90_ROOT_NAME = 'V93_MJ40_BOSCH_WNG254ABSN_D1F_OPEN90_OPTIN_V26_SOURCE_EXACT_WORK_TEST_HOST_HOLD_20261110';
export const V93_MJ40_SCENES = Object.freeze({
  340: Object.freeze({
    name: 'V93_MJ40_BOSCH_OPEN90_D1F_SOURCE_EXACT_V26_DONOR_WORK_TEST_HOST_HOLD_20261110',
    floor: '1F', rootCount: 253, rootFnv: '037e1726',
  }),
  341: Object.freeze({
    name: 'V93_MJ40_BOSCH_OPEN90_BOTH_SOURCE_EXACT_V26_DONOR_WORK_TEST_HOST_HOLD_20261110',
    floor: 'BOTH', rootCount: 406, rootFnv: 'ec82893f',
  }),
  342: Object.freeze({
    name: 'V93_MJ40_BOSCH_OPEN90_PK1_PA2_S1S2_D1F_FOCUS_SOURCE_EXACT_WORK_TEST_HOST_HOLD_20261110',
    floor: '1F', rootCount: 9, rootFnv: 'c88016d7',
  }),
});
export const V93_MJ40_FOCUS_ROOTS = Object.freeze([11632, 11403, 11595, 11604, 11609, 11612, 7221, 9274, 11316]);
export const V93_MJ40_REVIEW_ROOTS = Object.freeze({
  342: Object.freeze([
    Object.freeze({ node: 11632, name: OPEN90_ROOT_NAME }),
    Object.freeze({ node: 11403, name: 'H23_PA2_1F_UNDERCABINET_VISIBLE_WORK_TEST_OPTIN_20261109' }),
    Object.freeze({ node: 11595, name: 'V93_PA2_V75D4_WALL_SUBFLOOR_COFIT_PORT_FROM_V89_OPTIN_20261110' }),
    Object.freeze({ node: 11604, name: 'PK1_D1F_WASHER_WALL_TAP_VISIBLE_GREY_HOSE_2026_WORK_TEST_HOST_HOLD' }),
    Object.freeze({ node: 11609, name: 'MJ04_D1F_S1_S2_TWO_THERMOSTATIC_MIXERS_INLET_ADAPTERS_ROOT_WORK_TEST_HOST_HOLD' }),
    Object.freeze({ node: 11612, name: 'D1F_PH_V75_D1_D2_TWO_EXISTING_SHOWER_DRAIN_NECKS_WITH_MJ04_MJ06_20261110_WORK_TEST_HOST_HOLD' }),
  ]),
});
const orderedRootFnv = roots => {
  let h = 2166136261;
  for (const id of roots) h = Math.imul(h ^ id, 16777619) >>> 0;
  return h.toString(16).padStart(8, '0');
};
// A caller MUST independently calculate loadedSha from actual GLB bytes.
// The full ordered-root signature prevents source/classification inheritance
// when scene indices or names are re-used by a different V93 derivative.
export function isV93MJ40BoschOpen90Scene(json, loadedSha, sceneIndex, floor = null) {
  const expected = V93_MJ40_SCENES[sceneIndex];
  const extras = json?.asset?.extras;
  const source = json?.scenes?.[sceneIndex];
  const roots = source?.nodes;
  const model = json?.nodes?.[V93_MJ40_OPEN90_ROOT];
  const pivot = json?.nodes?.[11630];
  if (loadedSha !== V93_MJ40_SOURCE_SHA256 || !expected ||
      (floor !== null && floor !== expected.floor) ||
      json?.scenes?.length !== V93_MJ40_SCENE_COUNT ||
      json?.nodes?.length !== 11633 || json?.scene !== 292 ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !Object.entries(V93_MJ40_FLOORS).every(([key, index]) => extras?.viewerFloorScenes?.[key] === index) ||
      source?.name !== expected.name || !Array.isArray(roots) ||
      roots.length !== expected.rootCount || new Set(roots).size !== roots.length ||
      orderedRootFnv(roots) !== expected.rootFnv ||
      roots.filter(id => id === V93_MJ40_OPEN90_ROOT).length !== 1 ||
      roots.includes(5733) || roots.includes(5682) ||
      model?.name !== OPEN90_ROOT_NAME ||
      model?.extras?.donorGLBSHA256 !== 'b36812d7c66c25f83d1c8288cc335adbf9fc83421eeef5bca93f625e456092db' ||
      model?.extras?.parentGLBSHA256 !== 'e7ed92ab5c82de5d861ac8c6322248413c77312ea0adba37465fb7c5e3cdafa4' ||
      model?.extras?.openAngleDegrees !== 90 ||
      !Array.isArray(model?.children) || !model.children.includes(11630) ||
      !model.children.includes(11631) ||
      [5704, 5705, 5706, 5707, 5708, 5709, 5713].some(id => model.children.includes(id)) ||
      !Array.isArray(pivot?.children) || pivot.children.length !== 7 ||
      ![11623, 11624, 11625, 11626, 11627, 11628, 11629].every((id, i) => pivot.children[i] === id)) {
    return false;
  }
  return sceneIndex !== 342 || V93_MJ40_FOCUS_ROOTS.every((id, i) => roots[i] === id);
}
