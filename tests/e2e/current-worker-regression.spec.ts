import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { fetchElectricityResponse } from '../../functions/api/current/electricity';
import { fetchElectricityMonthResponse } from '../../functions/api/current/electricity-month';
import worker from '../../worker/index';

const workerFirstPaths = [
  '/api/current/electricity',
  '/api/current/electricity-month',
  '/api/current/markets',
  '/api/current/news',
  '/api/current/liiga',
];

const buildWorkerElectricityFixture = () => ({
  prices: [
    {
      price: 1.23,
      startDate: '2026-09-06T14:00:00.000Z',
      endDate: '2026-09-06T14:15:00.000Z',
    },
  ],
});

const buildWorkerElectricityMonthFixture = () => ({
  daily: [],
  monthly: [
    {
      month: '2026-08',
      average: 7.84,
      hours: 744,
    },
  ],
});

test('Wrangler sends every Current API route through the Worker first', () => {
  const config = JSON.parse(
    readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
  );

  expect(config.assets?.run_worker_first).toEqual(workerFirstPaths);
});

test('Worker serves Current APIs, enforces GET-only routes and keeps static assets as fallback', async () => {
  const originalFetch = globalThis.fetch;
  const upstreamFixture = buildWorkerElectricityFixture();
  const monthFixture = buildWorkerElectricityMonthFixture();

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    if (url === 'https://api.porssisahko.net/v2/latest-prices.json') {
      return new Response(JSON.stringify(upstreamFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url === 'https://parassahko.fi/tilastot/data.json') {
      return new Response(JSON.stringify(monthFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unexpected upstream URL: ${url}`);
  };

  const env = {
    ASSETS: {
      fetch: async (request: Request) =>
        new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }),
    },
  };

  try {
    const apiResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/electricity'),
      env
    );

    expect(apiResponse.status).toBe(200);
    expect(await apiResponse.json()).toEqual(upstreamFixture);

    const monthResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/electricity-month'),
      env
    );

    expect(monthResponse.status).toBe(200);
    expect(await monthResponse.json()).toMatchObject({
      average: 7.84,
      kind: 'last-complete-month',
      month: '2026-08',
      hours: 744,
    });

    const staticResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/current/'),
      env
    );

    expect(staticResponse.status).toBe(200);
    expect(await staticResponse.text()).toBe('asset:/current/');

    for (const path of workerFirstPaths) {
      const methodResponse = await worker.fetch(
        new Request(`https://aapopihkala.fi${path}`, { method: 'POST' }),
        env
      );

      expect(methodResponse.status).toBe(405);
      expect(methodResponse.headers.get('allow')).toBe('GET');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Current electricity returns a bounded upstream failure after abort', async () => {
  const abortingFetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })) as typeof fetch;

  const startedAt = Date.now();
  const response = await fetchElectricityResponse(abortingFetch, 5);

  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: 'upstream_unavailable' });
  expect(Date.now() - startedAt).toBeLessThan(1_000);
});

test('Current electricity month returns a bounded upstream failure after abort', async () => {
  const abortingFetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })) as typeof fetch;

  const startedAt = Date.now();
  const response = await fetchElectricityMonthResponse(abortingFetch, 5);

  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: 'statistics_unavailable' });
  expect(Date.now() - startedAt).toBeLessThan(1_000);
});
