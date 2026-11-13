// Immutable, opt-in receiver for the verified 2026 SG5 + Savo IH7603W
// white two-shell 600 mm WORK_TEST. This is NOT a physical/as-built acceptance.
// G2b TYÖ EI AUTO: https://drive.google.com/file/d/1vMRz-T3leG5BQxwAGcnWc3mG5RmXnlUz/view
export const SG5_ROOF600_SOURCE_SHA256 = '7400a70dc1fc216280daa0d65769527ea3e766dc2f615562733617266d7d47cd';
export const SG5_ROOF600_SOURCE_SCENE_COUNT = 372;
export const SG5_ROOF600_SOURCE_NODE_COUNT = 12039;
export const SG5_ROOF600_PARENT_SHA256 = '5fe8f429568c6a9981a48872aed7109bcbd0bec32f9a6019b853f63a0ff996a2';
export const SG5_ROOF600_WHITE_DONOR_SHA256 = 'd8a4cb54eb7489fda765493c9d2f9e692ebf3a9da5eca31708cd5017f63dfd37';
export const SG5_ROOF600_FLOORS = Object.freeze({ '2F': 370, BOTH: 371 });
export const SG5_ROOF600_BASE_FLOORS = Object.freeze({ '1F': 344, '2F': 345, BOTH: 346 });
export const SG5_ROOF600_SCENES = Object.freeze({
  370: Object.freeze({
    floor: '2F', parentScene: 368, roots: 185, fnv: 'fdac4fcf',
    name: 'C80_SG5_B47K_LED24_SW11_SAVO_IH7603W_OWNER600_WHITE_TWO_SHELL_ROOF_2F_WORK_TEST_HOST_HOLD_20261111',
  }),
  371: Object.freeze({
    floor: 'BOTH', parentScene: 369, roots: 459, fnv: '8f27795e',
    name: 'C80_SG5_B47K_LED24_SW11_SAVO_IH7603W_OWNER600_WHITE_TWO_SHELL_ROOF_BOTH_WORK_TEST_HOST_HOLD_20261111',
  }),
});
export const SG5_ROOF600_ROOT = 12038;
export const SG5_ROOF600_REPLACED_ROOT = 12032;
export const SG5_ROOF600_OLD_STEEL_BODY = 12008;
export const SG5_ROOF600_WHITE_NODES = Object.freeze([
  Object.freeze({ node: 12033, sourceNode: 11928, mesh: 4534, prefix: 'C80_SG5_MJ39_ROOF600_DONOR_N11928__' }),
  Object.freeze({ node: 12034, sourceNode: 11929, mesh: 4535, prefix: 'C80_SG5_MJ39_ROOF600_DONOR_N11929__' }),
  Object.freeze({ node: 12035, sourceNode: 11930, mesh: 4536, prefix: 'C80_SG5_MJ39_ROOF600_DONOR_N11930__' }),
  Object.freeze({ node: 12036, sourceNode: 11925, mesh: 4537, prefix: 'C80_SG5_MJ39_ROOF600_DONOR_N11925__' }),
  Object.freeze({ node: 12037, sourceNode: 11931, mesh: 4538, prefix: 'C80_SG5_MJ39_ROOF600_DONOR_N11931__' }),
]);
// Ordered source identity is taken from parser.json, never scene.userData.
export const sg5Roof600RootFnv32 = roots => {
  let hash = 2166136261;
  for (const index of roots) {
    if (!Number.isInteger(index) || index < 0) return null;
    hash = Math.imul(hash ^ index, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};
const hoodChildren = Object.freeze([
  12001,12002,12003,12004,12005,12007,12009,12010,12011,12012,
  12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,
  12023,12024,12025,12026,12027,12028,12029,12030,12031,
]);

export function isSg5Roof600SourceScene(json, loadedSha, sceneIndex, floor = null) {
  const profile = Object.hasOwn(SG5_ROOF600_SCENES, sceneIndex) ? SG5_ROOF600_SCENES[sceneIndex] : null;
  const scene = json?.scenes?.[sceneIndex], roots = scene?.nodes;
  const asset = json?.asset?.extras, meta = scene?.extras;
  if (loadedSha !== SG5_ROOF600_SOURCE_SHA256 || !profile ||
      (floor !== null && profile.floor !== floor) ||
      json?.scene !== 292 || json?.scenes?.length !== SG5_ROOF600_SOURCE_SCENE_COUNT ||
      json?.nodes?.length !== SG5_ROOF600_SOURCE_NODE_COUNT ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.current !== false ||
      asset?.canonical !== false || asset?.asBuilt !== false ||
      !Object.entries(SG5_ROOF600_BASE_FLOORS).every(([key, value]) => asset?.viewerFloorScenes?.[key] === value) ||
      scene?.name !== profile.name ||
      !Array.isArray(roots) || roots.length !== profile.roots ||
      roots.length !== new Set(roots).size ||
      sg5Roof600RootFnv32(roots) !== profile.fnv ||
      meta?.integrationTask !== 'GPT6-C80-SG5-MJ39-600MM-ROOF-JUNCTION-COW-20261111' ||
      meta?.modelStage !== 'WORK_TEST' || meta?.HOST_HOLD !== true ||
      meta?.current !== false || meta?.asBuilt !== false ||
      meta?.floor !== profile.floor || meta?.sceneIsOptInOnly !== true ||
      meta?.sourceParentGLBSHA256 !== SG5_ROOF600_PARENT_SHA256 ||
      meta?.sourceParentSceneIndex !== profile.parentScene ||
      meta?.donorWhiteShellGLBSHA256 !== SG5_ROOF600_WHITE_DONOR_SHA256 ||
      meta?.donorWhiteShellSceneIndex !== 369 ||
      meta?.newFilterGroupRoot !== SG5_ROOF600_ROOT ||
      meta?.replacesOldSourceRoot !== SG5_ROOF600_REPLACED_ROOT ||
      meta?.ownerRelativeHoodHobMm !== 600 ||
      meta?.lowerShellWorldMinY !== 4.28246 || meta?.upperShellWorldMaxY !== 5.28 ||
      meta?.upperTelescopeHeightMm !== 437.54 ||
      meta?.roofJunctionRegressionPreviouslyIdentifiedMm !== 112.54 ||
      meta?.N_S_airflow_root_unmodified !== true ||
      !Array.isArray(meta?.sourceLinksProvenance) ||
      !meta.sourceLinksProvenance.some(item => item.sha256 === SG5_ROOF600_PARENT_SHA256) ||
      !meta.sourceLinksProvenance.some(item => item.sha256 === SG5_ROOF600_WHITE_DONOR_SHA256)) return false;
  const rootSet = new Set(roots);
  if (!rootSet.has(SG5_ROOF600_ROOT) ||
      rootSet.has(SG5_ROOF600_REPLACED_ROOT) || rootSet.has(SG5_ROOF600_OLD_STEEL_BODY)) return false;
  const hood = json.nodes[SG5_ROOF600_ROOT];
  if (hood?.name !== 'C80_SG5_MJ39_600MM_WHITE_IH7603W_FILTER_UNDERHOOD_ROOT_ROOF_FIT_WORK_TEST' ||
      hood?.extras?.sourceSG5SHA256 !== SG5_ROOF600_PARENT_SHA256 ||
      hood?.extras?.sourceWhiteDonorSHA256 !== SG5_ROOF600_WHITE_DONOR_SHA256 ||
      hood?.children?.length !== hoodChildren.length ||
      hoodChildren.some((id, i) => hood.children[i] !== id)) return false;
  for (const part of SG5_ROOF600_WHITE_NODES) {
    const node = json.nodes[part.node];
    if (!rootSet.has(part.node) || !node?.name?.startsWith(part.prefix) ||
        node.mesh !== part.mesh || node.extras?.sourceExactGLBSHA256 !== SG5_ROOF600_WHITE_DONOR_SHA256 ||
        node.extras?.sourceNodeIndex !== part.sourceNode) return false;
  }
  return true;
}
