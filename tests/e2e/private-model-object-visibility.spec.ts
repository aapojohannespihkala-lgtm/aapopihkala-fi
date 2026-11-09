import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';
import { pickSelectableObjectAtClientPoint } from '../../src/scripts/privateModelSelectionPicking';

import {
  createObjectVisibilityFilter,
  hasVisibleMaterial,
  isEffectivelyVisible,
  type ObjectVisibilityNode,
} from '../../src/scripts/privateModelObjectVisibility';

type TestNode = ObjectVisibilityNode & {
  children: TestNode[];
};

const makeNode = (
  name: string,
  visible = true,
  parent: TestNode | null = null,
  renderable = true,
): TestNode => {
  const node: TestNode = {
    name,
    visible,
    parent,
    children: [],
    isMesh: renderable,
    traverse(callback) {
      callback(this);
      this.children.forEach((child) => child.traverse(callback));
    },
  };
  parent?.children.push(node);
  return node;
};

test('effective visibility follows the model-root ancestor chain only', () => {
  const outside = makeNode('outside');
  const root = makeNode('root', true, outside);
  const group = makeNode('group', true, root);
  const mesh = makeNode('mesh', true, group);

  expect(isEffectivelyVisible(mesh, root)).toBe(true);

  group.visible = false;
  expect(isEffectivelyVisible(mesh, root)).toBe(false);
  group.visible = true;

  root.visible = false;
  expect(isEffectivelyVisible(mesh, root)).toBe(false);
  root.visible = true;

  expect(isEffectivelyVisible(makeNode('detached'), root)).toBe(false);
});

test('visible-material predicate preserves the existing opacity threshold', () => {
  expect(hasVisibleMaterial(null)).toBe(true);
  expect(hasVisibleMaterial({})).toBe(true);
  expect(hasVisibleMaterial({ material: { opacity: undefined } })).toBe(true);
  expect(hasVisibleMaterial({ material: { opacity: 1 } })).toBe(true);
  expect(hasVisibleMaterial({ material: { opacity: 0.011 } })).toBe(true);
  expect(hasVisibleMaterial({ material: { opacity: 0.01 } })).toBe(false);
  expect(hasVisibleMaterial({ material: [{ opacity: 0 }, { opacity: 0.5 }] })).toBe(true);
});

test('source-hidden materials cannot intercept model selections', () => {
  const root = makeNode('scene-root', true, null, false);
  const hidden = makeNode('hidden-material', true, root);
  const depthOnly = makeNode('depth-only', true, root);
  const visible = makeNode('visible-wall', true, root);
  Object.assign(hidden, { material: { visible: false, opacity: 1 } });
  Object.assign(depthOnly, { material: { colorWrite: false, opacity: 1 } });
  Object.assign(visible, { material: { visible: true, colorWrite: true, opacity: 1 } });

  const picked = pickSelectableObjectAtClientPoint({
    canvas: {
      dataset: { interactionMode: 'select' },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    },
    camera: {},
    modelRoot: root,
    raycaster: {
      setFromCamera: () => {},
      intersectObjects: () => [{ object: hidden }, { object: depthOnly }, { object: visible }],
    },
    pointer: { x: 0, y: 0 },
    clientX: 50, clientY: 50,
    isEffectivelyVisible,
    hasVisibleMaterial,
  });
  expect(picked).toBe(visible);
});

test('visibility picking filters explicit non-drawing materials without rejecting visible siblings', () => {
  expect(hasVisibleMaterial({ material: { visible: false, opacity: 1 } })).toBe(false);
  expect(hasVisibleMaterial({ material: { colorWrite: false, opacity: 1 } })).toBe(false);
  expect(hasVisibleMaterial({
    material: [
      { visible: false, opacity: 1 },
      { colorWrite: false, opacity: 1 },
      { opacity: 0.01 },
    ],
  })).toBe(false);
  expect(hasVisibleMaterial({
    material: [{ visible: false, opacity: 1 }, { visible: true, opacity: 0.5 }],
  })).toBe(true);
  expect(hasVisibleMaterial({ material: { visible: true, colorWrite: true } })).toBe(true);
  // Existing behavior for objects without source materials is unchanged.
  expect(hasVisibleMaterial(null)).toBe(true);
});

test('object visibility core keeps cumulative hides and restores one object at a time', () => {
  const root = makeNode('root', true, null, false);
  const a = makeNode('A', true, root);
  const b = makeNode('B', true, root);
  const c = makeNode('C', true, root);
  const filter = createObjectVisibilityFilter();

  expect(filter.hide(root, a)).toBe(true);
  expect(filter.hide(root, b)).toBe(true);
  expect(a.visible).toBe(false);
  expect(b.visible).toBe(false);
  expect(c.visible).toBe(true);
  expect(filter.getHiddenCount()).toBe(2);

  expect(filter.show(root, a)).toBe(true);
  expect(a.visible).toBe(true);
  expect(b.visible).toBe(false);
  expect(filter.getHiddenCount()).toBe(1);
});

test('show all clears object overrides without forcing baseline-suppressed objects visible', () => {
  const root = makeNode('root', true, null, false);
  const layerSuppressed = makeNode('layer-suppressed', false, root);
  const a = makeNode('A', true, root);
  const filter = createObjectVisibilityFilter();

  filter.hide(root, a);
  expect(filter.showAll(root)).toBe(true);

  expect(a.visible).toBe(true);
  expect(layerSuppressed.visible).toBe(false);
  expect(filter.getHiddenCount()).toBe(0);
  expect(filter.isIsolating()).toBe(false);
});

