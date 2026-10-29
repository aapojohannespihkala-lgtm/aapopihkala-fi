import { expect, test } from '@playwright/test';
import {
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  getViewerLayerParentMode,
  resolveScopedViewerLayerMode,
  setViewerLayerMode,
  viewerArchitecturalWallChildNodeIds,
  viewerLayerNodeCapabilities,
} from '../../src/scripts/privateModelLayerHierarchyState';
import {
  applyViewerLayerPreset,
  createViewerInteractionState,
  patchViewerLayerControls,
  resetViewerLayerPresetToDefaults,
  setViewerCameraView,
  setViewerInteractionLayerMode,
  viewerLayerPresetScopes,
} from '../../src/scripts/privateModelViewerState';

test('Layers WP1 presets preserve camera while selecting explicit area and floor', () => {
  const customCamera = setViewerCameraView(createViewerInteractionState(), 'elev-neg-y');
  const upstairs = applyViewerLayerPreset(customCamera, 'd-2f');
  expect(upstairs.cameraView).toBe('elev-neg-y');
  expect(upstairs.researchPreset).toBe('d-2f');
  expect(viewerLayerPresetScopes['d-2f']).toEqual({ area: 'D', floor: '2F' });
  expect(upstairs.layerPresetState?.selected).toBe('d-2f');
  expect(upstairs.layerPresetState?.customized).toBe(false);
  expect(upstairs.layerPresetState?.modes.roof).toBe('ghost');
  expect(upstairs.layers.roofVisible).toBe(false); // safe until WP2/WP3
  expect(customCamera.layerPresetState).toBeUndefined(); // legacy shape unchanged
});

test('Layers WP1 manual ghost, mixed parent, restoration and no preset mutation', () => {
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const original = { ...state.layerPresetState!.modes };
  state = setViewerInteractionLayerMode(state, 'architecture-walls-party', 'ghost');
  expect(state.layerPresetState?.customized).toBe(true);
  expect(state.layerPresetState?.selected).toBe('d-2f');
  expect(state.layers.architecturePartyWallsVisible).toBe(true);
  expect(getViewerLayerParentMode(state.layerPresetState!.modes, 'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('mixed');
  const back = setViewerInteractionLayerMode(state, 'architecture-walls-party', 'visible');
  expect(back.layerPresetState?.customized).toBe(false);
  expect(back.layerPresetState?.modes).toEqual(original);
  state = setViewerInteractionLayerMode(state, 'architecture-walls', 'hidden');
  expect(getViewerLayerEffectiveMode(state.layerPresetState!.modes, 'architecture-walls-party')).toBe('hidden');
  expect(state.layerPresetState?.modes['architecture-walls-party']).toBe('ghost');
  state = setViewerInteractionLayerMode(state, 'architecture-walls', 'visible');
  expect(getViewerLayerEffectiveMode(state.layerPresetState!.modes, 'architecture-walls-party')).toBe('ghost');
});

test('Layers WP1 legacy boolean and opacity updates remain compatible after opt-in', () => {
  const old = createViewerInteractionState('infra');
  const updatedOld = patchViewerLayerControls(old, { locusWaterVisible: false });
  expect(updatedOld.layerPresetState).toBeUndefined();
  expect(updatedOld.layers.locusWaterVisible).toBe(false);
  let modern = applyViewerLayerPreset(old, 'infra');
  modern = setViewerInteractionLayerMode(modern, 'locus-water', 'ghost');
  expect(modern.layerPresetState?.modes['locus-water']).toBe('ghost');
  modern = patchViewerLayerControls(modern, { locusWaterVisible: false, roofOpacity: 0.4 });
  expect(modern.layerPresetState?.modes['locus-water']).toBe('hidden');
  expect(modern.layerPresetState?.customized).toBe(true);
  expect(modern.layers.roofOpacity).toBe(0.4);
  const reset = resetViewerLayerPresetToDefaults(modern);
  expect(reset.layerPresetState?.selected).toBe('infra');
  expect(reset.layerPresetState?.customized).toBe(false);
  expect(reset.layers.roofOpacity).toBe(1);
  expect(reset.layers.locusWaterVisible).toBe(true);
  expect(reset.cameraView).toBe(modern.cameraView);
});

test('Layers WP1 explicit scope/storey gate beats even a visible or ghost layer', () => {
  for (const mode of ['visible', 'ghost', 'hidden'] as const) {
    expect(resolveScopedViewerLayerMode(mode, false, true)).toBe('hidden');
    expect(resolveScopedViewerLayerMode(mode, true, false)).toBe('hidden');
    expect(resolveScopedViewerLayerMode(mode, true, true)).toBe(mode);
  }
  const map = createViewerLayerModeMap(createViewerInteractionState().layers);
  const ghostWalls = setViewerLayerMode(map, 'architecture-walls', 'ghost');
  expect(getViewerLayerEffectiveMode(ghostWalls, 'architecture-walls-exterior')).toBe('ghost');
  expect(getViewerLayerEffectiveMode(map, 'architecture-walls-exterior')).toBe('visible');
  expect(Object.keys(viewerLayerNodeCapabilities).length).toBe(19);
});

test('Layers WP1 select a different preset restores that presets defaults, not camera', () => {
  let current = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  current = setViewerInteractionLayerMode(current, 'architecture-doors', 'hidden');
  const withCamera = setViewerCameraView(current, 'bottom');
  const switched = applyViewerLayerPreset(withCamera, 'whole-building');
  expect(switched.cameraView).toBe('bottom');
  expect(switched.layerPresetState?.customized).toBe(false);
  expect(switched.layerPresetState?.modes['architecture-doors']).toBe('visible');
  expect(switched.layerPresetState?.modes.roof).toBe('visible');
});
