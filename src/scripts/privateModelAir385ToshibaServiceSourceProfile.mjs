// Source-only opt-in receiver for the exact owner-2026 AIR385 GLB.
// G2b TYÖ (not auto): https://drive.google.com/file/d/1FNFqSL_GRWm1U3EqQokStu7vDPa4xNvd/view
// Never infer installed hidden ducts, physical clearance, CURRENT/as-built,
// production WebGL, or HUMAN_REVIEW from this source lock.
export const AIR385_SOURCE_SHA256 = '9664f73acec56c84e8e2014a644d39d65f6520f984521e1b21e8469cb5e5158f';
export const AIR385_SOURCE_SCENE_COUNT = 386;
export const AIR385_SOURCE_NODE_COUNT = 12083;
export const AIR385_PARENT_SHA256 = '2d2fc3771e2e7585ac3dd7ee39ed426465f5e9308b4462e5e6334b983cb3928f';
export const AIR385_MJ69_DONOR_SHA256 = '347af8900bfd9be36fa9da3a130dd1c24fdc49b7f825086587227a75ec0910f4';
export const AIR385_FLOORS = Object.freeze({ '1F': 383, '2F': 384, BOTH: 385 });
export const AIR385_BASE_FLOORS = Object.freeze({ '1F': 344, '2F': 345, BOTH: 346 });
export const AIR385_SCENES = Object.freeze({
  383: Object.freeze({
    floor: '1F', derivedSceneIndex: 380, mj69Scene: 350,
    name: 'C80_MJ23_MJ63R2_MJ78_MJ69_TOSHIBA_SERVICE_WITH_CASING_1F_WORK_TEST_HOST_HOLD_20261111',
    rootCount: 291, rootFnv: '24896990', includesNewComponents: true,
  }),
  384: Object.freeze({
    floor: '2F', derivedSceneIndex: 381, mj69Scene: null,
    name: 'C80_MJ23_MJ63R2_MJ78_MJ69_TOSHIBA_SERVICE_WITH_CASING_2F_WORK_TEST_HOST_HOLD_20261111',
    rootCount: 178, rootFnv: '61baf198', includesNewComponents: false,
  }),
  385: Object.freeze({
    floor: 'BOTH', derivedSceneIndex: 382, mj69Scene: 351,
    name: 'C80_MJ23_MJ63R2_MJ78_MJ69_TOSHIBA_SERVICE_WITH_CASING_BOTH_WORK_TEST_HOST_HOLD_20261111',
    rootCount: 460, rootFnv: '89e7e81f', includesNewComponents: true,
  }),
});
export const AIR385_COMPONENTS = Object.freeze({
  wardrobeValve: Object.freeze({node:12072,name:'MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE',children:[12069,12070,12071]}),
  sealedDuct: Object.freeze({node:12073,name:'MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST'}),
  storageVent: Object.freeze({node:12078,name:'MJ78_D1F_INNER_STORAGE_RIGHT_UPPER_WALL_EXHAUST_PHOTO2026_WORK_TEST_HOST_HOLD',children:[12074,12075,12076,12077]}),
  casing: Object.freeze({node:12079,name:'MJ23_TOSHIBA_VISIBLE_INDOOR_CASING_OWNER2026_WORK_TEST_HOST_HOLD',children:[12080,12081]}),
  serviceOverlay: Object.freeze({node:12082,name:'C80_TOSHIBA_FILTER_VISUAL_OPEN_MJ23_CASING_MJ63_MJ78_COFIT_WORK_TEST_HOST_HOLD',mesh:4548}),
});
export const air385RootFnv32 = roots => {
  let hash = 2166136261;
  for (const node of roots) {
    if (!Number.isInteger(node) || node < 0) return null;
    hash = Math.imul(hash ^ node, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

// Source JSON is parser.json, not derived userData. Verified SHA must be the
// actual loaded GLB byte digest, not a ZIP hash or a caller-selected label.
export function isAir385SourceScene(json, loadedSha, sceneIndex, floor = null) {
  const profile = Object.hasOwn(AIR385_SCENES, sceneIndex) ? AIR385_SCENES[sceneIndex] : null;
  const scene = json?.scenes?.[sceneIndex];
  const roots = scene?.nodes;
  const extras = json?.asset?.extras;
  const sceneExtras = scene?.extras;
  if (loadedSha !== AIR385_SOURCE_SHA256 || !profile ||
      (floor !== null && floor !== profile.floor) ||
      json?.scene !== 292 ||
      json?.scenes?.length !== AIR385_SOURCE_SCENE_COUNT ||
      json?.nodes?.length !== AIR385_SOURCE_NODE_COUNT ||
      extras?.current !== false || extras?.asBuilt !== false ||
      extras?.canonical !== false || extras?.ModelStage !== 'WORK_TEST' ||
      !Object.entries(AIR385_BASE_FLOORS).every(([key,value]) => extras?.viewerFloorScenes?.[key] === value) ||
      scene?.name !== profile.name ||
      !Array.isArray(roots) || roots.length !== profile.rootCount ||
      roots.length !== new Set(roots).size ||
      air385RootFnv32(roots) !== profile.rootFnv ||
      sceneExtras?.derivedFromGLBSHA256 !== AIR385_PARENT_SHA256 ||
      sceneExtras?.derivedSceneIndex !== profile.derivedSceneIndex ||
      sceneExtras?.MJ69DonorGLBSHA256 !== AIR385_MJ69_DONOR_SHA256 ||
      sceneExtras?.MJ69DonorSceneIndex !== profile.mj69Scene ||
      sceneExtras?.newFilterGuideNode !== (profile.includesNewComponents ? AIR385_COMPONENTS.serviceOverlay.node : null) ||
      sceneExtras?.WORK_TEST !== true || sceneExtras?.HOST_HOLD !== true ||
      sceneExtras?.NOT_CURRENT_AS_BUILT !== true) return false;
  const present = profile.includesNewComponents;
  for (const part of Object.values(AIR385_COMPONENTS)) {
    const count = roots.filter(id => id === part.node).length;
    if (count !== (present ? 1 : 0)) return false;
    const sourceNode = json.nodes[part.node];
    if (sourceNode?.name !== part.name ||
        (part.children && (sourceNode.children?.length !== part.children.length ||
          part.children.some((id,i) => sourceNode.children[i] !== id))) ||
        (part.mesh !== undefined && sourceNode.mesh !== part.mesh)) return false;
  }
  // Explicitly a non-physical service overlay, not a second real duct.
  return json.nodes[AIR385_COMPONENTS.serviceOverlay.node]?.extras?.representationKind ===
    'NONPHYSICAL_OPERATIONAL_OVERLAY';
}
