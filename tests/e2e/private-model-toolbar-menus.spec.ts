import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import {
  setupPrivateModelToolbarMenus,
  toolbarMenuAvailableHeight,
} from '../../src/scripts/privateModelToolbarMenus';

test('toolbar menu available height preserves the inline runtime bounds', () => {
  expect(toolbarMenuAvailableHeight(900, 140)).toBe(750);
  expect(toolbarMenuAvailableHeight(200, 90)).toBe(160);
  expect(toolbarMenuAvailableHeight(601.9, 100.2)).toBe(491);
});

test('private-model route delegates toolbar menu runtime to the module', async () => {
  expect(typeof setupPrivateModelToolbarMenus).toBe('function');

  const source = await readFile(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain(
    "import { setupPrivateModelToolbarMenus } from '../../scripts/privateModelToolbarMenus';",
  );
  expect(source).toContain('setupPrivateModelToolbarMenus(toolbarMenus);');
  expect(source).not.toContain('const closeToolbarMenus =');
  expect(source).not.toContain('const fitToolbarMenuToViewport =');
});
