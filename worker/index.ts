import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getWeatherResponse } from '../functions/api/current/weather';
import { onRequestGet as getElectricityMonthResponse } from '../functions/api/current/electricity-month';
import { fetchHslDeparturesResponse } from '../functions/api/current/hsl';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets-stable';
import { onRequestGet as getPortfolioResponse } from '../functions/api/current/portfolio-complete';
import { onRequestGet as getSnapshotPortfolioResponse } from '../functions/api/current/portfolio-snapshot';
import { onRequestGet as getWidgetResponse } from '../functions/api/current/widget';
import { onRequestGet as getWidgetV2Response } from '../functions/api/current/widget-v2';
import { fetchLiigaResponse, onRequestGet as getLiigaResponse } from '../functions/api/current/liiga';
import { onRequestGet as getLiigaScheduleResponse } from '../functions/api/current/liiga-schedule';
import {
  handlePrivateModelRequest,
  isPrivateCurrentModelMachinePath,
  isPrivateModelPath,
  type PrivateModelEnv,
} from './privateModel';
import { handlePrivateAiStatusRequest, isPrivateAiStatusPath } from './privateAiStatus';
import { handlePrivateWorkTestRequest, isPrivateWorkTestPath } from './privateWorkTest';
import { handlePrivateSourceReferenceRequest, isPrivateSourceReferencePath } from './privateSourceReference';
import { handlePrivatePlacementReviewRequest, isPrivatePlacementReviewPath } from './privateReviewPlacement';

type WorkerEnv = PrivateModelEnv & { DIGITRANSIT_API_KEY?: string };
type ResponseCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};
type WorkerExecutionContext = { waitUntil(promise: Promise<unknown>): void };

const ELECTRICITY_PATH = '/api/current/electricity';
const WEATHER_PATH = '/api/current/weather';
const ELECTRICITY_MONTH_PATH = '/api/current/electricity-month';
const HSL_PATH = '/api/current/hsl';
const MARKETS_PATH = '/api/current/markets';
const WIDGET_PATH = '/api/current/widget';
const WIDGET_V2_PATH = '/api/current/widget-v2';
const LIIGA_PATH = '/api/current/liiga';
const LIIGA_SCHEDULE_PATH = '/api/current/liiga-schedule';
const SNAPSHOT_LIIGA_UPSTREAM_TIMEOUT_MS = 4_000;

const WIDGET_LAST_KNOWN_GOOD_TTL_SECONDS = 24 * 60 * 60;
const WIDGET_LIVE_WAIT_MS = 4_000;
const WIDGET_FRESH_CACHE_MS = 90_000;
const MARKETS_FRESH_CACHE_MS = 3 * 60_000;
const PORTFOLIO_FRESH_CACHE_MS = 5 * 60_000;
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

// Serve a recently validated edge response without repeating expensive market
// scrapes. Live-smoke requests always bypass this short circuit.
const recentCachedResponse = async (
  cache: ResponseCache,
  key: Request,
  stampedHeader: string,
  maxAgeMs: number,
  resultHeader: string,
): Promise<Response | null> => {
  try {
    const cached = await cache.match(key);
    if (!cached?.ok) return null;
    const storedAt = Date.parse(cached.headers.get(stampedHeader) ?? '');
    const age = Date.now() - storedAt;
    if (!Number.isFinite(age) || age < 0 || age >= maxAgeMs) return null;
    const headers = new Headers(cached.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set(resultHeader, 'recent');
    return new Response(cached.body, { status: cached.status, headers });
  } catch {
    return null;
  }
};

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

const widgetFallbackResponse = async (
  keys: Request[],
  cache: ResponseCache,
): Promise<Response | null> => {
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
      // Try the other compatible Widget cache alias before giving up.
    }
  }

  return null;
};

