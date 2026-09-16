import { expect, test } from '@playwright/test';
import {
  normalizeSourceObservedAt,
  normalizeWeatherObservedAt,
  oldestSourceObservedAt,
} from '../../functions/api/current/widget';
import { buildWidgetV2Payload } from '../../functions/api/current/widget-v2';

test('Open-Meteo local current time becomes a UTC weather observation timestamp', () => {
  expect(normalizeWeatherObservedAt('2026-09-16T11:15', 10_800)).toBe(
    '2026-09-16T08:15:00.000Z'
  );
  expect(normalizeWeatherObservedAt('2026-01-16T10:15', 7_200)).toBe(
    '2026-01-16T08:15:00.000Z'
  );
  expect(normalizeWeatherObservedAt('not-a-time', 10_800)).toBeNull();
});

test('dated market observations normalize to UTC and preserve the oldest contributing date', () => {
  expect(normalizeSourceObservedAt('2026-09-16')).toBe('2026-09-16T00:00:00.000Z');
  expect(normalizeSourceObservedAt('2026-09-16T08:15:00Z')).toBe('2026-09-16T08:15:00.000Z');
  expect(normalizeSourceObservedAt('2026-02-30')).toBeNull();
  expect(oldestSourceObservedAt(['2026-09-16', '2026-09-15', '2026-09-16T08:00:00Z'])).toBe(
    '2026-09-15T00:00:00.000Z'
  );
});

test('widget v2 carries section-level freshness metadata without changing the schema version', () => {
  const baseUpdated = '2026-09-16T08:30:00.000Z';
  const weatherObservedAt = '2026-09-16T08:15:00.000Z';
  const marketsObservedAt = '2026-09-15T00:00:00.000Z';
  const ratesObservedAt = '2026-09-16T00:00:00.000Z';
  const hslFetchedAt = '2026-09-16T08:29:20.000Z';
  const payload = buildWidgetV2Payload(
    {
      updated: baseUpdated,
      weather: {
        location: 'OLARI / ESPOO',
        temperature: 12.4,
        observedAt: weatherObservedAt,
      },
      electricity: { price: 2.1, average: 3.2, low: 1.0, high: 5.0, series: [1, 2, 3, 4] },
      markets: {
        median: 0.8,
        month1Median: 2.1,
        year1Median: 7.4,
        observedAt: marketsObservedAt,
        world: 0.6,
        usa: 0.7,
        finland: 0.2,
        btcEur: 1.1,
        remedy: -0.4,
      },
      rates: {
        euribor3m: 2.04,
        yearAgo: 2.82,
        observedAt: ratesObservedAt,
      },
    },
    null,
    'prod',
    '2026-09-16T08:31:00.000Z',
    null,
    {
      fetchedAt: hslFetchedAt,
      departures: [{
        route: '121',
        headsign: 'Central',
        departureAt: '2026-09-16T08:40:00.000Z',
        realtime: true,
      }],
    },
  );

  expect(payload.schemaVersion).toBe(2);
  expect(payload.generatedAt).toBe(baseUpdated);
  expect(payload.sections.find((section) => section.id === 'weather')?.observedAt).toBe(
    weatherObservedAt
  );
  expect(payload.sections.find((section) => section.id === 'weather')?.fetchedAt).toBe(baseUpdated);
  expect(payload.sections.find((section) => section.id === 'electricity')?.fetchedAt).toBe(baseUpdated);
  expect(payload.sections.find((section) => section.id === 'markets')?.observedAt).toBe(
    marketsObservedAt
  );
  expect(payload.sections.find((section) => section.id === 'markets')?.fetchedAt).toBe(baseUpdated);
  expect(payload.sections.find((section) => section.id === 'rates')?.observedAt).toBe(
    ratesObservedAt
  );
  expect(payload.sections.find((section) => section.id === 'rates')?.fetchedAt).toBe(baseUpdated);
  expect(payload.sections.find((section) => section.id === 'hsl')?.fetchedAt).toBe(hslFetchedAt);
});
