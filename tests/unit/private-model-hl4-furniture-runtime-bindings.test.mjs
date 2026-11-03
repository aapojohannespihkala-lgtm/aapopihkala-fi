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


// HL1 is a different SHA and an opt-in 201-scene donor. Published V35 does
// not gain separate floor/wall controls until that donor is deliberately loaded.
const HL1_SHA = '7f4d6ffbf69f30815b22cdd54261db2d392fcbdf3723379257826ec9e63193bd';
const HL1_WC_ORIGINAL = 'C80R2_V35_D2F_WC_RAISED_FLOOR_80MM_AND_EAST_WALL_YELLOW_TILES_154_PHOTO';
const hl1Fixture = sceneIndex => {
  const sourceIndex = sceneIndex === 199 ? 197 : 198;
  const f = fixture(sourceIndex);
  const json = f.options.gltf.parser.json;
  const names = {
    9334: ['HL1_V35_WC_FLOOR_FROM_NODE9331', 3284, 'floor', [0, 1, 2, 3, 4, 5]],
    9335: ['HL1_V35_WC_EAST_WALL_FROM_NODE9331', 3285, 'east_wall', [6, 7]],
  };
  const originalPrimitives = Array.from({ length: 8 }, (_, i) => ({
    attributes: { POSITION: 400 + i }, material: 10 + i,
  }));
  json.meshes = [];
  json.meshes[3283] = { primitives: originalPrimitives };
  for (const [nodeId, [name, mesh, part, indices]] of Object.entries(names)) {
    const id = Number(nodeId);
    json.nodes[id] = {
      name, mesh, children: [],
      extras: {
        stage: 'WORK_TEST',
        sourceGLBSHA256: SHA,
        sourceSceneIndices: [197, 198],
        sourceNodeIndex: 9331,
        sourceMeshIndex: 3283,
        sourceNodeName: HL1_WC_ORIGINAL,
        sourcePrimitiveIndices: indices,
        part,
      },
    };
    json.meshes[mesh] = { primitives: indices.map(i => originalPrimitives[i]) };
    const obj = new Object3D(name, true);
    f.sceneRoot.add(obj);
    f.objects.set(id, obj);
    f.options.gltf.parser.associations.set(obj, { nodes: id, meshes: mesh });
  }
  const targetName = sceneIndex === 199
    ? 'HL1_V35_WC_SPLIT_D2F_WORK_TEST_HOST_HOLD'
    : 'HL1_V35_WC_SPLIT_BOTH_WORK_TEST_HOST_HOLD';
  json.scenes.length = 201;
  json.scenes[sceneIndex] = {
    name: targetName,
    nodes: [...json.scenes[sourceIndex].nodes, 9334, 9335],
  };
  f.options.gltf.scenes[sceneIndex] = f.sceneRoot;
  f.options.sceneIndex = sceneIndex;
  f.options.expectedSourceSha256 = HL1_SHA;
  f.options.loadedSourceSha256 = HL1_SHA;
  return f;
};

for (const sceneIndex of [199, 200]) {
  test('HL1 donor independently binds WC floor and interior east wall while retaining 16 V35 fixtures, scene ' + sceneIndex, () => {
    const f = hl1Fixture(sceneIndex);
    const jsonSnapshot = JSON.stringify(f.options.gltf.parser.json);
    const result = resolveBuildingPartLayerBindings(f.options);
    assert.equal(result.sourceVerified, true);
    assert.equal(result.bindings.length, 18);
    assert.equal(result.frame.gates.size, 18);
    for (const [id, layerId] of [[9334, 'architecture-floors'], [9335, 'architecture-walls-interior']]) {
      assert.ok(result.bindings.some(b => b.root === f.objects.get(id) && b.id === layerId));
      const evidence = result.evidence.find(e => e.sourceNodeIndex === id);
      assert.equal(evidence?.sceneIndex, sceneIndex);
      assert.equal(evidence?.sourceSha256, HL1_SHA);
      assert.deepEqual(evidence?.sourceNodePath, [id]);
      assert.equal(evidence?.bindingKind, 'EXACT_V35_HL1_WC_SPLIT_DONOR_PROFILE');
    }
    assert.equal(result.evidence.filter(e =>
      e.bindingKind === 'INHERITED_V35_HL1_DONOR_PROFILE'
    ).length, 16);
    assert.equal(JSON.stringify(f.options.gltf.parser.json), jsonSnapshot);
  });
}

test('HL1 donor rejects wrong SHA, scene index, scene name, count and floor', () => {
  for (const variant of ['loadedSha', 'expectedSha', 'scene', 'name', 'count', 'floor']) {
    const f = hl1Fixture(199);
    if (variant === 'loadedSha') f.options.loadedSourceSha256 = SHA;
    if (variant === 'expectedSha') f.options.expectedSourceSha256 = SHA;
    if (variant === 'scene') f.options.sceneIndex = 200;
    if (variant === 'name') f.options.gltf.parser.json.scenes[199].name = 'LOOKALIKE_WC';
    if (variant === 'count') f.options.gltf.parser.json.scenes.length = 200;
    if (variant === 'floor') f.options.floor = '1F';
    const result = resolveBuildingPartLayerBindings(f.options);
    assert.equal(result.bindings.length, 0, variant);
  }
});

test('HL1 donor rejects spoofed split node, provenance, primitive mapping or parent', () => {
  for (const variant of ['name', 'mesh', 'extrasSha', 'part', 'indices', 'meshPrimitives', 'path']) {
    const f = hl1Fixture(199);
    const json = f.options.gltf.parser.json;
    const node = json.nodes[9334];
    if (variant === 'name') node.name = 'LOOKALIKE_FLOOR';
    if (variant === 'mesh') node.mesh = 3283;
    if (variant === 'extrasSha') node.extras.sourceGLBSHA256 = '0'.repeat(64);
    if (variant === 'part') node.extras.part = 'wall';
    if (variant === 'indices') node.extras.sourcePrimitiveIndices = [6, 7];
    if (variant === 'meshPrimitives') json.meshes[3284].primitives[0] = { attributes: { POSITION: 1 } };
    if (variant === 'path') {
      json.scenes[199].nodes = json.scenes[199].nodes.filter(x => x !== 9334);
      // Remove the root association without creating a nested mesh pair.
    }
    const result = resolveBuildingPartLayerBindings(f.options);
    assert.ok(!result.bindings.some(b => b.root === f.objects.get(9334)), variant);
    assert.ok(result.bindings.some(b => b.root === f.objects.get(9335)), variant);
  }
});

test('HL1 donor leaves the published V35 classification and unchanged donor source scene intact', () => {
  const published = fixture(197);
  assert.equal(resolveBuildingPartLayerBindings(published.options).bindings.length, 16);
  const donor = hl1Fixture(199);
  const json = donor.options.gltf.parser.json;
  const originalScene = donor.options.gltf.scenes[197];
  const options = { ...donor.options,
    sceneIndex: 197, activeSceneRoot: originalScene,
  };
  assert.equal(resolveBuildingPartLayerBindings(options).bindings.length, 16);
  assert.equal(resolveBuildingPartLayerBindings({
    ...donor.options, loadedSourceSha256: SHA, expectedSourceSha256: SHA,
  }).bindings.length, 0);
});
