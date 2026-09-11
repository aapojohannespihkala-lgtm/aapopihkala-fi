import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { onRequestGet } from '../../functions/api/current/markets-stable';

const bankOfFinlandTodayFixture = readFileSync(
  new URL('../fixtures/current/bof-euribor-today.html', import.meta.url),
  'utf8'
);

test('Current market feed recovers through the Bank of Finland XML report', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.hostname === 'www.suomenpankki.fi') {
      return new Response('<html><body>Landing page shape changed</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (
      url.hostname === 'reports.suomenpankki.fi' &&
      url.searchParams.get('report') === '/tilastot/markkina-_ja_hallinnolliset_korot/euriborkorot_pv_chrt_en'
    ) {
      return new Response('upstream report unavailable', { status: 503 });
    }

    if (
      url.hostname === 'reports.suomenpankki.fi' &&
      url.searchParams.get('report') === '/tilastot/markkina-_ja_hallinnolliset_korot/euribor_korot_today_xml_en'
    ) {
      return new Response(bankOfFinlandTodayFixture, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    if (url.hostname === 'data-api.ecb.europa.eu') {
      return new Response(
        ['TIME_PERIOD,OBS_VALUE', '2025-09,3.250', '2026-08,2.690'].join('\n'),
        { status: 200, headers: { 'Content-Type': 'text/csv' } }
      );
    }

    if (url.hostname === 'query1.finance.yahoo.com') {
      return Response.json({
        chart: {
          result: [
            {
              timestamp: [1757030400, 1788480000],
              indicators: { quote: [{ close: [150, 180] }] },
            },
          ],
        },
      });
    }

    if (url.hostname === 'query2.finance.yahoo.com') {
      throw new Error('query2 should not be needed when query1 succeeds');
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await onRequestGet({
      request: new Request('https://aapopihkala.fi/api/current/markets'),
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      items: Array<{ id: string; value: number; observedAt: string }>;
      series: Array<{ id: string; change1y: number }>;
      recovered?: boolean;
      recovery?: string;
    };

    expect(data.recovered).toBe(true);
    expect(data.recovery).toBe('bof-xml');
    expect(data.items).toEqual([
      { id: 'euribor-3m', value: 2.669, observedAt: '2026-09-07' },
    ]);
    expect(data.series.map((series) => series.id)).toEqual(['euribor-3m', 'world']);
    expect(data.series.find((series) => series.id === 'euribor-3m')?.change1y).toBeCloseTo(-0.581, 6);
    expect(data.series.find((series) => series.id === 'world')?.change1y).toBeCloseTo(20, 6);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
