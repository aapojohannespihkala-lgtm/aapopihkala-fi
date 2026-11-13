import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TATE4_MJ6263_SOURCE_SHA256,
} from '../../src/scripts/privateModelTate4Mj62Mj63SourceProfile.mjs';
import {
  TATE4_MJ6263_VIEWER_FLOORS,
  TATE4_MJ6263_GLAZING_STATES,
  tate4Mj6263SceneForView,
  tate4Mj6263SceneChoices,
  resolveTate4Mj6263ViewerSelection,
} from '../../src/scripts/privateModelTate4Mj6263ViewerVariants.mjs';

const expected = [
  ['1F','CLOSED',353],['1F','ONE_OPEN',353],['1F','STACKED',353],
  ['2F','CLOSED',354],['2F','ONE_OPEN',356],['2F','STACKED',358],
  ['BOTH','CLOSED',355],['BOTH','ONE_OPEN',357],['BOTH','STACKED',359],
];

test('all 1F/2F/BOTH plus glazing UI combinations resolve to only 7 opt-in glTF scenes', () => {
  assert.deepEqual(TATE4_MJ6263_VIEWER_FLOORS,['1F','2F','BOTH']);
  assert.deepEqual(TATE4_MJ6263_GLAZING_STATES,['CLOSED','ONE_OPEN','STACKED']);
  for (const [floor,glazing,index] of expected)
    assert.equal(tate4Mj6263SceneForView(floor,glazing),index);
  const unique = [...new Set(expected.map(row => row[2]))].sort((a,b)=>a-b);
  assert.deepEqual(unique,[353,354,355,356,357,358,359]);
  assert.equal(unique.includes(292),false);
});

test('1F-only remains the same real source scene for every upper-glazing choice', () => {
  for (const glazing of TATE4_MJ6263_GLAZING_STATES)
    assert.equal(tate4Mj6263SceneForView('1F',glazing),353);
});

test('scene inventory retains parent floors and WORK_TEST gate without mutating the source', () => {
  const choices = tate4Mj6263SceneChoices();
  assert.equal(choices.length,7);
  assert.deepEqual(choices.map(v=>v.sceneIndex),[353,354,355,356,357,358,359]);
  assert.deepEqual(choices.map(v=>v.parentSceneIndex),[350,351,352,351,352,351,352]);
  for(const choice of choices) {
    assert.equal(choice.status,'WORK_TEST_HOST_HOLD');
    assert.equal(Object.isFrozen(choice),true);
  }
  assert.equal(Object.isFrozen(choices),true);
});

test('invalid floor, case, glazing and synthetic scene cannot select source', () => {
  for(const [floor,glazing] of [
    ['3F','CLOSED'],['2F','OPEN'],['whole','STACKED'],
    ['BOTH','stacked'],['1F',null],[null,'CLOSED'],[292,'CLOSED'],
  ]) assert.equal(tate4Mj6263SceneForView(floor,glazing),null);
});

test('guard refuses missing or wrong inner-GLB SHA and does not fall back to default292', () => {
  const bad = {floor:'BOTH',glazingState:'STACKED',gltfJson:{}};
  assert.equal(resolveTate4Mj6263ViewerSelection(bad),null);
  assert.equal(resolveTate4Mj6263ViewerSelection({...bad,loadedSourceSha256:'0'.repeat(64)}),null);
  assert.equal(resolveTate4Mj6263ViewerSelection({...bad,loadedSourceSha256:TATE4_MJ6263_SOURCE_SHA256}),null);
  assert.equal(resolveTate4Mj6263ViewerSelection(),null);
});
