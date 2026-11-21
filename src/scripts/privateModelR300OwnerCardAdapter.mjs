/**
 * D2F NIBE COMPACT-R owner card bridge for the exact authenticated R31 R300
 * WORK_TEST GLB. Owner photos and private facts must come exclusively from
 * the existing authenticated source-card distribution, never public code.
 * SHA must be computed from the same GLB bytes that the loader parsed.
 * Source node indices/path must come from a verified parser node association.
 * No viewer runtime wiring, asset publication or as-built approval here.
 */
export const R300_OWNER_GLB_SHA256 = '0ec686edc2c36b1230b81edf7e27237e2ee95b34ac2fe18768519c255ad1ec13';
export const R300_OWNER_CARD_REF = 'HIGH-UX-D-KOHDEKORTTI-R300';

export const R300_OWNER_R31_772_GLB_SHA256 = '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3';
/** Source-exact successor: the unrelated D2F-SW04 proxy must not change NIBE identity. */
export const R300_OWNER_R31_774_GLB_SHA256 = 'aa56361ce355fdf31f0fbe301364156a6548eebd0ac1eb57bc25475acdca77c0';

const PROFILES_BY_SHA = Object.freeze({
  [R300_OWNER_GLB_SHA256]: {
    sceneCount: 761, nodeCount: 13495, meshCount: 5165,
    scenes: {
      759: { name: 'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759', roots: 495 },
      760: { name: 'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760', roots: 494 },
    },
  },
  [R300_OWNER_R31_772_GLB_SHA256]: {
    sceneCount: 773, nodeCount: 13507, meshCount: 5169,
    scenes: {
      769: { name: 'Ylisrinne_C80_R31_R300_ROOF_VM20_CLOSED_2F_L12_V75V110_RK141_RK142_RK143_MJ83_BOTH_REVIEW_WORK_TEST_HOST_HOLD__scene769', roots: 499 },
      770: { name: 'Ylisrinne_C80_R31_BOTH_R300_KUPARIT_HUOLTO_PLEKSI_POIS_RK141_RK142_RK143_MJ83_VM20_CLOSED_WORK_TEST_HOST_HOLD__scene770', roots: 498 },
      771: { name: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_NORMAL_WORK_TEST_HOST_HOLD__scene771', roots: 204 },
      772: { name: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_SERVICE_WORK_TEST_HOST_HOLD__scene772', roots: 203 },
    },
  },
  [R300_OWNER_R31_774_GLB_SHA256]: {
    sceneCount: 775, nodeCount: 13510, meshCount: 5171,
    scenes: {
      773: { name: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_NORMAL_PLEX_ON_WORK_TEST_HOST_HOLD__scene773', roots: 204, plexiRootPresent: true },
      774: { name: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_SERVICE_PLEX_OFF_WORK_TEST_HOST_HOLD__scene774', roots: 203, plexiRootPresent: false },
    },
  },
});
// Do not inherit prior SHA/scene approvals solely from matching numeric node IDs.
const ROOT = 13488;
const CASING = 13487;
const FIRST_LEAF = 13415;
const LAST_LEAF = 13424;
const FIRST_MESH = 4368;
const isOnce = (entries, id) => Array.isArray(entries) && entries.filter(value => value === id).length === 1;
const samePath = (got, expected) => Array.isArray(got) && got.length === expected.length &&
  got.every((value, i) => value === expected[i]);
const validCardSourceUrl = value => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password &&
      (url.origin === 'https://drive.google.com' || url.origin === 'https://docs.google.com');
  } catch { return false; }
};

/** Exactly ten device casing/rail/foot leaves. No copper, plexiglass or wall. */
export function isR300OwnerCardNode({ json, loadedGlbSha256, sceneIndex, nodeIndex, meshIndex, sourcePath } = {}) {
  const profile = PROFILES_BY_SHA[loadedGlbSha256];
  const expected = profile?.scenes?.[sceneIndex];
  if (!profile || !expected ||
      !Number.isInteger(nodeIndex) || nodeIndex < FIRST_LEAF || nodeIndex > LAST_LEAF ||
      !Number.isInteger(meshIndex) || meshIndex !== FIRST_MESH + nodeIndex - FIRST_LEAF ||
      !samePath(sourcePath, [ROOT, CASING, nodeIndex])) return false;
  const scene = json?.scenes?.[sceneIndex];
  const root = json?.nodes?.[ROOT];
  const casing = json?.nodes?.[CASING];
  const leaf = json?.nodes?.[nodeIndex];
  const asset = json?.asset?.extras;
  return json?.scene === 292 && json?.scenes?.length === profile.sceneCount &&
    json?.nodes?.length === profile.nodeCount && json?.meshes?.length === profile.meshCount &&
    asset?.ModelStage === 'WORK_TEST' && asset?.asBuilt === false &&
    asset?.current === false && asset?.HUMAN_REVIEW === 'NOT_RUN' &&
    scene?.name === expected.name && scene?.nodes?.length === expected.roots &&
    (expected.plexiRootPresent === undefined ||
      scene.nodes.filter(id => id === 11625).length === (expected.plexiRootPresent ? 1 : 0)) &&
    isOnce(scene.nodes, ROOT) &&
    root?.name === 'NIBE_COMPACT_R300_FRONT_NORTH_WC_WORK_TEST_HOST_HOLD' &&
    isOnce(root?.children, CASING) &&
    casing?.name === 'R300_CASING_TURNED_180_TO_FACE_WC' &&
    Array.isArray(casing.children) && casing.children.length === 10 &&
    isOnce(casing.children, nodeIndex) &&
    leaf?.name?.startsWith('R300_OWNER_OPTION__H32_NIBE_R300_') &&
    leaf?.name?.endsWith('_WORK_TEST') && leaf?.mesh === meshIndex;
}
const evidence = (state, reason, cards = []) => ({
  state, version: 'R300-owner-source-card:WORK_TEST:scene759-760',
  ...(reason ? { reason } : {}), cards,
});

/**
 * Matches viewer SelectionSourceEvidence. The protected provider owns ALL
 * facts, dates, source photos/URLs, and status. Never invent missing values.
 */
export function resolveR300OwnerCardSelection(context, getProtectedCard) {
  if (!Object.hasOwn(PROFILES_BY_SHA, context?.loadedGlbSha256 ?? '')) {
    return evidence('mismatch', 'Ladatun GLB:n SHA256 ei vastaa R300-kohdekorttia.');
  }
  if (!isR300OwnerCardNode(context)) {
    return evidence('unbound', 'Valittu solmu ei ole tämän WORK_TEST-varaajan varmennettu kuoriosa.');
  }
  const card = typeof getProtectedCard === 'function'
    ? getProtectedCard(R300_OWNER_CARD_REF) : null;
  if (card?.id !== R300_OWNER_CARD_REF || typeof card.title !== 'string' ||
      typeof card.status !== 'string' || !Array.isArray(card.facts) ||
      !Array.isArray(card.sources) || !Array.isArray(card.notes) ||
      !Array.isArray(card.conflicts) || card.sources.length > 3 ||
      !card.sources.every(source => validCardSourceUrl(source?.url))) {
    return evidence('unavailable', 'Suojattua omistajan kohdekorttia ei voitu varmentaa.');
  }
  return evidence('matched', undefined, [card]);
}
