/**
 * SOURCE_ONLY R31 card identity gate for independently authenticated, original
 * C80 R31 __scene769-772. Does not bind sourceLinks or register a viewer card.
 * IMPORTANT: caller must hash actual original GLB bytes independently first;
 * supplying a SHA-shaped string by itself is NOT provenance verification.
 */
export const R31_THREE_CARDS = Object.freeze({
  originalZipDriveId: '1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7',
  originalZipSha256: '9bcd56505c4608a9e00df2fcd659893c7dbc743cf44f2ec08f1ca7b151ef1812',
  glbSha256: '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  glbBytes: 63833692, defaultScene: 292,
  sceneCount: 773, nodeCount: 13507, meshCount: 5169,
  materialCount: 815, accessorCount: 11267, bufferViewCount: 11273,
  cards: Object.freeze({
    TOSHIBA: Object.freeze({root: 13137, name: 'C80_R21_K7_TOSHIBA_ILP_WHITE_CASE_OPTIN_1F_BOTH_ROOT', meshLeaves: 36}),
    AEG: Object.freeze({root: 13247, name: 'K6_AEG_BE3002401M_MAT_ZFIGHT_COW_ROOT_R21', meshLeaves: 50}),
    S1: Object.freeze({root: 13466, name: 'D1F_S1_OWNER_CONFIRMED_FOUR_HANDLES_R31_R300_E220S_WORK_TEST_HOST_HOLD_ROOT__scene749', meshLeaves: 138}),
  }),
  views: Object.freeze({
    769: Object.freeze({role: 'NORMAL', floor: 'BOTH', roots: 499, rootsFNV: 'c493c3e8', cards: ['TOSHIBA', 'AEG', 'S1'], name: 'Ylisrinne_C80_R31_R300_ROOF_VM20_CLOSED_2F_L12_V75V110_RK141_RK142_RK143_MJ83_BOTH_REVIEW_WORK_TEST_HOST_HOLD__scene769'}),
    770: Object.freeze({role: 'SERVICE', floor: 'BOTH', roots: 498, rootsFNV: '1f600091', cards: ['TOSHIBA', 'AEG', 'S1'], name: 'Ylisrinne_C80_R31_BOTH_R300_KUPARIT_HUOLTO_PLEKSI_POIS_RK141_RK142_RK143_MJ83_VM20_CLOSED_WORK_TEST_HOST_HOLD__scene770'}),
    771: Object.freeze({role: 'NORMAL', floor: 'D2F', roots: 204, rootsFNV: 'a9e2f210', cards: ['AEG'], name: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_NORMAL_WORK_TEST_HOST_HOLD__scene771'}),
    772: Object.freeze({role: 'SERVICE', floor: 'D2F', roots: 203, rootsFNV: '49047c9d', cards: ['AEG'], name: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_SERVICE_WORK_TEST_HOST_HOLD__scene772'}),
  }),
});

export function r31ThreeCardsRootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let h = 2166136261;
  for (const n of roots) {
    if (!Number.isSafeInteger(n) || n < 0) return null;
    h = Math.imul(h ^ n, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function descendants(nodes, root, limit) {
  const visited = new Set(), pending = [root];
  let meshes = 0;
  while (pending.length) {
    const id = pending.pop();
    if (!Number.isSafeInteger(id) || id < 0 || id >= nodes.length || visited.has(id)) return null;
    visited.add(id);
    const n = nodes[id];
    if (!n || (n.children && !Array.isArray(n.children))) return null;
    if (n.mesh !== undefined) meshes++;
    if (n.children) pending.push(...n.children);
    if (visited.size > limit) return null;
  }
  return {visited, meshes};
}

export function isR31ThreeCardsSource(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const S = R31_THREE_CARDS, v = S.views[sceneIndex], a = json?.asset?.extras;
  if (!v || authenticatedGlbSha256 !== S.glbSha256 || role !== v.role || floor !== v.floor ||
      json?.scene !== S.defaultScene || json?.scenes?.length !== S.sceneCount ||
      json?.nodes?.length !== S.nodeCount || json?.meshes?.length !== S.meshCount ||
      json?.materials?.length !== S.materialCount || json?.accessors?.length !== S.accessorCount ||
      json?.bufferViews?.length !== S.bufferViewCount || a?.ModelStage !== 'WORK_TEST' ||
      a?.Canonical !== false || a?.current !== false || a?.asBuilt !== false ||
      a?.HUMAN_REVIEW !== 'NOT_RUN') return false;
  const scene = json.scenes[sceneIndex], roots = scene?.nodes;
  if (scene?.name !== v.name || scene?.extras?.stage !== 'WORK_TEST_HOST_HOLD' ||
      (scene.extras.sourceLinksOutputSHA !== undefined && scene.extras.sourceLinksOutputSHA !== 'NOT_BOUND') ||
      !Array.isArray(roots) || roots.length !== v.roots || new Set(roots).size !== roots.length ||
      r31ThreeCardsRootsFnv32(roots) !== v.rootsFNV ||
      roots.includes(13235)) return false;
  for (const [card, item] of Object.entries(S.cards)) {
    const expected = v.cards.includes(card), rootCount = roots.filter(n => n === item.root).length;
    if (rootCount !== (expected ? 1 : 0)) return false;
    if (!expected) continue;
    const n = json.nodes[item.root], e = n?.extras;
    if (n?.name !== item.name || e?.current !== false || e?.asBuilt !== false ||
        (e.sourceLinksBound !== undefined && e.sourceLinksBound !== false) ||
        (e.canPublish !== undefined && e.canPublish !== false)) return false;
    const subtree = descendants(json.nodes, item.root, 1000);
    if (!subtree || subtree.meshes !== item.meshLeaves || subtree.visited.has(13235)) return false;
    if (card === 'TOSHIBA' && (e.skuConfidence !== 'PROBABLE_ONLY_RAS-25G2KVP-ND' ||
        e.HUMAN_REVIEW !== 'NOT_RUN')) return false;
    if (card === 'AEG' && (e.sourceRole !== 'PRODUCT_LOCAL_PRESENTATION' ||
        e.physicalHostVerified !== false)) return false;
    if (card === 'S1' && (e.owner4HandlesPhotoProxy?.ownerConfirmedCount !== 4 ||
        e.owner4HandlesPhotoProxy?.humanReview !== 'NOT_RUN' ||
        !subtree.visited.has(12620) || json.nodes[12620]?.extras?.physicalConnectionsVerified !== 0)) return false;
  }
  return true;
}

/** A correct source with an inactive card is not a failed source validation. */
export function r31ThreeCardsReceipt(json, authenticatedGlbSha256, sceneIndex, role, floor, card) {
  const v = R31_THREE_CARDS.views[sceneIndex];
  const exactSource = isR31ThreeCardsSource(json, authenticatedGlbSha256, sceneIndex, role, floor);
  const cardActive = exactSource && Boolean(R31_THREE_CARDS.cards[card] && v.cards.includes(card));
  return Object.freeze({exactSource, cardActive, rootNode: cardActive ? R31_THREE_CARDS.cards[card].root : null,
    stage: 'WORK_TEST_HOST_HOLD', sourceLinksBound: false, publishAllowed: false,
    current: false, asBuilt: false, productionWebGLVerified: false, humanReview: 'NOT_RUN'});
}
