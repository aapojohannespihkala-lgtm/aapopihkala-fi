import { expect, test } from '@playwright/test';

test('Current does not expose horizontal page scrolling', async ({ page }) => {
  await page.route('https://www.tradingview-widget.com/**', (route) => route.abort());
  await page.route('https://widgets.tradingview-widget.com/**', (route) => route.abort());

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/current/', { waitUntil: 'domcontentloaded' });

    const dimensions = await page.evaluate(async () => {
      const shell = document.querySelector<HTMLElement>('.current-shell');
      const performance = document.querySelector<HTMLElement>('.markets-performance');
      const widget = document.querySelector<HTMLElement>('tv-market-data');

      window.scrollTo({ left: 200, top: window.scrollY });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      return {
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        scrollX: window.scrollX,
        shellRight: shell?.getBoundingClientRect().right ?? 0,
        performanceOverflowX: performance ? getComputedStyle(performance).overflowX : '',
        widgetMinWidth: widget ? getComputedStyle(widget).minWidth : '',
        widgetRight: widget?.getBoundingClientRect().right ?? 0,
      };
    });

    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.scrollX).toBe(0);
    expect(dimensions.shellRight).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.widgetRight).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.performanceOverflowX).toBe('clip');
    expect(dimensions.widgetMinWidth).toBe('0px');
  }
});
