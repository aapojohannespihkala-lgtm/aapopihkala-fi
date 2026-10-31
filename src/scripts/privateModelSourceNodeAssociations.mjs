// GLTFLoader (three r185) prunes parser.associations scene by scene. In a
// multi-scene GLB (e.g. the HI20 52-scene WORK_TEST) no scene object keeps its
// `nodes` index after parsing; only materials/textures survive. Every
// SHA/node-locked presentation (C045, balcony glass, C015, ...) then fails
// closed although the exact source is loaded.
//
// Rebuild node indices from the source glTF JSON hierarchy, without mutating
// GLTFLoader, the parsed objects or the model. GLTFLoader adds a node's own
// objects (mesh/primitive group, camera, light) first and its JSON children
// last, in JSON order; scene roots follow json.scenes[i].nodes order.
// Any structural or name mismatch fails closed for that subtree only.
// Must run on the pristine parse result, before the viewer adds helpers.

const sanitize = (name) => String(name).replace(/\s/g, '_').replace(/[[\].:/]/g, '');

export const nameMatches = (object, nodeDef) => {
  if (typeof nodeDef?.name !== 'string' || nodeDef.name === '') return true;
  const expected = sanitize(nodeDef.name);
  const actual = String(object?.name ?? '');
  return actual === expected || (actual.startsWith(expected + '_') &&
    /^\d+$/.test(actual.slice(expected.length + 1)));
};

/** Map<Object3D, {nodes:number}> for every structurally verified scene object. */
export function buildSourceNodeAssociations(gltf) {
  const json = gltf?.parser?.json;
  const result = new Map();
  if (!Array.isArray(json?.scenes) || !Array.isArray(json?.nodes) ||
      !Array.isArray(gltf?.scenes) || gltf.scenes.length !== json.scenes.length) return result;
  const conflicting = new Set();
  const assign = (object, index) => {
    const previous = result.get(object);
    if (previous && previous.nodes !== index) conflicting.add(object);
    else result.set(object, { nodes: index });
  };
  const walk = (object, index, depth) => {
    const nodeDef = json.nodes[index];
    if (!object || !nodeDef || depth > 256 || !nameMatches(object, nodeDef)) return;
    assign(object, index);
    const childIds = Array.isArray(nodeDef.children) ? nodeDef.children : [];
    const children = Array.isArray(object.children) ? object.children : [];
    if (childIds.length > children.length) return;
    const offset = children.length - childIds.length;
    childIds.forEach((childId, i) => walk(children[offset + i], childId, depth + 1));
  };
  json.scenes.forEach((sceneDef, sceneIndex) => {
    const roots = Array.isArray(sceneDef?.nodes) ? sceneDef.nodes : [];
    const scene = gltf.scenes[sceneIndex];
    if (!scene || !Array.isArray(scene.children) || scene.children.length !== roots.length) return;
    roots.forEach((rootId, i) => walk(scene.children[i], rootId, 0));
  });
  for (const object of conflicting) result.delete(object);
  return result;
}

/**
 * A read-only view of `gltf` whose parser.associations also carries the
 * rebuilt node indices. Loader-provided entries win; a disagreeing loader
 * entry removes the node index rather than guessing.
 */
export function createSourceNodeView(gltf, rebuilt) {
  const parser = gltf?.parser;
  if (!parser || !(rebuilt instanceof Map) || rebuilt.size === 0) return gltf;
  const associations = new Map(parser.associations ?? []);
  for (const [object, value] of rebuilt) {
    const existing = associations.get(object);
    if (existing?.nodes === undefined) associations.set(object, { ...existing, nodes: value.nodes });
    else if (existing.nodes !== value.nodes) {
      const { nodes: _ignored, ...rest } = existing;
      associations.set(object, rest);
    }
  }
  return {
    scene: gltf.scene,
    scenes: gltf.scenes,
    parser: Object.create(parser, { associations: { value: associations, enumerable: true } }),
  };
}
