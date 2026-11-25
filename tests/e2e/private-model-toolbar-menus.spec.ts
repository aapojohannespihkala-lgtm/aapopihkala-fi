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

test('private viewer uses the approved toolbar and restores tool windows from their own buttons', async ({ page }) => {
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
    ['visible', 'object', 'unified', 'none'],
  );
  const summary = page.locator('#preset-menu > summary');
  await expect(summary.locator(':scope > svg')).toBeVisible();
  await expect(summary).toHaveCSS('border-top-width', '0px');
  await summary.click();
  await expect(page.locator('#preset-menu')).toHaveAttribute('open', '');
  await summary.click();

  await expect(page.locator('#view-menu > summary > svg')).toBeVisible();
  await expect(page.locator('#layers-button > svg')).toBeVisible();
  await expect(page.locator('#viewer-info #model-source-badge')).toBeVisible();
  await expect(page.locator('#viewer-info #ai-navigator-readout')).toBeVisible();
  await expect(page.locator('.toolbar > .interaction-tools')).toBeVisible();
  const folder = page.locator('#model-menu > summary');
  await expect(folder.locator('svg')).toBeVisible();
  await expect(page.locator('.toolbar > #more-menu')).toHaveCount(0);
  await expect(page.locator('.toolbar > .interaction-tools > button')).toHaveCount(4);
  await expect(page.locator('#view-menu #axis-measure-tool-button')).toBeDisabled();
  await expect(page.locator('#view-menu #p137e-place-tool-button')).toBeDisabled();
  await page.setViewportSize({ width: 1024, height: 768 });
  const boxes = await page.locator(
    '.toolbar > #model-menu, .toolbar > .desk-toolbar, .toolbar > .interaction-tools, .toolbar > #navigation-cube-button',
  ).evaluateAll(nodes => nodes.map(node => {
    const { left, top, right, bottom } = node.getBoundingClientRect();
    return { left, top, right, bottom };
  }));
  expect(boxes).toHaveLength(4);
  expect(boxes.every(box => box.left >= 0 && box.right < 1024)).toBe(true);
  expect(Math.max(...boxes.map(box => box.top)) < Math.min(...boxes.map(box => box.bottom))).toBe(true);
  expect(boxes[0].right).toBeLessThan(boxes[1].left);
  const hoverBefore = await folder.evaluate(node => getComputedStyle(node).backgroundColor);
  await folder.hover();
  await expect.poll(() => folder.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(hoverBefore);

  const viewport = page.locator('.viewport');
  const toolbar = page.locator('.toolbar');
  const panels = viewport.locator(':scope > aside[id]');
  const minimizeButtons = panels.locator('.viewport-panel-minimize');
  expect(await minimizeButtons.count()).toBe(await panels.count());

  const canvas = viewport.locator('canvas');
  const source = viewport.locator('#m5a-source-context');
  const sourceTitle = 'Salaojien lähdekonteksti';
  const fullWidth = (await canvas.boundingBox())!.width;
  // The source preview has a split layout even when its image has not loaded.
  await source.evaluate(element => {
    (element as HTMLElement).hidden = false;
    element.parentElement!.classList.add('m5a-source-layout');
  });
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(fullWidth);
  await source.getByRole('button', { name: `Pienennä: ${sourceTitle}` }).click();
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeCloseTo(fullWidth, 0);
  await toolbar.getByRole('button', { name: `Palauta: ${sourceTitle}` }).click();
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(fullWidth);
  await source.evaluate(element => {
    (element as HTMLElement).hidden = true;
    element.parentElement!.classList.remove('m5a-source-layout');
  });

  const cubeButton = toolbar.getByRole('button', { name: 'Suuntailmaisin' });
  const cube = viewport.locator('#orientation-gizmo');
  await expect(cubeButton).toHaveAttribute('aria-expanded', 'true');
  await expect(cubeButton).toHaveCSS('color', 'rgb(130, 145, 156)');
  await cube.getByRole('button', { name: 'Pienennä: Suuntailmaisin' }).click();
  await expect(cube).toBeHidden();
  await expect(cubeButton).toHaveAttribute('aria-expanded', 'false');
  await expect(cubeButton).toHaveCSS('color', 'rgb(241, 244, 245)');
  await expect(cubeButton).toBeFocused();
  await cubeButton.press('Enter');
  await expect(cube).toBeVisible();

  const layers = page.locator('#layers-panel');
  const layerButton = toolbar.getByRole('button', { name: 'Layerit', exact: true });
  await layerButton.click();
  await expect(layers).toBeVisible();
  const minimize = layers.getByRole('button', { name: 'Pienennä: Layerit' });
  const original = await layers.locator('input, select').evaluateAll(nodes =>
    nodes.map(node => [node.id, (node as HTMLInputElement).checked, (node as HTMLInputElement).value]),
  );
  await minimize.click();
  await expect(layers).toBeHidden();
  await expect(toolbar.getByRole('button', { name: 'Palauta: Layerit' })).toHaveCount(0);
  await expect(layerButton).toHaveAttribute('aria-expanded', 'false');
  await expect(layerButton).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(layerButton).toBeInViewport();
  await layerButton.press('Enter');
  await expect(layers).toBeVisible();
  expect(await layers.locator('input, select').evaluateAll(nodes =>
    nodes.map(node => [node.id, (node as HTMLInputElement).checked, (node as HTMLInputElement).value]),
  )).toEqual(original);
  await layers.getByRole('button', { name: 'Sulje' }).click();

  const point = viewport.locator('#point-pick-panel');
  const pointTool = toolbar.getByRole('button', { name: 'Piste mallissa' });
  await pointTool.click();
  await point.getByRole('button', {name: 'Pienennä: Piste mallissa'}).click();
  await expect(point).toBeHidden();
  await expect(toolbar.getByRole('button', { name: 'Palauta: Piste mallissa' })).toHaveCount(0);
  await pointTool.press('Enter');
  await expect(point).toBeVisible();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-pick');
});
