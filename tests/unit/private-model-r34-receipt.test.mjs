import assert from 'node:assert/strict';
import test from 'node:test';
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


// Model-specific roots extracted from the original R34 GLB 99210ea5.
// The source-only fixture guard protects the photo-relative visible casing;
// it does not establish a measured wall penetration, condensate route or WebGL pixels.
function assertR34IlpExteriorCaseRoots(source, sceneIndex, bothFloors) {
  const roots = source.scenes[String(sceneIndex)]?.nodes;
  assert.ok(Array.isArray(roots), 'missing source scene ' + sceneIndex);
  for (const node of [13485, 13486]) {
    assert.equal(roots.filter((root) => root === node).length, bothFloors ? 1 : 0,
      'ILP replacement root ' + node + ' in scene ' + sceneIndex);
  }
  for (const node of [12559, 13259, 13484]) {
    assert.equal(roots.includes(node), false,
      'stale ILP photo-case root ' + node + ' leaked into scene ' + sceneIndex);
  }
}

test('R34 photo-relative ILP white exterior case is active in BOTH, absent in 2F', () => {
  for (const scene of [822, 823]) assertR34IlpExteriorCaseRoots(fixture, scene, true);
  for (const scene of [824, 825]) assertR34IlpExteriorCaseRoots(fixture, scene, false);
  const missing = structuredClone(fixture);
  missing.scenes['822'].nodes = missing.scenes['822'].nodes.filter((n) => n !== 13486);
  assert.throws(() => assertR34IlpExteriorCaseRoots(missing, 822, true),
    /ILP replacement root 13486/);
  const leaked = structuredClone(fixture);
  leaked.scenes['824'].nodes.push(13486);
  assert.throws(() => assertR34IlpExteriorCaseRoots(leaked, 824, false),
    /ILP replacement root 13486/);
  const stale = structuredClone(fixture);
  stale.scenes['823'].nodes.push(13259);
  assert.throws(() => assertR34IlpExteriorCaseRoots(stale, 823, true),
    /stale ILP photo-case root 13259/);
});

// PR2302+2307 cofit source wiring. This intentionally checks viewer integration
// rather than visual approval, installed equipment, or production WebGL.
const r34UiV2CofitIndexBindings = [
  ["UI_FOLDER", "<Fragment set:html={DESKTOP_FOLDER_ICON} />"],
  ["UI_FOOTER", "<footer id=\"viewer-info\" class=\"viewer-info\""],
  ["UI_READOUT_BIND", "readoutHost: document.querySelector<HTMLElement>('#viewer-info') ?? orientationGizmo"],
  ["UI_TOOLBAR", "const deskToolbar = mountDesktopToolbar(document, {"],
  ["R34_DRAINAGE", "r31SiteNetworks.drainage = buildR31DrainageOverlay(THREE, await r31DrainageGltf);"],
  ["R34_ROOFWATER", "r31SiteNetworks.roofwater = buildR31RoofWaterOverlay(THREE);"],
  ["R34_BATHROOM_C", "id=\"r22-bathroom-c-on\""],
  ["R34_BATHROOM_BIND", "const bathroomCInput = document.querySelector<HTMLInputElement>('#r22-bathroom-c-on')!;"],
  ["R34_LK75", "r34LK75SelectionMetadataEntries(sourceNodeModel(layersGltf), layersLoadedSha, lk75SceneIndex, object)"],
  ["R34_KITCHEN", "...r34KitchenWastewaterClashSelectionEntries("],
  ["R34_SOURCE_CARD", "const r300OwnerEvidence = resolveR300ViewerOwnerCardEvidence({"],
];
const r34UiV2CofitGizmoBindings = [
  ["UI_GIZMO_OUTSIDE", "readoutHost.append(readout);"],
  ["UI_NORTH_FAILCLOSED", "delete root.dataset.northFrameError;"],
];
function assertR34UiV2Cofit(indexSource, gizmoSource) {
  for (const [name, token] of r34UiV2CofitIndexBindings) {
    assert.ok(indexSource.includes(token), 'R34_UIV2_COFIT:' + name);
  }
  for (const [name, token] of r34UiV2CofitGizmoBindings) {
    assert.ok(gizmoSource.includes(token), 'R34_UIV2_COFIT:' + name);
  }
  assert.ok(
    indexSource.indexOf('id="orientation-gizmo"') < indexSource.indexOf('<footer id="viewer-info"'),
    'R34_UIV2_COFIT:UI_FOOTER_ORDER',
  );
  assert.ok(!gizmoSource.includes('root.append(readout);'), 'R34_UIV2_COFIT:UI_READOUT_IN_CUBE');
}
test('R34 staging preserves UI V2 toolbar/footer plus source-guard bindings', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const gizmo = readFileSync(new URL('../../src/scripts/privateModelOrientationGizmo.ts', import.meta.url), 'utf8');
  assertR34UiV2Cofit(page, gizmo);
  for (const [name, token] of r34UiV2CofitIndexBindings) {
    assert.ok(page.includes(token), name + ' precondition');
    assert.throws(() => assertR34UiV2Cofit(page.replace(token, ''), gizmo),
      new RegExp('R34_UIV2_COFIT:' + name));
  }
  for (const [name, token] of r34UiV2CofitGizmoBindings) {
    assert.ok(gizmo.includes(token), name + ' precondition');
    assert.throws(() => assertR34UiV2Cofit(page, gizmo.replace(token, '')),
      new RegExp('R34_UIV2_COFIT:' + name));
  }
});
