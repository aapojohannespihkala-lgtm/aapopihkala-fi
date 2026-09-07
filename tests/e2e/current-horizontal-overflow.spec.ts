import { expect, test } from '@playwright/test';

test('Current stays vertically scrollable only, including desktop fixed controls', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }

    if (!customElements.get('tv-market-data')) {
      customElements.define(
        'tv-market-data',
        class extends HTMLElement {
          connectedCallback() {
            if (this.shadowRoot) return;
            const shadow = this.attachShadow({ mode: 'open' });
            const wideContent = document.createElement('div');
            wideContent.style.width = '2200px';
            wideContent.style.height = '1px';
            shadow.append(wideContent);
          }
        },
      );
    }
  });

  await page.route('https://www.tradingview-widget.com/**', (route) => route.abort());
  await page.route('https://widgets.tradingview-widget.com/**', (route) => route.abort());

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/current/', { waitUntil: 'domcontentloaded' });

    const before = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>('.current-shell');
      const performance = document.querySelector<HTMLElement>('.markets-performance');
      const widget = document.querySelector<HTMLElement>('tv-market-data');
      const analytics = document.querySelector<HTMLElement>('[data-analytics-settings]');
      const analyticsRect = analytics?.getBoundingClientRect();

      return {
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        rootOverflowX: getComputedStyle(document.documentElement).overflowX,
        bodyOverflowX: getComputedStyle(document.body).overflowX,
        shellRight: shell?.getBoundingClientRect().right ?? 0,
        performanceOverflowX: performance ? getComputedStyle(performance).overflowX : '',
        widgetDefined: widget?.matches(':defined') ?? false,
        widgetMinWidth: widget ? getComputedStyle(widget).minWidth : '',
        widgetOverflowX: widget ? getComputedStyle(widget).overflowX : '',
        widgetRight: widget?.getBoundingClientRect().right ?? 0,
        analyticsVisible: analytics ? !analytics.hidden : false,
        analyticsLeft: analyticsRect?.left ?? 0,
        analyticsRight: analyticsRect?.right ?? 0,
      };
    });

    expect(before.rootOverflowX).toBe('hidden');
    expect(before.bodyOverflowX).toBe('hidden');
    expect(before.shellRight).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.widgetRight).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.performanceOverflowX).toBe('hidden');
    expect(before.widgetDefined).toBe(true);
    expect(before.widgetMinWidth).toBe('0px');
    expect(before.widgetOverflowX).toBe('hidden');
    expect(before.analyticsVisible).toBe(true);
    expect(before.analyticsLeft).toBeGreaterThanOrEqual(-1);
    expect(before.analyticsRight).toBeLessThanOrEqual(before.viewport + 1);

    await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2));
    await page.mouse.wheel(320, 0);
    await page.waitForTimeout(50);

    const afterWheel = await page.evaluate(() => ({
      scrollX: window.scrollX,
      rootScrollLeft: document.scrollingElement?.scrollLeft ?? 0,
    }));

    expect(afterWheel.scrollX).toBe(0);
    expect(afterWheel.rootScrollLeft).toBe(0);
  }
});
