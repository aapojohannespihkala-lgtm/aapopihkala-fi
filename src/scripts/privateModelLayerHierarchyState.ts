import { clampViewerLayerOpacity } from './privateModelLayerState';

export type ViewerLayerNodeId =
  | 'roof'
  | 'locus'
  | 'locus-water'
  | 'locus-wastewater'
  | 'p161-kvv-2017'
  | 'p161-iv-1974-plan'
  | 'p161-iv-1974-section';

export type ViewerLocusChildNodeId = Exclude<ViewerLayerNodeId, 'roof' | 'locus'>;

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
};

export const viewerLayerNodeCapabilities: Record<
  ViewerLayerNodeId,
  {
    parent: 'locus' | null;
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

export const viewerLayerControlsDefaults: ViewerLayerControlsState = {
  roofVisible: true,
  roofOpacity: 1,
  locusVisible: false,
  locusWaterVisible: true,
  locusWastewaterVisible: true,
  p161KvvVisible: true,
  p161IvPlanVisible: true,
  p161IvSectionVisible: true,
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
