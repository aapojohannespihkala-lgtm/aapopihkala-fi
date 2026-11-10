import test from 'node:test';
import assert from 'node:assert/strict';
import {
  H30_CEILING_SOURCE_SHA256 as SHA,
  H30_CEILING_SOURCE_SCENE_COUNT as COUNT,
  H30_CEILING_FLOORS as FLOORS,
  H30_CEILING_OPTIN_SCENES as OPTIN,
  H30_CEILING_HOST_STATUS as HOSTS,
  H30_CEILING_BUILDING_PARTS as PARTS,
  H30_CEILING_BUILDING_SCENES as SCENES,
  H30_CEILING_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93H30CeilingLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as V93,
  V93_H35H38_BUILDING_PARTS,
  V93_H35H38_BUILDING_SCENES,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('H30 opt-in ceiling profile is exact-SHA scoped and cannot replace original V93 or default', () => {
  assert.equal(SHA, 'c723dab4aa34e29b8680b412402f07a4dfce0d96be6434a5e96e8717e49d01ac');
  assert.notEqual(SHA, V93);
  assert.equal(COUNT, 309);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual(OPTIN, { '1F': 306, '2F': 307, BOTH: 308 });
  assert.equal(PARTS, V93_H35H38_BUILDING_PARTS);
  assert.equal(REVIEW, V93_H35H38_TECHNICAL_REVIEW_ROOTS);
  assert.deepEqual(HOSTS, {
    6497: 'NONPHYSICAL_PRESENTATION_ONLY',
    8003: 'WORK_TEST_MODEL_CEILING_ONLY',
  });
  for (const index of [295, 296, 297, 298, 299, 300, 301, 302]) {
    assert.equal(SCENES[index], V93_H35H38_BUILDING_SCENES[index]);
  }
});

test('H30 six appended scene roots match independent byte-verified GLB snapshots', () => {
  const expected = [
    [303, '1F', 14, 'f5904db6'],
    [304, '2F', 11, '157aa9d6'],
    [305, 'BOTH', 24, '9ead0397'],
    [306, '1F', 2, '455095cc'],
    [307, '2F', 3, '608216f1'],
    [308, 'BOTH', 5, '2a23ed68'],
  ];
  for (const [index, floor, count, hash] of expected) {
    const scene = SCENES[index];
    assert.equal(scene.floor, floor);
    assert.equal(scene.rootNodes.length, count);
    assert.equal(fnvRoots(scene.rootNodes), hash);
    assert.equal(Object.isFrozen(scene.rootNodes), true);
    assert.deepEqual(scene.paths, {}); // No synthetic building-part sourcePaths.
    assert.match(scene.name, /WORK_TEST_HOST_HOLD$/);
  }
  assert.deepEqual(SCENES[306].rootNodes, [6497, 11432]);
  assert.deepEqual(SCENES[307].rootNodes, [8003, 11433, 11434]);
  assert.deepEqual(SCENES[308].rootNodes, [6497, 8003, 11432, 11433, 11434]);
  assert.equal(Object.hasOwn(REVIEW, 306), false);
  assert.equal(Object.hasOwn(REVIEW, 307), false);
  assert.equal(Object.hasOwn(REVIEW, 308), false);
});

test('H30 ceiling layer binding rejects another GLB SHA even with matching scene number', () => {
  const wrong = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V93,
    sceneIndex: 306, activeSceneRoot: null, area: 'D', floor: '1F',
  });
  assert.equal(wrong.sourceVerified, false);
  assert.equal(wrong.reason, 'SOURCE_SHA_MISMATCH');
});
