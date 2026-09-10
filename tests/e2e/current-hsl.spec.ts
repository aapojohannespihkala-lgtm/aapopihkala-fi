import { expect, test } from '@playwright/test';

test('HSL detail loads the Ylisrinne 121 and 125 feed directly', async ({ page }) => {
  const departureOne = new Date(Date.now() + 7 * 60_000).toISOString();
  const departureTwo = new Date(Date.now() + 16 * 60_000).toISOString();

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
            delaySeconds: 120,
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
  await expect(page.locator('[data-hsl-status]')).toContainText('Ylisrinne / E3239 / 1 LIVE');
  await expect(page.locator('[data-hsl-departure]')).toHaveCount(2);
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('125');
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('Tapiola (M)');
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('LIVE');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('121');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('Kamppi');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('+2 MIN');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('SCHED');
  await expect(page.locator('[data-hsl-form]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-stop]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-routes]')).toHaveCount(0);
  expect(requestCount).toBeGreaterThanOrEqual(1);
});
