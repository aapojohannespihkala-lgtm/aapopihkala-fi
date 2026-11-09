import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { boxInterval, distanceToBoxSurface, evaluateH37Precheck } from './h37-host-guard.mjs';

const host = { id: 'wall', solidVerified: true, min: [0, 0, 0], max: [0.2, 4, 3] };
const room = { id: 'room', min: [0.2, 0, 0], max: [4, 4, 3] };
const fixture = (kind, centerline, extras = {}) => ({
  coordinateSystem: 'GLB_WORLD', units: 'm', hosts: [host], rooms: [room],
  segments: [{ id: 'segment', kind, centerline }], ...extras,
});

test('AABB solid slab intersection is exact on a crossing segment', () => {
  assert.deepEqual(boxInterval([-1, 1, 1], [1, 1, 1], host), [0.5, 0.6]);
  assert.equal(boxInterval([-1, 8, 1], [1, 8, 1], host), null);
});

test('surface distance distinguishes deep interior from near-wall attachment', () => {
  assert.equal(distanceToBoxSurface([0.1, 1, 1], host), 0.1);
  assert.equal(distanceToBoxSurface([0.4, 1, 1], host), 0.2);
});

test('pipe anchored 5cm from wall and outside room returns precheck-only pass', () => {
  const r = evaluateH37Precheck(fixture('pipe', [[0.25, 0.4, 1], [0.25, 3.6, 1]],
    { rooms: [{ id: 'room', min: [0.4, 0, 0], max: [4, 4, 3] }] }));
  assert.equal(r.status, 'PRECHECK_PASS_NOT_RELEASE');
  assert.equal(r.fullGlbVerification, false);
});

test('pipe leijuu 0.2m from nearest wall surface -> FAIL', () => {
  const r = evaluateH37Precheck(fixture('pipe', [[0.4, 0.5, 1], [0.4, 3.5, 1]]));
  assert(r.results[0].reasons.includes('AWAY_FROM_HOST'));
  assert.equal(r.status, 'FAIL');
});

test('pipe grazing wall but traversing declared room -> FAIL', () => {
  const r = evaluateH37Precheck(fixture('pipe', [[0.25, 0.5, 1], [0.25, 3, 1]]));
  assert(r.results[0].reasons.includes('UNHOSTED_ROOM_TRAVERSAL'));
});

test('cable completely inside solid wall -> PRECHECK only', () => {
  const r = evaluateH37Precheck(fixture('cable', [[0.1, 0.4, 1], [0.1, 3.6, 1]]));
  assert.equal(r.status, 'PRECHECK_PASS_NOT_RELEASE');
});

test('cable leaves one host and travels through unsupported gap -> FAIL', () => {
  const r = evaluateH37Precheck(fixture('cable', [[0.1, 1, 1], [0.4, 1, 1]]));
  assert(r.results[0].reasons.includes('CABLE_OUTSIDE_SOLID_HOST'));
});

test('two contiguous solids jointly cover a routed cable', () => {
  const h2 = { id: 'wall-extension', solidVerified: true, min: [0.2, 0, 0], max: [0.5, 4, 3] };
  const r = evaluateH37Precheck(fixture('cable', [[0.1, 1, 1], [0.4, 1, 1]],
    {hosts: [host, h2]}));
  assert.equal(r.status, 'PRECHECK_PASS_NOT_RELEASE');
});

test('invalid or unverifiable host inputs must never become pass', () => {
  assert.throws(() => evaluateH37Precheck(fixture('pipe', [[0, 1, 1], [0, 2, 1]],
    { hosts: [{...host, solidVerified:false}] })), /solidVerified/);
  assert.throws(() => evaluateH37Precheck(fixture('pipe', [[0, 1, 1], [0, NaN, 1]])), /finite/);
  assert.throws(() => evaluateH37Precheck(fixture('pipe', [[0, 1, 1], [0, 2, 1]],
    { rooms: [] })), /room volume/);
  assert.throws(() => evaluateH37Precheck(fixture('pipe', [[0, 1, 1], [0, 2, 1]],
    { coordinateSystem: 'G3_P02' })), /GLB_WORLD/);
});

test('very short pipe still checks entire length', () => {
  const r = evaluateH37Precheck(fixture('pipe', [[0.27, 1.0, 1], [0.27, 1.001, 1]],
    { rooms: [{id:'room', min:[0.3,0,0],max:[4,4,3]}] }));
  assert.equal(r.status, 'PRECHECK_PASS_NOT_RELEASE');
});
