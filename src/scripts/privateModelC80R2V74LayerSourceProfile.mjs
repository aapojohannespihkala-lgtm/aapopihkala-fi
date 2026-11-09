// Exact V74 WORK_TEST source (Drive 1uejJx8GjSfT84wzTE_uEqxyH95CPztSP): V71 + M5 routes hosted in slab/walls,
// IV collector in the ceiling box, WC1 stacks in the wall zone, Claude 8.11.2026 (parent V71 GLB 831e46da...).
// Building nodes, meshes, scenes 295/296/297 and their root nodes are unchanged
// from V71; only the three scene names and the M5 roots' children differ.
import { V71_BUILDING_PARTS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
export const V74_SOURCE_SHA256 = '76e737678c3c2d25484459eb7f192becfb1084fbdfc4ed1830ea852e8834ea1d';
export const V74_SOURCE_SCENE_COUNT = 298;
export const V74_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V74_BUILDING_PARTS = V71_BUILDING_PARTS;
export const V74_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V71_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V74_M5_HOSTED_ROUTES_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V74_TECHNICAL_REVIEW_ROOTS = V71_TECHNICAL_REVIEW_ROOTS;
