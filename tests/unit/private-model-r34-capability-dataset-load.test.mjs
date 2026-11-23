import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { r31ViewerSourceCapabilities } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { C80_R33_SOURCE, C80_R34_SOURCE } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

test('R33 to R34 selects each independently authenticated exact-SHA capability label', () => {
  const r33 = r31ViewerSourceCapabilities(C80_R33_SOURCE.glbSha256);
  const r34 = r31ViewerSourceCapabilities(C80_R34_SOURCE.glbSha256);
  assert.equal(r33?.label, 'R33 3a226f98 (scene818)');
  assert.equal(r34?.label, 'R34 99210ea5 (scene822)');
  assert.notEqual(r33.label, r34.label);
  assert.equal(r33.siteNetworks, true);
  assert.equal(r34.siteNetworks, true);
  for (const key of ['eastGable', 'gableBoarding', 'rainwater', 'carport']) {
    assert.equal(r34.runtimeExterior[key], false, key);
  }
  assert.equal(r31ViewerSourceCapabilities('f'.repeat(64)), null);
});

test('model receipt immediately replaces or clears the capability dataset before a preset is clicked', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const start = page.indexOf('onLayersModelLoaded = (gltf, session) => {');
  const finish = page.indexOf('onLayersStandardPreset = preset => {', start);
  assert.ok(start >= 0 && finish > start, 'locate model receipt handler');
  const handler = page.slice(start, finish);
  const shaSet = handler.indexOf('layersLoadedSha = loadedModelSha256(gltf);');
  const receipt = handler.indexOf('const verifiedR31LayerSource =');
  const dataset = handler.indexOf('canvas.dataset.r31SourceCapabilities =');
  assert.ok(shaSet >= 0 && receipt > shaSet && dataset > receipt, 'SHA and source receipt precede dataset refresh');
  assert.match(handler.slice(dataset, dataset + 190),
    /canvas\.dataset\.r31SourceCapabilities = verifiedR31LayerSource\s*\? \(r31ViewerSourceCapabilities\(layersLoadedSha\)\?\.label \?\? ''\)\s*: '';/);
  assert.match(handler, /r31ViewerLayerSceneReceipt\(/);
  assert.doesNotMatch(handler.slice(dataset, dataset + 190), /applyStandardViewPreset|r31SyncExteriorDonors/);
});
