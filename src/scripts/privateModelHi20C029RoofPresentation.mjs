// C80-029 / D1F-WP3: reuse the source 52-scene GLB's existing orphan
// D storage roof roots in the 1F/BOTH viewer scenes. NO mesh, material,
// binary, geometry or sourceLinks are invented or changed. WORK_TEST only.
// Matches the already-reviewed C80-029 54-scene optional scene-root donor.
export const C029_SOURCE_SHA =
  '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  { scene: 50, node: 5757 },
  { scene: 51, node: 5778 },
];
const unavailable = (reason) => ({
  available: false, reason, count: 0, visible: false,
  setVisible: () => false, dispose: () => {},
});
export async function createHi20C029RoofPresentation(gltf, verifiedSha) {
  const parser = gltf?.parser;
  const json = parser?.json;
  if (verifiedSha !== C029_SOURCE_SHA ||
      json?.asset?.version !== '2.0' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.scene !== 0 || json?.scenes?.length !== 52 ||
      gltf?.scenes?.length !== 52)
    return unavailable('source-sha-or-scenes');
  if (typeof parser?.getDependency !== 'function')
    return unavailable('source-node-loader');
  const mesh = json.meshes?.[514];
  const material = json.materials?.[85];
  if (mesh?.primitives?.length !== 1 ||
      mesh.primitives[0].material !== 85 ||
      material?.alphaMode !== 'BLEND' || material?.doubleSided !== true ||
      Math.abs((material?.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 0) - .58) > 1e-6)
    return unavailable('source-storage-roof-mesh');
  for (const target of TARGETS) {
    const node = json.nodes?.[target.node];
    if (!node || node.mesh !== 514 ||
        typeof node.name !== 'string' || !/ROOF/i.test(node.name) ||
        node.extras?.presentationOnly !== true ||
        typeof node.extras?.sourceDriveId !== 'string' ||
        !gltf.scenes[target.scene]?.isScene ||
        json.scenes[target.scene]?.nodes?.includes(target.node) ||
        json.nodes.some((parent) => parent.children?.includes(target.node)))
      return unavailable('source-roof-orphan-identity');
  }
  let roots;
  try {
    roots = await Promise.all(TARGETS.map((target) =>
      parser.getDependency('node', target.node)));
  } catch {
    return unavailable('source-roof-load');
  }
  if (roots.length !== 2 || roots[0] === roots[1] ||
      roots.some((root, i) =>
        !root?.isMesh || root.name !== json.nodes[TARGETS[i].node].name ||
        root.visible !== true || !root.geometry || !root.material))
    return unavailable('loaded-roof-identity');
  const mounts = [];
  try {
    for (let i = 0; i < TARGETS.length; i++) {
      const destination = gltf.scenes[TARGETS[i].scene];
      // Object3D.clone shares the EXACT mesh geometry/material. A separate
      // object protects the original orphan and its source-scene ownership.
      const copy = roots[i].clone(false);
      if (!copy?.isMesh || copy.geometry !== roots[i].geometry ||
          copy.material !== roots[i].material ||
          copy.name !== roots[i].name)
        throw new Error('non-exact-roof-clone');
      copy.visible = true;
      destination.add(copy);
      mounts.push({ destination, copy });
    }
  } catch {
    mounts.forEach(({destination,copy}) => destination.remove(copy));
    return unavailable('roof-mount');
  }
  let visible = true;
  return {
    available: true, reason: null, count: 2,
    get visible() { return visible; },
    setVisible(next) {
      visible = Boolean(next);
      for (const { copy } of mounts) copy.visible = visible;
      return true;
    },
    dispose() {
      for (const { destination, copy } of mounts) destination.remove(copy);
      visible = false;
    },
  };
}
