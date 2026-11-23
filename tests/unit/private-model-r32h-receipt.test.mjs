import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  C80_R32H_SOURCE, C80_R32H_VIEWS, C80_R32H_WORK_TEST_ID, C80_R31_9E0B_SOURCE,
  isC80R32HSceneSource, isR31FamilyViewerSha, r31ViewerLayerSceneReceipt, r31ViewerLayerBindingScope,
  r31WorkTestReview, C80_R31_REVIEW_ROLES,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { r31ViewerSourceCapabilities, r31RuntimeExteriorAllowed } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';

// Real scene root lists of the R32H GLB (c26d99c1), extracted from the original file.
const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-r32h-scene-roots.json', import.meta.url), 'utf8'));
const SHA = C80_R32H_SOURCE.glbSha256;
function json() {
  const c = fixture.counts;
  const scenes = Array.from({ length: c.scenes }, () => ({ name: 'x', nodes: [] }));
  for (const [i, s] of Object.entries(fixture.scenes)) scenes[Number(i)] = { name: s.name, nodes: [...s.nodes], extras: { current: false, asBuilt: false } };
  const arr = (n) => Array.from({ length: n }, () => ({}));
  return { asset: { extras: { ...fixture.asset } }, scene: fixture.defaultScene, scenes, nodes: arr(c.nodes), meshes: arr(c.meshes),
    materials: arr(c.materials), accessors: arr(c.accessors), bufferViews: arr(c.bufferViews) };
}

test('R32H fixture matches the source descriptor', () => {
  assert.equal(SHA, 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c');
  assert.deepEqual(fixture.counts, { scenes: 818, nodes: 13840, meshes: 5237, materials: 824, accessors: 11427, bufferViews: 11433 });
  for (const v of Object.values(C80_R32H_VIEWS)) assert.equal(fixture.scenes[v.sceneIndex].name, v.name);
});

test('every R32H view passes its exact gate and binds a layer scope', () => {
  const j = json();
  for (const v of Object.values(C80_R32H_VIEWS)) {
    assert.equal(isC80R32HSceneSource(j, SHA, v.sceneIndex, v.role, v.floor), true, v.role);
    assert.deepEqual({ ...r31ViewerLayerSceneReceipt(j, SHA, v.sceneIndex) }, { sourceSha256: SHA, sceneIndex: v.sceneIndex, role: v.role, floor: v.floor });
    assert.deepEqual({ ...r31ViewerLayerBindingScope(j, SHA, v.sceneIndex) }, { area: 'D', floor: v.floor });
    assert.ok(C80_R31_REVIEW_ROLES[v.role]);
  }
  // Old R32 scenes in the same GLB are not views.
  assert.equal(r31ViewerLayerSceneReceipt(j, SHA, 812), null);
});

test('R32H gate fails closed', () => {
  const v = C80_R32H_VIEWS.dNormal;
  assert.equal(isC80R32HSceneSource(json(), C80_R31_9E0B_SOURCE.glbSha256, v.sceneIndex, v.role, v.floor), false);
  const swapBack = json(); swapBack.scenes[814].nodes[swapBack.scenes[814].nodes.indexOf(13813)] = 13507;
  assert.equal(isC80R32HSceneSource(swapBack, SHA, 814, v.role, 'BOTH'), false);
  const noP6 = json(); noP6.scenes[814].nodes = noP6.scenes[814].nodes.filter((n) => n !== 7583);
  assert.equal(isC80R32HSceneSource(noP6, SHA, 814, v.role, 'BOTH'), false);
  const plexi = json(); plexi.scenes[815].nodes.push(11625);
  assert.equal(isC80R32HSceneSource(plexi, SHA, 815, C80_R32H_VIEWS.dService.role, 'BOTH'), false);
  const current = json(); current.asset.extras.current = true;
  assert.equal(isC80R32HSceneSource(current, SHA, 814, v.role, 'BOTH'), false);
  const count = json(); count.nodes.push({});
  assert.equal(isC80R32HSceneSource(count, SHA, 814, v.role, 'BOTH'), false);
  assert.equal(isC80R32HSceneSource(json(), SHA, 814, v.role, '2F'), false);
});

test('R32H candidate, R31-family SHA and capabilities', () => {
  const review = r31WorkTestReview({ id: C80_R32H_WORK_TEST_ID, path: `/private-model/work-test/${C80_R32H_WORK_TEST_ID}.glb` });
  assert.equal(review.source, C80_R32H_SOURCE);
  assert.deepEqual(Object.keys(review.views), ['dNormal', 'dService', 'upperNormal', 'upperService']);
  assert.throws(() => r31WorkTestReview({ id: C80_R32H_WORK_TEST_ID, path: '/elsewhere.glb' }));
  assert.equal(isR31FamilyViewerSha(SHA), true);
  assert.equal(isR31FamilyViewerSha(C80_R31_9E0B_SOURCE.glbSha256), true);
  assert.equal(isR31FamilyViewerSha('29114e10fe7de711fba1465b8b1fb310b9433893f02f189b477f7d3536dbc97d'), false);
  const caps = r31ViewerSourceCapabilities(SHA);
  assert.equal(caps.siteNetworks, true);
  for (const key of ['eastGable', 'gableBoarding', 'rainwater', 'carport']) assert.equal(r31RuntimeExteriorAllowed(caps, key), false, key);
  assert.equal(r31RuntimeExteriorAllowed(caps, 'fiberBox'), true);
});

test('worker allowlist pins the R32H GLB bytes and the viewer uses the family gate', () => {
  const worker = readFileSync(new URL('../../worker/privateWorkTest.ts', import.meta.url), 'utf8');
  assert.match(worker, /id: 'c80-r32h-c26d99c1-d-2f-sc814-sc817-work-test'[\s\S]{0,400}expectedSize: 64_668_060,\s*expectedSha256: 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c'/);
  assert.match(worker, /\n  C80_R32H_C26D_WORK_TEST_CANDIDATE,\n/);
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /isR31FamilyViewerSha\(layersLoadedSha\) && r300ViewSwitch && floor !== '1F'/);
  assert.match(page, /const r31SceneScope = isR31FamilyViewerSha\(layersLoadedSha\)/);
  assert.match(page, /if \(r31ExteriorAllowed\('gableBoarding'\)\) \{/);
  assert.match(page, /if \(r31ExteriorAllowed\('fiberBox'\)\) \{/);
});
