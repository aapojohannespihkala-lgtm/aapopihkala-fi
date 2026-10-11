/**
 * D floor-plan axis-only temporary ruler. This is a visual WORK_TEST aid, not
 * a surveyed dimension, G2 observation, device placement or model mutation.
 * Click 1 anchors, click 2 starts the live ruler, click 3 locks and click 4 clears.
 */
export type AxisMeasurePoint = Readonly<{ xM: number; yM: number }>;
export type AxisMeasureState =
  | Readonly<{ phase: 'EMPTY'; first: null; second: null; axis: null; millimetres: null }>
  | Readonly<{ phase: 'FIRST'; first: AxisMeasurePoint; second: null; axis: null; millimetres: null }>
  | Readonly<{ phase: 'DYNAMIC' | 'LOCKED'; first: AxisMeasurePoint; second: AxisMeasurePoint; axis: 'X' | 'Y'; millimetres: number }>;

/** Ruler is usable only in the same D floor plan used for source-local XY. */
export const isAxisMeasureAvailable = (
  floor: '1F' | '2F' | null,
  isPlanCameraActive: boolean,
): boolean => (floor === '1F' || floor === '2F') && isPlanCameraActive;

export const emptyAxisMeasureState = (): AxisMeasureState => ({
  phase: 'EMPTY', first: null, second: null, axis: null, millimetres: null,
});

const projectAxis = (first: AxisMeasurePoint, target: AxisMeasurePoint) => {
  const dx = target.xM - first.xM;
  const dy = target.yM - first.yM;
  const axis: 'X' | 'Y' = Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y';
  return {
    second: {
      xM: axis === 'X' ? target.xM : first.xM,
      yM: axis === 'Y' ? target.yM : first.yM,
    },
    axis,
    millimetres: Math.round(Math.abs(axis === 'X' ? dx : dy) * 1000),
  };
};

const valid = (p: AxisMeasurePoint): boolean =>
  Number.isFinite(p?.xM) && Number.isFinite(p?.yM);

export const updateAxisMeasurePointer = (
  state: AxisMeasureState,
  pointer: AxisMeasurePoint,
): AxisMeasureState =>
  state.phase === 'DYNAMIC' && valid(pointer)
    ? { phase: 'DYNAMIC', first: state.first, ...projectAxis(state.first, pointer) }
    : state;

export const advanceAxisMeasure = (
  state: AxisMeasureState,
  clicked: AxisMeasurePoint,
): AxisMeasureState => {
  if (!valid(clicked)) return state;
  if (state.phase === 'LOCKED') return emptyAxisMeasureState();
  if (state.phase === 'EMPTY') {
    return { phase: 'FIRST', first: { xM: clicked.xM, yM: clicked.yM },
      second: null, axis: null, millimetres: null };
  }
  if (state.phase === 'FIRST') {
    return { phase: 'DYNAMIC', first: state.first, ...projectAxis(state.first, clicked) };
  }
  return { phase: 'LOCKED', first: state.first, ...projectAxis(state.first, clicked) };
};

export const axisMeasureDisplay = (state: AxisMeasureState): string =>
  state.phase === 'EMPTY' ? 'Klikkaa ensimmäinen piste'
    : state.phase === 'FIRST' ? 'Ensimmäinen rasti - klikkaa käynnistääksesi mittauksen'
    : state.phase === 'DYNAMIC'
      ? `${state.axis} ${state.millimetres.toLocaleString('fi-FI')} mm (mallista) - klikkaa lukitaksesi`
      : `${state.axis} ${state.millimetres.toLocaleString('fi-FI')} mm (mallista) - lukittu`;
