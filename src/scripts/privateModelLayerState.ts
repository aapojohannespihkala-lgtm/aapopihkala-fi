export type EdgeMode = 'none' | 'object' | 'unified' | 'visible';

export type ViewerLayerState = {
  roofVisible: boolean;
  roofOpacity: number;
  locusVisible: boolean;
  edgeMode: EdgeMode;
};

export type ViewerLayerStateSource = 'manual' | `preset:${string}` | `reset:${string}`;

export const clampViewerLayerOpacity = (value: number) => Math.max(0, Math.min(1, value));

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
  edgeMode: next.edgeMode ?? current.edgeMode,
});
