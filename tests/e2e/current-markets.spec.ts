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

const tradingViewStubBody = `
class TradingViewTickersStub extends HTMLElement {
  connectedCallback() {
    this.dataset.tradingViewStub = 'true';
    this.replaceChildren();
    this.style.display = 'block';
    this.style.height = '320px';
  }
}

if (!customElements.get('tv-tickers')) {
  customElements.define('tv-tickers', TradingViewTickersStub);
}
`;

const stubTradingView = async (page: Page) => {
  await page.route(
    'https://widgets.tradingview-widget.com/w/en/tv-tickers.js',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: tradingViewStubBody,
      });
    }
  );
};

const blockTradingView = async (page: Page) => {
  await page.route(
    'https://widgets.tradingview-widget.com/w/en/tv-tickers.js',
    async (route) => route.abort()
  );
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

test('standalone Current Markets shows a static TradingView market list and ECB macro context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');

  const tickers = page.locator('tv-tickers');
  await expect(tickers).toHaveCount(1);
  await expect(tickers).toHaveAttribute(
    'symbols',
    'AMEX:URTH,SP:SPX,TVC:SXXP,OMXNORDIC:OMXN40,OMXHEX:OMXH25,TVC:NI225,COINBASE:BTCEUR'
  );
  await expect(tickers).toHaveAttribute('direction', 'vertical');
  await expect(tickers).toHaveAttribute('hide-chart', '');
  await expect(tickers).toHaveAttribute('transparent', '');
  await expect(tickers).toHaveAttribute('locale', 'en');
  await expect(tickers).toHaveAttribute('data-trading-view-stub', 'true');
  await expect(page.locator('tv-ticker-tape')).toHaveCount(0);
  await expect(page.locator('[data-markets-tickers-fallback]')).toHaveCount(0);

  const tickerBox = await tickers.boundingBox();
  expect(tickerBox).not.toBeNull();
  if (tickerBox) {
    expect(tickerBox.height).toBeGreaterThanOrEqual(319);
    expect(tickerBox.height).toBeLessThanOrEqual(321);
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

test('Markets keeps a useful static fallback if TradingView is blocked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await blockTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  const fallback = page.locator('[data-markets-tickers-fallback]');
  await expect(fallback).toBeVisible();
  await expect(fallback.locator('p')).toHaveCount(7);
  await expect(fallback.locator('p').nth(0)).toContainText('World');
  await expect(fallback.locator('p').nth(3)).toContainText('Nordics');
  await expect(fallback.locator('p').nth(6)).toContainText('BTC / EUR');
  await expect(page.locator('[data-market-value="eur-usd"]')).toHaveText('1.1712');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('Current places Markets above electricity', async ({ page }) => {
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Current');
  await expect(page.locator('[data-current-markets]')).toHaveCount(1);
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
