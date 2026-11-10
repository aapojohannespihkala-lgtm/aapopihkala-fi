// Source-exact V93 D2F WC SERVICE cutaway with owner-preferred IV Ø125 and MJ01 REV2.
// Source G2b TYÖ EI AUTO: https://drive.google.com/file/d/1Gs-ajAxWNcy0pT7_gWYwJNKzTAW5NmPx/view
// This is a WORK_TEST/HOST_HOLD view, NOT physical host verification, CURRENT or as-built.
// New source GLB is append-only to PR1904 scene340-343 version. Scene344 keeps ceiling,
// scene345 omits ceiling for visible IV/MJ01 floorline service relation.
import {
  IVB47K_MJ01_BUILDING_PARTS,
  IVB47K_MJ01_BUILDING_SCENES,
  IVB47K_MJ01_FLOORS,
  IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS,
  IVB47K_MJ01_FORK_ROOT,
  IVB47K_MJ01_FLOOR_WC_ROOT,
} from './privateModelC80R2V93IVB47KMJ01CoFitLayerSourceProfile.mjs';

export const IVB_MJ01_SERVICE_SOURCE_SHA256 = 'bbf0f48a8a1c3bfb224227913e63bcaac68de0ae9a1717651f8f7e0cc836f97c';
export const IVB_MJ01_SERVICE_SCENE_COUNT = 346;
export const IVB_MJ01_SERVICE_BUILDING_PARTS = IVB47K_MJ01_BUILDING_PARTS;
export const IVB_MJ01_SERVICE_FLOORS = IVB47K_MJ01_FLOORS;
export const IVB_MJ01_SERVICE_OPTIN_SCENES = Object.freeze({ CEILING_2F:344, CUTAWAY_2F:345 });
export const IVB_MJ01_SERVICE_FORK_ROOT = IVB47K_MJ01_FORK_ROOT;
export const IVB_MJ01_SERVICE_FLOOR_WC_ROOT = IVB47K_MJ01_FLOOR_WC_ROOT;
export const IVB_MJ01_SERVICE_OWNER_OUTLETS = Object.freeze([11637,11638,11639,11640,11641,11642]);
export const IVB_MJ01_SERVICE_ROOM_HOSTS = Object.freeze([8003,10794,9911,11535,11536,11586,11587]);

const shared = Object.freeze([
  ...IVB_MJ01_SERVICE_OWNER_OUTLETS,
  IVB_MJ01_SERVICE_FORK_ROOT,
  IVB_MJ01_SERVICE_FLOOR_WC_ROOT,
]);
const scene = (name, ceiling) => {
  const parent = IVB47K_MJ01_BUILDING_SCENES[343];
  if (!parent ||
      parent.rootNodes.filter(n=>n===IVB_MJ01_SERVICE_FORK_ROOT).length!==1 ||
      parent.rootNodes.filter(n=>n===IVB_MJ01_SERVICE_FLOOR_WC_ROOT).length!==1)
    throw new Error('V93 IVB MJ01 service cutaway source parent mismatch');
  return Object.freeze({
    ...parent,
    floor:'2F',
    name,
    // Exact source glTF ordered scene roots, not approximate room geometry.
    rootNodes:Object.freeze([...shared,...IVB_MJ01_SERVICE_ROOM_HOSTS.filter(n=>ceiling || n!==8003)]),
  });
};
export const IVB_MJ01_SERVICE_BUILDING_SCENES = Object.freeze({
  ...IVB47K_MJ01_BUILDING_SCENES,
  344:scene('V93_D2FWC_OWNER_B47K_IV_MJ01_REV2_WATER_ROOM_HOST_CEILING_SERVICE_2F_WORK_TEST_HOST_HOLD',true),
  345:scene('V93_D2FWC_OWNER_B47K_IV_MJ01_REV2_WATER_ROOM_HOST_CUTAWAY_SERVICE_2F_WORK_TEST_HOST_HOLD',false),
});
export const IVB_MJ01_SERVICE_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS,
  344:IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS[343],
  345:IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS[343],
});
