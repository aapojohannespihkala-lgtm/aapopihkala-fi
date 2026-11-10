// Source-exact V93 WORK_TEST/HOST_HOLD 2F WC owner-preferred one Ø125 IV
// lowtri fork plus owner-corrected floor-level under-vanity WC/hand-bidet pipes.
// G2b TYÖ EI AUTO https://drive.google.com/file/d/1UCkmB84uoJDt0tC0XJRF9TzH60SHvXYj/view
// No pipe diameter, physical joint, flow, hidden host or as-built verification.
// Derived append-only from the PR1903 lowtri source; old scenes/default unchanged.
import {
  IV125_LOWTRI_BUILDING_SCENES,
  IV125_LOWTRI_BUILDING_PARTS,
  IV125_LOWTRI_FLOORS,
  IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS,
  IV125_LOWTRI_FORK_ROOT,
} from './privateModelC80R2V93IV125LowtriLayerSourceProfile.mjs';

export const IVB47K_MJ01_SOURCE_SHA256 = 'd526e9c452c336416fdd6e8f670cb7a0289490738845e71e3dc60934cac3e79a';
export const IVB47K_MJ01_SOURCE_SCENE_COUNT = 344;
export const IVB47K_MJ01_BUILDING_PARTS = IV125_LOWTRI_BUILDING_PARTS;
export const IVB47K_MJ01_FLOORS = IV125_LOWTRI_FLOORS;
export const IVB47K_MJ01_OPTIN_SCENES = Object.freeze({
  NORMAL_2F: 340, MAINTENANCE_2F: 341, BOTH: 342, FOCUS: 343,
});
export const IVB47K_MJ01_FORK_ROOT = IV125_LOWTRI_FORK_ROOT; // n11658, 47,252 triangles
export const IVB47K_MJ01_FLOOR_WC_ROOT = 11666; // 7 source-linked donor components
export const IVB47K_MJ01_OLD_PARALLEL_ROOT = 11647;
export const IVB47K_MJ01_OLD_HIGH_TRI_ROOT = 11656;

const photoFloorGroup = Object.freeze({
  node: IVB47K_MJ01_FLOOR_WC_ROOT,
  name: 'V93_D2FWC_OWNER_MJ01_REV2_FLOORLINES_WC_BIDET_B_BRANCH_SOURCEEXACT_ROOT',
});
const exactCoFit = (oldIndex, newSceneName, oldTech, newTech) => {
  const original = IV125_LOWTRI_BUILDING_SCENES[oldIndex];
  if (!original || original.rootNodes.filter(node => node === oldTech).length !== 1 ||
      original.rootNodes.includes(IVB47K_MJ01_FLOOR_WC_ROOT)) {
    throw new Error('V93 IVB47K MJ01 cofit parent scene mismatch');
  }
  const roots = original.rootNodes.map(node => node === oldTech ? newTech : node);
  roots.push(IVB47K_MJ01_FLOOR_WC_ROOT);
  return Object.freeze({ ...original, name: newSceneName, rootNodes: Object.freeze(roots) });
};
export const IVB47K_MJ01_BUILDING_SCENES = Object.freeze({
  ...IV125_LOWTRI_BUILDING_SCENES,
  340: exactCoFit(336,
    'V93_D2FWC_OWNER_IV_D125_B_LIGHT_MJ01_REV2_CORRECT_FLOOR_2F_NORMAL_WORK_TEST_HOST_HOLD',
    11653, 11667),
  341: exactCoFit(337,
    'V93_D2FWC_OWNER_IV_D125_B_LIGHT_MJ01_REV2_CORRECT_FLOOR_2F_MAINT_WORK_TEST_HOST_HOLD',
    11653, 11667),
  342: exactCoFit(338,
    'V93_D2FWC_OWNER_IV_D125_B_LIGHT_MJ01_REV2_CORRECT_FLOOR_BOTH_WORK_TEST_HOST_HOLD',
    11654, 11668),
  343: Object.freeze({
    ...IV125_LOWTRI_BUILDING_SCENES[339],
    name: 'V93_D2FWC_OWNER_IV_B_LOWTRI_PLUS_MJ01_REV2_COMPONENT_FOCUS_WORK_TEST_HOST_HOLD',
    rootNodes: Object.freeze([
      ...IV125_LOWTRI_BUILDING_SCENES[339].rootNodes,
      IVB47K_MJ01_FLOOR_WC_ROOT,
    ]),
  }),
});
const technical = (oldIndex, oldNode, newNode, name) => {
  const prior = IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS[oldIndex];
  if (!prior || prior.filter(entry => entry.node === oldNode).length !== 1) {
    throw new Error('V93 IVB47K MJ01 technical root mismatch');
  }
  return Object.freeze([
    ...prior.map(entry => entry.node === oldNode ? Object.freeze({ node: newNode, name }) : entry),
    photoFloorGroup,
  ]);
};
export const IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS,
  340: technical(336,11653,11667,'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL'),
  341: technical(337,11653,11667,'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL'),
  342: technical(338,11654,11668,'V93_IV_B_MJ01_REV2_TECH_BOTH_EXCLUDE_HIST2015_HIGH_WALL'),
  343: Object.freeze([
    ...IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS[339],
    photoFloorGroup,
  ]),
});
