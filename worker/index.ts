import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getElectricityMonthResponse } from '../functions/api/current/electricity-month';
import { fetchHslDeparturesResponse } from '../functions/api/current/hsl';
import {
  enrichHslResponseWithLearning,
  type HslLearningDb,
} from '../functions/api/current/hsl-learning';
import { recordHslDistancePassages } from '../functions/api/current/hsl-passage-learning';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets-stable';
import { onRequestGet as getPortfolioResponse } from '../functions/api/current/portfolio-complete';
import { onRequestGet as getSnapshotPortfolioResponse } from '../functions/api/current/portfolio-snapshot';
import { onRequestGet as getNewsResponse } from '../functions/api/current/news';
import { fetchLiigaResponse, onRequestGet as getLiigaResponse } from '../functions/api/current/liiga';
import { onRequestGet as getLiigaScheduleResponse } from '../functions/api/current/liiga-schedule';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
  DIGITRANSIT_API_KEY?: string;
  HSL_MODEL_DB?: HslLearningDb;
};

type ScheduledController = {
  scheduledTime: number;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const ELECTRICITY_MONTH_PATH = '/api/current/electricity-month';
const HSL_PATH = '/api/current/hsl';
const MARKETS_PATH = '/api/current/markets';
const NEWS_PATH = '/api/current/news';
const LIIGA_PATH = '/api/current/liiga';
const LIIGA_SCHEDULE_PATH = '/api/current/liiga-schedule';
const SNAPSHOT_LIIGA_UPSTREAM_TIMEOUT_MS = 4_000;
const HSL_LEARNING_QUERY = {
  stopCode: 'E3239',
  stopName: 'Ylisrinne',
  routes: ['121', '125'],
};

const HSL_LEARNING_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS hsl_eta_observations (
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
  )`,
  'CREATE INDEX IF NOT EXISTS hsl_eta_observations_trip_idx ON hsl_eta_observations(trip_key, observed_at)',
  'CREATE INDEX IF NOT EXISTS hsl_eta_observations_route_idx ON hsl_eta_observations(route, observed_at)',
  `CREATE TABLE IF NOT EXISTS hsl_eta_arrivals (
    trip_key TEXT PRIMARY KEY,
    stop_code TEXT NOT NULL,
    route TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    actual_arrival_at TEXT NOT NULL,
    detected_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS hsl_eta_arrivals_route_idx ON hsl_eta_arrivals(route, actual_arrival_at)',
];

const hslLearningDbAdapters = new WeakMap<object, HslLearningDb>();

const hslLearningDb = (db?: HslLearningDb) => {
  if (!db) return undefined;
  const key = db as object;
  const existing = hslLearningDbAdapters.get(key);
  if (existing) return existing;

  const adapter: HslLearningDb = {
    prepare: (query) => db.prepare(query),
    batch: (statements) => db.batch(statements),
    exec: async () => {
      await db.batch(HSL_LEARNING_SCHEMA_STATEMENTS.map((query) => db.prepare(query)));
    },
  };
  hslLearningDbAdapters.set(key, adapter);
  return adapter;
};

const enrichAndRecordHsl = async (response: Response, db?: HslLearningDb) => {
  const enriched = await enrichHslResponseWithLearning(response, db);
  await recordHslDistancePassages(enriched, db);
  return enriched;
};

const methodNotAllowed = (allow = 'GET') =>
  new Response('Method not allowed', {
    status: 405,
    headers: { Allow: allow },
  });

const isSnapshotRequest = (request: Request) => {
  const referer = request.headers.get('Referer');
  if (!referer) return false;

  try {
    return new URL(referer).pathname === '/current/snapshot/';
  } catch {
    return false;
  }
};

const publicLiigaResponse = async (response: Response, error: string) => {
  if (response.status < 500) return response;

  return Response.json(
    { error },
    {
      status: response.status,
      headers: response.headers,
    }
  );
};

const collectHslLearningSnapshot = async (env: WorkerEnv) => {
  if (!env.HSL_MODEL_DB || !env.DIGITRANSIT_API_KEY) return;

  const request = new Request('https://aapopihkala.fi/api/current/hsl', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(HSL_LEARNING_QUERY),
  });
  const response = await fetchHslDeparturesResponse({
    request,
    apiKey: env.DIGITRANSIT_API_KEY,
  });
  if (!response.ok) {
    console.error('Scheduled HSL learning snapshot failed', response.status);
    return;
  }
  await enrichAndRecordHsl(response, hslLearningDb(env.HSL_MODEL_DB));
};

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const snapshotRequest = isSnapshotRequest(request);

    if (url.pathname === ELECTRICITY_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getElectricityPriceResponse();
    }

    if (url.pathname === ELECTRICITY_MONTH_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getElectricityMonthResponse();
    }

    if (url.pathname === HSL_PATH) {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      const response = await fetchHslDeparturesResponse({
        request,
        apiKey: env.DIGITRANSIT_API_KEY,
      });
      return enrichAndRecordHsl(response, hslLearningDb(env.HSL_MODEL_DB));
    }

    if (url.pathname === MARKETS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      if (url.searchParams.get('portfolio') === '1') {
        return snapshotRequest ? getSnapshotPortfolioResponse() : getPortfolioResponse();
      }
      return getMarketsResponse({ request });
    }

    if (url.pathname === NEWS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getNewsResponse();
    }

    if (url.pathname === LIIGA_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      const response = snapshotRequest
        ? await fetchLiigaResponse(SNAPSHOT_LIIGA_UPSTREAM_TIMEOUT_MS)
        : await getLiigaResponse();
      return publicLiigaResponse(response, 'Liiga data request failed');
    }

    if (url.pathname === LIIGA_SCHEDULE_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return publicLiigaResponse(await getLiigaScheduleResponse(), 'Liiga schedule request failed');
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv): Promise<void> {
    await collectHslLearningSnapshot(env);
  },
};

export default worker;