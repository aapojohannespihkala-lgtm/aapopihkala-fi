import { expect, test } from '@playwright/test';
import { mergeHslLearningSnapshotPayload } from '../../functions/api/current/hsl-public-learning';
import { shouldRefreshHslLearningSnapshot } from '../../worker/index';

test('public HSL payload reuses the latest learning summary and matching model only', () => {
  const live = {
    source: 'HSL Digitransit',
    departures: [
      { route: '125', scheduledAt: '2026-09-14T05:00:00.000Z', departureAt: '2026-09-14T05:02:00.000Z' },
      { route: '121', scheduledAt: '2026-09-14T05:05:00.000Z', departureAt: '2026-09-14T05:05:00.000Z' },
    ],
  };
  const snapshot = {
    learning: {
      enabled: true,
      observations: 2029,
      arrivals: 31,
    },
    departures: [
      {
        route: '125',
        scheduledAt: '2026-09-14T05:00:00.000Z',
        model: { predictedAt: '2026-09-14T05:01:30.000Z', sampleSize: 12 },
      },
      {
        route: '999',
        scheduledAt: '2026-09-14T05:09:00.000Z',
        model: { predictedAt: '2026-09-14T05:10:00.000Z', sampleSize: 20 },
      },
    ],
  };

  expect(mergeHslLearningSnapshotPayload(live, snapshot)).toEqual({
    ...live,
    learning: snapshot.learning,
    departures: [
      {
        ...live.departures[0],
        model: snapshot.departures[0].model,
      },
      live.departures[1],
    ],
  });
});

test('public HSL payload fails open when cached learning is invalid', () => {
  const live = {
    source: 'HSL Digitransit',
    departures: [
      { route: '125', scheduledAt: '2026-09-14T05:00:00.000Z', departureAt: '2026-09-14T05:02:00.000Z' },
    ],
  };

  expect(mergeHslLearningSnapshotPayload(live, { departures: [] })).toBe(live);
  expect(mergeHslLearningSnapshotPayload(live, { learning: {}, departures: 'invalid' })).toBe(live);
});

test('heavy HSL learning refresh is limited to ten-minute cron buckets', () => {
  const base = Date.UTC(2026, 8, 14, 5, 0, 0);
  expect(shouldRefreshHslLearningSnapshot(base)).toBe(true);
  expect(shouldRefreshHslLearningSnapshot(base + 5 * 60_000)).toBe(false);
  expect(shouldRefreshHslLearningSnapshot(base + 9 * 60_000)).toBe(false);
  expect(shouldRefreshHslLearningSnapshot(base + 10 * 60_000)).toBe(true);
  expect(shouldRefreshHslLearningSnapshot(base + 19 * 60_000)).toBe(false);
  expect(shouldRefreshHslLearningSnapshot(base + 20 * 60_000)).toBe(true);
});
