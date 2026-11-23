import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldInvalidateModelSelection } from '../../src/scripts/privateModelSceneSelectionInvalidation.mjs';
import { sourceLinksForSelectionEvidence } from '../../src/scripts/privateModelSourceCardLinkGuard.mjs';

const selected = { name: 'donor ROOM3 door', nodeIndex: 12144 };
const originalRoot = { name: '2F scene 460', sha: '94727a3c', node12144: 'door' };
const nextRoot = { name: 'BOTH scene 461', sha: '94727a3c', node12144: 'door' };
const reusedIndexRoot = { name: '2F scene 429', sha: 'ed91f792', node12144: 'V84 wall' };

test('same scene root and camera change retain selected object', () => {
  assert.equal(shouldInvalidateModelSelection({ mountedRoot: originalRoot, nextRoot: originalRoot, selectedObject: selected }), false);
});
test('2F to BOTH root swap invalidates the object source card', () => {
  assert.equal(shouldInvalidateModelSelection({ mountedRoot: originalRoot, nextRoot, selectedObject: selected }), true);
});
test('different GLB SHA with reused numeric nodeIndex cannot retain source card', () => {
  assert.equal(selected.nodeIndex, 12144);
  assert.equal(shouldInvalidateModelSelection({ mountedRoot: originalRoot, nextRoot: reusedIndexRoot, selectedObject: selected }), true);
});
test('changing root with no selected object needs no redundant reset', () => {
  assert.equal(shouldInvalidateModelSelection({ mountedRoot: originalRoot, nextRoot, selectedObject: null }), false);
});
test('unmounting selected scene clears its selection and source card', () => {
  assert.equal(shouldInvalidateModelSelection({ mountedRoot: originalRoot, nextRoot: null, selectedObject: selected }), true);
});
test('viewer calls guard and clears selection before the stale scene is removed', () => {
  const source = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(source, /privateModelSceneSelectionInvalidation/);
  const start = source.indexOf('const setModelScene = (root: any) => {');
  const end = source.indexOf('const restoreDReviewStyling =', start);
  assert.ok(start > 0 && end > start);
  const mount = source.slice(start, end);
  assert.match(mount, /shouldInvalidateModelSelection\(\{[\s\S]*?selectedObject,[\s\S]*?\}\)\) clearSelection\(\);/);
  assert.ok(mount.indexOf('clearSelection();') < mount.indexOf('modelRoot.clear();'));
});

test('cross-SHA stale links are hidden when card identity mismatches, even for reused node IDs', () => {
  for (const nodeIndex of [12144, 12145, 12158]) {
    const links = [{ link: 'https://drive.google.com/file/d/donor/view', label: 'ROOM3 donor ' + nodeIndex }];
    const sourceEvidence = {
      state: 'mismatch',
      version: 'GLB ed91f792 / scene 429',
      reason: 'CROSS_SHA_OR_UNVERIFIED_SOURCE',
      cards: [],
    };
    assert.deepEqual(sourceLinksForSelectionEvidence(sourceEvidence, links), []);
    assert.equal(links.length, 1, 'the source data stays immutable');
  }
});

test('ordinary source links survive only non-mismatch card states', () => {
  const links = [{ link: 'https://docs.google.com/document/d/source', label: '2015 source' }];
  for (const state of ['matched', 'unbound', 'unavailable']) {
    assert.strictEqual(sourceLinksForSelectionEvidence({ state }, links), links);
  }
  assert.deepEqual(sourceLinksForSelectionEvidence({ state: 'mismatch' }, null), []);
});

test('viewer uses one source-card outcome for both link suppression and card rendering', () => {
  const source = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(source, /privateModelSourceCardLinkGuard\.mjs/);
  const start = source.indexOf('const selectObject = (object: any) => {');
  const end = source.indexOf('const isolateSelectedObject =', start);
  assert.ok(start > 0 && end > start);
  const select = source.slice(start, end);
  assert.match(select, /const sourceEvidence = resolveSelectionSources\(object\);/);
  assert.match(select, /const effectiveSourceEvidence = r300OwnerEvidence \?\? sourceEvidence;/);
  assert.match(select, /sourceLinks: sourceLinksForSelectionEvidence\(effectiveSourceEvidence, collectSelectionSourceLinks\(object, modelRoot\)\),/);
  assert.match(select, /sourceEvidence: effectiveSourceEvidence,/);
  assert.ok(select.indexOf('const sourceEvidence =') < select.indexOf('selectionPanelController.render('));
});
