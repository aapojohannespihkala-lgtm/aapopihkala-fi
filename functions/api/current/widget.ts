import { onRequestGet as getElectricityResponse } from './electricity';
import { onRequestGet as getMarketsResponse } from './markets-stable';
import { onRequestGet as getPortfolioPerformance } from './portfolio';

type WeatherResponse = {
  utc_offset_seconds?: unknown;
  current?: {
    time?: unknown;
    temperature_2m?: unknown;
    weather_code?: unknown;
  };
  hourly?: {
    time?: unknown;
    temperature_2m?: unknown;
    weather_code?: unknown;
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
  price?: unknown;
  observedAt?: unknown;
  changes?: {
    today?: unknown;
    month1?: unknown;
    year1?: unknown;
  };
};

type PortfolioResponse = {
  items?: unknown;
};

type MarketItem = {
  id?: unknown;
  value?: unknown;
  observedAt?: unknown;
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

export const WIDGET_WEATHER_SOURCE = {
  apiUrl: 'https://api.open-meteo.com/v1/forecast',
  latitude: 60.1719,
  longitude: 24.7314,
  timeZone: 'Europe/Helsinki',
  label: 'OLARI / ESPOO',
} as const;

const HELSINKI_TIME_ZONE = WIDGET_WEATHER_SOURCE.timeZone;
const WEATHER_TIMEOUT_MS = 6_000;
const QUARTER_MS = 15 * 60 * 1000;
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

const localDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
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

const getLocalDateTimeKey = (date: Date) => {
  const parts = Object.fromEntries(
    localDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}T${parts.hour ?? '00'}:${parts.minute ?? '00'}`;
};

export const normalizeWeatherObservedAt = (
  value: unknown,
  utcOffsetSeconds: unknown,
): string | null => {
  if (typeof value !== 'string' || !isFiniteNumber(utcOffsetSeconds)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? '0');
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const normalized = new Date(localAsUtcMs);
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute ||
    normalized.getUTCSeconds() !== second
  ) {
    return null;
  }

  return new Date(localAsUtcMs - utcOffsetSeconds * 1000).toISOString();
};

export const normalizeSourceObservedAt = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    const normalized = new Date(timestamp);
    if (
      normalized.getUTCFullYear() !== year ||
      normalized.getUTCMonth() !== month - 1 ||
      normalized.getUTCDate() !== day
    ) {
      return null;
    }
    return normalized.toISOString();
  }

  const timestamp = Date.parse(trimmed);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

export const oldestSourceObservedAt = (values: unknown[]): string | null => {
  const normalized = values
    .map(normalizeSourceObservedAt)
    .filter((value): value is string => value !== null)
    .sort();
  return normalized[0] ?? null;
};

const weatherCodeLabel = (value: unknown) => {
  if (!isFiniteNumber(value)) return null;
  const code = Math.round(value);
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code === 51) return 'Light drizzle';
  if (code === 53 || code === 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing drizzle';
  if (code === 61) return 'Light rain';
  if (code === 63 || code === 65) return 'Rain';
  if (code === 66 || code === 67) return 'Freezing rain';
  if (code === 71) return 'Light snow';
  if (code === 73 || code === 75 || code === 77) return 'Snow';
  if (code === 80) return 'Light showers';
  if (code === 81 || code === 82) return 'Showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm / hail';
  return null;
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

export const buildWidgetWeatherUrl = () => {
  const params = new URLSearchParams({
    latitude: String(WIDGET_WEATHER_SOURCE.latitude),
    longitude: String(WIDGET_WEATHER_SOURCE.longitude),
    timezone: WIDGET_WEATHER_SOURCE.timeZone,
    forecast_days: '2',
    temperature_unit: 'celsius',
    current: ['temperature_2m', 'weather_code'].join(','),
    hourly: ['temperature_2m', 'weather_code'].join(','),
    daily: ['temperature_2m_min', 'temperature_2m_max'].join(','),
  });

  return `${WIDGET_WEATHER_SOURCE.apiUrl}?${params.toString()}`;
};

const fetchWeatherResponse = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

  try {
    return await fetch(buildWidgetWeatherUrl(), {
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

const loadWeather = async (now: Date) => {
  const data = await readJson<WeatherResponse>(await fetchWeatherResponse());
  if (!data) return null;

  const temperature = data.current?.temperature_2m;
  const lows = data.daily?.temperature_2m_min;
  const highs = data.daily?.temperature_2m_max;
  const low = Array.isArray(lows) ? lows[0] : undefined;
  const high = Array.isArray(highs) ? highs[0] : undefined;

  if (!isFiniteNumber(temperature)) return null;

  const times = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
  const temperatures = Array.isArray(data.hourly?.temperature_2m)
    ? data.hourly.temperature_2m
    : [];
  const weatherCodes = Array.isArray(data.hourly?.weather_code)
    ? data.hourly.weather_code
    : [];
  const nowKey = getLocalDateTimeKey(now);

  const futureHours = times.flatMap((rawTime, index) => {
    if (typeof rawTime !== 'string' || rawTime < nowKey) return [];
    const forecastTemperature = temperatures[index];
    if (!isFiniteNumber(forecastTemperature)) return [];

    return [{
      time: rawTime.slice(11, 16),
      temperature: forecastTemperature,
      condition: weatherCodeLabel(weatherCodes[index]),
    }];
  });
  const forecast = futureHours.filter((_item, index) => index % 2 === 0).slice(0, 6);

  return {
    location: WIDGET_WEATHER_SOURCE.label,
    temperature,
    condition: weatherCodeLabel(data.current?.weather_code),
    observedAt: normalizeWeatherObservedAt(data.current?.time, data.utc_offset_seconds),
    min: isFiniteNumber(low) ? low : null,
    max: isFiniteNumber(high) ? high : null,
    forecast,
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
    series: values,
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
  const data = await readJson<PortfolioResponse>(await getPortfolioPerformance());
  if (!data || !Array.isArray(data.items)) return null;

  const byId = new Map<string, PortfolioItem>();
  const todayValues: number[] = [];
  const todayObservedAt: unknown[] = [];
  const month1Values: number[] = [];
  const year1Values: number[] = [];

  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as PortfolioItem;
    if (typeof item.id === 'string') byId.set(item.id, item);
    if (isFiniteNumber(item.changes?.today)) {
      todayValues.push(item.changes.today);
      todayObservedAt.push(item.observedAt);
    }
    if (isFiniteNumber(item.changes?.month1)) month1Values.push(item.changes.month1);
    if (isFiniteNumber(item.changes?.year1)) year1Values.push(item.changes.year1);
  }

  const selectedValue = (id: string) => {
    const value = byId.get(id)?.changes?.today;
    return isFiniteNumber(value) ? value : null;
  };
  const selectedPrice = (id: string) => {
    const value = byId.get(id)?.price;
    return isFiniteNumber(value) ? value : null;
  };

  return {
    median: median(todayValues),
    month1Median: median(month1Values),
    year1Median: median(year1Values),
    observedAt: oldestSourceObservedAt(todayObservedAt),
    world: selectedValue(SELECTED_MARKETS.world),
    usa: selectedValue(SELECTED_MARKETS.usa),
    finland: selectedValue(SELECTED_MARKETS.finland),
    btcEur: selectedValue(SELECTED_MARKETS.btcEur),
    remedy: selectedValue(SELECTED_MARKETS.remedy),
    remedyPrice: selectedPrice(SELECTED_MARKETS.remedy),
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
    observedAt: normalizeSourceObservedAt(euribor.observedAt),
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
    safely(() => loadWeather(now)),
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