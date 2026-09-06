import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', async (route) => route.abort());
  await page.route('**/api/current/electricity', async (route) => route.abort());
  await page.route('**/api/current/markets', async (route) => route.abort());
  await page.route('**/tv-market-data.js', async (route) => route.abort());
});

test('Current section headings link to their standalone pages', async ({ page }) => {
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.markets-index a.current-section-heading-link')).toHaveAttribute(
    'href',
    '/current/markets/'
  );
  await expect(page.locator('.electricity-index a.current-section-heading-link')).toHaveAttribute(
    'href',
    '/current/electricity/'
  );
  await expect(page.locator('.weather-index a.current-section-heading-link')).toHaveAttribute(
    'href',
    '/current/weather/'
  );
});

test('Electricity has a standalone Current detail page', async ({ page }) => {
  await page.goto('/current/electricity/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Electricity');
  await expect(page.locator('.current-detail-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.locator('[data-current-electricity]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('Weather has a standalone Current detail page', async ({ page }) => {
  await page.goto('/current/weather/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Weather');
  await expect(page.locator('.current-detail-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.locator('[data-current-weather]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});
