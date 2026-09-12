export type HslLearningDbStatement = {
  bind(...values: unknown[]): HslLearningDbStatement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

export type HslLearningDb = {
  prepare(query: string): HslLearningDbStatement;
  batch(statements: HslLearningDbStatement[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
};

type HslLearningVehicle = {
  id: string;
  distanceMeters: number | null;
  speedKmh: number | null;
  updatedAt: string | null;
  currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
};

type HslLearningDeparture = {
  route: string;
  headsign: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  realtimeState: string;
  vehicle: HslLearningVehicle | null;
  model?: HslLearningPrediction | null;
};

type HslLearningPayload = {
  source: string;
  vehicleSource?: string;
  fetchedAt: string;
  stop: {
    code: string;
    name: string;
  };
  routes: string[];
  departures: HslLearningDeparture[];
  learning?: HslLearningSummary;
};

export type HslLearningTrainingRow = {
  trip_key: string;
  route: string;
  observed_at: string;
  hsl_predicted_at: string;
  distance_meters: number | null;
  actual_arrival_at: string;
  model_predicted_at: string | null;
};

export type HslLearningPredictionInput = {
  tripKey: string;
  route: string;
  observedAt: string;
  hslPredictedAt: string;
  distanceMeters: number | null;
};

export type HslLearningPrediction = {
  predictedAt: string;
  adjustmentSeconds: number;
  confidenceSeconds: number | null;
  sampleSize: number;
  method: 'hsl-residual' | 'gps-history' | 'hsl-residual+gps-history';
};

export type HslLearningSummary = {
  enabled: true;
  version: string;
  observations: number;
  arrivals: number;
  scoredTrips: number;
  modelScoredTrips: number;
  hslMaeSeconds: number | null;
  modelMaeSeconds: number | null;
  modelWins: number;
  lastArrivalAt: string | null;
};

const MODEL_VERSION = 'median-residual-v1';
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const MAX_TRAINING_ROWS = 6_000;
const MAX_REASONABLE_ERROR_SECONDS = 30 * 60;
const MAX_REASONABLE_REMAINING_SECONDS = 60 * 60;
const RECORD_PAST_MS = 30 * 60_000;
const RECORD_FUTURE_MS = 45 * 60_000;
const ARRIVAL_STOPPED_RADIUS_METERS = 150;
const ARRIVAL_NEAR_RADIUS_METERS = 55;
const ARRIVAL_NEAR_MAX_SPEED_KMH = 12;
const MAX_VEHICLE_AGE_MS = 90_000;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS hsl_eta_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_key TEXT NOT NULL,
  stop_code TEXT NOT NULL,
  route TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  observed_minute INTEGER NOT NULL,
  hsl_predicted_at TEXT NOT NULL,
  hsl_delay_seconds INTEGER NOT NULL,
  realtime INTEGER NOT NULL,
  distance_meters INTEGER,
  speed_kmh REAL,
  vehicle_status TEXT,
  vehicle_updated_at TEXT,
  model_predicted_at TEXT,
  model_sample_size INTEGER,
  model_adjustment_seconds INTEGER,
  model_confidence_seconds INTEGER,
  UNIQUE(trip_key, observed_minute)
);
CREATE INDEX IF NOT EXISTS hsl_eta_observations_trip_idx
  ON hsl_eta_observations(trip_key, observed_at);
CREATE INDEX IF NOT EXISTS hsl_eta_observations_route_idx
  ON hsl_eta_observations(route, observed_at);

CREATE TABLE IF NOT EXISTS hsl_eta_arrivals (
  trip_key TEXT PRIMARY KEY,
  stop_code TEXT NOT NULL,
  route TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  actual_arrival_at TEXT NOT NULL,
  detected_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hsl_eta_arrivals_route_idx
  ON hsl_eta_arrivals(route, actual_arrival_at);
`;

const schemaReady = new WeakMap<object, Promise<void>>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const finiteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const timestampOf = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const isoOf = (value: number) => new Date(value).toISOString();

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
};

const mean = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

const medianAbsoluteDeviation = (values: number[], center: number) =>
  median(values.map((value) => Math.abs(value - center)));

const tripKeyFor = (stopCode: string, departure: Pick<HslLearningDeparture, 'route' | 'scheduledAt'>) =>
  `${stopCode}|${departure.route}|${departure.scheduledAt}`;

const periodBucket = (timestamp: number) => {
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HELSINKI_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const dayType = weekday === 'Sat' || weekday === 'Sun' ? 'weekend' : 'weekday';

  if (hour >= 6 && hour < 10) return `${dayType}-morning`;
  if (hour >= 10 && hour < 15) return `${dayType}-midday`;
  if (hour >= 15 && hour < 19) return `${dayType}-afternoon`;
  if (hour >= 19 && hour < 24) return `${dayType}-evening`;
  return `${dayType}-night`;
};

const horizonBucket = (seconds: number) => {
  if (seconds < 0) return 'past';
  if (seconds <= 120) return '0-2';
  if (seconds <= 300) return '2-5';
  if (seconds <= 600) return '5-10';
  if (seconds <= 1_200) return '10-20';
  return '20+';
};

const distanceBucket = (meters: number | null) => {
  if (meters === null) return 'none';
  if (meters <= 400) return '0-400';
  if (meters <= 800) return '400-800';
  if (meters <= 1_500) return '800-1500';
  if (meters <= 2_500) return '1500-2500';
  if (meters <= 4_000) return '2500-4000';
  return '4000+';
};

type NormalizedTrainingRow = HslLearningTrainingRow & {
  observedMs: number;
  hslMs: number;
  actualMs: number;
  horizonSeconds: number;
  residualSeconds: number;
  actualRemainingSeconds: number;
  period: string;
  horizon: string;
  distance: string;
};

const normalizeTrainingRow = (row: HslLearningTrainingRow): NormalizedTrainingRow | null => {
  const observedMs = timestampOf(row.observed_at);
  const hslMs = timestampOf(row.hsl_predicted_at);
  const actualMs = timestampOf(row.actual_arrival_at);
  if (observedMs === null || hslMs === null || actualMs === null) return null;

  const horizonSeconds = (hslMs - observedMs) / 1000;
  const residualSeconds = (actualMs - hslMs) / 1000;
  const actualRemainingSeconds = (actualMs - observedMs) / 1000;
  if (
    Math.abs(residualSeconds) > MAX_REASONABLE_ERROR_SECONDS ||
    actualRemainingSeconds < 0 ||
    actualRemainingSeconds > MAX_REASONABLE_REMAINING_SECONDS
  ) {
    return null;
  }

  return {
    ...row,
    observedMs,
    hslMs,
    actualMs,
    horizonSeconds,
    residualSeconds,
    actualRemainingSeconds,
    period: periodBucket(observedMs),
    horizon: horizonBucket(horizonSeconds),
    distance: distanceBucket(row.distance_meters),
  };
};

const onePerTrip = (
  rows: NormalizedTrainingRow[],
  input: HslLearningPredictionInput,
  currentHorizonSeconds: number
) => {
  const currentDistance = input.distanceMeters;
  const byTrip = new Map<string, { row: NormalizedTrainingRow; score: number }>();

  for (const row of rows) {
    const horizonScore = Math.abs(row.horizonSeconds - currentHorizonSeconds) / 60;
    const distanceScore =
      currentDistance === null || row.distance_meters === null
        ? 0
        : Math.abs(row.distance_meters - currentDistance) / 500;
    const existing = byTrip.get(row.trip_key);
    const score = horizonScore + distanceScore;
    if (!existing || score < existing.score) byTrip.set(row.trip_key, { row, score });
  }

  return [...byTrip.values()].map(({ row }) => row);
};

const selectResidualRows = (
  rows: NormalizedTrainingRow[],
  input: HslLearningPredictionInput,
  currentObservedMs: number,
  currentHorizonSeconds: number
) => {
  const currentPeriod = periodBucket(currentObservedMs);
  const currentHorizon = horizonBucket(currentHorizonSeconds);
  const currentDistance = distanceBucket(input.distanceMeters);
  const routeRows = rows.filter(
    (row) => row.route === input.route && row.trip_key !== input.tripKey
  );

  const stages: Array<{ minimum: number; filter: (row: NormalizedTrainingRow) => boolean }> = [
    {
      minimum: 5,
      filter: (row) =>
        row.horizon === currentHorizon &&
        row.period === currentPeriod &&
        currentDistance !== 'none' &&
        row.distance === currentDistance,
    },
    {
      minimum: 6,
      filter: (row) =>
        row.horizon === currentHorizon &&
        currentDistance !== 'none' &&
        row.distance === currentDistance,
    },
    {
      minimum: 7,
      filter: (row) => row.horizon === currentHorizon && row.period === currentPeriod,
    },
    {
      minimum: 8,
      filter: (row) => row.horizon === currentHorizon,
    },
    {
      minimum: 12,
      filter: () => true,
    },
  ];

  for (const stage of stages) {
    const selected = onePerTrip(routeRows.filter(stage.filter), input, currentHorizonSeconds);
    if (selected.length >= stage.minimum) return selected;
  }

  return [];
};

const selectDistanceRows = (
  rows: NormalizedTrainingRow[],
  input: HslLearningPredictionInput,
  currentObservedMs: number,
  currentHorizonSeconds: number
) => {
  if (input.distanceMeters === null) return [];
  const currentDistance = distanceBucket(input.distanceMeters);
  const currentPeriod = periodBucket(currentObservedMs);
  const routeDistanceRows = rows.filter(
    (row) =>
      row.route === input.route &&
      row.trip_key !== input.tripKey &&
      row.distance === currentDistance &&
      row.distance !== 'none'
  );

  const samePeriod = onePerTrip(
    routeDistanceRows.filter((row) => row.period === currentPeriod),
    input,
    currentHorizonSeconds
  );
  if (samePeriod.length >= 5) return samePeriod;

  const allPeriods = onePerTrip(routeDistanceRows, input, currentHorizonSeconds);
  return allPeriods.length >= 7 ? allPeriods : [];
};

export const buildHslLearningPrediction = (
  trainingRows: HslLearningTrainingRow[],
  input: HslLearningPredictionInput
): HslLearningPrediction | null => {
  const observedMs = timestampOf(input.observedAt);
  const hslMs = timestampOf(input.hslPredictedAt);
  if (observedMs === null || hslMs === null) return null;

  const normalizedRows = trainingRows
    .map(normalizeTrainingRow)
    .filter((row): row is NormalizedTrainingRow => row !== null);
  const currentHorizonSeconds = (hslMs - observedMs) / 1000;
  const residualRows = selectResidualRows(
    normalizedRows,
    input,
    observedMs,
    currentHorizonSeconds
  );
  const distanceRows = selectDistanceRows(
    normalizedRows,
    input,
    observedMs,
    currentHorizonSeconds
  );

  const residualValues = residualRows.map((row) => row.residualSeconds);
  const residualMedian = median(residualValues);
  const distanceValues = distanceRows.map((row) => row.actualRemainingSeconds);
  const distanceMedian = median(distanceValues);

  let predictionMs: number | null = null;
  let method: HslLearningPrediction['method'] | null = null;

  if (residualMedian !== null && distanceMedian !== null) {
    const residualPredictionMs = hslMs + residualMedian * 1000;
    const distancePredictionMs = observedMs + distanceMedian * 1000;
    predictionMs = residualPredictionMs * 0.65 + distancePredictionMs * 0.35;
    method = 'hsl-residual+gps-history';
  } else if (residualMedian !== null) {
    predictionMs = hslMs + residualMedian * 1000;
    method = 'hsl-residual';
  } else if (distanceMedian !== null) {
    predictionMs = observedMs + distanceMedian * 1000;
    method = 'gps-history';
  }

  if (predictionMs === null || method === null) return null;

  const minimumMs = observedMs - 30_000;
  const maximumMs = observedMs + 45 * 60_000;
  predictionMs = Math.min(maximumMs, Math.max(minimumMs, predictionMs));

  const residualMad =
    residualMedian === null ? null : medianAbsoluteDeviation(residualValues, residualMedian);
  const distanceMad =
    distanceMedian === null ? null : medianAbsoluteDeviation(distanceValues, distanceMedian);
  const confidenceValues = [residualMad, distanceMad].filter(
    (value): value is number => value !== null
  );
  const confidence = mean(confidenceValues);

  return {
    predictedAt: isoOf(Math.round(predictionMs)),
    adjustmentSeconds: Math.round((predictionMs - hslMs) / 1000),
    confidenceSeconds:
      confidence === null ? null : Math.round(Math.min(10 * 60, Math.max(30, confidence))),
    sampleSize: Math.max(residualRows.length, distanceRows.length),
    method,
  };
};

type Scoreboard = Pick<
  HslLearningSummary,
  'scoredTrips' | 'modelScoredTrips' | 'hslMaeSeconds' | 'modelMaeSeconds' | 'modelWins'
>;

export const buildHslLearningScoreboard = (
  trainingRows: HslLearningTrainingRow[]
): Scoreboard => {
  const selected = new Map<string, { row: HslLearningTrainingRow; distance: number }>();

  for (const row of trainingRows) {
    const observedMs = timestampOf(row.observed_at);
    const hslMs = timestampOf(row.hsl_predicted_at);
    const actualMs = timestampOf(row.actual_arrival_at);
    if (observedMs === null || hslMs === null || actualMs === null) continue;
    const horizonSeconds = (hslMs - observedMs) / 1000;
    if (horizonSeconds < 60 || horizonSeconds > 15 * 60) continue;
    const distance = Math.abs(horizonSeconds - 5 * 60);
    const existing = selected.get(row.trip_key);
    if (!existing || distance < existing.distance) selected.set(row.trip_key, { row, distance });
  }

  const hslErrors: number[] = [];
  const modelErrors: number[] = [];
  let modelWins = 0;

  for (const { row } of selected.values()) {
    const hslMs = timestampOf(row.hsl_predicted_at);
    const actualMs = timestampOf(row.actual_arrival_at);
    if (hslMs === null || actualMs === null) continue;
    const hslError = Math.abs(actualMs - hslMs) / 1000;
    hslErrors.push(hslError);

    if (row.model_predicted_at) {
      const modelMs = timestampOf(row.model_predicted_at);
      if (modelMs !== null) {
        const modelError = Math.abs(actualMs - modelMs) / 1000;
        modelErrors.push(modelError);
        if (modelError < hslError) modelWins += 1;
      }
    }
  }

  const hslMae = mean(hslErrors);
  const modelMae = mean(modelErrors);

  return {
    scoredTrips: hslErrors.length,
    modelScoredTrips: modelErrors.length,
    hslMaeSeconds: hslMae === null ? null : Math.round(hslMae),
    modelMaeSeconds: modelMae === null ? null : Math.round(modelMae),
    modelWins,
  };
};

export const ensureHslLearningSchema = async (db: HslLearningDb) => {
  const key = db as object;
  let ready = schemaReady.get(key);
  if (!ready) {
    ready = db.exec(SCHEMA_SQL).then(() => undefined);
    schemaReady.set(key, ready);
    void ready.catch(() => schemaReady.delete(key));
  }
  await ready;
};

const loadTrainingRows = async (db: HslLearningDb) => {
  const result = await db.prepare(`
    SELECT
      o.trip_key,
      o.route,
      o.observed_at,
      o.hsl_predicted_at,
      o.distance_meters,
      a.actual_arrival_at,
      o.model_predicted_at
    FROM hsl_eta_observations o
    INNER JOIN hsl_eta_arrivals a ON a.trip_key = o.trip_key
    ORDER BY o.observed_at DESC
    LIMIT ${MAX_TRAINING_ROWS}
  `).all<HslLearningTrainingRow>();
  return result.results ?? [];
};

const countTable = async (db: HslLearningDb, table: 'hsl_eta_observations' | 'hsl_eta_arrivals') => {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
  return row && Number.isFinite(Number(row.count)) ? Number(row.count) : 0;
};

const lastArrival = async (db: HslLearningDb) => {
  const row = await db.prepare(
    'SELECT actual_arrival_at FROM hsl_eta_arrivals ORDER BY actual_arrival_at DESC LIMIT 1'
  ).first<{ actual_arrival_at: string }>();
  return row?.actual_arrival_at ?? null;
};

const isLearningPayload = (value: unknown): value is HslLearningPayload => {
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

const detectArrival = (
  departure: HslLearningDeparture,
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

const recordableDeparture = (departure: HslLearningDeparture, observedMs: number) => {
  const scheduledMs = timestampOf(departure.scheduledAt);
  if (scheduledMs === null) return false;
  if (scheduledMs >= observedMs - RECORD_PAST_MS && scheduledMs <= observedMs + RECORD_FUTURE_MS) {
    return true;
  }
  return departure.vehicle?.distanceMeters !== null &&
    departure.vehicle?.distanceMeters !== undefined &&
    departure.vehicle.distanceMeters <= 5_000;
};

const insertArrivals = async (
  db: HslLearningDb,
  payload: HslLearningPayload,
  fetchedMs: number
) => {
  const statements: HslLearningDbStatement[] = [];
  for (const departure of payload.departures) {
    const arrival = detectArrival(departure, fetchedMs);
    if (!arrival) continue;
    statements.push(
      db.prepare(`
        INSERT OR IGNORE INTO hsl_eta_arrivals (
          trip_key, stop_code, route, scheduled_at, actual_arrival_at, detected_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tripKeyFor(payload.stop.code, departure),
        payload.stop.code,
        departure.route,
        departure.scheduledAt,
        arrival.at,
        arrival.method,
        payload.fetchedAt
      )
    );
  }
  if (statements.length > 0) await db.batch(statements);
};

