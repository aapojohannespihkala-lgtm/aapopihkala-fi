import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectTate4Mj6263InternalScene,
  resolveTate4Mj6263ViewerScene,
  TATE4_MJ6263_VIEW_FLOORS,
  TATE4_MJ6263_GLAZING_STATES,
} from '../../src/scripts/privateModelTate4Mj6263SceneSelection.mjs';
import {
  TATE4_MJ6263_SOURCE_SHA256,
  TATE4_MJ6263_SCENES,
} from '../../src/scripts/privateModelTate4Mj62Mj63SourceProfile.mjs';

test('seven and only seven SHA-profile glTF scenes map to floor and glazing', () => {
  const expected = [
    ['1F', 'CLOSED', 353],
    ['2F', 'CLOSED', 354],
    ['BOTH', 'CLOSED', 355],
    ['2F', 'ONE_OPEN', 356],
    ['BOTH', 'ONE_OPEN', 357],
    ['2F', 'STACKED', 358],
    ['BOTH', 'STACKED', 359],
  ];
  assert.deepEqual(TATE4_MJ6263_VIEW_FLOORS, ['1F', '2F', 'BOTH']);
  assert.deepEqual(TATE4_MJ6263_GLAZING_STATES, ['CLOSED', 'ONE_OPEN', 'STACKED']);
  assert.equal(Object.keys(TATE4_MJ6263_SCENES).length, expected.length);
  for (const [floor, state, index] of expected) {
    assert.equal(selectTate4Mj6263InternalScene(floor, state), index);
    assert.equal(TATE4_MJ6263_SCENES[index].floor, floor);
    assert.equal(TATE4_MJ6263_SCENES[index].glazing, state);
  }
});

test('1F has no invented ONE_OPEN or STACKED glTF scene', () => {
  assert.equal(selectTate4Mj6263InternalScene('1F'), 353);
  assert.equal(selectTate4Mj6263InternalScene('1F', 'ONE_OPEN'), null);
  assert.equal(selectTate4Mj6263InternalScene('1F', 'STACKED'), null);
  assert.deepEqual(
    resolveTate4Mj6263ViewerScene({
      loadedGlbSha256: TATE4_MJ6263_SOURCE_SHA256, floor: '1F',
      glazingState: 'STACKED',
    }),
    { ok: false, reason: 'M6263_UNSUPPORTED_FLOOR_GLAZING' },
  );
});

test('unknown, mixed-case and prototype-key floor/state values fail closed', () => {
  for (const floor of [null, undefined, 'D', '1f', '__proto__', 'constructor', 1, {}]) {
    assert.equal(selectTate4Mj6263InternalScene(floor, 'CLOSED'), null);
  }
  for (const state of [null, 'OPEN', 'closed', '__proto__', 'constructor', {}, 0]) {
    assert.equal(selectTate4Mj6263InternalScene('2F', state), null);
  }
});

test('old parent SHA and missing raw source reject an otherwise valid scene', () => {
  assert.deepEqual(
    resolveTate4Mj6263ViewerScene({
      floor: 'BOTH', glazingState: 'ONE_OPEN',
      loadedGlbSha256: 'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b',
    }),
    { ok: false, reason: 'M6263_SOURCE_SHA_MISMATCH' },
  );
  assert.deepEqual(
    resolveTate4Mj6263ViewerScene({
      floor: 'BOTH', glazingState: 'ONE_OPEN',
      loadedGlbSha256: TATE4_MJ6263_SOURCE_SHA256,
      sourceJson: null,
    }),
    { ok: false, reason: 'M6263_SOURCE_SCENE_MISMATCH' },
  );
});

test('a correct digest does not excuse incorrect glTF source structure', () => {
  const wrong = { scene: 292, scenes: Array(360).fill({}), nodes: [], meshes: [] };
  assert.deepEqual(
    resolveTate4Mj6263ViewerScene({
      floor: '2F', glazingState: 'CLOSED',
      loadedGlbSha256: TATE4_MJ6263_SOURCE_SHA256,
      sourceJson: wrong,
    }),
    { ok: false, reason: 'M6263_SOURCE_SCENE_MISMATCH' },
  );
});
