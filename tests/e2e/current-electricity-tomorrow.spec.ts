import { expect, test } from '@playwright/test';

const buildDay = (localMidnightUtc: number, day: 'today' | 'tomorrow') =>
  Array.from({ length: 96 }, (_, index) => {
    const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
    let price = day === 'today' ? 1.33 : 2.0;

    if (day === 'today') {
      if (index >= 52 && index <= 59) price = 0.23;
      if (index === 57) price = 0.2;
      if (index === 64) price = 0.25;
      if (index === 65) price = 0.27;
      if (index === 66) price = 0.28;
      if (index === 67) price = 0.44;
      if (index >= 74 && index <= 81) price = 4.3;
      if (index === 75) price = 5.99;
    } else {
      if (index >= 16 && index <= 23) price = 0.5;
      if (index === 18) price = 0.2;
      if (index >= 72 && index <= 79) price = 6.0;
      if (index === 75) price = 7.5;
    }

    return {
      price,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  });

const buildElectricityFixture = (includeTomorrow = true) => {
  const todayMidnightUtc = Date.UTC(2026, 8, 5, 21, 0, 0);
  const prices = buildDay(todayMidnightUtc, 'today');

  if (includeTomorrow) {
    prices.push(...buildDay(todayMidnightUtc + 24 * 60 * 60 * 1000, 'tomorrow'));
  }

  return { prices: prices.reverse() };
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-06T13:52:00.000Z'));
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
});

test('Current switches the electricity day average and chart to tomorrow when prices are available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture(true)),
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const daySwitch = page.locator('[data-electricity-day-switch]');
  const todayButton = page.locator('[data-electricity-day="today"]');
  const tomorrowButton = page.locator('[data-electricity-day="tomorrow"]');
  const tomorrowDot = page.locator('[data-electricity-tomorrow-dot]');

  await expect(daySwitch).toBeVisible();
  await expect(todayButton).toHaveAttribute('aria-pressed', 'true');
  await expect(tomorrowButton).toHaveAttribute('aria-pressed', 'false');
  await expect(tomorrowDot).toBeVisible();
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(page.locator('[data-electricity-average-comparison]')).toBeHidden();
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
  await expect(page.locator('[data-electricity-interval]')).toHaveText('16:45 - 17:00');

  await tomorrowButton.click();

  await expect(todayButton).toHaveAttribute('aria-pressed', 'false');
  await expect(tomorrowButton).toHaveAttribute('aria-pressed', 'true');
  await expect(tomorrowDot).toBeHidden();
  await expect(page.locator('[data-electricity-price]')).toHaveText('2.22');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TOMORROW');
  await expect(page.locator('[data-electricity-average-comparison]')).toHaveText('+0.76 c/kWh VS TODAY');
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
  await expect(page.locator('[data-electricity-interval]')).toHaveText('16:45 - 17:00');
  await expect(page.locator('[data-electricity-low-value]')).toHaveText('0.20');
  await expect(page.locator('[data-electricity-low-range]')).toHaveText('04:30 - 04:45');
  await expect(page.locator('[data-electricity-high-value]')).toHaveText('7.50');
  await expect(page.locator('[data-electricity-high-range]')).toHaveText('18:45 - 19:00');
  await expect(page.locator('[data-electricity-low-label]')).toContainText('LOWEST 2 H · 0.46');
  await expect(page.locator('[data-electricity-low-label]')).toContainText('04:00 - 06:00');
  await expect(page.locator('[data-electricity-high-label]')).toContainText('HIGHEST 2 H · 6.19');
  await expect(page.locator('[data-electricity-high-label]')).toContainText('18:00 - 20:00');
  await expect(page.locator('[data-electricity-current-line]')).toHaveCount(0);
  await expect(page.locator('.electricity-stats')).toHaveCount(0);
  await expect(page.locator('[data-electricity-chart]')).toHaveAttribute('aria-label', /tomorrow/);

  const chart = page.locator('[data-electricity-chart]');
  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();

  if (chartBox) {
    await chart.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 11,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.2,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
    await chart.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 11,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.2,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
  }

  await expect(page.locator('[data-electricity-chart-tooltip]')).toBeVisible();
  await expect(page.locator('[data-electricity-inspection-band]')).toHaveAttribute('opacity', '1');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);

  await todayButton.click();
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(page.locator('[data-electricity-average-comparison]')).toBeHidden();
  await expect(page.locator('[data-electricity-current-line]')).toHaveCount(1);
  await expect(tomorrowDot).toBeHidden();
});

test('Current keeps the day switch hidden until a complete tomorrow price set exists', async ({ page }) => {
  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture(false)),
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-electricity-day-switch]')).toBeHidden();
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
});
