// Exact V93 H35+H38 WORK_TEST source. The SHA locks the GLB, not the ZIP filename.
// 295/296/297 are the unchanged asset.viewerFloorScenes contract. 300/301/302
// are opt-in views, not CURRENT, as-built or evidence of physical cable routing.
import { V92_BUILDING_PARTS, V92_BUILDING_SCENES, V92_FLOORS, V92_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V92LayerSourceProfile.mjs';

export const V93_H35H38_SOURCE_SHA256 = 'a01025bd91cbff6e83c2bdaea954e77333368e2f40f356a6672ea0dc2c09246a';
export const V93_H35H38_SOURCE_SCENE_COUNT = 303;
export const V93_H35H38_FLOORS = V92_FLOORS;
export const V93_H35H38_OPTIN_SCENES = Object.freeze({ '1F': 301, '2F': 302, BOTH: 300 });
export const V93_H35H38_BUILDING_PARTS = V92_BUILDING_PARTS;

// These are verified exact root-only edits from V92 SHA a027108c to V93 SHA a01025bd.
// Building-part nodes, their meshes and source parent paths remain unchanged.
// The three H30 smoke proxies remain. H35 root 11435 is present in 1F/BOTH.
const withRoots = (baseIndex, name, replaceRoot = null, newRoot = null, h35 = false) => {
  const base = V92_BUILDING_SCENES[baseIndex];
  const roots = [...base.rootNodes];
  if (replaceRoot !== null) {
    const position = roots.indexOf(replaceRoot);
    if (position < 0) throw new Error('V93 source profile root contract mismatch');
    roots[position] = newRoot;
  }
  if (h35) roots.push(11435);
  return Object.freeze({ ...base, name, rootNodes: Object.freeze(roots) });
};

export const V93_H35H38_BUILDING_SCENES = Object.freeze({
  295: withRoots(295, 'C80R2_V93_H30_H35_1F_WORK_TEST_HOST_HOLD', null, null, true),
  296: withRoots(296, 'C80R2_V92_H30_SMOKE_2F_WORK_TEST_HOST_HOLD_20261108'),
  297: withRoots(297, 'C80R2_V93_H30_H35_BOTH_WORK_TEST_HOST_HOLD', null, null, true),
  298: withRoots(295, 'V93_H35_VM20_1F_OPTIN_H30_3SMOKE_WORK_TEST_HOST_HOLD', null, null, true),
  299: withRoots(297, 'V93_H35_VM20_BOTH_OPTIN_H30_3SMOKE_WORK_TEST_HOST_HOLD', null, null, true),
  300: withRoots(297, 'V93_H35_H38_BOTH_NO_EXPOSED_2015_CABLES_OPTIN_WORK_TEST_HOST_HOLD', 10058, 11476, true),
  301: withRoots(295, 'V93_H35_H38_1F_CABLE_HIDDEN_OPTIN_WORK_TEST_HOST_HOLD', 10056, 11477, true),
  302: withRoots(296, 'V93_H35_H38_2F_CABLE_HIDDEN_OPTIN_WORK_TEST_HOST_HOLD', 10057, 11478),
});

// The exact V93 GLB contains H35 manifold root 11435 (40 mesh children)
// once in original 1F295 and BOTH297. Keep its original red/blue WORK_TEST
// materials visible during the technical review, without granting a physical
// host or attachment PASS. V92 and V93 2F296 are unchanged.
// Opt-in cloned technical roots 11476-11478 are NOT auto-authorized.
const H35_MANIFOLD_SOURCE_ROOT = Object.freeze({
  node: 11435,
  name: 'H20_D1F_WC_UPPERHATCH_MANIFOLD_WORK_TEST_HOST_HOLD_ROOT',
});
export const V93_H35H38_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V92_TECHNICAL_REVIEW_ROOTS,
  295: Object.freeze([...V92_TECHNICAL_REVIEW_ROOTS[295], H35_MANIFOLD_SOURCE_ROOT]),
  297: Object.freeze([...V92_TECHNICAL_REVIEW_ROOTS[297], H35_MANIFOLD_SOURCE_ROOT]),
});
