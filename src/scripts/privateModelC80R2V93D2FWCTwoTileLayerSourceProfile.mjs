// Source-exact, opt-in V93 D2F WC two-tile wall preview. WORK_TEST/HOST_HOLD only.
// G2b TYÖ EI AUTO ZIP Drive 194DUyh64t17e7VCj3xw65QEbgY2JSd_D.
// The two white tiles (~300 mm) and wall thickness (100 mm) are WORK ASSUMPTIONS.
// Existing opaque plexiglass nodes 5887/5888 remain unchanged. No CURRENT/as-built.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const TWOTILE_SOURCE_SHA256 = 'ae9d4dd107942988adc89e6480220a90b974986ef0e6a88bad1d62c868afada6';
export const TWOTILE_SOURCE_SCENE_COUNT = 307;
export const TWOTILE_FLOORS = V93_H35H38_FLOORS;
export const TWOTILE_OPTIN_SCENES = Object.freeze({ '2F': 305, BOTH: 306 });
export const TWOTILE_HOST_STATUS = 'WORK_TEST_HOST_HOLD_NOT_SURVEYED';

export const TWOTILE_BUILDING_PARTS = Object.freeze({
  ...V93_H35H38_BUILDING_PARTS,
  11479: Object.freeze({
    id: 'architecture-walls-interior', mesh: 4340,
    name: 'V93_D2FWC_WHITE_2TILE_PARTWALL_BODY_300MM_WORK_TEST',
  }),
  11480: Object.freeze({
    id: 'architecture-walls-interior', mesh: 4341,
    name: 'V93_D2FWC_WHITE_2TILE_PARTWALL_GROUT_150MM_WORK_TEST',
  }),
});

// Exact original V93 source scene 302 (2F) and 300 (BOTH) root order is retained.
// The old SYMBOLIC cover roots 5840/5841 were removed in the preceding opt-in
// no-overlay source; the real plexiglass 5887/5888 stays in the inherited scene.
// New part-wall roots only appear in opt-in scenes 305 and 306.
const exactScene = (baseIndex, name, floor, withWall = false) => {
  const base = V93_H35H38_BUILDING_SCENES[baseIndex];
  if (!base) throw new Error('Two-tile source base scene missing');
  const removed = [5840, 5841];
  // Base V93 is before no-overlay: these roots must be present to remove.
  if (!removed.every(node => base.rootNodes.includes(node))) {
    throw new Error('Two-tile source no-overlay root contract mismatch');
  }
  const rootNodes = base.rootNodes.filter(node => !removed.includes(node));
  if (withWall) rootNodes.push(11479, 11480);
  return Object.freeze({
    ...base, name, floor, rootNodes: Object.freeze(rootNodes),
    paths: Object.freeze({
      ...base.paths,
      ...(withWall ? {
        11479: Object.freeze([Object.freeze([11479])]),
        11480: Object.freeze([Object.freeze([11480])]),
      } : {}),
    }),
  });
};

export const TWOTILE_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: exactScene(302, 'V93_D2FWC_C80_018_PLEXI_ONLY_2F_OPTIN_WORK_TEST_HOST_HOLD_20261110', '2F'),
  304: exactScene(300, 'V93_D2FWC_C80_018_PLEXI_ONLY_BOTH_OPTIN_WORK_TEST_HOST_HOLD_20261110', 'BOTH'),
  305: exactScene(302, 'V93_D2FWC_V14_2TILE_PARTWALL_300MM_2F_OPTIN_WORK_TEST_HOST_HOLD_20261110', '2F', true),
  306: exactScene(300, 'V93_D2FWC_V14_2TILE_PARTWALL_300MM_BOTH_OPTIN_WORK_TEST_HOST_HOLD_20261110', 'BOTH', true),
});

// No technical root is newly approved in scenes 303-306.
export const TWOTILE_TECHNICAL_REVIEW_ROOTS = V93_H35H38_TECHNICAL_REVIEW_ROOTS;
