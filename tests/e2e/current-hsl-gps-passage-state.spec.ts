import { expect, test } from '@playwright/test';
import { updateHslGpsPassageState } from '../../src/features/current/hsl-passage-state';

test('GPS bus stays active while distance is still shrinking', () => {
  let state = updateHslGpsPassageState(undefined, {
    distanceMeters: 900,
    updatedAt: '2026-09-12T18:00:00.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 620,
    updatedAt: '2026-09-12T18:00:15.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 340,
    updatedAt: '2026-09-12T18:00:30.000Z',
  });

  expect(state?.passed).toBe(false);
  expect(state?.awaySamples).toBe(0);
});

test('GPS bus becomes passed only after two clear away-moving samples', () => {
  let state = updateHslGpsPassageState(undefined, {
    distanceMeters: 520,
    updatedAt: '2026-09-12T18:00:00.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 180,
    updatedAt: '2026-09-12T18:00:15.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 330,
    updatedAt: '2026-09-12T18:00:30.000Z',
  });

  expect(state?.passed).toBe(false);
  expect(state?.awaySamples).toBe(1);

  state = updateHslGpsPassageState(state, {
    distanceMeters: 470,
    updatedAt: '2026-09-12T18:00:45.000Z',
  });

  expect(state?.passed).toBe(true);
  expect(state?.awaySamples).toBe(2);
});

test('small GPS jitter does not mark a bus as passed', () => {
  let state = updateHslGpsPassageState(undefined, {
    distanceMeters: 210,
    updatedAt: '2026-09-12T18:00:00.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 235,
    updatedAt: '2026-09-12T18:00:15.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 220,
    updatedAt: '2026-09-12T18:00:30.000Z',
  });
  state = updateHslGpsPassageState(state, {
    distanceMeters: 245,
    updatedAt: '2026-09-12T18:00:45.000Z',
  });

  expect(state?.passed).toBe(false);
  expect(state?.awaySamples).toBe(0);
});
