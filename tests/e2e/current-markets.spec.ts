import { expect, test, type Page } from '@playwright/test';
import worker from '../../worker/index';

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-03' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-03',
      change1y: -0.571,
      points: [
        { observedAt: '2025-09-01', value: 3.25 },
        { observedAt: '2026-03-01', value: 2.9 },
        { observedAt: '2026-09-03', value: 2.679 },
      ],
    },
    {
      id: 'world',
      value: 180,
      observedAt: '2026-09-04',
      change1y: 20,
      points: [
        { observedAt: '2025-09-05', value: 150 },
        { observedAt: '2026-03-04', value: 162 },
        { observedAt: '2026-09-04', value: 180 },
      ],
    },
  ],
  source: 'Bank of Finland + ECB + Yahoo Finance',
};

const portfolioFixture = {
  items: [
    {
      id: 'handelsbanken-usa',
      label: 'HANDELSBANKEN USA INDEKSI',
      symbol: 'SE0006800140',
      price: 107.2,
      observedAt: '2026-09-04',
      changes: {
        today: 0.75,
        week1: 0.29,
        month1: 0.2,
        month3: 3.06,
        month6: 15.83,
        ytd: 14.46,
        year1: 21.92,
        year3: 65.1,
        year5: 77.6,
      },
    },
  ],
  expected: 19,
  liveExpected: 19,
};

const stubMarkets = async (page: Page, portfolioAvailable = true) => {
  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());

    if (url.searchParams.get('portfolio') === '1') {
      if (!portfolioAvailable) {
        await route.fulfill({ status: 503, body: 'Portfolio unavailable' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(portfolioFixture),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(macroFixture),
    });
  });
};

