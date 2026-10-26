import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveSharedCdFloorPlane,
  G2_CD_FLOOR_SPLIT_Z_M,
} from '../../src/scripts/privateModelSharedBoundaryClip.mjs';

const sha = '466f0f0ddccc68f89bfcbd6e97192deaddc548cffecb5b335392a8525c4b0b39';
const source = Object.freeze({
  zipSha256: sha, objectKey: 'source-verified-shared-cd',
  apartmentScope: 'SHARED_CD', storeyScope: 'BOTH',
  role: 'SHARED_BOUNDARY', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST',
});
const base = {
  source, expectedZipSha256: sha, expectedObjectKey: source.objectKey,
  matrixReference: 'G1_LOCAL_TO_WORLD',
};
// G1 local Z becomes glTF/Three world Y; translation (10, 5, -4).
const g1ToWorld = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 10, 5, -4, 1];
const world = (m, p) => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
];
const distance = (plane, p) =>
  plane.normal.reduce((sum, n, i) => sum + n * p[i], plane.constant);
const calculate = (floor, matrix = g1ToWorld, rest = {}) =>
  deriveSharedCdFloorPlane({ ...base, floor, g1LocalToWorld: matrix, ...rest });
const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test('T04 1F/2F: G1 local 2.760 becomes world Y=7.760, not world Z', () => {
  assert.equal(G2_CD_FLOOR_SPLIT_Z_M, 2.760);
  const lower = calculate('1F');
  const upper = calculate('2F');
  assert.equal(lower.ok, true);
  assert.equal(upper.ok, true);
  lower.plane.normal.forEach((v, i) => approx(v, [0, 1, 0][i]));
  upper.plane.normal.forEach((v, i) => approx(v, [0, -1, 0][i]));
  approx(lower.plane.constant, -7.76);
  approx(upper.plane.constant, 7.76);
  for (const xy of [[0, 0], [5, 1]]) {
    assert.ok(distance(lower.plane, world(g1ToWorld, [...xy, 1])) < 0);
    assert.ok(distance(lower.plane, world(g1ToWorld, [...xy, 4])) > 0);
    assert.ok(distance(upper.plane, world(g1ToWorld, [...xy, 4])) < 0);
    assert.ok(distance(upper.plane, world(g1ToWorld, [...xy, 1])) > 0);
    approx(distance(lower.plane, world(g1ToWorld, [...xy, 2.760])), 0);
  }
});

test('T04 preserves local reference through nonuniform scaling, skew and origin translation', () => {
  const m = [1, 0, 0, 0, 1, 0, -1, 0, 0, 2, 0, 0, 15, -3, 21, 1];
  const lo = calculate('1F', m);
  const hi = calculate('2F', m);
  assert.equal(lo.ok, true);
  assert.equal(hi.ok, true);
  const lower = world(m, [1, 1, 0.3]);
  const upper = world(m, [1, 1, 4.3]);
  assert.ok(distance(lo.plane, lower) < 0);
  assert.ok(distance(lo.plane, upper) > 0);
  assert.ok(distance(hi.plane, upper) < 0);
  assert.ok(distance(hi.plane, lower) > 0);
  approx(distance(lo.plane, world(m, [1, 1, 2.760])), 0);
});

test('T04 uses inverse transpose including reflected (negative determinant) roots', () => {
  const mirrored = [-1, 0, 0, 0, 0, 0, -1, 0, 0, 1.5, 0, 0, 0, 3, 0, 1];
  const lo = calculate('1F', mirrored);
  const hi = calculate('2F', mirrored);
  assert.equal(lo.ok, true);
  assert.equal(hi.ok, true);
  assert.ok(distance(lo.plane, world(mirrored, [0, 0, 1])) < 0);
  assert.ok(distance(lo.plane, world(mirrored, [0, 0, 5])) > 0);
  assert.ok(distance(hi.plane, world(mirrored, [0, 0, 5])) < 0);
});

test('WHOLE and D+BOTH keep one original wall with no render proxy/plane', () => {
  for (const floor of ['WHOLE', 'BOTH']) {
    const answer = calculate(floor);
    assert.equal(answer.ok, true);
    assert.equal(answer.reason, 'SOURCE_ORIGINAL');
    assert.equal(answer.plane, null);
  }
});

test('missing or mismatched ZIP/object identity and non-shared/historical scope fail closed', () => {
  assert.equal(calculate('1F', g1ToWorld, { expectedZipSha256: 'a'.repeat(64) }).ok, false);
  assert.equal(calculate('1F', g1ToWorld, { expectedObjectKey: 'scene28-name-only' }).ok, false);
  assert.equal(calculate('1F', g1ToWorld, { source: { ...source, objectKey: null } }).ok, false);
  for (const altered of [
    { apartmentScope: 'D' }, { storeyScope: '1F' }, { role: 'UNCLASSIFIED' },
    { phaseScope: 'HISTORICAL' },
  ]) {
    const r = calculate('1F', g1ToWorld, { source: { ...source, ...altered } });
    assert.equal(r.ok, false);
    assert.equal(r.plane, null);
  }
  assert.equal(calculate('UNKNOWN').ok, false);
});

test('invalid, non-affine or degenerate transform cannot expose whole shared wall', () => {
  assert.equal(calculate('1F', g1ToWorld, { matrixReference: 'RAW_NODE_WORLD_UNVERIFIED' }).ok, false);
  const bad = [...g1ToWorld]; bad[15] = 0;
  assert.equal(calculate('1F', bad).ok, false);
  const singular = [...g1ToWorld]; singular[8] = 0; singular[9] = 0; singular[10] = 0;
  assert.equal(calculate('1F', singular).reason, 'SINGULAR_G1_WORLD_TRANSFORM');
  const nan = [...g1ToWorld]; nan[5] = NaN;
  assert.equal(calculate('2F', nan).ok, false);
  assert.equal(calculate('1F', [1, 2, 3]).ok, false);
});

test('plane calculation does not mutate source evidence or its matrix', () => {
  const copied = [...g1ToWorld];
  const original = JSON.stringify(source);
  const lo = calculate('1F');
  const hi = calculate('2F');
  assert.equal(lo.ok, true);
  assert.equal(hi.ok, true);
  assert.deepEqual(g1ToWorld, copied);
  assert.equal(JSON.stringify(source), original);
  assert.notDeepEqual(lo.plane, hi.plane);
});
