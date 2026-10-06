import type { ViewerLayerState } from './privateModelLayerState';

export type { EdgeMode, ViewerLayerState } from './privateModelLayerState';

export type StandardViewPreset =
  | 'whole-building'
  | 'd-apartment'
  | 'd-1f'
  | 'd-2f'
  | 'top'
  | 'site'
  | 'infra'
  | 'drainage'
  | 'electrical'
  | 'elev-pos-y'
  | 'elev-neg-y'
  | 'elev-pos-x'
  | 'elev-neg-x';

export const standardViewLayerDefaults: Record<
  StandardViewPreset,
  Partial<ViewerLayerState>
> = {
  'whole-building': { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  'd-apartment': { roofVisible: false, locusVisible: false, edgeMode: 'visible' },
  'd-1f': { roofVisible: false, locusVisible: false, edgeMode: 'visible' },
  'd-2f': { roofVisible: false, locusVisible: false, edgeMode: 'visible' },
  top: { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  site: { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  infra: { roofVisible: false, locusVisible: true, edgeMode: 'visible' },
  drainage: { roofVisible: false, locusVisible: false, edgeMode: 'visible' },
  electrical: { roofVisible: false, locusVisible: false, edgeMode: 'visible' },
  'elev-pos-y': { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  'elev-neg-y': { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  'elev-pos-x': { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
  'elev-neg-x': { roofVisible: true, locusVisible: false, edgeMode: 'visible' },
};
