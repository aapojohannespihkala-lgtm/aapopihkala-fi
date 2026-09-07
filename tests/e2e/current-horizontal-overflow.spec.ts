import { expect, test } from '@playwright/test';

test('Current stays vertically scrollable only, including desktop fixed controls', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('**/api/current/markets*', async (route) => {
    if (!route.request().url().includes('portfolio=1')) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], expected: 19, liveExpected: 19 }),
    });
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/current/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);

    const before = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>('.current-shell');
      const performance = document.querySelector<HTMLElement>('[data-current-market-performance]');
      const matrix = document.querySelector<HTMLElement>('.markets-custom-table');
      const analytics = document.querySelector<HTMLElement>('[data-analytics-settings]');
      const analyticsRect = analytics?.getBoundingClientRect();

      return {
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        rootOverflowX: getComputedStyle(document.documentElement).overflowX,
        bodyOverflowX: getComputedStyle(document.body).overflowX,
        shellRight: shell?.getBoundingClientRect().right ?? 0,
        performanceRight: performance?.getBoundingClientRect().right ?? 0,
        performanceOverflowX: performance ? getComputedStyle(performance).overflowX : '',
        matrixRight: matrix?.getBoundingClientRect().right ?? 0,
        tradingViewCount: document.querySelectorAll('tv-market-data').length,
        analyticsVisible: analytics ? !analytics.hidden : false,
        analyticsLeft: analyticsRect?.left ?? 0,
        analyticsRight: analyticsRect?.right ?? 0,
      };
    });

    expect(before.rootOverflowX).toBe('clip');
    expect(before.bodyOverflowX).toBe('clip');
    expect(before.documentWidth).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.bodyWidth).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.shellRight).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.performanceRight).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.matrixRight).toBeLessThanOrEqual(before.viewport + 1);
    expect(before.performanceOverflowX).toBe('hidden');
    expect(before.tradingViewCount).toBe(0);
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
