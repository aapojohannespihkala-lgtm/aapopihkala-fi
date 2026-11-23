/**
 * R32H D2F kitchen wastewater source conflict. Source-exact receipt:
 * original c26d99c1 GLB, scenes 814-817. VTK triangle-intersection QA
 * (23 Nov 2026) found the inherited 2015 pipe n13310/mesh3709 intersecting
 * 2026 sink/drain pipe surfaces n13314-13317. This is a WORK_TEST warning,
 * NOT a verified plumbing connection, fitting or physical as-built route.
 */
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from './privateModelC80R31ReviewRuntime.mjs';

export const R32H_KITCHEN_WASTEWATER_CLASH = Object.freeze({
  original2015Node: 13310,
  original2015Mesh: 3709,
  conflicting2026Nodes: Object.freeze([13314, 13315, 13316, 13317]),
  evidence: 'R32H_ORIGINAL_GLB_D2F_KITCHEN_VTK_TRIANGLE_QA_20261123',
  stage: 'WORK_TEST_HOST_HOLD',
  physicalConnectionsVerified: false,
  currentClaim: false,
  asBuiltClaim: false,
});

const warningNodeIds = new Set([
  R32H_KITCHEN_WASTEWATER_CLASH.original2015Node,
  ...R32H_KITCHEN_WASTEWATER_CLASH.conflicting2026Nodes,
]);

const isActiveNode = (json, sceneIndex, targetId) => {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const id = stack.pop();
    if (!Number.isInteger(id) || id < 0 || seen.has(id)) continue;
    seen.add(id);
    if (id === targetId) return true;
    const children = json?.nodes?.[id]?.children;
    if (Array.isArray(children)) stack.push(...children);
  }
  return false;
};

/**
 * Only show the documented source clash for an associated selected glTF node
 * in the actually mounted original R32H scene. Any stale selection or mismatched
 * source/SHA/scene/node/mesh fails closed. No geometry or sourceLinks mutation.
 */
export function r32hKitchenWastewaterClashSelectionEntries(sourceModel, sha, sceneIndex, selected) {
  const json = sourceModel?.parser?.json;
  const view = Object.values(C80_R32H_VIEWS).find((v) => v.sceneIndex === sceneIndex);
  if (sha !== C80_R32H_SOURCE.glbSha256 || !view ||
      !json || json.nodes?.length !== C80_R32H_SOURCE.nodeCount ||
      json.scenes?.[sceneIndex]?.name !== view.name ||
      json.nodes?.[R32H_KITCHEN_WASTEWATER_CLASH.original2015Node]?.mesh !==
        R32H_KITCHEN_WASTEWATER_CLASH.original2015Mesh) return [];

  if (![R32H_KITCHEN_WASTEWATER_CLASH.original2015Node,
        ...R32H_KITCHEN_WASTEWATER_CLASH.conflicting2026Nodes]
    .every((id) => isActiveNode(json, sceneIndex, id))) return [];

  const mountedScene = sourceModel?.scenes?.[sceneIndex];
  const associations = sourceModel?.parser?.associations;
  if (!selected || !mountedScene || typeof associations?.get !== 'function') return [];

  let node = selected;
  let selectsClashingPipe = false;
  const visited = new Set();
  while (node && !visited.has(node) && visited.size < 128) {
    if (node === mountedScene) {
      if (!selectsClashingPipe) return [];
      return [
        ['2F-keittiön viemäriristiriita',
         'LÄHDERISTIRIITA: 2015 n13310 leikkaa 2026 viemäripintoja n13314-13317 R32H-lähdemallissa.'],
        ['Putkiliitoksen tila',
         'Geometrinen leikkaus EI todista putkien yhteyttä. Lattianalainen muhviliitos ei näy 2026 lähdekuvassa. WORK_TEST/HOST_HOLD.'],
      ];
    }
    visited.add(node);
    const nodeId = associations.get(node)?.nodes;
    if (Number.isInteger(nodeId)) {
      if (!isActiveNode(json, sceneIndex, nodeId)) return [];
      const sourceName = json.nodes?.[nodeId]?.name;
      if (sourceName && node.name !== sourceName) return [];
      if (warningNodeIds.has(nodeId)) selectsClashingPipe = true;
    }
    node = node.parent;
  }
  return [];
}
