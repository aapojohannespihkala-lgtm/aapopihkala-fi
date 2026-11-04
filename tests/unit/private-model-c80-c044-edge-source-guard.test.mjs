import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldSuppressC044CoplanarTJunctions as applies } from '../../src/scripts/privateModelC80C044EdgeSourceGuard.mjs';
const V69_SOURCE_SHA256 = '5b720c9b9f87358867463e725b1500c63bafd9de15d121cdf6c36a3e23ca36fd';

const exact = { loadedSha: V69_SOURCE_SHA256, expectedSha: V69_SOURCE_SHA256, v69SourceSha: V69_SOURCE_SHA256 };
test('V69 exact source permits selective T-junction suppression only in 2F and BOTH', () => {
  assert.equal(applies({ ...exact, preset: 'd-2f' }), true);
  assert.equal(applies({ ...exact, preset: 'd-apartment' }), true);
  for (const preset of ['d-1f', 'whole-building', 'site', 'infra', '']) {
    assert.equal(applies({ ...exact, preset }), false);
  }
});
test('guard fails closed without two verified exact V69 SHA values', () => {
  for (const values of [
    {loadedSha:'bad', expectedSha: V69_SOURCE_SHA256},
    {loadedSha: V69_SOURCE_SHA256, expectedSha:'bad'},
    {loadedSha:null,expectedSha: V69_SOURCE_SHA256},
    {loadedSha:V69_SOURCE_SHA256,expectedSha:null},
    {loadedSha:'48116fd649c1100dcc1054170d0b32e94408c0c040af32d5a4a37b6e75dd7d90', expectedSha:'48116fd649c1100dcc1054170d0b32e94408c0c040af32d5a4a37b6e75dd7d90'},
    {loadedSha:null,expectedSha:null},
  ]) assert.equal(applies({...exact,...values,preset:'d-2f'}), false);
});
test('HI20 unchanged, 1F and manual none/object unaffected', () => {
  assert.equal(applies({hi20Verified:true,preset:'d-2f'}), true);
  assert.equal(applies({hi20Verified:true,preset:'d-apartment'}), true);
  assert.equal(applies({hi20Verified:true,preset:'d-1f'}), false);
  assert.equal(applies({hi20Verified:false,preset:'d-2f'}), false);
});
