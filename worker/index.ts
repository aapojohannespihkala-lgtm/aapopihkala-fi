import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getElectricityMonthResponse } from '../functions/api/current/electricity-month';
import { fetchHslDeparturesResponse } from '../functions/api/current/hsl';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets-stable';
import { onRequestGet as getPortfolioResponse } from '../functions/api/current/portfolio-complete';
import { onRequestGet as getSnapshotPortfolioResponse } from '../functions/api/current/portfolio-snapshot';
import { onRequestGet as getWidgetResponse } from '../functions/api/current/widget';
import { onRequestGet as getWidgetV2Response } from '../functions/api/current/widget-v2';
import { fetchLiigaResponse, onRequestGet as getLiigaResponse } from '../functions/api/current/liiga';
import { onRequestGet as getLiigaScheduleResponse } from '../functions/api/current/liiga-schedule';

type AssetsBinding = { fetch(request: Request): Promise<Response> };
type WorkerEnv = { ASSETS: AssetsBinding; DIGITRANSIT_API_KEY?: string };
type ResponseCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const ELECTRICITY_MONTH_PATH = '/api/current/electricity-month';
const HSL_PATH = '/api/current/hsl';
const MARKETS_PATH = '/api/current/markets';
const WIDGET_PATH = '/api/current/widget';
const WIDGET_V2_PATH = '/api/current/widget-v2';
const LIIGA_PATH = '/api/current/liiga';
const LIIGA_SCHEDULE_PATH = '/api/current/liiga-schedule';
const SNAPSHOT_LIIGA_UPSTREAM_TIMEOUT_MS = 4_000;

const WIDGET_LAST_KNOWN_GOOD_TTL_SECONDS = 24 * 60 * 60;
const PORTFOLIO_LAST_KNOWN_GOOD_TTL_SECONDS = 24 * 60 * 60;
const PORTFOLIO_PERIODS = [
  'today',
  'week1',
  'month1',
  'month3',
  'month6',
  'ytd',
  'year1',
  'year3',
  'year5',
] as const;
const PORTFOLIO_HOLDING_IDS = [
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
] as const;
const OP_FOREST_REQUIRED_PERIODS = ['month3', 'month6', 'ytd', 'year1', 'year3', 'year5'] as const;

const defaultResponseCache = (): ResponseCache | undefined =>
  (globalThis as typeof globalThis & { caches?: { default?: ResponseCache } }).caches?.default;

const widgetCacheKeys = (request: Request) => {
  const source = new URL(request.url);
  const isV2 =
    source.pathname === WIDGET_V2_PATH ||
    (source.pathname === WIDGET_PATH && source.searchParams.get('v') === '2');
  const channel = source.searchParams.get('channel') === 'dev' ? 'dev' : 'prod';
  const liveSmoke = source.searchParams.get('live_smoke');

  const buildKey = (pathname: string, params: Array<[string, string]> = []) => {
    const url = new URL(source.origin);
    url.pathname = pathname;
    for (const [key, value] of params) url.searchParams.set(key, value);
    return new Request(url.toString(), { method: 'GET' });
  };

  if (isV2) {
    const sharedParams: Array<[string, string]> = [['channel', channel]];
    if (liveSmoke) sharedParams.push(['live_smoke', liveSmoke]);
    return [
      buildKey(WIDGET_V2_PATH, sharedParams),
      buildKey(WIDGET_PATH, [['v', '2'], ...sharedParams]),
    ];
  }

  return [
    buildKey(
      WIDGET_PATH,
      liveSmoke ? [['live_smoke', liveSmoke]] : [],
    ),
  ];
};

