import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V35_FURNITURE_SOURCE_SHA256 as SHA,
  V35_FURNITURE_SOURCE_SCENE_COUNT,
  V35_FURNITURE_SCENES,
  resolveV35FurnitureSourcePart,
} from '../../src/scripts/privateModelFurnitureLayerSourceProfile.mjs';

const expected = {
  197: { root: [9293, 9292, 8309], module: [8036, 8040, 8044, 8048],
    front: [8033, 8037, 8041, 8045], panelMesh: 2464, name: 'C80R2_V35_D2F_WORK_TEST_HOST_HOLD_20261102' },
  198: { root: [9328, 9327, 8421], module: [8096, 8100, 8104, 8108],
    front: [8093, 8097, 8101, 8105], panelMesh: 2510, name: 'C80R2_V35_BOTH_WORK_TEST_HOST_HOLD_20261102' },
};
const args = (part, sceneName) => ({
  expectedSourceSha256: SHA, loadedSourceSha256: SHA,
  sceneIndex: part.sceneIndex, sceneName,
  nodeIndex: part.nodeIndex, meshIndex: part.meshIndex,
  nodeName: part.name, nodePath: [...part.path],
  parentNodeName: part.parentName,
});

test('V35 2F197 and BOTH198 contain four separate complete work-test module presentations', () => {
  assert.equal(V35_FURNITURE_SOURCE_SCENE_COUNT, 199);
  assert.deepEqual(Object.keys(V35_FURNITURE_SCENES), ['197','198']);
  for (const [sceneId, source] of Object.entries(expected)) {
    const scene = V35_FURNITURE_SCENES[sceneId];
    assert.equal(scene.name, source.name);
    assert.deepEqual(scene.rootPath, source.root);
    assert.equal(scene.parts.length, 16);
    for (let i = 0; i < 4; i++) {
      const parts = scene.parts.filter(part => part.cabinetNo === i + 1);
      assert.equal(parts.length, 4);
      assert.deepEqual(parts.map(part => part.component),
        ['carcass','lower-front','middle-front','upper-front']);
      const [carcass, ...fronts] = parts;
      assert.equal(carcass.nodeIndex, [245,250,255,260][i]);
      assert.equal(carcass.meshIndex, 334); // reused mesh != interchangeable cabinets
      assert.equal(carcass.path.at(-2), source.module[i]);
      assert.deepEqual(fronts.map(p => p.nodeIndex),
        [0,1,2].map(j => source.front[i] + j));
      assert.deepEqual(fronts.map(p => p.meshIndex),
        [0,1,2].map(j => source.panelMesh + i * 3 + j));
      assert.ok(parts.every(p => p.path.join(',') ===
        [...source.root, source.module[i], p.nodeIndex].join(',')));
      assert.ok(parts.every(p => p.layerId === 'architecture-fixtures' &&
        p.current === false && p.asBuilt === false));
      assert.equal(resolveV35FurnitureSourcePart(args(carcass, scene.name)), carcass);
      for (const front of fronts)
        assert.equal(resolveV35FurnitureSourcePart(args(front, scene.name)), front);
    }
  }
});

test('wrong GLB SHA, internal scene, node, mesh, name, path or parent fail closed', () => {
  const scene = V35_FURNITURE_SCENES[197];
  const body = scene.parts[0];
  const base = args(body, scene.name);
  const variants = [
    { expectedSourceSha256: '0'.repeat(64) },
    { loadedSourceSha256: '0'.repeat(64) },
    { sceneIndex: 198 },
    { sceneIndex: 196 },
    { sceneName: V35_FURNITURE_SCENES[198].name },
    { nodeIndex: body.nodeIndex + 1 },
    { meshIndex: body.meshIndex + 1 },
    { nodeName: 'same-looking but different cabinet' },
    { nodePath: [...body.path.slice(0,-2), 8040, body.nodeIndex] },
    { nodePath: [body.nodeIndex] },
    { parentNodeName: 'HOB28_OTHER_PARENT' },
  ];
  for (const variant of variants)
    assert.equal(resolveV35FurnitureSourcePart({...base, ...variant}), null,
      JSON.stringify(variant));
  assert.equal(resolveV35FurnitureSourcePart({}), null);
  assert.equal(resolveV35FurnitureSourcePart({...base, nodePath: '8036/245'}), null);
});

test('work envelope does not overclaim separate plinth, side panels or other appliances', () => {
  for (const scene of Object.values(V35_FURNITURE_SCENES)) {
    assert.ok(scene.parts.every(p => p.evidence.includes('WORK_') ||
      p.evidence.includes('PHOTO_2024')));
    assert.equal(scene.parts.filter(p => p.component === 'carcass').length, 4);
    assert.equal(scene.parts.filter(p => p.component.includes('front')).length, 12);
    assert.ok(scene.parts.every(p => !/SINK|ISLAND|AEG|SHADOW|SOURCE_CONTEXT/i.test(p.name)));
    assert.equal(new Set(scene.parts.map(p => p.path.join('/'))).size, 16);
  }
});
