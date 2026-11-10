import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IV_MJ01_SOURCE_SHA256 as SHA, IV_MJ01_SOURCE_SCENE_COUNT as COUNT,
  IV_MJ01_FLOORS as FLOORS, IV_MJ01_BUILDING_PARTS as PARTS,
  IV_MJ01_BUILDING_SCENES as SCENES, IV_MJ01_OPTIN_SCENES as OPTIN,
  IV_MJ01_TECHNICAL_REVIEW_ROOTS as TECHNICAL,
  IV_MJ01_COLLECTOR_ROOT as COLLECTOR, IV_MJ01_FLOOR_WC_ROOT as WC,
  IV_MJ01_OLD_TWIN_ROOT as OBSOLETE,
} from '../../src/scripts/privateModelC80R2V93IVCollectorMJ01LayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as BASE_SHA,
  V93_H35H38_BUILDING_SCENES as BASE_SCENES,
  V93_H35H38_BUILDING_PARTS as BASE_PARTS,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('collector + MJ01 is one SHA-exact 338-scene noncurrent V93 opt-in', () => {
  assert.equal(SHA, 'bccdfcea6f73d7350d54f35c5c04b6c0195ba081522aa0c7c82432edb4ffe640');
  assert.notEqual(SHA, BASE_SHA);
  assert.equal(COUNT, 338);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.equal(PARTS, BASE_PARTS);
  assert.deepEqual(OPTIN, { NORMAL_2F: 335, MAINTENANCE_2F: 336, BOTH: 337 });
  for (const i of [295, 296, 297, 298, 299, 300, 301, 302])
    assert.equal(SCENES[i], BASE_SCENES[i]);
});

test('each exact source scene contains ONE shared collector and ONE floor-WC root', () => {
  const cases = [
    [335, '2F', 160, 'e7dd6c6c', true],
    [336, '2F', 159, 'b299821f', false],
    [337, 'BOTH', 398, '83ad41b6', true],
  ];
  for (const [index,floor,rootCount,hash,plexi] of cases) {
    const scene = SCENES[index];
    const roots = scene.rootNodes;
    assert.equal(scene.floor, floor);
    assert.equal(roots.length, rootCount);
    assert.equal(fnvRoots(roots), hash);
    for (const root of [COLLECTOR, WC])
      assert.equal(roots.filter(id => id === root).length, 1);
    for (const old of [OBSOLETE, 5839, 5840, 5841, 5887, 5888, 11650, 11651])
      assert.equal(roots.includes(old), false);
    assert.equal(roots.includes(11587), plexi);
    assert.equal(Object.isFrozen(roots), true);
    assert.match(scene.name, /WORK_TEST$/);
    assert.deepEqual(TECHNICAL[index].map(x => x.node), [COLLECTOR, WC]);
  }
});

test('wrong GLB SHA cannot unlock same-numbered opt-in building scene', () => {
  const wrong = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: BASE_SHA,
    sceneIndex: 335, activeSceneRoot: null, area: 'D', floor: '2F',
  });
  assert.equal(wrong.sourceVerified, false);
  assert.deepEqual(wrong.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
