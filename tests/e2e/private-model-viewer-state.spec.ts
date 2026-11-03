import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import {
  isViewerLayerNodeEffectivelyVisible,
  setViewerLayerNodeVisible,
  setViewerRoofOpacity,
  viewerArchitecturalParentVisibilityState,
  viewerArchitecturalRootChildNodeIds,
  viewerArchitecturalWallChildNodeIds,
  viewerLayerNodeCapabilities,
  viewerLocusParentVisibilityState,
  viewerLocusRouteChildNodeIds,
  viewerP161SystemChildNodeIds,
} from '../../src/scripts/privateModelLayerHierarchyState';
import {
  createViewerLayerStateForModelLoad,
  mergeViewerLayerState,
} from '../../src/scripts/privateModelLayerState';
import {
  applyViewerLayerPreset,
  applyViewerResearchPreset,
  createViewerInteractionState,
  formatViewerResearchPresetLabel,
  patchViewerLayerControls,
  patchViewerPresentationStyle,
  resetViewerInteractionStateToPresetDefaults,
  resetViewerLayerPresetToDefaults,
  setViewerCameraView,
  setViewerInteractionLayerMode,
} from '../../src/scripts/privateModelViewerState';

const expectedDefaultChildren = {
  technicalVisible: true,
  technicalVentilationVisible: true,
  technicalHeatingVisible: true,
  technicalElectricalVisible: true,
  locusWaterVisible: true,
  locusWastewaterVisible: true,
  p161KvvVisible: true,
  p161IvPlanVisible: true,
  p161IvSectionVisible: true,
  architectureVisible: true,
  architectureWallsVisible: true,
  architectureExteriorWallsVisible: true,
  architecturePartyWallsVisible: true,
  architectureInteriorWallsVisible: true,
  architectureDoorsVisible: true,
  architectureWindowsVisible: true,
  architectureReviewHelpersVisible: true,
  architectureFloorsVisible: true,
  architectureCeilingsVisible: false,
  architectureFixturesVisible: true,
  architectureOtherVisible: true,
};

test('WP1 malformed persisted preset IDs cannot crash reset or mode/legacy edits', () => {
  const valid = applyViewerLayerPreset(createViewerInteractionState('d-2f'), 'd-2f');
  const baselineModes = valid.layerPresetState!.modes;

  for (const id of ['unknown', '__proto__', 'constructor', 'electrical', '']) {
    const bad = {
      ...valid,
      layerPresetState: {
        ...valid.layerPresetState!,
        selected: id as unknown as NonNullable<typeof valid.layerPresetState>['selected'],
      },
    };

    const reset = resetViewerLayerPresetToDefaults(bad);
    expect(reset.layerPresetState?.selected).toBe('d-2f');
    expect(reset.layerPresetState?.customized).toBe(false);
    expect(reset.layerPresetState?.modes).toEqual(baselineModes);
    expect(reset.cameraView).toBe(valid.cameraView);

    const edited = setViewerInteractionLayerMode(bad, 'roof', 'hidden');
    expect(edited.layerPresetState?.selected).toBe('d-2f');
    expect(edited.layerPresetState?.customized).toBe(true);
    expect(edited.layerPresetState?.modes.roof).toBe('hidden');
    expect(edited.cameraView).toBe(valid.cameraView);

    const legacy = patchViewerLayerControls(bad, { roofVisible: true });
    expect(legacy.layerPresetState?.selected).toBe('d-2f');
    expect(legacy.layerPresetState?.customized).toBe(true);

    const direct = applyViewerLayerPreset(
      valid, id as unknown as NonNullable<typeof valid.layerPresetState>['selected'],
    );
    expect(direct.layerPresetState?.selected).toBe('d-2f');
  }

  // Legitimate presets and the original research views retain their semantics.
  const infra = applyViewerLayerPreset(valid, 'infra');
  expect(resetViewerLayerPresetToDefaults(infra).layerPresetState?.selected).toBe('infra');
  const legacyResearch = createViewerInteractionState('electrical');
  expect(resetViewerLayerPresetToDefaults(legacyResearch).layerPresetState?.selected)
    .toBe('whole-building');
});

