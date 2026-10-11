/**
 * D floor-plan axis-only temporary ruler. This is a visual WORK_TEST aid, not
 * a surveyed dimension, G2 observation, device placement or model mutation.
 * The third valid click clears both crosses and the line; the next begins anew.
 */
export type AxisMeasurePoint = Readonly<{ xM: number; yM: number }>;
export type AxisMeasureState =
  | Readonly<{ phase: 'EMPTY'; first: null; second: null; axis: null; millimetres: null }>
  | Readonly<{ phase: 'FIRST'; first: AxisMeasurePoint; second: null; axis: null; millimetres: null }>
  | Readonly<{ phase: 'MEASURED'; first: AxisMeasurePoint; second: AxisMeasurePoint; axis: 'X' | 'Y'; millimetres: number }>;

export const emptyAxisMeasureState = (): AxisMeasureState => ({
  phase: 'EMPTY', first: null, second: null, axis: null, millimetres: null,
});

export const advanceAxisMeasure = (
  state: AxisMeasureState,
  clicked: AxisMeasurePoint,
): AxisMeasureState => {
  // Invalid input is not a click and must not consume the three-click cycle.
  if (!Number.isFinite(clicked?.xM) || !Number.isFinite(clicked?.yM)) return state;
  if (state.phase === 'MEASURED') return emptyAxisMeasureState();
  if (state.phase === 'EMPTY') {
    return { phase: 'FIRST', first: { xM: clicked.xM, yM: clicked.yM },
      second: null, axis: null, millimetres: null };
  }
  const dx = clicked.xM - state.first.xM;
  const dy = clicked.yM - state.first.yM;
  // Pick the dominant model axis. An exact diagonal tie resolves to X.
  const axis = Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y';
  const second = {
    xM: axis === 'X' ? clicked.xM : state.first.xM,
    yM: axis === 'Y' ? clicked.yM : state.first.yM,
  };
  return {
    phase: 'MEASURED', first: state.first, second, axis,
    millimetres: Math.round(Math.abs(axis === 'X' ? dx : dy) * 1000),
  };
};

export const axisMeasureDisplay = (state: AxisMeasureState): string =>
  state.phase === 'MEASURED'
    ? `${state.axis} ${state.millimetres.toLocaleString('fi-FI')} mm (mallista)`
    : state.phase === 'FIRST'
      ? 'Ensimmäinen rasti - valitse toinen piste'
      : 'Klikkaa ensimmäinen piste';
