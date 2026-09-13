import {
  ensureHslLearningSchema,
  type HslLearningDb,
  type HslLearningDbStatement,
} from './hsl-learning';

type HslRawVehicle = {
  distanceMeters: number | null;
  speedKmh: number | null;
  updatedAt: string | null;
  currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
};

type HslRawDeparture = {
  route: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  vehicle: HslRawVehicle | null;
};

type HslRawPayload = {
  fetchedAt: string;
  stop: {
    code: string;
  };
  departures: HslRawDeparture[];
};

const RECORD_PAST_MS = 30 * 60_000;
const RECORD_FUTURE_MS = 45 * 60_000;
const ARRIVAL_STOPPED_RADIUS_METERS = 150;
const ARRIVAL_NEAR_RADIUS_METERS = 55;
const ARRIVAL_NEAR_MAX_SPEED_KMH = 12;
const MAX_VEHICLE_AGE_MS = 90_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const timestampOf = (value: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const isRawPayload = (value: unknown): value is HslRawPayload => {
  if (!isRecord(value) || !isRecord(value.stop) || !Array.isArray(value.departures)) return false;
  if (typeof value.fetchedAt !== 'string' || typeof value.stop.code !== 'string') return false;

  return value.departures.every(
    (departure) =>
      isRecord(departure) &&
      typeof departure.route === 'string' &&
      typeof departure.scheduledAt === 'string' &&
      typeof departure.departureAt === 'string' &&
      typeof departure.delaySeconds === 'number' &&
      typeof departure.realtime === 'boolean'
  );
};

const tripKeyFor = (stopCode: string, departure: Pick<HslRawDeparture, 'route' | 'scheduledAt'>) =>
  `${stopCode}|${departure.route}|${departure.scheduledAt}`;

const recordableDeparture = (departure: HslRawDeparture, observedMs: number) => {
  const scheduledMs = timestampOf(departure.scheduledAt);
  if (scheduledMs === null) return false;
  if (scheduledMs >= observedMs - RECORD_PAST_MS && scheduledMs <= observedMs + RECORD_FUTURE_MS) {
    return true;
  }
  return departure.vehicle?.distanceMeters !== null &&
    departure.vehicle?.distanceMeters !== undefined &&
    departure.vehicle.distanceMeters <= 5_000;
};

const detectArrival = (
  departure: HslRawDeparture,
  fetchedMs: number
): { at: string; method: string } | null => {
  const vehicle = departure.vehicle;
  if (!vehicle || vehicle.distanceMeters === null || !vehicle.updatedAt) return null;
  const vehicleMs = timestampOf(vehicle.updatedAt);
  if (vehicleMs === null || Math.abs(fetchedMs - vehicleMs) > MAX_VEHICLE_AGE_MS) return null;

  if (
    vehicle.currentStatus === 'STOPPED_AT' &&
    vehicle.distanceMeters <= ARRIVAL_STOPPED_RADIUS_METERS
  ) {
    return { at: vehicle.updatedAt, method: 'gps_stopped_at' };
  }

  if (
    vehicle.distanceMeters <= ARRIVAL_NEAR_RADIUS_METERS &&
    vehicle.speedKmh !== null &&
    vehicle.speedKmh <= ARRIVAL_NEAR_MAX_SPEED_KMH
  ) {
    return { at: vehicle.updatedAt, method: 'gps_near_stop' };
  }

  return null;
};

export const recordHslRawLearningSnapshot = async (
  response: Response,
  db?: HslLearningDb
): Promise<void> => {
  if (!db || !response.ok) return;

  const payload: unknown = await response.clone().json();
  if (!isRawPayload(payload)) return;
  const observedMs = timestampOf(payload.fetchedAt);
  if (observedMs === null) return;

  await ensureHslLearningSchema(db);

  const statements: HslLearningDbStatement[] = [];
  const observedMinute = Math.floor(observedMs / 60_000);

  for (const departure of payload.departures) {
    const tripKey = tripKeyFor(payload.stop.code, departure);
    const arrival = detectArrival(departure, observedMs);
    if (arrival) {
      statements.push(
        db.prepare(`
          INSERT OR IGNORE INTO hsl_eta_arrivals (
            trip_key, stop_code, route, scheduled_at, actual_arrival_at, detected_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          tripKey,
          payload.stop.code,
          departure.route,
          departure.scheduledAt,
          arrival.at,
          arrival.method,
          payload.fetchedAt
        )
      );
    }

    if (!recordableDeparture(departure, observedMs)) continue;
    statements.push(
      db.prepare(`
        INSERT INTO hsl_eta_observations (
          trip_key, stop_code, route, scheduled_at, observed_at, observed_minute,
          hsl_predicted_at, hsl_delay_seconds, realtime, distance_meters, speed_kmh,
          vehicle_status, vehicle_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(trip_key, observed_minute) DO UPDATE SET
          observed_at = excluded.observed_at,
          hsl_predicted_at = excluded.hsl_predicted_at,
          hsl_delay_seconds = excluded.hsl_delay_seconds,
          realtime = excluded.realtime,
          distance_meters = excluded.distance_meters,
          speed_kmh = excluded.speed_kmh,
          vehicle_status = excluded.vehicle_status,
          vehicle_updated_at = excluded.vehicle_updated_at
      `).bind(
        tripKey,
        payload.stop.code,
        departure.route,
        departure.scheduledAt,
        payload.fetchedAt,
        observedMinute,
        departure.departureAt,
        departure.delaySeconds,
        departure.realtime ? 1 : 0,
        departure.vehicle?.distanceMeters ?? null,
        departure.vehicle?.speedKmh ?? null,
        departure.vehicle?.currentStatus ?? null,
        departure.vehicle?.updatedAt ?? null
      )
    );
  }

  if (statements.length > 0) await db.batch(statements);
};
