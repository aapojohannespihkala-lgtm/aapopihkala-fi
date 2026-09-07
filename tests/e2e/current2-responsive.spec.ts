import { expect, test, type Page } from '@playwright/test';

type Geometry = {
  viewportHeight: number;
  viewportWidth: number;
  documentWidth: number;
  topbar: { top: number; bottom: number; height: number };
  sections: Record<string, { top: number; bottom: number; inlineMinHeight: string }>;
};

const readGeometry = async (page: Page) =>
  page.evaluate<Geometry>(() => {
    const sections: Record<string, { top: number; bottom: number; inlineMinHeight: string }> = {};

    document.querySelectorAll<HTMLElement>('[data-current2-section]').forEach((section) => {
      const name = section.dataset.current2Section;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = {
        top: rect.top,
        bottom: rect.bottom,
        inlineMinHeight: section.style.minHeight,
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

const expectMaskedByHeader = async (page: Page, sectionName: string) => {
  await expect
    .poll(async () => {
      const geometry = await readGeometry(page);
      const top = geometry.sections[sectionName]?.top;
      if (top === undefined) return Number.POSITIVE_INFINITY;
      return top - geometry.topbar.bottom;
    })
    .toBeLessThanOrEqual(-1);

  const geometry = await readGeometry(page);
  const top = geometry.sections[sectionName]?.top;
  expect(top).toBeDefined();
  expect(geometry.topbar.height).toBeGreaterThan(0);
  expect(top).toBeGreaterThanOrEqual(geometry.topbar.top);
  expect(top).toBeLessThan(geometry.topbar.bottom);
};

const denyAnalytics = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });
};

test.describe('Current2 responsive comparison', () => {
  for (const viewport of [
    { width: 1638, height: 675, label: '67-percent-like' },
    { width: 1092, height: 450, label: '100-percent-like' },
    { width: 874, height: 360, label: '125-percent-like' },
    { width: 728, height: 300, label: '150-percent-like' },
  ]) {
    test(`keeps content-driven sections and navigation at ${viewport.label}`, async ({ page }) => {
      await denyAnalytics(page);

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

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current2/', { waitUntil: 'domcontentloaded' });

      await page.evaluate(() => {
        const spacer = document.createElement('div');
        spacer.style.height = `${window.innerHeight * 2}px`;
        spacer.style.pointerEvents = 'none';
        spacer.setAttribute('aria-hidden', 'true');
        document.body.append(spacer);
      });

      const nav = page.locator('[data-current2-section-nav]');
      await expect(nav).toBeVisible();
      await expect(page.locator('.topbar')).toHaveCSS('position', 'sticky');

      const initial = await readGeometry(page);
      expect(initial.documentWidth).toBeLessThanOrEqual(initial.viewportWidth + 1);
      expect(initial.sections.weather.inlineMinHeight).toBe('');
      expect(initial.sections.electricity.inlineMinHeight).toBe('');
      expect(initial.sections.markets.inlineMinHeight).toBe('');

      await expect(page.locator('tv-market-data')).toHaveCount(0);
      await expect(page.locator('[data-current-market-performance]')).toHaveCount(1);
      await expect(page.locator('[data-market-performance-summary]')).toHaveCount(1);
      await expect(page.locator('[data-market-performance-row]')).toHaveCount(19);
      await expect(page.locator('[data-market-sort]')).toHaveCount(10);
      await expect(page.locator('[data-market-summary-period]')).toHaveText('1Y');
      await expect(page.locator('[data-market-summary-coverage]')).toHaveText('0 OF 19 DATA');
      await expect(page.getByText('Handelsbanken Usa Indeksi', { exact: true })).toBeVisible();
      await expect(page.getByText('Nordnet Suomi Indeksi', { exact: true })).toBeVisible();
      await expect(page.getByText('Marimekko', { exact: true })).toBeVisible();
      await expect(page.getByText('Remedy', { exact: true })).toBeVisible();
      await expect(page.getByText('OP-Aasia Indeksi A', { exact: true })).toBeVisible();
      await expect(page.getByText('OP-Eurooppa Indeksi A', { exact: true })).toBeVisible();
      await expect(page.getByText('OP-Maailma Indeksi A', { exact: true })).toBeVisible();
      await expect(page.getByText('OP-Metsänomistaja B', { exact: true })).toBeVisible();
      await expect(page.getByText('BTC', { exact: true })).toBeVisible();
      await expect(page.getByText('BNB', { exact: true })).toBeVisible();
      await expect(page.getByText('ETH', { exact: true })).toBeVisible();
      await expect(page.locator('[data-market-performance-row="world"]')).toHaveCount(0);

      const firstPortfolioRow = page.locator('[data-market-performance-row="handelsbanken-usa"]');
      await expect(firstPortfolioRow).toHaveCSS('display', 'grid');
      await expect(firstPortfolioRow).toHaveCSS('min-height', '37px');
      await expect(page.locator('[data-market-performance-status]')).toHaveText(
        'PARTIAL / 0 OF 19 HOLDINGS'
      );

      await nav.click();
      await expectMaskedByHeader(page, 'electricity');

      await expect
        .poll(async () => nav.getAttribute('aria-label'))
        .toContain('markets');

      await nav.click();
      await expectMaskedByHeader(page, 'markets');

      if (viewport.width <= 820) {
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

      await expect
        .poll(async () => nav.getAttribute('aria-label'))
        .toContain('Back to Current2 top');
    });
  }

  test('sorts performance best first, worst first, then restores portfolio order', async ({ page }) => {
    await denyAnalytics(page);

    const changes = (year3: number) => ({
      today: 1,
      week1: 2,
      month1: 3,
      month3: 4,
      month6: 5,
      ytd: 6,
      year1: 7,
      year3,
      year5: 9,
    });

    await page.route('**/api/current/markets*', async (route) => {
      if (!route.request().url().includes('portfolio=1')) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          expected: 19,
          items: [
            {
              id: 'marimekko',
              label: 'MARIMEKKO',
              symbol: 'MEKKO.HE',
              price: 1,
              observedAt: '2026-09-04',
              changes: changes(-8),
            },
            {
              id: 'remedy',
              label: 'REMEDY',
              symbol: 'REMEDY.HE',
              price: 1,
              observedAt: '2026-09-04',
              changes: changes(18),
            },
            {
              id: 'ishares-world',
              label: 'ISHARES CORE MSCI WORLD UCITS ETF USD (ACC)',
              symbol: 'EUNL.DE',
              price: 1,
              observedAt: '2026-09-04',
              changes: changes(42),
            },
          ],
        }),
      });
    });

    await page.setViewportSize({ width: 1638, height: 675 });
    await page.goto('/current2/', { waitUntil: 'domcontentloaded' });

    const loadedOrder = () =>
      page
        .locator('[data-market-performance-row][data-market-performance-loaded="true"]')
        .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.marketPerformanceRow));

    const year3Header = page.locator('[data-market-sort-cell="year3"]');
    const year3Button = page.locator('[data-market-sort="year3"]');
    await expect(year3Button).toBeVisible();
    await expect(year3Header).toHaveAttribute('aria-sort', 'none');

    await year3Button.click();
    await expect(year3Header).toHaveAttribute('aria-sort', 'descending');
    await expect(year3Header).toHaveClass(/is-summary-period/);
    await expect.poll(loadedOrder).toEqual(['ishares-world', 'remedy', 'marimekko']);
    await expect(page.locator('[data-market-summary-period]')).toHaveText('3Y');
    await expect(page.locator('[data-market-summary-coverage]')).toHaveText('3 OF 19 DATA');
    await expect(page.locator('[data-market-summary-balance]')).toHaveText(
      'UP 2 / DOWN 1 / FLAT 0 / N/A 16'
    );
    await expect(page.locator('[data-market-summary-best]')).toHaveText(
      'iShares Core MSCI World UCITS ETF USD (Acc) +42.00%'
    );
    await expect(page.locator('[data-market-summary-median]')).toHaveText('+18.00%');
    await expect(page.locator('[data-market-summary-worst]')).toHaveText('Marimekko -8.00%');

    await year3Button.click();
    await expect(year3Header).toHaveAttribute('aria-sort', 'ascending');
    await expect.poll(loadedOrder).toEqual(['marimekko', 'remedy', 'ishares-world']);

    await year3Button.click();
    await expect(year3Header).toHaveAttribute('aria-sort', 'none');
    await expect.poll(loadedOrder).toEqual(['ishares-world', 'marimekko', 'remedy']);
    await expect(page.locator('[data-market-summary-period]')).toHaveText('3Y');
  });
});
