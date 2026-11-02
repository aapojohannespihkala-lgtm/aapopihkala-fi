import { expect, test } from '@playwright/test';
import { createViewerLayerStateForModelLoad, mergeViewerLayerState, type EdgeMode } from '../../src/scripts/privateModelLayerState';
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
  patchViewerPresentationStyle,
  resetViewerLayerPresetToDefaults,
  setViewerCameraView,
  setViewerInteractionLayerMode,
  setViewerInteractionLayerBranchMode,
  withViewerLayerBranchVisibility,
  viewerLayerPresetScopes,
} from '../../src/scripts/privateModelViewerState';

test('R1 branch commands reveal only the requested available child after hiding its group', () => {
  const available = ['technical', 'technical-ventilation', 'technical-electrical'];
  let state = withViewerLayerBranchVisibility(applyViewerLayerPreset(createViewerInteractionState(), 'd-2f'));
  const camera = state.cameraView;
  state = setViewerInteractionLayerBranchMode(state, 'technical', 'hidden', available);
  state = setViewerInteractionLayerBranchMode(state, 'technical-ventilation', 'visible', available);
  expect(state.layerPresetState?.visibilityTree).toBe('branch');
  expect(getViewerLayerEffectiveMode(state.layerPresetState!.modes, 'technical-ventilation', true)).toBe('visible');
  expect(getViewerLayerEffectiveMode(state.layerPresetState!.modes, 'technical-electrical', true)).toBe('hidden');
  expect(state.cameraView).toBe(camera);
  expect(state.researchPreset).toBe('d-2f');
  expect(state.layerPresetState?.modes['technical-heating']).toBe('visible'); // unavailable: preference untouched
});

test('R1 physical building commands leave fixtures and reference helpers independent', () => {
  const available = ['architecture', 'architecture-walls', 'architecture-walls-interior',
    'roof', 'architecture-fixtures', 'architecture-review-helpers'];
  let state = withViewerLayerBranchVisibility(applyViewerLayerPreset(createViewerInteractionState(), 'whole-building'));
  state = setViewerInteractionLayerBranchMode(state, 'architecture', 'hidden', available);
  const modes = state.layerPresetState!.modes;
  expect(modes.roof).toBe('hidden');
  expect(modes['architecture-walls-interior']).toBe('hidden');
  expect(modes['architecture-fixtures']).toBe('visible');
  expect(modes['architecture-review-helpers']).toBe('visible');
});

test('R1 migration preserves effective legacy visibility and legacy maps retain their gates', () => {
  let legacy = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  legacy = setViewerInteractionLayerMode(legacy, 'technical', 'ghost');
  const before = legacy.layerPresetState!.modes;
  expect(getViewerLayerEffectiveMode(before, 'technical-ventilation')).toBe('ghost');
  const modern = withViewerLayerBranchVisibility(legacy);
  expect(modern.layerPresetState!.modes['technical-ventilation']).toBe('ghost');
  const own = { ...before, technical: 'hidden' as const };
  expect(getViewerLayerEffectiveMode(own, 'technical-ventilation')).toBe('hidden');
  expect(getViewerLayerEffectiveMode(own, 'technical-ventilation', true)).toBe('visible');
  expect(legacy.layerPresetState?.visibilityTree).toBeUndefined();
});

test('R1 unavailable commands are no-ops and preset/reset/opacity keep the new tree contract', () => {
  const start = withViewerLayerBranchVisibility(applyViewerLayerPreset(createViewerInteractionState(), 'd-2f'));
  expect(setViewerInteractionLayerBranchMode(start, 'roof', 'visible', ['technical'])).toBe(start);
  expect(setViewerInteractionLayerBranchMode(start, 'untrusted' as never, 'visible', ['untrusted'])).toBe(start);
  let state = setViewerInteractionLayerBranchMode(start, 'technical', 'ghost', ['technical', 'technical-ventilation']);
  state = patchViewerLayerControls(state, { roofOpacity: 0.4 });
  expect(state.layerPresetState?.visibilityTree).toBe('branch');
  state = applyViewerLayerPreset(state, 'd-1f');
  expect(state.layerPresetState?.visibilityTree).toBe('branch');
  state = resetViewerLayerPresetToDefaults(state);
  expect(state.layerPresetState?.visibilityTree).toBe('branch');
  expect(state.layerPresetState?.customized).toBe(false);
  expect(state.cameraView).toBe(start.cameraView);
});