test('standalone Current Markets shows portfolio performance and interactive one-year trends', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.getByText('PORTFOLIO / PERFORMANCE')).toHaveCount(1);
  await expect(page.getByText('RATES / TRENDS')).toHaveCount(1);
  await expect(page.getByText('WORLD / 1Y')).toHaveCount(0);
  await expect(page.getByText('EUR / USD')).toHaveCount(0);
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveCount(0);
  await expect(page.locator('tv-market-data')).toHaveCount(0);

  await expect(page.locator('[data-current-market-performance]')).toHaveCount(1);
  await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);
  await expect(page.locator('[data-market-sort]')).toHaveCount(10);
  await expect(page.locator('[data-market-summary-period]')).toHaveText('1Y');
  await expect(page.locator('[data-market-summary-coverage]')).toHaveText('1 OF 19 DATA');
  await expect(page.locator('[data-market-performance-status]')).toHaveText('PARTIAL / 1 OF 19 HOLDINGS');

  const handelsbanken = page.locator('[data-market-performance-row="handelsbanken-usa"]');
  await expect(handelsbanken).toHaveAttribute('data-market-performance-loaded', 'true');
  await expect(handelsbanken.locator('[data-market-performance-change="year1"]')).toHaveText('+21.92%');

  await expect(page.locator('[data-markets-observation]')).toHaveText('2026-09-04');
  await expect(page.locator('[data-market-observation]')).toHaveCount(0);

  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-series-change="euribor-3m"]')).toHaveText('-0.571 PP');
  await expect(page.locator('[data-market-value="world"]')).toHaveCount(0);
  await expect(page.locator('[data-market-series-change="world"]')).toHaveText('+20.00%');
  await expect(page.locator('.markets-sparkline-context')).toBeHidden();
  await expect(page.locator('.markets-macro')).not.toContainText('MSCI WORLD ETF PROXY');
  await expect(page.locator('.markets-macro')).not.toContainText('WORLD / URTH');
  await expect(page.locator('.markets-macro')).not.toContainText('1Y HISTORY');

  await expect(page.locator('[data-market-axis="euribor-3m"] .markets-sparkline-axis__tick')).toHaveText([
    '3.4%',
    '3.2%',
    '3.0%',
    '2.8%',
    '2.6%',
  ]);
  await expect(page.locator('[data-market-axis="world"] .markets-sparkline-axis__tick')).toHaveText([
    '120',
    '110',
    '100',
  ]);

  const euriborSparkline = page.locator('[data-market-sparkline="euribor-3m"]');
  const worldSparkline = page.locator('[data-market-sparkline="world"]');

  await expect(euriborSparkline).toBeVisible();
  await expect(worldSparkline).toBeVisible();
  await expect(euriborSparkline).toHaveAttribute('tabindex', '0');
  await expect(worldSparkline).toHaveAttribute('tabindex', '0');
  await expect(euriborSparkline).toHaveAttribute('aria-label', /Touch, hover or use the arrow keys/);
  await expect(worldSparkline).toHaveAttribute('aria-label', /Touch, hover or use the arrow keys/);
  await expect(euriborSparkline.locator('[data-market-line]')).toHaveAttribute('d', /^M/);
  await expect(worldSparkline.locator('[data-market-line]')).toHaveAttribute('d', /^M/);
  await expect(euriborSparkline.locator('[data-market-grid] line')).toHaveCount(5);
  await expect(worldSparkline.locator('[data-market-grid] line')).toHaveCount(3);
  await expect(page.locator('[data-market-sparkline-fallback="euribor-3m"]')).toBeHidden();
  await expect(page.locator('[data-market-sparkline-fallback="world"]')).toBeHidden();

  await euriborSparkline.scrollIntoViewIfNeeded();
  const euriborBox = await euriborSparkline.boundingBox();
  expect(euriborBox).not.toBeNull();
  if (euriborBox) {
    const clientX = euriborBox.x + euriborBox.width / 2;
    const clientY = euriborBox.y + euriborBox.height / 2;
    await euriborSparkline.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 17,
      isPrimary: true,
      clientX,
      clientY,
    });
    await euriborSparkline.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 17,
      isPrimary: true,
      clientX,
      clientY,
    });
  }

  const euriborTooltip = page.locator('[data-market-tooltip="euribor-3m"]');
  await expect(euriborTooltip).toBeVisible();
  await expect(page.locator('[data-market-tooltip-date="euribor-3m"]')).toContainText('MAR 2026');
  await expect(page.locator('[data-market-tooltip-value="euribor-3m"]')).toHaveText('2.900%');
  await expect(euriborSparkline.locator('[data-market-inspection-line]')).toHaveAttribute('opacity', '1');
  await expect(euriborSparkline.locator('[data-market-inspection-point]')).toHaveAttribute('opacity', '1');

  await worldSparkline.focus();
  const worldTooltip = page.locator('[data-market-tooltip="world"]');
  await expect(worldTooltip).toBeVisible();
  await expect(page.locator('[data-market-tooltip-date="world"]')).toContainText('SEP');
  await expect(page.locator('[data-market-tooltip-value="world"]')).toHaveText('120.0 · +20.0%');

  await worldSparkline.press('ArrowLeft');
  await expect(page.locator('[data-market-tooltip-date="world"]')).toContainText('MAR 2026');
  await expect(page.locator('[data-market-tooltip-value="world"]')).toHaveText('108.0 · +8.0%');

  await expect(page.locator('[data-markets-error]')).toBeHidden();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Markets keeps compact trend charts if portfolio performance data is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubMarkets(page, false);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);
  await expect(page.locator('[data-market-performance-status]')).toHaveText('DATA UNAVAILABLE');
  await expect(page.locator('[data-market-summary-coverage]')).toHaveText('0 OF 19 DATA');
  await expect(page.locator('[data-market-performance-row="handelsbanken-usa"] [data-market-performance-change="year1"]')).toHaveText('--');
  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-series-change="world"]')).toHaveText('+20.00%');
  await expect(page.locator('[data-markets-observation]')).toHaveText('2026-09-04');
  await expect(page.locator('[data-market-sparkline="euribor-3m"]')).toBeVisible();
  await expect(page.locator('[data-market-sparkline="world"]')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Current keeps Weather, Electricity and Markets in the intended order', async ({ page }) => {
  await stubMarkets(page);

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Current');
  await expect(page.locator('[data-current-markets]')).toHaveCount(1);
  await expect(page.locator('[data-current-market-performance]')).toHaveCount(1);
  await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);
  await expect(page.getByText('PORTFOLIO / PERFORMANCE')).toHaveCount(1);
  await expect(page.locator('tv-market-data')).toHaveCount(0);
  await expect(page.locator('[data-current-electricity]')).toHaveCount(1);
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveCount(0);
  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-series-change="world"]')).toHaveText('+20.00%');
  await expect(page.locator('[data-markets-observation]')).toHaveText('2026-09-04');

  const moduleOrder = await page.evaluate(() =>
    [...document.querySelectorAll('[data-current-section]')].map((element) =>
      element.getAttribute('data-current-section')
    )
  );

  expect(moduleOrder).toEqual(['weather', 'electricity', 'markets']);
});

