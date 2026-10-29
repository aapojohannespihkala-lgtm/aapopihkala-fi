import { clampViewerLayerOpacity } from './privateModelLayerState';

export type ViewerLocusChildNodeId =
  | 'locus-water'
  | 'locus-wastewater'
  | 'p161-kvv-2017'
  | 'p161-iv-1974-plan'
  | 'p161-iv-1974-section';

export type ViewerArchitecturalLayerNodeId =
  | 'architecture'
  | 'architecture-walls'
  | 'architecture-walls-exterior'
  | 'architecture-walls-party'
  | 'architecture-walls-interior'
  | 'architecture-doors'
  | 'architecture-windows'
  | 'architecture-review-helpers'
  | 'architecture-floors'
  | 'architecture-ceilings'
  | 'architecture-fixtures'
  | 'architecture-other';

export type ViewerArchitecturalLayerChildNodeId = Exclude<
  ViewerArchitecturalLayerNodeId,
  'architecture'
>;

export type ViewerArchitecturalParentNodeId =
  | 'architecture'
  | 'architecture-walls';

export type ViewerLayerNodeId =
  | 'roof'
  | 'locus'
  | ViewerLocusChildNodeId
  | ViewerArchitecturalLayerNodeId;

export type ViewerLayerParentVisibilityState = 'off' | 'none' | 'mixed' | 'all';

export type ViewerLayerControlsState = {
  roofVisible: boolean;
  roofOpacity: number;
  locusVisible: boolean;
  locusWaterVisible: boolean;
  locusWastewaterVisible: boolean;
  p161KvvVisible: boolean;
  p161IvPlanVisible: boolean;
  p161IvSectionVisible: boolean;
  architectureVisible: boolean;
  architectureWallsVisible: boolean;
  architectureExteriorWallsVisible: boolean;
  architecturePartyWallsVisible: boolean;
  architectureInteriorWallsVisible: boolean;
  architectureDoorsVisible: boolean;
  architectureWindowsVisible: boolean;
  architectureReviewHelpersVisible: boolean;
  architectureFloorsVisible: boolean;
  architectureCeilingsVisible: boolean;
  architectureFixturesVisible: boolean;
  architectureOtherVisible: boolean;
};

export const viewerLayerNodeCapabilities: Record<
  ViewerLayerNodeId,
  {
    parent: ViewerLayerNodeId | null;
    visibility: true;
    opacity: boolean;
  }
> = {
  roof: { parent: null, visibility: true, opacity: true },
  locus: { parent: null, visibility: true, opacity: false },
  'locus-water': { parent: 'locus', visibility: true, opacity: false },
  'locus-wastewater': { parent: 'locus', visibility: true, opacity: false },
  'p161-kvv-2017': { parent: 'locus', visibility: true, opacity: false },
  'p161-iv-1974-plan': { parent: 'locus', visibility: true, opacity: false },
  'p161-iv-1974-section': { parent: 'locus', visibility: true, opacity: false },
  architecture: { parent: null, visibility: true, opacity: false },
  'architecture-walls': {
    parent: 'architecture',
    visibility: true,
    opacity: false,
  },
  'architecture-walls-exterior': {
    parent: 'architecture-walls',
    visibility: true,
    opacity: false,
  },
  'architecture-walls-party': {
    parent: 'architecture-walls',
    visibility: true,
    opacity: false,
  },
  'architecture-walls-interior': {
    parent: 'architecture-walls',
    visibility: true,
    opacity: false,
  },
  'architecture-doors': {
    parent: 'architecture',
    visibility: true,
    opacity: false,
  },
  'architecture-windows': {
    parent: 'architecture',
    visibility: true,
    opacity: false,
  },
  'architecture-review-helpers': {
    parent: 'architecture',
    visibility: true,
    opacity: false,
  },
  'architecture-floors': { parent: 'architecture', visibility: true, opacity: false },
  'architecture-ceilings': { parent: 'architecture', visibility: true, opacity: false },
  'architecture-fixtures': { parent: 'architecture', visibility: true, opacity: false },
  'architecture-other': {
    parent: 'architecture',
    visibility: true,
    opacity: false,
  },
};

export const viewerLocusRouteChildNodeIds = [
  'locus-water',
  'locus-wastewater',
] as const satisfies readonly ViewerLocusChildNodeId[];

