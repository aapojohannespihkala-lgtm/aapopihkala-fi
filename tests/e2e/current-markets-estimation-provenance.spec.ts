import { expect, test } from '@playwright/test';

const ids = [
  'handelsbanken-usa', 'nordnet-finland', 'ishares-world', 'ishares-europe',
  'nordnet-sweden', 'spiltan-investmentbolag', 'storebrand-japan',
  'franklin-sp500-climate', 'xact-norden', 'nordea', 'marimekko', 'remedy',
  'op-asia-index-a', 'op-europe-index-a', 'op-world-index-a',
  'op-forest-owner-b', 'btc', 'bnb', 'eth',
];
const periods = ['today','week1','month1','month3','month6','ytd','year1','year3','year5'] as const;
const sourceDate = '2026-11-20';
const changes = Object.fromEntries(periods.map((p) => [p, p === 'month3' ? 6 : 0.1]));
const makeRow = (id: string) => ({
  id, label: id.toUpperCase(), symbol: id, price: 10, observedAt: sourceDate,
  changes: { ...changes },
  estimatedPeriods: periods.filter((p) => p !== 'month3'),
  estimationMethod: 'geometric-period-scaling',
  estimationDetails: Object.fromEntries(periods.filter((p) => p !== 'month3').map((p) => [
    p, {
      sourcePeriod: 'month3', sourceReturnPercent: 6, sourceDays: 91,
      targetDays: p === 'today' ? 1 : p === 'week1' ? 7 : 365,
      sourceObservedAt: sourceDate, sourceAgeDays: 1,
      method: 'geometric-period-scaling',
    },
  ])),
});

test('19 source-based holdings render every period as real or explicitly sourced estimate', async ({ page }) => {
  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());
    const data = url.searchParams.get('portfolio') === '1'
      ? { items: ids.map(makeRow), expected: 19 }
      : { items: [], series: [] };
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify(data) });
  });
  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-market-performance-row][data-market-performance-loaded="true"]'))
    .toHaveCount(19);
  const cells = page.locator('[data-market-performance-row] [data-market-performance-change]');
  await expect(cells).toHaveCount(19 * 9);
  expect(await cells.evaluateAll((nodes) => nodes.every((node) =>
    Boolean(node.textContent?.includes('%')) && node.textContent !== '--'))).toBe(true);
  const source = page.locator('[data-market-performance-row="nordnet-finland"] [data-market-performance-change="month3"]');
  const estimate = page.locator('[data-market-performance-row="nordnet-finland"] [data-market-performance-change="today"]');
  await expect(source).toHaveText('+6.00%');
  await expect(source).not.toHaveAttribute('data-estimated', 'true');
  await expect(source).toHaveAttribute('title', /Lähdearvo 3M.*2026-11-20/);
  await expect(estimate).toHaveText('≈+0.10%');
  await expect(estimate).toHaveAttribute('data-estimated', 'true');
  await expect(estimate).toHaveAttribute('title', /lähde 3M \+6.00%.*havainto 2026-11-20, tuoreus 1 pv/);
  await expect(estimate).toHaveAttribute('aria-label', /Laskennallinen arvio 1D/);
});

test('a verified return wins over a later estimate when a partial feed recovers', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('portfolio') !== '1') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({items:[],series:[]}) });
      return;
    }
    requests += 1;
    const items = ids.slice(0, requests === 1 ? 18 : 19).map(makeRow);
    const target = items.find((item) => item.id === 'marimekko');
    if (target && requests === 1) {
      target.changes.month1 = 2.5;
      target.estimatedPeriods = target.estimatedPeriods.filter((p) => p !== 'month1');
    } else if (target) {
      target.changes.month1 = 99;
      target.changes.today = 0.5;
      target.estimatedPeriods = target.estimatedPeriods.filter((p) => p !== 'today');
    }
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ items, expected: 19 }) });
  });
  await page.goto('/current/markets/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => requests, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
  const row = page.locator('[data-market-performance-row="marimekko"]');
  const month = row.locator('[data-market-performance-change="month1"]');
  const day = row.locator('[data-market-performance-change="today"]');
  await expect(month).toHaveText('+2.50%');
  await expect(month).not.toHaveAttribute('data-estimated', 'true');
  await expect(day).toHaveText('+0.50%');
  await expect(day).not.toHaveAttribute('data-estimated', 'true');
  await expect(page.locator('[data-market-performance-row][data-market-performance-loaded="true"]'))
    .toHaveCount(19);
});
