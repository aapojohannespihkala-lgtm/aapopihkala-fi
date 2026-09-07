import { expect, test, type Page } from '@playwright/test';

type SectionGeometry = {
  viewportHeight: number;
  viewportWidth: number;
  documentWidth: number;
  topbar: { top: number; bottom: number; height: number };
  sections: Record<
    string,
    { top: number; bottom: number; inlineMinHeight: string; computedMinHeight: string }
  >;
};

const readSectionGeometry = async (page: Page) =>
  page.evaluate<SectionGeometry>(() => {
    const sections: Record<
      string,
      { top: number; bottom: number; inlineMinHeight: string; computedMinHeight: string }
    > = {};

    document.querySelectorAll<HTMLElement>('[data-current-section]').forEach((section) => {
      const name = section.dataset.currentSection;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = {
        top: rect.top,
        bottom: rect.bottom,
        inlineMinHeight: section.style.minHeight,
        computedMinHeight: getComputedStyle(section).minHeight,
      };
    });

    const topbar = document.querySelector<HTMLElement>('.topbar');
    const topbarRect = topbar?.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      topbar: topbarRect
        ? { top: topbarRect.top, bottom: topbarRect.bottom, height: topbarRect.height }
        : { top: 0, bottom: 0, height: 0 },
      sections,
    };
  });

const mockPortfolioApi = async (page: Page) => {
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

const expectPortfolioMatrix = async (page: Page, compact: boolean) => {
  await expect(page.locator('tv-market-data')).toHaveCount(0);
  await expect(page.locator('[data-current-market-performance]')).toHaveCount(1);
  await expect(page.locator('[data-market-performance-summary]')).toHaveCount(1);
  await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);
  await expect(page.locator('[data-market-sort]')).toHaveCount(10);
  await expect(page.locator('[data-market-summary-period]')).toHaveText('1Y');
  await expect(page.locator('[data-market-summary-coverage]')).toHaveText('0 OF 19 DATA');

  const firstPortfolioRow = page.locator('[data-market-performance-row="handelsbanken-usa"]');
  await expect(firstPortfolioRow).toHaveCSS('display', 'grid');
  const expectedMinHeight = (page.viewportSize()?.width ?? 0) <= 520 ? '35px' : '37px';
  await expect(firstPortfolioRow).toHaveCSS('min-height', expectedMinHeight);

  if (compact) {
    await expect(page.locator('.markets-custom-row--header .period-week1')).toBeHidden();
    await expect(page.locator('.markets-custom-row--header .period-month6')).toBeHidden();
    await expect(firstPortfolioRow.locator('.period-week1')).toBeHidden();
    await expect(firstPortfolioRow.locator('.period-month6')).toBeHidden();
  } else {
    await expect(page.locator('.markets-custom-row--header .period-week1')).toBeVisible();
    await expect(page.locator('.markets-custom-row--header .period-month6')).toBeVisible();
    await expect(firstPortfolioRow.locator('.period-week1')).toBeVisible();
    await expect(firstPortfolioRow.locator('.period-month6')).toBeVisible();
  }
};

const expectSectionDividerMaskedByHeader = async (page: Page, sectionName: string) => {
  await expect
    .poll(async () => {
      const geometry = await readSectionGeometry(page);
      const top = geometry.sections[sectionName]?.top;
      if (top === undefined) return Number.POSITIVE_INFINITY;
      return top - geometry.topbar.bottom;
    })
    .toBeLessThanOrEqual(-1);

  const geometry = await readSectionGeometry(page);
  const top = geometry.sections[sectionName]?.top;
  expect(top).toBeDefined();
  expect(geometry.topbar.height).toBeGreaterThan(0);
  expect(top).toBeGreaterThanOrEqual(geometry.topbar.top);
  expect(top).toBeLessThan(geometry.topbar.bottom);

  const coveredByTopbar = await page.evaluate((name) => {
    const section = document.querySelector<HTMLElement>(`[data-current-section="${name}"]`);
    const topbar = document.querySelector<HTMLElement>('.topbar');
    if (!section || !topbar) return false;

    const sectionRect = section.getBoundingClientRect();
    const topbarRect = topbar.getBoundingClientRect();
    const x = window.innerWidth / 2;
    const y = Math.min(
      topbarRect.bottom - 1,
      Math.max(topbarRect.top + 1, sectionRect.top + 0.5)
    );
    const coveringElement = document.elementFromPoint(x, y);
    return coveringElement instanceof Element && coveringElement.closest('.topbar') === topbar;
  }, sectionName);

  expect(coveredByTopbar).toBe(true);
};

test.describe('Current content-driven section navigation', () => {
  for (const viewport of [
    { width: 1638, height: 675, label: '67-percent-like' },
    { width: 1092, height: 450, label: '100-percent-like' },
    { width: 874, height: 360, label: '125-percent-like' },
    { width: 728, height: 300, label: '150-percent-like' },
  ]) {
    test(`keeps natural section heights and masked dividers at ${viewport.label}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
        } catch {
          // Storage may be unavailable before the page origin is established.
        }
      });
      await mockPortfolioApi(page);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      // Portfolio data is mocked in CI. Add inert scroll range so the last section can
      // still be aligned under the sticky header without changing Current section geometry.
      await page.evaluate(() => {
        const spacer = document.createElement('div');
        spacer.setAttribute('data-current-boundary-test-spacer', '');
        spacer.style.height = `${window.innerHeight * 2}px`;
        spacer.style.pointerEvents = 'none';
        spacer.setAttribute('aria-hidden', 'true');
        document.body.append(spacer);
      });

      const nav = page.locator('[data-current-section-nav]');
      const topbar = page.locator('.topbar');
      await expect(nav).toBeVisible();
      await expect(topbar).toHaveCSS('position', 'sticky');

      const initial = await readSectionGeometry(page);
      expect(initial.documentWidth).toBeLessThanOrEqual(initial.viewportWidth + 1);

      for (const name of ['weather', 'electricity', 'markets']) {
        expect(initial.sections[name]?.inlineMinHeight).toBe('');
        expect(initial.sections[name]?.computedMinHeight).toBe('0px');
      }

      await expectPortfolioMatrix(page, viewport.width <= 820);

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'electricity');
      await expect.poll(async () => nav.getAttribute('aria-label')).toContain('markets');

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'markets');
      await expect.poll(async () => nav.getAttribute('aria-label')).toContain('Back to Current top');
    });
  }

  test('uses the portfolio matrix on the standalone markets page', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
      } catch {
        // Storage may be unavailable before the page origin is established.
      }
    });
    await mockPortfolioApi(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

    await expectPortfolioMatrix(page, true);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(391);
  });
});