test('ending isolate returns exactly to the pre-isolate hidden set', () => {
  const root = makeNode('root', true, null, false);
  const a = makeNode('A', true, root);
  const b = makeNode('B', true, root);
  const c = makeNode('C', true, root);
  const filter = createObjectVisibilityFilter();

  filter.hide(root, a);
  filter.isolate(root, b);
  expect(a.visible).toBe(false);
  expect(b.visible).toBe(true);
  expect(c.visible).toBe(false);

  filter.hide(root, b);
  expect(b.visible).toBe(false);

  expect(filter.endIsolate(root)).toBe(true);
  expect(a.visible).toBe(false);
  expect(b.visible).toBe(true);
  expect(c.visible).toBe(true);
  expect(filter.getHiddenObjects()).toEqual([a]);
});

test('visibility undo is bounded LIFO state and never overrides the captured baseline', () => {
  const root = makeNode('root', true, null, false);
  const suppressed = makeNode('suppressed', false, root);
  const a = makeNode('A', true, root);
  const b = makeNode('B', true, root);
  const filter = createObjectVisibilityFilter();

  filter.hide(root, a);
  filter.hide(root, b);
  expect(filter.canUndo()).toBe(true);

  expect(filter.undo(root)).toBe(true);
  expect(a.visible).toBe(false);
  expect(b.visible).toBe(true);
  expect(suppressed.visible).toBe(false);

  expect(filter.undo(root)).toBe(true);
  expect(a.visible).toBe(true);
  expect(b.visible).toBe(true);
  expect(suppressed.visible).toBe(false);
  expect(filter.canUndo()).toBe(false);
});

test('stale or detached selection cannot blank the active model or enter visibility history', () => {
  const root = makeNode('active-model', true, null, false);
  const active = makeNode('active-mesh', true, root);
  const sibling = makeNode('sibling', true, root);
  const anotherRoot = makeNode('old-model', true, null, false);
  const stale = makeNode('old-selected-mesh', true, anotherRoot);
  const filter = createObjectVisibilityFilter();

  expect(filter.isolate(root, stale)).toBe(false);
  expect(filter.hide(root, stale)).toBe(false);
  expect(filter.isolate(root, root)).toBe(false);
  expect(filter.isActive()).toBe(false);
  expect(filter.canUndo()).toBe(false);
  expect(active.visible).toBe(true);
  expect(sibling.visible).toBe(true);

  expect(filter.hide(root, active)).toBe(true);
  expect(active.visible).toBe(false);
  expect(filter.isolate(root, stale)).toBe(false);
  expect(filter.hide(root, stale)).toBe(false);
  expect(filter.getHiddenObjects()).toEqual([active]);
  expect(filter.isIsolating()).toBe(false);
  expect(sibling.visible).toBe(true);

  expect(filter.undo(root)).toBe(true);
  expect(active.visible).toBe(true);
  expect(filter.canUndo()).toBe(false);
});

test('visibility history stays tied to its captured scene root until reset', () => {
  const firstRoot = makeNode('scene-a', true, null, false);
  const firstMesh = makeNode('mesh-a', true, firstRoot);
  const secondRoot = makeNode('scene-b', true, null, false);
  const secondMesh = makeNode('mesh-b', true, secondRoot);
  const filter = createObjectVisibilityFilter();

  expect(filter.hide(firstRoot, firstMesh)).toBe(true);
  expect(firstMesh.visible).toBe(false);
  expect(filter.hide(secondRoot, secondMesh)).toBe(false);
  expect(filter.isolate(secondRoot, secondMesh)).toBe(false);
  expect(filter.reapply(secondRoot)).toBe(false);
  expect(filter.showAll(secondRoot)).toBe(false);
  expect(filter.undo(secondRoot)).toBe(false);
  expect(filter.endIsolate(secondRoot)).toBe(false);
  expect(filter.getHiddenObjects()).toEqual([firstMesh]);
  expect(secondMesh.visible).toBe(true);
  expect(firstMesh.visible).toBe(false);

  filter.reset();
  expect(filter.isolate(secondRoot, secondMesh)).toBe(true);
  expect(filter.isIsolating()).toBe(true);
  expect(secondMesh.visible).toBe(true);
  expect(filter.endIsolate(secondRoot)).toBe(true);
  expect(filter.showAll(secondRoot)).toBe(false);
});

test('reset clears object visibility history for a model switch', () => {
  const root = makeNode('root', true, null, false);
  const a = makeNode('A', true, root);
  const filter = createObjectVisibilityFilter();

  filter.hide(root, a);
  expect(filter.canUndo()).toBe(true);
  expect(filter.getHiddenCount()).toBe(1);

  filter.reset();

  expect(filter.isActive()).toBe(false);
  expect(filter.canUndo()).toBe(false);
  expect(filter.getHiddenCount()).toBe(0);
  expect(filter.isIsolating()).toBe(false);
});

test('private-model route delegates effective visibility predicates to the helper module', async () => {
  const source = await readFile(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain("from '../../scripts/privateModelObjectVisibility';");
  expect(source).not.toContain('const isEffectivelyVisible =');
  expect(source).not.toContain('const hasVisibleMaterial =');
  expect(source).toContain('isEffectivelyVisible(selectedObject, modelRoot)');
  expect(source).toContain("from '../../scripts/privateModelSelectionPicking';");
  expect(source).toMatch(
    /pickSelectableObjectAtClientPoint\(\{[\s\S]*?isEffectivelyVisible,[\s\S]*?hasVisibleMaterial,[\s\S]*?\}\);/,
  );
});
