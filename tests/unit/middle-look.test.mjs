import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anglesFromDirection, directionFromAngles, installMiddleMouseLookAround,
} from '../../src/scripts/privateModelMiddleMouseLookAround.ts';

class Vec {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  clone() { return new Vec(this.x, this.y, this.z); }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
}
class Emitter {
  constructor() { this.handlers = new Map(); }
  addEventListener(k, fn) {
    const a = this.handlers.get(k) || []; a.push(fn); this.handlers.set(k, a);
  }
  removeEventListener(k, fn) {
    this.handlers.set(k, (this.handlers.get(k) || []).filter(f => f !== fn));
  }
  emit(k, e = {}) {
    let stopped = false;
    const ev = {
      button: 0, pointerType: 'mouse', pointerId: 1, buttons: 0,
      clientX: 0, clientY: 0,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { stopped = true; },
      ...e,
    };
    for (const fn of this.handlers.get(k) || []) { fn(ev); if (stopped) break; }
    return ev;
  }
}
function harness() {
  const doc = new Emitter(), win = new Emitter(), canvas = new Emitter();
  doc.defaultView = win;
  canvas.ownerDocument = doc;
  canvas.hasPointerCapture = () => false;
  canvas.setPointerCapture = () => {};
  canvas.releasePointerCapture = () => {};
  const camera = {
    position: new Vec(3, 2, 5),
    lookAt(t) { this.lookingAt = t.clone(); },
  };
  const controls = {
    target: new Vec(3, 2, 0), enabled: true, enableDamping: true, updates: 0,
    update() { this.updates++; },
  };
  const dispose = installMiddleMouseLookAround({ camera, controls, canvas });
  return { doc, win, canvas, camera, controls, dispose };
}
const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-8, `${x} != ${y}`);

test('direction yaw/pitch roundtrip', () => {
  for (const a of [{ yaw: 0, pitch: 0 }, { yaw: 1.2, pitch: .5 }, { yaw: -2, pitch: -.7 }]) {
    const r = anglesFromDirection(directionFromAngles(a.yaw, a.pitch));
    near(r.yaw, a.yaw); near(r.pitch, a.pitch);
  }
});
test('middle drag rotates target only, camera anchored', () => {
  const v = harness(), p = { ...v.camera.position };
  const down = v.canvas.emit('pointerdown', { button: 1, buttons: 4, clientX: 100, clientY: 100 });
  assert.equal(down.defaultPrevented, true);
  assert.equal(v.controls.enableDamping, false);
  v.doc.emit('pointermove', { buttons: 4, clientX: 200, clientY: 50 });
  assert.deepEqual({ ...v.camera.position }, p);
  assert.ok(v.controls.target.x > p.x);
  assert.ok(v.controls.target.y > p.y);
  near(v.camera.position.clone().sub(v.controls.target).length(), 5);
  v.doc.emit('pointerup', { button: 1 });
  assert.equal(v.controls.enableDamping, true);
  v.dispose();
});
test('left orbit, right pan and disabled look pass through', () => {
  const v = harness(), p = { ...v.camera.position };
  assert.notEqual(v.canvas.emit('pointerdown', { button: 0, buttons: 1 }).defaultPrevented, true);
  assert.notEqual(v.canvas.emit('pointerdown', { button: 2, buttons: 2 }).defaultPrevented, true);
  v.controls.enabled = false;
  assert.notEqual(v.canvas.emit('pointerdown', { button: 1, buttons: 4 }).defaultPrevented, true);
  v.doc.emit('pointermove', { buttons: 4, clientX: 100 });
  assert.deepEqual({ ...v.camera.position }, p);
  v.dispose();
});
test('blur, missing middle button and dispose restore controls', () => {
  const v = harness();
  v.canvas.emit('pointerdown', { button: 1, buttons: 4 });
  v.win.emit('blur'); assert.equal(v.controls.enableDamping, true);
  v.canvas.emit('pointerdown', { button: 1, buttons: 4 });
  v.doc.emit('pointermove', { buttons: 0, clientX: 20 });
  assert.equal(v.controls.enableDamping, true);
  v.canvas.emit('pointerdown', { button: 1, buttons: 4 });
  v.dispose(); assert.equal(v.controls.enableDamping, true);
});
test('middle auxiliary click prevents browser autoscroll, right unchanged', () => {
  const v = harness();
  assert.equal(v.canvas.emit('auxclick', { button: 1 }).defaultPrevented, true);
  assert.notEqual(v.canvas.emit('auxclick', { button: 2 }).defaultPrevented, true);
  v.dispose();
});
test('pitch is bounded and position remains fixed at extremes', () => {
  const v = harness(), p = { ...v.camera.position };
  v.canvas.emit('pointerdown', { button: 1, buttons: 4 });
  v.doc.emit('pointermove', { buttons: 4, clientY: -999999 });
  assert.ok(v.controls.target.y > p.y && Number.isFinite(v.controls.target.y));
  assert.deepEqual({ ...v.camera.position }, p);
  v.doc.emit('pointermove', { buttons: 4, clientY: 999999 });
  assert.ok(v.controls.target.y < p.y);
  assert.deepEqual({ ...v.camera.position }, p);
  v.doc.emit('pointercancel', { pointerId: 1 });
  assert.equal(v.controls.enableDamping, true);
  v.dispose();
});
test('old damping update cannot move the viewpoint on middle down', () => {
  const v = harness(), p = { ...v.camera.position };
  const original = v.controls.update.bind(v.controls);
  let n = 0;
  v.controls.update = () => {
    original();
    if (n++ === 0) v.camera.position.x += 3;
  };
  v.canvas.emit('pointerdown', { button: 1, buttons: 4 });
  assert.deepEqual({ ...v.camera.position }, p);
  v.doc.emit('pointermove', { buttons: 4, clientX: 80, clientY: 30 });
  assert.deepEqual({ ...v.camera.position }, p);
  v.dispose();
});
