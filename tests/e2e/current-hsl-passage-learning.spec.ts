import { expect, test } from '@playwright/test';
import {
  inferHslPassageFromHistory,
  type HslPassageObservation,
} from '../../functions/api/current/hsl-passage-learning';

const row = (time: string, distance: number): HslPassageObservation => ({
  observed_at: time,
  vehicle_updated_at: time,
  distance_meters: distance,
});

test('infers a passed stop when GPS distance turns away after a close approach', () => {
  const observations = [
    row('2026-09-12T17:59:00.000Z', 1400),
    row('2026-09-12T18:00:00.000Z', 760),
    row('2026-09-12T18:01:00.000Z', 220),
    row('2026-09-12T18:02:00.000Z', 820),
    row('2026-09-12T18:03:00.000Z', 1320),
  ];

  expect(
    inferHslPassageFromHistory(observations, '2026-09-12T18:01:30.000Z')
  ).toEqual({
    actualArrivalAt: '2026-09-12T18:01:00.000Z',
    closestDistanceMeters: 220,
    latestDistanceMeters: 1320,
  });
});

test('does not infer a passage while the bus is still approaching', () => {
  const observations = [
    row('2026-09-12T17:59:00.000Z', 1400),
    row('2026-09-12T18:00:00.000Z', 900),
    row('2026-09-12T18:01:00.000Z', 520),
    row('2026-09-12T18:02:00.000Z', 250),
  ];

  expect(
    inferHslPassageFromHistory(observations, '2026-09-12T18:02:30.000Z')
  ).toBeNull();
});

test('does not infer a passage when HSL still expects the bus well in the future', () => {
  const observations = [
    row('2026-09-12T17:59:00.000Z', 900),
    row('2026-09-12T18:00:00.000Z', 250),
    row('2026-09-12T18:01:00.000Z', 900),
  ];

  expect(
    inferHslPassageFromHistory(observations, '2026-09-12T18:10:00.000Z')
  ).toBeNull();
});
