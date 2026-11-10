// Exact V93 H30 source-only ceiling reference candidate. Never promote to CURRENT.
// G2b TYÖ EI AUTO ZIP: 18XF8mf6jMdRR284igdJrQijGOAMNR9eG (10.11.2026).
// Derived from H30 SHA e2405f79... by appending scenes 306-308 only.
// 1F node 6497 is presentationOnly/nonphysical; 2F node 8003 is WORK_TEST.
// The three H30 detectors are placement proxies, not verified installed devices.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const H30_CEILING_SOURCE_SHA256 = 'c723dab4aa34e29b8680b412402f07a4dfce0d96be6434a5e96e8717e49d01ac';
export const H30_CEILING_SOURCE_SCENE_COUNT = 309;
export const H30_CEILING_FLOORS = V93_H35H38_FLOORS;
export const H30_CEILING_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const H30_CEILING_OPTIN_SCENES = Object.freeze({ '1F': 306, '2F': 307, BOTH: 308 });
export const H30_CEILING_HOST_STATUS = Object.freeze({
  6497: 'NONPHYSICAL_PRESENTATION_ONLY',
  8003: 'WORK_TEST_MODEL_CEILING_ONLY',
});

// These roots and names are sourced from the verified 309-scene GLB JSON.
// Empty paths mean no *new* building-part associations are inferred from focus scenes.
const exactScene = (name, floor, rootNodes) => Object.freeze({
  name, floor, rootNodes: Object.freeze(rootNodes), paths: Object.freeze({}),
});
export const H30_CEILING_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: exactScene('H30_PALOTURVA_D1F_EXISTING_PARTS_FOCUS_WORK_TEST_HOST_HOLD', '1F',
    [9175,9280,7999,6376,6377,7221,6847,6848,10532,10538,9274,7660,9006,11432]),
  304: exactScene('H30_PALOTURVA_D2F_EXISTING_PARTS_FOCUS_WORK_TEST_HOST_HOLD', '2F',
    [7356,6431,6432,6433,7371,10794,9257,10538,10554,11433,11434]),
  305: exactScene('H30_PALOTURVA_BOTH_EXISTING_PARTS_FOCUS_WORK_TEST_HOST_HOLD', 'BOTH',
    [6376,6377,6431,6432,6433,6847,6848,7221,7356,7371,7660,7999,9006,9175,9257,9274,9280,10532,10538,10554,11046,11432,11433,11434]),
  306: exactScene('H30_PALOTURVA_D1F_PRESENTATION_CEILING_SOURCE_EXACT_WORK_TEST_HOST_HOLD', '1F',
    [6497,11432]),
  307: exactScene('H30_PALOTURVA_D2F_WORK_TEST_CEILING_SOURCE_EXACT_WORK_TEST_HOST_HOLD', '2F',
    [8003,11433,11434]),
  308: exactScene('H30_PALOTURVA_BOTH_CEILING_REFERENCE_SOURCE_EXACT_WORK_TEST_HOST_HOLD', 'BOTH',
    [6497,8003,11432,11433,11434]),
});

// Existing V93 review roots are inherited for the original 1F/2F/BOTH scenes.
// No technical root is auto-authorized for any of the new opt-in scene 303-308.
export const H30_CEILING_TECHNICAL_REVIEW_ROOTS = V93_H35H38_TECHNICAL_REVIEW_ROOTS;
