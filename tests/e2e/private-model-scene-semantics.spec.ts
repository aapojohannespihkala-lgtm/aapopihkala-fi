import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import {
  explicitFloorToken,
  findSourceNamedScene,
  hasFloorToken,
  normalizeSceneName,
  semanticName,
} from '../../src/scripts/privateModelSceneSemantics';

test('scene semantic helpers preserve name and floor inference', () => {
  const root = { name: 'Building Root', parent: null };
  const floor = { name: 'D-2F', parent: root, userData: {} };
  const mesh = { name: 'Wall_03', parent: floor, userData: {} };

  expect(semanticName(mesh)).toBe('WALL_03 | D-2F | BUILDING ROOT');
  expect(hasFloorToken(mesh, '2F')).toBe(true);
  expect(hasFloorToken(mesh, '1F')).toBe(false);
  expect(explicitFloorToken(mesh)).toBe('2F');

  const explicit = { name: 'Unlabeled', parent: null, userData: { storey: '1f' } };
  expect(hasFloorToken(explicit, '1F')).toBe(true);

  const mixed = { name: 'D_1F-D_2F', parent: null, userData: {} };
  expect(explicitFloorToken(mixed)).toBe('1F / 2F');
});

test('source scene lookup preserves parser-index priority and normalized fallback', () => {
  const indexedScene = { name: 'Runtime scene zero' };
  const fallbackScene = { name: 'Fallback-scene' };
  const gltf = {
    parser: { json: { scenes: [{ name: 'Exact Source' }, { name: 'Other' }] } },
    scenes: [indexedScene, fallbackScene],
  };

  expect(findSourceNamedScene(gltf, 'Exact Source')).toBe(indexedScene);
  expect(findSourceNamedScene(gltf, 'fallback scene')).toBe(fallbackScene);
  expect(findSourceNamedScene(gltf, 'missing')).toBeNull();
  expect(normalizeSceneName('  D_2F--Plan  ')).toBe('D 2F PLAN');
});

test('private-model route delegates scene semantics to the helper module', async () => {
  const source = await readFile(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain("from '../../scripts/privateModelSceneSemantics';");
  expect(source).not.toContain('const semanticName =');
  expect(source).not.toContain('const normalizeSceneName =');
  expect(source).not.toContain('const findSourceNamedScene =');
  expect(source).not.toContain('const hasFloorToken =');
  expect(source).not.toContain('const explicitFloorToken =');
});
