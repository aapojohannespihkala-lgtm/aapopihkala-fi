import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import { resolveTechnicalReviewRoots } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import { V92_SOURCE_SHA256, V92_BUILDING_SCENES, V92_BUILDING_PARTS, V92_TECHNICAL_REVIEW_ROOTS } from '../../src/scripts/privateModelC80R2V92LayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as SHA,
  V93_H35H38_SOURCE_SCENE_COUNT as COUNT,
  V93_H35H38_FLOORS as FLOORS,
  V93_H35H38_OPTIN_SCENES as OPTIN,
  V93_H35H38_BUILDING_SCENES as SCENES,
  V93_H35H38_BUILDING_PARTS as PARTS,
  V93_H35H38_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';

const extended = (base, drop = null, add = null, h35 = false) => {
  const roots = [...V92_BUILDING_SCENES[base].rootNodes];
  if (drop !== null) {
    const i = roots.indexOf(drop);
    assert.ok(i >= 0);
    roots[i] = add;
  }
  if (h35) roots.push(11435);
  return roots;
};

test('V93 exact SHA keeps the original asset floor contract but exposes opt-in scene 300-302', () => {
  assert.equal(SHA, 'a01025bd91cbff6e83c2bdaea954e77333368e2f40f356a6672ea0dc2c09246a');
  assert.notEqual(SHA, V92_SOURCE_SHA256);
  assert.equal(COUNT, 303);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual(OPTIN, { '1F': 301, '2F': 302, BOTH: 300 });
  assert.equal(PARTS, V92_BUILDING_PARTS);
  assert.equal(Object.hasOwn(REVIEW, 300), false);
  assert.equal(Object.hasOwn(REVIEW, 301), false);
  assert.equal(Object.hasOwn(REVIEW, 302), false);
});

test('V93 H35/H38 exact scene roots retain 3 smoke alarms and H35 without re-exposing old cable tech roots', () => {
  const rows = [
    [295, 295, null, null, true, 'C80R2_V93_H30_H35_1F_WORK_TEST_HOST_HOLD'],
    [296, 296, null, null, false, 'C80R2_V92_H30_SMOKE_2F_WORK_TEST_HOST_HOLD_20261108'],
    [297, 297, null, null, true, 'C80R2_V93_H30_H35_BOTH_WORK_TEST_HOST_HOLD'],
    [298, 295, null, null, true, 'V93_H35_VM20_1F_OPTIN_H30_3SMOKE_WORK_TEST_HOST_HOLD'],
    [299, 297, null, null, true, 'V93_H35_VM20_BOTH_OPTIN_H30_3SMOKE_WORK_TEST_HOST_HOLD'],
    [300, 297, 10058, 11476, true, 'V93_H35_H38_BOTH_NO_EXPOSED_2015_CABLES_OPTIN_WORK_TEST_HOST_HOLD'],
    [301, 295, 10056, 11477, true, 'V93_H35_H38_1F_CABLE_HIDDEN_OPTIN_WORK_TEST_HOST_HOLD'],
    [302, 296, 10057, 11478, false, 'V93_H35_H38_2F_CABLE_HIDDEN_OPTIN_WORK_TEST_HOST_HOLD'],
  ];
  for (const [scene, base, drop, add, h35, name] of rows) {
    assert.equal(SCENES[scene].name, name);
    assert.deepEqual(SCENES[scene].rootNodes, extended(base, drop, add, h35));
    assert.equal(SCENES[scene].paths, V92_BUILDING_SCENES[base].paths);
    for (const [node, paths] of Object.entries(SCENES[scene].paths)) {
      for (const path of paths) assert.ok(SCENES[scene].rootNodes.includes(path[0]) && path.at(-1) === Number(node));
    }
  }
  assert.ok(SCENES[301].rootNodes.includes(11432));
  assert.ok(SCENES[302].rootNodes.includes(11433) && SCENES[302].rootNodes.includes(11434));
  assert.ok(SCENES[300].rootNodes.includes(11435));
  for (const [scene, oldTech, newTech] of [[300, 10058, 11476], [301, 10056, 11477], [302, 10057, 11478]]) {
    assert.equal(SCENES[scene].rootNodes.includes(oldTech), false);
    assert.equal(SCENES[scene].rootNodes.filter(n => n === newTech).length, 1);
  }
});

test('V93 binding never accepts a mismatched V92 source hash', () => {
  const result = resolveBuildingPartLayerBindings({
    gltf: {}, expectedSourceSha256: SHA, loadedSourceSha256: V92_SOURCE_SHA256,
    sceneIndex: 301, activeSceneRoot: null, area: 'D', floor: '1F',
  });
  assert.equal(result.sourceVerified, false);
});

// Source-independent scene-root signatures from exact V93 H35/H38 GLB SHA a01025bd...
// (G2b TYÖ ZIP 1b06tT5ZfT8fCakpFUWzvSIaDfm5iVRig), not derived from V92.
const fnvSceneRoots = roots => {
  let hash = 2166136261;
  for (const id of roots) hash = Math.imul(hash ^ id, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('V93 source-locked H35 review roots match original 1F/BOTH GLB snapshots', () => {
  assert.equal(fnvSceneRoots(SCENES[295].rootNodes), '91cda53e');
  assert.equal(fnvSceneRoots(SCENES[297].rootNodes), 'a16af668');
  const manifold = { node: 11435, name: 'H20_D1F_WC_UPPERHATCH_MANIFOLD_WORK_TEST_HOST_HOLD_ROOT' };
  for (const scene of [295, 297]) {
    assert.equal(SCENES[scene].rootNodes.filter(node => node === 11435).length, 1);
    assert.deepEqual(REVIEW[scene].at(-1), manifold);
    assert.deepEqual(REVIEW[scene].slice(0, -1), V92_TECHNICAL_REVIEW_ROOTS[scene]);
    assert.equal(REVIEW[scene].filter(root => root.node === 11435).length, 1);
  }
  assert.equal(Object.isFrozen(REVIEW), true);
  assert.deepEqual(REVIEW[296], V92_TECHNICAL_REVIEW_ROOTS[296]);
  assert.ok(!SCENES[296].rootNodes.includes(11435));
  for (const scene of [298, 299, 300, 301, 302]) assert.equal(Object.hasOwn(REVIEW, scene), false);
});

test('V93 exact-SHA technical review keeps H35 40-mesh root only in the matching source scene', () => {
  for (const sceneIndex of [295, 297]) {
    const sourceRoots = REVIEW[sceneIndex];
    const scene = { name: SCENES[sceneIndex].name, children: [] };
    const association = new Map();
    const nodeDefs = [];
    for (const root of sourceRoots) {
      const object = { name: root.name, parent: scene };
      scene.children.push(object);
      association.set(object, { nodes: root.node });
      nodeDefs[root.node] = { name: root.name };
    }
    const json = {
      asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: FLOORS } },
      scenes: Array(COUNT).fill(null), nodes: nodeDefs,
    };
    json.scenes[sceneIndex] = { name: SCENES[sceneIndex].name, nodes: [...SCENES[sceneIndex].rootNodes] };
    const gltf = { scenes: Array(COUNT).fill(null), parser: { json, associations: association } };
    gltf.scenes[sceneIndex] = scene;
    const roots = resolveTechnicalReviewRoots(gltf, scene, sceneIndex, SHA, SHA);
    assert.equal(roots?.length, sourceRoots.length);
    assert.equal(roots.at(-1).name, sourceRoots.at(-1).name);
    assert.equal(resolveTechnicalReviewRoots(gltf, scene, sceneIndex, V92_SOURCE_SHA256, SHA), null);
  }
});
