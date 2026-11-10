import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NIBE_R2_SOURCE_SHA256 as SHA, NIBE_R2_SOURCE_SCENE_COUNT as COUNT,
  NIBE_R2_FLOORS as FLOORS, NIBE_R2_VARIANTS as VARIANTS,
  NIBE_R2_BUILDING_PARTS as PARTS, NIBE_R2_BUILDING_SCENES as SCENES,
  NIBE_R2_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93H32NibeR2LayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as BASE,
  V93_H35H38_BUILDING_PARTS as BASE_PARTS,
  V93_H35H38_BUILDING_SCENES as BASE_SCENES,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS as BASE_REVIEW,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('NIBE R2 is exact SHA / 306 scenes, never a current or canonical replacement', () => {
  assert.equal(SHA, '33c85b0de4378f125fb623c08e72086731353fc252b7c3bcd0df49d05f667e91');
  assert.notEqual(SHA, BASE);
  assert.equal(COUNT, 306);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.equal(PARTS, BASE_PARTS);
  assert.equal(REVIEW, BASE_REVIEW);
  for (let i = 295; i <= 302; i++) assert.equal(SCENES[i], BASE_SCENES[i]);
  assert.deepEqual(Object.keys(VARIANTS), ['R150','R200','R300']);
});

test('new source-scene roots are exact GLB snapshots and exclude obsolete NIBE symbol', () => {
  const expected = [
    [303,'R150',11479,'e608aed2',1120],
    [304,'R200',11494,'d7089735',1310],
    [305,'R300',11509,'c408794c',1710],
  ];
  assert.equal(fnvRoots(BASE_SCENES[302].rootNodes), '3d2123af');
  for (const [scene,variant,root,hash,height] of expected) {
    const s = SCENES[scene];
    assert.equal(VARIANTS[variant].scene, scene);
    assert.equal(VARIANTS[variant].root, root);
    assert.deepEqual(VARIANTS[variant].sizeMm, [600,615,height]);
    assert.equal(s.floor, '2F');
    assert.equal(s.rootNodes.length, 152);
    assert.deepEqual(s.rootNodes.slice(-1), [root]);
    assert.equal(fnvRoots(s.rootNodes), hash);
    assert.ok([5839,5840,5841].every(id => !s.rootNodes.includes(id)));
    assert.deepEqual(s.paths, {});
    assert.match(s.name, /WORK_TEST_HOST_HOLD$/);
    assert.equal(Object.isFrozen(s.rootNodes), true);
    assert.equal(Object.hasOwn(REVIEW, scene), false);
  }
});

test('NIBE R2 Layers reject a mismatching GLB even if glTF scene index matches', () => {
  const wrong = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: BASE,
    sceneIndex: 303, activeSceneRoot: null, area: 'D', floor: '2F',
  });
  assert.equal(wrong.sourceVerified, false);
  assert.deepEqual(wrong.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
