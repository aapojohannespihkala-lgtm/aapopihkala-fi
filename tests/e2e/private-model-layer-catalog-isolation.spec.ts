import { expect, test } from '@playwright/test';
import {
  buildViewerLayerPanelModel,
  resolveViewerLayerPanelDispatch,
} from '../../src/scripts/privateModelLayersPresetControls';
import {
  applyViewerLayerPreset,
  createViewerInteractionState,
  setViewerInteractionLayerBranchMode,
} from '../../src/scripts/privateModelViewerState';
import type { ViewerLayerNodeId, ViewerLayerVisibilityMode } from '../../src/scripts/privateModelLayerHierarchyState';

const available: ViewerLayerNodeId[] = [
  'architecture', 'architecture-walls', 'architecture-walls-exterior',
  'architecture-fixtures', 'architecture-other', 'roof',
  'technical', 'technical-electrical',
];
const bound: ViewerLayerNodeId[] = [
  'architecture-walls-exterior', 'roof',
  'architecture-fixtures', 'architecture-other', 'technical-electrical',
];

const modelNode = (state: ReturnType<typeof createViewerInteractionState>, id: string) => {
  const panel = buildViewerLayerPanelModel(state, available, { boundNodeIds: bound });
  const visit = (nodes: typeof panel.roots): (typeof panel.roots)[number] | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const nested = visit(node.children);
      if (nested) return nested;
    }
  };
  const node = visit(panel.roots);
  expect(node, `Catalog node ${id} must exist`).toBeDefined();
  return node!;
};

const action = (state: ReturnType<typeof createViewerInteractionState>, id: string, mode: ViewerLayerVisibilityMode) => {
  const dispatch = resolveViewerLayerPanelDispatch(modelNode(state, id), new Set(available));
  if (dispatch.kind === 'branch') expect(dispatch.ids).toHaveLength(1);
  for (const target of dispatch.ids) {
    state = setViewerInteractionLayerBranchMode(state, target, mode, available);
  }
  return { state, dispatch };
};

test('Rakennusosat controls only its catalog descendants, never furniture', () => {
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  state = setViewerInteractionLayerBranchMode(state, 'architecture-fixtures', 'ghost', available);
  state = setViewerInteractionLayerBranchMode(state, 'architecture-other', 'visible', available);
  state = setViewerInteractionLayerBranchMode(state, 'technical-electrical', 'ghost', available);
  const initial = state.layerPresetState!.modes;
  const hidden = action(state, 'architecture', 'hidden');
  expect(hidden.dispatch).toEqual({ kind: 'batch', ids: ['architecture-walls-exterior', 'roof'] });
  expect(hidden.state.layerPresetState!.modes['architecture-walls-exterior']).toBe('hidden');
  expect(hidden.state.layerPresetState!.modes.roof).toBe('hidden');
  expect(hidden.state.layerPresetState!.modes['architecture-fixtures']).toBe(initial['architecture-fixtures']);
  expect(hidden.state.layerPresetState!.modes['architecture-other']).toBe(initial['architecture-other']);
  expect(hidden.state.layerPresetState!.modes['technical-electrical']).toBe(initial['technical-electrical']);
  state = action(hidden.state, 'architecture', 'visible').state;
  expect(state.layerPresetState!.modes['architecture-fixtures']).toBe(initial['architecture-fixtures']);
  expect(state.layerPresetState!.modes['architecture-other']).toBe(initial['architecture-other']);
});

test('furniture-only and individual walls commands do not cross groups', () => {
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const furniture = action(state, 'furniture', 'hidden');
  expect(furniture.dispatch).toEqual({ kind: 'batch', ids: ['architecture-fixtures', 'architecture-other'] });
  expect(furniture.state.layerPresetState!.modes['architecture-walls-exterior'])
    .toBe(state.layerPresetState!.modes['architecture-walls-exterior']);
  const wall = action(furniture.state, 'architecture-walls-exterior', 'visible');
  expect(wall.dispatch).toEqual({ kind: 'branch', ids: ['architecture-walls-exterior'] });
  expect(wall.state.layerPresetState!.modes['architecture-fixtures']).toBe('hidden');
  expect(wall.state.layerPresetState!.modes['architecture-other']).toBe('hidden');
});

