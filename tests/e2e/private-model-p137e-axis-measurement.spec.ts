import { expect, test } from '@playwright/test';
import {
  advanceAxisMeasure, axisMeasureDisplay, emptyAxisMeasureState,
} from '../../src/scripts/privateModelP137EAxisMeasurement';

test('P137E ruler: first cross, projected X measurement in mm, third clears, fourth restarts', () => {
  let state = emptyAxisMeasureState();
  state = advanceAxisMeasure(state, { xM: 1.2, yM: 2.5 });
  expect(state).toMatchObject({ phase: 'FIRST', first: { xM: 1.2, yM: 2.5 }, second: null });
  state = advanceAxisMeasure(state, { xM: 3.65, yM: 2.65 });
  expect(state).toMatchObject({
    phase: 'MEASURED', axis: 'X', millimetres: 2450,
    first: { xM: 1.2, yM: 2.5 }, second: { xM: 3.65, yM: 2.5 },
  });
  expect(axisMeasureDisplay(state)).toContain('mm');
  state = advanceAxisMeasure(state, { xM: 5, yM: 9 });
  expect(state).toEqual(emptyAxisMeasureState());
  state = advanceAxisMeasure(state, { xM: 4, yM: 1 });
  expect(state).toMatchObject({ phase: 'FIRST', first: { xM: 4, yM: 1 } });
});

test('P137E ruler: Y-dominant second click never yields diagonal line', () => {
  const first = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 5, yM: 2 });
  const measured = advanceAxisMeasure(first, { xM: 4.93, yM: 3.238 });
  expect(measured).toMatchObject({
    phase: 'MEASURED', axis: 'Y', millimetres: 1238,
    first: { xM: 5, yM: 2 }, second: { xM: 5, yM: 3.238 },
  });
});

test('P137E ruler: exact diagonal tie chooses X and zero distance is represented as 0 mm', () => {
  const first = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 0.5, yM: 0.5 });
  expect(advanceAxisMeasure(first, { xM: 1.5, yM: 1.5 }))
    .toMatchObject({ phase: 'MEASURED', axis: 'X', second: { xM: 1.5, yM: 0.5 }, millimetres: 1000 });
  expect(advanceAxisMeasure(first, { xM: 0.5, yM: 0.5 }))
    .toMatchObject({ phase: 'MEASURED', axis: 'X', millimetres: 0 });
});

test('P137E ruler: invalid coordinate never consumes a click or invents an axis', () => {
  const empty = emptyAxisMeasureState();
  expect(advanceAxisMeasure(empty, { xM: NaN, yM: 1 })).toEqual(empty);
  const first = advanceAxisMeasure(empty, { xM: 1, yM: 1 });
  expect(advanceAxisMeasure(first, { xM: Infinity, yM: 2 })).toEqual(first);
  expect(axisMeasureDisplay(empty)).toContain('ensimmäinen piste');
});

test('P137E ruler preserves original first point and marks only temporary UI geometry', () => {
  const click1 = Object.freeze({ xM: 1.234, yM: 5.678 });
  const click2 = Object.freeze({ xM: 1.24, yM: 4.016 });
  const first = advanceAxisMeasure(emptyAxisMeasureState(), click1);
  const done = advanceAxisMeasure(first, click2);
  expect(click1).toEqual({ xM: 1.234, yM: 5.678 });
  expect(click2).toEqual({ xM: 1.24, yM: 4.016 });
  expect(done).toMatchObject({ first: click1, axis: 'Y', second: { xM: 1.234, yM: 4.016 }, millimetres: 1662 });
});
