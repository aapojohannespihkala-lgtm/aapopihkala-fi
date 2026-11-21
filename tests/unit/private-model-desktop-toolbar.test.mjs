import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESKTOP_PRESETS, DESKTOP_ANGLES, DESKTOP_START_CANDIDATE_ID,
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
  assert.equal(DESKTOP_START_CANDIDATE_ID, 'c80-r31-9e0bf34f-d-2f-sc769-sc772-work-test');
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
