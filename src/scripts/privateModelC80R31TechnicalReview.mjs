/**
 * C80 R31 9e0bf34f: "Talotekniikka korostettuna" for the authenticated R31
 * review scenes 769-772 (owner 22.11.2026 17.08).
 *
 * R31 keeps R22's 13177 nodes byte-exact, so the R22 technical review roots
 * are reused by their original node index. R31 copy-on-write successors and
 * R31-only technical roots are listed explicitly with their exact source
 * names. Nodes that the source itself tags with a technical m5System are kept
 * too. Everything is resolved through the GLTFLoader node associations of the
 * mounted scene and fails closed (null) on any identity mismatch.
 * WORK_TEST/HOST_HOLD only: no CURRENT, as-built or installation claim.
 */
import { C80_620R22_REVIEW_MEP_NODES } from './privateModelC80620R22FloorRuntime.mjs';
import { isR31FamilyViewerSha, r31ViewerLayerSceneReceipt, isR32HFamilySha } from './privateModelC80R31ReviewRuntime.mjs';

/** R31 COW successors of R22 review roots and R31-only technical roots. */
export const C80_R31_TECHNICAL_REVIEW_ADDITIONS = Object.freeze([
  [11727, 'P02_P03_1F_COLLECTOR_CONTEXT_2F_COW'],
  [12261, 'M5_WW74_C80_542_WITH_A_C_CONCEPTUAL_L100_BRANCHES_WORK_TEST_HOST_HOLD'],
  [12316, 'C80_548_K03_D2F_WC_KSO125_WALL_VISUAL_ROOT_WORK_TEST_HOST_HOLD__C80578_COW'],
  [12558, 'C80_R19_D1F_AV1_125_IV_KOTELO_LAATIKKO_JATKE_OWNER_STATED_OPTIN_WORK_TEST'],
  [12568, 'VM20_20261119_RED2_PHOTO_VISIBLE_WORK_TEST_HOST_HOLD_ROOT'],
  [13167, 'C80_620R22_S2_HEADLESS_HANDSHOWER_ONLY_R21_DONOR_EXACT_WORK_TEST_HOST_HOLD'],
  [13179, 'PK1_DN32_CONCEALED_BRANCH_TO_PA2_D4_AFTER_BASIN_TRAP'],
  [13180, 'PK1_TO_EXISTING_PA2_D4_JOIN_TEE_MODEL_ONLY'],
  [13181, 'PK1_MJ64_DN32_ONE_GRADED_ADAPTER_OLD_JOIN_TO_NEW_D4_WORK_TEST_HOST_HOLD'],
  [13227, 'C80_018_PA1_TALIS_S2_BIDETTE_WALL_BRACKET_WT_REBASED_ON_V87'],
  [13228, 'C80_018_PA1_TALIS_S2_BIDETTE_HANDLE_WT_REBASED_ON_V87'],
  [13229, 'C80_018_PA1_TALIS_S2_BIDETTE_SPRAY_HEAD_WT_REBASED_ON_V87'],
  [13230, 'C80_018_PA1_TALIS_S2_BIDETTE_SPRAY_NOZZLE_WT_REBASED_ON_V87'],
  [13231, 'C80_018_PA1_TALIS_S2_BIDETTE_PHOTO_VISIBLE_HOSE_WT_REBASED_ON_V87'],
  [13236, 'MJ04_OWNER2026_S1_GLASS_AS9000_S2_SAUNA_INLET_STUBS_COW_ROOT'],
  [13237, 'D1F-SW-01_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'],
  [13238, 'D1F-SW-02_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT'],
  [13239, 'D1F-SW-03_COW_WALLFACE_HOSTED_ONLY_NEW_SCENES'],
  [13246, 'D2F-SW-05_COW_DOOR_WALL_HOSTED_ONLY_NEW_SCENES'],
  [13250, 'MJ64_REHOST__P02_1F_KV_LV_CONNECTIONS_WORK_TEST_ROOT_PA2_WC385_INTEGRATION_COW_PA2_ENDPOINT_REHOST_20261114_COW_HOT_COLD_CLEARANCE_428_COW'],
  [13253, 'C80_620R24_L10_D2FWC_DRAIN_BODY_AND_OUTLET_WORK_TEST_HOST_HOLD'],
  [13309, 'R25_L10_HIST2015_REASONED_WC_V75_OPTIN_BRANCH_ROOT_WORK_TEST_HOLD'],
  [13319, 'D2F_KITCHEN_2026_PHOTO_WASTE_VISIBLE_TRAP_U_ELBOW_APPLIANCE_HOSE_ROOT_WORK_TEST_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW'],
  [13324, 'R25_K8_RK42_D1F_ELECTRICAL_ROUTE_OPTIN_ROOT_WORK_TEST_HOST_HOLD'],
  [13325, 'R28_L13_D2F_IV160_ROOFJOIN_49MM_VISUAL_COW_WORK_TEST_HOST_HOLD'],
  [13331, 'C80_620R21_K14_ROOT_T110_VIEMARI_PLUS_G2S07_RK_XPLUS94MM_OPTIN_1F_BOTH_ROOT_K1_EASTWALL_COW_ROOT_R24_L12_WW_SEMANTIC_COW_ROOT_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW_R29_D1F_WASTE_SEMANTIC_COW'],
  [13358, 'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL_P02_COW_P02_COW_R24_L12_WW_SEMANTIC_COW_ROOT_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW_E220S_ROOF_HOST_WT'],
  [13472, 'D2F_MIXER_HOSE_CONNECTOR_ROOT_NO_HYDRAULIC_PROOF'],
  [13488, 'NIBE_COMPACT_R300_FRONT_NORTH_WC_WORK_TEST_HOST_HOLD'],
  [13491, 'P02_2F_KV_LV_CONNECTIONS_WORK_TEST_ROOT_R300_CASING_INTERSECTIONS_EXCLUDED'],
  [13494, 'D2F_NIBE_VISIBLE_COPPER_ROUTES_ONLY_WORK_TEST'],
  [13499, 'K8_R31_RK14_2_2015_SOURCE_ASSOCIATION_OPTIN_ROOT'],
  [13500, 'D2F_RK14_3_2015_LIESITUULETIN_TO_SAVO_LOGICAL_DIAGRAM_WORK_TEST_HOST_HOLD'],
  [13505, 'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL_P02_COW_P03_ONE_V75_COW_R24_L12_WW_SEMANTIC_COW_ROOT_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW__L12_D2F_V75_V110_COW_R31_SCENE764_COW_R31_SC767_2F_SOURCE_EXACT'],
  [13506, 'K8_RK14_1_2F_LIVING_2015_GROUP_VISUAL_WORK_ASSUMPTION_NOT_CABLE_2026__REBASED_SCENE768'],
].map(([node, name]) => Object.freeze({ node, name })));

