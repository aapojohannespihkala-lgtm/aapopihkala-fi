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
  applyViewerResearchPreset,
  createViewerInteractionState,
  patchViewerLayerControls,
  patchViewerPresentationStyle,
  resetViewerInteractionStateToPresetDefaults,
  setViewerCameraView,
} from '../../src/scripts/privateModelViewerState';

const expectedDefaultChildren = {
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
  architectureOtherVisible: true,
};

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
    'architecture-other',
  ]);
  expect(viewerLayerNodeCapabilities.roof).toEqual({
    parent: null,
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
  for (const nodeId of [
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
    'architecture-other',
  ] as const) {
    expect(viewerLayerNodeCapabilities[nodeId].opacity).toBe(false);
  }
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
