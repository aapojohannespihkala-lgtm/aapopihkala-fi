// Source-exact V93 1F terrace + 2F balcony double covered outlets, WORK_TEST/HOST_HOLD.
// Owner approved 2026 photo positions, 2 socket positions and protective plastic covers.
// GLB: G2b TYÖ EI AUTO https://drive.google.com/file/d/17jmjNQIMhlwGbyq6pKjCJR_8euQsfMo5/view
// Not CURRENT/as-built. Exact SKU, XY/Z, cover opening angle and physical wiring unverified.
import {
  V93_H35H38_BUILDING_PARTS, V93_H35H38_BUILDING_SCENES,
  V93_H35H38_FLOORS, V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';

export const OUTLETS2_SOURCE_SHA256 = '5539955b44dcd3bac48710cf81ecc307653e685956439f5db713f517ccf94e12';
export const OUTLETS2_SOURCE_SCENE_COUNT = 309;
export const OUTLETS2_FLOORS = V93_H35H38_FLOORS; // 295/296/297 unchanged, default292 unchanged
export const OUTLETS2_BUILDING_PARTS = V93_H35H38_BUILDING_PARTS;
export const OUTLETS2_OPTIN_SCENES = Object.freeze({ '1F': 306, '2F': 307, BOTH: 308 });
export const OUTLETS2_SOURCE_ROOTS = Object.freeze({
  '1F': Object.freeze({ node: 11500, name: 'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD' }),
  '2F': Object.freeze({ node: 11514, name: 'D_2F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD' }),
});
export const OUTLETS2_HOST_STATUS = 'WORK_TEST_HOST_HOLD_NOT_SURVEYED';

const appended = (baseIndex, name, additions) => {
  const base = V93_H35H38_BUILDING_SCENES[baseIndex];
  if (!base) throw new Error('V93 double-outlet base scene missing');
  return Object.freeze({
    ...base, name,
    rootNodes: Object.freeze([...base.rootNodes, ...additions]),
    // Inherited source paths and part IDs stay exact. The added sockets
    // are technical-electrical, not fabricated architecture part IDs.
  });
};
export const OUTLETS2_BUILDING_SCENES = Object.freeze({
  ...V93_H35H38_BUILDING_SCENES,
  303: appended(301, 'V93_D_OUTSIDE_SOCKET_1F_APPROVED_20261110_WORK_TEST_HOST_HOLD', [11482]),
  304: appended(302, 'V93_D_OUTSIDE_SOCKET_2F_APPROVED_20261110_WORK_TEST_HOST_HOLD', [11486]),
  305: appended(300, 'V93_D_OUTSIDE_SOCKETS_BOTH_APPROVED_20261110_WORK_TEST_HOST_HOLD', [11482, 11486]),
  306: appended(301, 'V93_D_1F_TERRACE_DOUBLE_COVERED_OUTLET_OWNER_20261110_WORK_TEST_HOST_HOLD', [11500]),
  307: appended(302, 'V93_D_2F_BALCONY_DOUBLE_COVERED_OUTLET_OWNER_20261110_WORK_TEST_HOST_HOLD', [11514]),
  308: appended(300, 'V93_D_BOTH_DOUBLE_COVERED_OUTLETS_OWNER_20261110_WORK_TEST_HOST_HOLD', [11500, 11514]),
});
export const OUTLETS2_TECHNICAL_REVIEW_ROOTS = Object.freeze({
  ...V93_H35H38_TECHNICAL_REVIEW_ROOTS,
  306: Object.freeze([...(V93_H35H38_TECHNICAL_REVIEW_ROOTS[295] ?? []), OUTLETS2_SOURCE_ROOTS['1F']]),
  307: Object.freeze([...(V93_H35H38_TECHNICAL_REVIEW_ROOTS[296] ?? []), OUTLETS2_SOURCE_ROOTS['2F']]),
  308: Object.freeze([...(V93_H35H38_TECHNICAL_REVIEW_ROOTS[297] ?? []), OUTLETS2_SOURCE_ROOTS['1F'], OUTLETS2_SOURCE_ROOTS['2F']]),
});
