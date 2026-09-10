type HslRequestBody = {
  stopCode?: unknown;
  routes?: unknown;
};

type HslDeparture = {
  route: string;
  headsign: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  realtimeState: string;
};

type HslContext = {
  request: Request;
  env: {
    DIGITRANSIT_API_KEY?: string;
  };
};

type FetchHslOptions = {
  request: Request;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

const DIGITRANSIT_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_ROUTE_FILTERS = 8;
const MAX_DEPARTURES = 24;
const STOP_CODE_PATTERN = /^[A-Z]{1,2}\d{3,5}$/;
const ROUTE_PATTERN = /^[0-9A-Z]{1,8}$/;

const DEPARTURES_QUERY = `
  query CurrentHslDepartures($stopQuery: String!, $numberOfDepartures: Int!) {
    stops(name: $stopQuery) {
      name
      code
      stoptimesWithoutPatterns(
        numberOfDepartures: $numberOfDepartures
        omitCanceled: true
        omitNonPickups: true
      ) {
        serviceDay
        scheduledDeparture
        realtimeDeparture
        departureDelay
        realtime
        realtimeState
        headsign
        trip {
          route {
            shortName
          }
        }
      }
    }
  }
`;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeStopCode = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return STOP_CODE_PATTERN.test(normalized) ? normalized : null;
};

const normalizeRoutes = (value: unknown): string[] | null => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ROUTE_FILTERS) return null;

  const routes = value.map((route) =>
    typeof route === 'string' ? route.trim().toUpperCase() : ''
  );

  if (routes.some((route) => !ROUTE_PATTERN.test(route))) return null;
  return [...new Set(routes)];
};

const finiteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const toIso = (serviceDay: number, secondsAfterMidnight: number) => {
  const value = new Date((serviceDay + secondsAfterMidnight) * 1000);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
};

const normalizeDeparture = (
  value: unknown,
  routeFilters: Set<string>
): HslDeparture | null => {
  if (!isRecord(value)) return null;

  const trip = value.trip;
  if (!isRecord(trip) || !isRecord(trip.route)) return null;

  const route = typeof trip.route.shortName === 'string' ? trip.route.shortName.trim() : '';
  if (!route || (routeFilters.size > 0 && !routeFilters.has(route.toUpperCase()))) return null;

  const serviceDay = finiteNumber(value.serviceDay);
  const scheduledDeparture = finiteNumber(value.scheduledDeparture);
  if (serviceDay === null || scheduledDeparture === null) return null;

  const realtime = value.realtime === true;
  const realtimeDeparture = finiteNumber(value.realtimeDeparture);
  const effectiveDeparture = realtime && realtimeDeparture !== null
    ? realtimeDeparture
    : scheduledDeparture;

  const scheduledAt = toIso(serviceDay, scheduledDeparture);
  const departureAt = toIso(serviceDay, effectiveDeparture);
  if (!scheduledAt || !departureAt) return null;

  const reportedDelay = finiteNumber(value.departureDelay);
  const delaySeconds = reportedDelay ?? Math.round(effectiveDeparture - scheduledDeparture);

  return {
    route,
    headsign: typeof value.headsign === 'string' ? value.headsign.trim() : '',
    scheduledAt,
    departureAt,
    delaySeconds,
    realtime,
    realtimeState:
      typeof value.realtimeState === 'string'
        ? value.realtimeState
        : realtime
          ? 'UPDATED'
          : 'SCHEDULED',
  };
};

export const fetchHslDeparturesResponse = async ({
  request,
  apiKey,
  fetchImpl = fetch,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
}: FetchHslOptions) => {
  if (!apiKey) return jsonResponse({ error: 'missing_configuration' }, 503);

  let body: HslRequestBody;
  try {
    const candidate: unknown = await request.json();
    if (!isRecord(candidate)) return jsonResponse({ error: 'invalid_request' }, 400);
    body = candidate;
  } catch {
    return jsonResponse({ error: 'invalid_request' }, 400);
  }

  const stopCode = normalizeStopCode(body.stopCode);
  if (!stopCode) return jsonResponse({ error: 'invalid_stop_code' }, 400);

  const routes = normalizeRoutes(body.routes);
  if (!routes) return jsonResponse({ error: 'invalid_routes' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstreamResponse = await fetchImpl(DIGITRANSIT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'digitransit-subscription-key': apiKey,
      },
      body: JSON.stringify({
        query: DEPARTURES_QUERY,
        variables: {
          stopQuery: stopCode,
          numberOfDepartures: 40,
        },
      }),
      signal: controller.signal,
    });

    if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
      return jsonResponse({ error: 'upstream_auth_failed' }, 502);
    }

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: 'upstream_unavailable' }, 502);
    }

    const payload: unknown = await upstreamResponse.json();
    if (!isRecord(payload)) return jsonResponse({ error: 'invalid_upstream_data' }, 502);
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return jsonResponse({ error: 'upstream_query_failed' }, 502);
    }

    const data = payload.data;
    if (!isRecord(data) || !Array.isArray(data.stops)) {
      return jsonResponse({ error: 'invalid_upstream_data' }, 502);
    }

    const stop = data.stops.find(
      (candidate) =>
        isRecord(candidate) &&
        typeof candidate.code === 'string' &&
        candidate.code.trim().toUpperCase() === stopCode
    );

    if (!isRecord(stop)) return jsonResponse({ error: 'stop_not_found' }, 404);

    const stoptimes = stop.stoptimesWithoutPatterns;
    if (!Array.isArray(stoptimes)) {
      return jsonResponse({ error: 'invalid_upstream_data' }, 502);
    }

    const routeFilters = new Set(routes);
    const departures = stoptimes
      .map((entry) => normalizeDeparture(entry, routeFilters))
      .filter((entry): entry is HslDeparture => Boolean(entry))
      .sort((a, b) => a.departureAt.localeCompare(b.departureAt))
      .slice(0, MAX_DEPARTURES);

    return jsonResponse(
      {
        source: 'HSL Digitransit',
        fetchedAt: new Date().toISOString(),
        stop: {
          code: stopCode,
          name: typeof stop.name === 'string' ? stop.name : stopCode,
        },
        routes,
        departures,
      },
      200
    );
  } catch {
    return jsonResponse({ error: 'upstream_unavailable' }, 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestPost = ({ request, env }: HslContext) =>
  fetchHslDeparturesResponse({
    request,
    apiKey: env.DIGITRANSIT_API_KEY,
  });
