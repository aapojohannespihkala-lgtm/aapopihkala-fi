import { expect, test } from '@playwright/test';

const fixedNow = '2026-10-20T12:00:00.000Z';
const ids = ['weather', 'electricity', 'markets', 'rates'];
const widgetPayload = (generatedAt: string, temperature = '9°C') => ({
  schemaVersion: 2,
  minEngineVersion: 2,
  channel: 'prod',
  generatedAt,
  title: 'CURRENT / SNAPSHOT',
  pageUrl: '/current/snapshot/',
  theme: { background: '#1d2a35', panel: '#22323e', foreground: '#ffffff' },
  layouts: { compact: ids, medium: ids, large: ids },
  sections: ids.map((id, index) => ({
    id,
    index: String(index + 1).padStart(2, '0'),
    label: id.toUpperCase(),
    primary: id === 'weather' ? temperature : '1.0',
  })),
});

test('fresh Widget v2 response reaches ready with four sections', async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixedNow));
  await page.route('**/api/current/widget-v2?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(widgetPayload('2026-10-20T11:59:00.000Z')) }));
  await page.goto('/current/widget/');
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'ready');
  await expect(page.locator('[data-section]')).toHaveCount(4);
});

test('an open ready widget becomes stale once its displayed data ages out', async ({ page }) => {
  await page.clock.install({ time: new Date(fixedNow) });
  let requests = 0;
  await page.route('**/api/current/widget-v2?*', (route) => {
    requests += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(widgetPayload('2026-10-20T11:59:00.000Z')),
    });
  });

  await page.goto('/current/widget/');
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'ready');
  await expect(page.locator('[data-footer-status]')).toContainText('UPDATED');
  await page.clock.fastForward(11 * 60_000);
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'stale');
  await expect(page.locator('[data-footer-status]')).toContainText('STALE');
  await expect(page.locator('[data-section]')).toHaveCount(4);
  expect(requests).toBe(1);
});

test('old HTTP 200 payload is visible but explicitly stale, not ready', async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixedNow));
  await page.route('**/api/current/widget-v2?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(widgetPayload('2026-10-20T06:00:00.000Z')) }));
  await page.goto('/current/widget/');
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'stale');
  await expect(page.locator('[data-section]')).toHaveCount(4);
  await expect(page.locator('[data-footer-status]')).toContainText('STALE');
});

test('older HTTP 200 response does not overwrite fresher last-good data', async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixedNow));
  let response = widgetPayload('2026-10-20T11:59:00.000Z', '9°C');
  await page.route('**/api/current/widget-v2?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }));
  await page.goto('/current/widget/');
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'ready');
  response = widgetPayload('2026-10-20T06:00:00.000Z', '2°C');
  await page.locator('[data-widget-refresh]').click();
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'stale');
  await expect(page.locator('[data-section="weather"] .android-primary')).toContainText('9');
  await expect(page.locator('[data-footer-status]')).toContainText('STALE');
});

test('stale HTTP 200 response remains usable as last-good fallback after HTTP 503', async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixedNow));
  let unavailable = false;
  await page.route('**/api/current/widget-v2?*', (route) =>
    unavailable
      ? route.fulfill({ status: 503, body: 'Service unavailable' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(widgetPayload('2026-10-20T06:00:00.000Z')) }));
  await page.goto('/current/widget/');
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'stale');
  await expect(page.locator('[data-section]')).toHaveCount(4);
  unavailable = true;
  await page.locator('[data-widget-refresh]').click();
  await expect(page.locator('[data-widget-root]')).toHaveAttribute('data-load-state', 'stale');
  await expect(page.locator('[data-section]')).toHaveCount(4);
  await expect(page.locator('[data-footer-status]')).toContainText('STALE');
  await expect(page.locator('[data-widget]')).not.toContainText('UNAVAILABLE');
});
