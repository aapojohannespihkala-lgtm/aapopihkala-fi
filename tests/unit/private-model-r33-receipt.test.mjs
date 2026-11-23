import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  C80_R33_SOURCE, C80_R33_VIEWS, C80_R33_WORK_TEST_ID, C80_R32H_SOURCE, C80_R32H_VIEWS,
  isC80R32HSceneSource, isR31FamilyViewerSha, isR32HFamilySha, r32hFamilyOf,
  r31ViewerLayerSceneReceipt, r31ViewerLayerBindingScope, r31WorkTestReview, C80_R31_REVIEW_ROLES,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { r31ViewerSourceCapabilities, r31RuntimeExteriorAllowed } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { c80R31TechnicalReviewNodeSet, C80_R32H_ROOFWATER_REVIEW_ROOTS, C80_R31_TECHNICAL_REVIEW_ADDITIONS } from '../../src/scripts/privateModelC80R31TechnicalReview.mjs';

// Real scene root lists of the R33 GLB (3a226f98), extracted from the original file.
const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8'));
const SHA = C80_R33_SOURCE.glbSha256;
function json() {
  const c = fixture.counts;
  const scenes = Array.from({ length: c.scenes }, () => ({ name: 'x', nodes: [] }));
  for (const [i, s] of Object.entries(fixture.scenes)) scenes[Number(i)] = { name: s.name, nodes: [...s.nodes], extras: { current: false, asBuilt: false } };
  const arr = (n) => Array.from({ length: n }, () => ({}));
  return { asset: { extras: { ...fixture.asset } }, scene: fixture.defaultScene, scenes, nodes: arr(c.nodes), meshes: arr(c.meshes),
    materials: arr(c.materials), accessors: arr(c.accessors), bufferViews: arr(c.bufferViews) };
}

test('R33 fixture matches the source descriptor (append-only on R32H)', () => {
  assert.equal(SHA, '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c');
  assert.equal(C80_R33_SOURCE.baseGlbSha256, C80_R32H_SOURCE.glbSha256);
  assert.deepEqual(fixture.counts, { scenes: 822, nodes: 13846, meshes: 5237, materials: 824, accessors: 11427, bufferViews: 11433 });
  for (const v of Object.values(C80_R33_VIEWS)) assert.equal(fixture.scenes[v.sceneIndex].name, v.name);
});

test('every R33 view passes its exact gate, carries the WC door COW and binds a layer scope', () => {
  const j = json();
  for (const v of Object.values(C80_R33_VIEWS)) {
    const roots = j.scenes[v.sceneIndex].nodes;
    for (const n of [13843, 13844, 13845]) assert.ok(roots.includes(n), `${v.role} has ${n}`);
    for (const n of [12643, 9199, 9200]) assert.ok(!roots.includes(n), `${v.role} drops ${n}`);
    assert.equal(isC80R32HSceneSource(j, SHA, v.sceneIndex, v.role, v.floor), true, v.role);
    assert.deepEqual({ ...r31ViewerLayerSceneReceipt(j, SHA, v.sceneIndex) }, { sourceSha256: SHA, sceneIndex: v.sceneIndex, role: v.role, floor: v.floor });
    assert.deepEqual({ ...r31ViewerLayerBindingScope(j, SHA, v.sceneIndex) }, { area: 'D', floor: v.floor });
    assert.ok(C80_R31_REVIEW_ROLES[v.role]);
  }
  // R32H scenes inside the R33 file are not R33 views, and R32H views never accept the R33 SHA.
  assert.equal(r31ViewerLayerSceneReceipt(j, SHA, 814), null);
  assert.equal(isC80R32HSceneSource(j, SHA, 814, C80_R32H_VIEWS.dNormal.role, 'BOTH'), false);
});

test('R33 gate fails closed', () => {
  const v = C80_R33_VIEWS.dNormal;
  assert.equal(isC80R32HSceneSource(json(), C80_R32H_SOURCE.glbSha256, v.sceneIndex, v.role, v.floor), false);
  const oldDoor = json(); const r = oldDoor.scenes[818].nodes; r[r.indexOf(13843)] = 12643;
  assert.equal(isC80R32HSceneSource(oldDoor, SHA, 818, v.role, 'BOTH'), false);
  const noLever = json(); noLever.scenes[820].nodes = noLever.scenes[820].nodes.filter((n) => n !== 13844);
  assert.equal(isC80R32HSceneSource(noLever, SHA, 820, C80_R33_VIEWS.upperNormal.role, '2F'), false);
  const count = json(); count.nodes.pop();
  assert.equal(isC80R32HSceneSource(count, SHA, 818, v.role, 'BOTH'), false);
});

test('R33 is an R32H-family model: candidate, capabilities, roof-water review roots', () => {
  assert.equal(isR32HFamilySha(SHA), true);
  assert.equal(isR31FamilyViewerSha(SHA), true);
  assert.equal(r32hFamilyOf(SHA).views.dNormal.sceneIndex, 818);
  const review = r31WorkTestReview({ id: C80_R33_WORK_TEST_ID, path: `/private-model/work-test/${C80_R33_WORK_TEST_ID}.glb` });
  assert.equal(review.source, C80_R33_SOURCE);
  const caps = r31ViewerSourceCapabilities(SHA);
  assert.equal(caps.siteNetworks, true);
  for (const key of ['eastGable', 'gableBoarding', 'rainwater', 'carport']) assert.equal(r31RuntimeExteriorAllowed(caps, key), false, key);
  const nodes = Array.from({ length: 13846 }, (_, i) => ({ name: `N${i}` }));
  for (const { node, name } of [...C80_R31_TECHNICAL_REVIEW_ADDITIONS, ...C80_R32H_ROOFWATER_REVIEW_ROOTS]) nodes[node] = { name };
  const keep = c80R31TechnicalReviewNodeSet({ nodes }, SHA);
  for (const { node } of C80_R32H_ROOFWATER_REVIEW_ROOTS) assert.ok(keep.has(node));
});

test('worker allowlist pins the R33 GLB bytes and the candidate registry its Drive original', () => {
  const worker = readFileSync(new URL('../../worker/privateWorkTest.ts', import.meta.url), 'utf8');
  assert.match(worker, /id: 'c80-r33-3a226f98-d-2f-sc818-sc821-work-test'[\s\S]{0,400}expectedSize: 64_697_168,\s*expectedSha256: '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c'/);
  assert.match(worker, /\n  C80_R33_3A22_WORK_TEST_CANDIDATE,\n/);
  const reg = JSON.parse(readFileSync(new URL('../../.github/work-test-candidates.json', import.meta.url), 'utf8'));
  const flat = JSON.stringify(reg);
  assert.match(flat, /"c80-r33-3a226f98-d-2f-sc818-sc821-work-test":\{"driveFileId":"13Wb5Og60oBFl_gWoEcAqXL22gy7MZZFg"\}/);
});
