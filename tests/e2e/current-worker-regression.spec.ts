import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { fetchElectricityResponse } from '../../functions/api/current/electricity';
import { fetchElectricityMonthResponse } from '../../functions/api/current/electricity-month';
import { fetchHslDeparturesResponse } from '../../functions/api/current/hsl';
import worker, {
  servePortfolioWithLastKnownGood,
  serveWidgetWithLastKnownGood,
} from '../../worker/index';

const workerFirstPaths = [
  '/api/current/electricity',
  '/api/current/electricity-month',
  '/api/current/hsl',
  '/api/current/markets',
  '/api/current/widget',
  '/api/current/widget-v2',
  '/api/current/liiga',
  '/api/current/liiga-schedule',
];

const getOnlyWorkerPaths = workerFirstPaths.filter((path) => path !== '/api/current/hsl');

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

const buildWorkerHslFixture = () => ({
  data: {
    stops: [
      {
        name: 'Example Stop',
        code: 'E1234',
        stoptimesWithoutPatterns: [
          {
            serviceDay: 1_789_000_000,
            scheduledDeparture: 36_000,
            realtimeDeparture: 36_060,
            departureDelay: 60,
            realtime: true,
            realtimeState: 'UPDATED',
            headsign: 'Central Station',
            trip: { route: { shortName: '100' } },
          },
          {
            serviceDay: 1_789_000_000,
            scheduledDeparture: 36_600,
            realtimeDeparture: 36_600,
            departureDelay: 0,
            realtime: false,
            realtimeState: 'SCHEDULED',
            headsign: 'Other destination',
            trip: { route: { shortName: '999' } },
          },
        ],
      },
    ],
  },
});

test('Wrangler sends every Current API route through the Worker first', () => {
  const config = JSON.parse(
    readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
  );

  expect(config.assets?.run_worker_first).toEqual(workerFirstPaths);
});

test('Worker preserves environment bindings for both Widget v2 routes', () => {
  const source = readFileSync(new URL('../../worker/index.ts', import.meta.url), 'utf8');
  const calls = source.match(/getWidgetV2Response\(\{ request, env \}\)/g) ?? [];

  expect(calls).toHaveLength(2);
});

test('Worker serves Current APIs, enforces route methods and keeps static assets as fallback', async () => {
  const originalFetch = globalThis.fetch;
  const upstreamFixture = buildWorkerElectricityFixture();
  const monthFixture = buildWorkerElectricityMonthFixture();
  const hslFixture = buildWorkerHslFixture();
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

    if (url === 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1') {
      expect(init?.method).toBe('POST');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('digitransit-subscription-key')).toBe('test-digitransit-key');

      const body = JSON.parse(String(init?.body));
      expect(body.variables).toMatchObject({
        stopQuery: 'E1234',
        numberOfDepartures: 40,
      });

      return new Response(JSON.stringify(hslFixture), {
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
    DIGITRANSIT_API_KEY: 'test-digitransit-key',
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

    const hslResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/hsl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopCode: 'E1234', routes: ['100'] }),
      }),
      env
    );

    expect(hslResponse.status).toBe(200);
    expect(await hslResponse.json()).toMatchObject({
      source: 'HSL Digitransit',
      stop: { code: 'E1234', name: 'Example Stop' },
      routes: ['100'],
      departures: [
        {
          route: '100',
          headsign: 'Central Station',
          delaySeconds: 60,
          realtime: true,
          realtimeState: 'UPDATED',
        },
      ],
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

    const hslMethodResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/hsl'),
      env
    );
    expect(hslMethodResponse.status).toBe(405);
    expect(hslMethodResponse.headers.get('allow')).toBe('POST');

    const staticResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/current/'),
      env
    );

    expect(staticResponse.status).toBe(200);
    expect(await staticResponse.text()).toBe('asset:/current/');

    for (const path of getOnlyWorkerPaths) {
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

test('Current HSL returns a bounded upstream failure after abort', async () => {
  const abortingFetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })) as typeof fetch;

  const request = new Request('https://aapopihkala.fi/api/current/hsl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stopCode: 'E1234', routes: ['100'] }),
  });
  const startedAt = Date.now();
  const response = await fetchHslDeparturesResponse({
    request,
    apiKey: 'test-digitransit-key',
    fetchImpl: abortingFetch,
    timeoutMs: 5,
  });

  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: 'upstream_unavailable' });
  expect(Date.now() - startedAt).toBeLessThan(1_000);
});


