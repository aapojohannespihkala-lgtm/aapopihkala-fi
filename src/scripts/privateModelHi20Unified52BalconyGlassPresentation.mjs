// HI20 exact-source WORK_TEST presentation, never a geometry/material export.
const TARGETS = [
  { scene: 48, ids: [...Array.from({ length: 8 }, (_, i) => 2221 + i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)] },
  { scene: 51, ids: [...Array.from({ length: 8 }, (_, i) => i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)] },
];
const ORIGINAL_ALPHA = 0.24;
const REVIEW_ALPHA = 0.60;
const GLB_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';

export function createHi20BalconyGlassPresentation(gltf, verifiedGlbSha) {
  const unavailable = (reason) => ({
    available: false, reason, count: 0, enabled: false,
    setEnabled: () => false, dispose: () => {},
  });
  if (verifiedGlbSha !== GLB_SHA || gltf?.parser?.json?.scenes?.length !== 52 ||
      gltf?.scenes?.length !== 52) return unavailable('source-sha-or-scene-count');
  const associations = gltf.parser?.associations;
  if (typeof associations?.get !== 'function') return unavailable('source-node-associations');
  const selected = [];
  const materialIsGlass = (material) => material && typeof material.opacity === 'number' &&
    Math.abs(material.opacity - ORIGINAL_ALPHA) < 0.005 && material.transparent === true &&
    typeof material.clone === 'function';
  for (const target of TARGETS) {
    const scene = gltf.scenes[target.scene];
    if (!scene || typeof scene.traverse !== 'function') return unavailable('missing-scene');
    const wanted = new Set(target.ids);
    const seen = new Set();
    scene.traverse((mesh) => {
      if (!mesh.isMesh) return;
      let ancestor = mesh;
      let sourceNode = null;
      while (ancestor) {
        const assoc = associations.get(ancestor);
        if (Number.isInteger(assoc?.nodes) && wanted.has(assoc.nodes)) {
          sourceNode = assoc.nodes;
          break;
        }
        if (ancestor === scene) break;
        ancestor = ancestor.parent;
      }
      if (sourceNode === null) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!materials.length || materials.some((m) => !materialIsGlass(m))) return;
      seen.add(sourceNode);
      selected.push({ mesh, original: mesh.material, sourceNode, scene: target.scene });
    });
    // Fail closed rather than styling some of a balcony or a different GLB revision.
    if (seen.size !== wanted.size) return unavailable('source-glass-not-all-found');
  }
  // Reject a shared mesh instance in multiple independent source scenes.
  if (new Set(selected.map((row) => row.mesh)).size !== selected.length)
    return unavailable('shared-scene-mesh');
  let enabled = false;
  const cloneMaterial = (m) => {
    const clone = m.clone();
    clone.opacity = REVIEW_ALPHA;
    clone.transparent = true;
    clone.depthWrite = false;
    clone.needsUpdate = true;
    return clone;
  };
  const restore = () => {
    if (!enabled) return;
    for (const row of selected) {
      const customized = row.mesh.material;
      row.mesh.material = row.original;
      for (const material of (Array.isArray(customized) ? customized : [customized])) {
        material.dispose?.();
      }
    }
    enabled = false;
  };
  const api = {
    available: true, reason: null, count: selected.length,
    get enabled() { return enabled; },
    setEnabled(next) {
      if (!next) { restore(); return true; }
      if (enabled) return true;
      for (const row of selected) {
        row.mesh.material = Array.isArray(row.original)
          ? row.original.map(cloneMaterial) : cloneMaterial(row.original);
      }
      enabled = true;
      return true;
    },
    dispose: restore,
  };
  return api;
}
