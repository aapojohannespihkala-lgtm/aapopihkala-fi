import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

const active = new WeakSet();
const fail = reason => { throw new Error('R1125_FOCUS_8020_REJECTED: ' + reason); };
const targetKeys = Object.keys(m5aR1125SourcePixelKinds);

/* Verified directly from immutable R1125 original GLB scene 63, SHA-256
 * c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48.
 * GLTFLoader parser associations are necessary alongside the existing source
 * binding: matching userData strings on replacement meshes never suffice. */
const exactSourceAssociations = Object.freeze({
  G2_DRAIN_WELL_SOK1_001: [1104, 555],
  G2_DRAIN_WELL_SOK2_001: [1105, 556],
  G2_DRAIN_WELL_SOK3_001: [1106, 557],
  G2_DRAIN_WELL_PVK_001: [1107, 558],
  G2_DRAIN_LINK_PVK_SOK1_001: [1118, 559],
  G2_DRAIN_LINK_PVK_SOK3_001: [1119, 560],
  G2_DRAIN_LINK_SOK1_SOK2_001: [1120, 561],
  G2_DRAIN_LINK_SOK3_BUILDING_END_001: [1121, 562],
  G2_DRAIN_LINK_SOK2_BUILDING_END_001: [1122, 563],
  G2_DRAIN_LINK_PVK_DISCHARGE_001: [1123, 564],
  G2_DRAIN_LINK_PVK_PARKING_001: [1124, 565],
  'boundary:PVK_DISCHARGE': [1115, 534],
  'boundary:PVK_PARKING': [1116, 534],
});

/**
 * Reversible 80/20 WORK_TEST presentation for the ORIGINAL 13 source targets.
 * Caller must first use bindAuthenticatedR1125Scene63 on immutable raw GLB.
 * This helper cannot independently verify raw bytes, WebGL pixels or humans.
 * Do not enable it on CURRENT or publish it as surveyed pipe geometry.
 */
export function prepareM5AR1125Focus8020({ gltf, binding } = {}) {
  const scene = gltf?.scenes?.[63], root = binding?.sourceRoot;
  if (!scene?.isGroup || !root?.isObject3D ||
      !scene.userData || scene.userData.Canonical !== false ||
      scene.userData.presentationOnly !== true ||
      scene.userData.currentGeometryClaim !== false ||
      scene.userData.asBuiltClaim !== false ||
      scene.userData.publishToCURRENT !== false ||
      binding.sourceSceneIndex !== 63 || binding.sourceTargetCount !== 13 ||
      binding.originalGlbDigestAuthenticated !== true ||
      binding.originalSourceDigest !==
        'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48' ||
      binding.current !== false || binding.canonical !== false ||
      binding.asBuilt !== false || binding.humanReview !== 'NOT_RUN' ||
      !binding.targets || root.children.length !== 13 ||
      active.has(scene)) fail('original scene, source binding or inactive state required');

  const ancestors = new Set();
  for (let node = root; node; node = node.parent) {
    if (node.visible === false) fail('source hierarchy hidden');
    ancestors.add(node);
    if (node === scene) break;
  }
  if (!ancestors.has(scene)) fail('source root detached from original scene');
  const associations = gltf?.parser?.associations;
  if (!(associations instanceof Map) ||
      associations.get(root)?.nodes !== 1125 ||
      Object.keys(exactSourceAssociations).length !== targetKeys.length) {
    fail('original GLTFLoader root node association required');
  }
  const targets = new Set();
  for (const key of targetKeys) {
    const object = binding.targets[key];
    const data = object?.userData;
    const sourceKey = data?.representationKind === 'unresolvedBoundaryMarker'
      ? 'boundary:' + data.boundaryRole : data?.G2IdCandidate;
    const identity = exactSourceAssociations[key];
    const association = associations.get(object);
    if (!identity || !association || association.nodes !== identity[0] ||
        association.meshes !== identity[1] ||
        (association.primitives !== undefined && association.primitives !== 0) ||
        (key.startsWith('boundary:') ? !object?.isLineSegments : !object?.isMesh)) {
      fail('original glTF node/mesh association mismatch: ' + key);
    }
    if (!object || object.parent !== root || !object.isObject3D ||
        !object.visible || targets.has(object) || sourceKey !== key ||
        data?.presentationOnly !== true || data?.Canonical !== false ||
        data?.currentGeometryClaim !== false || data?.asBuiltClaim !== false ||
        data?.publishToCURRENT !== false) fail('missing or unsafe original target: ' + key);
    targets.add(object);
  }
  if (targets.size !== 13 ||
      root.children.some(child => !targets.has(child))) {
    fail('the complete original 13-target roster is required');
  }

  const entries = [];
  scene.traverse(object => {
    if (!(object.isMesh || object.isLine || object.isLineSegments)) return;
    if (!object.visible) return;
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    if (!originals.length || originals.some(m =>
      !m || typeof m.clone !== 'function' || m.visible === false ||
      !Number.isFinite(m.opacity) || m.opacity <= 0)) {
      fail('source render material unavailable');
    }
    entries.push({ object, material: object.material,
      renderOrder: object.renderOrder, isTarget: targets.has(object) });
  });
  if (entries.filter(e => e.isTarget).length !== 13 ||
      !entries.some(e => !e.isTarget)) fail('13 source targets and separate context required');
  const prepared = [];
  try {
    for (const entry of entries) {
      const originals = Array.isArray(entry.material) ? entry.material : [entry.material];
      const clones = originals.map(mat => {
        const clone = mat.clone();
        clone.transparent = true;
        clone.opacity = entry.isTarget ? 0.8 : 0.2;
        clone.depthWrite = false;
        if (entry.isTarget) clone.depthTest = false;
        clone.needsUpdate = true;
        return clone;
      });
      prepared.push({ ...entry, clones });
    }
    // Two-phase application: all required clones must exist before any swap.
    for (const entry of prepared) {
      entry.object.material = Array.isArray(entry.material) ? entry.clones : entry.clones[0];
      entry.object.renderOrder = entry.isTarget ? 1000 : entry.renderOrder;
    }
    active.add(scene);
  } catch (error) {
    for (const entry of prepared) {
      entry.object.material = entry.material;
      entry.object.renderOrder = entry.renderOrder;
      for (const clone of entry.clones) clone.dispose();
    }
    throw error;
  }
  let restored = false;
  const restore = () => {
    if (restored) return { state: 'ALREADY_RESTORED', exactMaterialRefsRestored: true };
    for (const entry of prepared) {
      entry.object.material = entry.material;
      entry.object.renderOrder = entry.renderOrder;
    }
    for (const entry of prepared) {
      for (const clone of entry.clones) clone.dispose();
    }
    active.delete(scene);
    restored = true;
    return { state: 'RESTORED', exactMaterialRefsRestored: true };
  };
  return Object.freeze({
    state: 'WORK_TEST_PRESENTATION_ONLY',
    sourceTargetCount: 13,
    presentedTargetCount: prepared.filter(e => e.isTarget).length,
    contextPrimitiveCount: prepared.filter(e => !e.isTarget).length,
    targetOpacity: 0.8, contextOpacity: 0.2,
    originalGlbDigestVerifiedByThisHelper: false,
    webglPixelProof: false, authenticatedProductionProof: false,
    physicalPlacementVerified: false, current: false, canonical: false,
    asBuilt: false, humanReview: 'NOT_RUN',
    restore,
  });
}
