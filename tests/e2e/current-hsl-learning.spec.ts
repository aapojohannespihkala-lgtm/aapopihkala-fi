import { expect, test } from '@playwright/test';
import {
  buildHslLearningPrediction,
  buildHslLearningScoreboard,
  type HslLearningTrainingRow,
} from '../../functions/api/current/hsl-learning';

const trainingRows = (): HslLearningTrainingRow[] => {
  const observedAt = Date.parse('2026-09-12T15:00:00Z');
  return Array.from({ length: 8 }, (_, index) => {
    const hslPredictedAt = observedAt + 5 * 60_000;
    const actualArrivalAt = observedAt + 7 * 60_000;
    return {
      trip_key: `E3239|125|training-${index}`,
      route: '125',
      observed_at: new Date(observedAt).toISOString(),
      hsl_predicted_at: new Date(hslPredictedAt).toISOString(),
      distance_meters: 820,
      actual_arrival_at: new Date(actualArrivalAt).toISOString(),
      model_predicted_at: index < 5
        ? new Date(observedAt + 6.5 * 60_000).toISOString()
        : null,
    };
  });
};

test('Aapo ETA learns a robust correction from completed trips', () => {
  const prediction = buildHslLearningPrediction(trainingRows(), {
    tripKey: 'E3239|125|current',
    route: '125',
    observedAt: '2026-09-12T15:00:00.000Z',
    hslPredictedAt: '2026-09-12T15:05:00.000Z',
    distanceMeters: 820,
  });

  expect(prediction).not.toBeNull();
  expect(prediction?.predictedAt).toBe('2026-09-12T15:07:00.000Z');
  expect(prediction?.adjustmentSeconds).toBe(120);
  expect(prediction?.sampleSize).toBe(8);
  expect(prediction?.method).toBe('hsl-residual+gps-history');

  const scoreboard = buildHslLearningScoreboard(trainingRows());
  expect(scoreboard.scoredTrips).toBe(8);
  expect(scoreboard.hslMaeSeconds).toBe(120);
  expect(scoreboard.modelScoredTrips).toBe(5);
  expect(scoreboard.modelMaeSeconds).toBe(30);
  expect(scoreboard.modelWins).toBe(5);
});

test('HSL detail shows Aapo ETA beside the live HSL estimate and model scoreboard', async ({ page }) => {
  const now = Date.now();
  const scheduledAt = new Date(now + 10 * 60_000).toISOString();
  const hslAt = new Date(now + 8 * 60_000).toISOString();
  const modelAt = new Date(now + 11 * 60_000).toISOString();

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
            headsign: 'Tapiola (M)',
            scheduledAt,
            departureAt: hslAt,
            delaySeconds: -120,
            realtime: true,
            realtimeState: 'UPDATED',
            vehicle: {
              id: '12/345',
              latitude: 60.168,
              longitude: 24.7314,
              distanceMeters: 820,
              bearing: 5,
              speedKmh: 24.7,
              updatedAt: new Date(now - 3_000).toISOString(),
              currentStatus: 'IN_TRANSIT_TO',
            },
            model: {
              predictedAt: modelAt,
              adjustmentSeconds: 180,
              confidenceSeconds: 75,
              sampleSize: 8,
              method: 'hsl-residual+gps-history',
            },
          },
        ],
        learning: {
          enabled: true,
          version: 'median-residual-v1',
          observations: 120,
          arrivals: 18,
          scoredTrips: 15,
          modelScoredTrips: 8,
          hslMaeSeconds: 126,
          modelMaeSeconds: 72,
          modelWins: 6,
          lastArrivalAt: new Date(now - 10 * 60_000).toISOString(),
        },
      }),
    });
  });

  await page.goto('/current/hsl/');

  const departure = page.locator('[data-hsl-departure]');
  await expect(departure).toHaveCount(1);
  await expect(departure).toContainText('AAPO');
  await expect(departure).toContainText('N8');
  await expect(page.locator('[data-hsl-status]')).toContainText('1 AAPO');

  const scoreboard = page.locator('[data-hsl-learning]');
  await expect(scoreboard).toBeVisible();
  await expect(scoreboard).toContainText('18');
  await expect(scoreboard).toContainText('2.1 MIN');
  await expect(scoreboard).toContainText('1.2 MIN');
  await expect(scoreboard).toContainText('6 / 8');
  await expect(scoreboard).toContainText('COMPARING');
});
