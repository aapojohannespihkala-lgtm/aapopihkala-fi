import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  G1_MAP_AXES,
  g1ToMapXY,
  nextNorthFrame,
  northWorldDirection,
  projectNorthMarker,
  createNorthFrameToggleController,
} from '../../src/scripts/privateModelNavigationNorthFrameToggle.mjs';

const identity = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });
const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance,
    'expected ' + actual + ' within ' + tolerance + ' of ' + expected);

test('authoritative G2a XY axes are orthonormal and preserve handedness', () => {
  const a = G1_MAP_AXES;
  near(Math.hypot(a.xE, a.xN), 1);
  near(Math.hypot(a.yE, a.yN), 1);
  near(a.xE * a.yE + a.xN * a.yN, 0);
  near(a.xE * a.yN - a.xN * a.yE, 1);
  assert.equal(a.modelFrame, 'YLIS-G1-LOCAL');
  assert.equal(a.crs, 'EPSG:3879');
});
test('two independent building axis landmarks retain G2a direction and length', () => {
  // G2a's Building_20328352 footprint control: local SW, SE and NW.
  // Original comparisons to CityGML corners: SE residual ~0.034 m,
  // NW residual ~0.142 m. These are source accuracy limits, not surveyed as-built.
  const sw = g1ToMapXY(0, 0);
  const se = g1ToMapXY(25.4, 0);
  const nw = g1ToMapXY(0, 10.81);
  near(sw.e, 25485619.391, 1e-8);
  near(sw.n, 6673676.113, 1e-8);
  near(se.e, 25485642.98667983);
  near(se.n, 6673666.71066554);
  near(nw.e, 25485623.3925447);
  near(nw.n, 6673686.15509839);
  near(Math.hypot(se.e - sw.e, se.n - sw.n), 25.4);
  near(Math.hypot(nw.e - sw.e, nw.n - sw.n), 10.81);
  assert.ok(se.e > sw.e && se.n < sw.n, 'D to A is east and map-south');
  assert.ok(nw.e > sw.e && nw.n > sw.n, 'local +Y maps map-northeast');
});
test('cartographic north points toward local west by 21.726 degrees', () => {
  const local = northWorldDirection('local');
  const map = northWorldDirection('map');
  assert.deepEqual(local, { x: 0, y: 0, z: -1 });
  near(map.x, -0.370170648, 1e-10);
  near(map.y, 0);
  near(map.z, -0.928963773, 1e-10);
  near(Math.atan2(map.x, -map.z) * 180 / Math.PI, -21.72614197, 1e-5);
});
test('one user toggle switches local <-> map without relabeling geographic north as local', () => {
  assert.equal(nextNorthFrame('local'), 'map');
  assert.equal(nextNorthFrame('map'), 'local');
  assert.throws(() => nextNorthFrame('north'), /unknown north frame/);
  assert.throws(() => northWorldDirection('unknown'), /unknown north frame/);
});
test('projection respects camera orientation and distinguishes local from map at end-on', () => {
  const local = projectNorthMarker(identity, 'local');
  const map = projectNorthMarker(identity, 'map');
  assert.equal(local.endOn, true);
  near(local.x, 46);
  near(local.y, 46);
  assert.equal(map.endOn, false);
  assert.ok(map.x < 46);
  near(map.y, 46);
  assert.equal(map.depth, 'toward-view');
  // Camera quaternion quarter turn about up changes annotation only.
  const yaw = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  const turn = projectNorthMarker(yaw, 'local');
  assert.equal(turn.endOn, false);
  assert.ok(turn.x > 46);
});
test('non-finite input and non-unit camera quaternion fail closed', () => {
  assert.throws(() => g1ToMapXY(NaN, 0), /finite/);
  assert.throws(() => g1ToMapXY(0, Infinity), /finite/);
  assert.throws(() => projectNorthMarker({}, 'map'), /finite camera/);
  assert.throws(() => projectNorthMarker({ x: 0, y: 0, z: 0, w: 2 }, 'local'), /normalized/);
});
function makeDom() {
  const doc = {};
  const node = () => {
    const listeners = new Map(), attributes = new Map();
    return {
      ownerDocument: doc, dataset: {}, style: {}, children: [], textContent: '',
      setAttribute(k, v) { attributes.set(k, String(v)); },
      getAttribute(k) { return attributes.get(k) ?? null; },
      append(...items) { this.children.push(...items); },
      remove() { this.removed = true; },
      addEventListener(k, fn) { listeners.set(k, fn); },
      removeEventListener(k, fn) { if (listeners.get(k) === fn) listeners.delete(k); },
      click() { listeners.get('click')?.(); },
    };
  };
  doc.createElement = node;
  doc.createElementNS = node;
  return { node };
}
test('mounted control changes SVG north label and aria state, never camera coordinates', () => {
  const { node } = makeDom();
  const root = node(), svg = node(), northLabel = node();
  northLabel.textContent = 'N';
  northLabel.setAttribute('x', '10');
  northLabel.setAttribute('y', '20');
  const immutableCamera = Object.freeze({ ...identity });
  const cameraBefore = JSON.stringify(immutableCamera);
  const controller = createNorthFrameToggleController({ root, svg, northLabel });
  assert.equal(controller.frame, 'local');
  assert.equal(controller.button.getAttribute('aria-pressed'), 'false');
  controller.render({ quaternion: immutableCamera });
  const localX = northLabel.getAttribute('x');
  controller.button.click();
  assert.equal(controller.frame, 'map');
  assert.equal(root.dataset.northReference, 'EPSG:3879');
  assert.equal(controller.button.getAttribute('aria-pressed'), 'true');
  assert.equal(northLabel.textContent, 'N kartta');
  assert.notEqual(northLabel.getAttribute('x'), localX);
  assert.equal(JSON.stringify(immutableCamera), cameraBefore);
  controller.button.click();
  assert.equal(controller.frame, 'local');
  assert.equal(northLabel.textContent, 'N');
  controller.dispose();
  assert.equal(northLabel.getAttribute('x'), '10');
  assert.equal(northLabel.getAttribute('y'), '20');
  assert.equal(controller.button.removed, true);
  assert.equal(root.dataset.northFrame, undefined);
  assert.throws(() => controller.toggle(), /disposed/);
});
test('controller validates its mount and does not update a label on bad pose', () => {
  assert.throws(() => createNorthFrameToggleController(), /gizmo DOM/);
  const { node } = makeDom();
  const root = node(), svg = node(), northLabel = node();
  const controller = createNorthFrameToggleController({ root, svg, northLabel });
  assert.equal(northLabel.textContent, 'N');
  assert.throws(() => controller.render({ quaternion: { ...identity, w: Infinity } }), /finite camera/);
  assert.equal(northLabel.textContent, 'N');
  controller.dispose();
});


