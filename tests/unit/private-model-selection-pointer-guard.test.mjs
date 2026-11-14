import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSelectableObjectAtClientPoint } from '../../src/scripts/privateModelSelectionPicking.ts';

const normalRect = { left: 10, top: 20, width: 100, height: 80 };

const pick = ({ clientX = 60, clientY = 60, rect = normalRect, mode = 'select' } = {}) => {
  const object = { isMesh: true, material: { visible: true } };
  const pointer = { x: 41, y: 42 };
  const calls = { set: 0, intersects: 0 };
  const result = pickSelectableObjectAtClientPoint({
    canvas: { dataset: { interactionMode: mode }, getBoundingClientRect: () => rect },
    camera: {},
    modelRoot: { children: [object] },
    raycaster: {
      setFromCamera: () => { calls.set += 1; },
      intersectObjects: () => {
        calls.intersects += 1;
        return [{ object, point: { x: 0, y: 0, z: 0 } }];
      },
    },
    pointer, clientX, clientY,
    isEffectivelyVisible: () => true,
    hasVisibleMaterial: () => true,
  });
  return { result, object, pointer, calls };
};

test('valid center and exact canvas edges retain normal object selection', () => {
  for (const [x, y] of [[60, 60], [10, 20], [110, 100]]) {
    const state = pick({ clientX: x, clientY: y });
    assert.equal(state.result, state.object);
    assert.deepEqual(state.calls, { set: 1, intersects: 1 });
    assert.ok(Number.isFinite(state.pointer.x));
    assert.ok(Number.isFinite(state.pointer.y));
  }
});

test('non-finite, outside and invalid-rectangle coordinates fail closed before raycasting', () => {
  const bad = [
    { clientX: NaN }, { clientX: Infinity }, { clientX: -Infinity },
    { clientY: NaN }, { clientY: Infinity }, { clientY: -Infinity },
    { clientX: 9.999 }, { clientX: 110.001 },
    { clientY: 19.999 }, { clientY: 100.001 },
    { rect: { ...normalRect, left: NaN } },
    { rect: { ...normalRect, top: Infinity } },
    { rect: { ...normalRect, width: NaN } },
    { rect: { ...normalRect, height: Infinity } },
    { rect: { ...normalRect, width: 0 } },
    { rect: { ...normalRect, height: -1 } },
    { rect: { left: Number.MAX_VALUE, top: 20, width: Number.MAX_VALUE, height: 80 } },
  ];
  for (const entry of bad) {
    const state = pick(entry);
    assert.equal(state.result, null, JSON.stringify(entry));
    assert.deepEqual(state.calls, { set: 0, intersects: 0 });
    assert.deepEqual(state.pointer, { x: 41, y: 42 });
  }
});

test('non-select interaction mode still cannot start raycast', () => {
  const state = pick({ mode: 'measure' });
  assert.equal(state.result, null);
  assert.deepEqual(state.calls, { set: 0, intersects: 0 });
});
