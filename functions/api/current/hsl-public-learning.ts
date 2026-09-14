import type { HslLearningDb } from './hsl-learning';

type HslPublicDeparture = {
  route: string;
  scheduledAt: string;
  model?: unknown;
};

type HslPublicPayload = {
  departures: HslPublicDeparture[];
  learning?: unknown;
};

const MAX_SNAPSHOT_AGE_MS = 15 * 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isPublicPayload = (value: unknown): value is HslPublicPayload =>
  isRecord(value) &&
  Array.isArray(value.departures) &&
  value.departures.every(
    (departure) =>
      isRecord(departure) &&
      typeof departure.route === 'string' &&
      typeof departure.scheduledAt === 'string'
  );

const tripKeyFor = (departure: Pick<HslPublicDeparture, 'route' | 'scheduledAt'>) =>
  `${departure.route}|${departure.scheduledAt}`;

export const mergeHslLearningSnapshotPayload = (
  livePayload: unknown,
  learningPayload: unknown
): unknown => {
  if (!isPublicPayload(livePayload) || !isPublicPayload(learningPayload)) return livePayload;
  if (!isRecord(learningPayload.learning)) return livePayload;

  const modelByTrip = new Map<string, unknown>();
  for (const departure of learningPayload.departures) {
    if (departure.model !== undefined && departure.model !== null) {
      modelByTrip.set(tripKeyFor(departure), departure.model);
    }
  }

  return {
    ...livePayload,
    learning: learningPayload.learning,
    departures: livePayload.departures.map((departure) => {
      const model = modelByTrip.get(tripKeyFor(departure));
      return model === undefined ? departure : { ...departure, model };
    }),
  };
};

export const saveHslLearningPublicSnapshot = async (
  response: Response,
  db?: HslLearningDb
): Promise<void> => {
  if (!db || !response.ok) return;

  try {
    const payloadText = await response.clone().text();
    const payload: unknown = JSON.parse(payloadText);
    if (!isPublicPayload(payload) || !isRecord(payload.learning)) return;

    await db.prepare(`
      INSERT INTO hsl_eta_public_snapshot (id, payload_json, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(payloadText, new Date().toISOString()).run();
  } catch (error) {
    console.error('HSL public learning snapshot save failed', error);
  }
};

export const attachHslLearningPublicSnapshot = async (
  response: Response,
  db?: HslLearningDb
): Promise<Response> => {
  if (!db || !response.ok) return response;
  const backup = response.clone();

  try {
    const row = await db.prepare(`
      SELECT payload_json, updated_at
      FROM hsl_eta_public_snapshot
      WHERE id = 1
      LIMIT 1
    `).first<{ payload_json: string; updated_at: string }>();
    if (!row) return backup;

    const updatedMs = new Date(row.updated_at).getTime();
    if (!Number.isFinite(updatedMs) || Date.now() - updatedMs > MAX_SNAPSHOT_AGE_MS) return backup;

    const livePayload: unknown = await response.json();
    const learningPayload: unknown = JSON.parse(row.payload_json);
    const merged = mergeHslLearningSnapshotPayload(livePayload, learningPayload);
    if (merged === livePayload) return backup;

    const headers = new Headers(backup.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'private, no-store');
    return new Response(JSON.stringify(merged), {
      status: backup.status,
      statusText: backup.statusText,
      headers,
    });
  } catch (error) {
    console.error('HSL public learning snapshot read failed', error);
    return backup;
  }
};