test('button recovers read-only camera pose from existing HUD signature before first overlay frame', () => {
  const { node } = makeDom();
  const root = node(), svg = node(), northLabel = node();
  root.dataset.cameraQuaternion = '0.00000|0.00000|0.00000|1.00000';
  northLabel.textContent = 'N';
  const controller = createNorthFrameToggleController({ root, svg, northLabel });
  assert.equal(root.dataset.northProjectionReady, 'true');
  controller.button.click();
  assert.equal(controller.frame, 'map');
  assert.equal(northLabel.textContent, 'N kartta');
  assert.equal(root.dataset.northReference, 'EPSG:3879');
  assert.equal(root.dataset.northProjectionReady, 'true');
  assert.ok(svg.children[0].getAttribute('x2') !== null);
  controller.dispose();
});

test('without a usable camera pose, map label changes but unprojected arrow is hidden', () => {
  const { node } = makeDom();
  const root = node(), svg = node(), northLabel = node();
  root.dataset.cameraQuaternion = 'not-a-camera-pose';
  northLabel.textContent = 'N';
  const controller = createNorthFrameToggleController({ root, svg, northLabel });
  controller.toggle();
  assert.equal(northLabel.textContent, 'N kartta');
  assert.equal(root.dataset.northProjectionReady, 'false');
  assert.equal(svg.children[0].style.display, 'none');
  controller.dispose();
});

test('real orientation HUD integrates the opt-in north frame without making the canvas overlay interactive', () => {
  const source = readFileSync(
    new URL('../../src/scripts/privateModelOrientationGizmo.ts', import.meta.url), 'utf8',
  );
  const page = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8',
  );
  assert.match(source, /import \{ createNorthFrameToggleController \} from '\.\/privateModelNavigationNorthFrameToggle\.mjs';/);
  assert.match(source, /createNorthFrameToggleController\(\{ root, svg: northFrameSvg, northLabel \}\)/);
  assert.match(source, /pointerEvents: 'auto'/);
  assert.match(source, /touchAction: 'manipulation'/);
  const nav = source.indexOf('const navigatorChanged = renderNavigator(quaternion, projection)');
  const north = source.indexOf('northFrameController?.render({ quaternion })');
  assert.ok(nav >= 0 && north > nav, 'north is rendered after existing G1 axis');
  assert.match(page, /\.orientation-gizmo \{[\s\S]*?pointer-events: none;/);
  assert.match(page, /id="orientation-north-label"/);
});