const insertObservations = async (
  db: HslLearningDb,
  payload: HslLearningPayload,
  observedMs: number
) => {
  const statements: HslLearningDbStatement[] = [];
  const observedMinute = Math.floor(observedMs / 60_000);

  for (const departure of payload.departures) {
    if (!recordableDeparture(departure, observedMs)) continue;
    const model = departure.model ?? null;
    statements.push(
      db.prepare(`
        INSERT INTO hsl_eta_observations (
          trip_key, stop_code, route, scheduled_at, observed_at, observed_minute,
          hsl_predicted_at, hsl_delay_seconds, realtime, distance_meters, speed_kmh,
          vehicle_status, vehicle_updated_at, model_predicted_at, model_sample_size,
          model_adjustment_seconds, model_confidence_seconds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(trip_key, observed_minute) DO UPDATE SET
          observed_at = excluded.observed_at,
          hsl_predicted_at = excluded.hsl_predicted_at,
          hsl_delay_seconds = excluded.hsl_delay_seconds,
          realtime = excluded.realtime,
          distance_meters = excluded.distance_meters,
          speed_kmh = excluded.speed_kmh,
          vehicle_status = excluded.vehicle_status,
          vehicle_updated_at = excluded.vehicle_updated_at,
          model_predicted_at = excluded.model_predicted_at,
          model_sample_size = excluded.model_sample_size,
          model_adjustment_seconds = excluded.model_adjustment_seconds,
          model_confidence_seconds = excluded.model_confidence_seconds
      `).bind(
        tripKeyFor(payload.stop.code, departure),
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
        departure.vehicle?.updatedAt ?? null,
        model?.predictedAt ?? null,
        model?.sampleSize ?? null,
        model?.adjustmentSeconds ?? null,
        model?.confidenceSeconds ?? null
      )
    );
  }

  if (statements.length > 0) await db.batch(statements);
};

