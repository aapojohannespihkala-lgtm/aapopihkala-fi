import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R300_OWNER_GLB_SHA256, R300_OWNER_CARD_REF,
  isR300OwnerCardNode, resolveR300OwnerCardSelection,
} from '../../src/scripts/privateModelR300OwnerCardAdapter.mjs';

const names = [
  'WHITE_CASING_ABOVE_OPEN_SERVICE_SPACE', 'LOWER_REAR_DARK_SERVICE_ZONE',
  'LOWER_FRONT_GALVANIZED_RAIL', 'LOWER_SIDE_SUPPORT_-1',
  'LOWER_SIDE_SUPPORT_1', 'TOP_DARK_18MM', 'FOOT_-1_-1',
  'FOOT_-1_1', 'FOOT_1_-1', 'FOOT_1_1',
];
const sceneNames = {
  759: 'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
  760: 'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760',
};
const mockJson = () => {
  const nodes = Array.from({ length: 13495 }, () => ({}));
  names.forEach((part, i) => {
    nodes[13415 + i] = { name: 'R300_OWNER_OPTION__H32_NIBE_R300_' + part + '_WORK_TEST', mesh: 4368 + i };
  });
  nodes[13487] = { name: 'R300_CASING_TURNED_180_TO_FACE_WC',
    children: Array.from({ length: 10 }, (_, i) => 13415 + i) };
  nodes[13488] = { name: 'NIBE_COMPACT_R300_FRONT_NORTH_WC_WORK_TEST_HOST_HOLD',
    children: [13487, 13429, 13430] };
  const scenes = Array.from({ length: 761 }, () => ({ name: 'other', nodes: [] }));
  for (const sceneIndex of [759, 760]) {
    scenes[sceneIndex] = { name: sceneNames[sceneIndex],
      nodes: [13488, ...Array.from({ length: sceneIndex === 759 ? 494 : 493 }, (_, i) => i)] };
  }
  return { scene: 292, scenes, nodes, meshes: Array.from({ length: 5165 }, () => ({})),
    asset: { extras: { ModelStage: 'WORK_TEST', current: false,
      asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } } };
};
const context = (json, sceneIndex, nodeIndex = 13415) => ({
  json, loadedGlbSha256: R300_OWNER_GLB_SHA256, sceneIndex, nodeIndex,
  meshIndex: 4368 + nodeIndex - 13415, sourcePath: [13488, 13487, nodeIndex],
});
const card = {
  id: R300_OWNER_CARD_REF, title: 'Authorized protected card',
  status: 'WORK_TEST / PROBABLE_ONLY',
  facts: [
    { label: 'Viimeinen dokumentoitu huolto', value: 'Ei tiedossa', kind: 'unverified', evidence: 'NOT_VERIFIED' },
    { label: 'Asennus', value: '2015 muutossuunnitelma', kind: 'plan', evidence: 'HISTORICAL_PLAN' },
  ],
  sources: [{ title: 'Protected source', url: 'https://drive.google.com/file/d/EXAMPLE/view',
    role: 'owner_photos', supports: [], limits: ['Ei as-built'] }],
  notes: ['Tilavuus ei tyyppikilvellä vahvistettu'], conflicts: [],
};
const provider = key => key === R300_OWNER_CARD_REF ? card : null;

test('10 exact device leaves in both normal and service scenes use one protected card', () => {
  const json = mockJson();
  for (const sceneIndex of [759, 760]) for (let nodeIndex = 13415; nodeIndex <= 13424; nodeIndex++) {
    const selected = context(json, sceneIndex, nodeIndex);
    assert.equal(isR300OwnerCardNode(selected), true);
    const result = resolveR300OwnerCardSelection(selected, provider);
    assert.equal(result.state, 'matched');
    assert.equal(result.cards[0], card);
    assert.equal(result.cards[0].facts[0].value, 'Ei tiedossa');
  }
});

test('wrong SHA, scene, stale roots or claimed current state fail closed', () => {
  const json = mockJson(), selected = context(json, 759);
  assert.equal(resolveR300OwnerCardSelection({ ...selected, loadedGlbSha256: '0'.repeat(64) }, provider).state, 'mismatch');
  assert.equal(resolveR300OwnerCardSelection({ ...selected, sceneIndex: 769 }, provider).state, 'unbound');
  const duplicate = mockJson(); duplicate.scenes[759].nodes.push(13488);
  assert.equal(isR300OwnerCardNode(context(duplicate, 759)), false);
  const current = mockJson(); current.asset.extras.current = true;
  assert.equal(isR300OwnerCardNode(context(current, 760)), false);
});

test('wrong parent or mesh and copper/plexi/wall nodes are not card owners', () => {
  const json = mockJson(), selected = context(json, 759);
  assert.equal(isR300OwnerCardNode({ ...selected, meshIndex: 4424 }), false);
  assert.equal(isR300OwnerCardNode({ ...selected, sourcePath: [13488, 13429, 13415] }), false);
  assert.equal(isR300OwnerCardNode({ ...selected, sourcePath: [13488, 13415] }), false);
  for (const n of [13429, 13430, 13492, 13493, 13494, 11625, 5887, 5888, 12437]) {
    assert.equal(isR300OwnerCardNode(context(json, 759, n)), false);
  }
  const wrongParent = mockJson(); wrongParent.nodes[13487].children[0] = 13430;
  assert.equal(isR300OwnerCardNode(context(wrongParent, 759)), false);
});

test('missing or untrusted protected source never substitutes public owner facts', () => {
  const selected = context(mockJson(), 760);
  assert.equal(resolveR300OwnerCardSelection(selected, () => null).state, 'unavailable');
  assert.equal(resolveR300OwnerCardSelection(selected,
    () => ({ ...card, id: 'WRONG' })).state, 'unavailable');
  assert.equal(resolveR300OwnerCardSelection(selected,
    () => ({ ...card, sources: [{ ...card.sources[0], url: 'https://evil.example/photo' }] })).state, 'unavailable');
});