test('invalid runtime edge modes preserve valid legacy and viewer presentation state', () => {
  const legacy = createViewerLayerStateForModelLoad();
  const viewer = createViewerInteractionState('d-2f');
  const invalidModes: unknown[] = ['unsupported', '', undefined, null, 0, { edgeMode: 'none' }];
  for (const invalid of invalidModes) {
    const value = invalid as EdgeMode;
    const merged = mergeViewerLayerState(legacy, { edgeMode: value });
    const patched = patchViewerPresentationStyle(viewer, { edgeMode: value });
    expect(merged.edgeMode).toBe('visible');
    expect(patched.presentation.edgeMode).toBe('visible');
    expect(patched.cameraView).toBe(viewer.cameraView);
    expect(patched.layers).toEqual(viewer.layers);
  }
  for (const valid of ['none', 'object', 'unified', 'visible'] as const) {
    expect(mergeViewerLayerState(legacy, { edgeMode: valid }).edgeMode).toBe(valid);
    expect(patchViewerPresentationStyle(viewer, { edgeMode: valid }).presentation.edgeMode).toBe(valid);
  }
  // A malformed patch must also preserve explicitly customized source state.
  const customLegacy = mergeViewerLayerState(legacy, { edgeMode: 'none' });
  const customViewer = patchViewerPresentationStyle(viewer, { edgeMode: 'object' });
  expect(mergeViewerLayerState(customLegacy, {
    edgeMode: 'unsupported' as EdgeMode,
  }).edgeMode).toBe('none');
  expect(patchViewerPresentationStyle(customViewer, {
    edgeMode: undefined,
  }).presentation.edgeMode).toBe('object');
  expect(legacy.edgeMode).toBe('visible');
  expect(viewer.presentation.edgeMode).toBe('visible');
});

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

test('Layers WP1 unknown runtime mode cannot expose legacy or semantic layers', () => {
  const initial = applyViewerLayerPreset(
    setViewerCameraView(createViewerInteractionState(), 'elev-pos-x'),
    'd-2f',
  );
  // Persisted/programmatic runtime data is not necessarily TypeScript-validated.
  const invalid = 'unsupported' as Parameters<typeof setViewerInteractionLayerMode>[2];
  const result = setViewerInteractionLayerMode(initial, 'technical-electrical', invalid);
  expect(result.layerPresetState?.modes['technical-electrical']).toBe('hidden');
  expect(getViewerLayerEffectiveMode(result.layerPresetState!.modes, 'technical-electrical'))
    .toBe('hidden');
  expect(result.layers.technicalElectricalVisible).toBe(false);
  expect(result.layerPresetState?.customized).toBe(true);
  expect(result.cameraView).toBe('elev-pos-x');

  const missing = setViewerInteractionLayerMode(
    initial, 'architecture-doors',
    undefined as unknown as Parameters<typeof setViewerInteractionLayerMode>[2],
  );
  expect(missing.layerPresetState?.modes['architecture-doors']).toBe('hidden');
  expect(missing.layers.architectureDoorsVisible).toBe(false);
  const nullMode = setViewerInteractionLayerMode(
    initial, 'architecture-walls',
    null as unknown as Parameters<typeof setViewerInteractionLayerMode>[2],
  );
  expect(nullMode.layerPresetState?.modes['architecture-walls']).toBe('hidden');
  expect(nullMode.layers.architectureWallsVisible).toBe(false);
  const restored = resetViewerLayerPresetToDefaults(result);
  expect(restored.layerPresetState?.modes['technical-electrical']).toBe('visible');
  expect(restored.layers.technicalElectricalVisible).toBe(true);
  expect(restored.cameraView).toBe('elev-pos-x');
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
  expect(Object.keys(viewerLayerNodeCapabilities).length).toBe(23);
});

