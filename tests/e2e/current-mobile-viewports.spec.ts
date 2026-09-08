import { expect, test, type Page } from '@playwright/test';

const weatherFixture = {
  current: {
    time: '2026-09-08T03:00',
    temperature_2m: 15.4,
    weather_code: 3,
    is_day: 0,
  },
  hourly: {
    time: Array.from({ length: 12 }, (_, index) => `2026-09-08T${String(index + 4).padStart(2, '0')}:00`),
    temperature_2m: [15, 16, 16, 15, 15, 15, 16, 17, 17, 16, 15, 14],
    precipitation_probability: [11, 19, 29, 39, 51, 61, 55, 44, 33, 22, 18, 15],
    weather_code: [3, 3, 3, 61, 3, 61, 3, 3, 3, 3, 3, 3],
    is_day: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  daily: {
    time: [
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ],
    weather_code: [3, 61, 61, 61, 61, 61],
    temperature_2m_min: [15, 15, 10, 9, 9, 11],
    temperature_2m_max: [17, 17, 16, 18, 18, 17],
    precipitation_probability_max: [61, 73, 70, 41, 36, 30],
    sunrise: [
      '2026-09-08T06:32',
      '2026-09-09T06:35',
      '2026-09-10T06:38',
      '2026-09-11T06:41',
      '2026-09-12T06:44',
      '2026-09-13T06:47',
    ],
    sunset: [
      '2026-09-08T20:05',
      '2026-09-09T20:02',
      '2026-09-10T19:59',
      '2026-09-11T19:56',
      '2026-09-12T19:53',
      '2026-09-13T19:50',
    ],
  },
};

const electricityFixture = (() => {
  const localMidnightUtc = Date.UTC(2026, 8, 7, 21, 0, 0);
  return {
    prices: Array.from({ length: 96 }, (_, index) => {
      const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
      const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
      const price = index < 20 ? 0.2 + index * 0.01 : index < 72 ? 0.5 + (index - 20) * 0.04 : 5 + Math.sin(index) * 2;
      return {
        price,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }).reverse(),
  };
})();

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
      change1y: 0.652,
      points: [
        { observedAt: '2025-09-05', value: 2.027 },
        { observedAt: '2026-03-05', value: 2.35 },
        { observedAt: '2026-09-04', value: 2.679 },
      ],
    },
    {
      id: 'world',
      value: 178.93,
      observedAt: '2026-09-04',
      change1y: 18.93,
      points: [
        { observedAt: '2025-09-05', value: 150 },
        { observedAt: '2026-03-05', value: 151 },
        { observedAt: '2026-09-04', value: 178.395 },
      ],
    },
  ],
  source: 'Bank of Finland + ECB + Yahoo Finance',
};

const prepareCurrent = async (page: Page) => {
  await page.clock.setFixedTime(new Date('2026-09-08T00:08:00.000Z'));

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
      ? { items: [], expected: 19, liveExpected: 19 }
      : macroFixture;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
};

const sectionGeometry = async (page: Page, sectionName: string) =>
  page.evaluate((name) => {
    const section = document.querySelector<HTMLElement>(`[data-current-section="${name}"]`);
    const content = section?.querySelector<HTMLElement>(`[data-current-${name}]`);
    const next = section?.nextElementSibling;
    const sectionRect = section?.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();
    const nextRect = next instanceof HTMLElement ? next.getBoundingClientRect() : null;

    return {
      viewportHeight: window.innerHeight,
      sectionTop: sectionRect?.top ?? Number.NaN,
      sectionBottom: sectionRect?.bottom ?? Number.NaN,
      contentTop: contentRect?.top ?? Number.NaN,
      contentBottom: contentRect?.bottom ?? Number.NaN,
      nextTop: nextRect?.top ?? Number.POSITIVE_INFINITY,
    };
  }, sectionName);

const marketGeometry = async (page: Page) =>
  page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('[data-current-section="markets"]');
    const performance = section?.querySelector<HTMLElement>('[data-current-market-performance]');
    const macro = section?.querySelector<HTMLElement>('.markets-macro');
    const sectionRect = section?.getBoundingClientRect();
    const performanceRect = performance?.getBoundingClientRect();
    const macroRect = macro?.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      sectionTop: sectionRect?.top ?? Number.NaN,
      performanceTop: performanceRect?.top ?? Number.NaN,
      performanceBottom: performanceRect?.bottom ?? Number.NaN,
      performanceHeight: performanceRect?.height ?? Number.NaN,
      macroTop: macroRect?.top ?? Number.NaN,
    };
  });

const ratesGeometry = async (page: Page) =>
  page.evaluate(() => {
    const rates = document.querySelector<HTMLElement>('[data-current-section="rates"]');
    const lastRow = rates?.querySelector<HTMLElement>('.markets-macro__row:last-of-type');
    const markets = rates?.closest<HTMLElement>('[data-current-markets]');
    const footer = markets?.querySelector<HTMLElement>('.markets-footer');
    const ratesRect = rates?.getBoundingClientRect();
    const lastRowRect = lastRow?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      sectionTop: ratesRect?.top ?? Number.NaN,
      sectionBottom: ratesRect?.bottom ?? Number.NaN,
      sectionHeight: ratesRect?.height ?? Number.NaN,
      lastRowBottom: lastRowRect?.bottom ?? Number.NaN,
      footerTop: footerRect?.top ?? Number.POSITIVE_INFINITY,
    };
  });