test('Worker serves current Euribor and one-year Euribor and world histories without EUR/USD', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));

    if (url.hostname === 'data-api.ecb.europa.eu' && url.pathname.startsWith('/service/data/FM/')) {
      expect(url.pathname).toBe('/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA');
      expect(url.searchParams.get('lastNObservations')).toBe('13');
      expect(new Headers(init?.headers).get('Accept')).toBe('text/csv');

      return new Response(
        [
          'TIME_PERIOD,OBS_VALUE',
          '2025-09,3.250',
          '2025-10,3.180',
          '2025-11,3.120',
          '2025-12,3.050',
          '2026-01,3.000',
          '2026-02,2.950',
          '2026-03,2.900',
          '2026-04,2.850',
          '2026-05,2.800',
          '2026-06,2.760',
          '2026-07,2.720',
          '2026-08,2.690',
        ].join('\n'),
        { status: 200, headers: { 'Content-Type': 'text/csv' } }
      );
    }

    if (url.hostname === 'www.suomenpankki.fi') {
      expect(url.pathname).toBe('/en/statistics/interest-rates-and-exchange-rates/euribor-rates/');
      expect(new Headers(init?.headers).get('Accept')).toBe('text/html');

      return new Response(
        '<html><body><table><tr><td>4 Sep 2026</td><td>+2.154</td><td>+2.364</td><td>+2.679</td><td>+2.794</td><td>+3.108</td></tr><tr><td>7 Aug 2026</td><td>+2.132</td><td>+2.201</td><td>+2.474</td><td>+2.683</td><td>+2.898</td></tr></table></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (url.hostname === 'query1.finance.yahoo.com') {
      expect(url.pathname).toBe('/v8/finance/chart/URTH');
      expect(url.searchParams.get('range')).toBe('1y');
      expect(url.searchParams.get('interval')).toBe('1d');
      expect(new Headers(init?.headers).get('Accept')).toBe('application/json');

      return Response.json({
        chart: {
          result: [
            {
              timestamp: [1757030400, 1772582400, 1788480000],
              indicators: {
                quote: [{ close: [150, 162, 180] }],
              },
            },
          ],
        },
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const env = {
    ASSETS: {
      fetch: async (request: Request) =>
        new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }),
    },
  };

  try {
    const apiResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/markets'),
      env
    );

    expect(apiResponse.status).toBe(200);
    const data = (await apiResponse.json()) as typeof macroFixture;
    expect(data.source).toBe('Bank of Finland + ECB + Yahoo Finance');
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
    });

    expect(data.series).toHaveLength(2);
    expect(data.series[0]).toMatchObject({
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
    });
    expect(data.series[0].change1y).toBeCloseTo(-0.571, 6);
    expect(data.series[0].points.length).toBeGreaterThan(2);
    expect(data.series[1]).toMatchObject({
      id: 'world',
      value: 180,
      observedAt: '2026-09-04',
    });
    expect(data.series[1].change1y).toBeCloseTo(20, 6);

    const methodResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/markets', { method: 'POST' }),
      env
    );

    expect(methodResponse.status).toBe(405);
    expect(methodResponse.headers.get('allow')).toBe('GET');
  } finally {
    globalThis.fetch = originalFetch;
  }
});