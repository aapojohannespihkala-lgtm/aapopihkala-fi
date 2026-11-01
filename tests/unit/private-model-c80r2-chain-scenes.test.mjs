import test from 'node:test';
import assert from 'node:assert/strict';
import {
  floorOfC80R2SceneName, resolveC80R2ChainFloorScenes,
} from '../../src/scripts/privateModelC80R2ChainScenes.mjs';

// Shape of the real G2b 108-scene MAT01 GLB (SHA d4d16b8f…, 1.11.2026):
// 52 historical scenes, then C80R2 D1F/D2F/BOTH successor pairs.
function chainJson(extra = {}) {
  const scenes = Array.from({ length: 108 }, (_, i) => ({ name: `HISTORICAL_${i}`, nodes: [i] }));
  const named = {
    0: 'C80R2_HI13_BOTH_WORK_TEST_HOST_HOLD',
    1: 'C80R2_HI13_1F_WORK_TEST_HOST_HOLD',
    60: 'C80R2_C045_C020_C046_C030_C050_UNIFIED_1F_WORK_TEST_HOST_HOLD_NONCURRENT',
    62: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_2F_WORK_TEST_HOST_HOLD_NONCURRENT',
    63: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT',
    68: 'C80R2_D1F_TERRACE_WEST_BRICK_CORNER_DOWNSPOUT_PHOTO_1F_WORK_TEST_HOST_HOLD_20261101',
    69: 'C80R2_D1F_TERRACE_WEST_BRICK_CORNER_DOWNSPOUT_PHOTO_BOTH_WORK_TEST_HOST_HOLD_20261101',
    76: 'C80R2_D2F_BALCONY_CEILING_LAMP_HEATER_D2F_PHOTO_LOCAL_UNCLAIMED_WORK_TEST_20261101',
    102: 'C80R2_K11D_DR01_BD01_D2F_BROWN_GLAZED_DOOR_D2F_PHOTO_WORK_TEST_HOST_HOLD',
    104: 'C80R2_D2F_BD01_BZ01_LIGHT_INNER_DARK_OUTER_BALCONY_DOOR_WORK_TEST_HOST_HOLD',
    105: 'C80R2_BOTH_BD01_BZ01_LIGHT_INNER_DARK_OUTER_BALCONY_DOOR_WORK_TEST_HOST_HOLD',
    106: 'C80R2_K17_CURRENT_PHOTO_WOOD_TREADS_WHITE_RISERS_D1F_WORK_TEST_HOST_HOLD_20261101',
    107: 'C80R2_K17_CURRENT_PHOTO_WOOD_TREADS_WHITE_RISERS_BOTH_WORK_TEST_HOST_HOLD_20261101',
  };
  for (const [i, name] of Object.entries(named)) scenes[i].name = name;
  return { scene: 0, scenes, asset: { extras: { current: false, asBuilt: false, ...extra } } };
}

test('floor tokens: BOTH wins, then 2F, then 1F; only C80R2_ scenes', () => {
  assert.equal(floorOfC80R2SceneName('C80R2_D1F_TERRACE_X_BOTH_WORK_TEST'), 'BOTH');
  assert.equal(floorOfC80R2SceneName('C80R2_D2F_BALCONY_X_D2F_PHOTO'), '2F');
  assert.equal(floorOfC80R2SceneName('C80R2_K17_X_D1F_WORK_TEST'), '1F');
  assert.equal(floorOfC80R2SceneName('C80R2_X_1F_CEILING'), '1F');
  assert.equal(floorOfC80R2SceneName('C80R2_K17_CURRENT_PHOTO'), null);
  assert.equal(floorOfC80R2SceneName('HI20_D1F_BOTH'), null);
  assert.equal(floorOfC80R2SceneName('C80R2_D1FX_BOTHER'), null);
});

test('108scene picks the latest successor scenes 106/104/107', () => {
  const r = resolveC80R2ChainFloorScenes(chainJson());
  assert.deepEqual([r['1F'], r['2F'], r.BOTH], [106, 104, 107]);
  assert.equal(r.source, 'latest-C80R2-scene-name');
  assert.match(r.names.BOTH, /WOOD_TREADS_WHITE_RISERS_BOTH/);
});

test('explicit asset.extras.viewerFloorScenes wins and is validated', () => {
  const r = resolveC80R2ChainFloorScenes(chainJson({ viewerFloorScenes: { '1F': 68, '2F': 104, BOTH: 69 } }));
  assert.deepEqual([r['1F'], r['2F'], r.BOTH, r.source], [68, 104, 69, 'asset.extras.viewerFloorScenes']);
  assert.equal(resolveC80R2ChainFloorScenes(chainJson({ viewerFloorScenes: { '1F': 68, '2F': 68, BOTH: 69 } })), null);
  assert.equal(resolveC80R2ChainFloorScenes(chainJson({ viewerFloorScenes: { '1F': 999, '2F': 104, BOTH: 69 } })), null);
});

test('fails closed for CURRENT/as-built, short or non-chain files', () => {
  assert.equal(resolveC80R2ChainFloorScenes(chainJson({ current: true })), null);
  assert.equal(resolveC80R2ChainFloorScenes(chainJson({ asBuilt: true })), null);
  const currentScene = chainJson();
  currentScene.scenes[107].extras = { current: true };
  assert.equal(resolveC80R2ChainFloorScenes(currentScene), null);
  const short = chainJson();
  short.scenes = short.scenes.slice(0, 60);
  assert.equal(resolveC80R2ChainFloorScenes(short), null);
  const plain = chainJson();
  plain.scenes.forEach((s, i) => { s.name = `HI20_${i}`; });
  assert.equal(resolveC80R2ChainFloorScenes(plain), null);
  assert.equal(resolveC80R2ChainFloorScenes(null), null);
});
