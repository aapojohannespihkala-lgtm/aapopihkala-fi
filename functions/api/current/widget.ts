import { onRequestGet as getElectricityResponse } from './electricity';
import { onRequestGet as getMarketsResponse } from './markets-stable';
import { onRequestGet as getSnapshotPortfolioResponse } from './portfolio-snapshot';

type WeatherResponse = {
  current?: {
    temperature_2m?: unknown;
  };
  daily?: {
    temperature_2m_min?: unknown;
    temperature_2m_max?: unknown;
  };
};

type ElectricityEntry = {
  price?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

type ElectricityResponse = {
  prices?: unknown;
};

type PortfolioItem = {
  id?: unknown;
  changes?: {
    today?: unknown;
  };
};

type PortfolioResponse = {
  items?: unknown;
};

type MarketItem = {
  id?: unknown;
  value?: unknown;
};

type MarketSeriesPoint = {
  value?: unknown;
};

type MarketSeries = {
  id?: unknown;
  change1y?: unknown;
  points?: unknown;
};

type MarketsResponse = {
  items?: unknown;
  series?: unknown;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_TIMEOUT_MS = 6_000;
const QUARTER_MS = 15 * 60 * 1000;
const LOCATION = 'OLARI / ESPOO';
const SELECTED_MARKETS = {
  world: 'ishares-world',
  usa: 'handelsbanken-usa',
  finland: 'nordnet-finland',
  btcEur: 'btc',
  remedy: 'remedy',
} as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const localDateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: HELSINKI_TIME_ZONE,
});

const getLocalDateKey = (date: Date) => {
  const parts = Object.fromEntries(
    localDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}`;
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=900',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const buildWeatherUrl = () => {
  const params = new URLSearchParams({
    latitude: '60.1719',
    longitude: '24.7314',
    timezone: HELSINKI_TIME_ZONE,
    forecast_days: '1',
    temperature_unit: 'celsius',
    current: 'temperature_2m',
    daily: ['temperature_2m_min', 'temperature_2m_max'].join(','),
  });

  return `${WEATHER_API_URL}?${params.toString()}`;
};

const fetchWeatherResponse = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

  try {
    return await fetch(buildWeatherUrl(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  if (!response.ok) return null;

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const loadWeather = async () => {
  const data = await readJson<WeatherResponse>(await fetchWeatherResponse());
  if (!data) return null;

  const temperature = data.current?.temperature_2m;
  const lows = data.daily?.temperature_2m_min;
  const highs = data.daily?.temperature_2m_max;
  const low = Array.isArray(lows) ? lows[0] : undefined;
  const high = Array.isArray(highs) ? highs[0] : undefined;

  if (!isFiniteNumber(temperature)) return null;

  return {
    location: LOCATION,
    temperature,
    min: isFiniteNumber(low) ? low : null,
    max: isFiniteNumber(high) ? high : null,
  };
};

const loadElectricity = async (now: Date) => {
  const data = await readJson<ElectricityResponse>(await getElectricityResponse());
  if (!data || !Array.isArray(data.prices)) return null;

  const points = data.prices
    .flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return [];
      const entry = raw as ElectricityEntry;
      if (
        !isFiniteNumber(entry.price) ||
        typeof entry.startDate !== 'string' ||
        typeof entry.endDate !== 'string'
      ) {
        return [];
      }

      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      const startMs = start.getTime();
      const endMs = end.getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return [];

      return [{ price: entry.price, start, startMs, endMs }];
    })
    .sort((left, right) => left.startMs - right.startMs);

  const today = getLocalDateKey(now);
  const dayPoints = points.filter((point) => getLocalDateKey(point.start) === today);
  if (dayPoints.length === 0) return null;

  const nowMs = now.getTime();
  const current =
    dayPoints.find((point) => point.startMs <= nowMs && point.startMs + QUARTER_MS > nowMs) ??
    dayPoints.find((point) => point.startMs <= nowMs && point.endMs >= nowMs);
  const values = dayPoints.map((point) => point.price);

  return {
    price: current?.price ?? null,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    low: Math.min(...values),
    high: Math.max(...values),
  };
};

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
};

const loadPortfolio = async () => {
  const data = await readJson<PortfolioResponse>(await getSnapshotPortfolioResponse());
  if (!data || !Array.isArray(data.items)) return null;

  const byId = new Map<string, PortfolioItem>();
  const todayValues: number[] = [];

  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as PortfolioItem;
    if (typeof item.id === 'string') byId.set(item.id, item);
    if (isFiniteNumber(item.changes?.today)) todayValues.push(item.changes.today);
  }

  const selectedValue = (id: string) => {
    const value = byId.get(id)?.changes?.today;
    return isFiniteNumber(value) ? value : null;
  };

  return {
    median: median(todayValues),
    world: selectedValue(SELECTED_MARKETS.world),
    usa: selectedValue(SELECTED_MARKETS.usa),
    finland: selectedValue(SELECTED_MARKETS.finland),
    btcEur: selectedValue(SELECTED_MARKETS.btcEur),
    remedy: selectedValue(SELECTED_MARKETS.remedy),
  };
};

const loadRates = async (request: Request) => {
  const marketsUrl = new URL('/api/current/markets', request.url);
  const marketRequest = new Request(marketsUrl, {
    headers: { Accept: 'application/json' },
  });
  const data = await readJson<MarketsResponse>(await getMarketsResponse({ request: marketRequest }));
  if (!data) return null;

  const items = Array.isArray(data.items) ? data.items : [];
  const series = Array.isArray(data.series) ? data.series : [];
  const euribor = items.find(
    (raw) =>
      raw &&
      typeof raw === 'object' &&
      (raw as MarketItem).id === 'euribor-3m' &&
      isFiniteNumber((raw as MarketItem).value)
  ) as MarketItem | undefined;

  if (!euribor || !isFiniteNumber(euribor.value)) return null;

  const euriborSeries = series.find(
    (raw) => raw && typeof raw === 'object' && (raw as MarketSeries).id === 'euribor-3m'
  ) as MarketSeries | undefined;

  let yearAgo: number | null = null;
  if (euriborSeries && Array.isArray(euriborSeries.points)) {
    const first = (euriborSeries.points as MarketSeriesPoint[]).find((point) =>
      isFiniteNumber(point?.value)
    );
    if (first && isFiniteNumber(first.value)) yearAgo = first.value;
  }
  if (yearAgo === null && isFiniteNumber(euriborSeries?.change1y)) {
    yearAgo = euribor.value - euriborSeries.change1y;
  }

  return {
    euribor3m: euribor.value,
    yearAgo,
  };
};

const safely = async <T>(loader: () => Promise<T>): Promise<T | null> => {
  try {
    return await loader();
  } catch {
    return null;
  }
};

export const buildWidgetResponse = async (request: Request, now = new Date()) => {
  const [weather, electricity, markets, rates] = await Promise.all([
    safely(loadWeather),
    safely(() => loadElectricity(now)),
    safely(loadPortfolio),
    safely(() => loadRates(request)),
  ]);

  const body = {
    updated: now.toISOString(),
    weather,
    electricity,
    markets,
    rates,
  };
  const hasData = [weather, electricity, markets, rates].some((section) => section !== null);

  return jsonResponse(hasData ? body : { ...body, error: 'widget_data_unavailable' }, hasData ? 200 : 503);
};

export const onRequestGet = (context: { request: Request }) => buildWidgetResponse(context.request);
