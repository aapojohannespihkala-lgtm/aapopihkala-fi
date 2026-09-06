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
class TradingViewTickerTagStub extends HTMLElement {
  connectedCallback() {
    this.dataset.tradingViewStub = 'true';
    this.replaceChildren();
    const value = document.createElement('span');
    value.textContent = '+0.42%';
    this.append(value);
    this.style.display = 'inline-block';
    this.style.width = '92px';
    this.style.height = '28px';
  }
}

if (!customElements.get('tv-ticker-tag')) {
  customElements.define('tv-ticker-tag', TradingViewTickerTagStub);
}
`;

const stubTradingView = async (page: Page) => {
  await page.route(
    'https://widgets.tradingview-widget.com/w/en/tv-ticker-tag.js',
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
    'https://widgets.tradingview-widget.com/w/en/tv-ticker-tag.js',
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

test('standalone Current Markets shows compact ticker tags and ECB macro context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');

  const tags = page.locator('tv-ticker-tag');
  await expect(tags).toHaveCount(7);
  await expect(tags.nth(0)).toHaveAttribute('symbol', 'AMEX:URTH');
  await expect(tags.nth(1)).toHaveAttribute('symbol', 'AMEX:SPY');
  await expect(tags.nth(2)).toHaveAttribute('symbol', 'AMEX:VGK');
  await expect(tags.nth(3)).toHaveAttribute('symbol', 'OMXNORDIC:OMXN40');
  await expect(tags.nth(4)).toHaveAttribute('symbol', 'OMXHEX:OMXH25');
  await expect(tags.nth(5)).toHaveAttribute('symbol', 'AMEX:EWJ');
  await expect(tags.nth(6)).toHaveAttribute('symbol', 'COINBASE:BTCEUR');
  await expect(page.locator('[data-trading-view-stub]')).toHaveCount(7);
  await expect(page.locator('tv-single-ticker, tv-tickers, tv-ticker-tape')).toHaveCount(0);

  const references = page.locator('[data-market-reference]');
  const first = await references.nth(0).boundingBox();
  const second = await references.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if (first && second) {
    expect(Math.abs(first.x - second.x)).toBeLessThanOrEqual(1);
    expect(second.y).toBeGreaterThan(first.y);
    expect(first.width).toBeGreaterThan(280);
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

test('Markets keeps readable fallback rows if TradingView is blocked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await blockTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-market-tag-fallback]')).toHaveCount(7);
  await expect(page.locator('[data-market-reference="world"]')).toContainText('WORLD / URTH');
  await expect(page.locator('[data-market-reference="europe"]')).toContainText('EUROPE / VGK');
  await expect(page.locator('[data-market-reference="btc-eur"]')).toContainText('BTC / EUR');
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
