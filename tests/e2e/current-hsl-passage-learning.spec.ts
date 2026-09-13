import { expect, test } from '@playwright/test';
import {
  confirmedHslPassageTime,
  inferHslPassageFromHistory,
  shouldCheckHslPassage,
  type HslPassageObservation,
} from '../../functions/api/current/hsl-passage-learning';

const row = (time: string, distance: number): HslPassageObservation => ({
  observed_at: time,
  vehicle_updated_at: time,
  distance_meters: distance,
});

const departure = (
  departureAt: string,
  distanceMeters: number | null,
  passageConfirmedAt: string | null = null
) => ({
  route: '125',
  scheduledAt: '2026-09-13T12:20:00.000Z',
  departureAt,
  vehicle:
    distanceMeters === null
      ? null
      : {
          distanceMeters,
          updatedAt: '2026-09-13T12:20:30.000Z',
        },
  passageConfirmedAt,
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

test('keeps checking briefly after GPS disappears so a persisted distance turn is not lost', () => {
  expect(
    shouldCheckHslPassage(
      departure('2026-09-13T12:20:00.000Z', null),
      '2026-09-13T12:22:00.000Z'
    )
  ).toBe(true);
});

test('does not scan stale no-GPS departures indefinitely', () => {
  expect(
    shouldCheckHslPassage(
      departure('2026-09-13T11:30:00.000Z', null),
      '2026-09-13T12:22:00.000Z'
    )
  ).toBe(false);
});

test('explicit GTFS stop progress always triggers passage processing', () => {
  expect(
    shouldCheckHslPassage(
      departure(
        '2026-09-13T11:30:00.000Z',
        null,
        '2026-09-13T12:22:00.000Z'
      ),
      '2026-09-13T12:22:00.000Z'
    )
  ).toBe(true);
});

test('confirmed stop progress uses the closest prior GPS sample as coarse passage time', () => {
  expect(
    confirmedHslPassageTime(
      [
        row('2026-09-13T12:19:00.000Z', 900),
        row('2026-09-13T12:20:00.000Z', 180),
        row('2026-09-13T12:21:00.000Z', 650),
      ],
      '2026-09-13T12:21:30.000Z'
    )
  ).toBe('2026-09-13T12:20:00.000Z');
});

test('confirmed stop progress falls back to confirmation time without GPS history', () => {
  expect(
    confirmedHslPassageTime([], '2026-09-13T12:21:30.000Z')
  ).toBe('2026-09-13T12:21:30.000Z');
});
