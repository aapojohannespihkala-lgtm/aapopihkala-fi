import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldInvalidateModelSelection } from '../../src/scripts/privateModelSceneSelectionInvalidation.mjs';

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
