// Exact V72 WORK_TEST source: V71 + M5 electrical cables rerouted as rule-based
// concealed WORK_TEST routes by Claude 8.11.2026 (parent V71 GLB 831e46da...).
// Building nodes, meshes, scenes 295/296/297 and their root nodes are unchanged
// from V71; only the three scene names and the M5 roots' children differ.
import { V71_BUILDING_PARTS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
export const V72_SOURCE_SHA256 = 'f1233d77f7810ecad3a83db32e5da5db418a7f5392cf420a224f81558496892a';
export const V72_SOURCE_SCENE_COUNT = 298;
export const V72_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V72_BUILDING_PARTS = V71_BUILDING_PARTS;
export const V72_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V71_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V72_M5_CONCEALED_ROUTES_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V72_TECHNICAL_REVIEW_ROOTS = V71_TECHNICAL_REVIEW_ROOTS;
