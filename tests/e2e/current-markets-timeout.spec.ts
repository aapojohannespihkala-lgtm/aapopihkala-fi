import { expect, test } from '@playwright/test';
import { onRequestGetWithBaseTimeout } from '../../functions/api/current/markets-stable';

test('Current market feed recovers when the primary upstream never resolves', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));

    if (url.hostname === 'www.suomenpankki.fi') {
      return await new Promise<Response>(() => {});
    }

    if (
      url.hostname === 'reports.suomenpankki.fi' &&
      url.searchParams.get('report') === '/tilastot/markkina-_ja_hallinnolliset_korot/euribor_korot_today_xml_en'
    ) {
      expect(init?.signal).toBeTruthy();
      return new Response('<root>2026-09-04 2.154 2.364 2.679 2.716 2.794 3.108</root>', {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    if (url.hostname === 'data-api.ecb.europa.eu') {
      expect(init?.signal).toBeTruthy();
      return new Response(
        ['TIME_PERIOD,OBS_VALUE', '2025-09,3.250', '2026-08,2.690'].join('\n'),
        { status: 200, headers: { 'Content-Type': 'text/csv' } }
      );
    }

    if (url.hostname === 'query1.finance.yahoo.com') {
      expect(init?.signal).toBeTruthy();
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

    if (url.hostname === 'reports.suomenpankki.fi') {
      throw new Error(`Unexpected Bank of Finland report: ${url.searchParams.get('report')}`);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const startedAt = Date.now();
    const response = await onRequestGetWithBaseTimeout(
      { request: new Request('https://aapopihkala.fi/api/current/markets') },
      25
    );
    const elapsedMs = Date.now() - startedAt;

    expect(response.status).toBe(200);
    expect(elapsedMs).toBeLessThan(1_000);

    const data = (await response.json()) as {
      items: Array<{ id: string; value: number; observedAt: string }>;
      series: Array<{ id: string; change1y: number }>;
      recovered?: boolean;
      recovery?: string;
    };

    expect(data.recovered).toBe(true);
    expect(data.recovery).toBe('bof-xml');
    expect(data.items).toEqual([
      { id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' },
    ]);
    expect(data.series.map((series) => series.id)).toEqual(['euribor-3m', 'world']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
