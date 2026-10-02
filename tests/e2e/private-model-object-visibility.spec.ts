import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import {
  hasVisibleMaterial,
  isEffectivelyVisible,
  type ObjectVisibilityNode,
} from '../../src/scripts/privateModelObjectVisibility';

const makeNode = (
  name: string,
  visible = true,
  parent: ObjectVisibilityNode | null = null,
): ObjectVisibilityNode => ({
  name,
  visible,
  parent,
  traverse(callback) {
    callback(this);
  },
});

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
