/**
 * HL2: exact read-only source manifest for the FOUR Kvik/MANO-lookalike
 * tall work-test cabinet modules in published V35 2F197 and BOTH198.
 *
 * Provenance: raw GLB from Drive 11IiYOiuQE7Sggjj1f0AWRRSNmD8MyoEE,
 * GLB SHA256 below, 199 internal glTF scenes. Verified 32/32 node/mesh/
 * name/parent routes, independently of __scene198 in the ZIP filename.
 *
 * Each module contains one pre-existing WORK_TEST carcass (mesh 334, reused
 * across four DISTINCT node paths) and three photo-2024 front meshes.
 * Neither separate side panels nor a distinct plinth are identified as
 * source-bounded nodes: the carcass is a work envelope, NOT as-built.
 * Sink drawers, island, appliances, grip shadows and SOURCE_CONTEXT remain
 * outside this exact allowlist. No viewer/runtime writes in HL2.
 */
export const V35_FURNITURE_SOURCE_SHA256 =
  'f81e0915711b798ec4a02472202a3372a4a77057cd8a150cc17f89bef3cd4789';
export const V35_FURNITURE_SOURCE_SCENE_COUNT = 199;
export const V35_FURNITURE_SOURCE_DRIVE_ZIP_ID = '11IiYOiuQE7Sggjj1f0AWRRSNmD8MyoEE';
export const V35_FURNITURE_SOURCE_ROLE = 'SOURCE_WORK_TEST';
export const V35_FURNITURE_LAYER_ID = 'architecture-fixtures';

const CABINET_ROLES = ['PAKASTIN', 'JAAKAAPPI', 'RUOKAKAAPPI_A', 'RUOKAKAAPPI_B'];
const CARCASS_NODES = [245, 250, 255, 260];
const PANEL_POSITIONS = ['LOWER', 'MIDDLE', 'UPPER'];
const sceneDefinitions = [
  { sceneIndex: 197, floor: '2F',
    sceneName: 'C80R2_V35_D2F_WORK_TEST_HOST_HOLD_20261102',
    rootPath: [9293, 9292, 8309], firstModule: 8036,
    firstPanel: 8033, firstPanelMesh: 2464 },
  { sceneIndex: 198, floor: 'BOTH',
    sceneName: 'C80R2_V35_BOTH_WORK_TEST_HOST_HOLD_20261102',
    rootPath: [9328, 9327, 8421], firstModule: 8096,
    firstPanel: 8093, firstPanelMesh: 2510 },
];

const makeParts = (scene) => Object.freeze(CABINET_ROLES.flatMap((role, ordinal) => {
  const cabinetNo = ordinal + 1;
  const moduleNode = scene.firstModule + ordinal * 4;
  const parentName = `R5_TALL_MODULE_${cabinetNo}_${role}_R4_450MM_WORK_ENVELOPE_MANO_LOOKALIKE_HOB28_COW3_REAL_3_INDEPENDENT_PANELS_V9COW`;
  const basePath = [...scene.rootPath, moduleNode];
  const record = (nodeIndex, meshIndex, name, component, representationKind) =>
    Object.freeze({
      sceneIndex: scene.sceneIndex,
      cabinetNo, role, component, layerId: V35_FURNITURE_LAYER_ID,
      nodeIndex, meshIndex, name,
      parentNodeIndex: moduleNode, parentName,
      path: Object.freeze([...basePath, nodeIndex]),
      representationKind, current: false, asBuilt: false,
      evidence: component === 'carcass'
        ? 'OWNER_ROLE_PLUS_WORK_ENVELOPE_UNMEASURED'
        : 'PHOTO_2024_COW_GEOMETRY_WORK_ASSUMPTION',
    });
  const carcass = record(CARCASS_NODES[ordinal], 334,
    `D2F_R4_KORKEA_${cabinetNo}_${role}_RUNKO_WORK_TEST`,
    'carcass', 'WORK_TEST_ENVELOPE_REUSED_MESH');
  const fronts = PANEL_POSITIONS.map((position, index) => record(
    scene.firstPanel + ordinal * 4 + index,
    scene.firstPanelMesh + ordinal * 3 + index,
    `HOB28_COW3_SC129_CAB${cabinetNo}_${position}_INDEPENDENT_FACADE_PANEL_PHOTO2024_V17`,
    position.toLowerCase() + '-front',
    'PHOTO_2024_COW_GEOMETRY_WORK_ASSUMPTION'));
  return [carcass, ...fronts];
}));

export const V35_FURNITURE_SCENES = Object.freeze(Object.fromEntries(
  sceneDefinitions.map(scene => [scene.sceneIndex, Object.freeze({
    floor: scene.floor, name: scene.sceneName,
    rootPath: Object.freeze([...scene.rootPath]),
    parts: makeParts(scene),
  })]),
));

/**
 * Match ONLY an exact verified raw GLB identity and glTF scene/node/mesh/
 * node-name/parent route. Does not inspect geometry appearance or invent
 * classification. Expects caller to supply independent manifest and loaded
 * GLB digests, with the real internal sceneIndex.
 *
 * A return value confirms only source-bound WORK_TEST presentation parts.
 * It does not prove Kvik manufacture, current installation or as-built fit.
 */
export const resolveV35FurnitureSourcePart = ({
  expectedSourceSha256, loadedSourceSha256,
  sceneIndex, sceneName, nodeIndex, meshIndex, nodeName,
  nodePath, parentNodeName,
} = {}) => {
  if (expectedSourceSha256 !== V35_FURNITURE_SOURCE_SHA256 ||
      loadedSourceSha256 !== V35_FURNITURE_SOURCE_SHA256) return null;
  if (!Number.isInteger(sceneIndex) || !Object.hasOwn(V35_FURNITURE_SCENES, sceneIndex)) return null;
  const scene = V35_FURNITURE_SCENES[sceneIndex];
  if (sceneName !== scene.name || !Array.isArray(nodePath)) return null;
  const matched = scene.parts.find(part =>
    part.nodeIndex === nodeIndex && part.meshIndex === meshIndex &&
    part.name === nodeName && part.parentName === parentNodeName &&
    nodePath.length === part.path.length &&
    nodePath.every((node, index) => node === part.path[index]));
  return matched ?? null;
};
