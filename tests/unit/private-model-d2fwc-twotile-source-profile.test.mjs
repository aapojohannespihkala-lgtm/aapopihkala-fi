import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TWOTILE_SOURCE_SHA256 as SHA, TWOTILE_SOURCE_SCENE_COUNT as COUNT,
  TWOTILE_FLOORS as FLOORS, TWOTILE_OPTIN_SCENES as OPTIN,
  TWOTILE_BUILDING_SCENES as SCENES, TWOTILE_BUILDING_PARTS as PARTS,
  TWOTILE_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93D2FWCTwoTileLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as V93,
  V93_H35H38_BUILDING_SCENES as OLD,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('two-tile source is pinned to an independent 307-scene noncurrent GLB', () => {
  assert.equal(SHA, 'ae9d4dd107942988adc89e6480220a90b974986ef0e6a88bad1d62c868afada6');
  assert.notEqual(SHA, V93);
  assert.equal(COUNT, 307);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual(OPTIN, { '2F': 305, BOTH: 306 });
  assert.equal(REVIEW, V93_H35H38_TECHNICAL_REVIEW_ROOTS);
  for (const index of [295,296,297,298,299,300,301,302]) {
    assert.equal(SCENES[index], OLD[index]);
  }
  assert.equal(PARTS[11479].mesh, 4340);
  assert.equal(PARTS[11480].mesh, 4341);
  assert.equal(PARTS[11479].id, 'architecture-walls-interior');
  assert.equal(PARTS[11480].id, 'architecture-walls-interior');
});

test('new scenes exactly match independent source GLB root hashes and never restore cover proxies', () => {
  const expected = [
    [303, '2F', 152, '5c4292c0'],
    [304, 'BOTH', 390, 'd4b4b8e7'],
    [305, '2F', 154, '43e0cb17'],
    [306, 'BOTH', 392, '4d47e258'],
  ];
  for (const [index, floor, count, hash] of expected) {
    const scene = SCENES[index];
    assert.equal(scene.floor, floor);
    assert.equal(scene.rootNodes.length, count);
    assert.equal(fnvRoots(scene.rootNodes), hash);
    assert.equal(Object.isFrozen(scene.rootNodes), true);
    assert.equal(scene.paths[5840], undefined);
    assert.equal(scene.rootNodes.includes(5840), false);
    assert.equal(scene.rootNodes.includes(5841), false);
    assert.match(scene.name, /WORK_TEST_HOST_HOLD_20261110$/);
    assert.equal(Object.hasOwn(REVIEW, index), false);
  }
  assert.deepEqual(SCENES[305].rootNodes, [...SCENES[303].rootNodes, 11479, 11480]);
  assert.deepEqual(SCENES[306].rootNodes, [...SCENES[304].rootNodes, 11479, 11480]);
  for (const index of [305, 306]) {
    assert.deepEqual(SCENES[index].paths[11479], [[11479]]);
    assert.deepEqual(SCENES[index].paths[11480], [[11480]]);
  }
});

test('SHA-mismatched source cannot gain building part authority by matching scene number', () => {
  const invalid = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V93,
    sceneIndex: 305, activeSceneRoot: null, area: 'D', floor: '2F',
  });
  assert.equal(invalid.sourceVerified, false);
  assert.deepEqual(invalid.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
