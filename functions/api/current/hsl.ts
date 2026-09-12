import {
  parseHslVehiclePositions,
  type HslVehiclePosition,
} from './hsl-vehicle-positions';

type HslRequestBody = {
  stopCode?: unknown;
  stopName?: unknown;
  routes?: unknown;
};

type HslVehicle = {
  id: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  bearing: number | null;
  speedKmh: number | null;
  updatedAt: string | null;
  currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
};

type HslDeparture = {
  route: string;
  headsign: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  realtimeState: string;
  vehicle: HslVehicle | null;
};

type NormalizedDeparture = Omit<HslDeparture, 'vehicle'> & {
  journeyKey: string | null;
  targetStopPosition: number | null;
  tripStopIds: string[];
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
const HSL_VEHICLE_POSITIONS_URL = 'https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl';
const UPSTREAM_TIMEOUT_MS = 8_000;
const HISTORY_LOOKBACK_SECONDS = 2 * 60 * 60;
const MAX_ROUTE_FILTERS = 8;
const MAX_DEPARTURES = 40;
const MAX_STOP_NAME_LENGTH = 80;
const STOP_CODE_PATTERN = /^[A-Z]{1,2}\d{3,5}$/;
const ROUTE_PATTERN = /^[0-9A-Z]{1,8}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';

const DEPARTURES_QUERY = `
  query CurrentHslDepartures(
    $stopQuery: String!
    $startTime: Long!
    $numberOfDepartures: Int!
  ) {
    stops(name: $stopQuery) {
      gtfsId
      name
      code
      lat
      lon
      stoptimesWithoutPatterns(
        startTime: $startTime
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
        stopPosition
        trip {
          directionId
          route {
            gtfsId
            shortName
          }
          stops {
            gtfsId
          }
          stoptimes {
            scheduledDeparture
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

const normalizeStopName = (value: unknown) => {
  if (value === undefined) return '';
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > MAX_STOP_NAME_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    return null;
  }

  return normalized;
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

const stripFeedPrefix = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim();
  const separator = normalized.indexOf(':');
  return separator >= 0 ? normalized.slice(separator + 1) : normalized;
};

const normalizeDirectionId = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^[01]$/.test(value.trim())) return Number(value.trim());
  return null;
};

const formatServiceDate = (serviceDay: number) => {
  const date = new Date(serviceDay * 1000);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HELSINKI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}${month}${day}` : null;
};

const formatGtfsTime = (secondsAfterMidnight: number) => {
  if (!Number.isFinite(secondsAfterMidnight) || secondsAfterMidnight < 0) return null;
  const totalSeconds = Math.round(secondsAfterMidnight);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const normalizeGtfsTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return value.trim();
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? '0');
  if (minutes > 59 || seconds > 59) return value.trim();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const journeyKey = (
  routeId: string,
  startDate: string,
  startTime: string,
  directionId: number | null
) => {
  if (!routeId || !startDate || !startTime || directionId === null) return null;
  return `${routeId}|${startDate}|${normalizeGtfsTime(startTime)}|${directionId}`;
};

const normalizeDeparture = (
  value: unknown,
  routeFilters: Set<string>
): NormalizedDeparture | null => {
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

  const routeId = stripFeedPrefix(trip.route.gtfsId);
  const directionId = normalizeDirectionId(trip.directionId);
  const tripStoptimes = Array.isArray(trip.stoptimes) ? trip.stoptimes : [];
  const firstScheduledDeparture = tripStoptimes
    .map((stoptime) => isRecord(stoptime) ? finiteNumber(stoptime.scheduledDeparture) : null)
    .find((departure): departure is number => departure !== null);
  const startDate = formatServiceDate(serviceDay);
  const startTime = firstScheduledDeparture === undefined
    ? null
    : formatGtfsTime(firstScheduledDeparture);

  const tripStopIds = Array.isArray(trip.stops)
    ? trip.stops
        .map((stop) => isRecord(stop) ? stripFeedPrefix(stop.gtfsId) : '')
        .filter(Boolean)
    : [];

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
    journeyKey:
      routeId && startDate && startTime
        ? journeyKey(routeId, startDate, startTime, directionId)
        : null,
    targetStopPosition: finiteNumber(value.stopPosition),
    tripStopIds,
  };
};

