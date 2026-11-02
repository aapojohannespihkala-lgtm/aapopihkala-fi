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

test('malformed saved preset IDs use a verified fallback or no preset', () => {
  const base = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  for (const invalidId of ['unknown', '__proto__', 'constructor', 'electrical', 123, null]) {
    const invalid = {
      ...base,
      layerPresetState: {
        ...base.layerPresetState!,
        selected: invalidId as NonNullable<typeof base.layerPresetState>['selected'],
      },
    };
    const model = buildViewerLayerPanelModel(invalid, ['roof']);
    expect(model.selectedPreset).toBe('d-2f');
    expect(model.groups.flatMap(group => group.items).find(item => item.id === 'roof')?.mode)
      .toBe('ghost');
    expect(invalid.layerPresetState.selected).toBe(invalidId);
  }

  const research = {
    ...createViewerInteractionState('electrical'),
    layerPresetState: {
      ...base.layerPresetState!,
      selected: '__proto__' as NonNullable<typeof base.layerPresetState>['selected'],
      customized: true,
    },
  };
  expect(buildViewerLayerPanelModel(research, ['roof'])).toMatchObject({
    selectedPreset: null, customized: false,
  });
  // Valid saved selections continue to take precedence over older research modes.
  expect(buildViewerLayerPanelModel({
    ...createViewerInteractionState('electrical'),
    layerPresetState: base.layerPresetState,
  }, []).selectedPreset).toBe('d-2f');
});

