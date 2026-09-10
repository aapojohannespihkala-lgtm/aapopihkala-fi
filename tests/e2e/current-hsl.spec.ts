import { expect, test } from '@playwright/test';
import { fetchHslDeparturesResponse } from '../../functions/api/current/hsl';

test('HSL detail shows two previous scheduled departures plus the next departures', async ({ page }) => {
  const now = Date.now();
  const previousGoneScheduled = new Date(now - 12 * 60_000).toISOString();
  const previousGoneRealtime = new Date(now - 5 * 60_000).toISOString();
  const previousLateScheduled = new Date(now - 5 * 60_000).toISOString();
  const previousLateRealtime = new Date(now + 3 * 60_000).toISOString();
  const departureOne = new Date(now + 10 * 60_000).toISOString();
  const departureTwo = new Date(now + 20 * 60_000).toISOString();

  let requestCount = 0;
  await page.route('**/api/current/hsl', async (route) => {
    requestCount += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      stopCode: 'E3239',
      routes: ['121', '125'],
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'HSL Digitransit',
        fetchedAt: new Date().toISOString(),
        stop: { code: 'E3239', name: 'Ylisrinne' },
        routes: ['121', '125'],
        departures: [
          {
            route: '121',
            headsign: 'Kamppi',
            scheduledAt: previousGoneScheduled,
            departureAt: previousGoneRealtime,
            delaySeconds: 420,
            realtime: true,
            realtimeState: 'UPDATED',
          },
          {
            route: '125',
            headsign: 'Tapiola (M)',
            scheduledAt: previousLateScheduled,
            departureAt: previousLateRealtime,
            delaySeconds: 480,
            realtime: true,
            realtimeState: 'UPDATED',
          },
          {
            route: '125',
            headsign: 'Tapiola (M)',
            scheduledAt: departureOne,
            departureAt: departureOne,
            delaySeconds: 0,
            realtime: true,
            realtimeState: 'UPDATED',
          },
          {
            route: '121',
            headsign: 'Kamppi',
            scheduledAt: departureTwo,
            departureAt: departureTwo,
            delaySeconds: 0,
            realtime: false,
            realtimeState: 'SCHEDULED',
          },
        ],
      }),
    });
  });

  await page.goto('/current/hsl/');

  await expect(page.getByText('HSL / YLISRINNE')).toBeVisible();
  await expect(page.getByText('121 + 125 / KAMPPI + TAPIOLA')).toBeVisible();
  await expect(page.locator('[data-hsl-status]')).toContainText('Ylisrinne / E3239 / 2 PREV / 3 LIVE');
  await expect(page.locator('[data-hsl-departure]')).toHaveCount(4);
  await expect(page.locator('[data-hsl-previous="true"]')).toHaveCount(2);
  await expect(page.locator('[data-hsl-previous="false"]')).toHaveCount(2);

  const previousGone = page.locator('[data-hsl-previous="true"]').first();
  await expect(previousGone).toContainText('121');
  await expect(previousGone).toContainText('MIN AGO');
  await expect(previousGone).toContainText('+7 MIN');
  await expect(previousGone).toContainText('LIVE');

  const previousLate = page.locator('[data-hsl-previous="true"]').nth(1);
  await expect(previousLate).toContainText('125');
  await expect(previousLate).toContainText('+8 MIN');
  await expect(previousLate.locator('[data-hsl-countdown]')).toContainText('MIN');
  await expect(previousLate.locator('[data-hsl-countdown]')).not.toContainText('AGO');
  await expect(page.locator('.hsl-departure--first-upcoming')).toHaveCount(1);

  await expect(page.locator('[data-hsl-form]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-stop]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-routes]')).toHaveCount(0);
  expect(requestCount).toBeGreaterThanOrEqual(1);
});

test('HSL upstream query starts two hours in the past', async () => {
  let upstreamBody: Record<string, unknown> | null = null;
  const request = new Request('https://aapopihkala.fi/api/current/hsl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stopCode: 'E3239', routes: ['121', '125'] }),
  });

  const response = await fetchHslDeparturesResponse({
    request,
    apiKey: 'test-digitransit-key',
    fetchImpl: async (_input, init) => {
      upstreamBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          data: {
            stops: [
              {
                name: 'Ylisrinne',
                code: 'E3239',
                stoptimesWithoutPatterns: [],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });

  expect(response.status).toBe(200);
  expect(upstreamBody).not.toBeNull();

  const body = upstreamBody as unknown as {
    query: string;
    variables: { stopQuery: string; startTime: number; numberOfDepartures: number };
  };
  expect(body.query).toContain('$startTime: Long!');
  expect(body.query).toContain('startTime: $startTime');
  expect(body.variables.stopQuery).toBe('E3239');
  expect(body.variables.numberOfDepartures).toBe(40);
  expect(
    Math.abs(body.variables.startTime - (Math.floor(Date.now() / 1000) - 2 * 60 * 60))
  ).toBeLessThan(5);
});
