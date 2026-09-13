import type { HslLearningDb } from './hsl-learning';

type HslRecordedPassageDeparture = {
  route: string;
  scheduledAt: string;
  vehicle: unknown | null;
};

type HslRecordedPassagePayload = {
  stop: {
    code: string;
  };
  departures: HslRecordedPassageDeparture[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isRecordedPassagePayload = (value: unknown): value is HslRecordedPassagePayload => {
  if (!isRecord(value) || !isRecord(value.stop) || !Array.isArray(value.departures)) return false;
  if (typeof value.stop.code !== 'string') return false;

  return value.departures.every(
    (departure) =>
      isRecord(departure) &&
      typeof departure.route === 'string' &&
      typeof departure.scheduledAt === 'string' &&
      ('vehicle' in departure)
  );
};

const tripKeyFor = (
  stopCode: string,
  departure: Pick<HslRecordedPassageDeparture, 'route' | 'scheduledAt'>
) => `${stopCode}|${departure.route}|${departure.scheduledAt}`;

export const filterRecordedPassagePayload = (
  payload: HslRecordedPassagePayload,
  recordedTripKeys: ReadonlySet<string>
) => ({
  ...payload,
  departures: payload.departures.filter(
    (departure) =>
      departure.vehicle === null ||
      !recordedTripKeys.has(tripKeyFor(payload.stop.code, departure))
  ),
});

export const filterRecordedHslPassages = async (
  response: Response,
  db?: HslLearningDb
): Promise<Response> => {
  if (!db || !response.ok) return response;
  const backup = response.clone();

  try {
    const payload: unknown = await response.json();
    if (!isRecordedPassagePayload(payload)) return backup;

    const activeTripKeys = [
      ...new Set(
        payload.departures
          .filter((departure) => departure.vehicle !== null)
          .map((departure) => tripKeyFor(payload.stop.code, departure))
      ),
    ];
    if (activeTripKeys.length === 0) return backup;

    const placeholders = activeTripKeys.map(() => '?').join(', ');
    const result = await db
      .prepare(`SELECT trip_key FROM hsl_eta_arrivals WHERE trip_key IN (${placeholders})`)
      .bind(...activeTripKeys)
      .all<{ trip_key: string }>();
    const recordedTripKeys = new Set((result.results ?? []).map((row) => row.trip_key));
    if (recordedTripKeys.size === 0) return backup;

    const filtered = filterRecordedPassagePayload(payload, recordedTripKeys);
    const headers = new Headers(backup.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'private, no-store');

    return new Response(JSON.stringify(filtered), {
      status: backup.status,
      statusText: backup.statusText,
      headers,
    });
  } catch (error) {
    console.error('HSL recorded passage filtering failed', error);
    return backup;
  }
};
