// Source-exact NIBE Compact-R 2014 product-size alternatives on V93.
// G2b TYÖ EI AUTO ZIP 1YRVfxz7JJuCujh0M5nBm4gMDTPtRu0JV, 10.11.2026.
// 2026 installed product/position, plumbing functions, host and review are NOT verified.
// The numeric scene ids are glTF scenes, not file-name __scene suffixes.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const NIBE_R2_SOURCE_SHA256 = '33c85b0de4378f125fb623c08e72086731353fc252b7c3bcd0df49d05f667e91';
export const NIBE_R2_SOURCE_SCENE_COUNT = 306;
export const NIBE_R2_FLOORS = V93_H35H38_FLOORS;
export const NIBE_R2_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const NIBE_R2_TECHNICAL_REVIEW_ROOTS = V93_H35H38_TECHNICAL_REVIEW_ROOTS;
export const NIBE_R2_VARIANTS = Object.freeze({
  R150: Object.freeze({ scene: 303, root: 11479, sizeMm: Object.freeze([600,615,1120]) }),
  R200: Object.freeze({ scene: 304, root: 11494, sizeMm: Object.freeze([600,615,1310]) }),
  R300: Object.freeze({ scene: 305, root: 11509, sizeMm: Object.freeze([600,615,1710]) }),
});
const OLD_SYMBOLIC_NIBE_ROOTS = Object.freeze([5839, 5840, 5841]);
const exactVariant = (name, root) => {
  const base = V93_H35H38_BUILDING_SCENES[302];
  for (const oldRoot of OLD_SYMBOLIC_NIBE_ROOTS) {
    if (!base.rootNodes.includes(oldRoot))
      throw new Error('NIBE R2 source roots do not match original V93 2F scene');
  }
  // Preserve all 2F context except the obsolete 440x440 NIBE symbolic body,
  // append one source-native alternative. Do not claim new building-part paths.
  const roots = Object.freeze([...base.rootNodes.filter(n => !OLD_SYMBOLIC_NIBE_ROOTS.includes(n)), root]);
  return Object.freeze({ name, floor: '2F', rootNodes: roots, paths: Object.freeze({}) });
};
export const NIBE_R2_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: exactVariant('V93_D2F_NIBE_R150_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', 11479),
  304: exactVariant('V93_D2F_NIBE_R200_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', 11494),
  305: exactVariant('V93_D2F_NIBE_R300_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', 11509),
});
