// Source-exact owner ceiling marker view: 9 ceiling plug-outlets and 3 smoke detectors.
// Work-only ZIP: https://drive.google.com/file/d/1qysQZxFbUiN7QuBvlF7TIfOJWELHnE16/view
// Owner's 2026-11-10 plan markup gives approximate positions, not measured coordinates.
// Reuses source H30 meshes; original LED24 and earlier scenes remain immutable.
// WORK_TEST / HOST_HOLD: no physical SKU, circuits, CURRENT/as-built, WebGL or HUMAN_REVIEW certification.
export const V93_OWNER_CEILING_SOURCE_SHA256 = '34cf59f8a6bba21bd6c2a087acbfd7bdef22a84c8ff0fa4b7ffc4ce3cc5331d4';
export const V93_OWNER_CEILING_SCENE_COUNT = 331;
export const V93_OWNER_CEILING_FLOORS = Object.freeze({ '1F':295,'2F':296,BOTH:297 });
export const V93_OWNER_CEILING_OPTIN = Object.freeze({ '1F':328,'2F':329,BOTH:330 });
export const V93_OWNER_CEILING_BUILDING_PARTS = Object.freeze({}); // Never inherit physical source-part IDs.
const scene=(floor,name,roots)=>Object.freeze({
  floor,name,rootNodes:Object.freeze(roots),paths:Object.freeze({}),
});
export const V93_OWNER_CEILING_BUILDING_SCENES = Object.freeze({
  328:scene('1F','YLISRINNE_V93_OWNER_9_ORANGE_CEILING_SOCKET_3_BLUE_SMOKE_1F_WORK_TEST_HOST_HOLD_20261110',
    [7221,9274,6376,6377,11640,11739,11801,11802]),
  329:scene('2F','YLISRINNE_V93_OWNER_9_ORANGE_CEILING_SOCKET_3_BLUE_SMOKE_2F_WORK_TEST_HOST_HOLD_20261110',
    [10794,9257,6432,6433,11752,11702,11803,11804]),
  330:scene('BOTH','YLISRINNE_V93_OWNER_9_ORANGE_CEILING_SOCKET_3_BLUE_SMOKE_BOTH_WORK_TEST_HOST_HOLD_20261110',
    [7221,9274,6376,6377,11640,10794,9257,6432,6433,11739,11752,11702,11801,11802,11803,11804]),
});
export const V93_OWNER_CEILING_ORDERED_ROOT_FNV = Object.freeze({
  328:'878208e3',329:'a85d877e',330:'38778b90',
});
export const V93_OWNER_CEILING_ROOTS = Object.freeze({
  LED1:11739,LED2:11752,KITCHEN_EXISTING:11702,
  SOCKET1:11801,SMOKE1:11802,SOCKET2:11803,SMOKE2:11804,
});
export const V93_OWNER_CEILING_COUNTS = Object.freeze({
  328:Object.freeze({sockets:1,smokes:1}),
  329:Object.freeze({sockets:8,smokes:2}),
  330:Object.freeze({sockets:9,smokes:3}),
});
const marker=(node,name)=>Object.freeze({node,name});
const led1=marker(11739,'LED24_GRID_ACCEPTED_1F_18_MARKERS_ROOT_WORK_TEST_HOST_HOLD');
const led2=marker(11752,'LED24_GRID_ACCEPTED_2F_6_MARKERS_ROOT_WORK_TEST_HOST_HOLD');
const kitchen=marker(11702,'REVIEW_CUTAWAY_PREEXISTING_THREE_KITCHEN_SPOTS_ROOT');
const socket1=marker(11801,'OWNER_1F_CEILING_PLUG_OUTLETS_1_ROOT_WORK_TEST_HOST_HOLD');
const smoke1=marker(11802,'OWNER_1F_SMOKE_DETECTORS_1_ROOT_WORK_TEST_HOST_HOLD');
const socket2=marker(11803,'OWNER_2F_CEILING_PLUG_OUTLETS_8_ROOT_WORK_TEST_HOST_HOLD');
const smoke2=marker(11804,'OWNER_2F_SMOKE_DETECTORS_2_ROOT_WORK_TEST_HOST_HOLD');
export const V93_OWNER_CEILING_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  328:Object.freeze([led1,socket1,smoke1]),
  329:Object.freeze([led2,kitchen,socket2,smoke2]),
  330:Object.freeze([led1,led2,kitchen,socket1,smoke1,socket2,smoke2]),
});
for(const [idx,spec] of Object.entries(V93_OWNER_CEILING_BUILDING_SCENES)){
  let fnv=2166136261;
  for(const node of spec.rootNodes) fnv=Math.imul(fnv^node,16777619)>>>0;
  if(fnv.toString(16).padStart(8,'0')!==V93_OWNER_CEILING_ORDERED_ROOT_FNV[idx] ||
      new Set(spec.rootNodes).size!==spec.rootNodes.length ||
      !V93_OWNER_CEILING_TECHNICAL_REVIEW_ROOTS[idx].every(x=>spec.rootNodes.includes(x.node))){
    throw new Error('V93 owner ceiling exact-source contract mismatch');
  }
}
