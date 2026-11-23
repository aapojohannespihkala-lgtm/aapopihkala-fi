/**
 * R33 2F WC LK75 source-only cover-pointer safeguard.
 *
 * Exact original R33 GLB (G2b Drive 13Wb5Og60oBFl_gWoEcAqXL22gy7MZZFg)
 * preserves n13253.sourceVisibleCoverNode=11624, a yellow SIDEWALL.
 * Neither the donor cover n11643/11644 nor a product SKU/installation is
 * physically verified. No mutation of the source GLB or sourceLinks.
 */
export const R33_LK75_COVER_SOURCE = Object.freeze({
  glbSha256: '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c',
  parentR32HGlbSha256: 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c',
  driveId: '13Wb5Og60oBFl_gWoEcAqXL22gy7MZZFg',
  scenes: Object.freeze({
    818: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene818',
    819: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene819',
    820: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene820',
    821: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene821',
  }),
  drainRoot: 13253,
  rejectedPointer: 11624,
  rejectedPointerMesh: 4418,
  coverRoot: 11645,
  candidateLeaves: Object.freeze([[11643, 894], [11644, 895]]),
});

function activeNode(json, sceneIndex, target) {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const stack = [...roots];
  const visited = new Set();
  while (stack.length) {
    const i = stack.pop();
    if (!Number.isInteger(i) || i < 0 || i >= json.nodes?.length || visited.has(i)) continue;
    visited.add(i);
    if (i === target) return true;
    const children = json.nodes[i]?.children;
    if (Array.isArray(children)) stack.push(...children);
  }
  return false;
}

export function assessR33LK75CoverSource(json, authenticatedSha, sceneIndex) {
  const contract = R33_LK75_COVER_SOURCE;
  const result = (status, linkedNode = null, coversActive = false) => Object.freeze({
    status,
    sourceSha256: contract.glbSha256,
    sceneIndex,
    linkedNode,
    candidateCoverIds: [11643, 11644],
    candidateCoverMeshesActive: coversActive,
    physicalHostVerified: false,
    asBuiltClaim: false,
    stage: 'WORK_TEST_HOST_HOLD',
  });

  if (authenticatedSha !== contract.glbSha256 ||
      !Object.hasOwn(contract.scenes, sceneIndex) ||
      json?.scenes?.length !== 822 ||
      json?.nodes?.length !== 13846 ||
      json?.meshes?.length !== 5237 ||
      json?.scene !== 292 ||
      json.scenes[sceneIndex]?.name !== contract.scenes[sceneIndex] ||
      json.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json.asset.extras.current !== false ||
      json.asset.extras.asBuilt !== false ||
      json.asset.extras.HUMAN_REVIEW !== 'NOT_RUN') {
    return result('OUT_OF_SOURCE_SCOPE');
  }

  const drain = json.nodes[contract.drainRoot];
  const sidewall = json.nodes[contract.rejectedPointer];
  if (!activeNode(json, sceneIndex, contract.drainRoot) ||
      !activeNode(json, sceneIndex, contract.rejectedPointer) ||
      !activeNode(json, sceneIndex, contract.coverRoot) ||
      drain?.name !== 'C80_620R24_L10_D2FWC_DRAIN_BODY_AND_OUTLET_WORK_TEST_HOST_HOLD' ||
      JSON.stringify(drain.children) !== '[13254,13255]' ||
      drain.extras?.current !== false ||
      drain.extras.asBuilt !== false ||
      drain.extras.hostHold !== true ||
      drain.extras.physicalHostVerified !== false ||
      drain.extras.sourceLinksBoundToViewer !== false ||
      sidewall?.mesh !== contract.rejectedPointerMesh ||
      !sidewall?.name?.includes('SIDEWALL')) {
    return result('SOURCE_NODE_OR_HOST_MISMATCH');
  }

  const coversActive = JSON.stringify(json.nodes[contract.coverRoot]?.children) === '[11643,11644]' &&
    contract.candidateLeaves.every(([id, mesh]) =>
      json.nodes[id]?.mesh === mesh && activeNode(json, sceneIndex, id));
  const pointer = drain.extras.sourceVisibleCoverNode;
  const linkedNode = Number.isInteger(pointer) ? pointer : null;
  if (pointer !== contract.rejectedPointer) {
    return result('CHANGED_POINTER_NOT_VERIFIED', linkedNode, coversActive);
  }
  return result('WRONG_SIDEWALL_POINTER', linkedNode, coversActive);
}

/** The warning is shown only on the authenticated current scene's drain subtree. */
export function r33LK75SelectionMetadataEntries(sourceModel, authenticatedSha, sceneIndex, selected) {
  const json = sourceModel?.parser?.json;
  const check = assessR33LK75CoverSource(json, authenticatedSha, sceneIndex);
  if (check.status !== 'WRONG_SIDEWALL_POINTER') return [];
  const scene = sourceModel?.scenes?.[sceneIndex];
  const associations = sourceModel?.parser?.associations;
  if (!scene || !associations || typeof associations.get !== 'function' || !selected) return [];

  const seen = new Set();
  let object = selected;
  let drainSeen = false;
  while (object && seen.size < 128 && !seen.has(object)) {
    if (object === scene) {
      if (!drainSeen) return [];
      return [
        ['LK75 kansiviite R33', 'LÄHDERISTIRIITA: n11624, mesh4418 on seinälaatta, ei kaivon kansi.'],
        ['LK75 kannen malliehdokkaat', check.candidateCoverMeshesActive
          ? 'n11643 ja n11644, mesh894/895. WORK_TEST, oikea tuote, liittymä ja asennus vahvistamatta.'
          : 'n11643 ja n11644 eivät ole tässä näkymässä varmennetusti aktiivisia. Ei fyysistä kansiväitettä.'],
      ];
    }
    seen.add(object);
    const nodeIndex = associations.get(object)?.nodes;
    if (Number.isInteger(nodeIndex)) {
      if (!activeNode(json, sceneIndex, nodeIndex)) return [];
      if (nodeIndex === R33_LK75_COVER_SOURCE.drainRoot) {
        if (object.name !== json.nodes[nodeIndex]?.name) return [];
        drainSeen = true;
      }
    }
    object = object.parent;
  }
  return [];
}
