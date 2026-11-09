import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HI20_UNIFIED52_SOURCE_SHA, rehydrateHi20Unified52SourceScenes,
} from '../../src/scripts/privateModelHi20Unified52SourceScenes.mjs';
import { buildSourceNodeAssociations } from '../../src/scripts/privateModelSourceNodeAssociations.mjs';

// Minimal Object3D with the parent semantics GLTFLoader relies on:
// add() moves an object that already has a parent.
class Obj {
  constructor(name, extra = {}) {
    Object.assign(this, {
      isObject3D: true, type: extra.geometry ? 'Mesh' : 'Object3D', name, visible: true,
      userData: { name }, children: [], parent: null,
      matrix: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
      position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] },
      scale: { toArray: () => [1, 1, 1] }, ...extra,
    });
    if (this.geometry) this.isMesh = true;
  }
  add(...objects) {
    for (const o of objects) { o.parent?.remove(o); o.parent = this; this.children.push(o); }
    return this;
  }
  remove(...objects) {
    for (const o of objects) {
      const i = this.children.indexOf(o);
      if (i >= 0) { this.children.splice(i, 1); o.parent = null; }
    }
    return this;
  }
  clear() { return this.remove(...this.children); }
  updateMatrixWorld() {}
  traverse(fn) { fn(this); for (const c of this.children) c.traverse(fn); }
  clone(recursive = true) {
    const copy = new Obj(this.name, { geometry: this.geometry, material: this.material });
    copy.type = this.type; copy.userData = structuredClone(this.userData);
    if (recursive) for (const c of this.children) copy.add(c.clone(true));
    return copy;
  }
}

// 52 scenes; 2F scene 48 and BOTH scene 51 have different wrappers that both
// list the shared glass node 7. Orphan 6 also lists it (never in any scene).
function dagModel() {
  const nodes = Array.from({ length: 9 }, (_, i) => ({ name: 'N' + i }));
  nodes[0] = { name: 'WRAP_2F', children: [7, 8] };
  nodes[1] = { name: 'WRAP_BOTH', children: [7, 8] };
  nodes[2] = { name: 'WRAP_1F', children: [8] };
  nodes[6] = { name: 'ORPHAN', children: [7] };
  nodes[7] = { name: 'GLASS', mesh: 0 };
  nodes[8] = { name: 'WALL', mesh: 1 };
  const scenes = Array.from({ length: 52 }, () => ({ nodes: [3] }));
  scenes[48] = { nodes: [0] }; scenes[50] = { nodes: [2] }; scenes[51] = { nodes: [1] };
  const json = { scenes, nodes };
  const cache = nodes.map((n, i) => new Obj(n.name, n.mesh === undefined ? {} : { geometry: { id: i }, material: { id: i } }));
  // Loader: build each node, attaching cached children (last parent wins).
  for (const [i, n] of nodes.entries()) for (const c of n.children ?? []) cache[i].add(cache[c]);
  const gltfScenes = scenes.map((s, si) => {
    const scene = new Obj('scene' + si, { isGroup: true });
    for (const r of s.nodes) scene.add(r === 3 && cache[3].parent ? cache[3].clone(true) : cache[r]);
    return scene;
  });
  const parser = { json, associations: new Map(), getDependency: async (type, i) => cache[i] };
  return { gltf: { scene: gltfScenes[0], scenes: gltfScenes, parser }, cache };
}

const meshesIn = (scene) => { const r = []; scene.traverse(o => { if (o.isMesh) r.push(o.name); }); return r.sort(); };

test('rehydrates the three HI20 floor scenes from the source hierarchy', async () => {
  const { gltf, cache } = dagModel();
  // Reproduces production: the orphan stole the glass, 2F lost its walls too.
  assert.deepEqual(meshesIn(gltf.scenes[48]), []);
  assert.deepEqual(meshesIn(gltf.scenes[51]), []);
  const staged = await rehydrateHi20Unified52SourceScenes(gltf, HI20_UNIFIED52_SOURCE_SHA);
  assert.deepEqual([...staged.keys()], [48, 50, 51]);
  assert.deepEqual(meshesIn(gltf.scenes[48]), ['GLASS', 'WALL']);
  assert.deepEqual(meshesIn(gltf.scenes[50]), ['WALL']);
  assert.deepEqual(meshesIn(gltf.scenes[51]), ['GLASS', 'WALL']);
  const glass48 = staged.get(48).get(7), glass51 = staged.get(51).get(7);
  assert.notEqual(glass48, glass51);
  assert.equal(glass48.geometry, cache[7].geometry);
  assert.equal(glass48.material, cache[7].material);
  // Loader cache and other scenes are untouched; copies cannot be stolen.
  assert.equal(cache[7].parent, cache[6]);
  assert.equal(gltf.scenes[3].children.length, 1);
  // The structural node map now resolves every floor-scene node.
  const map = buildSourceNodeAssociations(gltf);
  assert.equal(map.get(glass48)?.nodes, 7);
  assert.equal(map.get(gltf.scenes[48].children[0])?.nodes, 0);
});

test('other SHAs are left alone and ambiguous scenes fail before mutation', async () => {
  const { gltf } = dagModel();
  assert.equal(await rehydrateHi20Unified52SourceScenes(gltf, 'other'), null);
  gltf.parser.json.nodes[0].children = [7, 7];
  const before = gltf.scenes[51].children[0];
  await assert.rejects(rehydrateHi20Unified52SourceScenes(gltf, HI20_UNIFIED52_SOURCE_SHA), /ambiguous path/);
  assert.equal(gltf.scenes[51].children[0], before);
});