const haversineDistanceMeters = (
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
) => {
  const radians = (degrees: number) => degrees * (Math.PI / 180);
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = radians(toLat - fromLat);
  const longitudeDelta = radians(toLon - fromLon);
  const fromLatitude = radians(fromLat);
  const toLatitude = radians(toLat);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fetchVehiclePositions = async (
  fetchImpl: typeof fetch,
  signal: AbortSignal
): Promise<HslVehiclePosition[]> => {
  try {
    const response = await fetchImpl(HSL_VEHICLE_POSITIONS_URL, {
      method: 'GET',
      headers: { Accept: 'application/x-protobuf' },
      signal,
    });
    if (!response.ok) return [];
    return parseHslVehiclePositions(await response.arrayBuffer());
  } catch {
    return [];
  }
};

const vehicleMapByJourney = (vehicles: HslVehiclePosition[]) => {
  const byJourney = new Map<string, HslVehiclePosition[]>();

  for (const vehicle of vehicles) {
    const key = journeyKey(
      stripFeedPrefix(vehicle.routeId),
      vehicle.startDate,
      vehicle.startTime,
      vehicle.directionId
    );
    if (!key) continue;
    const current = byJourney.get(key) ?? [];
    current.push(vehicle);
    byJourney.set(key, current);
  }

  return byJourney;
};

const chooseVehicle = (
  departure: NormalizedDeparture,
  candidates: HslVehiclePosition[],
  stopLat: number | null,
  stopLon: number | null
) => {
  const targetPosition = departure.targetStopPosition;
  const eligible = candidates.filter((vehicle) => {
    if (!vehicle.stopId || targetPosition === null || departure.tripStopIds.length === 0) return true;
    const currentStopPosition = departure.tripStopIds.indexOf(stripFeedPrefix(vehicle.stopId));
    return currentStopPosition < 0 || currentStopPosition <= targetPosition;
  });

  const source = eligible.length > 0 ? eligible : candidates;
  return source
    .map((vehicle) => ({
      vehicle,
      distance:
        stopLat !== null && stopLon !== null
          ? haversineDistanceMeters(vehicle.latitude, vehicle.longitude, stopLat, stopLon)
          : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return (b.vehicle.timestamp ?? 0) - (a.vehicle.timestamp ?? 0);
    })[0]?.vehicle ?? null;
};

const publicVehicle = (
  vehicle: HslVehiclePosition | null,
  stopLat: number | null,
  stopLon: number | null
): HslVehicle | null => {
  if (!vehicle) return null;
  const distanceMeters = stopLat !== null && stopLon !== null
    ? Math.round(haversineDistanceMeters(vehicle.latitude, vehicle.longitude, stopLat, stopLon))
    : null;
  const updatedAt = vehicle.timestamp === null
    ? null
    : new Date(vehicle.timestamp * 1000).toISOString();

  return {
    id: vehicle.vehicleId,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    distanceMeters,
    bearing: vehicle.bearing,
    speedKmh:
      vehicle.speedMetersPerSecond === null
        ? null
        : Math.round(vehicle.speedMetersPerSecond * 36) / 10,
    updatedAt,
    currentStatus: vehicle.currentStatus,
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

  const stopName = normalizeStopName(body.stopName);
  if (stopName === null) return jsonResponse({ error: 'invalid_stop_name' }, 400);

  const routes = normalizeRoutes(body.routes);
  if (!routes) return jsonResponse({ error: 'invalid_routes' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startTime = Math.floor(Date.now() / 1000) - HISTORY_LOOKBACK_SECONDS;
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
          stopQuery: stopName || stopCode,
          startTime,
          numberOfDepartures: MAX_DEPARTURES,
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
    const normalizedDepartures = stoptimes
      .map((entry) => normalizeDeparture(entry, routeFilters))
      .filter((entry): entry is NormalizedDeparture => Boolean(entry))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, MAX_DEPARTURES);

    const stopLat = finiteNumber(stop.lat);
    const stopLon = finiteNumber(stop.lon);
    const vehiclesByJourney = vehicleMapByJourney(
      await fetchVehiclePositions(fetchImpl, controller.signal)
    );

    const departures: HslDeparture[] = normalizedDepartures.map((departure) => {
      const candidates = departure.journeyKey
        ? vehiclesByJourney.get(departure.journeyKey) ?? []
        : [];
      const vehicle = chooseVehicle(departure, candidates, stopLat, stopLon);
      const {
        journeyKey: _journeyKey,
        targetStopPosition: _targetStopPosition,
        tripStopIds: _tripStopIds,
        ...publicDeparture
      } = departure;

      return {
        ...publicDeparture,
        vehicle: publicVehicle(vehicle, stopLat, stopLon),
      };
    });

    return jsonResponse(
      {
        source: 'HSL Digitransit',
        vehicleSource: 'HSL GTFS-RT',
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
