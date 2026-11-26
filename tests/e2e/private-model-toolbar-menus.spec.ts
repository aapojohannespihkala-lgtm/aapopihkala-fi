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
  const panelButtons = toolbar.locator('.toolbar-panel-button');
  const sizes = await panelButtons.evaluateAll(buttons => buttons.map(button => {
    const { width, height } = button.getBoundingClientRect();
    return [width, height];
  }));
  expect(sizes).toHaveLength(3);
  expect(sizes).toEqual(Array(3).fill([sizes[0][0], sizes[0][0]]));
  const preset = presetIds.first();
  const beforePresetHover = await preset.evaluate(node => getComputedStyle(node).backgroundColor);
  await preset.hover();
  await expect.poll(() => preset.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(beforePresetHover);
  await expect(preset).toHaveCSS('border-top-width', '1px');
  await expect(preset).toHaveCSS('box-shadow', 'none');

  const cameraMenu = page.locator('#view-menu');
  const cameraSummary = cameraMenu.locator(':scope > summary');
  await page.setViewportSize({ width: 1440, height: 880 });
  await cameraSummary.click();
  await expect(cameraMenu.locator('#orbit-button')).toBeHidden();
  await expect(cameraMenu.locator('#elev-pos-x-button')).toBeHidden();
  await expect(cameraMenu.locator('#bottom-button')).toBeVisible();
  await expect(cameraMenu.locator('#fit-button')).toBeVisible();
  await expect(cameraMenu.locator('#clip-plane-enabled')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(cameraMenu.locator('#orbit-button')).toBeVisible();
  await expect(cameraMenu.locator('#elev-pos-x-button')).toBeVisible();
  await cameraSummary.click();
  await page.setViewportSize({ width: 1024, height: 768 });

  const panels = viewport.locator(':scope > aside[id]');
  const minimizeButtons = panels.locator('.viewport-panel-minimize');
  expect(await minimizeButtons.count()).toBe(await panels.count() - 1);

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
  await expect(cubeButton).toHaveCSS('color', 'rgb(196, 205, 210)');
  await expect(cube).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(cube).toHaveCSS('top', '12px');
  await expect(cube.locator('.viewport-panel-minimize')).toHaveCount(0);
  await cubeButton.click();
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

test('toolbar icons stay centered and selected controls share the edge-mode frame', async ({ page }) => {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.goto('/private-model/?c70=1');
  const toolbar = page.locator('.toolbar');
  await expect(toolbar.locator('.desk-toolbar')).toBeVisible();
  const folder = toolbar.locator('#model-menu > summary');
  const layers = toolbar.locator('#layers-button');
  const cube = toolbar.locator('#navigation-cube-button');
  const preset = toolbar.locator('[data-desk-kind="preset"]').first();
  const cubeShaft = cube.locator('svg path').first();
  const cubeTip = cube.locator('svg polygon').first();
  const iconInk = 'rgb(241, 244, 245)';

  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await toolbar.locator('.desk-icon, .toolbar-icon').filter({ visible: true }).evaluateAll(nodes => nodes.map(node => {
      const button = node.getBoundingClientRect();
      const svg = node.querySelector('svg')!;
      const icon = svg.getBoundingClientRect();
      const arrow = node.classList.contains('toolbar-icon') && !node.classList.contains('toolbar-panel-button');
      return {
        arrow, width: button.width, height: button.height,
        iconWidth: icon.width, iconHeight: icon.height,
        dx: Math.abs(icon.x + icon.width / 2 - button.x - button.width / 2),
        dy: Math.abs(icon.y + icon.height / 2 - button.y - button.height / 2),
        left: button.left, right: button.right,
      };
    }));
    expect(geometry).toHaveLength(26);
    for (const control of geometry) {
      expect(control.dx).toBeLessThanOrEqual(0.5);
      expect(control.dy).toBeLessThanOrEqual(0.5);
      expect(control.iconWidth).toBe(control.arrow ? 18 : 22);
      expect(control.iconHeight).toBe(control.arrow ? 18 : 22);
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(width);
    }
    const controls = geometry.filter(control => !control.arrow);
    expect(new Set(controls.map(control => control.height)).size).toBe(1);
    // Panel buttons keep their square touch target on compact layouts.
    expect(new Set(controls.map(control => control.width))).toEqual(
      new Set(width >= 1240 ? [36] : width >= 1000 ? [32, 36] : [28, 34]),
    );

    const selectedFrame = { border: '1px solid rgb(100, 114, 124)', shadow: 'rgb(100, 114, 124) 0px 0px 0px 1px inset' };
    const readFrame = (node: Element) => {
      const style = getComputedStyle(node);
      return { border: style.borderTop, shadow: style.boxShadow };
    };
    // Exercise every icon's selected and unselected CSS independently of model availability.
    const choices = toolbar.locator('.desk-icon[aria-pressed]').filter({ visible: true });
    for (const choice of await choices.all()) {
      const previous = await choice.getAttribute('aria-pressed');
      await choice.evaluate(node => node.setAttribute('aria-pressed', 'true'));
      expect(await choice.evaluate(readFrame)).toEqual(selectedFrame);
      await choice.hover();
      expect(await choice.evaluate(readFrame)).toEqual(selectedFrame);
      await choice.evaluate(node => node.setAttribute('aria-pressed', 'false'));
      expect((await choice.evaluate(readFrame)).shadow).toBe('none');
      await choice.evaluate((node, value) => node.setAttribute('aria-pressed', value!), previous);
    }
    await folder.click();
    expect(await folder.evaluate(readFrame)).toEqual(selectedFrame);
    await folder.click();
    await layers.click();
    expect(await layers.evaluate(readFrame)).toEqual(selectedFrame);
    await layers.click();
    expect((await layers.evaluate(readFrame)).shadow).toBe('none');
    expect(await cube.evaluate(readFrame)).toEqual(selectedFrame);
    await expect(cubeShaft).toHaveCSS('stroke', iconInk);
    await expect(cubeTip).toHaveCSS('fill', iconInk);
    await cube.click();
    expect((await cube.evaluate(readFrame)).shadow).toBe('none');
    await expect(cubeShaft).toHaveCSS('stroke', iconInk);
    await expect(cubeTip).toHaveCSS('fill', iconInk);
    await cube.press('Enter');
    expect(await cube.evaluate(readFrame)).toEqual(selectedFrame);

    const tools = toolbar.locator('.interaction-tools');
    const selectedTool = tools.locator('button[aria-pressed="true"]');
    for (const id of ['point-pick-tool-button', 'point-measure-tool-button', 'selection-tool-button', 'navigate-tool-button']) {
      const tool = tools.locator(`#${id}`);
      await expect(tool).not.toHaveCSS('background-color', 'rgb(65, 74, 83)');
      await tool.click();
      await expect(tool).toHaveCSS('background-color', 'rgb(78, 86, 94)');
      await page.mouse.move(0, 0);
      await expect(selectedTool).toHaveCount(1);
      await expect(selectedTool).toHaveAttribute('id', id);
      await expect(selectedTool).toHaveCSS('background-color', 'rgb(65, 74, 83)');
    }
  }

  // Owner's excluded change: both existing preset hover colors remain exact.
  await preset.evaluate(node => node.setAttribute('aria-pressed', 'false'));
  await preset.hover();
  await expect(preset).toHaveCSS('background-color', 'rgb(48, 56, 64)');
  await preset.evaluate(node => node.setAttribute('aria-pressed', 'true'));
  await expect(preset).toHaveCSS('background-color', 'rgb(78, 86, 94)');
  const contrast = await cube.evaluate(node => {
    const style = getComputedStyle(node);
    const luminance = (color: string) => {
      const channels = color.match(/\d+/g)!.slice(0, 3).map(value => {
        const c = Number(value) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    return (luminance(style.color) + 0.05) / (luminance(style.backgroundColor) + 0.05);
  });
  expect(contrast).toBeGreaterThan(4.5);
});
