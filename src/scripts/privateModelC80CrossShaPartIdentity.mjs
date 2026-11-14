// VP-008: an index in one GLB is not an identity in a different GLB.
// Consumes a GLB digest already authenticated by the existing source loader.
// This identity check cannot authorize C80 sourceLinks, installation, publication,
// or a GLB mutation. Caller must use a fresh target-GLB identity after remapping.
const SHA256 = /^[0-9a-f]{64}$/;
const hold = (reason) => Object.freeze({ status: 'SOURCE_HOLD', reason, sourceIdentityVerified: false });

function scenePathsToNode(gltf, sceneIndex, nodeIndex) {
  const roots = gltf?.scenes?.[sceneIndex]?.nodes;
  const nodes = gltf?.nodes;
  if (!Array.isArray(roots) || !Array.isArray(nodes)) return [];
  const out = [];
  const visit = (i, path, seen) => {
    if (!Number.isInteger(i) || i < 0 || i >= nodes.length || seen.has(i) || path.length >= 256) return;
    const next = [...path, i];
    if (i === nodeIndex) out.push(next);
    const seenNext = new Set(seen);
    seenNext.add(i);
    for (const c of nodes[i]?.children ?? []) visit(c, next, seenNext);
  };
  for (const root of roots) visit(root, [], new Set());
  return out;
}

export function verifyC80PartIdentity({
  gltf,
  verifiedGlbSha256,
  identity,
} = {}) {
  if (!SHA256.test(verifiedGlbSha256 ?? '') ||
      !SHA256.test(identity?.glbSha256 ?? '') ||
      verifiedGlbSha256 !== identity.glbSha256)
    return hold('CROSS_SHA_OR_UNVERIFIED_SOURCE');
  if (!Number.isInteger(identity.sceneIndex) ||
      !Array.isArray(gltf?.scenes) ||
      !gltf.scenes[identity.sceneIndex] ||
      typeof identity.sceneName !== 'string' ||
      gltf.scenes[identity.sceneIndex]?.name !== identity.sceneName)
    return hold('SCENE_IDENTITY_MISMATCH');
  if (!Number.isInteger(identity.nodeIndex) || !Number.isInteger(identity.meshIndex) ||
      typeof identity.nodeName !== 'string' || !identity.nodeName ||
      !Array.isArray(identity.nodePath) || identity.nodePath.length < 1 ||
      !identity.nodePath.every(Number.isInteger))
    return hold('INCOMPLETE_PART_IDENTITY');
  const node = gltf.nodes?.[identity.nodeIndex];
  if (!node || node.name !== identity.nodeName || node.mesh !== identity.meshIndex ||
      !gltf.meshes?.[identity.meshIndex])
    return hold('NODE_NAME_OR_MESH_MISMATCH');
  const paths = scenePathsToNode(gltf, identity.sceneIndex, identity.nodeIndex);
  if (paths.length !== 1 ||
      JSON.stringify(paths[0]) !== JSON.stringify(identity.nodePath))
    return hold('NODE_NOT_EXACTLY_REACHABLE_FROM_SCENE');
  return Object.freeze({
    status: 'SOURCE_PART_IDENTITY_VERIFIED', sourceIdentityVerified: true,
    glbSha256: verifiedGlbSha256, sceneIndex: identity.sceneIndex,
    nodeIndex: identity.nodeIndex, meshIndex: identity.meshIndex,
    nodePath: Object.freeze([...identity.nodePath]),
    canRelinkSourceCard: false, canMutateGLB: false,
    productionWebGL: 'NOT_RUN', humanReview: 'NOT_RUN', current: false,
  });
}

// There is intentionally no numeric-index transfer API. For a successor,
// author a NEW expected identity using the successor's verified GLB SHA,
// scene index, mesh, name and fully reconstructed root-to-leaf path.
