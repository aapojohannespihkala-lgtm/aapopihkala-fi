// Source-exact V93 owner-approved 2026 LED24 grid. G2b TYÖ EI AUTO.
// https://drive.google.com/file/d/1P5sfNWBYi8YjSsCwXXTk8gXnMR8c-kIj/view
// Approved grid layout only. WORK_TEST/HOST_HOLD; no measured ceiling host,
// verified wiring/SKU, CURRENT/as-built status, or production WebGL approval.
// Only the three opt-in room cutaways are registered, without borrowing
// V92 building-part identities or classifying a marker as a physical fixture.
export const V93_LED24_GRID_SOURCE_SHA256 = '2791ede06c7b50c9cffe27c64fc17a3d975b981c03850067eb5d814ba9e79944';
export const V93_LED24_GRID_SCENE_COUNT = 328;
export const V93_LED24_GRID_FLOORS = Object.freeze({ '1F':295, '2F':296, BOTH:297 });
export const V93_LED24_GRID_OPTIN = Object.freeze({ '1F':325, '2F':326, BOTH:327 });
export const V93_LED24_GRID_BUILDING_PARTS = Object.freeze({}); // No inherited physical identity.

const scene = (floor, name, nodes) => Object.freeze({
  floor, name, rootNodes:Object.freeze(nodes), paths:Object.freeze({}),
});
export const V93_LED24_GRID_BUILDING_SCENES = Object.freeze({
  325:scene('1F',
    'Ylisrinne_V93_LED24_GRID_APPROVED_1F_WORK_TEST_HOST_HOLD_20261110',
    [7221,9274,6376,6377,11640,11739]),
  326:scene('2F',
    'Ylisrinne_V93_LED24_GRID_APPROVED_2F_WORK_TEST_HOST_HOLD_20261110',
    [10794,9257,6432,6433,11752,11702]),
  327:scene('BOTH',
    'Ylisrinne_V93_LED24_GRID_APPROVED_BOTH_WORK_TEST_HOST_HOLD_20261110',
    [7221,9274,6376,6377,11640,10794,9257,6432,6433,11739,11752,11702]),
});
export const V93_LED24_GRID_ORDERED_ROOT_FNV = Object.freeze({
  325:'7134d3d0',326:'60272f09',327:'a8bc5ebc',
});
export const V93_LED24_GRID_MARKER_ROOTS = Object.freeze({
  '1F':11739, '2F':11752, KITCHEN_EXISTING:11702,
});
const led1 = Object.freeze({node:11739,name:'LED24_GRID_ACCEPTED_1F_18_MARKERS_ROOT_WORK_TEST_HOST_HOLD'});
const led2 = Object.freeze({node:11752,name:'LED24_GRID_ACCEPTED_2F_6_MARKERS_ROOT_WORK_TEST_HOST_HOLD'});
const oldKitchen = Object.freeze({node:11702,name:'REVIEW_CUTAWAY_PREEXISTING_THREE_KITCHEN_SPOTS_ROOT'});
export const V93_LED24_GRID_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  325:Object.freeze([led1]),
  326:Object.freeze([led2,oldKitchen]),
  327:Object.freeze([led1,led2,oldKitchen]),
});
// Fail closed if a changed source-profile definition loses its exact scene or
// duplicates any source root. The SHA above binds actual mesh/node content.
for (const [idx, spec] of Object.entries(V93_LED24_GRID_BUILDING_SCENES)) {
  const roots=spec.rootNodes;
  let fnv=2166136261;
  for(const n of roots) fnv=Math.imul(fnv ^ n,16777619)>>>0;
  if(fnv.toString(16).padStart(8,'0')!==V93_LED24_GRID_ORDERED_ROOT_FNV[idx] ||
     roots.length!==new Set(roots).size ||
     !V93_LED24_GRID_TECHNICAL_REVIEW_ROOTS[idx].every(x=>roots.includes(x.node))) {
    throw new Error('V93 LED24 exact grid source-profile contract mismatch');
  }
}
