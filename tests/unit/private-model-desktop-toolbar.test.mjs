import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DESKTOP_PRESETS, DESKTOP_ANGLES, DESKTOP_EDGES, DESKTOP_START_CANDIDATE_ID,
  activeDesktopPreset, activeDesktopAngle, runDesktopStartupAttempt,
} from '../../src/scripts/privateModelDesktopToolbar.mjs';

test('desktop toolbar shows the agreed one-click presets and camera angles', () => {
  assert.deepEqual(DESKTOP_PRESETS.map(p => p.id),
    ['whole-building', 'd-roof', 'd-apartment', 'd-2f', 'd-1f', 'technical']);
  assert.deepEqual(DESKTOP_ANGLES.map(a => a.id),
    ['orbit', 'iso', 'top', 'elev-pos-y', 'elev-neg-y', 'elev-pos-x', 'elev-neg-x']);
  for (const item of [...DESKTOP_PRESETS, ...DESKTOP_ANGLES]) {
    assert.match(item.icon, /^<svg /);
    assert.ok(item.label.length > 2);
  }
  // Owner 22.11.2026 04.11: roof in the model -> R31 9e0bf34f (R22 scene 688 + whole-building roof group).
  assert.equal(DESKTOP_START_CANDIDATE_ID, 'c80-r34-99210ea5-d-2f-sc822-sc825-work-test');
});

test('edge presentation is a one-click icon group with the four existing modes', () => {
  assert.deepEqual(DESKTOP_EDGES.map(e => e.id), ['visible', 'object', 'unified', 'none']);
  for (const item of DESKTOP_EDGES) assert.match(item.icon, /^<svg /);
});

test('building, camera and edge icons retain the approved geometry and mode mapping', () => {
  const preset = id => DESKTOP_PRESETS.find(item => item.id === id).icon;
  const edge = id => DESKTOP_EDGES.find(item => item.id === id).icon;
  for (const { icon } of DESKTOP_PRESETS) {
    assert.deepEqual([...icon.matchAll(/\bfill="([^"]+)"/g)].map(match => match[1]), ['none']);
    assert.deepEqual([...icon.matchAll(/\bstroke-width="([^"]+)"/g)].map(match => match[1]), ['1.55']);
    assert.match(icon, /<g fill="none" stroke="#F7F8F9"/);
    assert.ok([...icon.matchAll(/\bstroke="([^"]+)"/g)].slice(1).every(match => match[1] === '#8597A3'));
  }
  assert.match(preset('d-roof'), /<path d="M3\.6 9\.2 12 3\.65 20\.4 9\.2"\/>/);
  for (const id of ['d-apartment', 'd-1f', 'd-2f']) {
    assert.match(preset(id), /<path d="M3\.6 9\.2 12 3\.65 20\.4 9\.2" stroke="#8597A3"/);
  }
  assert.match(preset('d-1f'), /M4\.7 14\.35V9\.2H19\.3V14\.35" stroke="#8597A3"[\s\S]*<path d="M4\.7 14\.35H19\.3V19\.5H4\.7Z"\/>/);
  assert.match(preset('d-2f'), /M4\.7 14\.35V19\.5H19\.3V14\.35" stroke="#8597A3"[\s\S]*<path d="M4\.7 9\.2H19\.3V14\.35H4\.7Z"\/>/);
  assert.equal([...preset('technical').matchAll(/<circle /g)].length, 3);
  assert.notEqual(DESKTOP_ANGLES.find(a => a.id === 'iso').icon, DESKTOP_ANGLES.find(a => a.id === 'orbit').icon);
  for (const angle of DESKTOP_ANGLES.filter(a => a.id.startsWith('elev-'))) {
    assert.match(angle.icon, /<rect[^>]+stroke="#F7F8F9"/);
  }
  assert.equal([...edge('unified').matchAll(/ stroke="#F7F8F9"/g)].length, 1);
  assert.match(edge('object'), /M12 3\.7v8\.65/);
  assert.doesNotMatch(edge('object'), /stroke-dasharray/);
});

test('pressed preset separates whole D with and without the roof', () => {
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-apartment', roofVisible: false }), 'd-apartment');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-apartment', roofVisible: true }), 'd-roof');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'd-2f', roofVisible: true }), 'd-2f');
  assert.equal(activeDesktopPreset({ standardViewPreset: 'site', roofVisible: true }), null);
});

test('pressed camera angle follows the actual camera and its valid elevation direction', () => {
  assert.equal(activeDesktopAngle({ viewPreset: 'elevation', elevationDirection: 'neg-x' }), 'elev-neg-x');
  assert.equal(activeDesktopAngle({ viewPreset: 'elevation', elevationDirection: 'wrong' }), null);
  assert.equal(activeDesktopAngle({ viewPreset: 'isometric', elevationDirection: 'neg-x' }), 'iso');
  assert.equal(activeDesktopAngle({ viewPreset: 'orbit', elevationDirection: 'neg-x' }), 'orbit');
  assert.equal(activeDesktopAngle({ viewPreset: 'bottom' }), null);
});

test('plain startup uses the whole-building preset after the pinned source has loaded', async () => {
  const source = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const start = source.slice(source.indexOf('let deskStartCatalogLoaded = false;'),
    source.indexOf("canvas.dataset.deskStartView ??= 'current-fallback';"));
  assert.match(start, /if \(!window\.location\.search && !window\.location\.hash\)/);
  assert.match(start, /runDesktopStartupAttempt\(start.id, async \(\) => \{\s*if \(!await loadWorkTestCandidate\(start\)\) return false;/);
  assert.match(start, /deskEnterWholeBuilding\(\);\s*deskStartFrame\(\);\s*canvas\.dataset\.deskStartView = 'start-work-test-whole-building';/);
  assert.doesNotMatch(start, /deskEnterDFocus\(/);
});

test('an interrupted startup skips the same candidate once, then permits a retry', async () => {
  const data = new Map();
  const getStorage = () => ({
    getItem: key => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  });
  let finish;
  const pending = runDesktopStartupAttempt('r34', () => new Promise(resolve => { finish = resolve; }), getStorage);
  const shouldNotLoad = () => assert.fail('Interrupted model was loaded again');
  assert.equal(await runDesktopStartupAttempt('r34', shouldNotLoad, getStorage), 'interrupted');
  finish(false);
  assert.equal(await pending, 'unavailable');
  assert.equal(await runDesktopStartupAttempt('r34', () => true, getStorage), 'loaded');
  await assert.rejects(runDesktopStartupAttempt('r34', () => { throw Error('load error'); }, getStorage), /load error/);
  assert.equal(data.size, 0);
  assert.equal(await runDesktopStartupAttempt('r34', () => true, () => { throw Error('storage disabled'); }), 'loaded');
});
