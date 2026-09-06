import { expect, test } from '@playwright/test';
import { onRequestGet as getElectricityPriceProxy } from '../../functions/api/current/electricity';

const buildWeatherFixture = () => {
  const times = Array.from({ length: 144 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 8, 6, index));
    return date.toISOString().slice(0, 13) + ':00';
  });

  return {
    current: {
      time: '2026-09-06T11:15',
      temperature_2m: 12.4,
      weather_code: 3,
      is_day: 1,
    },
    hourly: {
      time: times,
      temperature_2m: times.map((_, index) => 10 + Math.sin(index / 5) * 4),
      precipitation_probability: times.map((_, index) =>
        index >= 14 && index <= 17 ? 65 : 10
      ),
      weather_code: times.map((_, index) => (index >= 14 && index <= 17 ? 61 : 3)),
      is_day: times.map((_, index) => (index % 24 >= 5 && index % 24 <= 18 ? 1 : 0)),
    },
    daily: {
      time: [
        '2026-09-06',
        '2026-09-07',
        '2026-09-08',
        '2026-09-09',
        '2026-09-10',
        '2026-09-11',
      ],
      weather_code: [3, 2, 3, 61, 63, 1],
      temperature_2m_min: [8.2, 7.9, 9.1, 10.4, 8.7, 7.8],
      temperature_2m_max: [15.4, 14.8, 16.1, 17.2, 15.9, 16.8],
      precipitation_probability_max: [65, 30, 15, 70, 80, 10],
      sunrise: [
        '2026-09-06T06:20',
        '2026-09-07T06:23',
        '2026-09-08T06:26',
        '2026-09-09T06:29',
        '2026-09-10T06:32',
        '2026-09-11T06:35',
      ],
      sunset: [
        '2026-09-06T20:08',
        '2026-09-07T20:05',
        '2026-09-08T20:01',
        '2026-09-09T19:58',
        '2026-09-10T19:54',
        '2026-09-11T19:51',
      ],
    },
  };
};

const buildElectricityFixture = (overrides: Record<number, number> = {}) => {
  const localMidnightUtc = Date.UTC(2026, 8, 5, 21, 0, 0);
  const prices = Array.from({ length: 96 }, (_, index) => {
    const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
    let price = 1.33;

    if (index >= 52 && index <= 59) price = 0.23;
    if (index === 57) price = 0.2;

    if (index === 64) price = 0.25;
    if (index === 65) price = 0.27;
    if (index === 66) price = 0.28;
    if (index === 67) price = 0.44;

    if (index >= 74 && index <= 81) price = 4.3;
    if (index === 75) price = 5.99;

    if (overrides[index] !== undefined) price = overrides[index];

    return {
      price,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  });

  return { prices: prices.reverse() };
};

test('Current electricity proxy returns validated upstream price data', async () => {
  const originalFetch = globalThis.fetch;
  const fixture = buildElectricityFixture();

  globalThis.fetch = async (input, init) => {
    expect(String(input)).toBe('https://api.porssisahko.net/v2/latest-prices.json');
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');

    return new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const response = await getElectricityPriceProxy();
    const data = (await response.json()) as { prices: unknown[] };

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(data.prices).toHaveLength(96);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-06T13:52:00.000Z'));

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildWeatherFixture()),
    });
  });

  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture()),
    });
  });
});