export const serveWidgetWithLastKnownGood = async (
  request: Request,
  load: () => Promise<Response>,
  cache: ResponseCache | undefined = defaultResponseCache(),
) => {
  const response = await load();
  if (!cache) return response;

  const keys = widgetCacheKeys(request);
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${WIDGET_LAST_KNOWN_GOOD_TTL_SECONDS}`);
    const cached = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    for (const key of keys) {
      try {
        await cache.put(key, cached.clone());
      } catch {
        // Cache is a resilience layer only; one alias failing must not fail a healthy feed.
      }
    }
    return response;
  }

  if (response.status !== 503) return response;

  for (const key of keys) {
    try {
      const fallback = await cache.match(key);
      if (!fallback) continue;
      const headers = new Headers(fallback.headers);
      headers.set('Cache-Control', 'private, no-store');
      headers.set('X-Widget-Fallback', 'last-known-good');
      return new Response(fallback.body, {
        status: 200,
        statusText: 'OK',
        headers,
      });
    } catch {
      // Try the other compatible Widget cache alias before returning the live failure.
    }
  }

  return response;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const portfolioCacheKey = (request: Request) => {
  const url = new URL(request.url);
  url.search = '';
  url.searchParams.set('portfolio', '1');
  url.searchParams.set('cache', 'last-known-good-v1');
  return new Request(url.toString(), { method: 'GET' });
};

const parsePortfolioBody = async (response: Response) => {
  try {
    return asRecord(await response.clone().json());
  } catch {
    return null;
  }
};

const isFinitePortfolioValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value);

const isCompletePortfolioBody = (body: Record<string, unknown>) => {
  if (body.expected !== PORTFOLIO_HOLDING_IDS.length) return false;
  if (!Array.isArray(body.items) || body.items.length !== PORTFOLIO_HOLDING_IDS.length) return false;
  if (!Array.isArray(body.unavailable) || body.unavailable.length > 0) return false;

  const byId = new Map<string, Record<string, unknown>>();
  for (const candidate of body.items) {
    const item = asRecord(candidate);
    if (!item || typeof item.id !== 'string') continue;
    byId.set(item.id, item);
  }
  if (byId.size !== PORTFOLIO_HOLDING_IDS.length) return false;

  for (const id of PORTFOLIO_HOLDING_IDS) {
    const item = byId.get(id);
    const changes = item ? asRecord(item.changes) : null;
    if (!changes) return false;

    const requiredPeriods =
      id === 'op-forest-owner-b' ? OP_FOREST_REQUIRED_PERIODS : PORTFOLIO_PERIODS;
    if (requiredPeriods.some((period) => !isFinitePortfolioValue(changes[period]))) return false;
  }

  return true;
};

const mergePortfolioItem = (
  cached: Record<string, unknown>,
  live: Record<string, unknown> | undefined,
) => {
  if (!live) return cached;

  const cachedChanges = asRecord(cached.changes) ?? {};
  const liveChanges = asRecord(live.changes) ?? {};
  const changes = { ...cachedChanges };

  for (const period of PORTFOLIO_PERIODS) {
    const value = liveChanges[period];
    if (isFinitePortfolioValue(value)) changes[period] = value;
  }

  return {
    ...cached,
    ...live,
    price: isFinitePortfolioValue(live.price) ? live.price : cached.price,
    observedAt:
      typeof live.observedAt === 'string' && live.observedAt
        ? live.observedAt
        : cached.observedAt,
    changes,
  };
};

const mergePortfolioBodies = (
  cachedBody: Record<string, unknown>,
  liveBody: Record<string, unknown>,
) => {
  const cachedItems = Array.isArray(cachedBody.items) ? cachedBody.items : [];
  const liveItems = Array.isArray(liveBody.items) ? liveBody.items : [];
  const cachedById = new Map<string, Record<string, unknown>>();
  const liveById = new Map<string, Record<string, unknown>>();

  for (const candidate of cachedItems) {
    const item = asRecord(candidate);
    if (item && typeof item.id === 'string') cachedById.set(item.id, item);
  }
  for (const candidate of liveItems) {
    const item = asRecord(candidate);
    if (item && typeof item.id === 'string') liveById.set(item.id, item);
  }

  const items = PORTFOLIO_HOLDING_IDS.flatMap((id) => {
    const cached = cachedById.get(id);
    if (!cached) return [];
    return [mergePortfolioItem(cached, liveById.get(id))];
  });
  const liveSource = typeof liveBody.source === 'string' ? liveBody.source : '';
  const cachedSource = typeof cachedBody.source === 'string' ? cachedBody.source : '';

  return {
    ...cachedBody,
    ...liveBody,
    items,
    expected: PORTFOLIO_HOLDING_IDS.length,
    unavailable: [],
    source: [liveSource || cachedSource, 'last-known-good'].filter(Boolean).join(' + '),
    fallback: 'last-known-good',
  };
};

const portfolioFallbackResponse = (
  body: Record<string, unknown>,
  cachedHeaders: Headers,
) => {
  const headers = new Headers(cachedHeaders);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('X-Portfolio-Fallback', 'last-known-good');
  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: 'OK',
    headers,
  });
};

export const servePortfolioWithLastKnownGood = async (
  request: Request,
  load: () => Promise<Response>,
  cache: ResponseCache | undefined = defaultResponseCache(),
) => {
  const response = await load();
  if (!cache) return response;

  const liveBody = response.ok ? await parsePortfolioBody(response) : null;
  const complete = Boolean(liveBody && isCompletePortfolioBody(liveBody));
  const key = portfolioCacheKey(request);

  if (complete && liveBody) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${PORTFOLIO_LAST_KNOWN_GOOD_TTL_SECONDS}`);
    headers.set('Content-Type', 'application/json; charset=utf-8');

    try {
      await cache.put(
        key,
        new Response(JSON.stringify(liveBody), {
          status: 200,
          statusText: 'OK',
          headers,
        }),
      );
    } catch {
      // Cache is a resilience layer only; a cache write failure must not fail healthy live data.
    }
    return response;
  }

  if (new URL(request.url).searchParams.has('live_smoke')) return response;

  let cached: Response | undefined;
  try {
    cached = await cache.match(key);
  } catch {
    return response;
  }
  if (!cached) return response;

  const cachedBody = await parsePortfolioBody(cached);
  if (!cachedBody || !isCompletePortfolioBody(cachedBody)) return response;

  const fallbackBody =
    response.ok && liveBody
      ? mergePortfolioBodies(cachedBody, liveBody)
      : { ...cachedBody, fallback: 'last-known-good' };

  return portfolioFallbackResponse(fallbackBody, cached.headers);
};

