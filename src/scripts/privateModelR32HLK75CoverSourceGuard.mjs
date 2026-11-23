/**
 * R32H LK75 sourceVisibleCoverNode source-contract validator.
 * Based on source-exact review of ORIGINAL R32H c26d99c1 in High KP011, 23.11.2026.
 * No source GLB mutation, no physical as-built assertion, no dynamic remap.
 * The source pointer 11624 is a tile sidewall, not the visible floor-drain cover.
 */
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from './privateModelC80R31ReviewRuntime.mjs';

export const R32H_LK75_COVER_CONTRACT = Object.freeze({
  drainRoot: 13253,
  pointerField: 'sourceVisibleCoverNode',
  rejectedPointer: 11624,
  rejectedMesh: 4418,
  coverRoot: 11645,
  coverLeafMeshes: Object.freeze([[11643, 894], [11644, 895]]),
  reviewedScenes: Object.freeze(Object.values(C80_R32H_VIEWS).map((v) => v.sceneIndex)),
  evidence: 'R32H_ORIGINAL_GLB_SOURCE_EXACT_20261123_LK75',
});

function isActiveJsonNode(json, sceneIndex, targetId) {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const index = stack.pop();
    if (!Number.isInteger(index) || index < 0 || seen.has(index)) continue;
    seen.add(index);
    if (index === targetId) return true;
    const children = json.nodes?.[index]?.children;
    if (Array.isArray(children)) stack.push(...children);
  }
  return false;
}

/**
 * Return SOURCE_CONFLICT for the known incorrect original pointer, never an
 * auto-corrected as-built cover association. A correct-looking future pointer
 * is only a candidate until exact host/product evidence is reviewed.
 */
export function assessR32HLK75CoverSource(json, authenticatedSha, sceneIndex) {
  const common = {
    sourceSha256: C80_R32H_SOURCE.glbSha256,
    sceneIndex,
    stage: 'WORK_TEST_HOST_HOLD',
    physicalHostVerified: false,
    asBuiltClaim: false,
    candidateCoverIds: [...R32H_LK75_COVER_CONTRACT.coverLeafMeshes.map(([id]) => id)],
  };
  const result = (status, linkedNode = null, candidateCoverMeshesActive = false) =>
    Object.freeze({ ...common, status, linkedNode, candidateCoverMeshesActive });
  if (authenticatedSha !== C80_R32H_SOURCE.glbSha256 ||
      !R32H_LK75_COVER_CONTRACT.reviewedScenes.includes(sceneIndex) ||
      !Object.values(C80_R32H_VIEWS).some((v) =>
        v.sceneIndex === sceneIndex && json?.scenes?.[sceneIndex]?.name === v.name) ||
      json?.nodes?.length !== C80_R32H_SOURCE.nodeCount) {
    return result('OUT_OF_SOURCE_SCOPE');
  }
  const contract = R32H_LK75_COVER_CONTRACT;
  if (!isActiveJsonNode(json, sceneIndex, contract.drainRoot)) return result('DRAIN_NOT_ACTIVE');
  const root = json.nodes[contract.drainRoot];
  const pointer = root?.extras?.[contract.pointerField];
  const candidatesActive = isActiveJsonNode(json, sceneIndex, contract.coverRoot) &&
    contract.coverLeafMeshes.every(([id, mesh]) =>
      json.nodes?.[id]?.mesh === mesh && isActiveJsonNode(json, sceneIndex, id));
  const linkedNode = Number.isInteger(pointer) ? pointer : null;
  if (linkedNode === contract.rejectedPointer &&
      json.nodes[linkedNode]?.mesh === contract.rejectedMesh &&
      /SIDEWALL/.test(json.nodes[linkedNode]?.name ?? '')) {
    return result('WRONG_SIDEWALL_POINTER', linkedNode, candidatesActive);
  }
  if (candidatesActive && contract.coverLeafMeshes.some(([id]) => linkedNode === id)) {
    return result('CANDIDATE_LEAF_ONLY', linkedNode, true);
  }
  return result('UNVERIFIED_COVER_LINK', linkedNode, candidatesActive);
}

/**
 * Add an LK75 selection-panel source warning only for a verified R32H node
 * beneath drain root 13253 in the exact live glTF scene. This supplements
 * the existing evidence card and never rewires sourceLinks or changes a mesh.
 * Unassociated/stale/reparented objects fail closed.
 */
export function r32hLK75SelectionMetadataEntries(sourceModel, authenticatedSha, sceneIndex, selected) {
  const json = sourceModel?.parser?.json;
  const receipt = assessR32HLK75CoverSource(json, authenticatedSha, sceneIndex);
  if (receipt.status !== 'WRONG_SIDEWALL_POINTER') return [];
  const scene = sourceModel?.scenes?.[sceneIndex];
  const associations = sourceModel?.parser?.associations;
  if (!scene || !associations || typeof associations.get !== 'function' || !selected) return [];
  const visited = new Set();
  let object = selected;
  let drainOnPath = false;
  while (object && !visited.has(object) && visited.size < 128) {
    if (object === scene) {
      if (!drainOnPath) return [];
      return [
        ['LK75 kansiviite', 'LÄHDERISTIRIITA: n11624 (mesh4418) on seinälaatta, ei kaivon kansi.'],
        ['LK75 kannen ehdokkaat', 'n11643 ja n11644 (mesh894/895), root n11645. Tuote, liittymä ja asennus vahvistamatta.'],
      ];
    }
    visited.add(object);
    const nodeIndex = associations.get(object)?.nodes;
    if (Number.isInteger(nodeIndex)) {
      if (!isActiveJsonNode(json, sceneIndex, nodeIndex)) return [];
      if (nodeIndex === R32H_LK75_COVER_CONTRACT.drainRoot) {
        if (object.name !== json.nodes[nodeIndex]?.name) return [];
        drainOnPath = true;
      }
    }
    object = object.parent;
  }
  return [];
}
