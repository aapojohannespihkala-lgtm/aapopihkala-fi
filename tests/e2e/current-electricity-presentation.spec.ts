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

test('Current keeps electricity annotations compact and separates current from inspected price markers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.electricity-now__label')).toHaveText('NOW / 15 MIN');
  await expect(page.locator('.electricity-extremes')).toBeHidden();
  await expect(page.locator('[data-electricity-window-leader]')).toHaveCount(0);

  const lowLabel = page.locator('[data-electricity-low-label]');
  const highLabel = page.locator('[data-electricity-high-label]');

  await expect(lowLabel).not.toContainText(/LOW/i);
  await expect(highLabel).not.toContainText(/HIGH/i);
  await expect(lowLabel).toContainText('c/kWh');
  await expect(highLabel).toContainText('c/kWh');

  const lowLines = await lowLabel.locator('text').allTextContents();
  const highLines = await highLabel.locator('text').allTextContents();

  expect(lowLines).toHaveLength(3);
  expect(highLines).toHaveLength(3);
  expect(lowLines[1]).toMatch(/^\d{2}:\d{2} -$/);
  expect(lowLines[2]).toMatch(/^\d{2}:\d{2}$/);
  expect(highLines[1]).toMatch(/^\d{2}:\d{2} -$/);
  expect(highLines[2]).toMatch(/^\d{2}:\d{2}$/);

  const currentLine = page.locator('[data-electricity-current-line]');
  const currentPoint = page.locator('[data-electricity-current-point]');
  await expect(currentLine).toHaveCount(1);
  await expect(currentPoint).toBeHidden();

  const currentMarkerStyle = await currentLine.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      dash: style.strokeDasharray,
      stroke: style.stroke,
    };
  });
  expect(currentMarkerStyle.dash === 'none' || currentMarkerStyle.dash === '').toBe(true);

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
  await expect(page.locator('[data-electricity-inspection-band]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-electricity-inspection-line]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-electricity-inspection-point]')).toHaveAttribute('opacity', '1');
  await expect(chart).toHaveClass(/electricity-chart--inspecting/);

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
