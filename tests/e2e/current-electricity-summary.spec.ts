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

const buildHistoryFixture = () => ({
  daily: Array.from({ length: 5 }, (_, index) => ({
    day: `2026-09-${String(index + 1).padStart(2, '0')}`,
    average: 2,
    min: 0,
    max: 5,
    hours: 24,
  })),
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-06T16:11:00.000Z'));

  await page.route('https://s3.tradingview.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/markets', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture()),
    });
  });

  await page.route('https://parassahko.fi/tilastot/data.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildHistoryFixture()),
    });
  });
});

test('Current emphasizes month average between day low and day high', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const summary = page.locator('[data-electricity-summary-strip]');
  await expect(summary).toBeVisible();
  await expect(page.locator('.electricity-extremes')).toBeHidden();

  const items = summary.locator(':scope > *');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0).locator('.electricity-extreme__label')).toHaveText('DAY LOW');
  await expect(items.nth(1)).toHaveAttribute('data-electricity-month-average', '');
  await expect(items.nth(1)).toHaveText('SEP AVG 1.92 c/kWh');
  await expect(items.nth(2).locator('.electricity-extreme__label')).toHaveText('DAY HIGH');

  const [lowBox, monthBox, highBox] = await Promise.all([
    items.nth(0).boundingBox(),
    items.nth(1).boundingBox(),
    items.nth(2).boundingBox(),
  ]);

  expect(lowBox).not.toBeNull();
  expect(monthBox).not.toBeNull();
  expect(highBox).not.toBeNull();
  if (lowBox && monthBox && highBox) {
    expect(monthBox.x).toBeGreaterThan(lowBox.x);
    expect(monthBox.x + monthBox.width).toBeLessThan(highBox.x + highBox.width);
  }

  const monthWeight = await items.nth(1).evaluate((element) => Number.parseInt(getComputedStyle(element).fontWeight, 10));
  const lowWeight = await items
    .nth(0)
    .locator('.electricity-extreme__value')
    .evaluate((element) => Number.parseInt(getComputedStyle(element).fontWeight, 10));
  const highWeight = await items
    .nth(2)
    .locator('.electricity-extreme__value')
    .evaluate((element) => Number.parseInt(getComputedStyle(element).fontWeight, 10));

  expect(monthWeight).toBeGreaterThan(lowWeight);
  expect(monthWeight).toBeGreaterThan(highWeight);

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