test('Portfolio fills degraded live data from one shared last-known-good cache entry', async () => {
  const periods = ['today', 'week1', 'month1', 'month3', 'month6', 'ytd', 'year1', 'year3', 'year5'];
  const ids = [
    'handelsbanken-usa',
    'nordnet-finland',
    'ishares-world',
    'ishares-europe',
    'nordnet-sweden',
    'spiltan-investmentbolag',
    'storebrand-japan',
    'franklin-sp500-climate',
    'xact-norden',
    'nordea',
    'marimekko',
    'remedy',
    'op-asia-index-a',
    'op-europe-index-a',
    'op-world-index-a',
    'op-forest-owner-b',
    'btc',
    'bnb',
    'eth',
  ];
  const changesFor = (id: string) =>
    Object.fromEntries(
      periods.map((period, index) => [
        period,
        id === 'op-forest-owner-b' && ['today', 'week1', 'month1'].includes(period)
          ? null
          : index + 1,
      ])
    );
  const completeBody = {
    items: ids.map((id) => ({
      id,
      label: id.toUpperCase(),
      symbol: id,
      price: 100,
      observedAt: '2026-09-21',
      changes: changesFor(id),
    })),
    expected: 19,
    liveExpected: 19,
    unavailable: [],
    source: 'test-live',
    version: 14,
  };

  const entries = new Map<string, Response>();
  const cache = {
    match: async (request: Request) => entries.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => {
      entries.set(request.url, response.clone());
    },
  };

  const seed = await servePortfolioWithLastKnownGood(
    new Request('https://aapopihkala.fi/api/current/markets?portfolio=1&live_smoke=seed'),
    async () => Response.json(completeBody),
    cache,
  );
  expect(seed.status).toBe(200);
  expect(entries.size).toBe(1);

  const missing = new Set([
    'storebrand-japan',
    'marimekko',
    'remedy',
    'op-asia-index-a',
    'op-europe-index-a',
    'op-world-index-a',
  ]);
  const degradedItems = completeBody.items
    .filter((item) => !missing.has(item.id))
    .map((item) =>
      item.id === 'handelsbanken-usa'
        ? { ...item, changes: { ...item.changes, year1: 99 } }
        : item
    );

  const recovered = await servePortfolioWithLastKnownGood(
    new Request('https://aapopihkala.fi/api/current/markets?portfolio=1&v=6'),
    async () =>
      Response.json({
        ...completeBody,
        items: degradedItems,
        unavailable: [...missing],
        source: 'degraded-live',
      }),
    cache,
  );

  expect(recovered.status).toBe(200);
  expect(recovered.headers.get('x-portfolio-fallback')).toBe('last-known-good');
  expect(recovered.headers.get('cache-control')).toBe('private, no-store');

  const body = await recovered.json();
  expect(body.items).toHaveLength(19);
  expect(body.unavailable).toEqual([]);
  expect(body.fallback).toBe('last-known-good');

  const byId = new Map<
    string,
    { id: string; changes: Record<string, number | null> }
  >(body.items.map((item: { id: string; changes: Record<string, number | null> }) => [item.id, item]));
  expect(byId.get('storebrand-japan')).toBeDefined();
  expect(byId.get('marimekko')).toBeDefined();
  expect(byId.get('remedy')).toBeDefined();
  expect(byId.get('op-asia-index-a')).toBeDefined();
  expect(byId.get('handelsbanken-usa')?.changes.year1).toBe(99);
});

