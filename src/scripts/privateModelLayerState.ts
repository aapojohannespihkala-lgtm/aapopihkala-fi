export type EdgeMode = 'none' | 'object' | 'unified' | 'visible';

/** TypeScript does not validate URL, storage or other runtime-provided values. */
export const isViewerEdgeMode = (value: unknown): value is EdgeMode =>
  value === 'none' || value === 'object' ||
  value === 'unified' || value === 'visible';

export type ViewerLayerState = {
  roofVisible: boolean;
  roofOpacity: number;
  locusVisible: boolean;
  edgeMode: EdgeMode;
};

export type ViewerLayerStateSource = 'manual' | `preset:${string}` | `reset:${string}`;

export const createViewerLayerStateForModelLoad = (
  options: { locusVisible?: boolean } = {},
): ViewerLayerState => ({
  roofVisible: true,
  roofOpacity: 1,
  locusVisible: options.locusVisible ?? false,
  edgeMode: 'visible',
});

/** Reject NaN before it can poison material opacity in either layer-state path. */
export const clampViewerLayerOpacity = (value: number) =>
  Number.isNaN(value) ? 1 : Math.max(0, Math.min(1, value));

export const mergeViewerLayerState = (
  current: ViewerLayerState,
  next: Partial<ViewerLayerState>,
): ViewerLayerState => ({
  roofVisible:
    typeof next.roofVisible === 'boolean' ? next.roofVisible : current.roofVisible,
  roofOpacity:
    typeof next.roofOpacity === 'number'
      ? clampViewerLayerOpacity(next.roofOpacity)
      : current.roofOpacity,
  locusVisible:
    typeof next.locusVisible === 'boolean' ? next.locusVisible : current.locusVisible,
  edgeMode: isViewerEdgeMode(next.edgeMode) ? next.edgeMode : current.edgeMode,
});