test('browser select never appears empty for an invalid saved preset with valid fallback', async ({ page }) => {
  const result = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser',
    format: 'iife', globalName: 'YlisrinneLayersWP3', write: false,
  });
  await page.setContent('<main id="layers"></main>');
  await page.addScriptTag({ content: result.outputFiles[0].text });
  const base = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const malformed = {
    ...base,
    layerPresetState: {
      ...base.layerPresetState!,
      selected: 'constructor' as NonNullable<typeof base.layerPresetState>['selected'],
    },
  };
  await page.evaluate((state) => {
    const app = (window as any).YlisrinneLayersWP3;
    (window as any).layerPanel = app.mountViewerLayerPresetPanel(
      document.getElementById('layers'), state, ['roof'],
      { onPresetChange: () => {}, onLayerModeChange: () => {}, onReset: () => {} },
    );
  }, malformed);
  await expect(page.getByRole('combobox', { name: 'Näkymän esiasetus' }))
    .toHaveValue('d-2f');
  await expect(page.getByText('Oletusasetukset', { exact: true })).toBeVisible();
  const legacy = {
    ...createViewerInteractionState('electrical'),
    layerPresetState: { ...malformed.layerPresetState, customized: true },
  };
  await page.evaluate((state) => (window as any).layerPanel.update(state, ['roof']), legacy);
  await expect(page.getByRole('combobox', { name: 'Näkymän esiasetus' }))
    .toHaveValue('');
  await expect(page.getByText('Ei valittua esiasetusta', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' }))
    .toBeDisabled();
  await page.evaluate(() => (window as any).layerPanel.destroy());
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

test('malformed persisted leaf modes display safely hidden without changing source preferences', () => {
  const base = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const invalid = {
    ...base,
    layerPresetState: {
      ...base.layerPresetState!,
      modes: {
        ...base.layerPresetState!.modes,
        roof: 'unrecognized' as 'visible',
        'architecture-windows': undefined as unknown as 'visible',
      },
    },
  };
  const rows = buildViewerLayerPanelModel(invalid, ['roof', 'architecture-windows'])
    .groups.flatMap(group => group.items);
  expect(rows.find(item => item.id === 'roof')).toMatchObject({
    mode: 'hidden', effectiveMode: 'hidden',
  });
  expect(rows.find(item => item.id === 'architecture-windows')).toMatchObject({
    mode: 'hidden', effectiveMode: 'hidden',
  });
  expect(invalid.layerPresetState.modes.roof).toBe('unrecognized');
  expect(base.layerPresetState!.modes.roof).toBe('ghost');
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

test('parent includes verified third-level conflicts without inferring absent layers', () => {
  const base = applyViewerLayerPreset(createViewerInteractionState(), 'd-apartment');
  const partyHidden = setViewerInteractionLayerMode(base, 'architecture-walls-party', 'hidden');
  const available = [
    'architecture', 'architecture-walls', 'architecture-walls-party',
    'architecture-walls-interior', 'architecture-floors',
  ];
  const row = (state: typeof base, ids: readonly string[], id: string) =>
    buildViewerLayerPanelModel(state, ids).groups.flatMap((group) => group.items)
      .find((item) => item.id === id);

  expect(row(partyHidden, available, 'architecture')?.mode).toBe('mixed');
  expect(row(partyHidden, available, 'architecture-walls')?.mode).toBe('mixed');
  expect(row(partyHidden, available, 'architecture')?.effectiveMode).toBe('visible');
  expect(row(partyHidden, available, 'architecture-walls-party')?.mode).toBe('hidden');

  const rootHidden = setViewerInteractionLayerMode(partyHidden, 'architecture', 'hidden');
  expect(row(rootHidden, available, 'architecture')?.mode).toBe('hidden');
  expect(row(rootHidden, available, 'architecture-walls-party')?.effectiveMode).toBe('hidden');

  const withoutParty = available.filter((id) => id !== 'architecture-walls-party');
  expect(row(partyHidden, withoutParty, 'architecture')?.mode).toBe('visible');
  expect(row(partyHidden, ['architecture', 'architecture-walls-party', 'architecture-floors'],
    'architecture')?.mode).toBe('visible'); // Missing intermediate binding stays fail-closed.
  expect(row(base, available, 'architecture')?.mode).toBe('visible');
});

test('technical device controls require available bindings and aggregate their own children', () => {
  const start = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const state = setViewerInteractionLayerMode(start, 'technical-ventilation', 'hidden');
  const model = buildViewerLayerPanelModel(state, [
    'technical', 'technical-ventilation', 'technical-heating', 'unverified-electrical',
  ]);
  expect(model.groups).toHaveLength(1);
  expect(model.groups[0].label).toBe('Tekniset järjestelmät');
  expect(model.groups[0].items.map(({ id, label }) => [id, label])).toEqual([
    ['technical', 'Tekniset laitteet'],
    ['technical-ventilation', 'IV-laitteet ja venttiilit'],
    ['technical-heating', 'Patterit ja ILP'],
  ]);
  expect(model.groups[0].items[0].mode).toBe('mixed');
  expect(model.groups[0].items.some(({ id }) => id === 'technical-electrical')).toBe(false);
  const electrical = buildViewerLayerPanelModel(start, ['technical-electrical']);
  expect(electrical.groups[0].items[0].label).toBe('Sähkölaitteet ja valaisimet');
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
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'ghost');
  await expect(page.locator('[data-layer-node="unverified-electrical"]')).toHaveCount(0);
  await expect(page.getByText('Sähköt', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' })).toBeDisabled();

  const roofNotice = page.locator('[data-layer-roof-unavailable]');
  await expect(roofNotice).toBeHidden();
  // In the actual V26 D2F scene, roof has no verified layer binding.
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, ['architecture-walls']);
  }, start);
  await expect(page.locator('[data-layer-node="roof"]')).toHaveCount(0);
  await expect(roofNotice).toBeVisible();
  await expect(roofNotice).toContainText('vesikattoa ei ole tunnistettu');
  const downstairs = applyViewerLayerPreset(createViewerInteractionState(), 'd-1f');
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, ['architecture-walls']);
  }, downstairs);
  await expect(roofNotice).toBeHidden();
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, ['roof', 'architecture-walls',
      'architecture-walls-party', 'architecture-walls-interior', 'locus-water']);
  }, start);
  await expect(roofNotice).toBeHidden();
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'ghost');

  // A corrupted runtime map must render a meaningful hidden option,
  // never a blank selection that disagrees with fail-closed presentation.
  await page.evaluate((state) => {
    const bad = {
      ...state,
      layerPresetState: {
        ...state.layerPresetState,
        modes: {
          ...state.layerPresetState!.modes,
          roof: 'unrecognized',
          'architecture-walls-party': undefined,
        },
      },
    };
    (window as any).layerPanel.update(bad, [
      'roof', 'architecture-walls', 'architecture-walls-party',
    ]);
  }, start);
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'hidden');
  await expect(page.locator('[data-layer-node="architecture-walls-party"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'hidden');
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('data-effective-mode', 'hidden');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, [
      'roof', 'architecture-walls', 'architecture-walls-party',
      'architecture-walls-interior', 'locus-water',
    ]);
  }, start);
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'ghost');

  await page.locator('[data-layer-node="roof"] button[data-layer-mode="visible"]').click();
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
  await expect(page.getByText('Osittainen: ylätason ja alatasojen näkyvyys poikkeaa. Muuta alatasoja tarvittaessa erikseen.')).toBeVisible();
  await expect(page.locator('[data-layer-node="architecture-walls"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'mixed');
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' })).toBeEnabled();
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  expect(await page.evaluate(() => (window as any).layerEvents)).toContainEqual(['reset']);

  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, ['roof'], {
      availablePresets: ['d-apartment', 'd-1f', 'd-2f'],
    });
  }, custom);
  const preset = page.getByRole('combobox', { name: 'Näkymän esiasetus' });
  await expect(preset.locator('option[value="site"]')).toHaveJSProperty('disabled', true);
  await expect(preset.locator('option[value="infra"]')).toHaveJSProperty('disabled', true);
  await expect(preset.locator('option[value="d-2f"]')).toHaveJSProperty('disabled', false);
  // Normal updates retain the runtime's supported-scope restriction.
  await page.evaluate((state) => (window as any).layerPanel.update(state, ['roof']), custom);
  await expect(preset.locator('option[value="site"]')).toHaveJSProperty('disabled', true);
  await page.evaluate((state) => {
    (window as any).layerPanel.update(state, ['roof'], { disabled: true });
  }, custom);
  await expect(preset).toBeDisabled();
  await expect(page.locator('[data-layer-node="roof"] [data-layer-mode-choices]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: 'Palauta presetin asetukset' })).toBeDisabled();
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
  await page.setContent(`<style>
    #test-viewport { position:relative; width:340px; height:520px; }
    #layers-panel { position:absolute; z-index:2; height:490px; width:300px;
      overflow-y:auto; background:#1b242d; color:#f1f4f5; }
    #coordinate-panel { position:absolute; right:8px; bottom:8px; z-index:3;
      width:160px; height:180px; background:#1b242d; color:#f1f4f5; }
    </style><div id="test-viewport"><div id="layers-panel"><div id="layers"></div></div>
    <aside id="coordinate-panel">Koordinaatit</aside></div>`);
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
  const roof = page.locator('[data-layer-node="roof"] button[data-layer-mode="ghost"]');
  await roof.focus();
  await expect(roof).toBeFocused();
  const custom = setViewerInteractionLayerMode(start, 'architecture-walls-party', 'hidden');
  await page.evaluate((state) => {
    (window as any).panel.update(state, [
      'architecture-walls', 'architecture-walls-party', 'architecture-walls-interior', 'roof',
    ]);
  }, custom);
  await expect(page.locator('[data-layer-node="roof"] button[data-layer-mode="ghost"]')).toBeFocused();
  await expect(page.locator('[data-layer-node="architecture-walls"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'mixed');
  await expect(page.getByText('Himmeä = läpikuultava esitystapa, ei tiedon varmuustaso.')).toBeVisible();
  const contrast = await page.locator('[data-layer-preset-panel]').evaluate(panel => {
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const surface = getComputedStyle(panel).backgroundColor;
    const background = luminance(surface);
    const ratios = ['.yl-layer-preset-field > span', '.yl-layer-preset-help',
      '[data-layer-preset-customized]', '.yl-layer-preset-group h3'].map(selector => {
      const foreground = luminance(getComputedStyle(panel.querySelector(selector)!).color);
      return (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05);
    });
    return { surface, ratios };
  });
  expect(contrast.surface).toBe('rgb(255, 255, 255)');
  expect(Math.min(...contrast.ratios)).toBeGreaterThanOrEqual(4.5);
  const stacking = await page.locator('#layers-panel').evaluate(panel => ({
    layers: Number(getComputedStyle(panel).zIndex),
    hud: Number(getComputedStyle(document.querySelector('#coordinate-panel')!).zIndex),
  }));
  expect(stacking.layers).toBeGreaterThan(stacking.hud);
  await expect(page.locator('#coordinate-panel')).toBeVisible();
  const minTargetHeight = await roof.evaluate(el => el.getBoundingClientRect().height);
  expect(minTargetHeight).toBeGreaterThanOrEqual(44);
  const horizontalOverflow = await page.locator('#layers-panel').evaluate(el => el.scrollWidth > el.clientWidth);
  expect(horizontalOverflow).toBe(false);
  await page.evaluate((state) => (window as any).panel.update(state, []), custom);
  await expect(page.getByText('Tasoryhmiä ei voi näyttää: mallista puuttuu vahvistettu tasometadata.')).toBeVisible();
  await expect(page.locator('[data-layer-node]')).toHaveCount(0);
  await page.evaluate(() => (window as any).panel.destroy());
});

test('parent visibility overrides are explained without changing child preference or mobile focus', async ({ page }) => {
  const compiled = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser', format: 'iife',
    globalName: 'YlisrinneLayersWP3', write: false,
  });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setContent('<div id="layer-wrap" style="width:300px; height:420px; overflow-y:auto"><div id="layers"></div></div>');
  await page.addStyleTag({
    content: readFileSync('src/styles/privateModelLayersPresetControls.css', 'utf8'),
  });
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  const initial = applyViewerLayerPreset(createViewerInteractionState(), 'd-apartment');
  const available = ['technical', 'technical-ventilation', 'technical-heating'];
  await page.evaluate(({ state, ids }) => {
    const mount = (window as any).YlisrinneLayersWP3.mountViewerLayerPresetPanel;
    (window as any).actualModeEvents = [];
    (window as any).parentEffectPanel = mount(
      document.getElementById('layers'), state, ids,
      {
        onPresetChange: () => {},
        onLayerModeChange: (id: string, mode: string) =>
          (window as any).actualModeEvents.push([id, mode]),
        onReset: () => {},
      },
    );
  }, { state: initial, ids: available });

  const device = page.locator('[data-layer-node="technical-ventilation"]');
  const select = device.locator('button[data-layer-mode="visible"]');
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  await expect(device.locator('[data-layer-parent-effect]')).toHaveCount(0);
  await select.focus();
  const hidden = setViewerInteractionLayerMode(initial, 'technical', 'hidden');
  await page.evaluate(({ state, ids }) =>
    (window as any).parentEffectPanel.update(state, ids), { state: hidden, ids: available });
  await expect(select).toBeFocused();
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  await expect(select).toHaveAttribute('data-effective-mode', 'hidden');
  await expect(device.locator('[data-layer-parent-effect]')).toContainText('ei nyt näy');
  await expect(select).toHaveAttribute('aria-description', /oma asetus säilyy/);
  expect(await page.locator('#layer-wrap').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
  expect(await select.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  const ghost = setViewerInteractionLayerMode(initial, 'technical', 'ghost');
  await page.evaluate(({ state, ids }) =>
    (window as any).parentEffectPanel.update(state, ids), { state: ghost, ids: available });
  await expect(select).toBeFocused();
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  await expect(select).toHaveAttribute('data-effective-mode', 'ghost');
  await expect(device.locator('[data-layer-parent-effect]')).toContainText('näkyy himmeänä');

  await page.evaluate(({ state, ids }) =>
    (window as any).parentEffectPanel.update(state, ids), { state: initial, ids: available });
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  await expect(select).toHaveAttribute('data-effective-mode', 'visible');
  await expect(device.locator('[data-layer-parent-effect]')).toHaveCount(0);
  await expect(select).not.toHaveAttribute('aria-description');
  expect(await page.evaluate(() => (window as any).actualModeEvents)).toEqual([]);
  await page.evaluate(() => (window as any).parentEffectPanel.destroy());
});

test('uniformly hidden children are mixed under visible parent in mobile DOM', async ({ page }) => {
  const out = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser',
    format: 'iife', globalName: 'YlisrinneLayersWP3', write: false,
  });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setContent('<div id="viewport" style="width:300px;height:430px;overflow-y:auto"><div id="layers"></div></div>');
  await page.addStyleTag({ content: readFileSync('src/styles/privateModelLayersPresetControls.css', 'utf8') });
  await page.addScriptTag({ content: out.outputFiles[0].text });
  const available = ['architecture-walls', 'architecture-walls-party', 'architecture-walls-interior'];
  let initial = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  initial = setViewerInteractionLayerMode(initial, 'architecture-walls-party', 'hidden');
  initial = setViewerInteractionLayerMode(initial, 'architecture-walls-interior', 'hidden');
  expect(buildViewerLayerPanelModel(initial, available).groups[0].items[0].mode).toBe('mixed');
  await page.evaluate(({ state, ids }) => {
    const app = (window as any).YlisrinneLayersWP3;
    (window as any).events = [];
    (window as any).panel = app.mountViewerLayerPresetPanel(
      document.querySelector('#layers'), state, ids,
      { onReset: () => {}, onPresetChange: () => {},
        onLayerModeChange: (id: string, mode: string) => (window as any).events.push([id, mode]) },
    );
  }, { state: initial, ids: available });
  const parent = page.locator('[data-layer-node="architecture-walls"]');
  const select = parent.locator('button[data-layer-mode="visible"]');
  await expect(parent.locator('[data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'mixed');
  await expect(parent.locator('.yl-layer-preset-mixed')).toContainText('Muuta alatasoja');
  await select.focus();
  const hiddenParent = setViewerInteractionLayerMode(initial, 'architecture-walls', 'hidden');
  await page.evaluate(({ state, ids }) => (window as any).panel.update(state, ids),
    { state: hiddenParent, ids: available });
  await expect(select).toBeFocused();
  await expect(parent.locator('[data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'hidden');
  const restored = setViewerInteractionLayerMode(hiddenParent, 'architecture-walls', 'visible');
  await page.evaluate(({ state, ids }) => (window as any).panel.update(state, ids),
    { state: restored, ids: available });
  await expect(parent.locator('[data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'mixed');
  await expect(page.locator('[data-layer-node="architecture-walls-party"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'hidden');
  await expect(page.locator('[data-layer-node="architecture-walls-interior"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'hidden');
  expect(await page.locator('#viewport').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
  expect(await select.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => (window as any).events)).toEqual([]);
  await page.evaluate(() => (window as any).panel.destroy());
});

test('mobile Layers list keeps its scroll position after a mode update', async ({ page }) => {
  const output = await build({
    entryPoints: ['src/scripts/privateModelLayersPresetControls.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser',
    format: 'iife', globalName: 'YlisrinneLayersWP3', write: false,
  });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setContent(
    '<div id="viewport" style="width:300px;height:310px;overflow-y:auto">' +
    '<div id="layers"></div></div>',
  );
  await page.addStyleTag({
    content: readFileSync('src/styles/privateModelLayersPresetControls.css', 'utf8'),
  });
  await page.addScriptTag({ content: output.outputFiles[0].text });

  const available = [
    'architecture', 'architecture-walls', 'architecture-walls-exterior',
    'architecture-walls-party', 'architecture-walls-interior',
    'architecture-floors', 'architecture-ceilings', 'roof',
    'architecture-doors', 'architecture-windows', 'architecture-review-helpers',
    'architecture-fixtures', 'architecture-other',
    'technical', 'technical-ventilation', 'technical-heating',
    'technical-electrical', 'locus', 'locus-water', 'locus-wastewater',
    'p161-kvv-2017', 'p161-iv-1974-plan', 'p161-iv-1974-section',
  ];
  const initial = applyViewerLayerPreset(createViewerInteractionState(), 'd-apartment');
  await page.evaluate(({ state, ids }) => {
    const mount = (window as any).YlisrinneLayersWP3.mountViewerLayerPresetPanel;
    (window as any).scrollEvents = [];
    (window as any).scrollPanel = mount(document.getElementById('layers'), state, ids, {
      onReset: () => (window as any).scrollEvents.push('reset'),
      onPresetChange: () => (window as any).scrollEvents.push('preset'),
      onLayerModeChange: () => (window as any).scrollEvents.push('mode'),
    });
  }, { state: initial, ids: available });
  const control = page.locator('[data-layer-node="architecture-other"] button[data-layer-mode="visible"]');
  await control.focus();
  await expect(control).toBeFocused();
  const before = await page.locator('#viewport').evaluate(element => element.scrollTop);
  expect(before).toBeGreaterThan(300);

  const changed = setViewerInteractionLayerMode(initial, 'architecture-walls-party', 'hidden');
  await page.evaluate(({ state, ids }) => (window as any).scrollPanel.update(state, ids),
    { state: changed, ids: available });
  await expect(control).toBeFocused();
  const after = await page.locator('#viewport').evaluate(element => element.scrollTop);
  expect(after).toBeCloseTo(before, 0);
  await expect(page.locator('[data-layer-node="architecture"] [data-layer-mode-choices]')).toHaveAttribute('data-selected-mode', 'mixed');
  expect(await page.evaluate(() => (window as any).scrollEvents)).toEqual([]);

  // Source metadata may shrink the list, in which case scroll naturally clamps.
  await page.evaluate((state) => (window as any).scrollPanel.update(state, ['architecture-walls']), changed);
  const position = await page.locator('#viewport').evaluate(element => ({
    top: element.scrollTop, max: element.scrollHeight - element.clientHeight,
  }));
  expect(position.top).toBeLessThanOrEqual(position.max + 1);
  await page.evaluate(() => (window as any).scrollPanel.destroy());
});
