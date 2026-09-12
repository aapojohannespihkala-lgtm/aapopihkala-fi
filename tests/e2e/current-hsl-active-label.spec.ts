import { expect, test } from '@playwright/test';
import { hslActiveGpsLabel } from '../../src/features/current/hsl-active-label';

test('active GPS label suppresses a stale past departure estimate', () => {
  const now = Date.parse('2026-09-12T19:10:00.000Z');

  expect(hslActiveGpsLabel({
    departureAt: '2026-09-12T19:07:00.000Z',
    previous: false,
    hasVehicle: true,
    atStop: false,
    now,
  })).toBe('TRACKING');

  expect(hslActiveGpsLabel({
    departureAt: '2026-09-12T19:07:00.000Z',
    previous: true,
    hasVehicle: true,
    atStop: false,
    now,
  })).toBeNull();
});

test('HSL detail shows TRACKING instead of MIN AGO for an active GPS bus', async ({ page }) => {
  const now = Date.now();
  const scheduledAt = new Date(now - 7 * 60_000).toISOString();
  const departureAt = new Date(now - 3 * 60_000).toISOString();

  await page.route('**/api/current/hsl', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'HSL Digitransit',
        vehicleSource: 'HSL GTFS-RT',
        fetchedAt: new Date().toISOString(),
        stop: { code: 'E3239', name: 'Ylisrinne' },
        routes: ['121', '125'],
        departures: [
          {
            route: '125',
            headsign: 'Tapiola (M) via Niittykumpu (M)',
            scheduledAt,
            departureAt,
            delaySeconds: 240,
            realtime: true,
            realtimeState: 'UPDATED',
            vehicle: {
              id: '12/345',
              latitude: 60.168,
              longitude: 24.7314,
              distanceMeters: 790,
              bearing: 5,
              speedKmh: 36,
              updatedAt: new Date(now - 5_000).toISOString(),
              currentStatus: 'IN_TRANSIT_TO',
            },
          },
        ],
      }),
    });
  });

  await page.goto('/current/hsl/');

  const row = page.locator('[data-hsl-departure]').first();
  await expect(row).toHaveAttribute('data-hsl-previous', 'false');
  await expect(row.locator('[data-hsl-countdown]')).toHaveText('TRACKING');
  await expect(row.locator('[data-hsl-countdown]')).not.toContainText('AGO');
  await expect(row).toContainText('GPS / 790 M AWAY / 36 KM/H');
});
