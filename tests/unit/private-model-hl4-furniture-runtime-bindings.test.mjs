import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import {
  V35_FURNITURE_SCENES, V35_FURNITURE_SOURCE_SHA256 as SHA,
} from '../../src/scripts/privateModelFurnitureLayerSourceProfile.mjs';

class Object3D {
  constructor(name = '', isMesh = false) {
    this.name = name;
    this.isMesh = isMesh;
    this.visible = true;
    this.parent = null;
    this.children = [];
  }
  add(child) { this.children.push(child); child.parent = this; return this; }
  traverse(visit) { visit(this); for (const child of this.children) child.traverse(visit); }
}

const fixture = sceneIndex => {
  const source = V35_FURNITURE_SCENES[sceneIndex];
  const nodes = [];
  const roots = new Set();
  for (const part of source.parts) {
    part.path.forEach((index, i) => {
      nodes[index] ??= { name: 'SOURCE_PARENT_' + index, children: [] };
      if (i === 0) roots.add(index);
      if (i > 0) {
        const parent = nodes[part.path[i-1]];
        if (!parent.children.includes(index)) parent.children.push(index);
      }
      if (i === part.path.length - 2) nodes[index].name = part.parentName;
      if (i === part.path.length - 1) {
        nodes[index].name = part.name;
        nodes[index].mesh = part.meshIndex;
      }
    });
  }

  const sceneRoot = new Object3D('scene');
  const associations = new Map();
  const objects = new Map();
  const instantiate = index => {
    const data = nodes[index];
    const obj = new Object3D(data.name, data.mesh !== undefined);
    associations.set(obj, {
      nodes: index,
      ...(data.mesh === undefined ? {} : { meshes: data.mesh }),
    });
    objects.set(index, obj);
    for (const child of data.children) obj.add(instantiate(child));
    return obj;
  };
  [...roots].forEach(index => sceneRoot.add(instantiate(index)));
  const scenes = new Array(199);
  const jsonScenes = new Array(199);
  scenes[sceneIndex] = sceneRoot;
  jsonScenes[sceneIndex] = { name: source.name, nodes: [...roots] };
  const gltf = {
    scenes, parser: { json: { nodes, scenes: jsonScenes }, associations },
  };
  const options = {
    gltf, expectedSourceSha256: SHA, loadedSourceSha256: SHA,
    sceneIndex, activeSceneRoot: sceneRoot, floor: source.floor, area: 'D',
  };
  return { source, sceneRoot, objects, options, nodes, jsonScenes };
};

for (const sceneIndex of [197, 198]) {
  test('HL4 binds four distinct carcasses and retains twelve existing facade paths in V35 scene ' + sceneIndex, () => {
    const f = fixture(sceneIndex);
    const snapshot = JSON.stringify(f.options.gltf.parser.json);
    const result = resolveBuildingPartLayerBindings(f.options);
    assert.equal(result.sourceVerified, true);
    assert.equal(result.bindings.length, 16);
    assert.equal(result.frame.gates.size, 16);
    assert.equal(new Set(result.bindings.map(b => b.root)).size, 16);
    assert.ok(result.bindings.every(b => b.id === 'architecture-fixtures'));
    for (const part of f.source.parts) {
      const object = f.objects.get(part.nodeIndex);
      assert.ok(result.bindings.some(b => b.root === object), part.name);
      const evidence = result.evidence.find(e => e.sourceNodeIndex === part.nodeIndex);
      assert.deepEqual(evidence.sourceNodePath, [...part.path]);
      assert.equal(evidence.sourceSha256, SHA);
      assert.equal(evidence.bindingKind, 'EXACT_V35_SOURCE_PROFILE');
    }
    assert.equal(JSON.stringify(f.options.gltf.parser.json), snapshot);
  });
}

test('HL4 fails closed on wrong GLB SHA, internal scene, source count or floor', () => {
  const f = fixture(197);
  assert.equal(resolveBuildingPartLayerBindings({
    ...f.options, loadedSourceSha256: '0'.repeat(64),
  }).bindings.length, 0);
  assert.equal(resolveBuildingPartLayerBindings({
    ...f.options, sceneIndex: 198,
  }).bindings.length, 0);
  assert.equal(resolveBuildingPartLayerBindings({
    ...f.options, floor: '1F',
  }).bindings.length, 0);
  f.options.gltf.parser.json.scenes.length = 198;
  assert.equal(resolveBuildingPartLayerBindings(f.options).bindings.length, 0);
});

test('HL4 carcasses require exact name, mesh and parent, even when front meshes are intact', () => {
  for (const mutation of ['name', 'mesh', 'parent']) {
    const f = fixture(197);
    const carcass = f.source.parts.find(p => p.component === 'carcass');
    if (mutation === 'name') f.nodes[carcass.nodeIndex].name = 'LOOKALIKE_CARCASS';
    if (mutation === 'mesh') f.nodes[carcass.nodeIndex].mesh = 335;
    if (mutation === 'parent') f.nodes[carcass.path.at(-2)].name = 'WRONG_MODULE';
    const result = resolveBuildingPartLayerBindings(f.options);
    assert.ok(!result.bindings.some(b => b.root === f.objects.get(carcass.nodeIndex)), mutation);
    assert.ok(result.bindings.some(b => b.root === f.objects.get(
      f.source.parts.find(p => p.component === 'lower-front' && p.cabinetNo === 2).nodeIndex
    )), 'unrelated cabinet remains source-bound');
  }
});
