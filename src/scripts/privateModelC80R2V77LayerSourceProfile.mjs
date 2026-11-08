// Exact V77 WORK_TEST source: V76 (3ef900c1...) + owner-approved 110 mm north wall of the stair,
// Claude 8.11.2026. Stair-side face moved to the 900 mm stair edge (Y7.225), room side Y7.335 on 1F and 2F.
// Only vertex positions and six door leaf/lever matrices change; node/mesh indices, names, scene roots and
// paths are identical to V76, so V76 parts/paths are reused under the V77 scene names and SHA.
// WORK_TEST / HOST_HOLD; not CURRENT, canonical or as-built.
import { V76_BUILDING_PARTS, V76_BUILDING_SCENES, V76_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V76LayerSourceProfile.mjs';
export const V77_SOURCE_SHA256 = 'f2332d26637187871b20e52b6d4251b80325db47df87b82f39c5e382312aa9df';
export const V77_SOURCE_SCENE_COUNT = 298;
export const V77_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V77_BUILDING_PARTS = V76_BUILDING_PARTS;
export const V77_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V76_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V77_K17_STAIR900_NWALL110_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V77_TECHNICAL_REVIEW_ROOTS = V76_TECHNICAL_REVIEW_ROOTS;
