import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

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
