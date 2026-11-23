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
 * Real GLTFLoader may clone a glTF node shared between scenes and omit its
 * parser.associations entry. For an ABSENT binding only, recover the original
 * source node from the authenticated JSON, direct source parent, unique actual
 * scene mesh, and the exact source POSITION accessor bounds. A present but
 * contradictory binding never uses this fallback. This never changes geometry.
 */
function missingAssociationSourceNode(json, sceneIndex, scene, associations, selected) {
  if (!selected?.isMesh || !selected?.parent || typeof scene?.traverse !== 'function' ||
      associations.get(selected) != null) return null;
  const matches = [...warningNodeIds].filter((id) => json.nodes?.[id]?.name === selected.name);
  if (matches.length !== 1) return null;
  const id = matches[0];
  const sourceNode = json.nodes[id];
  const roots = json.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return null;

  // Find direct parents *in this source scene*, not parents in stale other views.
  const parentIds = [];
  for (let p = 0; p < json.nodes.length; p++) {
    if (json.nodes[p]?.children?.includes(id) && isActiveNode(json, sceneIndex, p) &&
        json.nodes[p].name === selected.parent.name) parentIds.push(p);
  }
  if (parentIds.length !== 1) return null;
  const parentBinding = associations.get(selected.parent);
  if (parentBinding?.nodes !== undefined && parentBinding.nodes !== parentIds[0]) return null;

  const primitives = json.meshes?.[sourceNode.mesh]?.primitives;
  if (!Array.isArray(primitives) || primitives.length !== 1) return null;
  const accessor = json.accessors?.[primitives[0]?.attributes?.POSITION];
  const attr = selected.geometry?.getAttribute?.('position');
  if (!accessor || accessor.componentType !== 5126 || accessor.type !== 'VEC3' ||
      !Array.isArray(accessor.min) || !Array.isArray(accessor.max) ||
      attr?.itemSize !== 3 || attr.count !== accessor.count ||
      typeof attr.getX !== 'function' || typeof attr.getY !== 'function' ||
      typeof attr.getZ !== 'function') return null;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < attr.count; i++) {
    const pos = [attr.getX(i), attr.getY(i), attr.getZ(i)];
    for (let k = 0; k < 3; k++) {
      if (!Number.isFinite(pos[k])) return null;
      min[k] = Math.min(min[k], pos[k]);
      max[k] = Math.max(max[k], pos[k]);
    }
  }
  const close = (a, b) => Math.abs(a - b) <= 0.0002;
  if (![0, 1, 2].every((k) => close(min[k], accessor.min[k]) &&
      close(max[k], accessor.max[k]))) return null;

  // Clone-name ambiguity is a hard stop, even if one candidate was clicked.
  let identicalSceneMeshes = 0;
  scene.traverse((object) => {
    if (object?.isMesh && object.name === selected.name &&
        object.parent?.name === selected.parent.name) identicalSceneMeshes++;
  });
  return identicalSceneMeshes === 1 ? id : null;
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
    const association = associations.get(node);
    const nodeId = association?.nodes ??
      (node === selected && association == null
        ? missingAssociationSourceNode(json, sceneIndex, mountedScene, associations, selected)
        : null);
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
