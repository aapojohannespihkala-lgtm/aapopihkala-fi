import { CURRENT_HSL_QUERY } from '../../../src/features/current/hsl-query';
import { fetchHslDeparturesResponse } from './hsl';

export type WidgetHslDeparture = {
  route: string;
  headsign: string;
  departureAt: string;
  realtime: boolean;
};

export type WidgetHslData = {
  fetchedAt: string;
  departures: WidgetHslDeparture[];
};

type FetchWidgetHslOptions = {
  request: Request;
  apiKey?: string;
  timeoutMs?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isWidgetDeparture = (value: unknown): value is WidgetHslDeparture =>
  isRecord(value) &&
  typeof value.route === 'string' &&
  typeof value.headsign === 'string' &&
  typeof value.departureAt === 'string' &&
  typeof value.realtime === 'boolean';

export const fetchWidgetHslData = async ({
  request,
  apiKey,
  timeoutMs = 4_000,
}: FetchWidgetHslOptions): Promise<WidgetHslData | null> => {
  const hslRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CURRENT_HSL_QUERY),
  });

  const response = await fetchHslDeparturesResponse({
    request: hslRequest,
    apiKey,
    timeoutMs,
  });
  if (!response.ok) return null;

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || !Array.isArray(payload.departures)) return null;

  const departures = payload.departures.filter(isWidgetDeparture);
  if (departures.length === 0) return null;

  return {
    fetchedAt: typeof payload.fetchedAt === 'string'
      ? payload.fetchedAt
      : new Date().toISOString(),
    departures,
  };
};
