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
  expect(source).toContain('const { closeToolbarMenus } = setupPrivateModelToolbarMenus(toolbarMenus);');
  expect(source).not.toContain('const closeToolbarMenus =');
  expect(source).not.toContain('const fitToolbarMenuToViewport =');
});

test('private viewer uses the approved toolbar and preserves Layerit when its window is minimized', async ({ page }) => {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.goto('/private-model/?c70=1');
  await expect(page.locator('.desk-toolbar')).toBeVisible();
  await expect(page.locator('#coordinate-panel')).toHaveCount(0);
  const presetIds = page.locator('[data-desk-kind="preset"]');
  expect(await presetIds.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.deskId))).toEqual(
    ['whole-building', 'd-roof', 'd-apartment', 'd-2f', 'd-1f', 'technical'],
  );
  const edgeIds = page.locator('[data-desk-kind="edge"]');
  expect(await edgeIds.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.deskId))).toEqual(
    ['none', 'unified', 'object', 'visible'],
  );
  const summary = page.locator('#preset-menu > summary');
  await expect(summary.locator(':scope > svg')).toBeVisible();
  await expect(summary).toHaveCSS('border-top-width', '0px');
  await summary.click();
  await expect(page.locator('#preset-menu')).toHaveAttribute('open', '');
  await summary.click();

  const viewport = page.locator('.viewport');
  const panels = viewport.locator(':scope > aside[id]');
  const minimizeButtons = panels.locator('.viewport-panel-minimize');
  expect(await minimizeButtons.count()).toBe(await panels.count());
  const layers = page.locator('#layers-panel');
  const layerButton = page.getByRole('button', { name: 'Layerit', exact: true });
  await layerButton.click();
  await expect(layers).toBeVisible();

  const minimize = layers.getByRole('button', { name: 'Pienennä: Layerit' });
  const restore = viewport.getByRole('button', { name: 'Palauta: Layerit' });
  const original = await layers.locator('input, select').evaluateAll(nodes =>
    nodes.map(node => [node.id, (node as HTMLInputElement).checked, (node as HTMLInputElement).value]),
  );
  await minimize.click();
  await expect(layers).toBeHidden();
  await expect(restore).toBeVisible();
  await expect(restore).toBeFocused();
  expect(await layers.evaluate(element => (element as HTMLElement).hidden)).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(restore).toBeInViewport();
  await restore.press('Enter');
  await expect(layers).toBeVisible();
  await expect(minimize).toBeFocused();
  expect(await layers.locator('input, select').evaluateAll(nodes =>
    nodes.map(node => [node.id, (node as HTMLInputElement).checked, (node as HTMLInputElement).value]),
  )).toEqual(original);
});