const methodNotAllowed = (allow = 'GET') => new Response('Method not allowed', { status: 405, headers: { Allow: allow } });
const isSnapshotRequest = (request: Request) => {
  const referer = request.headers.get('Referer');
  if (!referer) return false;
  try { return new URL(referer).pathname === '/current/snapshot/'; } catch { return false; }
};
const publicLiigaResponse = async (response: Response, error: string) => {
  if (response.status < 500) return response;
  return Response.json({ error }, { status: response.status, headers: response.headers });
};

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const snapshotRequest = isSnapshotRequest(request);
    if (url.pathname === ELECTRICITY_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return getElectricityPriceResponse(); }
    if (url.pathname === ELECTRICITY_MONTH_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return getElectricityMonthResponse(); }
    if (url.pathname === HSL_PATH) {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return fetchHslDeparturesResponse({ request, apiKey: env.DIGITRANSIT_API_KEY });
    }
    if (url.pathname === MARKETS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      if (url.searchParams.get('portfolio') === '1') {
        if (snapshotRequest) return getSnapshotPortfolioResponse();
        return servePortfolioWithLastKnownGood(request, getPortfolioResponse);
      }
      return getMarketsResponse({ request });
    }
    if (url.pathname === WIDGET_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return serveWidgetWithLastKnownGood(request, () => url.searchParams.get('v') === '2' ? getWidgetV2Response({ request, env }) : getWidgetResponse({ request }));
    }
    if (url.pathname === WIDGET_V2_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return serveWidgetWithLastKnownGood(request, () => getWidgetV2Response({ request, env })); }
    if (url.pathname === LIIGA_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      const response = snapshotRequest ? await fetchLiigaResponse(SNAPSHOT_LIIGA_UPSTREAM_TIMEOUT_MS) : await getLiigaResponse();
      return publicLiigaResponse(response, 'Liiga data request failed');
    }
    if (url.pathname === LIIGA_SCHEDULE_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return publicLiigaResponse(await getLiigaScheduleResponse(), 'Liiga schedule request failed'); }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
