// Exact V73 WORK_TEST source (Drive 1tOR07Oq_IQMlqtCKcFuonu-jCt-6mni6): V71 + M5 electrical cables
// anchored to 2015 device points (HOST_HOLD markers), D1F wet-room drains lowered into the floor, Claude 8.11.2026 (parent V71 GLB 831e46da...).
// Building nodes, meshes, scenes 295/296/297 and their root nodes are unchanged
// from V71; only the three scene names and the M5 roots' children differ.
import { V71_BUILDING_PARTS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
export const V73_SOURCE_SHA256 = 'c84f087b8a5f8db0cd9dfb9a0eefec7e13328ca3dc84d46c5bbde1bf996e6e35';
export const V73_SOURCE_SCENE_COUNT = 298;
export const V73_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V73_BUILDING_PARTS = V71_BUILDING_PARTS;
export const V73_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V71_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V73_M5_ANCHORED_ROUTES_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V73_TECHNICAL_REVIEW_ROOTS = V71_TECHNICAL_REVIEW_ROOTS;
