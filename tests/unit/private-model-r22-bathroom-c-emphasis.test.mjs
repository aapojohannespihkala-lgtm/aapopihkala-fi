import test from 'node:test';
import assert from 'node:assert/strict';
import { R22_BATH_C_SOURCE, createR22BathroomCEmphasis } from '../../src/scripts/privateModelR22BathroomCEmphasis.mjs';

const SOURCE = R22_BATH_C_SOURCE;
const bounds = [
  { min: [0.276, 0.0775, -4.012], max: [2.636, 0.0775, -1.902] },
  { min: [4.613, 1.9545, 0.02], max: [5.508, 1.9895, 2.07] },
  { min: [2.511, 1.17, -3.747], max: [2.636, 2.13, -2.347] },
  { min: [3.888, 2.752, 0.3], max: [4.368, 3.747, 0.885] },
];

class BufferGeometry {
  constructor() { this.attributes = {}; this.disposed = false; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  getAttribute(name) { return this.attributes[name]; }
  dispose() { this.disposed = true; }
}
class Float32BufferAttribute {
  constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; }
}
class EdgesGeometry extends BufferGeometry {
  constructor(source, threshold) {
    super();
    assert.ok(source);
    assert.equal(threshold, 22);
    this.setAttribute('position', new Float32BufferAttribute(new Array(36).fill(0), 3));
  }
}
class LineBasicMaterial {
  constructor(options) { this.options = options; this.disposed = false; }
  dispose() { this.disposed = true; }
}
class LineSegments {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.userData = {};
    this.name = '';
  }
}
const THREE = { BufferGeometry, Float32BufferAttribute, EdgesGeometry, LineBasicMaterial, LineSegments };

function makeFixture() {
  const json = { scenes: Array.from({ length: 687 }, () => ({ nodes: [] })),
    nodes: [], meshes: [], accessors: [] };
  const objects = [];
  for (let i = 0; i < SOURCE.parts.length; i++) {
    const part = SOURCE.parts[i], box = bounds[i], name = part.prefix + 'SOURCE';
    json.nodes[part.node] = { name, mesh: part.mesh };
    json.scenes[686].nodes.push(part.node);
    json.meshes[part.mesh] = { primitives: [{ attributes: { POSITION: i } }] };
    json.accessors[i] = { type: 'VEC3', count: part.vertices,
      min: [...box.min], max: [...box.max] };
    const geometry = { boundingBox: null,
      getAttribute: (key) => key === 'position' ? { count: part.vertices } : null,
      computeBoundingBox() {
        this.boundingBox = { min: { x: box.min[0], y: box.min[1], z: box.min[2] },
          max: { x: box.max[0], y: box.max[1], z: box.max[2] } };
      } };
    const mesh = { name, isMesh: true, geometry, material: { name: 'source' },
      visible: i !== 3, children: [],
      add(child) { this.children.push(child); },
      remove(child) { this.children.splice(this.children.indexOf(child), 1); } };
    objects.push(mesh);
  }
  const sceneRoot = { traverse: (fn) => objects.forEach(fn) };
  return { json, sceneRoot, objects, THREE, glbSha256: SOURCE.sha256, sceneIndex:686, enabled:true };
}

test('C highlight is deliberately opt-in and source/scene SHA bound', () => {
  const f = makeFixture();
  assert.equal(createR22BathroomCEmphasis({ ...f, enabled:false }).status, 'DISABLED');
  assert.equal(createR22BathroomCEmphasis({ ...f, glbSha256: 'wrong' }).status, 'SOURCE_SCOPE_HOLD');
  assert.equal(createR22BathroomCEmphasis({ ...f, sceneIndex: 688 }).status, 'SOURCE_SCOPE_HOLD');
  assert.deepEqual(f.objects.map(o => o.children.length), [0,0,0,0]);
});

test('rejects wrong glTF scene membership, node identity, mesh index and vertex count', () => {
  for (const mutate of [
    f => { f.json.scenes[686].nodes.pop(); },
    f => { f.json.nodes[SOURCE.parts[1].node].name = 'wrong door'; },
    f => { f.json.nodes[SOURCE.parts[2].node].mesh = -1; },
    f => { f.json.accessors[0].count = 301; },
    f => { f.json.accessors[0].min[0] += 0.3; },
    f => { f.objects[3].name = 'wrong cabinet'; },
    f => { f.objects[0].geometry.getAttribute = () => ({ count: 1 }); },
  ]) {
    const f = makeFixture();
    mutate(f);
    assert.equal(createR22BathroomCEmphasis(f).applied, false);
    assert.deepEqual(f.objects.map(o => o.children.length), [0,0,0,0]);
  }
});

test('4 architectural accents appear without changing visibility, materials, or source geometry', () => {
  const f = makeFixture(), before = f.objects.map(o =>
    ({ visible:o.visible, material:o.material, geometry:o.geometry }));
  const result = createR22BathroomCEmphasis(f);
  assert.equal(result.status, 'WORK_TEST_C_VISIBLE');
  assert.equal(result.count, 4);
  assert.equal(result.physicalHostVerified, false);
  assert.equal(result.asBuiltClaim, false);
  assert.equal(result.roles.length, 4);
  for (let i=0;i<f.objects.length;i++) {
    const obj = f.objects[i];
    assert.equal(obj.visible, before[i].visible);
    assert.equal(obj.material, before[i].material);
    assert.equal(obj.geometry, before[i].geometry);
    assert.equal(obj.children.length, 1);
    assert.equal(obj.children[0].raycast(), undefined);
    assert.equal(obj.children[0].userData.sourceNodeIndex, SOURCE.parts[i].node);
    assert.equal(obj.children[0].userData.Canonical, false);
  }
  assert.equal(f.objects[0].children[0].geometry.getAttribute('position').count, 8);
  result.dispose();
  result.dispose(); // idempotent
  assert.deepEqual(f.objects.map(o => o.children.length), [0,0,0,0]);
  assert.deepEqual(f.objects.map(o => o.visible), before.map(x => x.visible));
});

test('ambiguous render mesh or invalid scene fails closed without partial edges', () => {
  const f = makeFixture();
  f.sceneRoot.traverse = fn => [...f.objects, f.objects[0]].forEach(fn);
  assert.equal(createR22BathroomCEmphasis(f).status, 'RENDER_MESH_NOT_UNIQUE');
  assert.deepEqual(f.objects.map(o => o.children.length), [0,0,0,0]);
  const g = makeFixture();
  g.json.scenes[686].nodes = [12320, 9999999];
  assert.equal(createR22BathroomCEmphasis(g).status, 'SOURCE_SCENE_INVALID');
});
