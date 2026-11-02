import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import {
  buildViewerLayerPanelModel,
  viewerLayerPresetChoices,
} from '../../src/scripts/privateModelLayersPresetControls';
import {
  applyViewerLayerPreset,
  createViewerInteractionState,
  resetViewerLayerPresetToDefaults,
  setViewerCameraView,
  setViewerInteractionLayerMode,
} from '../../src/scripts/privateModelViewerState';

test('preset choices exclude legacy electrical/drainage research views', () => {
  expect(viewerLayerPresetChoices.map(([id]) => id)).toEqual([
    'whole-building', 'd-apartment', 'd-1f', 'd-2f', 'site', 'infra',
  ]);
  const old = createViewerInteractionState('electrical');
  expect(buildViewerLayerPanelModel(old, []).selectedPreset).toBeNull();
});

test('only explicit available hierarchy IDs are shown, with no fabricated electric layer', () => {
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const model = buildViewerLayerPanelModel(state, [
    'roof', 'architecture-walls', 'locus-water', 'electrical',
    'architecture-windows', 'roof', 'unknown-g2',
  ]);
  expect(model.groups.map((group) => group.label)).toEqual([
    'Rakenteet', 'Tekniset järjestelmät',
  ]);
  expect(model.groups.flatMap((group) => group.items.map((item) => item.id))).toEqual([
    'architecture-walls', 'roof', 'architecture-windows', 'locus-water',
  ]);
  expect(model.groups.flatMap((g) => g.items.map((i) => i.label))).not.toContain('Sähköt');
  expect(model.groups.flatMap((g) => g.items).find((i) => i.id === 'roof')?.mode)
    .toBe('ghost');
});

test('parent reports mixed when explicit children differ, without changing child settings', () => {
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-apartment');
  state = setViewerInteractionLayerMode(state, 'architecture-walls-party', 'hidden');
  const model = buildViewerLayerPanelModel(state, [
    'architecture-walls', 'architecture-walls-party', 'architecture-walls-interior',
  ]);
  const walls = model.groups[0].items.find((item) => item.id === 'architecture-walls');
  expect(walls?.mode).toBe('mixed');
  expect(model.groups[0].items.find((item) => item.id === 'architecture-walls-party')?.mode)
    .toBe('hidden');
  expect(model.groups[0].items.find((item) => item.id === 'architecture-walls-interior')?.mode)
    .toBe('visible');
});

test('customized/reset and scope-independent camera state stay in WP1, not the DOM', () => {
  const initial = setViewerCameraView(createViewerInteractionState(), 'elev-neg-x');
  const d2 = applyViewerLayerPreset(initial, 'd-2f');
  expect(d2.cameraView).toBe('elev-neg-x');
  const changed = setViewerInteractionLayerMode(d2, 'roof', 'visible');
  expect(buildViewerLayerPanelModel(changed, ['roof']).customized).toBe(true);
  const reset = resetViewerLayerPresetToDefaults(changed);
  expect(buildViewerLayerPanelModel(reset, ['roof']).customized).toBe(false);
  expect(buildViewerLayerPanelModel(reset, ['roof']).groups[0].items[0].mode).toBe('ghost');
  expect(reset.cameraView).toBe('elev-neg-x');
});

