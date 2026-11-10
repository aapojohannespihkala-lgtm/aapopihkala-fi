import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLEXI_NOOVERLAY_SOURCE_SHA256 as SHA,
  PLEXI_NOOVERLAY_SOURCE_SCENE_COUNT as COUNT,
  PLEXI_NOOVERLAY_FLOORS as FLOORS,
  PLEXI_NOOVERLAY_OPTIN_SCENES as OPTIN,
  PLEXI_NOOVERLAY_BUILDING_PARTS as PARTS,
  PLEXI_NOOVERLAY_BUILDING_SCENES as SCENES,
  PLEXI_NOOVERLAY_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93D2FWCPlexiNoOverlayLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as V93,
  V93_H35H38_BUILDING_PARTS as OLD_PARTS,
  V93_H35H38_BUILDING_SCENES as OLD,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS as OLD_REVIEW,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('no-overlay GLB has a distinct exact SHA and original V93 scene identity', () => {
  assert.equal(SHA, 'ad36018e7115eb96fc0498c15b4f71dc069bfed08d0b9c92616b5c9847d4a5c2');
  assert.notEqual(SHA, V93);
  assert.equal(COUNT, 305);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual(OPTIN, { '2F': 303, BOTH: 304 });
  assert.equal(PARTS, OLD_PARTS);
  assert.equal(REVIEW, OLD_REVIEW);
  for (const index of [295, 296, 297, 298, 299, 300, 301, 302]) {
    assert.equal(SCENES[index], OLD[index]);
  }
});

test('exact D2F and BOTH opt-in scene root hashes match V93 derived GLB', () => {
  const expected = [[303, 302, '2F', 152, '5c4292c0'], [304, 300, 'BOTH', 390, 'd4b4b8e7']];
  for (const [index, from, floor, count, hash] of expected) {
    const scene = SCENES[index];
    assert.equal(scene.floor, floor);
    assert.equal(scene.rootNodes.length, count);
    assert.equal(fnvRoots(scene.rootNodes), hash);
    assert.equal(Object.isFrozen(scene.rootNodes), true);
    assert.deepEqual(scene.rootNodes, OLD[from].rootNodes.filter(node => node !== 5840 && node !== 5841));
    assert.equal(scene.rootNodes.includes(5887), OLD[from].rootNodes.includes(5887));
    assert.equal(scene.rootNodes.includes(5888), OLD[from].rootNodes.includes(5888));
    assert.equal(scene.rootNodes.includes(5840), false);
    assert.equal(scene.rootNodes.includes(5841), false);
    assert.equal(scene.paths[5840], undefined);
    assert.equal(scene.paths[5841], undefined);
    assert.match(scene.name, /WORK_TEST_HOST_HOLD_20261110$/);
    assert.equal(Object.hasOwn(REVIEW, index), false);
  }
});

test('source SHA mismatches do not inherit building-part authority', () => {
  const invalid = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V93,
    sceneIndex: 303, activeSceneRoot: null, area: 'D', floor: '2F',
  });
  assert.equal(invalid.sourceVerified, false);
  assert.deepEqual(invalid.excluded.map(item => item.reason), ['SOURCE_SHA_MISMATCH']);
});
