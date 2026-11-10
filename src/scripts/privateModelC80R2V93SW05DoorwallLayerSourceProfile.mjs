// Source-exact V93 owner green SW05 bedroom door-jamb wall host, 10 Nov 2026.
// G2b TYÖ, not AUTO: https://drive.google.com/file/d/1T2Jf72nPzww4fjUDa-HrEY6GuCEzIjxa/view
// This new GLB retains scene339 1F SW03/04. Scenes341/342 use the wall-hosted 2F SW05 COW node.
// All positions and wall host are WORK_TEST/HOST_HOLD, not surveyed, CURRENT or as-built.
// No electrical circuits, socket pairs, production WebGL or HUMAN_REVIEW are verified.
export const V93_SW05_DOORWALL_SOURCE_SHA256 = '6d55716143dde6909216a670b049c503da292c84704ad3e8320e2cb4e96ba050';
export const V93_SW05_DOORWALL_SCENE_COUNT = 343;
export const V93_SW05_DOORWALL_FLOORS = Object.freeze({ '1F':295,'2F':296,BOTH:297 });
export const V93_SW05_DOORWALL_OPTIN = Object.freeze({ '1F':339,'2F':341,BOTH:342 });
export const V93_SW05_DOORWALL_BUILDING_PARTS = Object.freeze({});
const scene=(floor,name,roots)=>Object.freeze({floor,name,rootNodes:Object.freeze(roots),paths:Object.freeze({})});
export const V93_SW05_DOORWALL_BUILDING_SCENES = Object.freeze({
  339:scene('1F','V93_20261110_OWNER_GREEN_SWITCH11_WALLHOST0304_D1F_OPTIN_WORK_TEST_HOST_HOLD',[7221,9274,6376,6377,11709,11712,11721,11724,11740,11743]),
  341:scene('2F','V93_20261110_OWNER_GREEN_SWITCH11_D2F_SW05_DOOR_WALLHOST_D2F_OPTIN_WORK_TEST_HOST_HOLD',[10794,9257,6432,6433,11725,11728,11731,11734,11746]),
  342:scene('BOTH','V93_20261110_OWNER_GREEN_SWITCH11_D2F_SW05_DOOR_WALLHOST_BOTH_OPTIN_WORK_TEST_HOST_HOLD',[7221,9274,6376,6377,11046,9257,6432,6433,11709,11712,11721,11724,11725,11728,11731,11734,11746,11740,11743]),
});
export const V93_SW05_DOORWALL_ORDERED_ROOT_FNV = Object.freeze({"339":"0476e130","341":"e3408577","342":"954e05ea"});
export const V93_SW05_DOORWALL_ROOTS = Object.freeze({
  SW01:11709,SW02:11712,SW03_WALL:11740,SW04_WALL:11743,
  D1F_SW05_HOST_HOLD:11721,SW06_EXISTING_LINK:11724,
  SW2_01:11725,SW2_02:11728,SW2_03:11731,SW2_04:11734,
  SW2_05_WALL:11746,SW2_05_HISTORICAL:11737,
  SW03_HISTORICAL:11715,SW04_HISTORICAL:11718,
  SW2_05_D2F_WALL_HOST:10794,SW2_05_BOTH_WALL_HOST:11046,
});
export const V93_SW05_DOORWALL_COUNTS = Object.freeze({
  339:Object.freeze({'1F':6,'2F':0,total:6}),
  341:Object.freeze({'1F':0,'2F':5,total:5}),
  342:Object.freeze({'1F':6,'2F':5,total:11}),
});
const marker=(node,name)=>Object.freeze({node,name});
const d1f=Object.freeze([
  marker(11709,'D1F-SW-01_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11712,'D1F-SW-02_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11721,'D1F-SW-05_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11724,'D1F-SW-06_OWNER_CONFIRMED_MARKER_LINK_TO_EXISTING_MODEL_SWITCH_7996'),
  marker(11740,'D1F-SW-03_COW_WALLFACE_HOSTED_ONLY_NEW_SCENES'),
  marker(11743,'D1F-SW-04_COW_WALLFACE_HOSTED_ONLY_NEW_SCENES'),
]);
const d2f=Object.freeze([
  marker(11725,'D2F-SW-01_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11728,'D2F-SW-02_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11731,'D2F-SW-03_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11734,'D2F-SW-04_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'),
  marker(11746,'D2F-SW-05_COW_DOOR_WALL_HOSTED_ONLY_NEW_SCENES'),
]);
export const V93_SW05_DOORWALL_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  339:d1f,341:d2f,342:Object.freeze([...d1f,...d2f]),
});
for(const [idx,spec] of Object.entries(V93_SW05_DOORWALL_BUILDING_SCENES)){
  let h=2166136261;
  for(const node of spec.rootNodes)h=Math.imul(h^node,16777619)>>>0;
  const selected=V93_SW05_DOORWALL_TECHNICAL_REVIEW_ROOTS[idx];
  if(h.toString(16).padStart(8,'0')!==V93_SW05_DOORWALL_ORDERED_ROOT_FNV[idx] ||
      new Set(spec.rootNodes).size!==spec.rootNodes.length ||
      !selected.every(x=>spec.rootNodes.includes(x.node)) ||
      [11715,11718].some(x=>spec.rootNodes.includes(x)) ||
      ((idx==='341'||idx==='342') && spec.rootNodes.includes(11737)) ||
      selected.length!==V93_SW05_DOORWALL_COUNTS[idx].total){
    throw new Error('V93 SW05 doorwall exact source scene contract mismatch');
  }
}
