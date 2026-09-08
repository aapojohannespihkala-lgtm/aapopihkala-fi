import { expect, test, type Page } from '@playwright/test';

// Keep these fixtures deterministic so snapshot hierarchy and spacing regressions are measurable.
const weatherFixture = (() => {
  const time = Array.from({ length: 48 }, (_, index) => {
    const day = index < 24 ? '08' : '09';
    const hour = String(index % 24).padStart(2, '0');
    return `2026-09-${day}T${hour}:00`;
  });
  const temperature = Array.from({ length: 48 }, () => 14);
  const weatherCode = Array.from({ length: 48 }, () => 3);
  const precipitationProbability = Array.from({ length: 48 }, () => 10);

  temperature[16] = 15;
  weatherCode[16] = 3;
  precipitationProbability[16] = 10;

  temperature[18] = 14;
  weatherCode[18] = 61;
  precipitationProbability[18] = 65;

  temperature[21] = 13;
  weatherCode[21] = 2;
  precipitationProbability[21] = 20;

  return {
    current: {
      time: '2026-09-08T15:08',
      temperature_2m: 15.4,
      weather_code: 3,
    },
    daily: {
      time: ['2026-09-08'],
      temperature_2m_min: [12],
      temperature_2m_max: [18],
    },
    hourly: {
      time,
      temperature_2m: temperature,
      weather_code: weatherCode,
      precipitation_probability: precipitationProbability,
    },
  };
})();

const electricityFixture = (() => {
  const localMidnightUtc = Date.UTC(2026, 8, 7, 21, 0, 0);

  return {
    prices: Array.from({ length: 96 }, (_, index) => {
      const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
      const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
      const price =
        index === 0 ? 1.2 :
        index === 60 ? 4.82 :
        index === 95 ? 9.8 :
        2.2 + Math.sin(index / 9) * 1.1 + index / 45;

      return {
        price,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }).reverse(),
  };
})();

const monthAverageFixture = {
  average: 7.84,
  kind: 'month-to-date',
  month: '2026-09',
  through: '2026-09-07',
  hours: 168,
  unit: 'c/kWh',
  vatIncluded: true,
  source: 'ParasSähkö.fi',
  underlyingSource: 'Porssisahko.net API',
};

const portfolioFixture = {
  items: [
    { id: 'ishares-world', changes: { today: 0.42 } },
    { id: 'handelsbanken-usa', changes: { today: 0.71 } },
    { id: 'nordnet-finland', changes: { today: -0.23 } },
    { id: 'btc', changes: { today: 1.84 } },
    { id: 'remedy', changes: { today: -0.61 } },
  ],
};

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
      change1y: 0.652,
      points: [
        { value: 3.331, observedAt: '2025-09-04' },
        { value: 3.112, observedAt: '2025-12-04' },
        { value: 2.921, observedAt: '2026-03-04' },
        { value: 2.783, observedAt: '2026-06-04' },
        { value: 2.679, observedAt: '2026-09-04' },
      ],
    },
  ],
};

const prepareSnapshot = async (page: Page) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:08:00.000Z'));

  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherFixture),
    });
  });

  await page.route('**/api/current/electricity-month', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(monthAverageFixture),
    });
  });

  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(electricityFixture),
    });
  });

  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());
    const body = url.searchParams.get('portfolio') === '1'
      ? portfolioFixture
      : macroFixture;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
};

