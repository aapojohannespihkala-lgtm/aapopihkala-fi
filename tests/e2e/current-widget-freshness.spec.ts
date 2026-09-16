import { expect, test } from '@playwright/test';
import { normalizeWeatherObservedAt } from '../../functions/api/current/widget';
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

test('widget v2 carries section-level freshness metadata without changing the schema version', () => {
  const baseUpdated = '2026-09-16T08:30:00.000Z';
  const weatherObservedAt = '2026-09-16T08:15:00.000Z';
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
  expect(payload.sections.find((section) => section.id === 'hsl')?.fetchedAt).toBe(hslFetchedAt);
});