const widgetGeneratedAtMs = async (response: Response): Promise<number | null> => {
  try {
    const payload: unknown = await response.clone().json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const generatedAt = (payload as { generatedAt?: unknown }).generatedAt;
    const timestamp = typeof generatedAt === 'string' ? Date.parse(generatedAt) : NaN;
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
};

export const serveWidgetWithLastKnownGood = async (
  request: Request,
  load: () => Promise<Response>,
  cache: ResponseCache | undefined = defaultResponseCache(),
  liveWaitMs = WIDGET_LIVE_WAIT_MS,
  waitUntil?: (promise: Promise<void>) => void,
  preferRecentCache = false,
) => {
  const keys = widgetCacheKeys(request);
  if (preferRecentCache && cache && !new URL(request.url).searchParams.has('live_smoke')) {
    for (const key of keys) {
      const recent = await recentCachedResponse(
        cache, key, 'X-Widget-Cached-At', WIDGET_FRESH_CACHE_MS, 'X-Widget-Cache',
      );
      if (recent) return recent;
    }
  }
  const loadPromise = load();
  if (!cache) return loadPromise;

  // A slow live refresh must not make the widget wait indefinitely when a
  // usable last-known-good payload is already available at the edge.
  void loadPromise.catch(() => undefined);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const response = await Promise.race<Response | null>([
    // A rejected upstream request should still allow a cached fallback.
    loadPromise.catch(() => null),
    new Promise<null>((resolve) => {
      timeout = setTimeout(() => resolve(null), liveWaitMs);
    }),
  ]);
  if (timeout !== undefined) clearTimeout(timeout);

  const cacheHealthyResponse = async (liveResponse: Response) => {
    if (!liveResponse.ok) return;
    // A slower, older v2 response must not replace a newer last-good snapshot.
    const liveGeneratedAt = keys.length === 2 ? await widgetGeneratedAtMs(liveResponse) : null;
    const headers = new Headers(liveResponse.headers);
    headers.set('Cache-Control', `public, max-age=${WIDGET_LAST_KNOWN_GOOD_TTL_SECONDS}`);
    headers.set('X-Widget-Cached-At', new Date().toISOString());
    const cached = new Response(liveResponse.clone().body, {
      status: liveResponse.status,
      statusText: liveResponse.statusText,
      headers,
    });
    for (const key of keys) {
      try {
        if (liveGeneratedAt !== null) {
          const previous = await cache.match(key);
          const previousGeneratedAt = previous ? await widgetGeneratedAtMs(previous) : null;
          if (previousGeneratedAt !== null && previousGeneratedAt > liveGeneratedAt) continue;
        }
        await cache.put(key, cached.clone());
      } catch {
        // Cache is a resilience layer only; one alias failing must not fail a healthy feed.
      }
    }
  };

  if (response === null) {
    const fallback = await widgetFallbackResponse(keys, cache);
    if (fallback) {
      // A late successful live response must refresh the cache even after fallback.
      waitUntil?.(loadPromise.then(cacheHealthyResponse).catch(() => undefined));
      return fallback;
    }
    const lateResponse = await loadPromise;
    await cacheHealthyResponse(lateResponse);
    return lateResponse;
  }

  if (response.ok) {
    await cacheHealthyResponse(response);
    return response;
  }

  if (response.status !== 503) return response;

  return (await widgetFallbackResponse(keys, cache)) ?? response;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const portfolioCacheKey = (request: Request, variant = 'last-known-good-v1') => {
  const url = new URL(request.url);
  url.search = '';
  url.searchParams.set('portfolio', '1');
  url.searchParams.set('cache', variant);
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
  preferRecentCache = false,
) => {
  const key = portfolioCacheKey(request);
  const partialKey = portfolioCacheKey(request, 'partial-last-known-good-v1');
  const isSmoke = new URL(request.url).searchParams.has('live_smoke');
  if (cache && preferRecentCache && !isSmoke) {
    for (const candidate of [key, partialKey]) {
      const recent = await recentCachedResponse(
        cache, candidate, 'X-Portfolio-Cached-At',
        PORTFOLIO_FRESH_CACHE_MS, 'X-Portfolio-Cache',
      );
      if (recent) return recent;
    }
  }
  const response = await load();
  if (!cache) return response;

  const liveBody = response.ok ? await parsePortfolioBody(response) : null;
  const complete = Boolean(liveBody && isCompletePortfolioBody(liveBody));
  // Preserve a truthful 16/19 (or similar) result without claiming 19/19.
  // A separately keyed partial snapshot reduces costly repeated refreshes.
  const partialUsable = Boolean(
    liveBody && liveBody.expected === PORTFOLIO_HOLDING_IDS.length &&
    Array.isArray(liveBody.items) && liveBody.items.length >= 12 &&
    new Set(liveBody.items.map((entry: unknown) => asRecord(entry)?.id)).size === liveBody.items.length &&
    liveBody.items.every((entry: unknown) =>
      typeof asRecord(entry)?.id === 'string' &&
      (PORTFOLIO_HOLDING_IDS as readonly string[]).includes(asRecord(entry)?.id as string)),
  );
  if (!complete && partialUsable && liveBody) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=1800');
    headers.set('X-Portfolio-Cached-At', new Date().toISOString());
    try {
      await cache.put(partialKey, new Response(JSON.stringify(liveBody), { status: 200, headers }));
    } catch {
      // A cache write failure does not hide the live response.
    }
  }

  if (complete && liveBody) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${PORTFOLIO_LAST_KNOWN_GOOD_TTL_SECONDS}`);
    headers.set('X-Portfolio-Cached-At', new Date().toISOString());
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


type CachedCurrentFeed = 'weather' | 'electricity' | 'markets';
const CURRENT_FEED_CACHE_SECONDS: Record<CachedCurrentFeed, number> = {
  weather: 90 * 60,
  electricity: 30 * 60 * 60,
  markets: 3 * 24 * 60 * 60,
};

const isUsableCurrentFeed = (kind: CachedCurrentFeed, body: Record<string, unknown>) => {
  if (kind === 'weather') {
    const current = asRecord(body.current);
    const hourly = asRecord(body.hourly);
    const daily = asRecord(body.daily);
    return (
      isFinitePortfolioValue(current?.temperature_2m) &&
      typeof current?.time === 'string' &&
      Array.isArray(hourly?.time) &&
      hourly.time.length > 0 &&
      Array.isArray(daily?.time) &&
      daily.time.length > 0
    );
  }
  if (kind === 'electricity') {
    if (!Array.isArray(body.prices)) return false;
    // Published spot prices are fixed for their interval. Never show an old
    // day as the current price if its intervals no longer cover now.
    const now = Date.now();
    return body.prices.some((candidate) => {
      const item = asRecord(candidate);
      const start = typeof item?.startDate === 'string' ? Date.parse(item.startDate) : NaN;
      const end = typeof item?.endDate === 'string' ? Date.parse(item.endDate) : NaN;
      return isFinitePortfolioValue(item?.price) && start <= now && now < end;
    });
  }
  if (!Array.isArray(body.items) || !Array.isArray(body.series)) return false;
  return (
    body.items.some((candidate) => {
      const item = asRecord(candidate);
      return item?.id === 'euribor-3m' && isFinitePortfolioValue(item.value);
    }) &&
    body.series.some((candidate) => {
      const series = asRecord(candidate);
      return series?.id === 'euribor-3m' && Array.isArray(series.points) && series.points.length > 0;
    })
  );
};

export const serveCurrentFeedWithLastKnownGood = async (
  request: Request,
  kind: CachedCurrentFeed,
  load: () => Promise<Response>,
  cache: ResponseCache | undefined = defaultResponseCache(),
  preferRecentCache = false,
) => {
  const keyUrl = new URL(request.url);
  keyUrl.search = '';
  keyUrl.searchParams.set('cache', 'last-known-good-v1');
  const key = new Request(keyUrl.toString());
  if (kind === 'markets' && preferRecentCache && cache &&
      !new URL(request.url).searchParams.has('live_smoke')) {
    const recent = await recentCachedResponse(
      cache, key, 'X-Current-Cached-At', MARKETS_FRESH_CACHE_MS, 'X-Current-Cache',
    );
    if (recent) return recent;
  }
  let live: Response;
  try {
    live = await load();
  } catch {
    live = Response.json({ error: 'upstream_unavailable' }, { status: 502 });
  }
  if (!cache) return live;

  const liveBody = live.ok ? await parsePortfolioBody(live) : null;
  if (liveBody && isUsableCurrentFeed(kind, liveBody)) {
    const headers = new Headers(live.headers);
    headers.set('Cache-Control', `public, max-age=${CURRENT_FEED_CACHE_SECONDS[kind]}`);
    headers.set('X-Current-Cached-At', new Date().toISOString());
    try {
      await cache.put(key, new Response(JSON.stringify(liveBody), { status: 200, headers }));
    } catch {
      // An unavailable edge cache must not break otherwise healthy feeds.
    }
    return live;
  }

  // Production smoke checks must see the real upstream failure, not cached data.
  if (new URL(request.url).searchParams.has('live_smoke')) return live;

  try {
    const cached = await cache.match(key);
    if (!cached) return live;
    const body = await parsePortfolioBody(cached);
    if (!body || !isUsableCurrentFeed(kind, body)) return live;
    const headers = new Headers(cached.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Current-Fallback', 'last-known-good');
    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch {
    return live;
  }
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
  async fetch(request: Request, env: WorkerEnv, ctx?: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const snapshotRequest = isSnapshotRequest(request);
    if (isPrivateAiStatusPath(url.pathname)) {
      return handlePrivateAiStatusRequest(request, env);
    }
    if (isPrivateSourceReferencePath(url.pathname)) {
      return handlePrivateSourceReferenceRequest(request, env);
    }
    if (isPrivateCurrentModelMachinePath(url.pathname)) {
      return handlePrivateModelRequest(request, env);
    }
    if (isPrivateWorkTestPath(url.pathname)) {
      return handlePrivateWorkTestRequest(request, env);
    }
    if (isPrivatePlacementReviewPath(url.pathname)) {
      return handlePrivatePlacementReviewRequest(request, env);
    }
    if (isPrivateModelPath(url.pathname)) return handlePrivateModelRequest(request, env);
    if (url.pathname === ELECTRICITY_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return serveCurrentFeedWithLastKnownGood(request, 'electricity', getElectricityPriceResponse); }
    if (url.pathname === WEATHER_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return serveCurrentFeedWithLastKnownGood(request, 'weather', getWeatherResponse); }
    if (url.pathname === ELECTRICITY_MONTH_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return getElectricityMonthResponse(); }
    if (url.pathname === HSL_PATH) {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return fetchHslDeparturesResponse({ request, apiKey: env.DIGITRANSIT_API_KEY });
    }
    if (url.pathname === MARKETS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      if (url.searchParams.get('portfolio') === '1') {
        if (snapshotRequest) return getSnapshotPortfolioResponse();
        return servePortfolioWithLastKnownGood(request, getPortfolioResponse, undefined, true);
      }
      return serveCurrentFeedWithLastKnownGood(request, 'markets', () => getMarketsResponse({ request }), undefined, true);
    }
    if (url.pathname === WIDGET_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return serveWidgetWithLastKnownGood(request, () => url.searchParams.get('v') === '2' ? getWidgetV2Response({ request, env }) : getWidgetResponse({ request }), undefined, WIDGET_LIVE_WAIT_MS, ctx?.waitUntil.bind(ctx), true);
    }
    if (url.pathname === WIDGET_V2_PATH) { if (request.method !== 'GET') return methodNotAllowed(); return serveWidgetWithLastKnownGood(request, () => getWidgetV2Response({ request, env }), undefined, WIDGET_LIVE_WAIT_MS, ctx?.waitUntil.bind(ctx)); }
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