test.describe('Current Snapshot', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`fits live summary into one mobile viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await prepareSnapshot(page);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-current-snapshot]')).toBeVisible();
      await expect(page.locator('[data-snapshot-status]')).toHaveText('LIVE DATA / OK');
      await expect(page.locator('[data-analytics-settings]')).toBeVisible();

      await expect(page.locator('[data-snapshot-weather-temperature]')).toHaveText('15.4');
      await expect(page.locator('[data-snapshot-weather-condition]')).toHaveText('Overcast');
      await expect(page.locator('[data-snapshot-weather-low]')).toHaveText('12');
      await expect(page.locator('[data-snapshot-weather-high]')).toHaveText('18');
      await expect(page.locator('[data-snapshot-weather-forecast]')).toBeVisible();
      await expect(page.locator('.snapshot-weather__forecast-label')).toHaveText('NEXT');
      await expect(page.locator('[data-snapshot-weather-forecast-time="0"]')).toHaveText('16:00');
      await expect(page.locator('[data-snapshot-weather-forecast-temperature="0"]')).toHaveText('15°');
      await expect(page.locator('[data-snapshot-weather-forecast-condition="0"]')).toHaveText('Overcast');
      await expect(page.locator('[data-snapshot-weather-forecast-icon="0"] path')).toHaveCount(1);
      await expect(page.locator('[data-snapshot-weather-forecast-time="1"]')).toHaveText('18:00');
      await expect(page.locator('[data-snapshot-weather-forecast-temperature="1"]')).toHaveText('14°');
      await expect(page.locator('[data-snapshot-weather-forecast-condition="1"]')).toHaveText('Rain');
      await expect(page.locator('[data-snapshot-weather-forecast-icon="1"] path')).toHaveCount(2);
      await expect(page.locator('[data-snapshot-weather-forecast-time="2"]')).toHaveText('21:00');
      await expect(page.locator('[data-snapshot-weather-forecast-temperature="2"]')).toHaveText('13°');
      await expect(page.locator('[data-snapshot-weather-forecast-condition="2"]')).toHaveText('Partly cloudy');

      await expect(page.locator('[data-snapshot-electricity-month-average]')).toHaveText('7.84');
      await expect(page.locator('.snapshot-electricity__value .snapshot-micro')).toHaveText('MONTH AVG / THROUGH 07 SEP');
      await expect(page.locator('.snapshot-electricity__stats > div:first-child dt')).toHaveText('DAY AVG');
      await expect(page.locator('.snapshot-electricity__stats > div:first-child dd')).toHaveText('3.46');
      await expect(page.locator('[data-snapshot-electricity-now-overlay]')).toHaveText('4.82');
      await expect(page.locator('[data-snapshot-electricity-now-marker]')).toBeVisible();
      await expect(page.locator('[data-snapshot-electricity-low]')).toHaveText('1.20');
      await expect(page.locator('[data-snapshot-electricity-high]')).toHaveText('9.80');
      await expect(page.locator('[data-snapshot-electricity-chart-path]')).toHaveAttribute('d', /M/);
      await expect(page.locator('[data-snapshot-electricity-chart]')).toHaveAttribute('data-chart-points', '24');
      await expect(page.locator('.snapshot-electricity .snapshot-source')).toContainText('PARASSÄHKÖ.FI');

      await expect(page.locator('.snapshot-markets .snapshot-kicker')).toHaveText('TODAY / SELECTED PERFORMANCE');
      await expect(page.locator('[data-snapshot-market="ishares-world"]')).toHaveText('+0.42%');
      await expect(page.locator('[data-snapshot-market="nordnet-finland"]')).toHaveText('-0.23%');
      await expect(page.locator('[data-snapshot-market="btc"]')).toHaveText('+1.84%');

      await expect(page.locator('[data-snapshot-euribor]')).toHaveText('2.679');
      await expect(page.locator('[data-snapshot-euribor-change]')).toHaveText('+0.652 PP');
      await expect(page.locator('[data-snapshot-euribor-chart-path]')).toHaveAttribute('d', /L/);
      await expect(page.locator('[data-snapshot-euribor-chart-high]')).toHaveText('3.3');
      await expect(page.locator('[data-snapshot-euribor-chart-low]')).toHaveText('2.7');

      await expect(page.locator('a[href="/current/weather/"]')).toHaveCount(1);
      await expect(page.locator('a[href="/current/electricity/"]')).toHaveCount(1);
      await expect(page.locator('a[href="/current/markets/"]')).toHaveCount(2);

      const geometry = await page.evaluate(() => {
        const snapshot = document.querySelector<HTMLElement>('[data-current-snapshot]');
        const frame = document.querySelector<HTMLElement>('.snapshot-frame');
        const rect = snapshot?.getBoundingClientRect();
        const frameRect = frame?.getBoundingClientRect();
        const panelBodies = Array.from(document.querySelectorAll<HTMLElement>('.snapshot-panel__body'));
        const electricityPrice = document.querySelector<HTMLElement>('.snapshot-electricity__price');
        const ratesSource = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-source');
        const ratesChange = document.querySelector<HTMLElement>('.snapshot-rates__change');
        const analyticsSettings = document.querySelector<HTMLElement>('[data-analytics-settings]');
        const footer = document.querySelector<HTMLElement>('.snapshot-footer');
        const refresh = document.querySelector<HTMLElement>('[data-snapshot-refresh]');
        const ratesSourceRect = ratesSource?.getBoundingClientRect();
        const ratesChangeRect = ratesChange?.getBoundingClientRect();
        const analyticsRect = analyticsSettings?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();
        const refreshRect = refresh?.getBoundingClientRect();

        return {
          viewportHeight: window.innerHeight,
          bottom: rect?.bottom ?? Number.POSITIVE_INFINITY,
          frameBottom: frameRect?.bottom ?? Number.POSITIVE_INFINITY,
          scrollHeight: document.documentElement.scrollHeight,
          scrollWidth: document.documentElement.scrollWidth,
          panelOverflow: panelBodies.map((body) => ({
            scrollHeight: body.scrollHeight,
            clientHeight: body.clientHeight,
            scrollWidth: body.scrollWidth,
            clientWidth: body.clientWidth,
          })),
          electricityPriceWhiteSpace: electricityPrice
            ? getComputedStyle(electricityPrice).whiteSpace
            : '',
          ratesSourceTop: ratesSourceRect?.top ?? Number.NEGATIVE_INFINITY,
          ratesChangeBottom: ratesChangeRect?.bottom ?? Number.POSITIVE_INFINITY,
          analyticsTop: analyticsRect?.top ?? Number.NEGATIVE_INFINITY,
          analyticsBottom: analyticsRect?.bottom ?? Number.POSITIVE_INFINITY,
          analyticsLeft: analyticsRect?.left ?? Number.NEGATIVE_INFINITY,
          analyticsRight: analyticsRect?.right ?? Number.POSITIVE_INFINITY,
          footerTop: footerRect?.top ?? Number.POSITIVE_INFINITY,
          footerBottom: footerRect?.bottom ?? Number.NEGATIVE_INFINITY,
          footerLeft: footerRect?.left ?? Number.POSITIVE_INFINITY,
          refreshLeft: refreshRect?.left ?? Number.NEGATIVE_INFINITY,
        };
      });

      expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
      expect(geometry.frameBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
      expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
      expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
      expect(geometry.electricityPriceWhiteSpace).toBe('nowrap');
      expect(geometry.ratesSourceTop).toBeGreaterThanOrEqual(geometry.ratesChangeBottom + 1);
      expect(geometry.analyticsTop).toBeGreaterThanOrEqual(geometry.footerTop - 1);
      expect(geometry.analyticsBottom).toBeLessThanOrEqual(geometry.footerBottom + 1);
      expect(geometry.analyticsLeft).toBeGreaterThanOrEqual(geometry.footerLeft - 1);
      expect(geometry.analyticsRight).toBeLessThanOrEqual(geometry.refreshLeft - 2);

      for (const panel of geometry.panelOverflow) {
        expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
        expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1);
      }
    });
  }

  test('stays noindex and is not linked from the main Current page', async ({ page }) => {
    await prepareSnapshot(page);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');

    await page.goto('/current/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="/current/snapshot/"]')).toHaveCount(0);
  });
});
