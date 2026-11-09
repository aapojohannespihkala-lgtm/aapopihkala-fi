// Source-exact V90 IV P0-4 opt-in review of existing ventilation parts.
// Only GLB scene memberships are added; zero geometry and zero physical join claims.
// SHA/scene/root locked to Drive G2b TYÖ 1qCSR9qEos3BJqVIqeb1vA-RYsnbzi4lI.
// V90 scenes 0..297, materials, nodes, default 292 and BIN unchanged.
// This file must not be treated as CURRENT, as-built or production WebGL proof.
import {
  V90_SOURCE_SHA256, V90_FLOORS, V90_BUILDING_PARTS,
  V90_BUILDING_SCENES, V90_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V90LayerSourceProfile.mjs';

export const V90_IV_P04_SOURCE_SHA256 = 'e41d5c77527e708fe4ed7dcf3b417c1b9eb2bee7867e59e1b77dad0f02cc4382';
export const V90_IV_P04_PARENT_SHA256 = V90_SOURCE_SHA256;
export const V90_IV_P04_SCENE_COUNT = 301;
export const V90_IV_P04_FLOORS = V90_FLOORS;
export const V90_IV_P04_BUILDING_PARTS = V90_BUILDING_PARTS;
export const V90_IV_P04_OPTIN_SCENES = Object.freeze({ '1F': 298, '2F': 299, BOTH: 300 });
export const V90_IV_P04_ROOT_IDS = Object.freeze({
  298: Object.freeze([6430,8962,11315,11323,11328,10060,10062,10064,10066,10157,10159]),
  299: Object.freeze([8913,11317,10068,10070,10072,10074,10076,10078,10080,10082,10084,10086,10088,10090,10092,10094,10096,10098,10100,10102,10104,10106,10108,10110,10112,10114,10116,10118,10120,10122]),
  300: Object.freeze([6430,8962,8913,11327,11329,11318,10059,10061,10063,10065,10156,10158,10067,10069,10071,10073,10075,10077,10079,10081,10083,10085,10087,10089,10091,10093,10095,10097,10099,10101,10103,10105,10107,10109,10111,10113,10115,10117,10119,10121]),
});

const focus = (index, name, floor) => Object.freeze({
  name, floor,
  rootNodes: V90_IV_P04_ROOT_IDS[index],
  // IV-only scenes deliberately have no building host parts; do not bind a
  // V90 building part by similar name when its exact source path is absent.
  paths: Object.freeze({}),
});
export const V90_IV_P04_BUILDING_SCENES = Object.freeze({
  ...V90_BUILDING_SCENES,
  298: focus(298, 'V90_IV_P04_D1F_SOURCE_EXACT_OPTIN_WORK_TEST', '1F'),
  299: focus(299, 'V90_IV_P04_D2F_SOURCE_EXACT_OPTIN_WORK_TEST', '2F'),
  300: focus(300, 'V90_IV_P04_BOTH_SOURCE_EXACT_OPTIN_WORK_TEST', 'BOTH'),
});

// The trusted 64-hex GLB hash already binds every node name and mesh.
// For these three SHA-locked focus scenes only, the review resolver also
// requires the complete ordered scene roots and matches object names to JSON.
// Other releases continue to use their fixed expected node names unchanged.
const lockedRoots = index => Object.freeze(V90_IV_P04_ROOT_IDS[index].map(node => Object.freeze({node, name: null})));
export const V90_IV_P04_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V90_TECHNICAL_REVIEW_ROOTS,
  298: lockedRoots(298), 299: lockedRoots(299), 300: lockedRoots(300),
});
