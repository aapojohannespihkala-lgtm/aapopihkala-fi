import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_MJ49_SOURCE_SHA256 as SHA, V93_MJ49_SCENE_COUNT as COUNT,
  V93_MJ49_FLOORS as FLOORS, V93_MJ49_SCENES as SCENES,
  V93_MJ49_FOCUS_ROOTS as FOCUS, V93_MJ49_REVIEW_ROOTS as REVIEW,
  isV93MJ49SavoNSScene as valid,
} from '../../src/scripts/privateModelV93MJ49SavoNSKIV3SourceProfile.mjs';
import { resolveTechnicalReviewRoots } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const baseSha = '3a43dd443502e25171ff8284f0cc067c69c6d769fd151b61b416ca69698712ac';
const donorSha = 'cd6ec1bc3963e664b30bc3e3ff8f0acd1e2e40adf6b7c150dc45f47158172db2';

function fixture() {
  const nodes = Array(11747).fill(null);
  nodes[11745] = {
    name: REVIEW[349][4].name,
    children: [11740,11741,11742,11743,11744],
    extras: {
      ownerNorthSouthCorrection20261110: true, notPhysicalDuctToE220S: true,
      sourceGLBSHA256: donorSha, baseGLBSHA256: baseSha,
    },
  };
  nodes[11746] = { name: REVIEW[349][0].name, children: [8908,8909,8910] };
  nodes[11742] = { name: 'MJ16_NORTH_DISCHARGE_G1_PLUS_Y_GLB_MINUS_Z' };
  nodes[11743] = { name: 'MJ16_SOUTH_DISCHARGE_G1_MINUS_Y_GLB_PLUS_Z' };
  for (const row of REVIEW[349].slice(1,4)) nodes[row.node] = { name: row.name };
  const scenes = Array(COUNT).fill(null);
  scenes[349] = { name: SCENES[349].name, nodes: [...FOCUS] };
  return {
    asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: { ...FLOORS } } },
    scenes, nodes, scene: 292,
  };
}

test('MJ49 exact SHA and three source scenes preserve default / floor contract', () => {
  assert.equal(SHA, '5e1f75d47c056af7a3c916af78d340a24d4ae6a5d92c0091ed99321a159ff4a4');
  assert.equal(COUNT, 350);
  assert.deepEqual(FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.deepEqual([347,348,349].map(i=>[SCENES[i].rootCount,SCENES[i].rootFnv]), [
    [161,'770b6d8a'],[412,'485e6467'],[5,'0ebb7b20'],
  ]);
  assert.equal(valid(fixture(), SHA, 349, '2F'), true);
});

test('MJ49 fails closed for wrong SHA, scene, order, directions, current or copied source', () => {
  assert.equal(valid(fixture(), baseSha, 349), false);
  assert.equal(valid(fixture(), SHA, 347), false);
  assert.equal(valid(fixture(), SHA, 349, '1F'), false);
  for (const mutate of [
    json => json.scenes[349].nodes.reverse(),
    json => json.scenes[349].nodes[1] = 11746,
    json => json.scenes[349].nodes.push(11745),
    json => json.nodes[11745].extras.notPhysicalDuctToE220S = false,
    json => json.nodes[11745].extras.sourceGLBSHA256 = baseSha,
    json => json.nodes[11742].name = 'MJ16_EAST_DISCHARGE_WRONG',
    json => json.nodes[11745].children.pop(),
    json => json.nodes[11746].children.pop(),
    json => json.asset.extras.current = true,
    json => json.asset.extras.viewerFloorScenes['2F'] = 349,
    json => json.scenes.push({}),
  ]) {
    const json=fixture();mutate(json);
    assert.equal(valid(json,SHA,349),false);
  }
});

test('technical source focus resolves five real root identities, not wrong/altered GLB', () => {
  const json=fixture();
  const scene={ name: SCENES[349].name, children: [] };
  const associations=new Map();
  for (const row of REVIEW[349]) {
    const object={ name: row.name, parent: scene };
    scene.children.push(object);
    associations.set(object,{nodes:row.node});
  }
  const gltf={ scenes: Array(COUNT).fill(null), parser: {json,associations} };
  gltf.scenes[349]=scene;
  const result=resolveTechnicalReviewRoots(gltf,scene,349,SHA,SHA);
  assert.equal(result?.length,5);
  assert.deepEqual(result,scene.children);
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,349,'0'.repeat(64),SHA),null);
  json.scenes[349].nodes.reverse();
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,349,SHA,SHA),null);
});

test('building-part guard blocks the MJ49 SHA on a mismatched opt-in scene', () => {
  const json=fixture();
  json.scenes[349].nodes.pop();
  const scene={ traverse() {} };
  const gltf={ scenes:Array(COUNT).fill(null), parser:{json,associations:new Map()} };
  gltf.scenes[349]=scene;
  const result=resolveBuildingPartLayerBindings({
    gltf, expectedSourceSha256:SHA, loadedSourceSha256:SHA,
    sceneIndex:349, activeSceneRoot:scene, area:'D', floor:'2F',
  });
  assert.equal(result.sourceVerified,false);
  assert.equal(result.excluded[0].reason,'V93_MJ49_SOURCE_SCENE_MISMATCH');
});
