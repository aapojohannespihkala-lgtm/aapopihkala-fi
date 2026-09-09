import { expect, test } from '@playwright/test';

test('Current weather leaves loading state when Open-Meteo stalls', async ({ page }) => {
  test.setTimeout(20_000);

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    } catch {
      // The browser request is expected to be aborted by the Current weather timeout.
    }
  });

  await page.route('**/api/current/**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{}',
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const weather = page.locator('[data-current-weather]');
  const condition = page.locator('[data-weather-condition]');
  const error = page.locator('[data-weather-error]');

  await expect(weather).toHaveAttribute('aria-busy', 'true');
  await expect(weather).toHaveAttribute('aria-busy', 'false', { timeout: 10_000 });
  await expect(condition).toHaveText('Forecast unavailable');
  await expect(error).toBeVisible();
});
