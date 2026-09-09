import { expect, test } from '@playwright/test';

test('Snapshot shows a compact month grid with today marked', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:08:00.000Z'));

  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('https://api.open-meteo.com/**', async (route) => route.abort());
  await page.route('**/api/current/electricity*', async (route) => route.abort());
  await page.route('**/api/current/markets*', async (route) => route.abort());

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  const calendar = page.locator('[data-snapshot-month-calendar]');
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('[data-snapshot-month-calendar-day]')).toHaveCount(30);
  await expect(calendar.locator('.is-outside')).toHaveCount(5);
  await expect(calendar.locator('[data-snapshot-month-calendar-today]')).toHaveText('8');
  await expect(calendar.locator('.snapshot-calendar__month-day').first()).toHaveText('·');
  await expect(calendar.locator('.snapshot-calendar__month-day')).toHaveCount(35);
});
