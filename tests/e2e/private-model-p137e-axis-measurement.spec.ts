import { expect, test } from '@playwright/test';
import {
  advanceAxisMeasure, axisMeasureDisplay, emptyAxisMeasureState,
  updateAxisMeasurePointer,
} from '../../src/scripts/privateModelP137EAxisMeasurement';

test('P137E ruler: four clicks anchor, activate live, lock and clear', () => {
  let state = emptyAxisMeasureState();
  state = advanceAxisMeasure(state, { xM: 1.2, yM: 2.5 });
  expect(state).toMatchObject({ phase: 'FIRST', first: { xM: 1.2, yM: 2.5 }, second: null });
  expect(updateAxisMeasurePointer(state, { xM: 3, yM: 3 })).toEqual(state);
  state = advanceAxisMeasure(state, { xM: 3.65, yM: 2.65 });
  expect(state).toMatchObject({
    phase: 'DYNAMIC', axis: 'X', millimetres: 2450,
    second: { xM: 3.65, yM: 2.5 },
  });
  expect(axisMeasureDisplay(state)).toBe('2450 mm');
  state = updateAxisMeasurePointer(state, { xM: 4.5, yM: 2.4 });
  expect(state).toMatchObject({ phase: 'DYNAMIC', axis: 'X', millimetres: 3300 });
  state = advanceAxisMeasure(state, { xM: 4.85, yM: 2.2 });
  expect(state).toMatchObject({
    phase: 'LOCKED', axis: 'X', millimetres: 3650,
    second: { xM: 4.85, yM: 2.5 },
  });
  expect(updateAxisMeasurePointer(state, { xM: 99, yM: 99 })).toEqual(state);
  expect(axisMeasureDisplay(state)).toBe('3650 mm');
  state = advanceAxisMeasure(state, { xM: 9, yM: 9 });
  expect(state).toEqual(emptyAxisMeasureState());
  state = advanceAxisMeasure(state, { xM: 7, yM: 1 });
  expect(state).toMatchObject({ phase: 'FIRST', first: { xM: 7, yM: 1 } });
});

test('P137E ruler: Y-axis pointer movement updates mm without diagonal', () => {
  const anchor = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 5, yM: 2 });
  const moving = advanceAxisMeasure(anchor, { xM: 4.93, yM: 3.238 });
  expect(moving).toMatchObject({
    phase: 'DYNAMIC', axis: 'Y', millimetres: 1238,
    first: { xM: 5, yM: 2 }, second: { xM: 5, yM: 3.238 },
  });
  const updated = updateAxisMeasurePointer(moving, { xM: 4.95, yM: 4.016 });
  expect(updated).toMatchObject({ phase: 'DYNAMIC', axis: 'Y', millimetres: 2016, second: { xM: 5, yM: 4.016 } });
  const locked = advanceAxisMeasure(updated, { xM: 4.97, yM: 4.5 });
  expect(locked).toMatchObject({ phase: 'LOCKED', axis: 'Y', millimetres: 2500 });
});

test('P137E ruler: dynamic axis can switch but never creates a diagonal', () => {
  const anchor = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 0.5, yM: 0.5 });
  const moving = advanceAxisMeasure(anchor, { xM: 1.5, yM: 1.5 });
  expect(moving).toMatchObject({ phase: 'DYNAMIC', axis: 'X', second: { xM: 1.5, yM: 0.5 } });
  expect(updateAxisMeasurePointer(moving, { xM: 0.7, yM: 2 }))
    .toMatchObject({ phase: 'DYNAMIC', axis: 'Y', second: { xM: 0.5, yM: 2 }, millimetres: 1500 });
  expect(updateAxisMeasurePointer(moving, { xM: 0.5, yM: 0.5 }))
    .toMatchObject({ phase: 'DYNAMIC', axis: 'X', millimetres: 0 });
});

test('P137E ruler: invalid points do not consume clicks or modify dynamic state', () => {
  const empty = emptyAxisMeasureState();
  expect(advanceAxisMeasure(empty, { xM: NaN, yM: 1 })).toEqual(empty);
  const first = advanceAxisMeasure(empty, { xM: 1, yM: 1 });
  expect(advanceAxisMeasure(first, { xM: Infinity, yM: 2 })).toEqual(first);
  const dynamic = advanceAxisMeasure(first, { xM: 2, yM: 1 });
  expect(updateAxisMeasurePointer(dynamic, { xM: NaN, yM: 2 })).toEqual(dynamic);
  expect(advanceAxisMeasure(dynamic, { xM: 2, yM: Infinity })).toEqual(dynamic);
});

test('P137E ruler: original click coordinates stay unchanged', () => {
  const click1 = Object.freeze({ xM: 1.234, yM: 5.678 });
  const click2 = Object.freeze({ xM: 1.24, yM: 4.016 });
  const first = advanceAxisMeasure(emptyAxisMeasureState(), click1);
  const dynamic = advanceAxisMeasure(first, click2);
  expect(click1).toEqual({ xM: 1.234, yM: 5.678 });
  expect(click2).toEqual({ xM: 1.24, yM: 4.016 });
  expect(dynamic).toMatchObject({ first: click1, phase: 'DYNAMIC', axis: 'Y',
    second: { xM: 1.234, yM: 4.016 }, millimetres: 1662 });
});

test('P137E ruler: finite coordinates cannot overflow into Infinity delta', () => {
  const first = advanceAxisMeasure(emptyAxisMeasureState(), { xM: -1e308, yM: 0 });
  expect(first.phase).toBe('FIRST');
  expect(advanceAxisMeasure(first, { xM: 1e308, yM: 0 })).toEqual(first);
});

test('P137E ruler: unsafe millimetre integers cannot consume the second click', () => {
  const first = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 0, yM: 0 });
  expect(advanceAxisMeasure(first, { xM: 1e13, yM: 0 })).toEqual(first);
  expect(advanceAxisMeasure(first, { xM: 0, yM: -1e13 })).toEqual(first);
  expect(advanceAxisMeasure(first, { xM: 2, yM: 0 }))
    .toMatchObject({ phase: 'DYNAMIC', millimetres: 2000 });
});

test('P137E ruler: invalid projected pointer or lock keeps last valid dynamic state', () => {
  const first = advanceAxisMeasure(emptyAxisMeasureState(), { xM: 0, yM: 0 });
  const dynamic = advanceAxisMeasure(first, { xM: 1, yM: 0 });
  expect(updateAxisMeasurePointer(dynamic, { xM: 1e308, yM: 0 })).toEqual(dynamic);
  expect(advanceAxisMeasure(dynamic, { xM: 1e308, yM: 0 })).toEqual(dynamic);
  expect(advanceAxisMeasure(dynamic, { xM: 2, yM: 0 }))
    .toMatchObject({ phase: 'LOCKED', millimetres: 2000 });
});
