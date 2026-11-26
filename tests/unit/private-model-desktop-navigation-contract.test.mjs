import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DESKTOP_NAVIGATION,
  DESKTOP_SCOPE_KEYS,
  DESKTOP_CAMERA_KEYS,
  resolveDesktopNavigation,
} from '../../src/scripts/privateModelDesktopNavigationContract.mjs';

const profile = (overrides = {}) => ({
  candidateId: 'c80-receiver-published-work-test',
  glbSha256: 'a'.repeat(64),
  sceneName: '__scene771',
  // Names are NOT indexes; the viewer reads the actual glTF scene index.
  gltfSceneIndex: 42,
  sourceKind: 'WORK_TEST',
  sourceBound: true,
  availableInViewer: true,
  supportedCameras: [...DESKTOP_CAMERA_KEYS],
  ...overrides,
});
const profiles = () => Object.fromEntries(DESKTOP_SCOPE_KEYS.map((key) => [key, profile()]));

test('owner initial intent is D without roof and orbit without mounting a model', () => {
  assert.deepEqual(DEFAULT_DESKTOP_NAVIGATION, { scope: 'd', camera: '3d' });
  const out = resolveDesktopNavigation({ selection: { scope: 'd' }, profiles: profiles() });
  assert.equal(out.ok, true);
  assert.equal(out.intent.standardPreset, 'd-apartment');
  assert.equal(out.intent.roof, 'hidden');
  assert.equal(out.intent.camera, '3d');
  assert.equal(out.intent.verifiedBy, 'EXTERNAL_VIEWER_RECEIVER_REQUIRED');
});

test('scope changes retain selected isometric view, and camera changes retain scope', () => {
  const initial = { scope: 'd', camera: 'isometric' };
  const next = resolveDesktopNavigation({ state: initial, selection: { scope: 'd-2f' }, profiles: profiles() });
  assert.equal(next.ok, true);
  assert.deepEqual(next.nextState, { scope: 'd-2f', camera: 'isometric' });
  assert.deepEqual(initial, { scope: 'd', camera: 'isometric' });
  const angle = resolveDesktopNavigation({ state: next.nextState, selection: { camera: 'elev-neg-x' }, profiles: profiles() });
  assert.deepEqual(angle.nextState, { scope: 'd-2f', camera: 'elev-neg-x' });
  assert.equal(angle.intent.standardPreset, 'd-2f');
});

test('explicit D roof toggle does not edit GLB default or invent a scene', () => {
  const all = profiles();
  const noRoof = resolveDesktopNavigation({ selection: { scope: 'd' }, profiles: all });
  const withRoof = resolveDesktopNavigation({ state: noRoof.nextState, selection: { scope: 'd-roof' }, profiles: all });
  assert.equal(withRoof.ok, true);
  assert.equal(noRoof.intent.roof, 'hidden');
  assert.equal(withRoof.intent.roof, 'visible');
  assert.equal(withRoof.intent.sceneName, noRoof.intent.sceneName);
  assert.equal(withRoof.intent.glbSha256, noRoof.intent.glbSha256);
});

test('building and technical systems remain distinct, never substitute electrical for all systems', () => {
  const all = profiles();
  const whole = resolveDesktopNavigation({ selection: { scope: 'building' }, profiles: all });
  const systems = resolveDesktopNavigation({ selection: { scope: 'systems' }, profiles: all });
  assert.equal(whole.intent.standardPreset, 'whole-building');
  assert.equal(systems.intent.standardPreset, null);
  assert.equal(systems.intent.roof, 'source-defined');
});

test('unknown scope, camera and malformed selections fail closed', () => {
  const all = profiles();
  for (const selection of [
    { scope: 'd-roof-fake' },
    { camera: 'north' },
    { scope: 'd', camera: '3d' },
    {},
    { scope: 'd', secret: 'x' },
  ]) {
    assert.equal(resolveDesktopNavigation({ selection, profiles: all }).ok, false);
  }
  assert.equal(resolveDesktopNavigation({ state: { scope: 'unknown', camera: '3d' }, selection: { scope: 'd' }, profiles: all }).reason, 'INVALID_STATE');
});

test('unapproved, missing, malformed and wrong-SHA source profiles cannot select an intent', () => {
  const failures = [
    null, profile({ sourceBound: false }), profile({ availableInViewer: false }),
    profile({ glbSha256: 'abc' }), profile({ sceneName: 'scene771' }),
    profile({ gltfSceneIndex: -1 }), profile({ sourceKind: 'HISTORICAL_PLAN' }),
    profile({ candidateId: '' }), profile({ supportedCameras: ['unknown'] }),
  ];
  for (const bad of failures) {
    const out = resolveDesktopNavigation({ selection: { scope: 'd' }, profiles: { d: bad } });
    assert.equal(out.reason, 'SOURCE_NOT_VERIFIED');
  }
});

test('unsupported angle is reported without falling back or modifying state', () => {
  const state = { scope: 'd', camera: '3d' };
  const out = resolveDesktopNavigation({
    state,
    selection: { camera: 'elev-pos-x' },
    profiles: { d: profile({ supportedCameras: ['3d', 'isometric'] }) },
  });
  assert.deepEqual(out, { ok: false, reason: 'CAMERA_NOT_AVAILABLE' });
  assert.deepEqual(state, { scope: 'd', camera: '3d' });
});

test('source scene label and glTF scene index remain independent', () => {
  const out = resolveDesktopNavigation({
    selection: { scope: 'd' },
    profiles: { d: profile({ sceneName: '__scene688', gltfSceneIndex: 17 }) },
  });
  assert.equal(out.ok, true);
  assert.equal(out.intent.sceneName, '__scene688');
  assert.equal(out.intent.gltfSceneIndex, 17);
  assert.notEqual(out.intent.gltfSceneIndex, Number(out.intent.sceneName.slice('__scene'.length)));
});
