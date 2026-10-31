import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldApplyC044SeamlessEdgeDefault as should } from '../../src/scripts/privateModelHi20C044EdgePreset.mjs';

const state = (preset, edgeMode, override=false, verified=true) => ({
  sourceVerified: verified, preset, edgeMode, edgeModeManuallySelected: override,
});

test('C80-044 applies after other preset consumed one-shot defaults', () => {
  assert.equal(should(state('whole-building', 'visible')), false);
  assert.equal(should(state('d-1f', 'visible')), false);
  assert.equal(should(state('d-2f', 'visible')), true);
  assert.equal(should(state('d-apartment', 'unified')), true);
  assert.equal(should(state('d-apartment', 'object')), true);
});

test('C80-044 preserves explicit user manual edge selection', () => {
  assert.equal(should(state('d-2f', 'visible', true)), false);
  assert.equal(should(state('d-apartment', 'object', true)), false);
  assert.equal(should(state('d-2f', 'none', true)), false);
  assert.equal(should(state('d-2f', 'none')), false);
});

test('C80-044 cannot affect C70, unverified sources or other presets', () => {
  assert.equal(should(state('d-2f', 'visible', false, false)), false);
  assert.equal(should(state('d-apartment', 'visible', false, false)), false);
  assert.equal(should(state('whole-building', 'visible')), false);
  assert.equal(should(state('d-1f', 'visible')), false);
  assert.equal(should(state('site', 'visible')), false);
  assert.equal(should(state('d-2f', 'INVALID')), false);
});