test('Layers WP1 unknown runtime IDs cannot mutate or crash semantic visibility', () => {
  const modes = createViewerLayerModeMap(createViewerInteractionState().layers);
  const validVisible = getViewerLayerEffectiveMode(modes, 'architecture-doors');
  expect(validVisible).toBe('visible');

  for (const id of ['rogue-layer', 'technical-unknown', '__proto__', 'constructor']) {
    const nodeId = id as Parameters<typeof setViewerLayerMode>[1];
    // Even a source-supplied visible/ghost map entry cannot supply a missing capability.
    for (const mode of ['visible', 'ghost'] as const) {
      const malformed = { ...modes, [id]: mode } as typeof modes;
      expect(getViewerLayerEffectiveMode(malformed, nodeId)).toBe('hidden');
      expect(setViewerLayerMode(modes, nodeId, mode)).toBe(modes);
      expect(Object.keys(modes)).not.toContain(id);
    }
  }

  // Valid layer controls and their hierarchical visibility still work.
  const ghostDoors = setViewerLayerMode(modes, 'architecture-doors', 'ghost');
  expect(ghostDoors).not.toBe(modes);
  expect(getViewerLayerEffectiveMode(ghostDoors, 'architecture-doors')).toBe('ghost');
  expect(getViewerLayerEffectiveMode(modes, 'architecture-doors')).toBe('visible');
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

test('visible parent with all hidden children is mixed and preserves child preferences', () => {
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  for (const id of viewerArchitecturalWallChildNodeIds) {
    state = setViewerInteractionLayerMode(state, id, 'hidden');
  }
  const modes = state.layerPresetState!.modes;
  expect(modes['architecture-walls']).toBe('visible');
  for (const id of viewerArchitecturalWallChildNodeIds) {
    expect(getViewerLayerEffectiveMode(modes, id)).toBe('hidden');
  }
  expect(getViewerLayerParentMode(modes, 'architecture-walls', viewerArchitecturalWallChildNodeIds))
    .toBe('mixed');
  const hiddenParent = setViewerInteractionLayerMode(state, 'architecture-walls', 'hidden');
  expect(getViewerLayerParentMode(hiddenParent.layerPresetState!.modes,
    'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('hidden');
  const restored = setViewerInteractionLayerMode(hiddenParent, 'architecture-walls', 'visible');
  expect(getViewerLayerParentMode(restored.layerPresetState!.modes,
    'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('mixed');
  for (const id of viewerArchitecturalWallChildNodeIds) {
    expect(restored.layerPresetState!.modes[id]).toBe('hidden');
  }
  const ghostParent = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  expect(getViewerLayerParentMode(ghostParent.layerPresetState!.modes,
    'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('mixed');
});

test('ghost parent preserves visible child preference as mixed, without changing effective ghost', () => {
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const parentGhost = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  const modes = parentGhost.layerPresetState!.modes;
  expect(modes['architecture-walls']).toBe('ghost');
  for (const child of viewerArchitecturalWallChildNodeIds) {
    expect(modes[child]).toBe('visible');
    expect(getViewerLayerEffectiveMode(modes, child)).toBe('ghost');
  }
  // Effective presentation alone would incorrectly hide the preference conflict.
  expect(getViewerLayerParentMode(modes, 'architecture-walls', viewerArchitecturalWallChildNodeIds))
    .toBe('mixed');

  let allGhost = parentGhost;
  for (const child of viewerArchitecturalWallChildNodeIds) {
    allGhost = setViewerInteractionLayerMode(allGhost, child, 'ghost');
  }
  expect(getViewerLayerParentMode(allGhost.layerPresetState!.modes,
    'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('ghost');

  // A hidden parent remains authoritative; child preferences remain intact.
  const hidden = setViewerInteractionLayerMode(parentGhost, 'architecture-walls', 'hidden');
  expect(getViewerLayerParentMode(hidden.layerPresetState!.modes,
    'architecture-walls', viewerArchitecturalWallChildNodeIds)).toBe('hidden');
  expect(hidden.layerPresetState!.modes['architecture-walls-party']).toBe('visible');

  // An ancestor's ghost only affects rendering, not this parent's own choice.
  const ancestorGhost = setViewerInteractionLayerMode(state, 'architecture', 'ghost');
  const ancestorModes = ancestorGhost.layerPresetState!.modes;
  expect(getViewerLayerEffectiveMode(ancestorModes, 'architecture-walls')).toBe('ghost');
  expect(getViewerLayerParentMode(ancestorModes, 'architecture-walls',
    viewerArchitecturalWallChildNodeIds)).toBe('visible');

  // Fail closed if an imported mode map has an unknown parent preference.
  const malformed = { ...modes, 'architecture-walls': undefined } as unknown as typeof modes;
  expect(getViewerLayerParentMode(malformed, 'architecture-walls',
    viewerArchitecturalWallChildNodeIds)).toBe('hidden');
});
