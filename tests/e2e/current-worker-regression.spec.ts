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
  '/api/current/liiga-schedule',
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

const buildWorkerLiigaScheduleFixture = (start: string) => ({
  games: [
    {
      id: 2701370,
      start,
      homeTeam: { teamId: 'hpk', goals: null },
      awayTeam: { teamId: 'ilves', goals: null },
      started: false,
      ended: false,
      gameTime: null,
      cacheUpdateDate: '2026-09-10T01:00:00.000Z',
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
  const scheduleStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const scheduleFixture = buildWorkerLiigaScheduleFixture(scheduleStart);

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    expect(headers.get('Accept')).toBe('application/json');
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

    if (
      url.startsWith('https://liiga.fi/api/v2/games?') &&
      headers.get('User-Agent') === 'aapopihkala.fi Current Liiga schedule'
    ) {
      const requestUrl = new URL(url);
      expect(requestUrl.searchParams.get('tournament')).toBe('runkosarja');
      expect(requestUrl.searchParams.get('season')).toMatch(/^\d{4}$/);

      return new Response(JSON.stringify(scheduleFixture), {
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

    const liigaResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/liiga'),
      env
    );

    expect(liigaResponse.status).toBe(502);
    expect(await liigaResponse.json()).toEqual({
      error: 'Liiga data request failed',
    });

    const scheduleResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/liiga-schedule'),
      env
    );

    expect(scheduleResponse.status).toBe(200);
    expect(await scheduleResponse.json()).toMatchObject({
      generatedAt: '2026-09-10T01:00:00.000Z',
      source: 'Liiga',
      upstream: '/api/v2/games',
      liveGames: [],
      upcomingGames: [
        {
          id: 2701370,
          start: scheduleStart,
          homeTeamId: 'hpk',
          homeTeam: 'HPK',
          awayTeamId: 'ilves',
          awayTeam: 'Ilves',
          homeGoals: null,
          awayGoals: null,
          gameTime: null,
        },
      ],
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