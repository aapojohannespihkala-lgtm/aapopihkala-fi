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

  temperature[20] = 13;
  weatherCode[20] = 2;
  precipitationProbability[20] = 20;

  temperature[22] = 12;
  weatherCode[22] = 0;
  precipitationProbability[22] = 5;

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

const liigaFixture = {
  generatedAt: '2026-09-08T12:08:00.000Z',
  ilvesStanding: { rank: 6, games: 9, points: 6, totalTeams: 17 },
  standings: [
    { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', rank: 1, points: 9 },
    { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 },
  ],
  lastIlvesGame: null,
  nextIlvesGame: {
    id: 301,
    start: '2026-09-08T15:30:00.000Z',
    homeTeamId: 'karpat',
    homeTeam: 'Kärpät',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
  },
  liveIlvesGame: null,
};

type SnapshotFixtureOptions = {
  marketsAvailable?: boolean;
  liigaAvailable?: boolean;
};

const prepareSnapshot = async (page: Page, options: SnapshotFixtureOptions = {}) => {
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

  await page.route('**/api/current/liiga*', async (route) => {
    if (options.liigaAvailable === false) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(liigaFixture),
    });
  });

  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());
    const isPortfolio = url.searchParams.get('portfolio') === '1';

    if (isPortfolio && options.marketsAvailable === false) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }

    const body = isPortfolio ? portfolioFixture : macroFixture;
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
      await expect(page.locator('#current-snapshot-title')).toHaveText('15:08:00');
      await expect(page.locator('[data-snapshot-weather-temperature]')).toHaveText('15.4');
      await expect(page.locator('[data-snapshot-electricity-now]')).not.toHaveText('--.--');
      await expect(page.locator('[data-snapshot-market-median]')).toHaveText('+0.42%');
      await expect(page.locator('[data-snapshot-euribor]')).toHaveText('2.68');
      await expect(page.locator('[data-snapshot-liiga]')).toBeVisible();
      await expect(page.locator('[data-snapshot-liiga-position]')).toHaveAttribute('aria-label', 'League position 6 of 17');
      await expect(page.locator('[data-snapshot-electricity-month-average="true"]')).toHaveText('7.84');
      await expect(page.locator('[data-snapshot-calendar-date]')).toContainText('TUE');
      await expect(page.locator('[data-snapshot-calendar-week]')).toHaveText('WEEK / 37');
      await expect(page.locator('[data-snapshot-weather-forecast]')).toHaveAttribute('data-state', 'ready');

      const geometry = await page.locator('[data-current-snapshot]').evaluate((root) => {
        const snapshot = root as HTMLElement;
        const frame = snapshot.querySelector<HTMLElement>('.snapshot-frame');
        const panels = Array.from(snapshot.querySelectorAll<HTMLElement>('.snapshot-panel__body'));
        const electricityPrice = snapshot.querySelector<HTMLElement>('[data-snapshot-electricity-now]');
        const marketValue = snapshot.querySelector<HTMLElement>('[data-snapshot-market-median]');
        const ratesSource = snapshot.querySelector<HTMLElement>('.snapshot-rates .snapshot-source');
        const ratesChange = snapshot.querySelector<HTMLElement>('[data-snapshot-euribor-change]');
        const analytics = document.querySelector<HTMLElement>('[data-analytics-settings]');
        const footer = snapshot.querySelector<HTMLElement>('.snapshot-footer');
        const refresh = snapshot.querySelector<HTMLElement>('[data-snapshot-refresh]');

        const rect = snapshot.getBoundingClientRect();
        const frameRect = frame?.getBoundingClientRect();
        const ratesSourceRect = ratesSource?.getBoundingClientRect();
        const ratesChangeRect = ratesChange?.getBoundingClientRect();
        const analyticsRect = analytics?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();
        const refreshRect = refresh?.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          viewportHeight: window.innerHeight,
          frameBottom: frameRect?.bottom ?? Number.POSITIVE_INFINITY,
          scrollHeight: document.documentElement.scrollHeight,
          scrollWidth: document.documentElement.scrollWidth,
          panelOverflow: panels.map((body) => ({
            scrollHeight: body.scrollHeight,
            clientHeight: body.clientHeight,
            scrollWidth: body.scrollWidth,
            clientWidth: body.clientWidth,
          })),
          electricityPriceWhiteSpace: electricityPrice
            ? getComputedStyle(electricityPrice).whiteSpace
            : '',
          marketValueWeight: marketValue ? Number(getComputedStyle(marketValue).fontWeight) : 0,
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
      expect(geometry.marketValueWeight).toBeGreaterThanOrEqual(700);
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

  test('counts Markets and Liiga independently in live source status', async ({ page }) => {
    await prepareSnapshot(page, { marketsAvailable: false, liigaAvailable: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-snapshot-liiga]')).toHaveClass(/is-unavailable/);
    await expect(page.locator('[data-snapshot-status]')).toHaveText('LIVE DATA / 3 OF 5 SOURCES');
    await expect(page.locator('[data-snapshot-market-median]')).toHaveText('--');
    await expect(page.locator('[data-snapshot-euribor]')).toHaveText('2.68');
  });

  test('stays noindex and is not linked from the main Current page', async ({ page }) => {
    await prepareSnapshot(page);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');

    await page.goto('/current/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="/current/snapshot/"]')).toHaveCount(0);
  });
});
