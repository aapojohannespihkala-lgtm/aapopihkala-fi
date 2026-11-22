/**
 * R31 D-focus SOURCE_ONLY provenance gate. Display overlap is not an owner or
 * sourceLinks claim. SHA must come from the complete authenticated GLB bytes.
 * Original Drive ZIP 1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7.
 */
export const R31_D_SCOPE_SOURCE = Object.freeze({
  zipDriveId: '1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7',
  glbSha256: '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  glbBytes: 63833692,
  sceneIndex: 769,
  sceneCount: 773,
  nodeCount: 13507,
  meshCount: 5169,
  rootCount: 499,
  defaultScene: 292,
});
const validIndex = (n, length) => Number.isInteger(n) && n >= 0 && n < length;

// Ambiguous/multiple scene paths are not safe provenance evidence.
function activeParents(json) {
  const roots = json.scenes[R31_D_SCOPE_SOURCE.sceneIndex]?.nodes;
  if (!Array.isArray(roots) || roots.length !== R31_D_SCOPE_SOURCE.rootCount ||
      new Set(roots).size !== roots.length) return null;
  const parents = new Map();
  const ambiguous = new Set();
  const stack = roots.map(node => [node, null]);
  while (stack.length) {
    const [n, parent] = stack.pop();
    if (!validIndex(n, json.nodes.length)) return null;
    if (parents.has(n)) {
      if (parents.get(n) !== parent) ambiguous.add(n);
      continue;
    }
    parents.set(n, parent);
    const children = json.nodes[n]?.children ?? [];
    if (!Array.isArray(children)) return null;
    for (const child of children) stack.push([child, n]);
  }
  return { parents, ambiguous };
}

/**
 * `parentIndex` is the actual glTF parent in the selected scene, null for root.
 * Classifies view-source evidence, NEVER legal ownership or physical/as-built.
 */
export function r31DNodeScopeEvidence(json, authenticatedGlbSha256, sceneIndex, nodeIndex, meshIndex, parentIndex) {
  const s = R31_D_SCOPE_SOURCE;
  let sourceIdentityVerified = false;
  let scopeStatus = 'IDENTITY_MISMATCH';
  if (authenticatedGlbSha256 === s.glbSha256 &&
      json?.scene === s.defaultScene &&
      json?.scenes?.length === s.sceneCount &&
      json?.nodes?.length === s.nodeCount &&
      json?.meshes?.length === s.meshCount &&
      sceneIndex === s.sceneIndex &&
      json.scenes[sceneIndex]?.name?.endsWith('__scene769') &&
      validIndex(nodeIndex, s.nodeCount) && validIndex(meshIndex, s.meshCount) &&
      json.nodes[nodeIndex]?.mesh === meshIndex) {
    const graph = activeParents(json);
    const parents = graph?.parents;
    if (parents?.has(nodeIndex) && parents.get(nodeIndex) === parentIndex &&
        !graph.ambiguous.has(nodeIndex)) {
      let n = nodeIndex;
      let matched = false;
      let reliablePath = true;
      while (n !== null) {
        if (graph.ambiguous.has(n)) { reliablePath = false; break; }
        const scope = json.nodes[n]?.extras?.ylisViewScope;
        if (scope?.apartmentScope === 'D' &&
            scope.phaseScope === 'ACTIVE_IN_SELECTED_WORKTEST' &&
            scope.role === 'CONTENT' &&
            (scope.storeyScope === '1F' || scope.storeyScope === '2F')) {
          matched = true;
          break;
        }
        n = parents.get(n);
      }
      if (reliablePath) {
        sourceIdentityVerified = true;
        const node = json.nodes[nodeIndex];
        scopeStatus = matched ? 'D_VIEW_SCOPE_WORK_TEST'
          : nodeIndex === 13360 && meshIndex === 5111 && parentIndex === 13363 &&
            node.extras?.intendedViewerLayer === 'roof' ? 'CROSS_BOUNDARY_ROOF_CONTEXT'
          : node.extras?.apartmentScope === 'D' ? 'LEGACY_D_SCOPE_UNVERIFIED'
          : 'SOURCE_SCOPE_UNRESOLVED';
      }
    }
  }
  return Object.freeze({
    sourceIdentityVerified,
    scopeStatus,
    dViewScopeVerified: sourceIdentityVerified && scopeStatus === 'D_VIEW_SCOPE_WORK_TEST',
    apartmentOwnershipVerified: false,
    sourceLinksBound: false,
    physicalHostVerified: false,
    publishAllowed: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
  });
}
