import { expect, test } from '@playwright/test';

const buildElectricityFixture = () => {
  const localMidnightUtc = Date.UTC(2026, 8, 5, 21, 0, 0);
  const prices = Array.from({ length: 96 }, (_, index) => {
    const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
    let price = 1.34;

    if (index >= 54 && index <= 61) price = 0.23;
    if (index === 57) price = 0.2;
    if (index >= 74 && index <= 81) price = 4.3;
    if (index === 75) price = 5.99;

    return {
      price,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  });

  return { prices: prices.reverse() };
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-06T16:11:00.000Z'));

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture()),
    });
  });
});

test('Current keeps electricity window labels separate on mobile and clarifies the NOW reading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.electricity-now__label')).toHaveText('NOW / 15 MIN');
  await expect(page.locator('[data-electricity-low-label]')).toContainText('LOW 2H');
  await expect(page.locator('[data-electricity-high-label]')).toContainText('HIGH 2H');
  await expect(page.locator('[data-electricity-window-leader]')).toHaveCount(2);

  const lowLabel = page.locator('[data-electricity-low-label]');
  const highLabel = page.locator('[data-electricity-high-label]');
  const lowBox = await lowLabel.boundingBox();
  const highBox = await highLabel.boundingBox();

  expect(lowBox).not.toBeNull();
  expect(highBox).not.toBeNull();

  if (lowBox && highBox) {
    const overlaps = !(
      lowBox.x + lowBox.width <= highBox.x ||
      highBox.x + highBox.width <= lowBox.x ||
      lowBox.y + lowBox.height <= highBox.y ||
      highBox.y + highBox.height <= lowBox.y
    );
    expect(overlaps).toBe(false);
  }

  const chart = page.locator('[data-electricity-chart]');
  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();

  if (chartBox) {
    await chart.dispatchEvent('pointermove', {
      pointerType: 'mouse',
      clientX: chartBox.x + chartBox.width * 0.2,
      clientY: chartBox.y + chartBox.height * 0.55,
    });
  }

  await expect(page.locator('[data-electricity-chart-tooltip]')).toBeVisible();
  await expect(chart).toHaveClass(/electricity-chart--inspecting/);

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
