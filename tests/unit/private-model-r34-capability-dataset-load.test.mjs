import assert from 'node:assert/strict';
import test from 'node:test';
import { Script } from 'node:vm';
import { readFileSync } from 'node:fs';
import { r31ViewerSourceCapabilities } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { C80_R33_SOURCE, C80_R34_SOURCE, r32hFamilyOf, r31ViewerLayerSceneReceipt } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

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

test('same mounted dataset follows R33/R34 receipts and clears invalid sources without preset', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const start = page.indexOf('onLayersModelLoaded = (gltf, session) => {');
  const finish = page.indexOf('onLayersStandardPreset = preset => {', start);
  assert.ok(start >= 0 && finish > start);
  const handler = page.slice(start, finish);
  const receiptCode = handler.match(/const r31LayerReceiptScene =[^;]+;\s*const verifiedR31LayerSource =[^;]+;/)?.[0];
  const datasetCode = handler.match(/canvas\.dataset\.r31SourceCapabilities =[^;]+;/)?.[0];
  assert.ok(receiptCode && datasetCode, 'extract actual mounted receipt and dataset statements');
  const mount = new Script(receiptCode + '\n' + datasetCode);
  function json(version) {
    const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-' + version + '-scene-roots.json', import.meta.url), 'utf8'));
    const c = fixture.counts;
    const scenes = Array.from({ length: c.scenes }, () => ({ name: 'x', nodes: [] }));
    for (const [i, s] of Object.entries(fixture.scenes)) scenes[Number(i)] = { name: s.name, nodes: [...s.nodes], extras: { current: false, asBuilt: false } };
    const arr = n => Array.from({ length: n }, () => ({}));
    return { asset: { extras: { ...fixture.asset } }, scene: fixture.defaultScene, scenes, nodes: arr(c.nodes), meshes: arr(c.meshes),
      materials: arr(c.materials), accessors: arr(c.accessors), bufferViews: arr(c.bufferViews) };
  }
  const canvas = { dataset: {} };
  const r33 = json('r33'), r34 = json('r34');
  const sha33 = C80_R33_SOURCE.glbSha256, sha34 = C80_R34_SOURCE.glbSha256;
  function check(source, sha, expected) {
    mount.runInNewContext({ canvas, gltf: { parser: { json: source } }, layersLoadedSha: sha,
      r32hFamilyOf, r31ViewerLayerSceneReceipt, r31ViewerSourceCapabilities });
    assert.equal(canvas.dataset.r31SourceCapabilities, expected);
  }
  check(r33, sha33, 'R33 3a226f98 (scene818)');
  check(r34, sha34, 'R34 99210ea5 (scene822)');
  check(r33, sha33, 'R33 3a226f98 (scene818)');
  check(r33, sha34, ''); // known SHA, wrong scene/count receipt
  check(r34, sha34, 'R34 99210ea5 (scene822)');
  check(r34, 'f'.repeat(64), '');
  check(r34, sha34, 'R34 99210ea5 (scene822)');
  const missing = json('r34');
  missing.scenes[822].nodes = missing.scenes[822].nodes.filter(n => n !== 13853);
  check(missing, sha34, '');
  check(r34, sha34, 'R34 99210ea5 (scene822)');
  check(undefined, sha34, '');
});