test('VUX-C model load defaults replace prior manual layer state without losing review locus intent', () => {
  const priorManual = mergeViewerLayerState(createViewerLayerStateForModelLoad(), {
    roofVisible: false,
    roofOpacity: 0.4,
    locusVisible: true,
    edgeMode: 'none',
  });

  expect(priorManual).toEqual({
    roofVisible: false,
    roofOpacity: 0.4,
    locusVisible: true,
    edgeMode: 'none',
  });
  expect(createViewerLayerStateForModelLoad()).toEqual({
    roofVisible: true,
    roofOpacity: 1,
    locusVisible: false,
    edgeMode: 'visible',
  });
  expect(createViewerLayerStateForModelLoad({ locusVisible: true })).toEqual({
    roofVisible: true,
    roofOpacity: 1,
    locusVisible: true,
    edgeMode: 'visible',
  });
});

test('legacy research presets reject malformed runtime IDs without state loss', () => {
  const selected = setViewerCameraView(
    patchViewerLayerControls(createViewerInteractionState('drainage'), {
      roofOpacity: 0.42, locusVisible: true,
    }),
    'elev-neg-x',
  );
  const fallback = createViewerInteractionState('whole-building');

  for (const incoming of ['unknown', '__proto__', 'constructor', 'toString', '']) {
    const invalid = incoming as Parameters<typeof createViewerInteractionState>[0];

    expect(createViewerInteractionState(invalid)).toEqual(fallback);
    expect(formatViewerResearchPresetLabel(invalid)).toBe('Koko rakennus');
    expect(formatViewerResearchPresetLabel(invalid, true)).toBe('Koko rakennus · mukautettu');

    // Invalid user actions must not wipe an existing research view or camera.
    expect(applyViewerResearchPreset(selected, invalid)).toBe(selected);

    // A malformed saved preset must reset safely to a defined default.
    const persisted = { ...selected, researchPreset: invalid };
    expect(resetViewerInteractionStateToPresetDefaults(persisted)).toEqual(fallback);
  }

  // Runtime inputs can be non-strings even though TS only accepts the union.
  const nonString = null as unknown as Parameters<typeof createViewerInteractionState>[0];
  expect(createViewerInteractionState(nonString)).toEqual(fallback);
  expect(formatViewerResearchPresetLabel(nonString)).toBe('Koko rakennus');
  expect(applyViewerResearchPreset(selected, nonString)).toBe(selected);

  // Legitimate historical research presets and the new Layers camera contract stay intact.
  expect(createViewerInteractionState('electrical').researchPreset).toBe('electrical');
  expect(applyViewerResearchPreset(selected, 'd-2f').cameraView).toBe('plan');
  expect(resetViewerInteractionStateToPresetDefaults(selected).researchPreset).toBe('drainage');
});

test('VUX-E1A research preset labels retain the original context after customization', () => {
  expect(formatViewerResearchPresetLabel('whole-building')).toBe('Koko rakennus');
  expect(formatViewerResearchPresetLabel('drainage')).toBe('Salaojat');
  expect(formatViewerResearchPresetLabel('drainage', true)).toBe('Salaojat · mukautettu');
  expect(formatViewerResearchPresetLabel('electrical', true)).toBe('Sähköt · mukautettu');
});

