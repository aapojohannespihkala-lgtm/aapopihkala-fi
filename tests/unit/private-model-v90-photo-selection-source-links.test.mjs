import test from 'node:test';
import assert from 'node:assert/strict';
import { selectionSourceLinks } from '../../src/scripts/privateModelSelectionMetadata.ts';

const H21 = 'https://drive.google.com/file/d/1a16hN0pssODwrhazkkyXPzIQf2yeXP7-/view';
const H22 = 'https://drive.google.com/file/d/1BmfFwt2R1OzEYzWQPP31CjSpeybxi9uO/view';

test('V90 H21 selected copper pipe exposes the verified 2026 WC photo ZIP once', () => {
  const root = { userData: {
    v90IntegratedFrom: { task: 'H21' },
    '2026PhotoZip': '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-',
  }};
  const child = { parent: root, userData: {
    v90IntegratedFrom: { task: 'H21' },
    photoSourceDriveId: '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-',
  }};
  assert.deepEqual(selectionSourceLinks(child, null), [{
    link: H21,
    label: 'H21 - vuoden 2026 WC-valokuvat (WORK_TEST)',
  }]);
});

test('V90 H22 1F and BOTH pipe instances expose the verified kitchen photo', () => {
  for (const node of [11399, 11400, 11401, 11402]) {
    const object = { userData: {
      v90IntegratedFrom: { task: 'H22', donorNode: node },
      sourcePhoto: '1BmfFwt2R1OzEYzWQPP31CjSpeybxi9uO',
    }};
    assert.deepEqual(selectionSourceLinks(object, null), [{
      link: H22,
      label: 'H22 - vuoden 2026 keittio kuva (WORK_TEST)',
    }]);
  }
});

test('V90 photo fallback is closed for other tasks and unverified IDs', () => {
  for (const data of [
    { photoSourceDriveId: '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-' },
    { v90IntegratedFrom: { task: 'H24' }, photoSourceDriveId: '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-' },
    { v90IntegratedFrom: { task: 'H21' }, photoSourceDriveId: 'attacker-file-id' },
    { v90IntegratedFrom: { task: 'H22' }, sourcePhoto: 'https://evil.example/redirect' },
  ]) assert.deepEqual(selectionSourceLinks({ userData: data }, null), []);
});

test('existing sourceLinks link/url evidence and allowlist stay unchanged', () => {
  const canonical = 'https://docs.google.com/document/d/canonical/edit';
  const legacy = 'https://drive.google.com/file/d/legacy/view';
  const actual = selectionSourceLinks({ userData: {
    sourceLinks: [
      { link: canonical, role: 'primary', supports: 'plan' },
      { url: legacy, role: '2026 photo' },
      { url: 'https://evil.example/not-allowed', role: 'untrusted' },
    ],
  }}, null);
  assert.deepEqual(actual, [
    { link: canonical, label: 'primary · plan' },
    { link: legacy, label: '2026 photo' },
  ]);
});
