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
