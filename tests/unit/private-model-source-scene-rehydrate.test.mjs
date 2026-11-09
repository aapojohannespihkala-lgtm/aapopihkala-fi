import test from 'node:test';
import assert from 'node:assert/strict';
import { rehydrateIncompleteDefaultScene } from '../../src/scripts/privateModelSourceSceneRehydrate.mjs';
import { buildSourceNodeAssociations } from '../../src/scripts/privateModelSourceNodeAssociations.mjs';

// Minimal Object3D with GLTFLoader's parent semantics: add() moves an object.
class Obj {
  constructor(name, extra = {}) {
    Object.assign(this, { isObject3D: true, name, children: [], parent: null, ...extra });
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
  traverse(fn) { fn(this); for (const c of [...this.children]) c.traverse(fn); }
  clone(recursive = true) {
    const copy = new Obj(this.name, { isMesh: this.isMesh, geometry: this.geometry, material: this.material });
    if (recursive) for (const c of this.children) copy.add(c.clone(true));
    return copy;
  }
}
const mesh = (name) => new Obj(name, { isMesh: true, geometry: { name }, material: {} });

// Scene 1 (default) and scene 0 both list wrappers that share child 4.
// Node 2 is a 2-primitive mesh node (Group of primitives) with a glTF child.
function model() {
  const json = {
    scene: 1,
    scenes: [{ nodes: [0] }, { nodes: [1, 2] }],
    meshes: [{ primitives: [{}] }, { primitives: [{}, {}] }],
    nodes: [
      { name: 'W0', children: [4] },
      { name: 'W1', children: [4] },
      { name: 'MULTI', mesh: 1, children: [3] },
      { name: 'LEAF', mesh: 0 },
      { name: 'SHARED', mesh: 0 },
      { name: 'ORPHAN', children: [4] },
    ],
  };
  const multi = new Obj('MULTI'); multi.add(mesh('MULTI_0'), mesh('MULTI_1'));
  const cache = [new Obj('W0'), new Obj('W1'), multi, mesh('LEAF'), mesh('SHARED'), new Obj('ORPHAN')];
  for (const [i, n] of json.nodes.entries()) for (const c of n.children ?? []) cache[i].add(cache[c]);
  const scenes = json.scenes.map((s, si) => {
    const scene = new Obj('scene' + si, { isGroup: true });
    for (const r of s.nodes) scene.add(cache[r]);
    return scene;
  });
  return {
    gltf: { scene: scenes[1], scenes, parser: { json, associations: new Map(), getDependency: async (t, i) => cache[i] } },
    cache,
  };
}
const meshes = (o) => { const r = []; o.traverse((x) => { if (x.isMesh) r.push(x.name); }); return r.sort(); };

test('rebuilds only an incomplete default scene from the source tree', async () => {
  const { gltf, cache } = model();
  assert.deepEqual(meshes(gltf.scenes[1]), ['LEAF', 'MULTI_0', 'MULTI_1']); // SHARED stolen
  const map = await rehydrateIncompleteDefaultScene(gltf);
  assert.deepEqual(meshes(gltf.scenes[1]), ['LEAF', 'MULTI_0', 'MULTI_1', 'SHARED']);
  const [w1, multi] = gltf.scenes[1].children;
  assert.equal(map.get(w1), 1);
  assert.equal(map.get(w1.children[0]), 4);
  assert.equal(w1.children[0].geometry, cache[4].geometry);
  // Own primitives first, glTF children last, as the loader builds them.
  assert.deepEqual(multi.children.map((c) => c.name), ['MULTI_0', 'MULTI_1', 'LEAF']);
  assert.equal(buildSourceNodeAssociations(gltf).get(multi.children[2])?.nodes, 3);
  // Loader cache and the other scene are untouched.
  assert.equal(cache[4].parent, cache[5]);
  assert.equal(gltf.scenes[0].children[0], cache[0]);
});

test('complete scenes, tree-only files and skinned files are left alone', async () => {
  const done = model();
  done.gltf.parser.json.nodes[5].children = [];
  done.cache[1].add(done.cache[4]);
  const before = done.gltf.scenes[1].children[0];
  assert.equal(await rehydrateIncompleteDefaultScene(done.gltf), null);
  assert.equal(done.gltf.scenes[1].children[0], before);
  const tree = model();
  tree.gltf.parser.json.nodes[0].children = [];
  tree.gltf.parser.json.nodes[5].children = [];
  assert.equal(await rehydrateIncompleteDefaultScene(tree.gltf), null);
  const skinned = model();
  skinned.gltf.parser.json.skins = [{}];
  assert.equal(await rehydrateIncompleteDefaultScene(skinned.gltf), null);
});

test('rehydrates an explicit non-default scene index', async () => {
  const { rehydrateIncompleteScene } = await import('../../src/scripts/privateModelSourceSceneRehydrate.mjs');
  const { gltf } = model();
  // Scene 0 (W0) lost SHARED to the orphan as well.
  assert.deepEqual(meshes(gltf.scenes[0]), []);
  const map = await rehydrateIncompleteScene(gltf, 0);
  assert.deepEqual(meshes(gltf.scenes[0]), ['SHARED']);
  assert.equal(map.get(gltf.scenes[0].children[0]), 0);
  assert.equal(await rehydrateIncompleteScene(gltf, 'x'), null);
});
