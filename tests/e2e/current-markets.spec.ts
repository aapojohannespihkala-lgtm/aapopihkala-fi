import { expect, test, type Page } from '@playwright/test';
import worker from '../../worker/index';

const macroFixture = {
  items: [
    { id: 'eur-usd', value: 1.1712, observedAt: '2026-09-04' },
    { id: 'eur-sek', value: 11.1234, observedAt: '2026-09-04' },
    { id: 'estr', value: 2.181, observedAt: '2026-09-04' },
  ],
  source: 'ECB',
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

test('standalone Current Markets shows TradingView period performance and ECB macro context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.getByText('GLOBAL / PERFORMANCE')).toHaveCount(1);

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

  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveText('1.1712');
  await expect(page.locator('[data-market-value="eur-sek"]')).toHaveText('11.1234');
  await expect(page.locator('[data-market-value="estr"]')).toHaveText('2.181');
  await expect(page.locator('[data-markets-observation]')).toHaveText('2026-09-04');
  await expect(page.locator('[data-markets-error]')).toBeHidden();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Markets keeps a compact fallback if TradingView performance data is blocked', async ({ page }) => {
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
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveText('1.1712');

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
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveText('1.1712');

  const moduleOrder = await page.evaluate(() =>
    [...document.querySelectorAll('[data-current-markets], [data-current-electricity]')].map((element) =>
      element.hasAttribute('data-current-markets') ? 'markets' : 'electricity'
    )
  );

  expect(moduleOrder).toEqual(['markets', 'electricity']);
});

test('Worker serves Current markets macro data and rejects non-GET methods', async () => {
  const originalFetch = globalThis.fetch;

  const seriesValues = new Map<string, string>([
    ['/EXR/D.USD.EUR.SP00.A', '1.1712'],
    ['/EXR/D.SEK.EUR.SP00.A', '11.1234'],
    ['/EST/B.EU000A2X2A25.WT', '2.181'],
  ]);

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const value = seriesValues.get(url.pathname.replace('/service/data', ''));

    expect(value).toBeDefined();
    expect(url.hostname).toBe('data-api.ecb.europa.eu');
    expect(url.searchParams.get('lastNObservations')).toBe('1');
    expect(url.searchParams.get('format')).toBe('csvdata');
    expect(url.searchParams.get('detail')).toBe('dataonly');
    expect(new Headers(init?.headers).get('Accept')).toBe('text/csv');

    return new Response(`TIME_PERIOD,OBS_VALUE\n2026-09-04,${value}`, {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
    });
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
    expect(await apiResponse.json()).toEqual(macroFixture);

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
