import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('a correct primitive count cannot mask wrong source roots: SHA-gated force reconstructs them',async()=>{
 const {rehydrateIncompleteScene}=await import('../../src/scripts/privateModelSourceSceneRehydrate.mjs');
 const {gltf,cache}=model();
 // Shared node4 was stolen but an unrelated helper balances the primitive
 // count. A mesh-count-only gate would silently accept the wrong scene tree.
 const helper=mesh('FAKE_NOT_SOURCE');
 gltf.scenes[1].add(helper);
 assert.deepEqual(meshes(gltf.scenes[1]),['FAKE_NOT_SOURCE','LEAF','MULTI_0','MULTI_1']);
 assert.equal(await rehydrateIncompleteScene(gltf,1),null,'legacy count-gate unchanged');
 assert.deepEqual(meshes(gltf.scenes[1]),['FAKE_NOT_SOURCE','LEAF','MULTI_0','MULTI_1']);
 const restored=await rehydrateIncompleteScene(gltf,1,{force:true});
 assert.ok(restored);
 assert.deepEqual(meshes(gltf.scenes[1]),['LEAF','MULTI_0','MULTI_1','SHARED']);
 assert.equal(restored.get(gltf.scenes[1].children[0]),1);
 assert.equal(restored.get(gltf.scenes[1].children[0].children[0]),4);
 assert.equal(cache[4].parent,cache[5],'source-loader cache stays intact');
 assert.equal(gltf.scenes[1].children.includes(helper),false);
});

test('C80 524 SHA-gated source-only loader restores only six exact R1110 scenes',async()=>{
 const cards=readFileSync(new URL('../../src/scripts/privateModelSourceCards.ts',import.meta.url),'utf8');
 const {C80_524_RAIN_SCENES, C80_524_RAIN_GLB_SHA256, isC80524RainSourceScene}=
   await import('../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs');
 const ids=Object.keys(C80_524_RAIN_SCENES).map(Number);
 assert.deepEqual(ids,[518,519,520,521,522,523]);
 assert.equal(isC80524RainSourceScene({},C80_524_RAIN_GLB_SHA256,520),false);
 assert.equal(isC80524RainSourceScene({},'0'.repeat(64),520),false);
 assert.ok(cards.includes('if (digest === C80_524_RAIN_GLB_SHA256)'));
 assert.ok(cards.includes('isC80524RainSourceScene(json, digest, index, C80_524_RAIN_SCENES[index].floor)'));
 assert.ok(cards.includes("throw new Error('C80_524_SOURCE_SCENE_MISMATCH')"));
 assert.ok(cards.includes('for (const index of indexes) rehydrate.add(index)'));
 assert.ok(cards.includes('digest === C80_524_RAIN_GLB_SHA256 && C80_524_RAIN_SCENES[sceneIndex] !== undefined'));
 assert.ok(cards.includes('digest === C80_530_V27_GLB_SHA256 && C80_530_V27_SCENES[sceneIndex] !== undefined'));
 assert.ok(cards.includes('rehydrateIncompleteScene(gltf, sceneIndex, { force: isVerifiedOptInScene })'));
 assert.ok(cards.includes('const rehydrate = new Set<number>([json?.scene ?? 0'));
 // Source state must not become a publication, CURRENT, or physical-route claim.
 assert.equal(C80_524_RAIN_SCENES[520].floor,'BOTH');
 assert.equal(C80_524_RAIN_SCENES[518].floor,'1F');
});

test('authentic private C80 524 JSON passes all six source gates, if explicitly supplied',
 {skip:!process.env.C80_524_RAIN_GLB_PATH},async()=>{
 const bytes=readFileSync(process.env.C80_524_RAIN_GLB_PATH);
 const {createHash}=await import('node:crypto');
 const {C80_524_RAIN_SCENES, C80_524_RAIN_GLB_SHA256, C80_524_RAIN_GLB_BYTES,
  isC80524RainSourceScene}=await import('../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs');
 assert.equal(bytes.length,C80_524_RAIN_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),C80_524_RAIN_GLB_SHA256);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 for(const [index,spec] of Object.entries(C80_524_RAIN_SCENES)){
  assert.equal(isC80524RainSourceScene(json,C80_524_RAIN_GLB_SHA256,Number(index),spec.floor),true,'scene '+index);
  assert.equal(isC80524RainSourceScene(json,'0'.repeat(64),Number(index),spec.floor),false,'wrong SHA');
 }
});

test('C80 530 source-only loader rehydrates six verified scene ids, without changing default and older models',()=>{
 const cards=readFileSync(new URL('../../src/scripts/privateModelSourceCards.ts',import.meta.url),'utf8');
 assert.ok(cards.includes('if (digest === C80_530_V27_GLB_SHA256)'));
 assert.ok(cards.includes('isC80530V27SourceScene(json, digest, index, C80_530_V27_SCENES[index].floor)'));
 assert.ok(cards.includes('for (const index of indexes) rehydrate.add(index)'));
 assert.ok(cards.includes('rehydrateIncompleteScene(gltf, sceneIndex, { force: isVerifiedOptInScene })'));
 assert.ok(cards.includes('digest === C80_530_V27_GLB_SHA256 && C80_530_V27_SCENES[sceneIndex] !== undefined'));
 assert.ok(cards.includes('digest === C80_524_RAIN_GLB_SHA256 && C80_524_RAIN_SCENES[sceneIndex] !== undefined'));
 assert.ok(cards.includes('const rehydrate = new Set<number>([json?.scene ?? 0'));
});

test('real Three.js GLTFLoader cached shared nodes are repaired before a source-root guard',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const positions=new Float32Array([0,0,0, 1,0,0, 0,1,0]);
 const data=Buffer.from(positions.buffer);
 const json={
  asset:{version:'2.0'},scene:0,
  scenes:[{name:'BASE',nodes:[0]},{name:'LATEST',nodes:[1]}],
  nodes:[
   {name:'BASE_PARENT',children:[2]},
   {name:'LATEST_PARENT',children:[2]},
   {name:'SHARED_MESH',mesh:0},
  ],
  meshes:[{primitives:[{attributes:{POSITION:0}}]}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:data.length}],
  buffers:[{byteLength:data.length}],
 };
 const payload=Buffer.from(JSON.stringify(json));
 const padded=(payload.length+3)&~3;
 const glb=Buffer.alloc(12+8+padded+8+data.length,0x20);
 glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
 glb.writeUInt32LE(padded,12);glb.writeUInt32LE(0x4e4f534a,16);
 payload.copy(glb,20);
 glb.writeUInt32LE(data.length,20+padded);
 glb.writeUInt32LE(0x004e4942,24+padded);
 data.copy(glb,28+padded);
 const loaded=await new GLTFLoader().parseAsync(
   glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
 await loaded.parser.getDependencies('node');
 const corrected=await (await import('../../src/scripts/privateModelSourceSceneRehydrate.mjs'))
   .rehydrateIncompleteScene(loaded,1,{force:true});
 assert.ok(corrected,'real loader scene was reconstructed from cache+source');
 const scene=loaded.scenes[1];
 assert.deepEqual(scene.children.map(o=>o.name),['LATEST_PARENT']);
 assert.deepEqual(scene.children[0].children.map(o=>o.name),['SHARED_MESH']);
 assert.equal(scene.children[0].children[0].isMesh,true);
 const map=buildSourceNodeAssociations(loaded);
 assert.equal(map.get(scene.children[0])?.nodes,1);
 assert.equal(map.get(scene.children[0].children[0])?.nodes,2);
});
