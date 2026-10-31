// C80-004: reversible visibility of six verified translucent architectural
// SOURCE_CONTEXT references, independent of terrain, trees and physical walls.
// This is WORK_TEST/HOST_HOLD display state, not proof of a flicker cure.
export const C004_SOURCE_SHA = '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const TARGETS = Object.freeze([
  { scene: 60, parent: 6499, node: 5741, mesh: 1485, material: 183, alpha: .18, name: 'C80_SOURCE_CONTEXT__1F_G1_GROUND_REFERENCE__C80_029_HI13_CLONE' },
  { scene: 60, parent: 6499, node: 5743, mesh: 1657, material: 182, alpha: .30, name: 'C80_SOURCE_CONTEXT__1F_K3_SHARED_DC_CONTEXT__C80_029_HI13_CLONE' },
  { scene: 63, parent: 6500, node: 5759, mesh: 1485, material: 183, alpha: .18, name: 'C80_SOURCE_CONTEXT__1F_G1_GROUND_REFERENCE__C80_029_HI13_CLONE' },
  { scene: 63, parent: 6500, node: 5761, mesh: 1657, material: 182, alpha: .30, name: 'C80_SOURCE_CONTEXT__1F_K3_SHARED_DC_CONTEXT__C80_029_HI13_CLONE' },
  { scene: 63, parent: 6500, node: 5763, mesh: 1721, material: 184, alpha: .13, name: 'C80_SOURCE_CONTEXT__ATTIC_K14_GABLE_CONTEXT__C80_029_HI13_CLONE' },
  { scene: 63, parent: 6500, node: 5764, mesh: 1500, material: 184, alpha: .13, name: 'C80_SOURCE_CONTEXT__ATTIC_SHARED_DC_CONTEXT__C80_029_HI13_CLONE' },
]);
const denied = reason => ({
  available: false, reason, count: 0, visible: true,
  setSourceContextVisible: () => ({ applied: false, reason }),
  dispose: () => {},
});
export function createUnified64C004SourceContextPresentation(gltf, verifiedSha) {
  const json = gltf?.parser?.json, assoc = gltf?.parser?.associations;
  if (verifiedSha !== C004_SOURCE_SHA ||
      json?.asset?.version !== '2.0' || json?.scene !== 0 ||
      json?.asset?.extras?.current !== false || json?.asset?.extras?.asBuilt !== false ||
      json?.scenes?.length !== 64 || gltf?.scenes?.length !== 64 ||
      json?.nodes?.length !== 6518 || json?.meshes?.length !== 1873 ||
      typeof assoc?.get !== 'function')
    return denied('original-source-identity');
  const selected = [];
  for (const target of TARGETS) {
    const sourceScene = json.scenes[target.scene];
    const parent = json.nodes[target.parent], node = json.nodes[target.node];
    const mesh = json.meshes[target.mesh];
    const material = json.materials?.[target.material];
    if (!sourceScene?.nodes?.includes(target.parent) ||
        parent?.children?.filter(id => id === target.node).length !== 1 ||
        parent?.extras?.sourceOnly !== true ||
        parent?.extras?.contextOnly !== true ||
        node?.name !== target.name || node.mesh !== target.mesh ||
        node?.extras?.sourceOnly !== true || node?.extras?.presentationOnly !== true ||
        node?.extras?.physicalHost !== 'HOST_HOLD' ||
        mesh?.primitives?.length !== 1 ||
        mesh.primitives[0]?.material !== target.material ||
        material?.alphaMode !== 'BLEND' ||
        Math.abs((material?.pbrMetallicRoughness?.baseColorFactor?.[3] ?? -1) - target.alpha) > 1e-8)
      return denied('context-node-or-material-contract');
    const found = [];
    const scene = gltf.scenes[target.scene];
    if (typeof scene?.traverse !== 'function') return denied('runtime-scene');
    scene.traverse(object => {
      if (assoc.get(object)?.nodes === target.node) found.push(object);
    });
    if (found.length !== 1 || typeof found[0].visible !== 'boolean')
      return denied('node-association');
    selected.push({ object: found[0], original: found[0].visible });
  }
  if (new Set(selected.map(v => v.object)).size !== TARGETS.length)
    return denied('duplicate-context-object');
  let visible = true, disposed = false;
  return {
    available: true, reason: null, count: selected.length,
    get visible() { return visible; },
    setSourceContextVisible(next) {
      if (disposed) return { applied: false, reason: 'disposed' };
      visible = Boolean(next);
      for (const { object, original } of selected)
        object.visible = visible ? original : false;
      return { applied: true, visible, count: selected.length };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { object, original } of selected) object.visible = original;
    },
  };
}
