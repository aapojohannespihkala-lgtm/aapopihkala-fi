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
(() => {
  const script = document.currentScript;
  const widget = script?.parentElement?.querySelector('.tradingview-widget-container__widget');
  if (!(widget instanceof HTMLElement)) return;

  const iframe = document.createElement('iframe');
  iframe.title = 'TradingView market ticker';
  iframe.dataset.tradingViewStub = 'true';
  iframe.style.width = '100%';
  iframe.style.height = '46px';
  widget.append(iframe);
})();
`;

const stubTradingView = async (page: Page, gate?: Promise<void>) => {
  await page.route(
    'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js',
    async (route) => {
      if (gate) await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: tradingViewStubBody,
      });
    }
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

test('standalone Current Markets shows a compact TradingView feed and ECB macro context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubTradingView(page);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('Markets');
  await expect(page.locator('a.current-markets-status__link')).toHaveAttribute('href', '/current/');

  const tickerHost = page.locator('[data-markets-ticker-host]');
  await expect(tickerHost).toHaveCount(1);
  await expect(page.locator('[data-trading-view-stub]')).toHaveCount(1);
  await expect(page.locator('[data-markets-ticker-fallback]')).toBeHidden();

  const embedScript = page.locator(
    '[data-markets-ticker-embed] script[src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"]'
  );
  await expect(embedScript).toHaveCount(1);

  const widgetConfig = await embedScript.textContent();
  expect(widgetConfig).toContain('"proName":"AMEX:URTH"');
  expect(widgetConfig).toContain('"proName":"OMXNORDIC:OMXN40"');
  expect(widgetConfig).toContain('"proName":"OMXHEX:OMXH25"');
  expect(widgetConfig).toContain('"proName":"COINBASE:BTCEUR"');
  expect(widgetConfig).toContain('"displayMode":"adaptive"');

  const tickerBox = await tickerHost.boundingBox();
  expect(tickerBox).not.toBeNull();
  if (tickerBox) expect(tickerBox.height).toBeLessThanOrEqual(60);

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

test('Markets keeps its mobile layout stable while TradingView loads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  let releaseTicker = () => {};
  const tickerGate = new Promise<void>((resolve) => {
    releaseTicker = resolve;
  });

  await stubTradingView(page, tickerGate);
  await stubMarkets(page);

  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

  const fallback = page.locator('[data-markets-ticker-fallback]');
  const macro = page.locator('.markets-macro');
  await expect(fallback).toBeVisible();

  const before = await macro.boundingBox();
  releaseTicker();

  await expect(page.locator('[data-trading-view-stub]')).toHaveCount(1);
  await expect(fallback).toBeHidden();

  const after = await macro.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  if (before && after) {
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  }
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