const weatherAlignment = async (page: Page) =>
  page.evaluate(() => {
    const days = [...document.querySelectorAll<HTMLElement>('[data-weather-day]')];
    const maxPoints = [...document.querySelectorAll<SVGCircleElement>('[data-weather-daily-chart] circle')].slice(0, 5);
    const dayCenters = days.map((day) => {
      const rect = day.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    const pointCenters = maxPoints.map((point) => {
      const rect = point.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    const deltas = dayCenters.map((center, index) => Math.abs(center - (pointCenters[index] ?? Number.NaN)));
    const chart = document.querySelector<SVGSVGElement>('[data-weather-daily-chart]');
    const chartRect = chart?.getBoundingClientRect();

    return {
      dayCount: dayCenters.length,
      pointCount: pointCenters.length,
      maxDelta: Math.max(...deltas),
      chartCssHeight: chartRect?.height ?? Number.NaN,
      chartAttributeHeight: Number(chart?.getAttribute('height') ?? Number.NaN),
    };
  });

const mobileTypeHierarchy = async (page: Page) =>
  page.evaluate(() => {
    const fontSize = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      return element ? Number.parseFloat(getComputedStyle(element).fontSize) : Number.NaN;
    };

    return {
      weatherHero: fontSize('.weather-temperature'),
      electricityHero: fontSize('.electricity-price'),
      macroValue: fontSize('[data-current-section="rates"] .markets-macro__value'),
      weatherLabel: fontSize('.weather-index'),
      electricityLabel: fontSize('.electricity-index'),
      ratesLabel: fontSize('[data-current-section="rates"] .markets-panel-label'),
      weatherFooter: fontSize('.weather-footer'),
      electricityFooter: fontSize('.electricity-footer'),
    };
  });

test.describe('Current mobile viewport isolation', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 375, height: 667 },
  ]) {
    test(`keeps dashboard sections isolated and visually filled at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await prepareCurrent(page);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-weather-day]')).toHaveCount(5);
      await expect(page.locator('[data-weather-daily-chart] circle')).toHaveCount(10);
      await expect(page.locator('[data-electricity-price-path]')).toHaveCount(1);
      await expect(page.locator('[data-market-sparkline="euribor-3m"]')).toBeVisible();
      await expect(page.locator('[data-market-sparkline="world"]')).toBeVisible();

      const weather = await sectionGeometry(page, 'weather');
      expect(weather.contentBottom).toBeLessThanOrEqual(weather.viewportHeight + 1);
      expect(weather.nextTop).toBeGreaterThanOrEqual(weather.viewportHeight - 1);

      const alignment = await weatherAlignment(page);
      expect(alignment.dayCount).toBe(5);
      expect(alignment.pointCount).toBe(5);
      expect(alignment.maxDelta).toBeLessThanOrEqual(2);
      expect(alignment.chartCssHeight).toBeCloseTo(124, 0);
      expect(alignment.chartAttributeHeight).toBe(124);

      const hierarchy = await mobileTypeHierarchy(page);
      expect(Math.abs(hierarchy.weatherHero - hierarchy.electricityHero)).toBeLessThanOrEqual(0.5);
      expect(hierarchy.weatherHero).toBeGreaterThan(hierarchy.macroValue * 2);
      expect(hierarchy.macroValue).toBeGreaterThan(hierarchy.weatherLabel * 1.8);
      expect(Math.abs(hierarchy.weatherLabel - hierarchy.electricityLabel)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(hierarchy.weatherLabel - hierarchy.ratesLabel)).toBeLessThanOrEqual(0.25);
      expect(hierarchy.weatherFooter).toBeLessThan(hierarchy.weatherLabel);
      expect(hierarchy.electricityFooter).toBeLessThan(hierarchy.electricityLabel);

      const nav = page.locator('[data-current-section-nav]');
      await expect(nav).toBeVisible();
      await nav.click();

      await expect.poll(async () => {
        const electricity = await sectionGeometry(page, 'electricity');
        return electricity.sectionTop;
      }).toBeLessThan(66);

      const electricity = await sectionGeometry(page, 'electricity');
      expect(electricity.contentBottom).toBeLessThanOrEqual(electricity.viewportHeight + 1);
      expect(electricity.nextTop).toBeGreaterThanOrEqual(electricity.viewportHeight - 1);

      const electricityChart = page.locator('[data-electricity-chart]');
      const electricityChartBox = await electricityChart.boundingBox();
      expect(electricityChartBox?.height).toBeCloseTo(168, 0);
      await expect(electricityChart).toHaveAttribute('height', '168');

      await nav.click();

      await expect.poll(async () => {
        const markets = await marketGeometry(page);
        return markets.sectionTop;
      }).toBeLessThan(66);

      const markets = await marketGeometry(page);
      const availableMarketViewport = markets.viewportHeight - 64;
      expect(markets.performanceHeight).toBeGreaterThanOrEqual(availableMarketViewport - 1);
      expect(markets.performanceHeight).toBeLessThanOrEqual(availableMarketViewport * 2 + 1);
      expect(markets.macroTop).toBeGreaterThanOrEqual(markets.viewportHeight - 1);

      await nav.click();

      await expect.poll(async () => {
        const rates = await ratesGeometry(page);
        return rates.sectionTop;
      }).toBeLessThan(66);

      const rates = await ratesGeometry(page);
      const availableRatesViewport = rates.viewportHeight - 64;
      expect(rates.sectionHeight).toBeGreaterThanOrEqual(availableRatesViewport - 1);
      expect(rates.lastRowBottom).toBeLessThanOrEqual(rates.viewportHeight + 1);
      expect(rates.footerTop).toBeGreaterThanOrEqual(rates.viewportHeight - 1);

      const sparklineHeight = await page.locator('[data-market-sparkline="euribor-3m"]').evaluate((element) =>
        element.getBoundingClientRect().height
      );
      expect(sparklineHeight).toBeGreaterThanOrEqual(viewport.height <= 720 ? 71 : 87);

      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(viewport.width + 1);
    });
  }
});