export const viewerP161SystemChildNodeIds = [
  'p161-kvv-2017',
  'p161-iv-1974-plan',
  'p161-iv-1974-section',
] as const satisfies readonly ViewerLocusChildNodeId[];

export const viewerArchitecturalRootChildNodeIds = [
  'architecture-walls',
  'architecture-doors',
  'architecture-windows',
  'architecture-review-helpers',
  'architecture-floors',
  'architecture-ceilings',
  'architecture-fixtures',
  'architecture-other',
] as const satisfies readonly ViewerArchitecturalLayerChildNodeId[];

export const viewerArchitecturalWallChildNodeIds = [
  'architecture-walls-exterior',
  'architecture-walls-party',
  'architecture-walls-interior',
] as const satisfies readonly ViewerArchitecturalLayerChildNodeId[];

export const viewerLayerControlsDefaults: ViewerLayerControlsState = {
  roofVisible: true,
  roofOpacity: 1,
  locusVisible: false,
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

export const mergeViewerLayerControlsState = (
  current: ViewerLayerControlsState,
  next: Partial<ViewerLayerControlsState>,
): ViewerLayerControlsState => ({
  roofVisible:
    typeof next.roofVisible === 'boolean' ? next.roofVisible : current.roofVisible,
  roofOpacity:
    typeof next.roofOpacity === 'number'
      ? clampViewerLayerOpacity(next.roofOpacity)
      : current.roofOpacity,
  locusVisible:
    typeof next.locusVisible === 'boolean' ? next.locusVisible : current.locusVisible,
  locusWaterVisible:
    typeof next.locusWaterVisible === 'boolean'
      ? next.locusWaterVisible
      : current.locusWaterVisible,
  locusWastewaterVisible:
    typeof next.locusWastewaterVisible === 'boolean'
      ? next.locusWastewaterVisible
      : current.locusWastewaterVisible,
  p161KvvVisible:
    typeof next.p161KvvVisible === 'boolean'
      ? next.p161KvvVisible
      : current.p161KvvVisible,
  p161IvPlanVisible:
    typeof next.p161IvPlanVisible === 'boolean'
      ? next.p161IvPlanVisible
      : current.p161IvPlanVisible,
  p161IvSectionVisible:
    typeof next.p161IvSectionVisible === 'boolean'
      ? next.p161IvSectionVisible
      : current.p161IvSectionVisible,
  architectureVisible:
    typeof next.architectureVisible === 'boolean'
      ? next.architectureVisible
      : current.architectureVisible,
  architectureWallsVisible:
    typeof next.architectureWallsVisible === 'boolean'
      ? next.architectureWallsVisible
      : current.architectureWallsVisible,
  architectureExteriorWallsVisible:
    typeof next.architectureExteriorWallsVisible === 'boolean'
      ? next.architectureExteriorWallsVisible
      : current.architectureExteriorWallsVisible,
  architecturePartyWallsVisible:
    typeof next.architecturePartyWallsVisible === 'boolean'
      ? next.architecturePartyWallsVisible
      : current.architecturePartyWallsVisible,
  architectureInteriorWallsVisible:
    typeof next.architectureInteriorWallsVisible === 'boolean'
      ? next.architectureInteriorWallsVisible
      : current.architectureInteriorWallsVisible,
  architectureDoorsVisible:
    typeof next.architectureDoorsVisible === 'boolean'
      ? next.architectureDoorsVisible
      : current.architectureDoorsVisible,
  architectureWindowsVisible:
    typeof next.architectureWindowsVisible === 'boolean'
      ? next.architectureWindowsVisible
      : current.architectureWindowsVisible,
  architectureReviewHelpersVisible:
    typeof next.architectureReviewHelpersVisible === 'boolean'
      ? next.architectureReviewHelpersVisible
      : current.architectureReviewHelpersVisible,
  architectureFloorsVisible: typeof next.architectureFloorsVisible === 'boolean' ? next.architectureFloorsVisible : current.architectureFloorsVisible,
  architectureCeilingsVisible: typeof next.architectureCeilingsVisible === 'boolean' ? next.architectureCeilingsVisible : current.architectureCeilingsVisible,
  architectureFixturesVisible: typeof next.architectureFixturesVisible === 'boolean' ? next.architectureFixturesVisible : current.architectureFixturesVisible,
  architectureOtherVisible:
    typeof next.architectureOtherVisible === 'boolean'
      ? next.architectureOtherVisible
      : current.architectureOtherVisible,
});

export const createViewerLayerControlsState = (
  initial: Partial<ViewerLayerControlsState> = {},
): ViewerLayerControlsState =>
  mergeViewerLayerControlsState(viewerLayerControlsDefaults, initial);

const childVisibilityKey = (
  nodeId: ViewerLocusChildNodeId,
): keyof Pick<
  ViewerLayerControlsState,
  | 'locusWaterVisible'
  | 'locusWastewaterVisible'
  | 'p161KvvVisible'
  | 'p161IvPlanVisible'
  | 'p161IvSectionVisible'
> => {
  if (nodeId === 'locus-water') return 'locusWaterVisible';
  if (nodeId === 'locus-wastewater') return 'locusWastewaterVisible';
  if (nodeId === 'p161-kvv-2017') return 'p161KvvVisible';
  if (nodeId === 'p161-iv-1974-plan') return 'p161IvPlanVisible';
  return 'p161IvSectionVisible';
};

const viewerArchitecturalVisibilityKeys = {
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
} as const satisfies Record<
  ViewerArchitecturalLayerNodeId,
  keyof ViewerLayerControlsState
>;

const isViewerArchitecturalLayerNodeId = (
  nodeId: ViewerLayerNodeId,
): nodeId is ViewerArchitecturalLayerNodeId =>
  Object.prototype.hasOwnProperty.call(viewerArchitecturalVisibilityKeys, nodeId);

const architecturalVisibilityKey = (
  nodeId: ViewerArchitecturalLayerNodeId,
) => viewerArchitecturalVisibilityKeys[nodeId];

export const setViewerLayerNodeVisible = (
  current: ViewerLayerControlsState,
  nodeId: ViewerLayerNodeId,
  visible: boolean,
): ViewerLayerControlsState => {
  if (nodeId === 'roof') {
    return mergeViewerLayerControlsState(current, { roofVisible: visible });
  }
  if (nodeId === 'locus') {
    return mergeViewerLayerControlsState(current, { locusVisible: visible });
  }
  if (isViewerArchitecturalLayerNodeId(nodeId)) {
    return mergeViewerLayerControlsState(current, {
      [architecturalVisibilityKey(nodeId)]: visible,
    });
  }
  return mergeViewerLayerControlsState(current, {
    [childVisibilityKey(nodeId)]: visible,
  });
};

export const setViewerRoofOpacity = (
  current: ViewerLayerControlsState,
  opacity: number,
): ViewerLayerControlsState =>
  mergeViewerLayerControlsState(current, { roofOpacity: opacity });

export const isViewerLayerNodeEffectivelyVisible = (
  current: ViewerLayerControlsState,
  nodeId: ViewerLayerNodeId,
): boolean => {
  if (nodeId === 'roof') return current.roofVisible;
  if (nodeId === 'locus') return current.locusVisible;
  if (isViewerArchitecturalLayerNodeId(nodeId)) {
    if (!current.architectureVisible) return false;
    if (nodeId === 'architecture') return true;
    if (nodeId === 'architecture-walls') return current.architectureWallsVisible;
    if (
      nodeId === 'architecture-walls-exterior' ||
      nodeId === 'architecture-walls-party' ||
      nodeId === 'architecture-walls-interior'
    ) {
      return (
        current.architectureWallsVisible &&
        current[architecturalVisibilityKey(nodeId)]
      );
    }
    return current[architecturalVisibilityKey(nodeId)];
  }
  return current.locusVisible && current[childVisibilityKey(nodeId)];
};

export const viewerLocusParentVisibilityState = (
  current: ViewerLayerControlsState,
  childNodeIds: readonly ViewerLocusChildNodeId[],
): ViewerLayerParentVisibilityState => {
  if (!current.locusVisible) return 'off';
  if (childNodeIds.length === 0) return 'all';

  const visibleCount = childNodeIds.filter(
    (nodeId) => current[childVisibilityKey(nodeId)],
  ).length;

  if (visibleCount === 0) return 'none';
  if (visibleCount === childNodeIds.length) return 'all';
  return 'mixed';
};

export const viewerArchitecturalParentVisibilityState = (
  current: ViewerLayerControlsState,
  parentNodeId: ViewerArchitecturalParentNodeId,
  childNodeIds: readonly ViewerArchitecturalLayerChildNodeId[],
): ViewerLayerParentVisibilityState => {
  if (!isViewerLayerNodeEffectivelyVisible(current, parentNodeId)) return 'off';
  if (childNodeIds.length === 0) return 'all';

  const visibleCount = childNodeIds.filter((nodeId) =>
    isViewerLayerNodeEffectivelyVisible(current, nodeId),
  ).length;

  if (visibleCount === 0) return 'none';
  if (visibleCount === childNodeIds.length) return 'all';
  return 'mixed';
};


/**
 * WP1: semantic layer presentation modes. These modes describe desired
 * appearance only. The final scope/storey/source gate remains authoritative.
 * Legacy boolean controls are deliberately kept unchanged for old viewers.
 */
export type ViewerLayerVisibilityMode = 'visible' | 'ghost' | 'hidden';
export type ViewerLayerParentMode = ViewerLayerVisibilityMode | 'mixed';
export type ViewerLayerModeMap = Record<ViewerLayerNodeId, ViewerLayerVisibilityMode>;

const viewerLayerOwnVisible = (
  controls: ViewerLayerControlsState,
  nodeId: ViewerLayerNodeId,
): boolean => {
  if (nodeId === 'roof') return controls.roofVisible;
  if (nodeId === 'locus') return controls.locusVisible;
  if (isViewerArchitecturalLayerNodeId(nodeId)) {
    return controls[architecturalVisibilityKey(nodeId)] as boolean;
  }
  return controls[childVisibilityKey(nodeId)];
};

/** Uses only existing, explicitly supported nodes; never invents sublayers. */
export const createViewerLayerModeMap = (
  legacy: ViewerLayerControlsState,
): ViewerLayerModeMap => {
  const modes = {} as ViewerLayerModeMap;
  for (const nodeId of Object.keys(viewerLayerNodeCapabilities) as ViewerLayerNodeId[]) {
    modes[nodeId] = viewerLayerOwnVisible(legacy, nodeId) ? 'visible' : 'hidden';
  }
  return modes;
};

/** A parent gate cannot expose a hidden child, and does not erase its preference. */
export const getViewerLayerEffectiveMode = (
  modes: ViewerLayerModeMap,
  nodeId: ViewerLayerNodeId,
): ViewerLayerVisibilityMode => {
  const ownMode = modes[nodeId];
  if (ownMode === 'hidden') return 'hidden';
  const parentId = viewerLayerNodeCapabilities[nodeId].parent;
  if (parentId === null) return ownMode;
  const parentMode = getViewerLayerEffectiveMode(modes, parentId);
  if (parentMode === 'hidden') return 'hidden';
  return ownMode === 'ghost' || parentMode === 'ghost' ? 'ghost' : 'visible';
};

/** A parent's mixed state is a read-only aggregation of current children. */
export const getViewerLayerParentMode = (
  modes: ViewerLayerModeMap,
  parentId: ViewerLayerNodeId,
  children: readonly ViewerLayerNodeId[],
): ViewerLayerParentMode => {
  if (modes[parentId] === 'hidden') return 'hidden';
  if (children.length === 0) return getViewerLayerEffectiveMode(modes, parentId);
  const first = getViewerLayerEffectiveMode(modes, children[0]);
  return children.every((child) => getViewerLayerEffectiveMode(modes, child) === first)
    ? first
    : 'mixed';
};

export const setViewerLayerMode = (
  modes: ViewerLayerModeMap,
  nodeId: ViewerLayerNodeId,
  mode: ViewerLayerVisibilityMode,
): ViewerLayerModeMap => ({ ...modes, [nodeId]: mode });

/** Ordered fail-closed decision: scope > storey > presentation layer. */
export const resolveScopedViewerLayerMode = (
  mode: ViewerLayerVisibilityMode,
  scopeAllowed: boolean,
  storeyAllowed: boolean,
): ViewerLayerVisibilityMode =>
  scopeAllowed && storeyAllowed ? mode : 'hidden';