const addPredictions = (
  payload: HslLearningPayload,
  trainingRows: HslLearningTrainingRow[]
) => {
  for (const departure of payload.departures) {
    departure.model = buildHslLearningPrediction(trainingRows, {
      tripKey: tripKeyFor(payload.stop.code, departure),
      route: departure.route,
      observedAt: payload.fetchedAt,
      hslPredictedAt: departure.departureAt,
      distanceMeters: departure.vehicle?.distanceMeters ?? null,
    });
  }
};

const learningSummary = async (
  db: HslLearningDb,
  trainingRows: HslLearningTrainingRow[]
): Promise<HslLearningSummary> => {
  const scoreboard = buildHslLearningScoreboard(trainingRows);
  const [observations, arrivals, lastArrivalAt] = await Promise.all([
    countTable(db, 'hsl_eta_observations'),
    countTable(db, 'hsl_eta_arrivals'),
    lastArrival(db),
  ]);

  return {
    enabled: true,
    version: MODEL_VERSION,
    observations,
    arrivals,
    ...scoreboard,
    lastArrivalAt,
  };
};

export const enrichHslResponseWithLearning = async (
  response: Response,
  db?: HslLearningDb
): Promise<Response> => {
  if (!db || !response.ok) return response;
  const backup = response.clone();

  try {
    const payload: unknown = await response.json();
    if (!isLearningPayload(payload)) return backup;
    const observedMs = timestampOf(payload.fetchedAt);
    if (observedMs === null) return backup;

    await ensureHslLearningSchema(db);
    await insertArrivals(db, payload, observedMs);
    const trainingRows = await loadTrainingRows(db);
    addPredictions(payload, trainingRows);
    await insertObservations(db, payload, observedMs);
    payload.learning = await learningSummary(db, trainingRows);

    const headers = new Headers(backup.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'private, no-store');
    return new Response(JSON.stringify(payload), {
      status: backup.status,
      statusText: backup.statusText,
      headers,
    });
  } catch (error) {
    console.error('HSL learning enrichment failed', error);
    return backup;
  }
};
