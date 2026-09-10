import { expect, test } from '@playwright/test';

test('HSL detail renders realtime departures without persisting the stop selection', async ({ page }) => {
  const departureOne = new Date(Date.now() + 7 * 60_000).toISOString();
  const departureTwo = new Date(Date.now() + 16 * 60_000).toISOString();

  await page.route('**/api/current/hsl', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      stopCode: 'E1234',
      routes: ['100', '200A'],
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'HSL Digitransit',
        fetchedAt: new Date().toISOString(),
        stop: { code: 'E1234', name: 'Example Stop' },
        routes: ['100', '200A'],
        departures: [
          {
            route: '100',
            headsign: 'Central Station',
            scheduledAt: departureOne,
            departureAt: departureOne,
            delaySeconds: 0,
            realtime: true,
            realtimeState: 'UPDATED',
          },
          {
            route: '200A',
            headsign: 'Metro',
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

  const stopInput = page.getByLabel('STOP CODE');
  const routesInput = page.getByLabel('ROUTES / OPTIONAL');
  await expect(stopInput).toHaveValue('');
  await expect(routesInput).toHaveValue('');

  await stopInput.fill('e1234');
  await routesInput.fill('100, 200a');
  await page.getByRole('button', { name: 'LOAD' }).click();

  await expect(page.locator('[data-hsl-status]')).toContainText('Example Stop / E1234 / 1 LIVE');
  await expect(page.locator('[data-hsl-departure]')).toHaveCount(2);
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('100');
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('Central Station');
  await expect(page.locator('[data-hsl-departure]').first()).toContainText('LIVE');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('+2 MIN');
  await expect(page.locator('[data-hsl-departure]').nth(1)).toContainText('SCHED');

  await page.reload();
  await expect(stopInput).toHaveValue('');
  await expect(routesInput).toHaveValue('');
  await expect(page.locator('[data-hsl-status]')).toHaveText('ENTER STOP CODE');
});
