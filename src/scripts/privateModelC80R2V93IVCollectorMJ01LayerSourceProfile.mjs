// Source-exact WORK_TEST opt-in: 2F WC one shared IV collector and two outlets
// combined with owner-confirmed floor-level WC/bidet pipe zones (MJ01 REV2).
// ZIP: G2b TYÖ EI AUTO, Drive 1kc3V-oUZFfPUqyHWERgUbtPOSCaUAiRb
// SHA and scene list identify this GLB ONLY, not other V93 forks with identical
// glTF scene numbers. Ø160, route XYZ and hydraulic joints remain HOST_HOLD.
// No CURRENT/as-built, production WebGL or HUMAN_REVIEW is implied.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const IV_MJ01_SOURCE_SHA256 = 'bccdfcea6f73d7350d54f35c5c04b6c0195ba081522aa0c7c82432edb4ffe640';
export const IV_MJ01_SOURCE_SCENE_COUNT = 338;
export const IV_MJ01_FLOORS = V93_H35H38_FLOORS;
export const IV_MJ01_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const IV_MJ01_OPTIN_SCENES = Object.freeze({ NORMAL_2F: 335, MAINTENANCE_2F: 336, BOTH: 337 });
export const IV_MJ01_COLLECTOR_ROOT = 11658;
export const IV_MJ01_FLOOR_WC_ROOT = 11666;
export const IV_MJ01_OLD_TWIN_ROOT = 11654;
export const IV_MJ01_2026_OUTLET_NODES = Object.freeze([11637,11638,11639,11640,11641,11642]);

const OLD_INACTIVE = new Set([5887, 5888, 5839, 5840, 5841]);
const COMMON_NEW_ROOTS = Object.freeze([
  11535, 11536, 11586, 11605, 11624, 11627, 11634, 11649, 11658, 11666,
]);
const exactScene = (baseIndex, name, oldTechnical, newTechnical, plexi) => {
  const base = V93_H35H38_BUILDING_SCENES[baseIndex];
  if (!base?.rootNodes.includes(oldTechnical)) throw new Error('IV-MJ01 parent H38 source root mismatch');
  const roots = base.rootNodes.filter(node => !OLD_INACTIVE.has(node))
    .map(node => node === oldTechnical ? newTechnical : node);
  roots.push(...COMMON_NEW_ROOTS.slice(0, 3),
    ...(plexi ? [11587] : []), ...COMMON_NEW_ROOTS.slice(3));
  return Object.freeze({ ...base, name, rootNodes: Object.freeze(roots) });
};

export const IV_MJ01_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  335: exactScene(302,
    'V93_2FWC_ONE_IV_D160_COLLECTOR_TWO_2026_OUTLETS_PLUS_OWNER_FLOOR_WC_BIDET_MJ01REV2_2F_NORMAL_WORK_TEST',
    11478, 11667, true),
  336: exactScene(302,
    'V93_2FWC_ONE_IV_D160_COLLECTOR_TWO_2026_OUTLETS_PLUS_OWNER_FLOOR_WC_BIDET_MJ01REV2_2F_MAINTENANCE_WORK_TEST',
    11478, 11667, false),
  337: exactScene(300,
    'V93_2FWC_ONE_IV_D160_COLLECTOR_TWO_2026_OUTLETS_PLUS_OWNER_FLOOR_WC_BIDET_MJ01REV2_BOTH_1F_2F_WORK_TEST',
    11476, 11668, true),
});

const ADDED_TECHNICAL_ROOTS = Object.freeze([
  Object.freeze({ node: IV_MJ01_COLLECTOR_ROOT,
    name: 'IV_D2FWC_TWO_OUTLETS_ONE_SHARED_COLLECTOR_Y_BRANCH_WORK_TEST_ROOT' }),
  Object.freeze({ node: IV_MJ01_FLOOR_WC_ROOT,
    name: 'MJ01_REV2_OWNER_FLOOR_UNDERCABINET_TWO_LOW_LINES_PLUS_WC_INTERNAL_FILL_WORK_TEST_HOST_HOLD' }),
]);
export const IV_MJ01_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V93_H35H38_TECHNICAL_REVIEW_ROOTS,
  335: ADDED_TECHNICAL_ROOTS,
  336: ADDED_TECHNICAL_ROOTS,
  337: ADDED_TECHNICAL_ROOTS,
});
