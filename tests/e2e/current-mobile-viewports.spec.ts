import { expect, test, type Page } from '@playwright/test';

const prepareCurrent = async (page: Page) => {
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

test.describe('Current mobile viewport isolation', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps Weather and Electricity isolated at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await prepareCurrent(page);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      const weather = await sectionGeometry(page, 'weather');
      expect(weather.contentBottom).toBeLessThanOrEqual(weather.viewportHeight + 1);
      expect(weather.nextTop).toBeGreaterThanOrEqual(weather.viewportHeight - 1);

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

      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(viewport.width + 1);
    });
  }
});
