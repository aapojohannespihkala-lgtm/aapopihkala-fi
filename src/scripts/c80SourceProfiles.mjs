/** Exact HI12 successor of C80. No filename, name-suffix or inferred-SHA binding. */
import contract from './privateModelC80Hi12Contract.json' with { type: 'json' };
import profile from './c80Hi12Profile.json' with { type: 'json' };
import hi13Contract from './privateModelC80Hi13Contract.json' with { type: 'json' };
import hi13Profile from './c80Hi13Profile.json' with { type: 'json' };
import hi14Contract from './privateModelC80Hi14Contract.json' with { type: 'json' };
import hi14Profile from './c80Hi14Profile.json' with { type: 'json' };
import hi18Contract from './privateModelC80Hi18Contract.json' with { type: 'json' };
import hi18Profile from './c80Hi18Profile.json' with { type: 'json' };
import hi19Contract from './privateModelC80Hi19Contract.json' with { type: 'json' };
import hi19Profile from './c80Hi19Profile.json' with { type: 'json' };
import hi20Contract from './privateModelC80Hi20Contract.json' with { type: 'json' };
import hi20Profile from './c80Hi20Profile.json' with { type: 'json' };

const freeze = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
};
freeze(contract); freeze(profile); freeze(hi13Contract); freeze(hi13Profile); freeze(hi14Contract); freeze(hi14Profile); freeze(hi18Contract); freeze(hi18Profile); freeze(hi19Contract); freeze(hi19Profile); freeze(hi20Contract); freeze(hi20Profile);
const successors = new Map([[contract.glbSha256, { contract, profile }], [hi13Contract.glbSha256, { contract: hi13Contract, profile: hi13Profile }], [hi14Contract.glbSha256, { contract: hi14Contract, profile: hi14Profile }], [hi18Contract.glbSha256, { contract: hi18Contract, profile: hi14Profile, extension: hi18Profile }], [hi19Contract.glbSha256, { contract: hi19Contract, profile: hi14Profile, extension: hi19Profile }], [hi20Contract.glbSha256, { contract: hi20Contract, profile: hi14Profile, extension: hi20Profile }]]);
export const isC80SuccessorSHA = sha => successors.has(sha);
export const C80_HI12_SHA = contract.glbSha256;
const fail = reason => { throw Error('C80_HI12_SOURCE_FAIL_CLOSED: ' + reason); };
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
/** GLTFLoader clones nodes reused by more than one glTF parent. Never compare
 * only names or drop source-parent checks: prove a deep in-memory clone, including
 * source metadata, local transforms, topology and original mesh resources. */
