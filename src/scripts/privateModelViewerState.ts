import {
  clampViewerLayerOpacity,
  type EdgeMode,
} from './privateModelLayerState';

export type ViewerResearchPreset =
  | 'whole-building'
  | 'd-apartment'
  | 'd-1f'
  | 'd-2f'
  | 'site'
  | 'infra';

export type ViewerCameraView =
  | 'free-3d'
  | 'isometric'
  | 'plan'
  | 'top'
  | 'bottom'
  | 'elev-pos-y'
  | 'elev-neg-y'
  | 'elev-pos-x'
  | 'elev-neg-x';

export type ViewerLayerControlsState = {
  roofVisible: boolean;
  roofOpacity: number;
  locusVisible: boolean;
};

export type ViewerPresentationStyleState = {
  edgeMode: EdgeMode;
};

export type ViewerInteractionState = {
  researchPreset: ViewerResearchPreset;
  cameraView: ViewerCameraView;
  layers: ViewerLayerControlsState;
  presentation: ViewerPresentationStyleState;
};

export type ViewerResearchPresetDefinition = {
  cameraView: ViewerCameraView;
  layers: ViewerLayerControlsState;
  presentation: ViewerPresentationStyleState;
};

const visibleEdges: ViewerPresentationStyleState = { edgeMode: 'visible' };

export const viewerResearchPresetDefinitions: Record<
  ViewerResearchPreset,
  ViewerResearchPresetDefinition
> = {
  'whole-building': {
    cameraView: 'free-3d',
    layers: { roofVisible: true, roofOpacity: 1, locusVisible: false },
    presentation: visibleEdges,
  },
  'd-apartment': {
    cameraView: 'free-3d',
    layers: { roofVisible: false, roofOpacity: 1, locusVisible: false },
    presentation: visibleEdges,
  },
  'd-1f': {
    cameraView: 'plan',
    layers: { roofVisible: false, roofOpacity: 1, locusVisible: false },
    presentation: visibleEdges,
  },
  'd-2f': {
    cameraView: 'plan',
    layers: { roofVisible: false, roofOpacity: 1, locusVisible: false },
    presentation: visibleEdges,
  },
  site: {
    cameraView: 'top',
    layers: { roofVisible: true, roofOpacity: 1, locusVisible: false },
    presentation: visibleEdges,
  },
  infra: {
    cameraView: 'top',
    layers: { roofVisible: false, roofOpacity: 1, locusVisible: true },
    presentation: visibleEdges,
  },
};

const copyLayerControls = (
  layers: ViewerLayerControlsState,
): ViewerLayerControlsState => ({ ...layers });

const copyPresentationStyle = (
  presentation: ViewerPresentationStyleState,
): ViewerPresentationStyleState => ({ ...presentation });

export const createViewerInteractionState = (
  preset: ViewerResearchPreset = 'whole-building',
): ViewerInteractionState => {
  const definition = viewerResearchPresetDefinitions[preset];
  return {
    researchPreset: preset,
    cameraView: definition.cameraView,
    layers: copyLayerControls(definition.layers),
    presentation: copyPresentationStyle(definition.presentation),
  };
};

export const applyViewerResearchPreset = (
  _current: ViewerInteractionState,
  preset: ViewerResearchPreset,
): ViewerInteractionState => createViewerInteractionState(preset);

export const setViewerCameraView = (
  current: ViewerInteractionState,
  cameraView: ViewerCameraView,
): ViewerInteractionState => ({
  ...current,
  cameraView,
});

export const patchViewerLayerControls = (
  current: ViewerInteractionState,
  next: Partial<ViewerLayerControlsState>,
): ViewerInteractionState => ({
  ...current,
  layers: {
    ...current.layers,
    ...next,
    roofOpacity:
      typeof next.roofOpacity === 'number'
        ? clampViewerLayerOpacity(next.roofOpacity)
        : current.layers.roofOpacity,
  },
});

export const patchViewerPresentationStyle = (
  current: ViewerInteractionState,
  next: Partial<ViewerPresentationStyleState>,
): ViewerInteractionState => ({
  ...current,
  presentation: {
    ...current.presentation,
    ...next,
  },
});
