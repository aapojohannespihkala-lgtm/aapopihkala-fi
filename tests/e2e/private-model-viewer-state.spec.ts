import { expect, test } from '@playwright/test';

import {
  applyViewerResearchPreset,
  createViewerInteractionState,
  patchViewerLayerControls,
  patchViewerPresentationStyle,
  setViewerCameraView,
} from '../../src/scripts/privateModelViewerState';

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
  });
});

test('VUX-E1A camera changes preserve research preset, layers, and presentation', () => {
  const d2 = createViewerInteractionState('d-2f');
  const customized = patchViewerLayerControls(
    patchViewerPresentationStyle(d2, { edgeMode: 'none' }),
    { roofOpacity: 0.35 },
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
  });

  expect(updated.researchPreset).toBe('d-apartment');
  expect(updated.cameraView).toBe('elev-pos-y');
  expect(updated.presentation).toEqual(dApartment.presentation);
  expect(updated.layers).toEqual({
    roofVisible: true,
    roofOpacity: 1,
    locusVisible: true,
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
    },
    presentation: {
      edgeMode: 'visible',
    },
  });
});