test('real browser DOM controls emit only explicit user actions and support mixed/custom reset', async ({ page }) => {
  const result = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(),
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'YlisrinneLayersWP3',
    write: false,
  });
  const script = result.outputFiles[0].text;
  await page.goto('about:blank');
  await page.setContent('<section id="layers"></section>');
  await page.addScriptTag({ content: script });

  const start = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  await page.evaluate((state) => {
    const app = (window as any).YlisrinneLayersWP3;
    (window as any).layerEvents = [];
    (window as any).layerPanel = app.mountViewerLayerPresetPanel(
      document.querySelector('#layers'),
      state,
      ['roof', 'architecture-walls', 'architecture-walls-party',
        'architecture-walls-interior', 'locus-water', 'unverified-electrical'],
      {
        onPresetChange: (preset: string) => (window as any).layerEvents.push(['preset', preset]),
        onLayerModeChange: (id: string, mode: string) =>
          (window as any).layerEvents.push(['mode', id, mode]),
        onReset: () => (window as any).layerEvents.push(['reset']),
      },
    );
  }, start);

  await expect(page.locator('[data-layer-preset-panel]')).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: 'Näkymän esiasetus' })).toHaveValue('d-2f');
  await expect(page.locator('[data-layer-node="roof"] select')).toHaveValue('ghost');
  await expect(page.locator('[data-layer-node="unverified-electrical"]')).toHaveCount(0);
  await expect(page.getByText('Sähköt', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' })).toBeDisabled();

  await page.locator('[data-layer-node="roof"] select').selectOption('visible');
  await page.getByRole('combobox', { name: 'Näkymän esiasetus' }).selectOption('site');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([
    ['mode', 'roof', 'visible'], ['preset', 'site'],
  ]);

  let custom = setViewerInteractionLayerMode(start, 'architecture-walls-party', 'hidden');
  custom = setViewerInteractionLayerMode(custom, 'roof', 'visible');
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, [
      'roof', 'architecture-walls', 'architecture-walls-party', 'architecture-walls-interior',
    ]);
  }, custom);
  await expect(page.getByText('Mukautettu', { exact: true })).toBeVisible();
  await expect(page.getByText('Osittainen: alaryhmillä eri näkyvyys')).toBeVisible();
  await expect(page.locator('[data-layer-node="architecture-walls"] select')).toHaveValue('mixed');
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' })).toBeEnabled();
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  expect(await page.evaluate(() => (window as any).layerEvents)).toContainEqual(['reset']);
  await page.evaluate(() => (window as any).layerPanel.destroy());
  await expect(page.locator('[data-layer-preset-panel]')).toHaveCount(0);
});

test('keyboard focus survives state update, no metadata has an explicit explanation', async ({ page }) => {
  const result = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser', format: 'iife',
    globalName: 'YlisrinneLayersWP3', write: false,
  });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setContent('<div id="layers-panel" style="position:relative; height:490px; width:300px; overflow-y:auto;"><div id="layers"></div></div>');
  await page.addStyleTag({ content: readFileSync('src/styles/privateModelLayersPresetControls.css', 'utf8') });
  await page.addScriptTag({ content: result.outputFiles[0].text });
  const start = applyViewerLayerPreset(createViewerInteractionState(), 'd-apartment');
  await page.evaluate((state) => {
    const app = (window as any).YlisrinneLayersWP3;
    (window as any).panel = app.mountViewerLayerPresetPanel(
      document.querySelector('#layers'), state,
      ['architecture-walls', 'architecture-walls-party', 'architecture-walls-interior', 'roof'],
      { onPresetChange: () => {}, onLayerModeChange: () => {}, onReset: () => {} },
    );
  }, start);
  const roof = page.locator('[data-layer-node="roof"] select');
  await roof.focus();
  await expect(roof).toBeFocused();
  const custom = setViewerInteractionLayerMode(start, 'architecture-walls-party', 'hidden');
  await page.evaluate((state) => {
    (window as any).panel.update(state, [
      'architecture-walls', 'architecture-walls-party', 'architecture-walls-interior', 'roof',
    ]);
  }, custom);
  await expect(page.locator('[data-layer-node="roof"] select')).toBeFocused();
  await expect(page.locator('[data-layer-node="architecture-walls"] select')).toHaveValue('mixed');
  await expect(page.getByText('Himmeä = läpikuultava esitystapa, ei tiedon varmuustaso.')).toBeVisible();
  const minTargetHeight = await roof.evaluate(el => el.getBoundingClientRect().height);
  expect(minTargetHeight).toBeGreaterThanOrEqual(44);
  const horizontalOverflow = await page.locator('#layers-panel').evaluate(el => el.scrollWidth > el.clientWidth);
  expect(horizontalOverflow).toBe(false);
  await page.evaluate((state) => (window as any).panel.update(state, []), custom);
  await expect(page.getByText('Tasoryhmiä ei voi näyttää: mallista puuttuu vahvistettu tasometadata.')).toBeVisible();
  await expect(page.locator('[data-layer-node]')).toHaveCount(0);
  await page.evaluate(() => (window as any).panel.destroy());
});
