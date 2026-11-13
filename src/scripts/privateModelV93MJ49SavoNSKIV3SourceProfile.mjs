// Source-exact, opt-in WORK_TEST/HOST_HOLD 2F/BOTH/FOCUS viewer profile.
// G2b TYÖ EI AUTO https://drive.google.com/file/d/1QvQLkdsnwSo8TTLsvH9yS28uo_HVlQxG/view
// SHA is for the extracted GLB bytes, not the ZIP. Do not infer CURRENT,
// verified airflow, physical connection, production publish or HUMAN_REVIEW.
export const V93_MJ49_SOURCE_SHA256 = '5e1f75d47c056af7a3c916af78d340a24d4ae6a5d92c0091ed99321a159ff4a4';
export const V93_MJ49_SCENE_COUNT = 350;
export const V93_MJ49_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V93_MJ49_SAVO_ROOT = 11745;
export const V93_MJ49_FOCUS_ROOTS = Object.freeze([11746, 10797, 11667, 11658, 11745]);
export const V93_MJ49_SCENES = Object.freeze({
  347: Object.freeze({
    name: 'MJ49_D2F_THREE_KIV_SAVO_NS_RECIRC_AND_E220S_NORMAL_WORK_TEST_HOST_HOLD',
    floor: '2F', rootCount: 161, rootFnv: '770b6d8a',
  }),
  348: Object.freeze({
    name: 'MJ49_BOTH_THREE_KIV_SAVO_NS_RECIRC_AND_E220S_WORK_TEST_HOST_HOLD',
    floor: 'BOTH', rootCount: 412, rootFnv: '485e6467',
  }),
  349: Object.freeze({
    name: 'MJ49_D2F_THREE_SOUTH_KIV_SAVO_NS_AND_E220S_IV_FOCUS_NO_DIRECT_DUCT_WORK_TEST',
    floor: '2F', rootCount: 5, rootFnv: '0ebb7b20',
  }),
});
export const V93_MJ49_REVIEW_ROOTS = Object.freeze({
  349: Object.freeze([
    Object.freeze({ node: 11746, name: 'MJ49_THREE_SOUTH_KIV001_002_003_FOCUS_2015_SOURCE_HOST_HOLD' }),
    Object.freeze({ node: 10797, name: 'C80R2_V23_SAVO_I7603_RECT_FILTER_240X160_WORK_TEST_COW' }),
    Object.freeze({ node: 11667, name: 'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL' }),
    Object.freeze({ node: 11658, name: 'D2FWC_IV125_OWNER_PREFERRED_LIGHT_SCENE_ROOT' }),
    Object.freeze({ node: 11745, name: 'MJ49_D2F_SAVO_OWNER_NS_SCHEMATIC_RETURN_NO_E220S_DIRECT_LINK_WORK_TEST_ROOT' }),
  ]),
});
const rootFnv32 = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};
// All scene IDs, ordered-root checksums and the new source tree below were
// measured from the ZIP's real GLB, verified 2026-11-10 (CRC/SHA).
export function isV93MJ49SavoNSScene(json, loadedSha, sceneIndex, floor = null) {
  const profile = V93_MJ49_SCENES[sceneIndex];
  const scene = json?.scenes?.[sceneIndex];
  const roots = scene?.nodes;
  const extras = json?.asset?.extras;
  const savo = json?.nodes?.[V93_MJ49_SAVO_ROOT];
  const kiv = json?.nodes?.[11746];
  if (loadedSha !== V93_MJ49_SOURCE_SHA256 || !profile ||
      (floor !== null && floor !== profile.floor) ||
      json?.scenes?.length !== V93_MJ49_SCENE_COUNT ||
      json?.nodes?.length !== 11747 || json?.scene !== 292 ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !Object.entries(V93_MJ49_FLOORS).every(([key, value]) => extras?.viewerFloorScenes?.[key] === value) ||
      scene?.name !== profile.name || !Array.isArray(roots) ||
      roots.length !== profile.rootCount || roots.length !== new Set(roots).size ||
      rootFnv32(roots) !== profile.rootFnv ||
      roots.filter(node => node === V93_MJ49_SAVO_ROOT).length !== 1 ||
      savo?.name !== V93_MJ49_REVIEW_ROOTS[349][4].name ||
      savo?.extras?.ownerNorthSouthCorrection20261110 !== true ||
      savo?.extras?.notPhysicalDuctToE220S !== true ||
      savo?.extras?.sourceGLBSHA256 !== 'cd6ec1bc3963e664b30bc3e3ff8f0acd1e2e40adf6b7c150dc45f47158172db2' ||
      savo?.extras?.baseGLBSHA256 !== '3a43dd443502e25171ff8284f0cc067c69c6d769fd151b61b416ca69698712ac' ||
      !Array.isArray(savo.children) ||
      savo.children.length !== 5 ||
      ![11740,11741,11742,11743,11744].every((node, index) => savo.children[index] === node) ||
      json?.nodes?.[11742]?.name !== 'MJ16_NORTH_DISCHARGE_G1_PLUS_Y_GLB_MINUS_Z' ||
      json?.nodes?.[11743]?.name !== 'MJ16_SOUTH_DISCHARGE_G1_MINUS_Y_GLB_PLUS_Z' ||
      kiv?.name !== V93_MJ49_REVIEW_ROOTS[349][0].name ||
      !Array.isArray(kiv.children) ||
      ![8908,8909,8910].every((node, index) => kiv.children[index] === node) ||
      kiv.children.length !== 3) return false;
  return sceneIndex !== 349 || V93_MJ49_FOCUS_ROOTS.every((node,index) => roots[index] === node);
}
