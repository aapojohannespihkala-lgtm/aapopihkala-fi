import { expect, test } from '@playwright/test';
import { onRequestGet } from '../../functions/api/current/portfolio-complete';

const opFixtures = [
  ['op-asia-index', 'FI4000029491', 'OP-Asia Index A'],
  ['op-europe-index', 'FI4000029301', 'OP-Europe Index A'],
  ['op-world-index', 'FI4000261128', 'OP-World Index A'],
  ['op-forest-owner', 'FI4000108436', 'OP-Forest Owner B'],
] as const;

const investingFixtures = [
  ['op-aasia-indeksi-a-historical-data', 'FI4000029491'],
  ['op-eurooppa-indeksi-a-historical-data', 'FI4000029301'],
  ['fi4000261128-historical-data', 'FI4000261128'],
] as const;

const opReaderBody = (isin: string, rowLabel: string) =>
  [
    `ISIN ${isin}`,
    'Unit value (7.9.) 123,45 EUR',
    'Accumulated profit (7.9)',
    `${rowLabel} +1.00 % +2.00 % +3.00 % +4.00 % +5.00 % +6.00 %`,
    'Yearly performance',
    `${rowLabel} +0.10 % +0.20 % +0.30 % +0.40 % +0.50 % +0.60 %`,
    'Key figures',
  ].join(' ');

const investingHistoryBody = (isin: string) =>
  [
    `ISIN: ${isin}`,
    '04.09.2026 | 120,000 | 120,000 | 120,000 | 120,000 | +0,50%',
    '31.08.2026 | 118,000 | 118,000 | 118,000 | 118,000 | +0,25%',
    '28.08.2026 | 117,000 | 117,000 | 117,000 | 117,000 | +0,10%',
  ].join('\n');

const nordnetResponse = () =>
  Response.json({
    navInfo: {
      latestNav: { date: '2026-09-07', value: 123.45 },
      returns: [
        { period: 'DAY_1', development: 0.1 },
        { period: 'WEEK_1', development: 0.2 },
        { period: 'MONTH_1', development: 0.3 },
        { period: 'MONTH_3', development: 0.4 },
        { period: 'MONTH_6', development: 0.5 },
        { period: 'YTD', development: 0.6 },
        { period: 'YEAR_1', development: 0.7 },
        { period: 'YEAR_3', development: 0.8 },
        { period: 'YEAR_5', development: 0.9 },
      ],
    },
  });

test('portfolio feed recovers transient sources and enriches OP index 1D/1W from NAV history', async () => {
  const originalFetch = globalThis.fetch;
  const readerAttempts = new Map<string, number>();
  let nordnetFinlandYahooAttempts = 0;
  let nordnetFinlandProfileAttempts = 0;
  const chartDates = [
    '2020-09-01',
    '2021-09-01',
    '2022-09-01',
    '2023-09-01',
    '2024-09-01',
    '2025-09-01',
    '2026-03-01',
    '2026-08-01',
    '2026-09-07',
  ];

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.hostname === 'query1.finance.yahoo.com' || url.hostname === 'query2.finance.yahoo.com') {
      if (decodeURIComponent(url.pathname).includes('0P000134K9.ST')) {
        nordnetFinlandYahooAttempts += 1;
        if (nordnetFinlandYahooAttempts <= 2) {
          return new Response('temporary Yahoo failure', { status: 503 });
        }
      }

      return Response.json({
        chart: {
          result: [
            {
              timestamp: chartDates.map((date) => Date.parse(`${date}T00:00:00Z`) / 1000),
              indicators: { quote: [{ close: [60, 70, 80, 90, 100, 110, 120, 130, 140] }] },
            },
          ],
        },
      });
    }

    if (url.hostname === 'api.prod.nntech.io') {
      if (url.pathname.includes('nordnet-suomi-indeksi')) {
        nordnetFinlandProfileAttempts += 1;
        if (nordnetFinlandProfileAttempts === 1) {
          return new Response('temporary Nordnet failure', { status: 503 });
        }
      }
      return nordnetResponse();
    }

    if (url.hostname === 'www.op.fi') {
      return new Response('temporary upstream failure', { status: 503 });
    }

    if (url.hostname === 'fi.investing.com') {
      const fixture = investingFixtures.find(([slug]) => url.pathname.includes(slug));
      if (!fixture) throw new Error(`Unexpected Investing request: ${url}`);
      return new Response(investingHistoryBody(fixture[1]), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (url.hostname === 'r.jina.ai') {
      const originalUrl = decodeURIComponent(url.pathname.slice(1));
      const fixture = opFixtures.find(([slug]) => originalUrl.includes(slug));
      if (!fixture) throw new Error(`Unexpected reader request: ${url}`);

      const attempts = (readerAttempts.get(fixture[0]) ?? 0) + 1;
      readerAttempts.set(fixture[0], attempts);
      if (attempts <= 3) {
        return new Response('temporary reader failure', { status: 503 });
      }

      return new Response(opReaderBody(fixture[1], fixture[2]), {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await onRequestGet();
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      items: Array<{
        id: string;
        symbol: string;
        changes: Record<string, number | null>;
      }>;
      expected: number;
      unavailable: string[];
      source: string;
      version: number;
    };

    expect(body.items).toHaveLength(19);
    expect(body.expected).toBe(19);
    expect(body.unavailable).toEqual([]);
    expect(body.source).toContain('OP official reader fallback');
    expect(body.source).toContain('Investing.com ISIN-matched OP NAV history');
    expect(body.version).toBeGreaterThanOrEqual(14);
    expect(nordnetFinlandYahooAttempts).toBeGreaterThanOrEqual(3);
    expect(nordnetFinlandProfileAttempts).toBeGreaterThanOrEqual(2);

    const nordnetFinland = body.items.find((candidate) => candidate.id === 'nordnet-finland');
    expect(nordnetFinland).toBeDefined();
    expect(nordnetFinland?.changes.year5).not.toBeNull();

    for (const [slug, isin] of opFixtures.slice(0, 3)) {
      expect(readerAttempts.get(slug)).toBe(5);
      const item = body.items.find((candidate) => candidate.symbol === isin);
      expect(item).toBeDefined();
      expect(item?.changes.today).toBeCloseTo((123.45 / 120 - 1) * 100, 6);
      expect(item?.changes.week1).toBeCloseTo((123.45 / 118 - 1) * 100, 6);
      expect(item?.changes.month1).toBe(1);
      expect(item?.changes.month3).toBe(2);
      expect(item?.changes.month6).toBe(3);
      expect(item?.changes.ytd).toBe(0.6);
      expect(item?.changes.year1).toBe(4);
      expect(item?.changes.year3).not.toBeNull();
      expect(item?.changes.year5).not.toBeNull();
    }

    const forest = body.items.find((candidate) => candidate.id === 'op-forest-owner-b');
    expect(readerAttempts.get('op-forest-owner')).toBe(4);
    expect(forest).toBeDefined();
    expect(forest?.changes.today).toBeNull();
    expect(forest?.changes.week1).toBeNull();
    expect(forest?.changes.month1).toBe(1);
    expect(forest?.changes.month3).toBe(2);
    expect(forest?.changes.month6).toBe(3);
    expect(forest?.changes.ytd).toBe(0.6);
    expect(forest?.changes.year1).toBe(4);
    expect(forest?.changes.year3).not.toBeNull();
    expect(forest?.changes.year5).not.toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
