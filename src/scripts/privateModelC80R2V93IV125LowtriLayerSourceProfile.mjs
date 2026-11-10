// Source-exact V93 2F WC owner-preferred ONE shared D125 IV trunk, two photo-observed outlets.
// G2b TYÖ EI AUTO ZIP Drive1qu4IX7eiWWxyN37N3L0yOArPfhu0FVTI.
// GLB scenes 336/337/338/339 are opt-in WORK_TEST/HOST_HOLD, NOT CURRENT/as-built.
// Low-triangle mesh is a visual proxy, NOT approved duct wall, flow or physical route.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const IV125_LOWTRI_SOURCE_SHA256 = '556f0e775424845f59632ed2e4c27f8ba62441f8ae4549468b74b22fd957f6f0';
export const IV125_LOWTRI_SOURCE_SCENE_COUNT = 340;
export const IV125_LOWTRI_FLOORS = V93_H35H38_FLOORS;
export const IV125_LOWTRI_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const IV125_LOWTRI_OPTIN_SCENES = Object.freeze({
  NORMAL_2F: 336, MAINTENANCE_2F: 337, BOTH: 338, FOCUS: 339,
});
export const IV125_LOWTRI_FORK_ROOT = 11658; // child 11657 mesh 4419, 47,252 triangles
export const IV125_LOWTRI_OLD_HIGH_TRI_ROOT = 11656;
export const IV125_LOWTRI_OLD_PARALLEL_ROOT = 11647;
export const IV125_LOWTRI_OWNER_PHOTO_OUTLETS = Object.freeze([11637, 11640]);
export const IV125_LOWTRI_PA1_WASTE_ROOT = 11652;

const HISTORICAL_OR_CONFLICT_ROOTS = new Set([5887,5888,5839,5840,5841]);
const NEW_SOURCE_ROOTS = Object.freeze([11535,11536,11586,11587,11605,11624,11627,11634,IV125_LOWTRI_FORK_ROOT,11652]);
const exactScene = (baseIndex, name, oldTech, newTech, plexi) => {
  const base = V93_H35H38_BUILDING_SCENES[baseIndex];
  if (!base?.rootNodes.includes(oldTech)) throw new Error('V93 IV125 lowtri source root mismatch');
  const roots = base.rootNodes
    .filter(n => !HISTORICAL_OR_CONFLICT_ROOTS.has(n))
    .map(n => n === oldTech ? newTech : n);
  roots.push(...NEW_SOURCE_ROOTS.filter(n => plexi || n !== 11587));
  return Object.freeze({ ...base, name, rootNodes: Object.freeze(roots) });
};
export const IV125_LOWTRI_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  336: exactScene(302,
    'V93_D2FWC_IV_ONE_D125_COMMON_FORK_LOW_TRI_2F_NORMAL_WORK_TEST_HOST_HOLD',
    11478, 11653, true),
  337: exactScene(302,
    'V93_D2FWC_IV_ONE_D125_COMMON_FORK_LOW_TRI_2F_MAINT_WORK_TEST_HOST_HOLD',
    11478, 11653, false),
  338: exactScene(300,
    'V93_D2FWC_IV_ONE_D125_COMMON_FORK_LOW_TRI_BOTH_WORK_TEST_HOST_HOLD',
    11476, 11654, true),
  339: Object.freeze({
    ...V93_H35H38_BUILDING_SCENES[302],
    floor: '2F',
    name: 'V93_D2FWC_IV_OWNER_PREFERRED_SINGLE_D125_LOW_TRI_FOCUS_WORK_TEST_HOST_HOLD',
    rootNodes: Object.freeze([10122,11637,11638,11639,11640,11641,11642,11658]),
  }),
});
const ROOTS = Object.freeze([
  Object.freeze({node: 11653, name: 'V93_D2FWC_IVDUCT_PA1_2026_NO_HIST_V75_D7_TECH_2F_WORK_TEST'}),
  Object.freeze({node: IV125_LOWTRI_FORK_ROOT, name: 'D2FWC_IV125_OWNER_PREFERRED_LIGHT_SCENE_ROOT'}),
  Object.freeze({node: 11652, name: 'V93_D2F_PA1_PHOTO_2026_WHITE_UNDERBASIN_WASTE_TRAP_VISIBLE_SHAPE_WORK_TEST_ROOT'}),
]);
export const IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V93_H35H38_TECHNICAL_REVIEW_ROOTS,
  336: ROOTS,
  337: ROOTS,
  338: Object.freeze([
    Object.freeze({node:11654,name:'V93_D2FWC_IVDUCT_PA1_2026_NO_HIST_V75_D7_TECH_BOTH_WORK_TEST'}),
    ...ROOTS.slice(1),
  ]),
  339: Object.freeze([ROOTS[1]]),
});
