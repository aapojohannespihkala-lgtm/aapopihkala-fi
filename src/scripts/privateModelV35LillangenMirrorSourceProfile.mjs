/**
 * Exact V35 SOURCE_ONLY mirror cabinet source profile.
 * 2015 product/proxy geometry is not evidence of installed CURRENT equipment.
 * No name-, colour- or appearance-based classification is permitted.
 */
export const V35_LILLANGEN_SHA256 =
  'f81e0915711b798ec4a02472202a3372a4a77057cd8a150cc17f89bef3cd4789';
export const V35_LILLANGEN_DONOR_SHA256 =
  '751dd47b75eed697ecc1a69f2f30d0e93e483918809f377b214134716d59d395';
export const V35_LILLANGEN_SCENES = Object.freeze({
  197: { floor: '2F', name: 'C80R2_V35_D2F_WORK_TEST_HOST_HOLD_20261102' },
  198: { floor: 'BOTH', name: 'C80R2_V35_BOTH_WORK_TEST_HOST_HOLD_20261102' },
});
export const V35_LILLANGEN_EXCLUDED_NODE = 5826;
export const V35_LILLANGEN_PARTS = Object.freeze([
  ['carcass_left',1753],['carcass_right',1754],['carcass_base',1755],['carcass_top',1756],
  ['carcass_back',1757],['glass_shelf_1',1758],['glass_shelf_2',1759],
  ['vertical_centre_visual_reference',1760],
  ['door_L_white_panel',1761],['door_L_mirror_outer',1762],
  ['door_L_edge_top',1763],['door_L_edge_bottom',1764],
  ['door_R_white_panel',1765],['door_R_mirror_outer',1766],
  ['door_R_edge_top',1767],['door_R_edge_bottom',1768],
].map(([suffix,meshIndex],i) => Object.freeze({
  nodeIndex:5819+i, meshIndex, name:`C80_018_MIRROR_LILLANGEN60_2015_${suffix}`,
  physicalPart:5819+i!==V35_LILLANGEN_EXCLUDED_NODE,
})));

const sameSha = value => typeof value === 'string' &&
  value.toLowerCase() === V35_LILLANGEN_SHA256;
const samePath = (actual, expected) => Array.isArray(actual) &&
  actual.length === expected.length && actual.every((v,i) => v === expected[i]);

/**
 * Resolve one physical mirror part only with source-verified glTF metadata.
 * The caller independently checks live GLTFParser associations and source mesh
 * visibility, and must independently hash the loaded GLB.
 */
export function resolveV35LillangenSourceMesh({
  glbJson, expectedSourceSha256, loadedSourceSha256, sceneIndex, floor, nodeIndex,
  nodePath,
} = {}) {
  if (!sameSha(expectedSourceSha256) || !sameSha(loadedSourceSha256)) return null;
  if (!glbJson || glbJson.scenes?.length !== 199 ||
      glbJson.nodes?.length !== 9334 ||
      glbJson.meshes?.length !== 3284) return null;
  if (!Object.hasOwn(V35_LILLANGEN_SCENES, sceneIndex)) return null;
  const scene = V35_LILLANGEN_SCENES[sceneIndex];
  if (scene.floor !== floor || glbJson.scenes[sceneIndex]?.name !== scene.name) return null;
  if (!Number.isInteger(nodeIndex) || nodeIndex === V35_LILLANGEN_EXCLUDED_NODE) return null;
  const part = V35_LILLANGEN_PARTS.find(p => p.nodeIndex === nodeIndex);
  if (!part?.physicalPart || !samePath(nodePath, [5835, 5818, nodeIndex])) return null;

  const root = glbJson.nodes[5835];
  const parent = glbJson.nodes[5818];
  const node = glbJson.nodes[nodeIndex];
  if (!root || !parent || !node ||
      !glbJson.scenes[sceneIndex].nodes?.includes(5835) ||
      !samePath(root.children, [5818]) ||
      !samePath(parent.children, Array.from({length:16},(_,i)=>5819+i)) ||
      root.name !== 'C80_018_MIRROR_LILLANGEN60_2015_GLB_WORLD_FROM_2015_ROOM_HOST' ||
      parent.name !== 'C80_018_MIRROR_LILLANGEN60_2015_world' ||
      parent.extras?.donorSha256 !== V35_LILLANGEN_DONOR_SHA256 ||
      parent.extras?.geometryLevel !== 'SOURCE_ONLY_PRODUCT_2015_PLUS_VISUAL_PROXY' ||
      root.extras?.current !== false || root.extras?.asBuilt !== false ||
      node.extras?.current !== false || node.extras?.asBuilt !== false ||
      node.extras?.donorSha256 !== V35_LILLANGEN_DONOR_SHA256 ||
      node.mesh !== part.meshIndex || node.name !== part.name) return null;

  return {
    id: 'architecture-fixtures',
    sourceNodeIndex: nodeIndex,
    sourceMeshIndex: part.meshIndex,
    sourceNodePath: [...nodePath],
    sourceSha256: V35_LILLANGEN_SHA256,
    sceneIndex,
    bindingKind: 'EXACT_V35_SOURCE_ONLY_PRODUCT_2015',
    status: 'WORK_TEST_HOST_HOLD_NONCURRENT_NOT_AS_BUILT',
  };
}
