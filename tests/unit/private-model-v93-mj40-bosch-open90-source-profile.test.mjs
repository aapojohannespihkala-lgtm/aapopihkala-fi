import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_MJ40_SOURCE_SHA256 as SHA, V93_MJ40_SCENE_COUNT as COUNT,
  V93_MJ40_FLOORS as FLOORS, V93_MJ40_SCENES as SCENES,
  V93_MJ40_FOCUS_ROOTS as FOCUS, V93_MJ40_REVIEW_ROOTS as REVIEW,
  isV93MJ40BoschOpen90Scene as valid,
} from '../../src/scripts/privateModelV93MJ40BoschOpen90SourceProfile.mjs';
import { resolveTechnicalReviewRoots } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

function fixture() {
  const nodes = Array(11633).fill(null);
  nodes[11632] = {
    name: REVIEW[342][0].name, children: [11630, 11631],
    extras: {
      donorGLBSHA256: 'b36812d7c66c25f83d1c8288cc335adbf9fc83421eeef5bca93f625e456092db',
      parentGLBSHA256: 'e7ed92ab5c82de5d861ac8c6322248413c77312ea0adba37465fb7c5e3cdafa4', openAngleDegrees: 90,
    },
  };
  nodes[11630] = { children: [11623, 11624, 11625, 11626, 11627, 11628, 11629] };
  for (const r of REVIEW[342].slice(1)) nodes[r.node] = { name: r.name };
  const scenes = Array(COUNT).fill(null);
  scenes[342] = { name: SCENES[342].name, nodes: [...FOCUS] };
  return {
    asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: { ...FLOORS } } },
    scenes, nodes, scene: 292,
  };
}

test('Bosch exact WORK_TEST SHA, three opt-ins, preserved floor/default contract', () => {
  assert.equal(SHA, '95e1d53386664a94be541c7136aec1800470d5772ba87f1c2ee7221712bc1618');
  assert.equal(COUNT, 343);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual([340,341,342].map(i => [SCENES[i].rootCount,SCENES[i].rootFnv]), [
    [253,'037e1726'],[406,'ec82893f'],[9,'c88016d7'],
  ]);
  assert.equal(valid(fixture(), SHA, 342, '1F'), true);
});

test('Bosch source rejects SHA mismatch, wrong source scene, duplicate/closed root, altered pivot and false physical provenance', () => {
  const raw = fixture();
  assert.equal(valid(raw, 'e7ed92ab5c82de5d861ac8c6322248413c77312ea0adba37465fb7c5e3cdafa4',342), false);
  assert.equal(valid(raw, SHA, 340), false);
  assert.equal(valid(raw, SHA, 342, 'BOTH'), false);
  for (const mutate of [
    j => j.scenes[342].nodes.reverse(),
    j => j.scenes[342].nodes[1] = 5733,
    j => j.scenes[342].nodes[1] = 11632,
    j => j.nodes[11630].children.pop(),
    j => j.nodes[11632].extras.openAngleDegrees = 0,
    j => j.nodes[11632].extras.parentGLBSHA256 = 'wrong',
    j => j.asset.extras.current = true,
    j => j.asset.extras.viewerFloorScenes['1F'] = 340,
    j => j.scenes.push({}),
  ]) {
    const j = fixture(); mutate(j);
    assert.equal(valid(j, SHA, 342), false);
  }
});

test('source-only technical focus binds exact Bosch/PA2/PK1/S1S2/drain roots and refuses wrong SHA', () => {
  const json = fixture();
  const rootRows = REVIEW[342];
  const scene = { name: SCENES[342].name, children: [] };
  const association = new Map();
  for (const row of rootRows) {
    const object = { name: row.name, parent: scene };
    scene.children.push(object);
    association.set(object, { nodes: row.node });
  }
  const gltf = { scenes: Array(COUNT).fill(null), parser: { json, associations: association } };
  gltf.scenes[342] = scene;
  const found = resolveTechnicalReviewRoots(gltf, scene, 342, SHA, SHA);
  assert.equal(found?.length, 6);
  assert.equal(found?.[0], scene.children[0]);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, 342, '0'.repeat(64), SHA), null);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, 342, SHA, '0'.repeat(64)), null);
  json.scenes[342].nodes.push(5733);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, 342, SHA, SHA), null);
});

test('building-part gate refuses invalid Bosch source without inheriting another V93 SHA path', () => {
  const json = fixture();
  json.scenes[342].nodes.pop();
  const scene = { traverse() {} };
  const gltf = { scenes: Array(COUNT).fill(null), parser: { json, associations: new Map() } };
  gltf.scenes[342] = scene;
  const result = resolveBuildingPartLayerBindings({
    gltf, expectedSourceSha256: SHA, loadedSourceSha256: SHA,
    sceneIndex: 342, activeSceneRoot: scene, area: 'D', floor: '1F',
  });
  assert.equal(result.sourceVerified, false);
  assert.equal(result.excluded[0].reason, 'V93_MJ40_SOURCE_SCENE_MISMATCH');
});
