import { expect, test } from '@playwright/test';
import { onRequestGet as getResilientMarketsResponse } from '../../functions/api/current/markets-resilient';
import {
  fetchWithTimeout,
  onRequestGetWithBaseTimeout,
} from '../../functions/api/current/markets-stable';

test('Current market feed recovers when the primary upstream never resolves', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));

    if (url.hostname === 'www.suomenpankki.fi') {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return await new Promise<Response>(() => {});
    }

    if (
      url.hostname === 'reports.suomenpankki.fi' &&
      url.searchParams.get('report') === '/tilastot/markkina-_ja_hallinnolliset_korot/euribor_korot_today_xml_en'
    ) {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response('<root>2026-09-04 2.154 2.364 2.679 2.716 2.794 3.108</root>', {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    if (url.hostname === 'data-api.ecb.europa.eu') {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(
        ['TIME_PERIOD,OBS_VALUE', '2025-09,3.250', '2026-08,2.690'].join('\n'),
        { status: 200, headers: { 'Content-Type': 'text/csv' } }
      );
    }

    if (url.hostname === 'query1.finance.yahoo.com') {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
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

test('Current resilient market recovery bounds every fallback upstream request', async () => {
  const originalFetch = globalThis.fetch;
  const seenHosts = new Set<string>();

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    seenHosts.add(url.hostname);

    if (url.hostname === 'www.suomenpankki.fi') {
      return new Response('temporary failure', { status: 503 });
    }

    if (
      url.hostname === 'reports.suomenpankki.fi' &&
      url.searchParams.get('report') === '/tilastot/markkina-_ja_hallinnolliset_korot/euriborkorot_pv_chrt_en'
    ) {
      return new Response(
        '<root>4 Sep 2025 2.100 2.200 3.250 2.400 2.500 4 Sep 2026 2.100 2.200 2.679 2.400 2.500</root>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
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

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await getResilientMarketsResponse({
      request: new Request('https://aapopihkala.fi/api/current/markets'),
    });

    expect(response.status).toBe(200);
    expect(seenHosts).toEqual(
      new Set([
        'www.suomenpankki.fi',
        'reports.suomenpankki.fi',
        'data-api.ecb.europa.eu',
        'query1.finance.yahoo.com',
      ])
    );

    const data = (await response.json()) as {
      items: Array<{ id: string; value: number }>;
      recovered?: boolean;
    };
    expect(data.recovered).toBe(true);
    expect(data.items).toEqual([{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Current stable market recovery aborts stalled response bodies', async () => {
  const originalFetch = globalThis.fetch;
  let aborted = false;

  globalThis.fetch = async (_input, init) => {
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        init?.signal?.addEventListener(
          'abort',
          () => {
            aborted = true;
            controller.error(new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      },
    });

    return new Response(body, { status: 200 });
  };

  try {
    const startedAt = Date.now();
    await expect(fetchWithTimeout('https://example.com/stalled', {}, 25)).rejects.toThrow();
    expect(Date.now() - startedAt).toBeLessThan(1_000);
    expect(aborted).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
