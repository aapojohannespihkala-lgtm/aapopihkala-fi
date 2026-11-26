import test from 'node:test';
import assert from 'node:assert/strict';
import { technicalReviewWaterLineOf, refineTechnicalReviewSystem } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

// Minimal parent chain like THREE.Object3D: [leaf, ..., top] names under a root.
const chain = (...names) => {
  const root = { name: 'ROOT', parent: null };
  let parent = root, leaf = null;
  for (const name of [...names].reverse()) { leaf = { name, parent }; parent = leaf; }
  return { leaf, root };
};

test('hot-water builder names get VESI_LV, cold and mixed stay VESI', () => {
  const cases = [
    [['P02_PA1_HOT_FLEX_TO_MIXER_WORK_TEST', 'P02_2F_LV_KYTKENNAT_WORK_TEST', 'P02_2F_KV_LV_CONNECTIONS_WORK_TEST_ROOT'], 'VESI_LV'],
    [['P02_NIBE25_MIXED_HOT_GROUP_PROXY_BODY_WORK_TEST'], 'VESI_LV'],
    [['MESH_7', 'P02_2F_LV_KYTKENNAT_WORK_TEST', 'P02_2F_KV_LV_CONNECTIONS_WORK_TEST_ROOT'], 'VESI_LV'],
    [['P02_PA1_COLD_FLEX_TO_MIXER_WORK_TEST', 'P02_2F_KV_KYTKENNAT_WORK_TEST'], 'VESI'],
    [['C80_518_KV2017_A_RISER_2017PLAN_WORK_TEST_1F_WITH_VM20_AND_VALVE'], 'VESI'],
    // Both temperatures in one mesh: no guess.
    [['V89_KV2017_D2F_KITCHEN_SINK_KV_LV_RISERS_THROUGH_FLOOR'], 'VESI'],
    // Provenance suffix is not a temperature; the real token decides.
    [['PA2_1F_HOT_REAL_MESH_JOINT_20261114_WORK_TEST_HOT_COLD_CLEARANCE_428_COW'], 'VESI_LV'],
    [['D1F_VM20_NEW_METER_BODY'], 'VESI'],
    // Words merely containing the letters are not tokens.
    [['SLV_VALVE', 'SHOTGUN'], 'VESI'],
  ];
  for (const [names, expected] of cases) {
    const { leaf, root } = chain(...names);
    assert.equal(technicalReviewWaterLineOf(leaf, root), expected, names[0]);
  }
});

test('only VESI is refined; other systems and null pass through', () => {
  const { leaf, root } = chain('P02_PA1_HOT_STOP_BODY_WORK_TEST');
  assert.equal(refineTechnicalReviewSystem('VESI', leaf, root), 'VESI_LV');
  for (const system of ['SAHKO', 'IV', 'VIEMARI', null]) assert.equal(refineTechnicalReviewSystem(system, leaf, root), system);
});

test('viewer palette has a separate hot-water color and uses the refinement', async () => {
  const { readFileSync } = await import('node:fs');
  const index = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.ok(index.includes("['VESI', 0x1e88e5], ['VESI_LV', 0xe53935]"));
  assert.ok(index.includes('refineTechnicalReviewSystem(technicalReviewSystemOf(object, root) ?? technicalReviewLayerSystemOf(object, root, layerIdByRoot), object, root)'));
});
