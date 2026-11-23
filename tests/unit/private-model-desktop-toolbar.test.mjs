import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESKTOP_PRESETS, DESKTOP_ANGLES, DESKTOP_EDGES, DESKTOP_START_CANDIDATE_ID,
  activeDesktopPreset, activeDesktopAngle,
} from '../../src/scripts/privateModelDesktopToolbar.mjs';

test('desktop toolbar shows the agreed one-click presets and camera angles', () => {
  assert.deepEqual(DESKTOP_PRESETS.map(p => p.id),
    ['d-1f', 'd-2f', 'd-apartment', 'd-roof', 'whole-building', 'technical']);
  assert.deepEqual(DESKTOP_ANGLES.map(a => a.id),
    ['orbit', 'iso', 'top', 'elev-pos-y', 'elev-neg-y', 'elev-pos-x', 'elev-neg-x']);
  for (const item of [...DESKTOP_PRESETS, ...DESKTOP_ANGLES]) {
    assert.match(item.icon, /^<svg /);
    assert.ok(item.label.length > 2);
  }
  // Owner 22.11.2026 04.11: roof in the model -> R31 9e0bf34f (R22 scene 688 + whole-building roof group).
  assert.equal(DESKTOP_START_CANDIDATE_ID, 'c80-r32h-c26d99c1-d-2f-sc814-sc817-work-test');
});

test('edge presentation is a one-click icon group with the four existing modes', () => {
  assert.deepEqual(DESKTOP_EDGES.map(e => e.id), ['none', 'object', 'unified', 'visible']);
  for (const item of DESKTOP_EDGES) assert.match(item.icon, /^<svg /);
});

test('icons: isometric is the parallel cube, 3D is a perspective cube, buildings share one house outline', () => {
  const iso = DESKTOP_ANGLES.find(a => a.id === 'iso').icon;
  const orbit = DESKTOP_ANGLES.find(a => a.id === 'orbit').icon;
  assert.match(iso, /M12 3\.5 L19\.5 7\.8 V16\.2/);
  assert.doesNotMatch(orbit, /M12 3\.5 L19\.5 7\.8 V16\.2/);
  const roof = 'M4 11 L12 4 L20 11';
  for (const id of ['d-1f', 'd-2f', 'd-apartment', 'd-roof', 'technical']) {
    assert.ok(DESKTOP_PRESETS.find(p => p.id === id).icon.includes(roof), id);
  }
  for (const a of DESKTOP_ANGLES.filter(a => a.id.startsWith('elev-'))) assert.ok(a.icon.includes(roof), a.id);
});

test('pressed preset separates whole D with and without the roof', () => {
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-apartment', roofVisible: false }), 'd-apartment');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-apartment', roofVisible: true }), 'd-roof');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-2f', roofVisible: true }), 'd-2f');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'site', roofVisible: true }), null);
});

test('pressed camera angle follows elevation presets and the active camera mode', () => {
  assert.equal(activeDesktopAngle({ standardViewPreset: 'elev-neg-x', viewPreset: 'elevation' }), 'elev-neg-x');
  assert.equal(activeDesktopAngle({ standardViewPreset: 'd-apartment', viewPreset: 'isometric' }), 'iso');
  assert.equal(activeDesktopAngle({ standardViewPreset: 'd-apartment', viewPreset: 'orbit' }), 'orbit');
  assert.equal(activeDesktopAngle({ standardViewPreset: 'd-apartment', viewPreset: 'bottom' }), null);
});