test('unclassified architecture ancestor cannot be dispatched as broad gate', () => {
  const node = {
    id: 'architecture', layerId: 'architecture' as const,
    commandIds: ['architecture'] as ViewerLayerNodeId[],
  };
  expect(resolveViewerLayerPanelDispatch(node, new Set(available)))
    .toEqual({ kind: 'batch', ids: [] });
});

test('real DOM clicks preserve furniture independently of Rakennusosat parent', async ({ page }) => {
  const { build } = await import('esbuild');
  const bundle = await build({
    stdin: {
      contents: `export {
        mountViewerLayerPresetPanel,
      } from './src/scripts/privateModelLayersPresetControls';
      export {
        createViewerInteractionState, applyViewerLayerPreset,
        setViewerInteractionLayerBranchMode,
      } from './src/scripts/privateModelViewerState';`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'iife',
    globalName: 'YlisrinneCatalogIsolation', write: false,
  });
  await page.setContent('<div id="layer-host"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate(() => {
    const app = (window as any).YlisrinneCatalogIsolation;
    const ids = [
      'architecture', 'architecture-walls', 'architecture-walls-exterior',
      'architecture-fixtures', 'architecture-other', 'roof',
    ];
    const options = { boundNodeIds: [
      'architecture-walls-exterior', 'architecture-fixtures', 'architecture-other', 'roof',
    ] };
    let state = app.applyViewerLayerPreset(app.createViewerInteractionState(), 'whole-building');
    state = app.setViewerInteractionLayerBranchMode(state, 'architecture-fixtures', 'ghost', ids);
    state = app.setViewerInteractionLayerBranchMode(state, 'architecture-other', 'visible', ids);
    (window as any).layerState = state;
    (window as any).layerEvents = [];
    const refresh = () => panel.update((window as any).layerState, ids, options);
    const apply = (id: string, mode: string) => {
      (window as any).layerState = app.setViewerInteractionLayerBranchMode(
        (window as any).layerState, id, mode, ids);
    };
    const panel = app.mountViewerLayerPresetPanel(
      document.getElementById('layer-host'), state, ids, {
        onPresetChange: () => {},
        onLayerModeChange: (id: string, mode: string) => {
          (window as any).layerEvents.push(['branch', id, mode]);
          apply(id, mode);
          refresh();
        },
        onLayerModesChange: (targets: string[], mode: string) => {
          (window as any).layerEvents.push(['batch', [...targets], mode]);
          for (const id of targets) apply(id, mode);
          refresh();
        },
        onReset: () => {},
      }, options);
  });
  const mode = (id: string, value: string) =>
    page.locator(`[data-layer-branch="${id}"] > .yl-layer-preset-row [data-layer-mode="${value}"]`);
  const states = () => page.evaluate(() => {
    const modes = (window as any).layerState.layerPresetState.modes;
    return {
      exterior: modes['architecture-walls-exterior'],
      roof: modes.roof,
      fixtures: modes['architecture-fixtures'],
      other: modes['architecture-other'],
      events: (window as any).layerEvents,
    };
  });
  const initial = await states();
  expect(initial).toMatchObject({ fixtures: 'ghost', other: 'visible' });
  await mode('architecture', 'hidden').click();
  const afterArchitecture = await states();
  expect(afterArchitecture).toMatchObject({
    exterior: 'hidden', roof: 'hidden', fixtures: 'ghost', other: 'visible',
  });
  expect(afterArchitecture.events.at(-1)).toEqual([
    'batch', ['architecture-walls-exterior', 'roof'], 'hidden',
  ]);
  await mode('furniture', 'hidden').click();
  const afterFurniture = await states();
  expect(afterFurniture).toMatchObject({
    exterior: 'hidden', roof: 'hidden', fixtures: 'hidden', other: 'hidden',
  });
  await mode('architecture', 'visible').click();
  const afterRestoringArchitecture = await states();
  expect(afterRestoringArchitecture).toMatchObject({
    exterior: 'visible', roof: 'visible', fixtures: 'hidden', other: 'hidden',
  });
});
