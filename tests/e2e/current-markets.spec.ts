import { expect, test, type Page } from '@playwright/test';
import worker from '../../worker/index';

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
      change1y: -0.571,
      points: [
        { observedAt: '2025-09-01', value: 3.25 },
        { observedAt: '2026-03-01', value: 2.9 },
        { observedAt: '2026-09-04', value: 2.679 },
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

const expectedMarketSymbols = [
  'AMEX:URTH',
  'AMEX:SPY',
  'AMEX:VGK',
  'OMXNORDIC:OMXN40',
  'OMXHEX:OMXH25',
  'AMEX:EWJ',
  'COINBASE:BTCEUR',
  'OMXHEX:REMEDY',
];

const tradingViewStubBody = `
class TradingViewMarketDataStub extends HTMLElement {
  connectedCallback() {
    this.dataset.tradingViewStub = 'true';
    this.replaceChildren();

    const periods = document.createElement('div');
    periods.dataset.marketDataStubPeriods = 'true';
    periods.textContent = 'Today 1W 1M 6M 1Y';
    this.append(periods);
  }
}

if (!customElements.get('tv-market-data')) {
  customElements.define('tv-market-data', TradingViewMarketDataStub);
}
`;

const stubTradingView = async (page: Page) => {
  await page.route('**/tv-market-data.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: tradingViewStubBody,
    });
  });
};

const blockTradingView = async (page: Page) => {
  await page.route('**/tv-market-data.js', async (route) => route.abort());
};

const stubMarkets = async (page: Page) => {
  await page.route('**/api/current/markets', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(macroFixture),
    });
  });
};

test('standalone Current Markets shows TradingView performance and one-year Euribor and world trends', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.getByText('GLOBAL / PERFORMANCE')).toHaveCount(1);
  await expect(page.getByText('RATES / TRENDS')).toHaveCount(1);
  await expect(page.getByText('WORLD / 1Y')).toHaveCount(1);
  await expect(page.getByText('EUR / USD')).toHaveCount(0);
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveCount(0);

  const widget = page.locator('tv-market-data');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('view', 'performance');
  await expect(widget).toHaveAttribute('transparent', '');
  await expect(widget).toHaveAttribute('locale', 'en');
  await expect(widget).toHaveAttribute('theme', 'dark');
  await expect(widget).toHaveAttribute('data-trading-view-stub', 'true');
  await expect(page.locator('[data-market-data-stub-periods]')).toHaveText('Today 1W 1M 6M 1Y');
  await expect(page.locator('tv-ticker-tag, tv-single-ticker, tv-tickers, tv-ticker-tape')).toHaveCount(0);

  const sectors = JSON.parse((await widget.getAttribute('symbol-sectors')) ?? '[]');
  expect(sectors).toEqual([
    {
      sectionName: 'Markets',
      symbols: expectedMarketSymbols,
    },
  ]);

  const widgetBox = await widget.boundingBox();
  expect(widgetBox).not.toBeNull();
  if (widgetBox) {
    expect(widgetBox.width).toBeGreaterThan(280);
    expect(widgetBox.height).toBeGreaterThanOrEqual(420);
    expect(widgetBox.height).toBeLessThanOrEqual(440);
  }

  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-series-change="euribor-3m"]')).toHaveText('-0.571 PP');
  await expect(page.locator('[data-market-observation="euribor-3m"]')).toHaveText('2026-09-04');
  await expect(page.locator('[data-market-value="world"]')).toHaveText('180.00');
  await expect(page.locator('[data-market-series-change="world"]')).toHaveText('+20.00%');
  await expect(page.locator('[data-market-observation="world"]')).toHaveText('2026-09-04');

  await expect(
    page.locator('[data-market-axis="euribor-3m"][data-axis-level="max"]')
  ).toHaveText('3.250%');
  await expect(
    page.locator('[data-market-axis="euribor-3m"][data-axis-level="mid"]')
  ).toHaveText('2.965%');
  await expect(
    page.locator('[data-market-axis="euribor-3m"][data-axis-level="min"]')
  ).toHaveText('2.679%');
  await expect(page.locator('[data-market-axis="world"][data-axis-level="max"]')).toHaveText(
    '180.00'
  );
  await expect(page.locator('[data-market-axis="world"][data-axis-level="mid"]')).toHaveText(
    '165.00'
  );
  await expect(page.locator('[data-market-axis="world"][data-axis-level="min"]')).toHaveText(
    '150.00'
  );

  for (const id of ['euribor-3m', 'world']) {
    const sparkline = page.locator(`[data-market-sparkline="${id}"]`);
    await expect(sparkline).toBeVisible();
    await expect(sparkline.locator('path')).toHaveAttribute('d', /^M/);
    await expect(sparkline.locator('.markets-sparkline-grid line')).toHaveCount(3);
    await expect(page.locator(`[data-market-sparkline-fallback="${id}"]`)).toBeHidden();
  }

  await expect(page.locator('[data-markets-error]')).toBeHidden();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Markets keeps compact trend charts if TradingView performance data is blocked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await blockTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  const fallback = page.locator('[data-markets-performance-fallback]');
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('TODAY / 1W / 1M / 6M / 1Y');
  await expect(page.locator('[data-markets-performance-message]')).toHaveText(
    'Market performance unavailable'
  );
  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-value="world"]')).toHaveText('180.00');
  await expect(page.locator('[data-market-sparkline="euribor-3m"]')).toBeVisible();
  await expect(page.locator('[data-market-sparkline="world"]')).toBeVisible();

  const fallbackBox = await fallback.boundingBox();
  expect(fallbackBox).not.toBeNull();
  if (fallbackBox) expect(fallbackBox.height).toBeLessThan(120);

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Current places Markets performance above electricity', async ({ page }) => {
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Current');
  await expect(page.locator('[data-current-markets]')).toHaveCount(1);
  await expect(page.locator('tv-market-data')).toHaveAttribute('view', 'performance');
  await expect(page.locator('[data-current-electricity]')).toHaveCount(1);
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveCount(0);
  await expect(page.locator('[data-market-value="euribor-3m"]')).toHaveText('2.679');
  await expect(page.locator('[data-market-value="world"]')).toHaveText('180.00');

  const moduleOrder = await page.evaluate(() =>
    [...document.querySelectorAll('[data-current-markets], [data-current-electricity]')].map((element) =>
      element.hasAttribute('data-current-markets') ? 'markets' : 'electricity'
    )
  );

  expect(moduleOrder).toEqual(['markets', 'electricity']);
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
