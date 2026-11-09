import test from 'node:test';
import assert from 'node:assert/strict';
import { selectionSourceLinks } from '../../src/scripts/privateModelSelectionMetadata.ts';

const V89 = '718163b76b46aee51193e059c5790d0e22c84a364d82d8d58bc2084776902a2c';
const hot = '1AwU2CHmVnnL4fPoBzBBMkLTU8ppurS3V';
const waste = '1k9fRDgKfu2mINDru0uqv6C5eVZ0-9kce';
const hotUrl = `https://drive.google.com/file/d/${hot}/view`;
const wasteUrl = `https://drive.google.com/file/d/${waste}/view`;

const h23Root = () => ({
  H23: true,
  sourceV89GLBSHA256: V89,
  sourcePhotos: [hot, waste],
  canonical: false,
  asBuilt: false,
  modelScope: 'WORK_TEST/HOST_HOLD',
  v90IntegratedFrom: { task: 'H23', donorNode: 11391 },
});

test('V90 H23 root exposes both exact 2026 photos without inventing model source links', () => {
  assert.deepEqual(selectionSourceLinks({ userData: h23Root() }, null), [
    {
      link: hotUrl,
      label: 'H23 PA2 - 2026 sulkuventtiilit ja letkut (WORK_TEST)',
    },
    {
      link: wasteUrl,
      label: 'H23 PA2 - 2026 vesilukko ja poimuletkut (WORK_TEST)',
    },
  ]);
});

test('H23 child sourceLinks remain authoritative, root evidence is deduplicated', () => {
  const root = { userData: h23Root() };
  const child = { parent: root, userData: {
    sourceLinks: [
      { url: hotUrl, role: '2026 photo valves/hoses' },
      { url: wasteUrl, role: '2026 photo trap/drain/hoses' },
      { url: 'https://docs.google.com/document/d/2015-KVV/edit', role: '2015 KVV schedule' },
    ],
  }};
  assert.deepEqual(selectionSourceLinks(child, null), [
    { link: hotUrl, label: '2026 photo valves/hoses' },
    { link: wasteUrl, label: '2026 photo trap/drain/hoses' },
    { link: 'https://docs.google.com/document/d/2015-KVV/edit', label: '2015 KVV schedule' },
  ]);
  assert.deepEqual(selectionSourceLinks(child, root), [
    { link: hotUrl, label: '2026 photo valves/hoses' },
    { link: wasteUrl, label: '2026 photo trap/drain/hoses' },
    { link: 'https://docs.google.com/document/d/2015-KVV/edit', label: '2015 KVV schedule' },
  ]);
});

test('H23 root fallback fails closed for other donor, wrong photos or model status', () => {
  for (const change of [
    { v90IntegratedFrom: { task: 'H22', donorNode: 11391 } },
    { v90IntegratedFrom: { task: 'H23', donorNode: 11368 } },
    { sourcePhotos: [hot, 'attacker-id'] },
    { sourcePhotos: [waste, hot] },
    { sourcePhotos: [hot] },
    { sourceV89GLBSHA256: 'other-source' },
    { modelScope: 'CURRENT' },
    { canonical: true },
    { asBuilt: true },
    { H23: false },
  ]) {
    assert.deepEqual(selectionSourceLinks({ userData: { ...h23Root(), ...change } }, null), []);
  }
});

test('only the 8-level selected-node ancestor chain is eligible', () => {
  let node = { userData: h23Root(), parent: null };
  for (let i = 0; i < 8; i++) node = { userData: {}, parent: node };
  assert.deepEqual(selectionSourceLinks(node, null), []);
});