test('Current renders electricity above the compact Olari weather view', async ({ page }) => {
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.current-status-strip')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Current');
  await expect(page.locator('.current-lead')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow'
  );

  await expect(page.locator('[data-current-electricity]')).toBeVisible();
  await expect(page.locator('.current-electricity-wrap + .current-weather-wrap')).toHaveCount(1);
  await expect(page.locator('[data-electricity-price]')).toHaveText('1.46');
  await expect(page.locator('[data-electricity-average-label]')).toHaveText('DAY AVG / TODAY');
  await expect(page.locator('[data-electricity-now-price]')).toHaveText('0.44 c/kWh');
  await expect(page.locator('[data-electricity-interval]')).toHaveText('16:45 - 17:00');
  await expect(page.locator('[data-electricity-low-value]')).toHaveText('0.20');
  await expect(page.locator('[data-electricity-low-range]')).toHaveText('14:15 - 14:30');
  await expect(page.locator('[data-electricity-high-value]')).toHaveText('5.99');
  await expect(page.locator('[data-electricity-high-range]')).toHaveText('18:45 - 19:00');
  await expect(page.locator('[data-electricity-price-path]')).toHaveCount(1);
  await expect(page.locator('[data-electricity-current-line]')).toHaveCount(1);
  await expect(page.locator('[data-electricity-low-band]')).toHaveCount(1);
  await expect(page.locator('[data-electricity-high-band]')).toHaveCount(1);
  await expect(page.locator('[data-electricity-low-label]')).toContainText('LOWEST 2 H · 0.23');
  await expect(page.locator('[data-electricity-high-label]')).toContainText('HIGHEST 2 H · 4.51');
  await expect(page.locator('.electricity-stats')).toHaveCount(0);
  await expect(page.locator('[data-electricity-y-label]')).toHaveText(['0', '5', '10']);

  const electricityChart = page.locator('[data-electricity-chart]');
  const chartBox = await electricityChart.boundingBox();
  expect(chartBox).not.toBeNull();

  if (chartBox) {
    await electricityChart.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 7,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.55,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
    await electricityChart.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 7,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.55,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
  }

  await expect(page.locator('[data-electricity-chart-tooltip]')).toBeVisible();
  await expect(page.locator('[data-electricity-chart-tooltip-time]')).toHaveText(
    /\d{2}:\d{2} - \d{2}:\d{2}/
  );
  await expect(page.locator('[data-electricity-chart-tooltip-price]')).toHaveText(
    /-?\d+\.\d{2} c\/kWh/
  );
  await expect(page.locator('[data-electricity-inspection-band]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-electricity-inspection-line]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-electricity-inspection-point]')).toHaveAttribute('opacity', '1');

  await expect(page.locator('[data-weather-temperature]')).toHaveText('12.4');
  await expect(page.locator('[data-weather-condition]')).toHaveText('Overcast');
  await expect(page.locator('[data-weather-current-icon] svg')).toHaveCount(1);
  await expect(page.locator('.weather-current__reading [data-weather-current-min]')).toHaveText('8');
  await expect(page.locator('.weather-current__reading [data-weather-current-max]')).toHaveText('15');

  await expect(page.locator('[data-weather-sunrise]')).toHaveText('06:20');
  await expect(page.locator('[data-weather-sunset]')).toHaveText('20:08');
  await expect(page.locator('[data-weather-daylight]')).toHaveText('13H 48M');
  await expect(page.locator('[data-weather-solar-arc]')).toHaveCount(1);
  await expect(page.locator('[data-weather-sun-position]')).toHaveAttribute('opacity', '1');
  await expect(page.locator('[data-weather-solar]')).toHaveAttribute(
    'aria-label',
    'Sunrise 06:20, sunset 20:08, day length 13H 48M'
  );
  await expect(page.locator('.weather-current__solar')).not.toContainText('DAYLIGHT');

  await expect(page.locator('.weather-metrics')).toHaveCount(0);
  await expect(page.locator('.weather-subheading')).toHaveCount(0);
  await expect(page.locator('[data-weather-chart]')).toHaveCount(0);
  await expect(page.locator('[data-weather-rain-note]')).toHaveCount(0);
  await expect(page.locator('[data-weather-today]')).toHaveCount(0);

  await expect(page.locator('[data-weather-hour]')).toHaveCount(6);
  await expect(page.locator('[data-weather-hour]').first().locator('.weather-hour__time')).toHaveText('12:00');

  await expect(page.locator('[data-weather-day]')).toHaveCount(5);
  await expect(page.locator('[data-weather-day]').first().locator('.weather-day__name')).toHaveText('MON');
  await expect(page.locator('[data-weather-daily-max-path]')).toHaveCount(1);
  await expect(page.locator('[data-weather-daily-min-path]')).toHaveCount(1);
  await expect(page.locator('[data-weather-daily-chart] line')).toHaveCount(0);

  const languageSwitch = page.locator('.language-switch');
  await expect(languageSwitch).toBeVisible();
  await expect(languageSwitch).toHaveAttribute('href', '/');

  const nightModeToggle = page.locator('[data-night-mode-toggle]');
  await expect(nightModeToggle).toBeVisible();
  await expect(nightModeToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveClass(/site-night-mode/);

  await nightModeToggle.click();
  await expect(nightModeToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveClass(/site-night-mode/);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/current/"]')).toHaveCount(0);
});

test('Electricity chart rounds the five-cent axis around negative and high prices', async ({ page }) => {
  await page.unroute('**/api/current/electricity');
  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildElectricityFixture({ 8: -1.2, 72: 23 })),
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-electricity-y-label]')).toHaveText([
    '-5',
    '0',
    '5',
    '10',
    '15',
    '20',
    '25',
  ]);
});

test('Current modules remain inside a 390 px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/', { waitUntil: 'networkidle' });

  await expect(page.locator('[data-current-electricity]')).toBeVisible();
  await expect(page.locator('[data-electricity-chart]')).toBeVisible();
  await expect(page.locator('[data-current-weather]')).toBeVisible();
  await expect(page.locator('[data-weather-hour]')).toHaveCount(6);
  await expect(page.locator('[data-weather-day]')).toHaveCount(5);
  await expect(page.locator('[data-weather-solar-arc]')).toBeVisible();
  await expect(page.locator('[data-weather-daylight]')).toBeVisible();
  await expect(page.locator('.language-switch')).toBeVisible();
  await expect(page.locator('[data-night-mode-toggle]')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
