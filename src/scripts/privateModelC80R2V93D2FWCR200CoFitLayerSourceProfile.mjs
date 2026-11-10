// Source-exact combined V93 D2F WC R200 + 2TILE wall + opaque plexi WORK_TEST.
// G2b TYÖ EI AUTO ZIP Drive 1d-evo4r-QRCLEjmeQQzP5RNeABTz0r9b.
// R200 selected from owner-photo geometry, not a verified installed model.
// Physical XYZ, clearance, 100 mm wall thickness, plumbing and H37 remain HOLD.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const COFIT_SOURCE_SHA256 = 'dfdb2eed51acefde40905cfce4bf56969ab25077be0f2eb1df0f8cbf3fbde8cd';
export const COFIT_SOURCE_SCENE_COUNT = 307;
export const COFIT_FLOORS = V93_H35H38_FLOORS;
export const COFIT_OPTIN_SCENE = 306;
export const COFIT_R200_ROOT = 11520;
export const COFIT_WALL_ROOTS = Object.freeze([11535, 11536]);
export const COFIT_HOST_STATUS = 'WORK_TEST_HOST_HOLD_NOT_SURVEYED';
export const COFIT_NIBE_VARIANTS = Object.freeze({
  R150: Object.freeze({ scene: 303, root: 11479, sizeMm: Object.freeze([600, 615, 1120]) }),
  R200: Object.freeze({ scene: 304, root: 11494, sizeMm: Object.freeze([600, 615, 1310]) }),
  R300: Object.freeze({ scene: 305, root: 11509, sizeMm: Object.freeze([600, 615, 1710]) }),
});
export const COFIT_BUILDING_PARTS = Object.freeze({
  ...V93_H35H38_BUILDING_PARTS,
  11535: Object.freeze({
    id: 'architecture-walls-interior', mesh: 4378,
    name: 'V93_D2FWC_WHITE_2TILE_PARTWALL_BODY_300MM_WORK_TEST',
  }),
  11536: Object.freeze({
    id: 'architecture-walls-interior', mesh: 4379,
    name: 'V93_D2FWC_WHITE_2TILE_PARTWALL_GROUT_150MM_WORK_TEST',
  }),
});

// The GLB contains the complete original 0..302 scene contract.
// In added scenes 303..306 only obsolete symbolic NIBE roots are excluded;
// opaque plexiglass 5887/5888 remains, including original source node metadata.
const OLD_SYMBOLIC_ROOTS = Object.freeze([5839, 5840, 5841]);
const sourceScene = (name, addedRoots) => {
  const base = V93_H35H38_BUILDING_SCENES[302];
  if (!base || !OLD_SYMBOLIC_ROOTS.every(node => base.rootNodes.includes(node)))
    throw new Error('COFIT V93 scene302 root contract mismatch');
  const roots = Object.freeze([
    ...base.rootNodes.filter(node => !OLD_SYMBOLIC_ROOTS.includes(node)),
    ...addedRoots,
  ]);
  const paths = { ...base.paths };
  for (const node of OLD_SYMBOLIC_ROOTS) delete paths[node];
  if (addedRoots.includes(11535)) paths[11535] = Object.freeze([Object.freeze([11535])]);
  if (addedRoots.includes(11536)) paths[11536] = Object.freeze([Object.freeze([11536])]);
  return Object.freeze({
    ...base, name, floor: '2F', rootNodes: roots, paths: Object.freeze(paths),
  });
};

export const COFIT_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: sourceScene('V93_D2F_NIBE_R150_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', [11479]),
  304: sourceScene('V93_D2F_NIBE_R200_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', [11494]),
  305: sourceScene('V93_D2F_NIBE_R300_600x615_SOURCE_MANUAL_OPTIN_WORK_TEST_HOST_HOLD', [11509]),
  306: sourceScene('V93_D2FWC_NIBE_R200_COFIT_2TILE_300MM_2F_OPTIN_WORK_TEST_HOST_HOLD_20261110',
    [COFIT_R200_ROOT, ...COFIT_WALL_ROOTS]),
});

// No new technical review root is physically verified by this preview.
export const COFIT_TECHNICAL_REVIEW_ROOTS = V93_H35H38_TECHNICAL_REVIEW_ROOTS;
