import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { installMiddleMouseLookAround } from '../../src/scripts/privateModelMiddleMouseLookAround.ts';

function eventTarget() {
  const handlers = new Map();
  return {
    addEventListener(name, cb) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(cb);
    },
    removeEventListener(name, cb) { handlers.get(name)?.delete(cb); },
    emit(name, event) {
      for (const cb of handlers.get(name) ?? []) cb(event);
    },
    dispatchEvent(event) { this.emit(event.type, event); return true; },
  };
}

function pointer(button, x, y, buttons = 4) {
  return {
    button, buttons, pointerType: 'mouse', pointerId: 11,
    clientX: x, clientY: y,
    prevented: false, stopped: false,
    preventDefault() { this.prevented = true; },
    stopImmediatePropagation() { this.stopped = true; },
  };
}

test('main perspective viewer installs exactly one existing MMB control', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{ installMiddleMouseLookAround \} from '\.\.\/\.\.\/scripts\/privateModelMiddleMouseLookAround'/);
  assert.equal((page.match(/installMiddleMouseLookAround\(\{ camera, controls, canvas \}\)/g) ?? []).length, 1);
});

test('MMB drag keeps eye fixed, changes gaze, restores damping and is disposed cleanly', () => {
  const win = eventTarget();
  const doc = Object.assign(eventTarget(), { defaultView: win });
  const canvas = Object.assign(eventTarget(), {
    ownerDocument: doc,
    setPointerCapture() {},
    hasPointerCapture() { return false; },
    releasePointerCapture() {},
  });
  const camera = new PerspectiveCamera(38, 1, .01, 5000);
  camera.position.set(1, 2, 12);
  const controls = {
    enabled: true,
    enableDamping: true,
    target: new Vector3(0, 1, 0),
    update() { camera.lookAt(this.target); },
  };
  controls.update();
  const initialPosition = camera.position.clone();
  const initialRotation = camera.quaternion.clone();
  let ended = 0;
  canvas.addEventListener('private-model-look-end', () => ended++);
  const dispose = installMiddleMouseLookAround({ camera, controls, canvas });
  const down = pointer(1, 100, 100);
  canvas.emit('pointerdown', down);
  assert.equal(down.prevented, true);
  assert.equal(down.stopped, true);
  assert.equal(controls.enableDamping, false);
  doc.emit('pointermove', pointer(1, 190, 130));
  assert.ok(camera.position.distanceTo(initialPosition) < 1e-10);
  assert.ok(camera.quaternion.angleTo(initialRotation) > .1);
  doc.emit('pointerup', pointer(1, 190, 130, 0));
  assert.equal(ended, 1);
  assert.equal(controls.enableDamping, true);
  assert.ok(camera.position.distanceTo(initialPosition) < 1e-10);
  const left = pointer(0, 190, 130, 1);
  canvas.emit('pointerdown', left);
  assert.equal(left.prevented, false, 'left orbit is not intercepted');
  dispose();
  doc.emit('pointerup', pointer(1, 190, 130, 0));
  assert.equal(ended, 1);
});
