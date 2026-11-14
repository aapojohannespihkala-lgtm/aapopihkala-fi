import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTLETS2_SOURCE_SHA256 as SHA,
  OUTLETS2_SOURCE_SCENE_COUNT as COUNT,
  OUTLETS2_FLOORS as FLOORS,
  OUTLETS2_OPTIN_SCENES as OPTIN,
  OUTLETS2_BUILDING_PARTS as PARTS,
  OUTLETS2_BUILDING_SCENES as SCENES,
  OUTLETS2_SOURCE_ROOTS as ROOTS,
  OUTLETS2_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93DoubleOutletLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as V93_SHA,
  V93_H35H38_BUILDING_PARTS as V93_PARTS,
  V93_H35H38_BUILDING_SCENES as V93_SCENES,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnv = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('exact owner-approved double outlet GLB SHA, original scene identity and safety status', () => {
  assert.equal(SHA, '5539955b44dcd3bac48710cf81ecc307653e685956439f5db713f517ccf94e12');
  assert.notEqual(SHA, V93_SHA);
  assert.equal(COUNT, 309);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual(OPTIN, { '1F': 306, '2F': 307, BOTH: 308 });
  assert.equal(PARTS, V93_PARTS);
  for (const scene of [295, 296, 297, 298, 299, 300, 301, 302]) {
    assert.equal(SCENES[scene], V93_SCENES[scene]);
  }
});

test('six appended scenes reproduce immutable GLB scene names, ordered root hashes and no doubles', () => {
  const expected = [
    [303, 301, '1F', [11482], 241, 'cb71baf9'],
    [304, 302, '2F', [11486], 155, 'ac0b4ee3'],
    [305, 300, 'BOTH', [11482, 11486], 394, '4b831c52'],
    [306, 301, '1F', [11500], 241, 'fd7209af'],
    [307, 302, '2F', [11514], 155, '900b22cf'],
    [308, 300, 'BOTH', [11500, 11514], 394, '27048bc0'],
  ];
  for (const [index, base, floor, append, count, hash] of expected) {
    const scene = SCENES[index];
    assert.equal(scene.floor, floor);
    assert.equal(scene.rootNodes.length, count);
    assert.equal(fnv(scene.rootNodes), hash);
    assert.deepEqual(scene.rootNodes, [...V93_SCENES[base].rootNodes, ...append]);
    assert.equal(Object.isFrozen(scene.rootNodes), true);
    assert.equal(scene.name.endsWith('WORK_TEST_HOST_HOLD'), true);
  }
  for (const i of [306, 307, 308]) {
    assert.equal(SCENES[i].rootNodes.includes(11482), false);
    assert.equal(SCENES[i].rootNodes.includes(11486), false);
  }
});

test('only the two new source-exact protective cover roots are inherited by technical review', () => {
  assert.equal(ROOTS['1F'].node, 11500);
  assert.equal(ROOTS['2F'].node, 11514);
  assert.match(ROOTS['1F'].name, /DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD$/);
  assert.match(ROOTS['2F'].name, /DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD$/);
  for (const [scene, wanted] of [[306, [11500]], [307, [11514]], [308, [11500, 11514]]]) {
    for (const node of wanted) assert.equal(REVIEW[scene].filter(x => x.node === node).length, 1);
    for (const node of [11482, 11486]) assert.equal(REVIEW[scene].some(x => x.node === node), false);
  }
});

test('SHA mismatch never grants building-part authority to lookalike GLB', () => {
  const invalid = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V93_SHA,
    sceneIndex: 306, activeSceneRoot: null, area: 'D', floor: '1F',
  });
  assert.equal(invalid.sourceVerified, false);
  assert.deepEqual(invalid.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