/**
 * R32H c26d99c1 only: roof-water parts baked into the model (T12 eaves gutters + five
 * downpipes at the owner points, P6 carport gutters). Owner 23.11.2026 10.50: the
 * downpipes must stay visible in "Talotekniikka korostettuna" next to the roof-water
 * continuations. Exact name per node index; any mismatch keeps none of them.
 */
export const C80_R32H_ROOFWATER_REVIEW_ROOTS = Object.freeze([
  [13808, 'R32_T12_GUTTERS_AND_5_DOWNPIPES_OWNER_POINTS'],
  [13812, 'P6_2022_GUTTERS_CARRIER_G1_ZUP_TO_GLTF_YUP_R32'],
].map(([node, name]) => Object.freeze({ node, name })));

/** Review system key of the roof-water parts (gutters, downpipes). */
export const C80_R31_ROOFWATER_SYSTEM = 'SADEVESI';
const ROOFWATER_ROOT_NAMES = new Set(C80_R32H_ROOFWATER_REVIEW_ROOTS.map(({ name }) => name));

/** SADEVESI for a mesh inside an exact roof-water review root, otherwise null. */
export function c80R31RoofWaterSystemOf(object, root) {
  for (let node = object; node && node !== root; node = node.parent) {
    const name = typeof node.name === 'string' ? node.name : '';
    if (ROOFWATER_ROOT_NAMES.has(name) && node.userData?.presentationOnly !== true) return C80_R31_ROOFWATER_SYSTEM;
  }
  return null;
}

/** Source m5System tags that mark a technical node (ILMANVAIHTO = IV). */
export const C80_R31_TECHNICAL_SYSTEMS = Object.freeze(['SAHKO', 'VESI', 'IV', 'VIEMARI', 'ILMANVAIHTO']);

const R22_NODES = new Set(C80_620R22_REVIEW_MEP_NODES);
const ADDED = new Map(C80_R31_TECHNICAL_REVIEW_ADDITIONS.map(({ node, name }) => [node, name]));
const SYSTEMS = new Set(C80_R31_TECHNICAL_SYSTEMS);

/** Which source nodes of the R31 JSON are review roots (pure, for tests). */
export function c80R31TechnicalReviewNodeSet(json, loadedSha = null) {
  const keep = new Set();
  const nodes = json?.nodes;
  if (!Array.isArray(nodes)) return keep;
  for (const n of R22_NODES) if (nodes[n]) keep.add(n);
  for (const [n, name] of ADDED) {
    // An explicit addition must still carry its exact source name.
    if (nodes[n]?.name !== name) return new Set();
    keep.add(n);
  }
  nodes.forEach((node, index) => {
    if (SYSTEMS.has(node?.extras?.m5System) && node?.extras?.presentationOnly !== true) keep.add(index);
  });
  if (isR32HFamilySha(loadedSha)) {
    // Optional on top: a mismatch drops only the roof-water roots, not the review.
    const roof = C80_R32H_ROOFWATER_REVIEW_ROOTS;
    if (roof.every(({ node, name }) => nodes[node]?.name === name)) for (const { node } of roof) keep.add(node);
  }
  return keep;
}

/**
 * Review roots of the mounted, receipt-verified R31 scene (any depth), or null.
 * Kept objects colour by their own source system in the presentation.
 */
export function resolveC80R31TechnicalReviewRoots(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  if (!isR31FamilyViewerSha(loadedSha) || expectedSha !== loadedSha) return null;
  if (!r31ViewerLayerSceneReceipt(json, loadedSha, sceneIndex)) return null;
  if (gltf?.scenes?.[sceneIndex] !== scene || typeof associations?.get !== 'function' ||
      typeof scene?.traverse !== 'function') return null;
  const keep = c80R31TechnicalReviewNodeSet(json, loadedSha);
  if (!keep.size) return null;
  const roots = [];
  scene.traverse((object) => {
    const index = associations.get(object)?.nodes;
    if (!Number.isInteger(index) || !keep.has(index)) return;
    // Name identity guard (GLTFLoader may suffix duplicate names).
    const name = json.nodes[index]?.name ?? '';
    if (typeof object.name !== 'string' || !object.name.startsWith(name.slice(0, 40))) return;
    roots.push(object);
  });
  return roots.length ? roots : null;
}
