/**
 * High 1: opt-in, read-only building-part bindings for
 * privateModelLayerScopedPresentationBridge.ts.
 *
 * The caller MUST supply two independently obtained SHA-256 strings:
 * the selected source's verified manifest SHA and the hash computed from
 * the actual loaded GLB bytes. The resolver does not hash network content.
 * Rebuild the result for EVERY source, scene, scope or storey change.
 *
 * No appearance, coordinate, material or name-pattern classification. Source
 * glTF extras or the narrowly pinned V26 node profile are authoritative.
 * Profile names verify identity only; runtime-injected userData is not evidence.
 * An unclassified object is never passed to the presentation adapter.
 */

// Source-bound presentation classification of the published V26 GLB. These
// are exact node/mesh/name/parent routes read from that immutable source,
// not name-pattern or appearance inference. WORK_TEST status is unchanged.
const V26_SHA = 'cff2dbead53b7836747e10ef359637114ff723690ec380e313cec817e4f71d31';
const v26Parts = Object.freeze({
  "6376": {"id":"architecture-walls-exterior","mesh":1833,"name":"HI04_C80R2_WEST_OUTER_1F_PHYSICAL_WALL_SCENE1__D1F_C048_COW_WHITE"},
  "6391": {"id":"architecture-walls-exterior","mesh":1833,"name":"HI04_C80R2_WEST_OUTER_1F_PHYSICAL_WALL_SCENE0__D1F_C048_COW_WHITE"},
  "6431": {"id":"architecture-walls-exterior","mesh":1849,"name":"HI07_C80R1_007_D2F_BEDROOM_NORTH_APERTURED_FACADE_FACE_WORK_TEST__SCENE_1__C80_043_WHITE_SC41__IN_44SCENE_2F__REBASED_IN_WP6WP8G3_46SCENE_6431"},
  "6432": {"id":"architecture-walls-exterior","mesh":1850,"name":"HI04_C80R2_WEST_OUTER_2F_PHYSICAL_WALL_SCENE2__C80_043_WHITE_SC41__IN_44SCENE_2F__REBASED_IN_WP6WP8G3_46SCENE_6432"},
  "6437": {"id":"architecture-walls-exterior","mesh":1849,"name":"HI07_C80R1_007_D2F_BEDROOM_NORTH_APERTURED_FACADE_FACE_WORK_TEST__SCENE_0__C80_043_WHITE_SC42__IN_44SCENE_BOTH__REBASED_IN_WP6WP8G3_46SCENE_6437"},
  "6438": {"id":"architecture-walls-exterior","mesh":1850,"name":"HI04_C80R2_WEST_OUTER_2F_PHYSICAL_WALL_SCENE0__C80_043_WHITE_SC42__IN_44SCENE_BOTH__REBASED_IN_WP6WP8G3_46SCENE_6438"},
  "7594": {"id":"architecture-walls-exterior","mesh":2347,"name":"C80R2_V9_D1F_SOUTH_TERRACE_WALL_220MM_PHOTO_APERTURES_WORK_TEST"},
  "7999": {"id":"architecture-walls-exterior","mesh":2449,"name":"HI06_NORTH_APERTURED_FACADE_SCENE1__D1F_C048_COW_WHITE_V15_DOOR_HOLE_2P40_3P354"},
  "8002": {"id":"architecture-walls-exterior","mesh":2448,"name":"HI06_NORTH_APERTURED_FACADE_SCENE0__D1F_C048_COW_WHITE_V15_DOOR_HOLE_2P40_3P354"},
  "6377": {"id":"architecture-walls-party","mesh":1834,"name":"HI04_C80R2_DC_PARTY_1F_PHYSICAL_WALL_SCENE1__D1F_C048_COW_WHITE"},
  "6392": {"id":"architecture-walls-party","mesh":1834,"name":"HI04_C80R2_DC_PARTY_1F_PHYSICAL_WALL_SCENE0__D1F_C048_COW_WHITE"},
  "6433": {"id":"architecture-walls-party","mesh":1851,"name":"HI04_C80R2_DC_PARTY_2F_PHYSICAL_WALL_SCENE2__C80_043_WHITE_SC41__IN_44SCENE_2F__REBASED_IN_WP6WP8G3_46SCENE_6433"},
  "6439": {"id":"architecture-walls-party","mesh":1851,"name":"HI04_C80R2_DC_PARTY_2F_PHYSICAL_WALL_SCENE0__C80_043_WHITE_SC42__IN_44SCENE_BOTH__REBASED_IN_WP6WP8G3_46SCENE_6439"},
  "7645": {"id":"architecture-walls-party","mesh":1924,"name":"C80R2_DC_PARTY_WALL_TERRACE_SIDE_1F_OPAQUE_WHITE_D1F_WORK_TEST_V9_PHOTO_POS"},
  "7706": {"id":"architecture-walls-party","mesh":1920,"name":"C80R2_DC_PARTY_WALL_TERRACE_SIDE_1F_OPAQUE_WHITE_WORK_TEST_V9_PHOTO_POS"},
  "7722": {"id":"architecture-walls-party","mesh":2355,"name":"C80R2_EAST_DC_PARTY_WALL_UNIFIED_WHITE_PLANE_AND_WING_BOTH_WORK_TEST_HOST_HOLD_20261101_V11_STEPPED_WEST_FACE"},
  "8197": {"id":"architecture-walls-party","mesh":2587,"name":"C80R2_V20_D1F_TERRACE_DC_SIDE_WALL_WHITE_VERTICAL_SIDING_PITCH150"},
  "7221": {"id":"architecture-walls-interior","mesh":2152,"name":"C80R2_V8_D1F_UNIFIED_INTERIOR_WALLS_INCL_SAUNA_WALL_WORK_TEST_HOST_HOLD_20261101"},
  "7222": {"id":"architecture-walls-interior","mesh":2153,"name":"C80R2_V8_D2F_UNIFIED_INTERIOR_WALLS_WORK_TEST_HOST_HOLD_20261101"},
  "7223": {"id":"architecture-walls-interior","mesh":2154,"name":"C80R2_V8_D2F_STAIR_LOW_WALL_1125_WHITE_WORK_TEST"},
  "8007": {"id":"architecture-walls-interior","mesh":2451,"name":"C80R2_V16_D1F_SAUNA_SIDE_WALLS_HORIZONTAL_PANELLING_HIST2024"},
  "8152": {"id":"architecture-walls-interior","mesh":2557,"name":"C80R2_V18_K17_LOWER_FLIGHT_NORTH_SIDE_SOLID_WALL_TO_FLOOR_AND_GAP_BACK"},
  "8193": {"id":"architecture-walls-interior","mesh":2583,"name":"C80R2_V20_K17_UNDERSTAIR_X491_SLOPE_AND_VERTICAL_WALL"},
  "8196": {"id":"architecture-walls-interior","mesh":2586,"name":"C80R2_V20_K17_WHITE_WALL_WEST_OF_DARK_WALL_Y6P256_6P268"},
  "8199": {"id":"architecture-walls-interior","mesh":2589,"name":"C80R2_V20_D2F_PW26_PINK_WEST_WALL_CONTINUOUS_Y0P025_5P05"},
  "5631": {"id":"architecture-floors","mesh":1664,"name":"C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_SCENE2_WORK_TEST"},
  "6564": {"id":"architecture-floors","mesh":1888,"name":"C80R2_INTEGRATED_K11R2_D2F_DARK_GRAPHITE_PHOTO_CURRENT_FLOOR_EXACT_SOURCE_GEOMETRY"},
  "8191": {"id":"architecture-floors","mesh":2581,"name":"C80R2_V20_D1F_GREY_450_TILE_FLOOR_ALL_INTERIOR_EXCEPT_KPH_SAUNA"},
  "8198": {"id":"architecture-floors","mesh":2588,"name":"C80R2_V20_D2F_WHOLE_FLOOR_PALE_PLANK_CONTINUOUS_EXCEPT_WC_STAIR"},
  "6497": {"id":"architecture-ceilings","mesh":1860,"name":"C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_1F_NONPHYSICAL_OPTIN"},
  "6498": {"id":"architecture-ceilings","mesh":1860,"name":"C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_BOTH_NONPHYSICAL_OPTIN"},
  "8003": {"id":"architecture-ceilings","mesh":2450,"name":"C80R2_V16_D2F_INNER_CEILING_WHITE_VISIBLE_FROM_BELOW_ONLY"},
  "7289": {"id":"architecture-doors","mesh":2214,"name":"D2015_1F_DOOR_LEAF_VH_NORTH_PLAN_PROXY_V8"},
  "7290": {"id":"architecture-doors","mesh":2215,"name":"D2015_1F_DOOR_LEAF_VARASTO_PLAN_PROXY_V8"},
  "7445": {"id":"architecture-doors","mesh":2214,"name":"D2015_1F_DOOR_LEAF_VH_NORTH_PLAN_PROXY_V8"},
  "7446": {"id":"architecture-doors","mesh":2215,"name":"D2015_1F_DOOR_LEAF_VARASTO_PLAN_PROXY_V8"},
  "7296": {"id":"architecture-doors","mesh":2216,"name":"SC3_AXISFIX_LeafSolid_Lower_V7BROWN_V8"},
  "7297": {"id":"architecture-doors","mesh":2217,"name":"SC3_AXISFIX_LeafSolid_Upper_V7BROWN_V8"},
  "7298": {"id":"architecture-doors","mesh":2218,"name":"SC3_AXISFIX_LeafSolid_LeftStile_V7BROWN_V8"},
  "7299": {"id":"architecture-doors","mesh":2219,"name":"SC3_AXISFIX_LeafSolid_RightStile_V7BROWN_V8"},
  "7459": {"id":"architecture-doors","mesh":2216,"name":"SC3_AXISFIX_LeafSolid_Lower_V7BROWN_V8"},
  "7460": {"id":"architecture-doors","mesh":2217,"name":"SC3_AXISFIX_LeafSolid_Upper_V7BROWN_V8"},
  "7461": {"id":"architecture-doors","mesh":2218,"name":"SC3_AXISFIX_LeafSolid_LeftStile_V7BROWN_V8"},
  "7462": {"id":"architecture-doors","mesh":2219,"name":"SC3_AXISFIX_LeafSolid_RightStile_V7BROWN_V8"},
  "8028": {"id":"architecture-doors","mesh":2461,"name":"ROOM3_LEAF_OWNER_OPEN_NORTH_FROM_WEST_JAMB_K1_V8_V17"},
  "8030": {"id":"architecture-doors","mesh":2462,"name":"ROOM4_LEAF_OWNER_OPEN_NORTH_FROM_EAST_JAMB_K1_V8_V17"},
  "8031": {"id":"architecture-doors","mesh":2463,"name":"D2F_2015_WC_DOOR_LEAF_OPEN_FREE_EDGE_10MM_CLEARANCE_WORK_TEST_V8_V17"},
  "8088": {"id":"architecture-doors","mesh":2507,"name":"ROOM3_LEAF_OWNER_OPEN_NORTH_FROM_WEST_JAMB_K1_V8_V17"},
  "8090": {"id":"architecture-doors","mesh":2508,"name":"ROOM4_LEAF_OWNER_OPEN_NORTH_FROM_EAST_JAMB_K1_V8_V17"},
  "8091": {"id":"architecture-doors","mesh":2509,"name":"D2F_2015_WC_DOOR_LEAF_OPEN_FREE_EDGE_10MM_CLEARANCE_WORK_TEST_V8_V17"},
  "5290": {"id":"architecture-windows","mesh":1300,"name":"HI07_D2F_SOURCE_BOUND_K16A_GLASS_G2_WINDOW_S_D_2F_001"},
  "5296": {"id":"architecture-windows","mesh":1300,"name":"HI07_D2F_SOURCE_BOUND_K16A_GLASS_G2_WINDOW_S_D_2F_001"},
  "5302": {"id":"architecture-windows","mesh":1305,"name":"HI07_D2F_SOURCE_BOUND_K16A_GLASS_G2_WINDOW_S_D_2F_002"},
  "5308": {"id":"architecture-windows","mesh":1305,"name":"HI07_D2F_SOURCE_BOUND_K16A_GLASS_G2_WINDOW_S_D_2F_002"},
  "5323": {"id":"architecture-windows","mesh":1570,"name":"HI07_NORTH_WINDOW_GLASS_2675_SCENE2"},
  "5327": {"id":"architecture-windows","mesh":1572,"name":"HI07_NORTH_WINDOW_GLASS_2676_SCENE2"},
  "7357": {"id":"architecture-windows","mesh":2254,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_LEFT_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7358": {"id":"architecture-windows","mesh":2255,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_RIGHT_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7359": {"id":"architecture-windows","mesh":2256,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_BOTTOM_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7360": {"id":"architecture-windows","mesh":2257,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_TOP_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7362": {"id":"architecture-windows","mesh":2258,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_LEFT_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7363": {"id":"architecture-windows","mesh":2259,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_RIGHT_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7364": {"id":"architecture-windows","mesh":2260,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_BOTTOM_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7365": {"id":"architecture-windows","mesh":2261,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_TOP_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7367": {"id":"architecture-windows","mesh":2262,"name":"HI07_NORTH_WINDOW_FRAME_2675_SCENE2_V7BROWN_V8"},
  "7368": {"id":"architecture-windows","mesh":2263,"name":"HI07_NORTH_WINDOW_FRAME_2676_SCENE2_V7BROWN_V8"},
  "7492": {"id":"architecture-windows","mesh":2254,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_LEFT_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7493": {"id":"architecture-windows","mesh":2255,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_RIGHT_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7494": {"id":"architecture-windows","mesh":2256,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_BOTTOM_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7495": {"id":"architecture-windows","mesh":2257,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_TOP_G2_WINDOW_S_D_2F_001_V7BROWN_V8"},
  "7497": {"id":"architecture-windows","mesh":2258,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_LEFT_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7498": {"id":"architecture-windows","mesh":2259,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_RIGHT_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7499": {"id":"architecture-windows","mesh":2260,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_BOTTOM_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7500": {"id":"architecture-windows","mesh":2261,"name":"HI07_D2F_SOURCE_BOUND_K16A_FRAME_TOP_G2_WINDOW_S_D_2F_002_V7BROWN_V8"},
  "7502": {"id":"architecture-windows","mesh":2262,"name":"HI07_NORTH_WINDOW_FRAME_2675_SCENE0_V7BROWN_V8"},
  "7503": {"id":"architecture-windows","mesh":2263,"name":"HI07_NORTH_WINDOW_FRAME_2676_SCENE0_V7BROWN_V8"},
  "8310": {"id":"architecture-fixtures","mesh":2686,"name":"HOB32_ISLAND_LIGHT_BODY_LEAF_137_V20"},
  "6656": {"id":"roof","mesh":1941,"name":"ARK3_1985_GABLE_ROOF_EXTENDED_TO_EAST_PLANE_WORK_TEST"},
});
const v26Scenes = Object.freeze({
  "162": {"floor":"2F","name":"C80R2_V20_D2F_FLOOR_PINK_POST_HOOD_ISLAND_KIV_WORK_TEST_HOST_HOLD_20261102","paths":{"8028":[[8316,8315,8032,8029,8028]],"8030":[[8316,8315,8032,8030]],"8031":[[8316,8315,8032,8031]],"8310":[[8316,8315,8314,8311,8310]],"6431":[[6431]],"6432":[[6432]],"6433":[[6433]],"5296":[[7361,5296]],"7357":[[7361,7357]],"7358":[[7361,7358]],"7359":[[7361,7359]],"7360":[[7361,7360]],"5308":[[7366,5308]],"7362":[[7366,7362]],"7363":[[7366,7363]],"7364":[[7366,7364]],"7365":[[7366,7365]],"7367":[[7367]],"5323":[[5323]],"7368":[[7368]],"5327":[[5327]],"5631":[[5631]],"8003":[[8003]],"6564":[[6564]],"7222":[[7222]],"7223":[[7223]],"8198":[[8198]],"8199":[[8199]]}},
  "174": {"floor":"1F","name":"C80R2_V26_D1F_STAIR_RAIL_LANDING_END_PLYWOOD_WORK_TEST_HOST_HOLD_20261102","paths":{"7289":[[7295,7294,7291,7289]],"7290":[[7295,7294,7291,7290]],"7296":[[7998,7997,7296]],"7297":[[7998,7997,7297]],"7298":[[7998,7997,7298]],"7299":[[7998,7997,7299]],"7645":[[7646,7645]],"6377":[[6377]],"7999":[[7999]],"6497":[[6497]],"6376":[[6376]],"7221":[[7221]],"7594":[[7594]],"8007":[[8007]],"8152":[[8152]],"8191":[[8191]],"8193":[[8193]],"8196":[[8196]],"8197":[[8197]]}},
  "175": {"floor":"BOTH","name":"C80R2_V26_BOTH_STAIR_RAIL_LANDING_END_PLYWOOD_WORK_TEST_HOST_HOLD_20261102","paths":{"8088":[[8428,8427,8092,8089,8088]],"8090":[[8428,8427,8092,8090]],"8091":[[8428,8427,8092,8091]],"7445":[[8428,7450,7447,7445]],"7446":[[8428,7450,7447,7446]],"7459":[[8001,8000,7459]],"7460":[[8001,8000,7460]],"7461":[[8001,8000,7461]],"7462":[[8001,8000,7462]],"7706":[[7707,7706]],"6437":[[6437]],"6438":[[6438]],"6392":[[6392]],"6439":[[6439]],"8002":[[8002]],"5290":[[7496,5290]],"7492":[[7496,7492]],"7493":[[7496,7493]],"7494":[[7496,7494]],"7495":[[7496,7495]],"5302":[[7501,5302]],"7497":[[7501,7497]],"7498":[[7501,7498]],"7499":[[7501,7499]],"7500":[[7501,7500]],"7502":[[7502]],"7503":[[7503]],"8003":[[8003]],"6498":[[6498]],"6391":[[6391]],"6656":[[7723,6656]],"7722":[[7723,7722]],"7221":[[7221]],"7222":[[7222]],"7223":[[7223]],"7594":[[7594]],"8007":[[8007]],"8152":[[8152]],"8191":[[8191]],"8193":[[8193]],"8196":[[8196]],"8197":[[8197]],"8198":[[8198]],"8199":[[8199]]}},
});

const SHA256 = /^[a-f0-9]{64}$/i;
const FLOOR = new Set(['1F', '2F', 'BOTH']);
const AREA = new Set(['D', 'WHOLE']);
const ACTIVE_PHASE = 'ACTIVE_IN_SELECTED_WORKTEST';
const acceptedRoles = new Set(['CONTENT', 'SHARED_BOUNDARY', 'OUTDOOR_D', 'UPPER_OCCLUDER']);
const allowedAreas = new Set(['D', 'A', 'B', 'C', 'SHARED_CD', 'SHARED_OTHER']);
const familyIds = Object.freeze({
  WALL: 'architecture-walls',
  DOOR: 'architecture-doors',
  WINDOW: 'architecture-windows',
  FLOOR: 'architecture-floors',
  CEILING: 'architecture-ceilings',
  FIXTURE: 'architecture-fixtures',
});
const sourceTags = Object.freeze([
  'G2Id', 'ParentG2Id', 'identity', 'representationKind', 'presentationLayer',
  'presentationOnly', 'PresentationOnly', 'sourceRole', 'markerType',
  'physicalClaim', 'ModelStage', 'ylisViewScope',
]);

const unavailable = (reason, scene = null) => ({
  sourceVerified: false,
  bindings: [],
  frame: { activeSceneRoot: scene, availableNodeIds: [], gates: new Map() },
  evidence: [],
  excluded: [{ reason }],
});

const isMesh = (object) => object?.isMesh === true;
const associationNode = (associations, object) => {
  const index = associations?.get(object)?.nodes;
  return Number.isInteger(index) && index >= 0 ? index : null;
};
const isValidScope = (value) =>
  value && typeof value === 'object' && typeof value.objectKey === 'string' &&
  value.objectKey.trim() &&
  allowedAreas.has(value.apartmentScope) &&
  ['1F', '2F', 'BOTH', 'OUTSIDE_1F', 'OUTSIDE_2F', 'ROOF', 'UNKNOWN'].includes(value.storeyScope) &&
  acceptedRoles.has(value.role) && value.phaseScope === ACTIVE_PHASE;

const exactFamily = (value) => {
  const id = typeof value === 'string' ? value.toUpperCase() : '';
  if (/^G2_WALL_(EXT|PART|INT)_/.test(id)) {
    return {
      family: 'WALL',
      layerId: id.startsWith('G2_WALL_EXT_') ? 'architecture-walls-exterior'
        : id.startsWith('G2_WALL_PART_') ? 'architecture-walls-party'
          : 'architecture-walls-interior',
    };
  }
  if (id.startsWith('G2_FURN_')) return { family: 'FIXTURE', layerId: 'architecture-fixtures' };
  if (/^G2_WALL_/.test(id)) return { family: 'WALL', layerId: 'architecture-walls' };
  for (const family of Object.keys(familyIds)) {
    if (id.startsWith('G2_' + family + '_')) return { family, layerId: familyIds[family] };
  }
  // Roof has an existing independent visibility/opacity controller. Binding
  // it here would give two controllers ownership of the same runtime meshes.
  if (id.startsWith('G2_ROOF_')) return { family: 'ROOF', layerId: null };
  return null;
};

const referenceOnly = (meta) => {
  const role = String(meta.sourceRole ?? '').toUpperCase();
  const kind = String(meta.representationKind ?? '').toUpperCase();
  const layer = String(meta.presentationLayer ?? '').toUpperCase();
  const marker = String(meta.markerType ?? '').toUpperCase();
  return meta.presentationOnly === true || meta.PresentationOnly === true ||
    /REFERENCE|SOURCE_ONLY|MEASURE|GUIDE|HELPER|HISTORICAL/.test(role) ||
    /REFERENCE|SOURCE_ONLY|MEASURE|GUIDE|HELPER|FOOTPRINT|ANCHOR|VOID|OPENING/.test(kind) ||
    /REFERENCE|MEASURE|GUIDE|HELPER|CURRENT_D_OUTLINE/.test(layer) ||
    /REFERENCE|MEASURE|GUIDE|HELPER/.test(marker) ||
    meta.physicalClaim === false;
};

const scopeGate = (scope, selectedArea, selectedFloor) => {
  if (!isValidScope(scope)) return { scopeAllowed: false, floorAllowed: false };
  const scopeAllowed = selectedArea === 'WHOLE'
    ? true
    : scope.apartmentScope === 'D' ||
      (scope.apartmentScope === 'SHARED_CD' && scope.role === 'SHARED_BOUNDARY');
  // BOTH elements cannot be assumed to have been split into 1F and 2F.
  const floorAllowed = selectedFloor === 'BOTH'
    ? scope.storeyScope !== 'UNKNOWN'
    : scope.storeyScope === selectedFloor ||
      scope.storeyScope === 'OUTSIDE_' + selectedFloor;
  return { scopeAllowed, floorAllowed };
};

const makeNodeHierarchy = (json, sceneIndex) => {
  const nodes = json?.nodes;
  const sourceScene = json?.scenes?.[sceneIndex];
  if (!Array.isArray(nodes) || !Array.isArray(sourceScene?.nodes) ||
      new Set(sourceScene.nodes).size !== sourceScene.nodes.length) return null;
  const paths = new Map();
  const walk = (index, parentPath) => {
    if (!Number.isInteger(index) || index < 0 || index >= nodes.length ||
        parentPath.includes(index) || parentPath.length > 128) return false;
    const node = nodes[index];
    const children = node?.children ?? [];
    if (!node || !Array.isArray(children) || new Set(children).size !== children.length) return false;
    const path = [...parentPath, index];
    const known = paths.get(index) ?? [];
    if (known.length >= 64) return false;
    paths.set(index, [...known, path]);
    return children.every(child => walk(child, path));
  };
  if (!sourceScene.nodes.every(root => walk(root, []))) return null;
  return { nodes, paths };
};

const samePath = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);

const ancestorSourcePath = (object, scene, associations, hierarchy) => {
  let cursor = object;
  const reversed = [];
  let sourceObject = null;
  let depth = 0;
  while (cursor && cursor !== scene && depth++ < 128) {
    const index = associationNode(associations, cursor);
    if (index !== null && index !== reversed[reversed.length - 1]) {
      if (!hierarchy.paths.has(index)) return null;
      reversed.push(index);
      sourceObject ??= cursor;
    }
    cursor = cursor.parent;
  }
  if (cursor !== scene || reversed.length === 0) return null;
  const path = reversed.reverse();
  const index = path[path.length - 1];
  if (!hierarchy.paths.get(index).some(allowed => samePath(allowed, path))) return null;
  return { index, path, sourceObject };
};

const sourceMetadata = (path, hierarchy) => {
  const meta = {};
  for (const index of [...path].reverse()) {
    const extras = hierarchy.nodes[index]?.extras;
    if (extras && typeof extras === 'object' && !Array.isArray(extras)) {
      for (const key of sourceTags) {
        if (!Object.hasOwn(meta, key) && Object.hasOwn(extras, key)) meta[key] = extras[key];
      }
    }
  }
  return meta;
};

const matchesSourceName = (actual, expected) => {
  const name = String(actual ?? '');
  if (name === expected) return true;
  const safe = expected.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
  return name === safe || (name.startsWith(safe + '_') && /^\d+$/.test(name.slice(safe.length + 1)));
};

const v26SourcePart = (json, sha, sceneIndex, floor, source, associations, mesh) => {
  const scene = v26Scenes[sceneIndex];
  const part = v26Parts[source.index];
  const def = json.nodes[source.index];
  if (sha !== V26_SHA || !scene || !part || scene.floor !== floor ||
      json.scenes.length !== 176 || json.scenes[sceneIndex]?.name !== scene.name ||
      def?.mesh !== part.mesh || def?.name !== part.name ||
      !scene.paths[source.index]?.some(path => samePath(path, source.path)) ||
      !matchesSourceName(source.sourceObject.name, part.name)) return null;
  const primitive = associations.get(mesh);
  if (primitive?.meshes !== undefined && primitive.meshes !== part.mesh) return null;
  return part;
};

const sourceAncestorsVisible = (mesh, scene) => {
  let node = mesh;
  while (node) {
    if (node.visible !== true) return false;
    if (node === scene) return true;
    node = node.parent;
  }
  return false;
};

/**
 * @param {{
 *   gltf: { scenes: any[], parser: { json: any, associations: Map<any, any> } },
 *   expectedSourceSha256: string,
 *   loadedSourceSha256: string,
 *   sceneIndex: number,
 *   activeSceneRoot: any,
 *   area: 'D'|'WHOLE',
 *   floor: '1F'|'2F'|'BOTH'
 * }} input
 *
 * @returns {{sourceVerified:boolean, bindings: Array<{id:string,root:any}>,
 * frame:{activeSceneRoot:any,availableNodeIds:string[],gates:Map<any,object>},
 * evidence:Array<{id:string,sourceNodeIndex:number,objectKey:string,storeyScope:string,apartmentScope:string}>,
 * excluded:Array<{reason:string,sourceNodeIndex?:number}>}}
 */
export function resolveBuildingPartLayerBindings(input) {
  const { gltf, expectedSourceSha256, loadedSourceSha256, sceneIndex,
    activeSceneRoot: scene, area, floor } = input ?? {};
  if (!SHA256.test(expectedSourceSha256 ?? '') ||
      expectedSourceSha256.toLowerCase() !== String(loadedSourceSha256).toLowerCase()) {
    return unavailable('SOURCE_SHA_MISMATCH', scene);
  }
  if (!AREA.has(area) || !FLOOR.has(floor)) return unavailable('UNKNOWN_SCOPE', scene);
  if (!Number.isInteger(sceneIndex) || gltf?.scenes?.[sceneIndex] !== scene)
    return unavailable('SCENE_MISMATCH', scene);
  const hierarchy = makeNodeHierarchy(gltf?.parser?.json, sceneIndex);
  const associations = gltf?.parser?.associations;
  if (!hierarchy || !(associations instanceof Map) || typeof scene?.traverse !== 'function')
    return unavailable('MISSING_GLTF_SOURCE_MAP', scene);
  const bindings = [];
  const gates = new Map();
  const evidence = [];
  const excluded = [];
  const seenMeshes = new Set();
  scene.traverse((object) => {
    if (!isMesh(object) || seenMeshes.has(object)) return;
    seenMeshes.add(object);
    // The presentation bridge forbids ancestor/descendant layer roots.
    // A mesh containing mesh descendants is ambiguous: do not control
    // either half of an overlapping mesh hierarchy.
    let ancestor = object.parent;
    let nested = false;
    while (ancestor && ancestor !== scene) {
      if (isMesh(ancestor)) { nested = true; break; }
      ancestor = ancestor.parent;
    }
    if (!nested) object.traverse((child) => {
      if (child !== object && isMesh(child)) nested = true;
    });
    if (nested) {
      excluded.push({ reason: 'NESTED_MESH_HIERARCHY' });
      return;
    }
    const source = ancestorSourcePath(object, scene, associations, hierarchy);
    if (source === null) {
      excluded.push({ reason: 'UNBOUND_SOURCE_NODE' });
      return;
    }
    const sourceNodeIndex = source.index;
    const meta = sourceMetadata(source.path, hierarchy);
    const profile = v26SourcePart(gltf.parser.json, String(loadedSourceSha256).toLowerCase(),
      sceneIndex, floor, source, associations, object);
    const explicit = exactFamily(meta.G2Id) ?? exactFamily(meta.ParentG2Id) ?? exactFamily(meta.identity);
    const scope = meta.ylisViewScope;
    const id = profile?.id ?? explicit?.layerId;
    if (!id || (!profile && (referenceOnly(meta) || !isValidScope(scope)))) {
      excluded.push({ reason: explicit?.family === 'ROOF' ? 'LEGACY_ROOF_CONTROLLER' :
        'UNCLASSIFIED_OR_REFERENCE', sourceNodeIndex });
      return;
    }
    // The V26 profile proves exact original D-scene and floor membership.
    // Any explicit contradictory area/scope still wins over the profile.
    const bound = profile && !scope
      ? { scopeAllowed: true, floorAllowed: true }
      : scopeGate(scope, area, floor);
    const gate = {
      sourceAllowed: sourceAncestorsVisible(object, scene),
      scopeAllowed: bound.scopeAllowed,
      floorAllowed: profile && isValidScope(scope) && scope.apartmentScope === 'D'
        ? true : bound.floorAllowed,
    };
    // Never bind disallowed meshes: restoring a legacy presentation would
    // otherwise turn a scope/floor-hidden mesh back on during dispose().
    if (!gate.sourceAllowed || !gate.scopeAllowed || !gate.floorAllowed) {
      excluded.push({ reason: 'SOURCE_SCOPE_OR_FLOOR_BLOCKED', sourceNodeIndex });
      return;
    }
    bindings.push({ id, root: object });
    gates.set(object, gate);
    evidence.push({
      id, sourceNodeIndex,
      sourceMeshIndex: hierarchy.nodes[sourceNodeIndex]?.mesh ?? null,
      sourceNodePath: [...source.path], sceneIndex,
      sourceSha256: String(loadedSourceSha256).toLowerCase(),
      sourceLinks: hierarchy.nodes[sourceNodeIndex]?.extras?.sourceLinks ?? [],
      objectKey: scope?.objectKey ?? `V26:${sceneIndex}:${sourceNodeIndex}`,
      storeyScope: scope?.storeyScope ?? floor,
      apartmentScope: scope?.apartmentScope ?? 'D',
      bindingKind: profile ? 'EXACT_V26_SOURCE_PROFILE' : 'EXPLICIT_SOURCE_METADATA',
    });
  });
  return {
    sourceVerified: true,
    bindings,
    frame: {
      activeSceneRoot: scene,
      availableNodeIds: [...new Set(bindings.map((binding) => binding.id))],
      gates,
    },
    evidence,
    excluded,
  };
}
