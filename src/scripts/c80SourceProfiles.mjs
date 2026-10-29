/** Exact HI12 successor of C80. No filename, name-suffix or inferred-SHA binding. */
import contract from './privateModelC80Hi12Contract.json' with { type: 'json' };
import profile from './c80Hi12Profile.json' with { type: 'json' };

const freeze = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
};
freeze(contract); freeze(profile);
export const C80_HI12_SHA = contract.glbSha256;
const fail = reason => { throw Error('C80_HI12_SOURCE_FAIL_CLOSED: ' + reason); };
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
export const c80Hi12ContractMatches = value => equal(value, contract);
const sessions = new WeakMap();
const fitExcluded = new WeakMap();

/** True only for objects bound to verified HI12 floor-scene context/SITE roots. */
export function c80Hi12FitContext(root, object) {
  const excluded = fitExcluded.get(root);
  return excluded?.has(object) === true;
}

/** Called only after the existing full-byte SHA verifier, before host mutation.
 * getDependencies('node') is deliberately avoided: loading unreachable historic
 * parents can steal live children. Resolve only the exact reachable node cache.
 * GLTFLoader prunes associations between scenes; reconstruct a PRIVATE map from
 * its original cached node objects and canonical mesh primitive geometries.
 */
export async function prepareC80Hi12Source(gltf) {
  const parser = gltf?.parser, json = parser?.json;
  if (!parser?.getDependency || gltf.scenes?.length !== 4 || json?.scene !== 0)
    fail('original GLTFLoader source required');
  const indices = new Set(), paths = [];
  for (let si = 0; si < 4; si++) {
    const expected = profile.scenes[si], scene = json.scenes[si];
    if (scene?.name !== expected.sceneName || !equal(scene.nodes, expected.rootNodes)) fail('scene roots ' + si);
    const map = new Map();
    const visit = (id, path) => {
      if (!Number.isInteger(id) || !json.nodes[id] || map.has(id) || path.includes(id) || path.length > 128)
        fail('ambiguous source path ' + id);
      const next = [...path, id]; map.set(id, next); indices.add(id);
      for (const child of json.nodes[id].children ?? []) visit(child, next);
    };
    for (const id of scene.nodes) visit(id, []);
    paths.push(map);
  }
  const nodes = new Map(await Promise.all([...indices].map(async id => [id, await parser.getDependency('node', id)])));
  const reverse = new Map();
  for (const [id, node] of nodes) {
    if (!node || reverse.has(node)) fail('ambiguous cached node ' + id);
    reverse.set(node, id);
  }
  const meshIds = new Set([...indices].map(id => json.nodes[id].mesh).filter(Number.isInteger));
  const meshes = new Map(await Promise.all([...meshIds].map(async id => [id, await parser.getDependency('mesh', id)])));
  const associations = new Map();
  const sourceObjects = [];
  for (let si = 0; si < 4; si++) {
    const scene = gltf.scenes[si], map = new Map(), seen = new Set();
    scene.updateMatrixWorld(true);
    scene.traverse(o => seen.add(o));
    const expectedRoots = json.scenes[si].nodes.map(id => nodes.get(id));
    if (scene.children.length !== expectedRoots.length || scene.children.some((o, i) => o !== expectedRoots[i]))
      fail('runtime scene roots ' + si);
    for (const [id, path] of paths[si]) {
      const source = json.nodes[id], object = nodes.get(id);
      if (!seen.has(object) || object.userData?.name !== source.name) fail('cached node missing ' + id);
      const runtimePath = [];
      for (let o = object; o && o !== scene; o = o.parent) runtimePath.unshift(reverse.get(o));
      if (!equal(path, runtimePath)) fail('runtime parent path ' + id);
      for (const [key, value] of Object.entries(source.extras ?? {}))
        if (!equal(object.userData[key], value)) fail('source metadata ' + id + ':' + key);
      associations.set(object, { nodes: id }); map.set(id, object);
      if (source.mesh !== undefined) {
        const definitions = json.meshes[source.mesh]?.primitives, canonical = meshes.get(source.mesh);
        if (!definitions?.length || !canonical) fail('source mesh ' + id);
        const many = definitions.length > 1;
        const primitives = many ? object.children.slice(0, definitions.length) : [object];
        const reference = many ? canonical.children : [canonical];
        if (many && (!object.isGroup || primitives.length !== definitions.length)) fail('primitive group ' + id);
        primitives.forEach((part, pi) => {
          if (!part?.geometry || part.type !== reference[pi]?.type ||
              part.geometry !== reference[pi]?.geometry || part.material !== reference[pi]?.material)
            fail('mesh primitive association ' + id + ':' + pi);
          associations.set(part, { ...(many ? {} : { nodes: id }), meshes: source.mesh, primitives: pi });
          // Multi-primitive children must have their original source mesh metadata.
          for (const [key, value] of Object.entries(json.meshes[source.mesh].extras ?? {}))
            if (many && !equal(part.userData[key], value)) fail('primitive metadata ' + id + ':' + pi);
        });
      }
      const children = (source.children ?? []).map(id => nodes.get(id));
      const runtimeChildren = object.children.filter(o => reverse.has(o));
      if (children.length !== runtimeChildren.length || children.some((o, i) => o !== runtimeChildren[i]))
        fail('source child set ' + id);
    }
    const expected = profile.scenes[si];
    for (const record of expected.records) {
      const object = map.get(record.node), source = json.nodes[record.node];
      if (!object || source.name !== record.name || (source.mesh ?? null) !== record.mesh ||
          !equal(paths[si].get(record.node), record.parentPath) ||
          object.matrixWorld.elements.some((v, i) => !Number.isFinite(v) || Math.abs(v - record.worldMatrix[i]) > 1e-7))
        fail('bound K17/SITE/context record ' + record.node);
    }
    if (!equal(json.nodes[expected.k17Root].children, expected.k17NodeIds) || expected.k17NodeIds.length !== 14 ||
        (expected.contextRoot !== null && !equal(json.nodes[expected.contextRoot].children ?? [], expected.contextNodeIds)))
      fail('K17/context children ' + si);
    for (const key of expected.supersededG1ObjectKeysExpectedAbsent)
      for (const id of paths[si].keys())
        if (json.nodes[id].extras?.ylisViewScope?.objectKey === key) fail('superseded G1 mass returned');
    if (si < 3) {
      const excluded = new WeakSet();
      for (const id of [expected.contextRoot, ...expected.siteRoots].filter(Number.isInteger))
        map.get(id).traverse(o => excluded.add(o));
      fitExcluded.set(scene, excluded);
    }
    sourceObjects.push(map);
  }
  const result = Object.freeze({ profile, sourceObjects, associations });
  sessions.set(gltf, result);
  return result;
}

export function c80Hi12Source(session) {
  if (session?.verification?.verified !== true || session.verification.glbSha256 !== C80_HI12_SHA ||
      session.verification.safeForProduction !== false || !c80Hi12ContractMatches(session.contract)) fail('verified HI12 session required');
  const binding = sessions.get(session.gltf);
  if (!binding) fail('runtime source was not bound');
  return binding;
}
