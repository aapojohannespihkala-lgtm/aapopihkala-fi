import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { applyViewerLayerPreset, createViewerInteractionState, setViewerInteractionLayerMode } from '../../src/scripts/privateModelViewerState';

test('source-disallowed selected preset is not presented as active and returns without state loss', async ({ page }) => {
  const script = (await build({
    stdin: {
      contents: "export { mountViewerLayerPresetPanel } from './src/scripts/privateModelLayersPresetControls';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'iife', globalName: 'YlisrinneLayerPresetStatus',
    write: false,
  })).outputFiles[0].text;
  await page.setContent('<main><div id="layers"></div></main>');
  await page.addScriptTag({ content: script });

  const saved = setViewerInteractionLayerMode(
    applyViewerLayerPreset(createViewerInteractionState(), 'd-2f'), 'roof', 'visible');
  await page.evaluate(state => {
    (window as any).layerEvents = [];
    (window as any).layerPanel = (window as any).YlisrinneLayerPresetStatus
      .mountViewerLayerPresetPanel(document.getElementById('layers'), state, ['roof'], {
        onPresetChange: (id: string) => (window as any).layerEvents.push(['preset', id]),
        onLayerModeChange: () => {},
        onReset: () => (window as any).layerEvents.push(['reset']),
      }, { boundNodeIds: ['roof'], availablePresets: ['d-1f', 'd-2f'] });
  }, saved);
  const selection = page.getByRole('combobox', { name: 'Näkymän esiasetus' });
  await expect(selection).toHaveValue('d-2f');
  // Empty is a display fallback, never a command that changes the preset.
  await expect(selection.locator('option[value=""]')).toBeDisabled();
  await expect(page.getByText('Mukautettu', { exact: true })).toBeVisible();

  await page.evaluate(state => (window as any).layerPanel.update(
    state, ['roof'], { boundNodeIds: ['roof'], availablePresets: ['d-apartment'] }), saved);
  await expect(selection).toHaveValue('');
  // The source-unavailable state still displays blank even with a disabled option.
  await expect(selection.locator('option[value=""]')).toBeDisabled();
  await expect(selection.locator('option[value="d-2f"]')).toHaveJSProperty('disabled', true);
  await expect(page.getByText('Esiasetus ei käytettävissä tässä mallissa')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Palauta näkyvyys' })).toBeDisabled();
  await expect(page.locator('[data-layer-preset-customized]')).toHaveAttribute('data-customized', 'false');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);

  // A temporarily unsupported model has no legal preset actions at all.
  await page.evaluate(state => (window as any).layerPanel.update(
    state, [], { boundNodeIds: [], availablePresets: [] }), saved);
  await expect(selection).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Palauta näkyvyys' })).toBeDisabled();
  await expect(page.getByText('Esiasetus ei käytettävissä tässä mallissa')).toBeVisible();
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);

  await page.evaluate(state => (window as any).layerPanel.update(
    state, ['roof'], { boundNodeIds: ['roof'], availablePresets: ['d-apartment'] }), saved);
  await expect(selection).toBeEnabled();
  await selection.selectOption('d-apartment');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([['preset', 'd-apartment']]);

  // The source restriction is UI-only: re-enabling the exact saved preset
  // reveals the saved customized state without silently rewriting the model.
  await page.evaluate(state => (window as any).layerPanel.update(
    state, ['roof'], { boundNodeIds: ['roof'], availablePresets: ['d-2f'] }), saved);
  await expect(selection).toHaveValue('d-2f');
  await expect(page.getByText('Mukautettu', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Palauta näkyvyys' })).toBeEnabled();
});
