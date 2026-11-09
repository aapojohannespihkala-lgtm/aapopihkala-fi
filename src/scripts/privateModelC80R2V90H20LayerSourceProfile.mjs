// Exact standalone V90 + H20 40-mesh WORK_TEST/HOST_HOLD opt-in.
// This is NOT the V90 G2b AUTO main model, CURRENT, as-built, or a collision repair.
// Original V90 298 scenes, meshes, nodes and default scene 292 remain unchanged.
// The original asset.extras.viewerFloorScenes stays 295/296/297; the two
// extra manual review scenes are 298 1F and 299 BOTH, with root H20 node 11432.
// Grounded in G2b TYÖ ZIP Drive 1N4TZyjbqRhoyKo0KADVH0fjxjSgOKuc5.
import {
  V90_SOURCE_SHA256, V90_FLOORS, V90_BUILDING_PARTS,
  V90_BUILDING_SCENES, V90_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V90LayerSourceProfile.mjs';

export const V90_H20_SOURCE_SHA256 = '73d2ffc1dd1d25717b1889bef05c307c02e598f09cc5a2986b93f8fe9992b3e7';
export const V90_H20_PARENT_SHA256 = V90_SOURCE_SHA256;
export const V90_H20_SCENE_COUNT = 300;
export const V90_H20_FLOORS = V90_FLOORS; // GLB asset.extras.viewerFloorScenes, NOT opt-in scenes
export const V90_H20_OPTIN_SCENES = Object.freeze({ '1F': 298, BOTH: 299 });
export const V90_H20_BUILDING_PARTS = V90_BUILDING_PARTS; // no changed building parts
export const V90_H20_ROOT = Object.freeze({
  node: 11432,
  name: 'H20_D1F_WC_UPPERHATCH_MANIFOLD_WORK_TEST_HOST_HOLD_ROOT',
});

const optinScene = (base, name) => Object.freeze({
  ...V90_BUILDING_SCENES[base],
  name,
  rootNodes: Object.freeze([...V90_BUILDING_SCENES[base].rootNodes, V90_H20_ROOT.node]),
  // H20's 40 new component nodes are not building parts. Keep the unchanged
  // exact node/parent/path bindings for the V90 building parts only.
  paths: V90_BUILDING_SCENES[base].paths,
});
export const V90_H20_BUILDING_SCENES = Object.freeze({
  ...V90_BUILDING_SCENES,
  298: optinScene(295, 'V90_H20_VM20_MANIFOLD_1F_OPTIN_SOURCE_EXACT_WORK_TEST_HOST_HOLD'),
  299: optinScene(297, 'V90_H20_VM20_MANIFOLD_BOTH_OPTIN_SOURCE_EXACT_WORK_TEST_HOST_HOLD'),
});
export const V90_H20_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V90_TECHNICAL_REVIEW_ROOTS,
  298: Object.freeze([...V90_TECHNICAL_REVIEW_ROOTS[295], V90_H20_ROOT]),
  299: Object.freeze([...V90_TECHNICAL_REVIEW_ROOTS[297], V90_H20_ROOT]),
});
