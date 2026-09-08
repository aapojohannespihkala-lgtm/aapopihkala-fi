import { expect, test } from '@playwright/test';

const changes = (year1: number) => ({
  today: 0,
  week1: 0,
  month1: 0,
  month3: 0,
  month6: 0,
  ytd: 0,
  year1,
  year3: 0,
  year5: 0,
});

const portfolioFixture = {
  expected: 19,
  items: [
    {
      id: 'marimekko',
      label: 'MARIMEKKO',
      symbol: 'MEKKO.HE',
      price: 1,
      observedAt: '2026-09-08',
      changes: changes(12),
    },
    {
      id: 'remedy',
      label: 'REMEDY',
      symbol: 'REMEDY.HE',
      price: 1,
      observedAt: '2026-09-08',
      changes: changes(-4),
    },
    {
      id: 'ishares-world',
      label: 'ISHARES CORE MSCI WORLD UCITS ETF USD (ACC)',
      symbol: 'EUNL.DE',
      price: 1,
      observedAt: '2026-09-08',
      changes: changes(35),
    },
  ],
};

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.669, observedAt: '2026-09-07' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.669,
      observedAt: '2026-09-07',
      change1y: -0.4,
      points: [
        { observedAt: '2025-09-08', value: 3.069 },
        { observedAt: '2026-09-07', value: 2.669 },
      ],
    },
    {
      id: 'world',
      value: 112,
      observedAt: '2026-09-08',
      change1y: 12,
      points: [
        { observedAt: '2025-09-08', value: 100 },
        { observedAt: '2026-09-08', value: 112 },
      ],
    },
  ],
};

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`keeps portfolio value sorting two-state on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.route('**/api/current/markets*', async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(url.searchParams.get('portfolio') === '1' ? portfolioFixture : macroFixture),
      });
    });

    await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });

    const loadedOrder = () =>
      page
        .locator('[data-market-performance-row][data-market-performance-loaded="true"]')
        .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.marketPerformanceRow));

    const year1Header = page.locator('[data-market-sort-cell="year1"]');
    const year1Button = page.locator('[data-market-sort="year1"]');
    const marketHeader = page.locator('[data-market-sort-cell="market"]');
    const marketButton = page.locator('[data-market-sort="market"]');

    await expect.poll(loadedOrder).toEqual(['ishares-world', 'marimekko', 'remedy']);
    await expect(year1Header).toHaveAttribute('aria-sort', 'descending');
    await expect(page.locator('[data-market-summary-period]')).toHaveText('1Y');

    await year1Button.click();
    await expect.poll(loadedOrder).toEqual(['remedy', 'marimekko', 'ishares-world']);
    await expect(year1Header).toHaveAttribute('aria-sort', 'ascending');
    await expect(year1Button).toHaveAttribute(
      'aria-label',
      'Sort holdings by 1Y performance, best first'
    );

    await year1Button.click();
    await expect.poll(loadedOrder).toEqual(['ishares-world', 'marimekko', 'remedy']);
    await expect(year1Header).toHaveAttribute('aria-sort', 'descending');

    await year1Button.click();
    await expect.poll(loadedOrder).toEqual(['remedy', 'marimekko', 'ishares-world']);
    await expect(year1Header).toHaveAttribute('aria-sort', 'ascending');
    await expect(marketHeader).toHaveAttribute('aria-sort', 'none');

    await marketButton.click();
    await expect.poll(loadedOrder).toEqual(['ishares-world', 'marimekko', 'remedy']);
    await expect(marketHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(marketButton).toHaveAttribute('aria-label', 'Sort holdings alphabetically Z to A');
    await expect(year1Header).toHaveAttribute('aria-sort', 'none');
  });
}
