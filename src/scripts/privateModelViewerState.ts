import type { EdgeMode } from './privateModelLayerState';
import {
  createViewerLayerControlsState,
  mergeViewerLayerControlsState,
  type ViewerLayerControlsState,
  type ViewerLayerNodeId,
  type ViewerLayerVisibilityMode,
  type ViewerLayerModeMap,
  createViewerLayerModeMap,
  setViewerLayerMode,
  setViewerLayerNodeVisible,
} from './privateModelLayerHierarchyState';

export type { ViewerLayerControlsState } from './privateModelLayerHierarchyState';

export type ViewerResearchPreset =
  | 'whole-building'
  | 'd-apartment'
  | 'd-1f'
  | 'd-2f'
  | 'site'
  | 'infra'
  | 'drainage'
  | 'electrical';

export const viewerResearchPresetLabels: Record<ViewerResearchPreset, string> = {
  'whole-building': 'Koko rakennus',
  'd-apartment': 'D-asunto',
  'd-1f': 'D 1F',
  'd-2f': 'D 2F',
  site: 'Tontti',
  infra: 'Infra',
  drainage: 'Salaojat',
  electrical: 'Sähköt',
};

export const formatViewerResearchPresetLabel = (
  preset: ViewerResearchPreset,
  customized = false,
) => `${viewerResearchPresetLabels[preset]}${customized ? ' · mukautettu' : ''}`;

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
  layerPresetState?: ViewerLayerPresetState;
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
  electrical: {
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
): ViewerInteractionState =>
  patchViewerLayerControlsWithPresets(current, next);

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


/** WP1 layer presets do not set camera, unlike legacy research presets. */
export type ViewerLayerPreset = Exclude<ViewerResearchPreset, 'drainage' | 'electrical'>;
export type ViewerLayerPresetState = {
  selected: ViewerLayerPreset;
  customized: boolean;
  modes: ViewerLayerModeMap;
};
export type ViewerLayerPresetScope = {
  area: 'WHOLE' | 'D' | 'SITE' | 'INFRA';
  floor: 'BOTH' | '1F' | '2F';
};
export const viewerLayerPresetScopes: Record<ViewerLayerPreset, ViewerLayerPresetScope> = {
  'whole-building': { area: 'WHOLE', floor: 'BOTH' },
  'd-apartment': { area: 'D', floor: 'BOTH' },
  'd-1f': { area: 'D', floor: '1F' },
  'd-2f': { area: 'D', floor: '2F' },
  site: { area: 'SITE', floor: 'BOTH' },
  infra: { area: 'INFRA', floor: 'BOTH' },
};

const legacyToLayerPreset = (preset: ViewerResearchPreset): ViewerLayerPreset =>
  preset === 'drainage' || preset === 'electrical' ? 'whole-building' : preset;

const defaultLayerModesForPreset = (preset: ViewerLayerPreset): ViewerLayerModeMap => {
  const modes = createViewerLayerModeMap(viewerResearchPresetDefinitions[preset].layers);
  // Desired C80 D 2F roof presentation. The existing roofVisible=false
  // remains a safe legacy fallback until WP2/WP3 can render/source-gate ghost.
  if (preset === 'd-2f') modes.roof = 'ghost';
  return modes;
};

const hasLayerPresetCustomization = (
  preset: ViewerLayerPreset,
  modes: ViewerLayerModeMap,
  layers: ViewerLayerControlsState,
): boolean => {
  const defaults = defaultLayerModesForPreset(preset);
  return (
    (Object.keys(defaults) as ViewerLayerNodeId[]).some(
      (id) => modes[id] !== defaults[id],
    ) ||
    layers.roofOpacity !== viewerResearchPresetDefinitions[preset].layers.roofOpacity
  );
};

const createLayerPresetState = (preset: ViewerLayerPreset): ViewerLayerPresetState => ({
  selected: preset,
  customized: false,
  modes: defaultLayerModesForPreset(preset),
});

