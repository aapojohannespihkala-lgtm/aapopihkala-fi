// Many Ylisrinne GLBs reuse glTF nodes under several parents (glTF 2.0 allows
// one parent). GLTFLoader (three r185) keeps one object per node and add()
// moves it, so each shared child ends up under whichever parent resolved last;
// sourceCardIdentity's getDependencies('node') then pulls more into orphan
// parents. Production 01.11.2026 via the WORK_TEST selector: C80 HI12-HI20
// default scene ~526/1465 meshes, P174A/P176A/P177B 73-77/186,
// M5B-R1109 17/126, D1F source156 158/281.
//
// When the default scene is demonstrably short of its source primitives,
// rebuild only that scene from the source JSON tree with copies of the cached
// node objects (shared geometry/material, no GLB change). Complete scenes,
// other scenes and the loader cache are never touched. Skins/animations and
// any structural doubt leave the loader graph as it is.

const isPrimitive = (o) => o?.isMesh === true || o?.isLine === true || o?.isPoints === true;

/** Returns Map<copy, nodeIndex> for the rebuilt default scene, or null. */
export async function rehydrateIncompleteDefaultScene(gltf) {
  const parser = gltf?.parser, json = parser?.json;
  if (typeof parser?.getDependency !== 'function' || !Array.isArray(json?.nodes) ||
      !Array.isArray(json?.scenes) || json.skins?.length || json.animations?.length) return null;
  const sceneIndex = json.scene ?? 0;
  const sceneDef = json.scenes[sceneIndex], scene = gltf.scenes?.[sceneIndex];
  if (!Array.isArray(sceneDef?.nodes) || !sceneDef.nodes.length || !scene?.isObject3D) return null;
  const parents = new Uint32Array(json.nodes.length);
  for (const node of json.nodes) for (const child of node?.children ?? []) {
    if (!Number.isInteger(child) || child < 0 || child >= json.nodes.length) return null;
    parents[child]++;
  }
  if (!parents.some((count) => count > 1)) return null;

  const memo = new Map();
  const primitives = (id, depth) => {
    if (depth > 256) throw Error('SOURCE_SCENE_REHYDRATE: depth');
    if (memo.has(id)) return memo.get(id);
    const node = json.nodes[id];
    if (!node || node.skin !== undefined) throw Error('SOURCE_SCENE_REHYDRATE: node ' + id);
    const own = node.mesh === undefined ? 0 : (json.meshes?.[node.mesh]?.primitives?.length ?? NaN);
    const total = (node.children ?? []).reduce((sum, child) => sum + primitives(child, depth + 1), own);
    memo.set(id, total);
    return total;
  };
  const expected = sceneDef.nodes.reduce((sum, id) => sum + primitives(id, 0), 0);
  let loaded = 0;
  scene.traverse((o) => { if (isPrimitive(o)) loaded++; });
  if (!Number.isFinite(expected) || loaded >= expected) return null;

  const ids = [...memo.keys()];
  const cached = new Map(await Promise.all(ids.map(async (id) =>
    [id, await parser.getDependency('node', id)])));
  const own = new Map();
  for (const id of ids) {
    const base = cached.get(id);
    if (!base?.isObject3D || typeof base.clone !== 'function')
      throw Error('SOURCE_SCENE_REHYDRATE: cached node ' + id);
    // A node object only ever receives its own glTF children; everything
    // else under it (primitive meshes, camera, light) is its own content.
    const jsonChildren = new Set((json.nodes[id].children ?? []).map((child) => cached.get(child)));
    own.set(id, base.children.filter((child) => !jsonChildren.has(child)));
  }
  const map = new Map();
  const build = (id) => {
    const copy = cached.get(id).clone(false);
    for (const child of own.get(id)) copy.add(child.clone(true));
    for (const child of json.nodes[id].children ?? []) copy.add(build(child));
    map.set(copy, id);
    return copy;
  };
  // Stage the whole scene before touching the loaded one.
  const roots = sceneDef.nodes.map(build);
  let rebuilt = 0;
  for (const root of roots) root.traverse((o) => { if (isPrimitive(o)) rebuilt++; });
  if (rebuilt !== expected) throw Error('SOURCE_SCENE_REHYDRATE: primitive count');
  if (scene.children.length) scene.remove(...scene.children);
  scene.add(...roots);
  scene.updateMatrixWorld?.(true);
  return map;
}