export function isExactGLTFLoaderClone(actual, reference) {
  if (actual === reference) return true;
  if (!actual?.isObject3D || !reference?.isObject3D ||
      actual.type !== reference.type || actual.visible !== reference.visible ||
      !equal(actual.userData, reference.userData) ||
      !equal(actual.matrix?.elements, reference.matrix?.elements) ||
      !equal(actual.position?.toArray(), reference.position?.toArray()) ||
      !equal(actual.quaternion?.toArray(), reference.quaternion?.toArray()) ||
      !equal(actual.scale?.toArray(), reference.scale?.toArray()) ||
      actual.geometry !== reference.geometry || actual.material !== reference.material ||
      actual.children?.length !== reference.children?.length) return false;
  return actual.children.every((child, index) =>
    isExactGLTFLoaderClone(child, reference.children[index]));
}
export const c80Hi12ContractMatches = value => equal(value, contract);
export const c80SuccessorContractMatches = value => {
  const source = successors.get(value?.glbSha256);
  return Boolean(source && equal(value, source.contract));
};
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
export async function prepareC80Hi12Source(gltf, verifiedSHA = C80_HI12_SHA) {
  const source = successors.get(verifiedSHA);
  if (!source) fail('unregistered successor SHA');
  const profile = source.profile;
  // HI18 preserves its original scene0-3 nodes and world matrices byte-for-byte.
  // Reuse the exhaustive HI14 baseline provenance profile, but lock the new
  // opt-in scenes independently below. Never infer an unknown successor.
  const extension = source.extension;
  const parser = gltf?.parser, json = parser?.json;
  if (!parser?.getDependency || gltf.scenes?.length !== source.contract.sourceSceneCount || json?.scene !== 0)
    fail('original GLTFLoader source required');
  if (extension) {
    const hi20 = verifiedSHA === hi20Contract.glbSha256;
    const hi19 = verifiedSHA === hi19Contract.glbSha256;
    const allowedIndices = hi20 ? [20, 21, 22, 23, 24, 25] : hi19 ? [20, 21, 22, 23] : [12, 17, 18, 19];
    const candidate = hi20 ? 'ylisrinne-d-c80-hi20-work-test-20261030' :
      hi19 ? 'ylisrinne-d-c80-hi19-work-test-20261030' : 'ylisrinne-d-c80-hi18-work-test-20261030';
    if (extension.baselineGLBSHA256 !== hi14Contract.glbSha256 || extension.candidate !== candidate ||
        Object.keys(extension.scenes).length !== (hi20 ? 6 : 4) ||
        (hi20 && extension.parentGLBSHA256 !== hi19Contract.glbSha256)) fail('extension identity');
    for (const [key, expected] of Object.entries(extension.scenes)) {
      const si = Number(key), scene = json.scenes[si];
      if (!scene || scene.name !== expected.sceneName || scene.nodes.length !== expected.rootCount) fail('extension scene ' + key);
      // The source contract separately SHA-locks its routed root arrays and the full GLB.
      if (!allowedIndices.includes(si)) fail('extension scene not allowlisted');
    }
  }
  // Only the exact SHA-bound HI20 source may need shared-parent GLTFLoader
  // clones. Count genuine references from immutable parser JSON, not names.
  const parentUseCount = new Uint32Array(json.nodes.length);
  if (verifiedSHA === hi20Contract.glbSha256) {
    for (const entry of json.nodes)
      for (const child of entry.children ?? []) {
        if (!Number.isInteger(child) || child < 0 || child >= parentUseCount.length)
          fail('invalid shared node reference');
        parentUseCount[child]++;
      }
  }
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
      const childIds = source.children ?? [];
      const children = childIds.map(childId => nodes.get(childId));
      const runtimeChildren = object.children.filter(o => reverse.has(o));
      if (children.length !== runtimeChildren.length || children.some((o, i) => o !== runtimeChildren[i])) {
        // Shared glTF node references (notably HI20 scene0/root5623) become
        // independent Three.js clones. A missing canonical identity is safe
        // only if every clone occupies its original child index, is deeply
        // equivalent to the parser-cached source, and the original JSON
        // explicitly references that child from multiple parents.
        const cloneSafe = verifiedSHA === hi20Contract.glbSha256 &&
          source.mesh === undefined && object.children.length === children.length &&
          childIds.every((childId, i) => {
            const actual = object.children[i], cached = children[i];
            return actual === cached ||
              (parentUseCount[childId] > 1 && isExactGLTFLoaderClone(actual, cached));
          });
        if (!cloneSafe) fail('source child set ' + id);
        const bindClone = (actual, cached) => {
          if (actual === cached) return;
          const sourceId = reverse.get(cached);
          if (sourceId !== undefined) {
            const node = json.nodes[sourceId], meshId = node.mesh;
            const primitives = meshId === undefined ? null : json.meshes[meshId]?.primitives;
            if (meshId !== undefined && (!primitives?.length ||
                (primitives.length > 1 && (!actual.isGroup || actual.children.length < primitives.length))))
              fail('cloned primitive mismatch ' + sourceId);
            associations.set(actual, primitives?.length === 1
              ? { nodes: sourceId, meshes: meshId, primitives: 0 }
              : { nodes: sourceId });
            if (primitives?.length > 1)
              primitives.forEach((_, pi) =>
                associations.set(actual.children[pi], { meshes: meshId, primitives: pi }));
          }
          actual.children.forEach((child, i) => bindClone(child, cached.children[i]));
        };
        childIds.forEach((_, i) => bindClone(object.children[i], children[i]));
      }
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
  const result = Object.freeze({ profile, sourceObjects, associations, sourceSha256: verifiedSHA });
  sessions.set(gltf, result);
  return result;
}

export function c80Hi12Source(session) {
  if (session?.verification?.verified !== true || !isC80SuccessorSHA(session.verification.glbSha256) ||
      session.verification.safeForProduction !== false || !c80SuccessorContractMatches(session.contract)) fail('verified HI12 session required');
  const binding = sessions.get(session.gltf);
  if (!binding || binding.sourceSha256 !== session.verification.glbSha256) fail('runtime source was not bound');
  return binding;
}