test('Portfolio live smoke bypasses last-known-good fallback for incomplete data', async () => {
  const entries = new Map<string, Response>();
  const cache = {
    match: async (request: Request) => entries.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => {
      entries.set(request.url, response.clone());
    },
  };
  const partial = {
    items: [],
    expected: 19,
    liveExpected: 19,
    unavailable: ['marimekko'],
    source: 'partial',
    version: 14,
  };

  const response = await servePortfolioWithLastKnownGood(
    new Request('https://aapopihkala.fi/api/current/markets?portfolio=1&live_smoke=check'),
    async () => Response.json(partial),
    cache,
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('x-portfolio-fallback')).toBeNull();
  expect(await response.json()).toEqual(partial);
});

test('Widget serves last-known-good payload when a refresh returns 503', async () => {
  const entries = new Map<string, Response>();
  const cache = {
    match: async (request: Request) => entries.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => {
      entries.set(request.url, response.clone());
    },
  };

  const request = new Request('https://aapopihkala.fi/api/current/widget-v2?channel=prod');
  const healthy = await serveWidgetWithLastKnownGood(
    request,
    async () => Response.json({
      schemaVersion: 2,
      generatedAt: '2026-09-18T14:00:00.000Z',
      sections: [{ id: 'weather', observedAt: '2026-09-18T14:00:00.000Z' }],
    }),
    cache,
  );
  expect(healthy.status).toBe(200);

  const degraded = await serveWidgetWithLastKnownGood(
    request,
    async () => Response.json({ error: 'widget_data_unavailable' }, { status: 503 }),
    cache,
  );

  expect(degraded.status).toBe(200);
  expect(degraded.headers.get('x-widget-fallback')).toBe('last-known-good');
  expect(degraded.headers.get('cache-control')).toBe('private, no-store');
  expect(await degraded.json()).toMatchObject({
    generatedAt: '2026-09-18T14:00:00.000Z',
    sections: [{ id: 'weather' }],
  });
});

test('Widget v2 aliases share one last-known-good payload', async () => {
  const entries = new Map<string, Response>();
  const cache = {
    match: async (request: Request) => entries.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => {
      entries.set(request.url, response.clone());
    },
  };

  const legacyRequest = new Request(
    'https://aapopihkala.fi/api/current/widget?v=2&channel=prod&_=legacy-refresh'
  );
  const healthy = await serveWidgetWithLastKnownGood(
    legacyRequest,
    async () => Response.json({
      schemaVersion: 2,
      generatedAt: '2026-09-26T12:30:00.000Z',
      sections: [{ id: 'weather', observedAt: '2026-09-26T12:30:00.000Z' }],
    }),
    cache,
  );
  expect(healthy.status).toBe(200);
  expect(entries.has('https://aapopihkala.fi/api/current/widget-v2?channel=prod')).toBe(true);
  expect(entries.has('https://aapopihkala.fi/api/current/widget?v=2&channel=prod')).toBe(true);

  const webRequest = new Request(
    'https://aapopihkala.fi/api/current/widget-v2?channel=prod'
  );
  const degraded = await serveWidgetWithLastKnownGood(
    webRequest,
    async () => Response.json({ error: 'widget_data_unavailable' }, { status: 503 }),
    cache,
  );

  expect(degraded.status).toBe(200);
  expect(degraded.headers.get('x-widget-fallback')).toBe('last-known-good');
  expect(await degraded.json()).toMatchObject({
    generatedAt: '2026-09-26T12:30:00.000Z',
    sections: [{ id: 'weather' }],
  });
});

test('Widget does not hide a 503 when no last-known-good payload exists', async () => {
  const cache = {
    match: async (_request: Request) => undefined,
    put: async (_request: Request, _response: Response) => undefined,
  };
  const request = new Request('https://aapopihkala.fi/api/current/widget');

  const response = await serveWidgetWithLastKnownGood(
    request,
    async () => Response.json({ error: 'widget_data_unavailable' }, { status: 503 }),
    cache,
  );

  expect(response.status).toBe(503);
});
