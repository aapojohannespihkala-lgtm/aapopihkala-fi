// Exact V75 WORK_TEST source: V71 + M5 device-anchored cables, fixture water/drain connections (WORK_ASSUMPTION),
// IV collector in the ceiling box, Claude 8.11.2026 (parent V71 GLB 831e46da...).
// Building nodes, meshes, scenes 295/296/297 and their root nodes are unchanged
// from V71; only the three scene names and the M5 roots' children differ.
import { V71_BUILDING_PARTS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
export const V75_SOURCE_SHA256 = '2377e02d8843b07665a819965217ae20053be9ab82e02d9aad05cf1cc8e69070';
export const V75_SOURCE_SCENE_COUNT = 298;
export const V75_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V75_BUILDING_PARTS = V71_BUILDING_PARTS;
export const V75_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V71_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V75_M5_CONNECTED_SYSTEMS_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V75_TECHNICAL_REVIEW_ROOTS = V71_TECHNICAL_REVIEW_ROOTS;
