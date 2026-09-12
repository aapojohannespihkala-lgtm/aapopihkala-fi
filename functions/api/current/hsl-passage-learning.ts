import type { HslLearningDb } from './hsl-learning';

type HslPassageVehicle = {
  distanceMeters: number | null;
  updatedAt: string | null;
};

type HslPassageDeparture = {
  route: string;
  scheduledAt: string;
  departureAt: string;
  vehicle: HslPassageVehicle | null;
};

type HslPassagePayload = {
  fetchedAt: string;
  stop: {
    code: string;
  };
  departures: HslPassageDeparture[];
};

export type HslPassageObservation = {
  observed_at: string;
  vehicle_updated_at: string | null;
  distance_meters: number | null;
};

export type HslPassageInference = {
  actualArrivalAt: string;
  closestDistanceMeters: number;
  latestDistanceMeters: number;
};

const MAX_HISTORY_ROWS = 24;
const MAX_CLOSEST_DISTANCE_METERS = 500;
const MIN_DISTANCE_RISE_METERS = 500;
const MIN_PASSAGE_ELAPSED_MS = 20_000;
const MAX_PASSAGE_ELAPSED_MS = 15 * 60_000;
const MAX_HSL_FUTURE_LEAD_MS = 2 * 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const timestampOf = (value: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const isPassagePayload = (value: unknown): value is HslPassagePayload => {
  if (!isRecord(value) || !isRecord(value.stop) || !Array.isArray(value.departures)) return false;
  if (typeof value.fetchedAt !== 'string' || typeof value.stop.code !== 'string') return false;

  return value.departures.every(
    (departure) =>
      isRecord(departure) &&
      typeof departure.route === 'string' &&
      typeof departure.scheduledAt === 'string' &&
      typeof departure.departureAt === 'string'
  );
};

const tripKeyFor = (stopCode: string, departure: Pick<HslPassageDeparture, 'route' | 'scheduledAt'>) =>
  `${stopCode}|${departure.route}|${departure.scheduledAt}`;

export const inferHslPassageFromHistory = (
  observations: HslPassageObservation[],
  hslPredictedAt: string
): HslPassageInference | null => {
  const normalized = observations
    .map((observation) => {
      const observedMs = timestampOf(observation.vehicle_updated_at ?? observation.observed_at);
      const distanceMeters = observation.distance_meters;
      if (observedMs === null || distanceMeters === null || !Number.isFinite(distanceMeters)) return null;
      return {
        observedMs,
        observedAt: new Date(observedMs).toISOString(),
        distanceMeters,
      };
    })
    .filter(
      (
        observation
      ): observation is { observedMs: number; observedAt: string; distanceMeters: number } =>
        observation !== null
    )
    .sort((a, b) => a.observedMs - b.observedMs);

  if (normalized.length < 2) return null;

  const latest = normalized[normalized.length - 1];
  const hslMs = timestampOf(hslPredictedAt);
  if (hslMs !== null && hslMs > latest.observedMs + MAX_HSL_FUTURE_LEAD_MS) return null;

  let closestIndex = 0;
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].distanceMeters < normalized[closestIndex].distanceMeters) {
      closestIndex = index;
    }
  }

  if (closestIndex >= normalized.length - 1) return null;

  const closest = normalized[closestIndex];
  const elapsedMs = latest.observedMs - closest.observedMs;
  if (elapsedMs < MIN_PASSAGE_ELAPSED_MS || elapsedMs > MAX_PASSAGE_ELAPSED_MS) return null;
  if (closest.distanceMeters > MAX_CLOSEST_DISTANCE_METERS) return null;
  if (latest.distanceMeters - closest.distanceMeters < MIN_DISTANCE_RISE_METERS) return null;

  const postClosest = normalized.slice(closestIndex + 1);
  const hasClearDeparture = postClosest.some(
    (observation) => observation.distanceMeters >= closest.distanceMeters + MIN_DISTANCE_RISE_METERS
  );
  if (!hasClearDeparture) return null;

  return {
    actualArrivalAt: closest.observedAt,
    closestDistanceMeters: Math.round(closest.distanceMeters),
    latestDistanceMeters: Math.round(latest.distanceMeters),
  };
};

const loadTripHistory = async (db: HslLearningDb, tripKey: string) => {
  const result = await db.prepare(`
    SELECT observed_at, vehicle_updated_at, distance_meters
    FROM hsl_eta_observations
    WHERE trip_key = ?
      AND distance_meters IS NOT NULL
    ORDER BY observed_at DESC
    LIMIT ${MAX_HISTORY_ROWS}
  `).bind(tripKey).all<HslPassageObservation>();
  return result.results ?? [];
};

export const recordHslDistancePassages = async (
  response: Response,
  db?: HslLearningDb
): Promise<void> => {
  if (!db || !response.ok) return;

  try {
    const payload: unknown = await response.clone().json();
    if (!isPassagePayload(payload)) return;

    for (const departure of payload.departures) {
      if (!departure.vehicle || departure.vehicle.distanceMeters === null) continue;

      const tripKey = tripKeyFor(payload.stop.code, departure);
      const existing = await db.prepare(
        'SELECT trip_key FROM hsl_eta_arrivals WHERE trip_key = ? LIMIT 1'
      ).bind(tripKey).first<{ trip_key: string }>();
      if (existing) continue;

      const history = await loadTripHistory(db, tripKey);
      const inference = inferHslPassageFromHistory(history, departure.departureAt);
      if (!inference) continue;

      await db.prepare(`
        INSERT OR IGNORE INTO hsl_eta_arrivals (
          trip_key, stop_code, route, scheduled_at, actual_arrival_at, detected_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tripKey,
        payload.stop.code,
        departure.route,
        departure.scheduledAt,
        inference.actualArrivalAt,
        'gps_distance_turn',
        payload.fetchedAt
      ).run();
    }
  } catch (error) {
    console.error('HSL passage inference failed', error);
  }
};
