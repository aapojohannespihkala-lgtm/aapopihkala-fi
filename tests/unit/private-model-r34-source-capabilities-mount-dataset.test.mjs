import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { syncR31SourceCapabilityMountDataset } from '../../src/scripts/privateModelR31SourceCapabilityMountDataset.mjs';
import { r31ViewerSourceCapabilities } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { C80_R31_9E0B_SOURCE, C80_R33_SOURCE, C80_R34_SOURCE } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

const root = { name: 'mounted-source-scene' };
const mount = (canvas, scene, sha) =>
  syncR31SourceCapabilityMountDataset(canvas, scene, sha, r31ViewerSourceCapabilities);

test('R33 to R34 scene mount immediately updates accepted exact-SHA capability label', () => {
  const canvas = { dataset: { r31SourceCapabilities: 'stale', otherModelFlag: 'keep' } };
  assert.equal(mount(canvas, root, C80_R33_SOURCE.glbSha256), 'R33 3a226f98 (scene818)');
  assert.equal(mount(canvas, root, C80_R34_SOURCE.glbSha256), 'R34 99210ea5 (scene822)');
  assert.equal(canvas.dataset.r31SourceCapabilities, 'R34 99210ea5 (scene822)');
  assert.equal(canvas.dataset.otherModelFlag, 'keep');
  assert.equal(mount(canvas, root, C80_R34_SOURCE.glbSha256), 'R34 99210ea5 (scene822)');
});

test('mount-switch to R31, unknown SHA, null source, or empty view fails closed', () => {
  const canvas = { dataset: { r31SourceCapabilities: 'R34 99210ea5 (scene822)' } };
  assert.equal(mount(canvas, root, C80_R31_9E0B_SOURCE.glbSha256), 'R31 9e0bf34f (scene769)');
  assert.equal(mount(canvas, root, 'f'.repeat(64)), '');
  assert.equal(canvas.dataset.r31SourceCapabilities, '');
  assert.equal(mount(canvas, root, null), '');
  assert.equal(mount(canvas, null, C80_R34_SOURCE.glbSha256), '');
  assert.equal(canvas.dataset.r31SourceCapabilities, '');
});

test('missing lookup or dataset cannot inherit stale capability identity', () => {
  const canvas = { dataset: { r31SourceCapabilities: 'old' } };
  assert.equal(syncR31SourceCapabilityMountDataset(canvas, root, C80_R34_SOURCE.glbSha256, null), '');
  assert.equal(canvas.dataset.r31SourceCapabilities, '');
  assert.equal(syncR31SourceCapabilityMountDataset(null, root, C80_R34_SOURCE.glbSha256, r31ViewerSourceCapabilities), 'R34 99210ea5 (scene822)');
});

test('viewer source wires mount refresh after root replacement; presets use same identity sync', () => {
  const src = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(src, /if \(root\) modelRoot\.add\(root\);[\s\S]{0,200}r31SourceCapabilityMountHook\(\);/);
  assert.match(src, /r31SourceCapabilityMountHook = \(\) => syncR31SourceCapabilityMountDataset\(\s*canvas, modelRoot\.children\[0\] \?\? null, layersLoadedSha, r31ViewerSourceCapabilities/);
  assert.match(src, /if \(typeof r31SourceCapabilityMountHook === 'function'\) r31SourceCapabilityMountHook\(\);/);
  assert.equal((src.match(/r31SourceCapabilityMountHook\(\);/g) ?? []).length, 2);
});
