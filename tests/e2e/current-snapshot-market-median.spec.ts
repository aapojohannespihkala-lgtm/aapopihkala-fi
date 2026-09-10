import { expect, test } from '@playwright/test';

test('calculates the Snapshot median from the displayed selected markets only', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/current/markets' && url.searchParams.get('portfolio') === '1') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'ishares-world', changes: { today: 0.42 } },
            { id: 'handelsbanken-usa', changes: { today: 0.71 } },
            { id: 'nordnet-finland', changes: { today: -0.23 } },
            { id: 'btc', changes: { today: 1.84 } },
            { id: 'remedy', changes: { today: -0.61 } },
            { id: 'not-displayed', changes: { today: 100 } },
          ],
        }),
      });
      return;
    }

    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-snapshot-market-median]')).toHaveText('+0.42%');
  await expect(page.locator('[data-snapshot-market="ishares-world"]')).toHaveText('+0.42%');
  await expect(page.locator('[data-snapshot-market="remedy"]')).toHaveText('-0.61%');
});
