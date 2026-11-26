import { expect, test } from '@playwright/test';
import { onRequestGet } from '../../functions/api/current/portfolio-stable';

test('tries verified Nordic sources first and retries only missing portfolio rows', async () => {
  const originalFetch = globalThis.fetch;
  const requests: URL[] = [];
  const funds = [
    { id: 'handelsbanken-usa', slug: 'handelsbanken-usa-index', isin: 'SE0006800140' },
    { id: 'nordnet-finland', slug: 'nordnet-suomi-indeksi', isin: 'SE0005993102' },
    { id: 'storebrand-japan', slug: 'storebrand-japan-a-eur', isin: 'SE0013801479' },
  ];
  const opRows = {
    'op-asia-index': 'OP-Asia Index A',
    'op-europe-index': 'OP-Europe Index A',
    'op-world-index': 'OP-World Index A',
    'op-forest-owner': 'OP-Forest Owner B',
  };
  const navDate = new Date().toISOString().slice(0, 10);
  const returns = [
    'DAY_1', 'WEEK_1', 'MONTH_1', 'MONTH_3', 'MONTH_6', 'YTD', 'YEAR_1', 'YEAR_3', 'YEAR_5',
  ].map((period, index) => ({ period, development: index + 1 }));
  const chartDates = [
    '2020-09-01', '2021-09-01', '2022-09-01', '2023-09-01', '2024-09-01',
    '2025-09-01', '2026-03-01', '2026-08-01', '2026-09-07',
  ];
  let remedyAttempts = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    if (requests.length > 50) throw new Error('Worker subrequest budget spent');

    const fund = funds.find(({ slug }) => url.pathname.includes(slug));
    if (fund && ['www.nordnet.se', 'www.nordnet.fi'].includes(url.hostname)) {
      return Response.json({
        isin: fund.isin,
        currency: 'EUR',
        navInfo: { latestNav: { date: navDate, value: 123.45 }, returns },
      });
    }

    if (url.hostname.startsWith('query') && url.hostname.endsWith('finance.yahoo.com')) {
      if (url.pathname.endsWith('/REMEDY.HE') && ++remedyAttempts <= 2) {
        return new Response('temporary upstream failure', { status: 503 });
      }
      return Response.json({
        chart: { result: [{
          timestamp: chartDates.map((date) => Date.parse(date) / 1000),
          indicators: { quote: [{ close: [60, 70, 80, 90, 100, 110, 120, 130, 140] }] },
        }] },
      });
    }

    if (url.hostname === 'api.prod.nntech.io') return new Response(null, { status: 404 });

    if (url.hostname === 'www.op.fi') {
      const slug = url.pathname.split('/').at(-1);
      const label = opRows[slug as keyof typeof opRows];
      if (label) {
        const row = `${label} +1.00 % +2.00 % +3.00 % +4.00 % +5.00 % +6.00 %`;
        return new Response(
          `Accumulated profit (7.9) ${row} Yearly performance ${row} Key figures`
        );
      }
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await onRequestGet();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.expected).toBe(19);
    expect(data.items).toHaveLength(19);
    expect(data.unavailable).toEqual([]);
    expect(data.source).toContain('verified public fund recovery');
    expect(requests.slice(0, 3).map(({ hostname }) => hostname)).toEqual([
      'www.nordnet.se', 'www.nordnet.fi', 'www.nordnet.fi',
    ]);
    expect(requests.filter(({ pathname }) => pathname.endsWith('/EUNL.DE'))).toHaveLength(1);
    expect(remedyAttempts).toBe(3);
    expect(requests.length).toBeLessThanOrEqual(50);

    for (const fund of funds) {
      const item = data.items.find(({ id }: { id: string }) => id === fund.id);
      expect(item).toMatchObject({ symbol: fund.isin, observedAt: navDate });
      expect(Object.values(item.changes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