test('VUX-E1A private-model route visibly preserves preset context when layers are customized', async () => {
  const source = await readFile(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain('id="preset-context-status"');
  expect(source).toContain('formatViewerResearchPresetLabel(');
  expect(source).toContain("layersPanel.addEventListener('change', markResearchPresetCustomized);");
  expect(source).toContain("layersPanel.addEventListener('input', markResearchPresetCustomized);");
  expect(source).toContain('resetResearchPresetCustomization();');
  expect(source).toContain('suppressPresetCustomization = true;');
});

test('VUX-E1A research presets install curated starting state', () => {
  const wholeBuilding = createViewerInteractionState('whole-building');
  const d2 = applyViewerResearchPreset(wholeBuilding, 'd-2f');

  expect(d2).toEqual({
    researchPreset: 'd-2f',
    cameraView: 'plan',
    layers: {
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: false,
      ...expectedDefaultChildren,
    },
    presentation: {
      edgeMode: 'visible',
    },
  });

  const infra = applyViewerResearchPreset(d2, 'infra');
  expect(infra.researchPreset).toBe('infra');
  expect(infra.cameraView).toBe('top');
  expect(infra.layers).toEqual({
    roofVisible: false,
    roofOpacity: 1,
    locusVisible: true,
    ...expectedDefaultChildren,
  });

  const drainage = applyViewerResearchPreset(infra, 'drainage');
  expect(drainage.researchPreset).toBe('drainage');
  expect(drainage.cameraView).toBe('free-3d');
  expect(drainage.layers).toEqual({
    roofVisible: false,
    roofOpacity: 1,
    locusVisible: false,
    ...expectedDefaultChildren,
  });

  const electrical = applyViewerResearchPreset(drainage, 'electrical');
  expect(electrical.researchPreset).toBe('electrical');
  expect(electrical.cameraView).toBe('free-3d');
  expect(electrical.layers).toEqual({
    roofVisible: false,
    roofOpacity: 1,
    locusVisible: false,
    ...expectedDefaultChildren,
  });
});

test('VUX-E1A camera changes preserve research preset, layers, and presentation', () => {
  const d2 = createViewerInteractionState('d-2f');
  const customized = patchViewerLayerControls(
    patchViewerPresentationStyle(d2, { edgeMode: 'none' }),
    {
      roofOpacity: 0.35,
      locusWaterVisible: false,
      p161IvPlanVisible: false,
    },
  );

  const isometric = setViewerCameraView(customized, 'isometric');

  expect(isometric.researchPreset).toBe('d-2f');
  expect(isometric.cameraView).toBe('isometric');
  expect(isometric.layers).toEqual(customized.layers);
  expect(isometric.presentation).toEqual(customized.presentation);
});

test('VUX-E1A layer changes preserve camera and presentation lanes', () => {
  const dApartment = setViewerCameraView(
    createViewerInteractionState('d-apartment'),
    'elev-pos-y',
  );
  const updated = patchViewerLayerControls(dApartment, {
    roofVisible: true,
    roofOpacity: 1.25,
    locusVisible: true,
    locusWastewaterVisible: false,
  });

  expect(updated.researchPreset).toBe('d-apartment');
  expect(updated.cameraView).toBe('elev-pos-y');
  expect(updated.presentation).toEqual(dApartment.presentation);
  expect(updated.layers).toEqual({
    roofVisible: true,
    roofOpacity: 1,
    locusVisible: true,
    ...expectedDefaultChildren,
    locusWastewaterVisible: false,
  });

  const clampedLow = patchViewerLayerControls(updated, { roofOpacity: -0.2 });
  expect(clampedLow.layers.roofOpacity).toBe(0);
});

test('VUX-E1A malformed roof opacity cannot poison legacy or WP1 layer state', () => {
  const initial = createViewerLayerStateForModelLoad();
  const legacy = mergeViewerLayerState(initial, { roofOpacity: Number.NaN });
  expect(legacy.roofOpacity).toBe(1);
  expect(Number.isFinite(legacy.roofOpacity)).toBe(true);

  const initialViewer = createViewerInteractionState('d-2f');
  const updatedViewer = patchViewerLayerControls(initialViewer, {
    roofOpacity: Number.NaN,
  });
  expect(updatedViewer.layers.roofOpacity).toBe(1);
  expect(Number.isFinite(updatedViewer.layers.roofOpacity)).toBe(true);

  // Preserve the existing range-clamping behavior for numeric inputs.
  expect(mergeViewerLayerState(initial, { roofOpacity: -Infinity }).roofOpacity).toBe(0);
  expect(mergeViewerLayerState(initial, { roofOpacity: Infinity }).roofOpacity).toBe(1);
});

test('VUX-E1A presentation changes preserve content, camera, and layer lanes', () => {
  const infra = setViewerCameraView(createViewerInteractionState('infra'), 'isometric');
  const updated = patchViewerPresentationStyle(infra, { edgeMode: 'object' });

  expect(updated.researchPreset).toBe('infra');
  expect(updated.cameraView).toBe('isometric');
  expect(updated.layers).toEqual(infra.layers);
  expect(updated.presentation.edgeMode).toBe('object');
});

test('VUX-E1A a new explicit preset intentionally replaces the curated starting state', () => {
  let state = createViewerInteractionState('d-2f');
  state = setViewerCameraView(state, 'isometric');
  state = patchViewerLayerControls(state, {
    roofVisible: true,
    roofOpacity: 0.4,
    locusVisible: true,
    locusWaterVisible: false,
    p161KvvVisible: false,
  });
  state = patchViewerPresentationStyle(state, { edgeMode: 'none' });

  const nextPreset = applyViewerResearchPreset(state, 'whole-building');

  expect(nextPreset).toEqual({
    researchPreset: 'whole-building',
    cameraView: 'free-3d',
    layers: {
      roofVisible: true,
      roofOpacity: 1,
      locusVisible: false,
      ...expectedDefaultChildren,
    },
    presentation: {
      edgeMode: 'visible',
    },
  });
});

test('VUX-C explicit reset restores the active research preset defaults', () => {
  let state = createViewerInteractionState('d-2f');
  state = setViewerCameraView(state, 'elev-neg-x');
  state = patchViewerLayerControls(state, {
    roofVisible: true,
    roofOpacity: 0.35,
    locusVisible: true,
    locusWaterVisible: false,
    architectureDoorsVisible: false,
  });
  state = patchViewerPresentationStyle(state, { edgeMode: 'none' });

  const reset = resetViewerInteractionStateToPresetDefaults(state);

  expect(reset).toEqual(createViewerInteractionState('d-2f'));
  expect(reset.researchPreset).toBe('d-2f');
});

test('VUX-E3B exposes only contract-derived layer capabilities', () => {
  expect(Object.keys(viewerLayerNodeCapabilities)).toEqual([
    'technical',
    'technical-ventilation',
    'technical-heating',
    'technical-electrical',
    'roof',
    'locus',
    'locus-water',
    'locus-wastewater',
    'p161-kvv-2017',
    'p161-iv-1974-plan',
    'p161-iv-1974-section',
    'architecture',
    'architecture-walls',
    'architecture-walls-exterior',
    'architecture-walls-party',
    'architecture-walls-interior',
    'architecture-doors',
    'architecture-windows',
    'architecture-review-helpers',
    'architecture-floors',
    'architecture-ceilings',
    'architecture-fixtures',
    'architecture-other',
  ]);
  expect(viewerLayerNodeCapabilities.roof).toEqual({
    parent: 'architecture',
    visibility: true,
    opacity: true,
  });
  expect(viewerLayerNodeCapabilities['architecture-walls']).toEqual({
    parent: 'architecture',
    visibility: true,
    opacity: false,
  });
  expect(viewerLayerNodeCapabilities['architecture-walls-exterior'].parent).toBe(
    'architecture-walls',
  );
  for (const id of ['architecture-fixtures', 'architecture-other', 'architecture-review-helpers'] as const) {
    expect(viewerLayerNodeCapabilities[id].parent).toBeNull();
  }
  for (const nodeId of [
    'technical',
    'technical-ventilation',
    'technical-heating',
    'technical-electrical',
    'locus',
    'locus-water',
    'locus-wastewater',
    'p161-kvv-2017',
    'p161-iv-1974-plan',
    'p161-iv-1974-section',
    'architecture',
    'architecture-walls',
    'architecture-walls-exterior',
    'architecture-walls-party',
    'architecture-walls-interior',
    'architecture-doors',
    'architecture-windows',
    'architecture-review-helpers',
    'architecture-floors',
    'architecture-ceilings',
    'architecture-fixtures',
    'architecture-other',
  ] as const) {
    expect(viewerLayerNodeCapabilities[nodeId].opacity).toBe(false);
  }
});

test('unknown runtime node IDs cannot change or impersonate the 1974 IV section layer', () => {
  const initial = createViewerInteractionState('infra').layers;
  expect(initial.locusVisible).toBe(true);
  expect(initial.p161IvSectionVisible).toBe(true);
  expect(isViewerLayerNodeEffectivelyVisible(initial, 'p161-iv-1974-section')).toBe(true);

  for (const id of ['no-such-layer', 'technical-unknown', '__proto__', 'constructor']) {
    // Source-provided IDs can be malformed at runtime despite the TS union.
    const result = setViewerLayerNodeVisible(
      initial, id as Parameters<typeof setViewerLayerNodeVisible>[1], false,
    );
    expect(result).toEqual(initial);
    expect(result.p161IvSectionVisible).toBe(true);
    // A malformed source ID must not borrow the visible IV-section state.
    expect(isViewerLayerNodeEffectivelyVisible(
      initial, id as Parameters<typeof isViewerLayerNodeEffectivelyVisible>[1],
    )).toBe(false);
  }

  // A real ID remains independently adjustable.
  const changed = setViewerLayerNodeVisible(initial, 'p161-iv-1974-section', false);
  expect(changed.p161IvSectionVisible).toBe(false);
  expect(changed.p161IvPlanVisible).toBe(initial.p161IvPlanVisible);
});

test('VUX-E3B parent visibility suppresses children without destroying child preferences', () => {
  let layers = createViewerInteractionState('infra').layers;
  layers = setViewerLayerNodeVisible(layers, 'locus-water', false);
  layers = setViewerLayerNodeVisible(layers, 'p161-iv-1974-plan', false);
  layers = setViewerRoofOpacity(layers, 0.42);

  expect(viewerLocusParentVisibilityState(layers, viewerLocusRouteChildNodeIds)).toBe(
    'mixed',
  );
  expect(viewerLocusParentVisibilityState(layers, viewerP161SystemChildNodeIds)).toBe(
    'mixed',
  );
  expect(isViewerLayerNodeEffectivelyVisible(layers, 'locus-water')).toBe(false);
  expect(isViewerLayerNodeEffectivelyVisible(layers, 'locus-wastewater')).toBe(true);
  expect(layers.roofOpacity).toBeCloseTo(0.42);

  const parentOff = setViewerLayerNodeVisible(layers, 'locus', false);
  expect(viewerLocusParentVisibilityState(parentOff, viewerLocusRouteChildNodeIds)).toBe(
    'off',
  );
  expect(isViewerLayerNodeEffectivelyVisible(parentOff, 'locus-wastewater')).toBe(false);
  expect(parentOff.locusWaterVisible).toBe(false);
  expect(parentOff.locusWastewaterVisible).toBe(true);
  expect(parentOff.p161IvPlanVisible).toBe(false);

  const parentOn = setViewerLayerNodeVisible(parentOff, 'locus', true);
  expect(isViewerLayerNodeEffectivelyVisible(parentOn, 'locus-water')).toBe(false);
  expect(isViewerLayerNodeEffectivelyVisible(parentOn, 'locus-wastewater')).toBe(true);
  expect(isViewerLayerNodeEffectivelyVisible(parentOn, 'p161-iv-1974-plan')).toBe(false);
  expect(isViewerLayerNodeEffectivelyVisible(parentOn, 'p161-kvv-2017')).toBe(true);
});

test('VUX architectural hierarchy preserves parent gating and child preferences', () => {
  let layers = createViewerInteractionState('whole-building').layers;

  layers = setViewerLayerNodeVisible(layers, 'architecture-walls-party', false);
  layers = setViewerLayerNodeVisible(layers, 'architecture-review-helpers', false);

  expect(
    viewerArchitecturalParentVisibilityState(
      layers,
      'architecture-walls',
      viewerArchitecturalWallChildNodeIds,
    ),
  ).toBe('mixed');
  expect(
    viewerArchitecturalParentVisibilityState(
      layers,
      'architecture',
      viewerArchitecturalRootChildNodeIds,
    ),
  ).toBe('mixed');
  expect(
    isViewerLayerNodeEffectivelyVisible(layers, 'architecture-walls-exterior'),
  ).toBe(true);
  expect(
    isViewerLayerNodeEffectivelyVisible(layers, 'architecture-walls-party'),
  ).toBe(false);

  const wallsOff = setViewerLayerNodeVisible(layers, 'architecture-walls', false);
  expect(
    viewerArchitecturalParentVisibilityState(
      wallsOff,
      'architecture-walls',
      viewerArchitecturalWallChildNodeIds,
    ),
  ).toBe('off');
  expect(
    isViewerLayerNodeEffectivelyVisible(wallsOff, 'architecture-walls-exterior'),
  ).toBe(false);
  expect(wallsOff.architectureExteriorWallsVisible).toBe(true);
  expect(wallsOff.architecturePartyWallsVisible).toBe(false);

  const wallsOn = setViewerLayerNodeVisible(
    wallsOff,
    'architecture-walls',
    true,
  );
  expect(
    isViewerLayerNodeEffectivelyVisible(wallsOn, 'architecture-walls-exterior'),
  ).toBe(true);
  expect(
    isViewerLayerNodeEffectivelyVisible(wallsOn, 'architecture-walls-party'),
  ).toBe(false);

  const architectureOff = setViewerLayerNodeVisible(
    wallsOn,
    'architecture',
    false,
  );
  expect(
    viewerArchitecturalParentVisibilityState(
      architectureOff,
      'architecture',
      viewerArchitecturalRootChildNodeIds,
    ),
  ).toBe('off');
  expect(
    isViewerLayerNodeEffectivelyVisible(architectureOff, 'architecture-doors'),
  ).toBe(false);
  expect(architectureOff.architectureDoorsVisible).toBe(true);
  expect(architectureOff.architectureReviewHelpersVisible).toBe(false);
});

test('VUX-E3B camera changes preserve manual hierarchy and opacity state', () => {
  let state = createViewerInteractionState('infra');
  state = patchViewerLayerControls(state, {
    roofOpacity: 0.55,
    locusWaterVisible: false,
    locusWastewaterVisible: true,
    p161KvvVisible: false,
    p161IvPlanVisible: true,
    p161IvSectionVisible: false,
  });

  const changedView = setViewerCameraView(state, 'elev-neg-x');

  expect(changedView.layers).toEqual(state.layers);
  expect(changedView.cameraView).toBe('elev-neg-x');
  expect(changedView.researchPreset).toBe('infra');
});
