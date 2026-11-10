// Source-exact V93 D2F WC opaque-plexiglass opt-in preview, not a current/as-built model.
// G2b TYÖ EI AUTO ZIP: https://drive.google.com/file/d/1dR_334yLsVWPwpE06pgXlMjdk2_UbrLR/view
// Derived GLB SHA is pinned below. No physical nodes, meshes or dimensions are added.
// Remove only redundant SYMBOLIC cover scene roots 5840/5841; retain real plexi 5887/5888.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const PLEXI_NOOVERLAY_SOURCE_SHA256 = 'ad36018e7115eb96fc0498c15b4f71dc069bfed08d0b9c92616b5c9847d4a5c2';
export const PLEXI_NOOVERLAY_SOURCE_SCENE_COUNT = 305;
export const PLEXI_NOOVERLAY_FLOORS = V93_H35H38_FLOORS;
export const PLEXI_NOOVERLAY_OPTIN_SCENES = Object.freeze({ '2F': 303, BOTH: 304 });
export const PLEXI_NOOVERLAY_HOST_STATUS = 'WORK_TEST_HOST_HOLD_NOT_SURVEYED';
export const PLEXI_NOOVERLAY_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const PLEXI_NOOVERLAY_TECHNICAL_REVIEW_ROOTS = V93_H35H38_TECHNICAL_REVIEW_ROOTS;

const exactScene = (baseIndex, name, floor) => {
  const base = V93_H35H38_BUILDING_SCENES[baseIndex];
  if (!base) throw new Error('Plexi no-overlay V93 base scene missing');
  const removed = [5840, 5841];
  if (!removed.every(node => base.rootNodes.includes(node))) {
    throw new Error('Plexi no-overlay source root mismatch');
  }
  return Object.freeze({
    ...base, name, floor,
    rootNodes: Object.freeze(base.rootNodes.filter(node => !removed.includes(node))),
    paths: Object.freeze(Object.fromEntries(Object.entries(base.paths).filter(([node]) => !removed.includes(Number(node))))),
  });
};

export const PLEXI_NOOVERLAY_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: exactScene(302, 'V93_D2FWC_C80_018_PLEXI_ONLY_2F_OPTIN_WORK_TEST_HOST_HOLD_20261110', '2F'),
  304: exactScene(300, 'V93_D2FWC_C80_018_PLEXI_ONLY_BOTH_OPTIN_WORK_TEST_HOST_HOLD_20261110', 'BOTH'),
});
