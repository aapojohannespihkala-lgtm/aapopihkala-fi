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
  await page.route('**/tv-market-data.js', async (route) => route.abort());
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
});

test('Current switches the electricity day average and chart without moving the chart', async ({ page }) => {
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
  const comparison = page.locator('[data-electricity-average-comparison]');
  const chart = page.locator('[data-electricity-chart]');

  await expect(daySwitch).toBeVisible();
  await expect(todayButton).toHaveAttribute('aria-pressed', 'true');
  await expect(tomorrowButton).toHaveAttribute('aria-pressed', 'false');
  await expect(tomorrowDot).toBeVisible();
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(comparison).toHaveText('TOMORROW AVG 2.22 c/kWh');
  await expect(comparison).toBeVisible();
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
  await expect(page.locator('[data-electricity-interval]')).toHaveText('16:45 - 17:00');

  const todayChartBox = await chart.boundingBox();
  expect(todayChartBox).not.toBeNull();
  expect(todayChartBox?.height).toBeCloseTo(168, 0);

  await tomorrowButton.click();

  await expect(todayButton).toHaveAttribute('aria-pressed', 'false');
  await expect(tomorrowButton).toHaveAttribute('aria-pressed', 'true');
  await expect(tomorrowDot).toBeHidden();
  await expect(page.locator('[data-electricity-price]')).toHaveText('2.22');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TOMORROW');
  await expect(comparison).toHaveText('+0.76 c/kWh VS TODAY');
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
  await expect(page.locator('[data-electricity-interval]')).toHaveText('16:45 - 17:00');

  const lowLabel = page.locator('[data-electricity-low-label]');
  const highLabel = page.locator('[data-electricity-high-label]');
  await expect(lowLabel.locator('text').first()).toHaveText('0.46');
  await expect(highLabel.locator('text').first()).toHaveText('6.19');

  const lowLines = await lowLabel.locator('text').allTextContents();
  const highLines = await highLabel.locator('text').allTextContents();
  expect(lowLines).toEqual(['0.46', 'c/kWh', '04:00 -', '06:00']);
  expect(highLines).toEqual(['6.19', 'c/kWh', '18:00 -', '20:00']);
  await expect(page.locator('[data-electricity-current-line]')).toHaveCount(0);
  await expect(page.locator('.electricity-stats')).toHaveCount(0);
  await expect(chart).toHaveAttribute('aria-label', /tomorrow/);

  const tomorrowChartBox = await chart.boundingBox();
  expect(tomorrowChartBox).not.toBeNull();
  if (todayChartBox && tomorrowChartBox) {
    expect(Math.abs(tomorrowChartBox.y - todayChartBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(tomorrowChartBox.height - todayChartBox.height)).toBeLessThanOrEqual(1);
  }

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
  await expect(comparison).toHaveText('TOMORROW AVG 2.22 c/kWh');
  await expect(page.locator('[data-electricity-current-line]')).toHaveCount(1);
  await expect(tomorrowDot).toBeHidden();

  const todayAgainChartBox = await chart.boundingBox();
  expect(todayAgainChartBox).not.toBeNull();
  if (todayChartBox && todayAgainChartBox) {
    expect(Math.abs(todayAgainChartBox.y - todayChartBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(todayAgainChartBox.height - todayChartBox.height)).toBeLessThanOrEqual(1);
  }
});

test('Current keeps stable space until a complete tomorrow price set exists', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture(false)),
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const daySwitch = page.locator('[data-electricity-day-switch]');
  const comparison = page.locator('[data-electricity-average-comparison]');
  const chart = page.locator('[data-electricity-chart]');

  await expect(daySwitch).toBeHidden();
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(comparison).toBeHidden();
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');

  const reservedStyles = await page.evaluate(() => {
    const switchElement = document.querySelector<HTMLElement>('[data-electricity-day-switch]');
    const comparisonElement = document.querySelector<HTMLElement>('[data-electricity-average-comparison]');
    return {
      switchDisplay: switchElement ? getComputedStyle(switchElement).display : '',
      switchVisibility: switchElement ? getComputedStyle(switchElement).visibility : '',
      comparisonDisplay: comparisonElement ? getComputedStyle(comparisonElement).display : '',
      comparisonVisibility: comparisonElement ? getComputedStyle(comparisonElement).visibility : '',
    };
  });

  expect(reservedStyles.switchDisplay).toBe('flex');
  expect(reservedStyles.switchVisibility).toBe('hidden');
  expect(reservedStyles.comparisonDisplay).toBe('block');
  expect(reservedStyles.comparisonVisibility).toBe('hidden');

  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();
  expect(chartBox?.height).toBeCloseTo(168, 0);
});
