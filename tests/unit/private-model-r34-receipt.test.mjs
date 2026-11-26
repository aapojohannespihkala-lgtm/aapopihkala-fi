import assert from 'node:assert/strict';
import test from 'node:test';
// CI already runs this R34 receipt suite; include the staged fail-closed Worker894 contract.
import './private-model-r34-iv125-worker-staging.test.mjs';
import { readFileSync } from 'node:fs';
import {
  C80_R34_SOURCE, C80_R34_VIEWS, C80_R34_WORK_TEST_ID, C80_R33_SOURCE, C80_R33_VIEWS,
  isC80R32HSceneSource, isR31FamilyViewerSha, isR32HFamilySha, r32hFamilyOf,
  r31ViewerLayerSceneReceipt, r31ViewerLayerBindingScope, r31WorkTestReview, C80_R31_REVIEW_ROLES,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { r31ViewerSourceCapabilities, r31RuntimeExteriorAllowed } from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { c80R31TechnicalReviewNodeSet, C80_R32H_ROOFWATER_REVIEW_ROOTS, C80_R31_TECHNICAL_REVIEW_ADDITIONS } from '../../src/scripts/privateModelC80R31TechnicalReview.mjs';

// Real scene root lists of the R34 GLB (99210ea5), extracted from the original file.
const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-r34-scene-roots.json', import.meta.url), 'utf8'));
const SHA = C80_R34_SOURCE.glbSha256;
function json() {
  const c = fixture.counts;
  const scenes = Array.from({ length: c.scenes }, () => ({ name: 'x', nodes: [] }));
  for (const [i, s] of Object.entries(fixture.scenes)) scenes[Number(i)] = { name: s.name, nodes: [...s.nodes], extras: { current: false, asBuilt: false } };
  const arr = (n) => Array.from({ length: n }, () => ({}));
  return { asset: { extras: { ...fixture.asset } }, scene: fixture.defaultScene, scenes, nodes: arr(c.nodes), meshes: arr(c.meshes),
    materials: arr(c.materials), accessors: arr(c.accessors), bufferViews: arr(c.bufferViews) };
}

test('R34 fixture matches the source descriptor (append-only on R33)', () => {
  assert.equal(SHA, '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725');
  assert.equal(C80_R34_SOURCE.baseGlbSha256, C80_R33_SOURCE.glbSha256);
  assert.deepEqual(fixture.counts, { scenes: 826, nodes: 13854, meshes: 5242, materials: 826, accessors: 11449, bufferViews: 11455 });
  for (const v of Object.values(C80_R34_VIEWS)) assert.equal(fixture.scenes[v.sceneIndex].name, v.name);
});

test('every R34 view passes its gate with the facade roots of its floor and binds a layer scope', () => {
  const j = json();
  for (const v of Object.values(C80_R34_VIEWS)) {
    const roots = j.scenes[v.sceneIndex].nodes;
    for (const n of [13843, 13846, 13847, 13851]) assert.ok(roots.includes(n), `${v.role} has ${n}`);
    for (const n of [13850, 13852, 13853]) assert.equal(roots.includes(n), v.floor === 'BOTH', `${v.role} ${n}`);
    assert.ok(!roots.includes(13809));
    assert.equal(isC80R32HSceneSource(j, SHA, v.sceneIndex, v.role, v.floor), true, v.role);
    assert.deepEqual({ ...r31ViewerLayerSceneReceipt(j, SHA, v.sceneIndex) }, { sourceSha256: SHA, sceneIndex: v.sceneIndex, role: v.role, floor: v.floor });
    assert.deepEqual({ ...r31ViewerLayerBindingScope(j, SHA, v.sceneIndex) }, { area: 'D', floor: v.floor });
    assert.ok(C80_R31_REVIEW_ROLES[v.role]);
  }
  assert.equal(r31ViewerLayerSceneReceipt(j, SHA, 818), null);
  assert.equal(isC80R32HSceneSource(j, SHA, 818, C80_R33_VIEWS.dNormal.role, 'BOTH'), false);
});

test('R34 gate fails closed', () => {
  const v = C80_R34_VIEWS.dNormal;
  assert.equal(isC80R32HSceneSource(json(), C80_R33_SOURCE.glbSha256, v.sceneIndex, v.role, v.floor), false);
  const oldEnv = json(); const r = oldEnv.scenes[822].nodes; r[r.indexOf(13850)] = 13809;
  assert.equal(isC80R32HSceneSource(oldEnv, SHA, 822, v.role, 'BOTH'), false);
  const noBrick = json(); noBrick.scenes[822].nodes = noBrick.scenes[822].nodes.filter((n) => n !== 13853);
  assert.equal(isC80R32HSceneSource(noBrick, SHA, 822, v.role, 'BOTH'), false);
  const noWall = json(); noWall.scenes[824].nodes = noWall.scenes[824].nodes.filter((n) => n !== 13846);
  assert.equal(isC80R32HSceneSource(noWall, SHA, 824, C80_R34_VIEWS.upperNormal.role, '2F'), false);
});

test('R34 is an R32H-family model: candidate, capabilities, roof-water review roots', () => {
  assert.equal(isR32HFamilySha(SHA), true);
  assert.equal(isR31FamilyViewerSha(SHA), true);
  assert.equal(r32hFamilyOf(SHA).views.dNormal.sceneIndex, 822);
  const review = r31WorkTestReview({ id: C80_R34_WORK_TEST_ID, path: `/private-model/work-test/${C80_R34_WORK_TEST_ID}.glb` });
  assert.equal(review.source, C80_R34_SOURCE);
  const caps = r31ViewerSourceCapabilities(SHA);
  for (const key of ['eastGable', 'gableBoarding', 'rainwater', 'carport']) assert.equal(r31RuntimeExteriorAllowed(caps, key), false, key);
  const nodes = Array.from({ length: 13854 }, (_, i) => ({ name: `N${i}` }));
  for (const { node, name } of [...C80_R31_TECHNICAL_REVIEW_ADDITIONS, ...C80_R32H_ROOFWATER_REVIEW_ROOTS]) nodes[node] = { name };
  const keep = c80R31TechnicalReviewNodeSet({ nodes }, SHA);
  for (const { node } of C80_R32H_ROOFWATER_REVIEW_ROOTS) assert.ok(keep.has(node));
});

test('worker allowlist pins the R34 GLB bytes and the candidate registry its Drive original', () => {
  const worker = readFileSync(new URL('../../worker/privateWorkTest.ts', import.meta.url), 'utf8');
  assert.match(worker, /id: 'c80-r34-99210ea5-d-2f-sc822-sc825-work-test'[\s\S]{0,400}expectedSize: 65_219_168,\s*expectedSha256: '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725'/);
  assert.match(worker, /\n  C80_R34_9921_WORK_TEST_CANDIDATE,\n/);
  const reg = JSON.parse(readFileSync(new URL('../../.github/work-test-candidates.json', import.meta.url), 'utf8'));
  assert.equal(reg.candidates?.['c80-r34-99210ea5-d-2f-sc822-sc825-work-test']?.driveFileId ?? JSON.stringify(reg).match(/"c80-r34-99210ea5-d-2f-sc822-sc825-work-test":\{"driveFileId":"([^"]+)"/)?.[1], C80_R34_SOURCE.zipDriveId);
});