/**
 * Preset changes only content/presentation state. It never switches camera.
 * Existing research-preset actions retain their legacy camera behavior.
 */
export const applyViewerLayerPreset = (
  current: ViewerInteractionState,
  preset: ViewerLayerPreset,
): ViewerInteractionState => ({
  ...current,
  researchPreset: preset,
  layers: { ...viewerResearchPresetDefinitions[preset].layers },
  layerPresetState: createLayerPresetState(preset),
});

export const resetViewerLayerPresetToDefaults = (
  current: ViewerInteractionState,
): ViewerInteractionState =>
  applyViewerLayerPreset(
    current,
    current.layerPresetState?.selected ?? legacyToLayerPreset(current.researchPreset),
  );

/** An explicit mode updates the legacy boolean where safe, not scene membership. */
export const setViewerInteractionLayerMode = (
  current: ViewerInteractionState,
  nodeId: ViewerLayerNodeId,
  mode: ViewerLayerVisibilityMode,
): ViewerInteractionState => {
  const active = current.layerPresetState ??
    createLayerPresetState(legacyToLayerPreset(current.researchPreset));
  const modes = setViewerLayerMode(active.modes, nodeId, mode);
  // Keep the current roof fallback when requesting ghost. This avoids making
  // a previously hidden roof opaque before the rendering adapter exists.
  const layers = nodeId === 'roof' && mode === 'ghost'
    ? current.layers
    : setViewerLayerNodeVisible(current.layers, nodeId, mode !== 'hidden');
  return {
    ...current,
    layers,
    layerPresetState: {
      selected: active.selected,
      customized: hasLayerPresetCustomization(active.selected, modes, layers),
      modes,
    },
  };
};

/** Legacy checkbox edits must override stale ghost intentions deterministically. */
const legacyVisibilityFields = {
  technical: 'technicalVisible',
  'technical-ventilation': 'technicalVentilationVisible',
  'technical-heating': 'technicalHeatingVisible',
  'technical-electrical': 'technicalElectricalVisible',
  roof: 'roofVisible',
  locus: 'locusVisible',
  'locus-water': 'locusWaterVisible',
  'locus-wastewater': 'locusWastewaterVisible',
  'p161-kvv-2017': 'p161KvvVisible',
  'p161-iv-1974-plan': 'p161IvPlanVisible',
  'p161-iv-1974-section': 'p161IvSectionVisible',
  architecture: 'architectureVisible',
  'architecture-walls': 'architectureWallsVisible',
  'architecture-walls-exterior': 'architectureExteriorWallsVisible',
  'architecture-walls-party': 'architecturePartyWallsVisible',
  'architecture-walls-interior': 'architectureInteriorWallsVisible',
  'architecture-doors': 'architectureDoorsVisible',
  'architecture-windows': 'architectureWindowsVisible',
  'architecture-review-helpers': 'architectureReviewHelpersVisible',
  'architecture-floors': 'architectureFloorsVisible',
  'architecture-ceilings': 'architectureCeilingsVisible',
  'architecture-fixtures': 'architectureFixturesVisible',
  'architecture-other': 'architectureOtherVisible',
} as const satisfies Record<ViewerLayerNodeId, keyof ViewerLayerControlsState>;

export const patchViewerLayerControlsWithPresets = (
  current: ViewerInteractionState,
  next: Partial<ViewerLayerControlsState>,
): ViewerInteractionState => {
  const merged = mergeViewerLayerControlsState(current.layers, next);
  const active = current.layerPresetState;
  if (!active) return { ...current, layers: merged };
  const modes = { ...active.modes };
  for (const id of Object.keys(legacyVisibilityFields) as ViewerLayerNodeId[]) {
    const key = legacyVisibilityFields[id];
    const flag = next[key];
    if (typeof flag === 'boolean') modes[id] = flag ? 'visible' : 'hidden';
  }
  return {
    ...current,
    layers: merged,
    layerPresetState: {
      selected: active.selected,
      customized: hasLayerPresetCustomization(active.selected, modes, merged),
      modes,
    },
  };
};
