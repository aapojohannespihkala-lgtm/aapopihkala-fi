import { isViewerEdgeMode, type EdgeMode } from './privateModelLayerState';
import {
  createViewerLayerControlsState,
  mergeViewerLayerControlsState,
  type ViewerLayerControlsState,
  type ViewerLayerNodeId,
  type ViewerLayerVisibilityMode,
  type ViewerLayerModeMap,
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  viewerLayerNodeCapabilities,
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
    // Never replace a valid presentation mode with malformed runtime state.
    edgeMode: isViewerEdgeMode(next.edgeMode)
      ? next.edgeMode
      : current.presentation.edgeMode,
  },
});


/** WP1 layer presets do not set camera, unlike legacy research presets. */
export type ViewerLayerPreset = Exclude<ViewerResearchPreset, 'drainage' | 'electrical'>;
export type ViewerLayerPresetState = {
  selected: ViewerLayerPreset;
  customized: boolean;
  modes: ViewerLayerModeMap;
  /** Modern branch commands; absent in legacy parent-gated saved states. */
  visibilityTree?: 'branch';
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

/** Validate runtime preset IDs before indexing definitions or computing defaults. */
const isViewerLayerPreset = (preset: unknown): preset is ViewerLayerPreset =>
  typeof preset === 'string' &&
  Object.prototype.hasOwnProperty.call(viewerLayerPresetScopes, preset);

const legacyToLayerPreset = (preset: ViewerResearchPreset): ViewerLayerPreset =>
  isViewerLayerPreset(preset) ? preset : 'whole-building';

const selectedLayerPreset = (current: ViewerInteractionState): ViewerLayerPreset =>
  isViewerLayerPreset(current.layerPresetState?.selected)
    ? current.layerPresetState!.selected
    : legacyToLayerPreset(current.researchPreset);

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
  independent = false,
): boolean => {
  const defaults = independent
    ? flattenViewerLayerModes(defaultLayerModesForPreset(preset))
    : defaultLayerModesForPreset(preset);
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

const flattenViewerLayerModes = (modes: ViewerLayerModeMap): ViewerLayerModeMap =>
  Object.fromEntries((Object.keys(viewerLayerNodeCapabilities) as ViewerLayerNodeId[])
    .map(id => [id, getViewerLayerEffectiveMode(modes, id)])) as ViewerLayerModeMap;

/** Preserve the previous effective presentation when entering the new tree. */
export const withViewerLayerBranchVisibility = (
  current: ViewerInteractionState,
): ViewerInteractionState => {
  if (current.layerPresetState?.visibilityTree === 'branch') return current;
  const selected = selectedLayerPreset(current);
  const active = current.layerPresetState ?? createLayerPresetState(selected);
  const modes = flattenViewerLayerModes(active.modes);
  return {
    ...current,
    layerPresetState: {
      ...active, selected, modes, visibilityTree: 'branch',
      customized: hasLayerPresetCustomization(selected, modes, current.layers, true),
    },
  };
};

/**
 * Preset changes only content/presentation state. It never switches camera.
 * Existing research-preset actions retain their legacy camera behavior.
 */
export const applyViewerLayerPreset = (
  current: ViewerInteractionState,
  preset: ViewerLayerPreset,
): ViewerInteractionState => {
  const selected = isViewerLayerPreset(preset)
    ? preset : legacyToLayerPreset(current.researchPreset);
  const next: ViewerInteractionState = {
    ...current,
    researchPreset: selected,
    layers: { ...viewerResearchPresetDefinitions[selected].layers },
    layerPresetState: createLayerPresetState(selected),
  };
  return current.layerPresetState?.visibilityTree === 'branch'
    ? withViewerLayerBranchVisibility(next) : next;
};

export const resetViewerLayerPresetToDefaults = (
  current: ViewerInteractionState,
): ViewerInteractionState =>
  applyViewerLayerPreset(
    current,
    selectedLayerPreset(current),
  );

/** An explicit mode updates the legacy boolean where safe, not scene membership. */
export const setViewerInteractionLayerMode = (
  current: ViewerInteractionState,
  nodeId: ViewerLayerNodeId,
  mode: ViewerLayerVisibilityMode,
): ViewerInteractionState => {
  const selected = selectedLayerPreset(current);
  const active = current.layerPresetState ?? createLayerPresetState(selected);
  // Runtime inputs may be malformed even when TypeScript callers are typed.
  // Fail closed in BOTH semantic modes and legacy visibility booleans.
  const safeMode: ViewerLayerVisibilityMode =
    mode === 'visible' || mode === 'ghost' ? mode : 'hidden';
  const modes = setViewerLayerMode(active.modes, nodeId, safeMode);
  // Keep the current roof fallback when requesting ghost. This avoids making
  // a previously hidden roof opaque before the rendering adapter exists.
  const layers = nodeId === 'roof' && safeMode === 'ghost'
    ? current.layers
    : setViewerLayerNodeVisible(current.layers, nodeId, safeMode !== 'hidden');
  return {
    ...current,
    layers,
    layerPresetState: {
      ...active,
      selected,
      customized: hasLayerPresetCustomization(selected, modes, layers, active.visibilityTree === 'branch'),
      modes,
    },
  };
};

/** One command changes only trusted descendants available in this frame. */
export const setViewerInteractionLayerBranchMode = (
  current: ViewerInteractionState,
  nodeId: ViewerLayerNodeId,
  mode: ViewerLayerVisibilityMode,
  availableNodeIds: readonly string[],
): ViewerInteractionState => {
  if (!Object.hasOwn(viewerLayerNodeCapabilities, nodeId) || !availableNodeIds.includes(nodeId)) return current;
  const next = withViewerLayerBranchVisibility(current);
  const active = next.layerPresetState!;
  const safeMode: ViewerLayerVisibilityMode = mode === 'visible' || mode === 'ghost' ? mode : 'hidden';
  const targets = (Object.keys(viewerLayerNodeCapabilities) as ViewerLayerNodeId[])
    .filter(id => {
      if (!availableNodeIds.includes(id)) return false;
      let ancestor: ViewerLayerNodeId | null = id;
      while (ancestor) {
        if (ancestor === nodeId) return true;
        ancestor = viewerLayerNodeCapabilities[ancestor].parent;
      }
      return false;
    });
  let modes = active.modes;
  let layers = next.layers;
  for (const id of targets) {
    modes = setViewerLayerMode(modes, id, safeMode);
    if (id !== 'roof' || safeMode !== 'ghost') {
      layers = setViewerLayerNodeVisible(layers, id, safeMode !== 'hidden');
    }
  }
  return {
    ...next, layers,
    layerPresetState: {
      ...active, modes,
      customized: hasLayerPresetCustomization(active.selected, modes, layers, true),
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
  const selected = selectedLayerPreset(current);
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
      ...active,
      selected,
      customized: hasLayerPresetCustomization(selected, modes, merged, active.visibilityTree === 'branch'),
      modes,
    },
  };
};
