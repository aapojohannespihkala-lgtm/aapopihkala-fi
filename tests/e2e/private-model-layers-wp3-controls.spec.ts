import { expect, test, type Page } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import {
  buildViewerLayerPanelModel,
  viewerLayerPresetChoices,
  type ViewerLayerPresetPanelOptions,
} from '../../src/scripts/privateModelLayersPresetControls';
import {
  applyViewerLayerPreset,
  createViewerInteractionState,
  resetViewerLayerPresetToDefaults,
  setViewerCameraView,
  setViewerInteractionLayerMode,
  setViewerInteractionLayerBranchMode,
  withViewerLayerBranchVisibility,
  type ViewerInteractionState,
} from '../../src/scripts/privateModelViewerState';

const items = (state: ViewerInteractionState, ids: readonly string[], options = {}) =>
  buildViewerLayerPanelModel(state, ids, options).groups.flatMap(group => group.items);
const initial = () => applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
const treeIds = [
  'architecture', 'architecture-walls', 'architecture-walls-exterior',
  'architecture-walls-party', 'architecture-walls-interior', 'architecture-floors',
  'architecture-ceilings', 'roof', 'architecture-doors', 'architecture-windows',
  'architecture-fixtures', 'architecture-other', 'technical', 'technical-ventilation',
  'technical-heating', 'technical-electrical', 'architecture-review-helpers',
  'locus', 'locus-water', 'locus-wastewater', 'p161-kvv-2017',
  'p161-iv-1974-plan', 'p161-iv-1974-section',
];
const boundIds = treeIds.filter(id => !['architecture', 'architecture-walls', 'technical', 'locus'].includes(id));
const row = (page: Page, id: string) => page.locator(`[data-layer-node="${id}"]`);
const modeButton = (page: Page, id: string, mode: string) => row(page, id).locator(`[data-layer-mode="${mode}"]`);
const expand = async (page: Page, id: string) => {
  const button = page.locator(`[data-layer-disclosure="${id}"]`);
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
};
let script: string | undefined;
const mount = async (
  page: Page,
  state = initial(),
  ids: readonly string[] = treeIds,
  options: ViewerLayerPresetPanelOptions = { boundNodeIds: boundIds },
  reactive = false,
) => {
  script ??= (await build({
    stdin: {
      contents: `export * from './src/scripts/privateModelLayersPresetControls';
        export { applyViewerLayerPreset, resetViewerLayerPresetToDefaults,
          setViewerInteractionLayerBranchMode } from './src/scripts/privateModelViewerState';`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'iife', globalName: 'YlisrinneLayersWP3', write: false,
  })).outputFiles[0].text;
  await page.setContent(`<style>
    #test-viewport { position:relative; width:340px; height:520px; }
    #layers-panel { position:absolute; z-index:2; height:490px; width:320px;
      overflow-y:auto; background:#1b242d; color:#f1f4f5; }
    #coordinate-panel { position:absolute; right:8px; bottom:8px; z-index:3;
      width:160px; height:180px; background:#1b242d; color:#f1f4f5; }
    </style><div id="test-viewport"><div id="layers-panel"><div id="layers"></div></div>
    <aside id="coordinate-panel">Koordinaatit</aside></div>`);
  await page.addStyleTag({ content: readFileSync('src/styles/privateModelLayersPresetControls.css', 'utf8') });
  await page.addScriptTag({ content: script });
  await page.evaluate(({ current, available, opts, react }) => {
    const app = (window as any).YlisrinneLayersWP3;
    (window as any).layerState = current;
    (window as any).layerIds = available;
    (window as any).layerEvents = [];
    const refresh = () => (window as any).layerPanel.update((window as any).layerState, available, opts);
    (window as any).layerPanel = app.mountViewerLayerPresetPanel(document.getElementById('layers'), current,
      available, {
        onPresetChange: (preset: string) => {
          (window as any).layerEvents.push(['preset', preset]);
          if (react) { (window as any).layerState = app.applyViewerLayerPreset((window as any).layerState, preset); refresh(); }
        },
        onLayerModeChange: (id: string, mode: string) => {
          (window as any).layerEvents.push(['mode', id, mode]);
          if (react) {
            (window as any).layerState = app.setViewerInteractionLayerBranchMode((window as any).layerState, id, mode, available);
            refresh();
          }
        },
        onLayerModesChange: (targets: string[], mode: string) => {
          (window as any).layerEvents.push(['modes', targets, mode]);
          if (react) {
            for (const id of targets) (window as any).layerState = app.setViewerInteractionLayerBranchMode((window as any).layerState, id, mode, available);
            refresh();
          }
        },
        onReset: () => {
          (window as any).layerEvents.push(['reset']);
          if (react) { (window as any).layerState = app.resetViewerLayerPresetToDefaults((window as any).layerState); refresh(); }
        },
      }, opts);
  }, { current: state, available: [...ids], opts: options, react: reactive });
};

test('presets retain legacy research separation and camera-independent reset', () => {
  expect(viewerLayerPresetChoices.map(([id]) => id)).toEqual([
    'whole-building', 'd-apartment', 'd-1f', 'd-2f', 'site', 'infra',
  ]);
  expect(buildViewerLayerPanelModel(createViewerInteractionState('electrical'), []).selectedPreset).toBeNull();
  const old = setViewerCameraView(createViewerInteractionState(), 'elev-neg-x');
  const start = applyViewerLayerPreset(old, 'd-2f');
  const changed = setViewerInteractionLayerMode(start, 'roof', 'visible');
  expect(buildViewerLayerPanelModel(changed, ['roof']).customized).toBe(true);
  const reset = resetViewerLayerPresetToDefaults(changed);
  expect(reset.cameraView).toBe('elev-neg-x');
  expect(buildViewerLayerPanelModel(reset, ['roof']).customized).toBe(false);
  expect(items(reset, ['roof'])[0].mode).toBe('ghost');
});

test('malformed saved preset IDs fall back without mutating persisted input', () => {
  const base = initial();
  for (const id of ['unknown', '__proto__', 'constructor', 'electrical', 123, null]) {
    const bad = { ...base, layerPresetState: { ...base.layerPresetState!, selected: id as any } };
    expect(buildViewerLayerPanelModel(bad, ['roof']).selectedPreset).toBe('d-2f');
    expect(bad.layerPresetState.selected).toBe(id);
  }
  const noPreset = { ...createViewerInteractionState('electrical'),
    layerPresetState: { ...base.layerPresetState!, selected: '__proto__' as any, customized: true } };
  expect(buildViewerLayerPanelModel(noPreset, [])).toMatchObject({ selectedPreset: null, customized: false });
});

test('only verified IDs appear and source references stay outside physical system categories', () => {
  const model = buildViewerLayerPanelModel(initial(), [
    'roof', 'architecture-walls', 'locus-water', 'electrical', 'architecture-windows',
    'architecture-fixtures', 'technical-ventilation', 'architecture-review-helpers', 'unknown-g2',
  ]);
  expect(model.groups.map(group => group.label)).toEqual([
    'Rakennusosat', 'Kalusteet ja varusteet', 'Talotekniikka', 'Lähteet ja viitteet',
  ]);
  expect(model.groups.flatMap(group => group.items).some(item => (item.id as string) === 'electrical')).toBe(false);
  const technical = model.groups.find(group => group.label === 'Talotekniikka')!;
  expect(technical.items.map(item => item.id)).toEqual(['technical-ventilation']);
  const refs = model.groups.find(group => group.label === 'Lähteet ja viitteet')!;
  expect(refs.items.map(item => item.id)).toEqual(['architecture-review-helpers', 'locus-water']);
  expect(refs.items.find(item => item.id === 'locus-water')?.label).toBe('Vesi, Locus');
  expect(model.roots.find(node => node.id === 'furniture')?.commandIds).toEqual(['architecture-fixtures']);
});

test('malformed leaf states fail closed in own and effective presentation', () => {
  const base = initial();
  const bad = { ...base, layerPresetState: { ...base.layerPresetState!, modes: {
    ...base.layerPresetState!.modes, roof: 'unrecognized' as any, 'architecture-windows': undefined as any,
  } } };
  for (const item of items(bad, ['roof', 'architecture-windows'])) {
    expect(item).toMatchObject({ mode: 'hidden', effectiveMode: 'hidden' });
  }
  expect(bad.layerPresetState.modes.roof).toBe('unrecognized');
  expect(base.layerPresetState!.modes.roof).toBe('ghost');
});

test('branch summaries aggregate actual bound effective states rather than abstract parent selections', () => {
  const start = withViewerLayerBranchVisibility(initial());
  const state = setViewerInteractionLayerMode(start, 'architecture-walls', 'hidden');
  const available = ['architecture', 'architecture-walls', 'architecture-walls-party', 'architecture-walls-interior'];
  const actual = ['architecture-walls-party', 'architecture-walls-interior'];
  const wall = items(state, available, { boundNodeIds: actual }).find(item => item.id === 'architecture-walls');
  expect(wall?.mode).toBe('visible');
  const mixed = setViewerInteractionLayerMode(state, 'architecture-walls-party', 'hidden');
  const rows = items(mixed, available, { boundNodeIds: actual });
  expect(rows.find(item => item.id === 'architecture-walls')?.mode).toBe('mixed');
  expect(rows.find(item => item.id === 'architecture')?.mode).toBe('mixed');
  const boundParent = items(state, available, { boundNodeIds: ['architecture-walls', ...actual] });
  expect(boundParent.find(item => item.id === 'architecture-walls')?.mode).toBe('mixed');
  expect(items(mixed, available, { boundNodeIds: ['architecture-walls-interior'] })
    .find(item => item.id === 'architecture-walls')?.mode).toBe('visible');
});

test('legacy hidden parent still gates effective child state while retaining its preference', () => {
  const hidden = setViewerInteractionLayerMode(initial(), 'technical', 'hidden');
  const rows = items(hidden, ['technical', 'technical-ventilation', 'technical-heating']);
  expect(rows.find(item => item.id === 'technical')?.mode).toBe('hidden');
  expect(rows.find(item => item.id === 'technical-ventilation')).toMatchObject({
    mode: 'visible', effectiveMode: 'hidden',
  });
});

test('invalid persisted preset never creates an empty-looking browser selection', async ({ page }) => {
  const base = initial();
  await mount(page, { ...base, layerPresetState: { ...base.layerPresetState!, selected: 'constructor' as any } }, ['roof']);
  await expect(page.getByRole('combobox', { name: 'Näkymän esiasetus' })).toHaveValue('d-2f');
  await expect(page.getByText('Oletusnäkyvyys', { exact: true })).toBeVisible();
  await page.evaluate((state) => (window as any).layerPanel.update(state, ['roof']), {
    ...createViewerInteractionState('electrical'),
    layerPresetState: { ...base.layerPresetState!, selected: '__proto__' as any, customized: true },
  });
  await expect(page.getByRole('combobox', { name: 'Näkymän esiasetus' })).toHaveValue('');
  await expect(page.getByText('Ei valittua esiasetusta', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Palauta näkyvyys' })).toBeDisabled();
});

test('direct mode buttons emit actions, preset scopes remain guarded and missing roof is explained', async ({ page }) => {
  await mount(page, initial(), ['roof', 'architecture-walls', 'architecture-walls-party'], {});
  await expect(page.locator('[data-layer-preset-panel] select')).toHaveCount(1);
  const coverageNote = page.locator('[data-layer-source-coverage]');
  await expect(coverageNote).toBeHidden();
  await expect(modeButton(page, 'roof', 'ghost')).toHaveAttribute('aria-pressed', 'true');
  await modeButton(page, 'roof', 'visible').click();
  await page.getByRole('combobox', { name: 'Näkymän esiasetus' }).selectOption('site');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([
    ['mode', 'roof', 'visible'], ['preset', 'site'],
  ]);
  await page.evaluate(state => (window as any).layerPanel.update(state, ['architecture-walls']), initial());
  await expect(page.locator('[data-layer-roof-unavailable]')).toBeVisible();
  await expect(row(page, 'roof')).toHaveCount(0);
  const custom = setViewerInteractionLayerMode(initial(), 'roof', 'visible');
  await page.evaluate(state => (window as any).layerPanel.update(state, ['roof'], {
    availablePresets: ['d-apartment', 'd-1f', 'd-2f'], boundNodeIds: ['roof'],
    sourceCoverageNote: 'WC:n lattia ja itäseinä ovat yksi yhdistetty osa. Se jää ryhmäohjauksen ulkopuolelle.',
  }), custom);
  await expect(coverageNote).toBeVisible();
  await expect(coverageNote).toHaveText('WC:n lattia ja itäseinä ovat yksi yhdistetty osa. Se jää ryhmäohjauksen ulkopuolelle.');
  const picker = page.getByRole('combobox', { name: 'Näkymän esiasetus' });
  await expect(picker.locator('option[value="site"]')).toHaveJSProperty('disabled', true);
  await expect(picker.locator('option[value="d-2f"]')).toHaveJSProperty('disabled', false);
  await page.evaluate(state => (window as any).layerPanel.update(state, ['roof']), custom);
  await expect(picker.locator('option[value="site"]')).toHaveJSProperty('disabled', true);
  await expect(coverageNote).toBeVisible();
  await page.getByRole('button', { name: 'Palauta näkyvyys' }).click();
  await page.evaluate(state => (window as any).layerPanel.update(state, ['roof'], { disabled: true }), custom);
  await expect(coverageNote).toBeHidden();
  await expect(coverageNote).toHaveText('');
  await expect(picker).toBeDisabled();
  await expect(modeButton(page, 'roof', 'visible')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Palauta näkyvyys' })).toBeDisabled();
});

test('disclosure is independent and branch commands allow a visible child under a hidden parent', async ({ page }) => {
  await mount(page, withViewerLayerBranchVisibility(initial()), treeIds, { boundNodeIds: boundIds }, true);
  const wallDisclosure = page.locator('[data-layer-disclosure="architecture-walls"]');
  await expect(wallDisclosure).toHaveAttribute('aria-expanded', 'false');
  await expand(page, 'architecture-walls');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);
  await modeButton(page, 'architecture-walls', 'ghost').click();
  await expect(modeButton(page, 'architecture-walls-party', 'ghost')).toHaveAttribute('aria-pressed', 'true');
  await modeButton(page, 'architecture-walls-exterior', 'visible').click();
  await expect(row(page, 'architecture-walls')).toHaveAttribute('data-mode', 'mixed');
  await expect(row(page, 'architecture-walls').locator('.yl-layer-preset-mixed')).toHaveText('Eri tiloja');
  await wallDisclosure.click();
  await expect(wallDisclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(row(page, 'architecture-walls')).toHaveAttribute('data-mode', 'mixed');
  await expand(page, 'architecture-walls');
  await modeButton(page, 'architecture', 'hidden').click();
  await modeButton(page, 'architecture-walls-party', 'visible').click();
  await expect(row(page, 'architecture-walls-party')).toHaveAttribute('data-effective-mode', 'visible');
  await expect(row(page, 'architecture')).toHaveAttribute('data-mode', 'mixed');
  await expand(page, 'furniture');
  await expect(modeButton(page, 'architecture-fixtures', 'visible')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-layer-branch="furniture"] > .yl-layer-preset-row [data-layer-mode="hidden"]').click();
  const event = await page.evaluate(() => (window as any).layerEvents.at(-1));
  expect(event).toEqual(['modes', ['architecture-fixtures', 'architecture-other'], 'hidden']);
  await expect(row(page, 'technical-ventilation')).toHaveAttribute('data-effective-mode', 'visible');
});

test('references open separately and no source-only routes enter the physical device tree', async ({ page }) => {
  await mount(page);
  const refs = page.locator('[data-layer-branch="references"]');
  await expect(refs.locator('[data-layer-disclosure="references"]')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('[data-layer-branch="technical"] [data-layer-node^="locus"]').count()).toBe(0);
  await expand(page, 'references');
  await expand(page, 'locus');
  await expect(refs.getByRole('group', { name: 'Vesi, Locus, näkyvyys', exact: true })).toBeVisible();
  await expect(refs.getByRole('group', { name: 'IV 1974, suunnitelma, näkyvyys', exact: true })).toBeVisible();
  // Every depth keeps the same mode columns. The fixture's separate HUD
  // may extend outside the content panel, but its controls must not do so.
  const alignment = await refs.locator('.yl-layer-mode-controls').evaluateAll(controls => {
    const panel = document.getElementById('layers-panel')!;
    const standard = document.querySelector('[data-layer-node="technical"] .yl-layer-mode-controls')!;
    return {
      right: standard.getBoundingClientRect().right,
      panelRight: panel.getBoundingClientRect().left + panel.clientWidth,
      overflow: panel.scrollWidth > panel.clientWidth,
      rows: controls.filter(control => control.getClientRects().length > 0).map(control => ({
        right: control.getBoundingClientRect().right,
        buttonEdges: Array.from(control.querySelectorAll('button'))
          .map(button => button.getBoundingClientRect().right),
      })),
    };
  });
  expect(alignment.rows.length).toBeGreaterThan(3);
  expect(alignment.overflow).toBe(false);
  for (const control of alignment.rows) {
    expect(control.right).toBeCloseTo(alignment.right, 0);
    expect(Math.max(...control.buttonEdges)).toBeLessThanOrEqual(alignment.panelRight + 1);
  }
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);
  await page.evaluate(state => (window as any).layerPanel.update(state, []), initial());
  await expect(page.locator('[data-layer-node]')).toHaveCount(0);
  await expect(refs.getByText('Tässä näkymässä ei ole erikseen luokiteltuja lähteitä tai viitteitä.')).toBeVisible();
  await expect(page.getByText('Näkyvyys koskee vain lähteeseen sidottuja osia. Kalusteen etupintojen piilotus ei välttämättä piilota runkoa.')).toBeVisible();
});

test('keyed mobile updates preserve expansion, focused button, scroll and readable dark contrast', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const base = withViewerLayerBranchVisibility(initial());
  await mount(page, base);
  await expand(page, 'architecture-walls');
  await expand(page, 'furniture');
  await expand(page, 'references');
  await expand(page, 'locus');
  const focused = modeButton(page, 'technical-electrical', 'visible');
  await focused.focus();
  await focused.evaluate(el => { (window as any).oldFocusedControl = el; });
  const before = await page.locator('#layers-panel').evaluate(el => el.scrollTop);
  expect(before).toBeGreaterThan(100);
  const changed = setViewerInteractionLayerBranchMode(base, 'architecture-walls-party', 'hidden', treeIds);
  await page.evaluate(state => (window as any).layerPanel.update(state, (window as any).layerIds), changed);
  await expect(focused).toBeFocused();
  expect(await focused.evaluate(el => el === (window as any).oldFocusedControl)).toBe(true);
  await expect(page.locator('[data-layer-disclosure="architecture-walls"]')).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('#layers-panel').evaluate(el => el.scrollTop)).toBeCloseTo(before, 0);
  expect(await focused.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await focused.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
  expect(await page.locator('#layers-panel').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
  const contrast = await page.locator('[data-layer-preset-panel]').evaluate(panel => {
    const luminance = (value: string) => {
      const rgb = value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(c =>
        c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4);
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const background = luminance(getComputedStyle(panel).backgroundColor);
    return ['.yl-layer-preset-field', '.yl-layer-preset-help', '[data-layer-preset-customized]', '.yl-layer-node-label']
      .map(selector => {
        const ink = luminance(getComputedStyle(panel.querySelector(selector)!).color);
        return (Math.max(ink, background) + .05) / (Math.min(ink, background) + .05);
      });
  });
  expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
  const stacking = await page.locator('#layers-panel').evaluate(el => ({
    content: +getComputedStyle(el).zIndex, hud: +getComputedStyle(document.querySelector('#coordinate-panel')!).zIndex,
  }));
  expect(stacking.content).toBeGreaterThan(stacking.hud);
  await expect(page.locator('#coordinate-panel')).toBeVisible();
  await page.evaluate(() => (window as any).layerPanel.destroy());
  await expect(page.locator('[data-layer-preset-panel]')).toHaveCount(0);
});

test('legacy ancestor effects are explained but branch-mode choices become independent', async ({ page }) => {
  const hidden = setViewerInteractionLayerMode(initial(), 'technical', 'hidden');
  const ids = ['technical', 'technical-ventilation', 'technical-heating'];
  await mount(page, hidden, ids, { boundNodeIds: ['technical-ventilation', 'technical-heating'] });
  const device = row(page, 'technical-ventilation');
  await expect(device.locator('[data-layer-parent-effect]')).toContainText('Oma asetus säilyy');
  await expect(modeButton(page, 'technical-ventilation', 'visible')).toHaveAttribute('aria-description', /Oma asetus säilyy/);
  const branch = setViewerInteractionLayerBranchMode(hidden, 'technical-ventilation', 'visible', ids);
  await page.evaluate(({ state, available }) => (window as any).layerPanel.update(state, available), { state: branch, available: ids });
  await expect(device).toHaveAttribute('data-effective-mode', 'visible');
  await expect(device.locator('[data-layer-parent-effect]')).toBeHidden();
  await expect(modeButton(page, 'technical-ventilation', 'visible')).not.toHaveAttribute('aria-description');
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);
});

test('desktop layer disclosure reaches 44px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mount(page);
  const trigger = page.locator('[data-layer-disclosure="architecture-walls"]');
  const bounds = await trigger.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(44);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('#layers-panel').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
});

test('Layers visibility legend stays in view while a long tree scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mount(page);
  await expand(page, 'architecture-walls');
  await expand(page, 'furniture');
  await expand(page, 'references');
  await expand(page, 'locus');
  const panel = page.locator('#layers-panel');
  const legend = page.locator('[data-layer-preset-panel] .yl-layer-preset-legend');
  const scrollTop = await panel.evaluate(el => { el.scrollTop = 500; return el.scrollTop; });
  expect(scrollTop).toBeGreaterThan(100);
  const panelBox = await panel.boundingBox();
  const legendBox = await legend.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(legendBox).not.toBeNull();
  expect(legendBox!.y).toBeGreaterThanOrEqual(panelBox!.y - 1);
  expect(legendBox!.y).toBeLessThanOrEqual(panelBox!.y + 16);
  await expect(legend).toContainText('Näkyvä');
  await expect(legend).toContainText('Himmeä');
  await expect(legend).toContainText('Piilossa');
  expect(await panel.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
  expect(await page.evaluate(() => (window as any).layerEvents)).toEqual([]);
});
