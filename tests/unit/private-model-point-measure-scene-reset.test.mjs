import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
const declaration = 'let clearPointMeasureOnSceneChange: (() => void) | null = null;';
const begin = source.indexOf(declaration);
const end = source.indexOf('const restoreDReviewStyling =', begin);
assert.ok(begin >= 0 && end > begin, 'the scene-bound measurement invalidator exists');
const snippet = source.slice(begin, end);
const runnable = stripTypeScriptTypes(snippet, { mode: 'strip' });

function sceneFixture() {
  const events = [];
  const modelRoot = {
    children: [],
    clear() { events.push('unmount'); this.children = []; },
    add(root) { events.push('mount'); this.children.push(root); },
    updateMatrixWorld() {},
  };
  const deps = {
    modelRoot,
    fullModelScene: { id: 'full' },
    mainViewScope: null,
    selectedObject: null,
    beforeLayersSceneChange() {},
    applyElectricalLayerState() {},
    syncMainViewScope() {},
    shouldInvalidateModelSelection() { return false; },
    clearSelection() { events.push('selection'); },
    clearPickedPoint() { events.push('picked-point'); },
    refreshEdgeRendering() {},
    refreshLayers() {},
    queueMicrotask() {},
  };
  const factory = new Function('deps', `
    const {
      modelRoot, fullModelScene, mainViewScope, selectedObject,
      beforeLayersSceneChange, applyElectricalLayerState, syncMainViewScope,
      shouldInvalidateModelSelection, clearSelection, clearPickedPoint,
      refreshEdgeRendering, refreshLayers, queueMicrotask
    } = deps;
    ${runnable}
    return {
      setModelScene,
      registerPointReset: callback => { clearPointMeasureOnSceneChange = callback; }
    };
  `);
  return { ...factory(deps), events, modelRoot };
}

test('early scene mount is safe before the measurement tool initializes', () => {
  const f = sceneFixture();
  const root = { id: 'initial' };
  assert.doesNotThrow(() => f.setModelScene(root));
  assert.equal(f.modelRoot.children[0], root);
});

test('source and scene changes invalidate A/B measure before old root is unmounted', () => {
  const f = sceneFixture();
  f.setModelScene({ id: '1F' });
  const first = { id: '2F' };
  f.registerPointReset(() => f.events.push('measure-clear'));
  f.events.length = 0;
  f.setModelScene(first);
  assert.equal(f.modelRoot.children[0], first);
  assert.deepEqual(f.events, ['picked-point', 'measure-clear', 'unmount', 'mount']);
});

test('re-mounting the same scene still invalidates stale points after a floor/preset change', () => {
  const f = sceneFixture();
  const shared = { id: 'full root with floor visibility modes' };
  f.registerPointReset(() => f.events.push('measure-clear'));
  f.setModelScene(shared);
  f.events.length = 0;
  f.setModelScene(shared);
  assert.equal(f.events.filter(item => item === 'measure-clear').length, 1);
});

test('reset registration uses real two-point clearer and erases the displayed distance', () => {
  assert.match(source, /clearPointMeasureOnSceneChange = clearPointMeasure;/);
  const start = source.indexOf('const clearPointMeasure = () => {');
  const stop = source.indexOf('const clickPointMeasure', start);
  assert.ok(start > 0 && stop > start);
  const reset = source.slice(start, stop);
  for (const code of [
    'pointMeasureA = null;', 'pointMeasureB = null;',
    'pointMeasureOverlay.clear();', "canvas.dataset.pointMeasureState = 'empty';",
    'delete canvas.dataset.pointMeasureDistance;',
  ]) assert.ok(reset.includes(code), 'missing reset: ' + code);
  assert.ok(source.includes('setModelScene(dInteriorScene);'));
  assert.ok(source.includes('setModelScene(fullModelScene);'));
});
