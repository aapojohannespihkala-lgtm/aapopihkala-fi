import { expect, test } from '@playwright/test';

const buildWeatherFixture = () => {
  const times = Array.from({ length: 144 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 8, 6, index));
    return date.toISOString().slice(0, 13) + ':00';
  });

  return {
    current: {
      time: '2026-09-06T11:15',
      temperature_2m: 12.4,
      apparent_temperature: 11.2,
      weather_code: 3,
      precipitation: 0,
      cloud_cover: 86,
      wind_speed_10m: 4.2,
      wind_direction_10m: 245,
      wind_gusts_10m: 8.4,
      is_day: 1,
    },
    hourly: {
      time: times,
      temperature_2m: times.map((_, index) => 10 + Math.sin(index / 5) * 4),
      precipitation_probability: times.map((_, index) =>
        index >= 14 && index <= 17 ? 65 : 10
      ),
      precipitation: times.map((_, index) =>
        index >= 14 && index <= 17 ? 0.3 : 0
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
      precipitation_sum: [1.2, 0.2, 0, 2.1, 4.4, 0],
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
      wind_speed_10m_max: [6.8, 5.9, 5.2, 7.1, 8.2, 4.8],
      wind_gusts_10m_max: [11.4, 9.8, 8.1, 12.2, 14.1, 7.4],
      sunshine_duration: [17100, 18900, 21600, 10200, 7200, 23400],
    },
  };
};

test.beforeEach(async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildWeatherFixture()),
    });
  });
});

test('Current renders a compact status strip and glanceable Olari weather', async ({ page }) => {
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.current-status-strip')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Current');
  await expect(page.locator('.current-lead')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow'
  );

  await expect(page.locator('[data-weather-temperature]')).toHaveText('12.4');
  await expect(page.locator('[data-weather-condition]')).toHaveText('Overcast');
  await expect(page.locator('[data-weather-current-icon] svg')).toHaveCount(1);
  await expect(page.locator('[data-weather-current-min]')).toHaveText('8');
  await expect(page.locator('[data-weather-current-max]')).toHaveText('15');

  await expect(page.locator('[data-weather-hour]')).toHaveCount(6);
  await expect(page.locator('[data-weather-hour]').first().locator('.weather-hour__time')).toHaveText('12:00');

  await expect(page.locator('[data-weather-day]')).toHaveCount(5);
  await expect(page.locator('[data-weather-day]').first().locator('.weather-day__name')).toHaveText('TOM');
  await expect(page.locator('[data-weather-daily-max-path]')).toHaveCount(1);
  await expect(page.locator('[data-weather-daily-min-path]')).toHaveCount(1);

  await expect(page.locator('[data-weather-sun]')).toHaveText(
    '06:20 - 20:08 · 4.8 h sun'
  );
  await expect(page.locator('[data-weather-temperature-path]')).toHaveCount(1);

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

test('Current weather remains inside a 390 px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/', { waitUntil: 'networkidle' });

  await expect(page.locator('[data-current-weather]')).toBeVisible();
  await expect(page.locator('[data-weather-hour]')).toHaveCount(6);
  await expect(page.locator('[data-weather-day]')).toHaveCount(5);
  await expect(page.locator('.language-switch')).toBeVisible();
  await expect(page.locator('[data-night-mode-toggle]')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
