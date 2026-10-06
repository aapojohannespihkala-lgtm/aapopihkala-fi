import type { EdgeMode } from './privateModelLayerState';
import {
  createViewerLayerControlsState,
  mergeViewerLayerControlsState,
  type ViewerLayerControlsState,
} from './privateModelLayerHierarchyState';

export type { ViewerLayerControlsState } from './privateModelLayerHierarchyState';

export type ViewerResearchPreset =
  | 'whole-building'
  | 'd-apartment'
  | 'd-1f'
  | 'd-2f'
  | 'site'
  | 'infra'
  | 'drainage';

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
    layers: createViewerLayerControlsState({
      roofVisible: true,
      roofOpacity: 1,
      locusVisible: false,
    }),
    presentation: visibleEdges,
  },
  'd-apartment': {
    cameraView: 'free-3d',
    layers: createViewerLayerControlsState({
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: false,
    }),
    presentation: visibleEdges,
  },
  'd-1f': {
    cameraView: 'plan',
    layers: createViewerLayerControlsState({
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: false,
    }),
    presentation: visibleEdges,
  },
  'd-2f': {
    cameraView: 'plan',
    layers: createViewerLayerControlsState({
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: false,
    }),
    presentation: visibleEdges,
  },
  site: {
    cameraView: 'top',
    layers: createViewerLayerControlsState({
      roofVisible: true,
      roofOpacity: 1,
      locusVisible: false,
    }),
    presentation: visibleEdges,
  },
  infra: {
    cameraView: 'top',
    layers: createViewerLayerControlsState({
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: true,
    }),
    presentation: visibleEdges,
  },
  drainage: {
    cameraView: 'free-3d',
    layers: createViewerLayerControlsState({
      roofVisible: false,
      roofOpacity: 1,
      locusVisible: false,
    }),
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

export const resetViewerInteractionStateToPresetDefaults = (
  current: ViewerInteractionState,
): ViewerInteractionState => createViewerInteractionState(current.researchPreset);

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
  layers: mergeViewerLayerControlsState(current.layers, next),
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
