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
 * GLTFLoader may clone a source node shared between scenes and drop the
 * parser.associations entry for the visible Three.Mesh. Only a *missing*
 * binding can use this fallback, after a unique full source-parent path,
 * source node/mesh, real mounted mesh, and name uniqueness check.
 * A contradictory existing association is never overridden.
 */
function uniquelyNamedSourceFallback(json, sceneIndex, mountedScene, selected, associations) {
  if (!selected?.isMesh || !selected.geometry ||
      typeof mountedScene?.traverse !== 'function') return false;
  const selectedBinding = associations.get(selected);
  if (selectedBinding?.nodes !== undefined || selectedBinding?.meshes !== undefined) return false;
  let realMeshMatches = 0;
  mountedScene.traverse((object) => {
    if (object.isMesh && object.name === selected.name) realMeshMatches++;
  });
  if (realMeshMatches !== 1) return false;

  const roots = json.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const stack = roots.map((id) => ({ id, parents: [] }));
  const activeSameNamePaths = [];
  let visits = 0;
  while (stack.length && visits++ < C80_R32H_SOURCE.nodeCount * 2) {
    const { id, parents } = stack.pop();
    if (!Number.isInteger(id) || id < 0 || id >= json.nodes.length ||
        parents.includes(id)) continue;
    const sourceNode = json.nodes[id];
    if (sourceNode?.name === selected.name) {
      activeSameNamePaths.push({ id, parents });
      if (activeSameNamePaths.length > 1) return false;
    }
    if (Array.isArray(sourceNode?.children)) {
      for (const child of sourceNode.children) {
        stack.push({ id: child, parents: [...parents, id] });
      }
    }
  }
  if (stack.length || activeSameNamePaths.length !== 1) return false;
  const { id, parents } = activeSameNamePaths[0];
  if (!warningNodeIds.has(id) || !Number.isInteger(json.nodes[id]?.mesh)) return false;
  let parent = selected.parent;
  for (const sourceParentId of parents.slice().reverse()) {
    const expectedName = json.nodes[sourceParentId]?.name;
    if (!expectedName || !parent || parent === mountedScene ||
        parent.name !== expectedName) return false;
    const binding = associations.get(parent);
    if (binding?.nodes !== undefined && binding.nodes !== sourceParentId) return false;
    if (binding?.meshes !== undefined &&
        binding.meshes !== json.nodes[sourceParentId]?.mesh) return false;
    parent = parent.parent;
  }
  return parent === mountedScene;
}

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
    const binding = associations.get(node);
    const nodeId = binding?.nodes;
    if (node === selected && !Number.isInteger(nodeId) &&
        uniquelyNamedSourceFallback(json, sceneIndex, mountedScene, node, associations)) {
      selectsClashingPipe = true;
    }
    if (binding?.meshes !== undefined && !Number.isInteger(nodeId)) return [];
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
