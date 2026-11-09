// Exact V78 WORK_TEST source: V77 (f2332d26...) + z-fighting fix (coplanar overlapping surfaces separated
// by 2.5 mm, detail element in front) and 2F ceiling cable drops ended at the ceiling underside (H-V75-1),
// Claude 8.11.2026. Only vertex positions change; node/mesh indices, names, scene roots and paths are
// identical to V77, so V77 parts/paths are reused under the V78 scene names and SHA.
// WORK_TEST / HOST_HOLD; not CURRENT, canonical or as-built.
import { V77_BUILDING_PARTS, V77_BUILDING_SCENES, V77_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V77LayerSourceProfile.mjs';
export const V78_SOURCE_SHA256 = '63e4764e4c60c412497376e8ac41978d00fa0f7c84d85ad5088e206479e4cefa';
export const V78_SOURCE_SCENE_COUNT = 298;
export const V78_FLOORS = Object.freeze({ '1F': 295, '2F': 296, BOTH: 297 });
export const V78_BUILDING_PARTS = V77_BUILDING_PARTS;
export const V78_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(V77_BUILDING_SCENES).map(([index, scene]) => [index, Object.freeze({
    ...scene, name: `C80R2_V78_ZFIGHT_CEIL_FIX_${scene.floor}_WORK_TEST_HOST_HOLD_20261108`,
  })]),
));
export const V78_TECHNICAL_REVIEW_ROOTS = V77_TECHNICAL_REVIEW_ROOTS;
