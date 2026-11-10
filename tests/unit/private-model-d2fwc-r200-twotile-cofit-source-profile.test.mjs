import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COFIT_SOURCE_SHA256 as SHA, COFIT_SOURCE_SCENE_COUNT as COUNT,
  COFIT_FLOORS as FLOORS, COFIT_BUILDING_SCENES as SCENES,
  COFIT_BUILDING_PARTS as PARTS, COFIT_OPTIN_SCENE,
  COFIT_R200_ROOT, COFIT_WALL_ROOTS, COFIT_NIBE_VARIANTS as VARIANTS,
  COFIT_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93D2FWCR200CoFitLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as V93,
  V93_H35H38_BUILDING_SCENES as OLD,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS as OLD_REVIEW,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('COFIT is pinned to independent V93 307-scene source without replacing original scenes', () => {
  assert.equal(SHA, 'dfdb2eed51acefde40905cfce4bf56969ab25077be0f2eb1df0f8cbf3fbde8cd');
  assert.notEqual(SHA, V93);
  assert.equal(COUNT, 307);
  assert.equal(COFIT_OPTIN_SCENE, 306);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.equal(REVIEW, OLD_REVIEW);
  for (const index of [295, 296, 297, 298, 299, 300, 301, 302])
    assert.equal(SCENES[index], OLD[index]);
  assert.equal(PARTS[11535].mesh, 4378);
  assert.equal(PARTS[11536].mesh, 4379);
  assert.equal(PARTS[11535].id, 'architecture-walls-interior');
});

test('all four opt-in scenes match independent GLB root hashes, including R200 + wall', () => {
  const expected = [
    [303, 152, 'e608aed2', 11479],
    [304, 152, 'd7089735', 11494],
    [305, 152, 'c408794c', 11509],
    [306, 154, 'a97c727c', 11520],
  ];
  for (const [index, count, hash, root] of expected) {
    const scene = SCENES[index];
    assert.equal(scene.floor, '2F');
    assert.equal(scene.rootNodes.length, count);
    assert.equal(fnvRoots(scene.rootNodes), hash);
    assert.equal(scene.rootNodes.at(-1), index === 306 ? 11536 : root);
    assert.equal(scene.rootNodes.includes(5839), false);
    assert.equal(scene.rootNodes.includes(5840), false);
    assert.equal(scene.rootNodes.includes(5841), false);
    assert.equal(Object.isFrozen(scene.rootNodes), true);
  }
  assert.equal(COFIT_R200_ROOT, 11520);
  assert.deepEqual(COFIT_WALL_ROOTS, [11535, 11536]);
  assert.deepEqual(SCENES[306].rootNodes.slice(-3), [11520, 11535, 11536]);
  assert.deepEqual(SCENES[306].paths[11535], [[11535]]);
  assert.deepEqual(SCENES[306].paths[11536], [[11536]]);
  assert.equal(SCENES[306].rootNodes.includes(5887), OLD[302].rootNodes.includes(5887));
  assert.equal(VARIANTS.R200.root, 11494);
  assert.deepEqual(VARIANTS.R200.sizeMm, [600,615,1310]);
  assert.equal(Object.hasOwn(REVIEW, 306), false);
});

test('mismatched source SHA cannot grant building part bindings to scene306', () => {
  const invalid = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V93,
    sceneIndex: 306, activeSceneRoot: null, area: 'D', floor: '2F',
  });
  assert.equal(invalid.sourceVerified, false);
  assert.deepEqual(invalid.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
