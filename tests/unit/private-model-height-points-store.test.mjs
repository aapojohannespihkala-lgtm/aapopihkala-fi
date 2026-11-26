import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_HEIGHT_POINTS_PER_MODEL,
  heightPointsStorageKey,
  readHeightPoints,
  addHeightPoint,
  removeHeightPoint,
  displayHeightValue,
} from '../../src/scripts/privateModelHeightPointsStore.mjs';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const marker = (id = 'roof-1') => ({
  id,
  label: 'Katon harja',
  xM: 2.8875,
  yM: 4.580,
  sourceHeightYUpM: 7.730,
  surfaceObjectName: 'R34_roof',
});
function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, value); },
  };
}

test('rejects missing, short, nonhex SHA without touching storage', () => {
  const storage = memoryStorage();
  assert.equal(heightPointsStorageKey('123'), null);
  assert.equal(addHeightPoint(storage, '123', marker()).reason, 'INVALID_MODEL_SHA');
  assert.equal(storage.data.size, 0);
});

test('add, re-read and delete one local annotation', () => {
  const storage = memoryStorage();
  assert.equal(readHeightPoints(storage, A).points.length, 0);
  const added = addHeightPoint(storage, A, marker());
  assert.equal(added.ok, true);
  assert.deepEqual(readHeightPoints(storage, A).points, added.points);
  assert.equal(added.points[0].interpretation, 'WORK_TEST_MODEL_POINT_ONLY');
  assert.equal(removeHeightPoint(storage, A, 'roof-1').ok, true);
  assert.deepEqual(readHeightPoints(storage, A).points, []);
});

test('annotation storage is strictly isolated by 64-char model SHA', () => {
  const storage = memoryStorage();
  addHeightPoint(storage, A, marker());
  assert.equal(readHeightPoints(storage, B).points.length, 0);
  addHeightPoint(storage, B, marker('terrace'));
  assert.deepEqual(readHeightPoints(storage, A).points.map(p => p.id), ['roof-1']);
  assert.deepEqual(readHeightPoints(storage, B).points.map(p => p.id), ['terrace']);
});

test('duplicate IDs fail closed, preserving the original', () => {
  const storage = memoryStorage();
  addHeightPoint(storage, A, marker());
  const before = storage.getItem(heightPointsStorageKey(A));
  assert.equal(addHeightPoint(storage, A, {...marker(), label: 'Korvaa'}).reason, 'DUPLICATE_ID');
  assert.equal(storage.getItem(heightPointsStorageKey(A)), before);
});

test('invalid, nonfinite and overlong points do not persist', () => {
  const storage = memoryStorage();
  for (const invalid of [
    {...marker(), sourceHeightYUpM: Infinity},
    {...marker(), xM: NaN},
    {...marker(), yM: 1000001},
    {...marker(), id: '../other'},
    {...marker(), label: 'X'.repeat(81)},
    {...marker(), surfaceObjectName: 1},
  ]) assert.equal(addHeightPoint(storage, A, invalid).reason, 'INVALID_POINT');
  assert.equal(storage.data.size, 0);
});

test('refuses to silently overwrite malformed or cross-model records', () => {
  const storage = memoryStorage();
  const key = heightPointsStorageKey(A);
  for (const bad of ['{broken', JSON.stringify({
    version: 1, modelSha256: B, coordinateFrame: 'YLIS-G1-LOCAL', points: [],
  })]) {
    storage.setItem(key, bad);
    assert.equal(readHeightPoints(storage, A).reason, 'CORRUPTED_RECORD');
    assert.equal(addHeightPoint(storage, A, marker()).reason, 'CORRUPTED_RECORD');
    assert.equal(storage.getItem(key), bad);
  }
});

test('localStorage denied/read-write failures never claim successful save', () => {
  const deniedRead = {getItem() { throw Error('denied'); }, setItem() {}};
  assert.equal(readHeightPoints(deniedRead, A).reason, 'STORAGE_UNAVAILABLE');
  const deniedWrite = {getItem() { return null; }, setItem() { throw Error('denied'); }};
  assert.equal(addHeightPoint(deniedWrite, A, marker()).reason, 'STORAGE_UNAVAILABLE');
});

test('point removal cannot target a different model or nonexistent id', () => {
  const storage = memoryStorage();
  addHeightPoint(storage, A, marker());
  assert.equal(removeHeightPoint(storage, B, 'roof-1').reason, 'POINT_NOT_FOUND');
  assert.equal(removeHeightPoint(storage, A, 'other').reason, 'POINT_NOT_FOUND');
  assert.equal(readHeightPoints(storage, A).points.length, 1);
});

test('model marker count is bounded', () => {
  const storage = memoryStorage();
  for (let i = 0; i < MAX_HEIGHT_POINTS_PER_MODEL; i++)
    assert.equal(addHeightPoint(storage, A, marker('p' + i)).ok, true);
  assert.equal(addHeightPoint(storage, A, marker('too-many')).reason, 'MODEL_POINT_LIMIT');
  assert.equal(readHeightPoints(storage, A).points.length, MAX_HEIGHT_POINTS_PER_MODEL);
});

test('LOCAL uses vertical sourceHeightYUpM and never horizontal yM', () => {
  const result = displayHeightValue(marker(), {mode: 'LOCAL'});
  assert.equal(result.ok, true);
  assert.equal(result.meters, 7.73);
});

test('N2000 refuses absent or unsourced datum; explicit owner work assumption labelled', () => {
  const point = marker();
  assert.equal(displayHeightValue(point, {mode: 'N2000'}).reason, 'N2000_DATUM_NOT_VERIFIED');
  assert.equal(displayHeightValue(point, {mode: 'N2000', n2000OffsetM: 22.003174579}).ok, false);
  const result = displayHeightValue(point, {
    mode: 'N2000', n2000OffsetM: 22.003174579, offsetBasis: 'OWNER_WORK_ASSUMPTION',
  });
  assert.equal(result.ok, true);
  assert.equal(result.meters.toFixed(6), '29.733175');
  assert.match(result.label, /työoletus/);
  assert.equal(result.interpretation, 'WORK_TEST_CONVERTED_NOT_SURVEYED');
});
