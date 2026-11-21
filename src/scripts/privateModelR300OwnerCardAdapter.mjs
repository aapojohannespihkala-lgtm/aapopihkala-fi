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

const SCENES = Object.freeze({
  759: Object.freeze({
    name: 'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
    roots: 495,
  }),
  760: Object.freeze({
    name: 'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760',
    roots: 494,
  }),
});
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
  const expected = SCENES[sceneIndex];
  if (loadedGlbSha256 !== R300_OWNER_GLB_SHA256 || !expected ||
      !Number.isInteger(nodeIndex) || nodeIndex < FIRST_LEAF || nodeIndex > LAST_LEAF ||
      !Number.isInteger(meshIndex) || meshIndex !== FIRST_MESH + nodeIndex - FIRST_LEAF ||
      !samePath(sourcePath, [ROOT, CASING, nodeIndex])) return false;
  const scene = json?.scenes?.[sceneIndex];
  const root = json?.nodes?.[ROOT];
  const casing = json?.nodes?.[CASING];
  const leaf = json?.nodes?.[nodeIndex];
  const asset = json?.asset?.extras;
  return json?.scene === 292 && json?.scenes?.length === 761 &&
    json?.nodes?.length === 13495 && json?.meshes?.length === 5165 &&
    asset?.ModelStage === 'WORK_TEST' && asset?.asBuilt === false &&
    asset?.current === false && asset?.HUMAN_REVIEW === 'NOT_RUN' &&
    scene?.name === expected.name && scene?.nodes?.length === expected.roots &&
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
  if (context?.loadedGlbSha256 !== R300_OWNER_GLB_SHA256) {
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
