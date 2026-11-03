import { expect, test } from '@playwright/test';
import {
  createViewerLayerStateForModelLoad,
  mergeViewerLayerState,
} from '../../src/scripts/privateModelLayerState';

test('model load accepts only explicit boolean true for Locus references', () => {
  expect(createViewerLayerStateForModelLoad()).toEqual({
    roofVisible: true, roofOpacity: 1, locusVisible: false, edgeMode: 'visible',
  });
  expect(createViewerLayerStateForModelLoad({ locusVisible: false }).locusVisible).toBe(false);
  expect(createViewerLayerStateForModelLoad({ locusVisible: true }).locusVisible).toBe(true);

  // Persisted or URL-derived runtime values can evade the TypeScript signature.
  for (const value of ['false', 'true', '1', 1, 0, null, {}, [], '']) {
    const options = { locusVisible: value } as unknown as Parameters<typeof createViewerLayerStateForModelLoad>[0];
    const state = createViewerLayerStateForModelLoad(options);
    expect(state.locusVisible, `invalid runtime flag: ${String(value)}`).toBe(false);
    expect(state.roofVisible).toBe(true);
    expect(state.roofOpacity).toBe(1);
    expect(state.edgeMode).toBe('visible');
  }

  // Existing explicit manual choices remain effective after model load.
  const load = createViewerLayerStateForModelLoad();
  expect(mergeViewerLayerState(load, { locusVisible: true }).locusVisible).toBe(true);
  expect(mergeViewerLayerState(load, { locusVisible: false }).locusVisible).toBe(false);
});
