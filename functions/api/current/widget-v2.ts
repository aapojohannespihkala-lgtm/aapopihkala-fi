import { onRequestGet as getElectricityMonthResponse } from './electricity-month';
import { fetchLiigaResponse } from './liiga';
import { fetchWidgetHslData, type WidgetHslData } from './widget-hsl';
import { onRequestGet as getWidgetResponse, WIDGET_WEATHER_SOURCE } from './widget';

type Tone = 'neutral' | 'positive' | 'negative' | 'accent';
type WidgetSpan = 'full' | 'half';
type WidgetLayout = 'stack' | 'split';
type WidgetRow = {
  label: string;
  value: string;
  tone?: Tone;
  secondary?: string;
  countdownTargetMs?: number;
};
type WidgetColumn = { label: string; value: string; tone?: Tone };

export type WidgetSection = {
  id: string;
  index: string;
  label: string;
  primary: string;
  secondary?: string;
  detail?: string;
  tone?: Tone;
  span?: WidgetSpan;
  layout?: WidgetLayout;
  observedAt?: string;
  fetchedAt?: string;
  countdownTargetMs?: number;
  rows?: WidgetRow[];
  columns?: WidgetColumn[];
  bars?: number[];
};

type WidgetTheme = {
  background: string;
  panel: string;
  foreground: string;
  muted: string;
  line: string;
  accent: string;
  positive: string;
  negative: string;
};

type WidgetLayouts = { compact: string[]; medium: string[]; large: string[] };

export type WidgetV2Payload = {
  schemaVersion: 2;
  minEngineVersion: 2;
  channel: 'prod' | 'dev';
  generatedAt: string;
  title: string;
  pageUrl: string;
  theme: WidgetTheme;
  layouts: WidgetLayouts;
  sections: WidgetSection[];
};

type BaseWidgetData = {
  updated?: unknown;
  weather?: unknown;
  electricity?: unknown;
  markets?: unknown;
  rates?: unknown;
};

type ElectricityMonthData = {
  average?: unknown;
};

type LiigaData = {
  ilvesStanding?: unknown;
  liveIlvesGame?: unknown;
  nextIlvesGame?: unknown;
};

type SolarData = {
  sunrise: string;
  sunset: string;
  daylight: string;
};

type SolarForecastResponse = {
  daily?: {
    sunrise?: unknown;
    sunset?: unknown;
  };
};

type WidgetV2Context = {
  request: Request;
  env?: {
    DIGITRANSIT_API_KEY?: string;
  };
};

const PROD_THEME: WidgetTheme = {
  background: '#1D2A35',
  panel: '#22323E',
  foreground: '#EEF2F4',
  muted: '#AAB4BC',
  line: '#64717B',
  accent: '#DCE4E8',
  positive: '#15967F',
  negative: '#C45F6C',
};
const DEV_THEME: WidgetTheme = { ...PROD_THEME };

const PROD_LAYOUTS: WidgetLayouts = {
  compact: ['weather', 'electricity', 'markets', 'rates'],
  medium: ['weather', 'electricity', 'markets', 'rates'],
  large: ['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga'],
};
const DEV_LAYOUTS: WidgetLayouts = { ...PROD_LAYOUTS };

const SOLAR_TIMEOUT_MS = 4_000;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const finiteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toneFor = (value: number | null): Tone =>
  value === null || value === 0 ? 'neutral' : value > 0 ? 'positive' : 'negative';

const formatNumber = (value: number | null, digits = 2) =>
  value === null ? '--' : value.toFixed(digits);

const formatTemperature = (value: number | null) =>
  value === null ? '--.-°C' : `${value.toFixed(1)}°C`;

const formatDegree = (value: number | null) =>
  value === null ? '--°' : `${Math.round(value)}°`;

const formatPrice = (value: number | null) =>
  value === null ? '--.-- c/kWh' : `${value.toFixed(2)} c/kWh`;

const formatPercent = (value: number | null, signed = false, digits = 2) => {
  if (value === null) return '--';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  if (!response.ok) return null;
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
};

const formatSolarClock = (value: string) => {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? null;
};

const readClockMinutes = (value: string) => {
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const formatDaylightLength = (sunrise: string, sunset: string) => {
  const start = readClockMinutes(sunrise);
  const end = readClockMinutes(sunset);
  if (start === null || end === null) return null;

  const duration = end >= start ? end - start : end + 24 * 60 - start;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}H${String(minutes).padStart(2, '0')}M`;
};

export const buildWidgetSolarUrl = () => {
  const params = new URLSearchParams({
    latitude: String(WIDGET_WEATHER_SOURCE.latitude),
    longitude: String(WIDGET_WEATHER_SOURCE.longitude),
    timezone: WIDGET_WEATHER_SOURCE.timeZone,
    forecast_days: '1',
    daily: 'sunrise,sunset',
  });
  return `${WIDGET_WEATHER_SOURCE.apiUrl}?${params.toString()}`;
};

const fetchSolarData = async (): Promise<SolarData | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOLAR_TIMEOUT_MS);

  try {
    const response = await fetch(buildWidgetSolarUrl(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const data = await readJson<SolarForecastResponse>(response);
    const sunriseRaw = Array.isArray(data?.daily?.sunrise)
      ? stringValue(data.daily.sunrise[0])
      : null;
    const sunsetRaw = Array.isArray(data?.daily?.sunset)
      ? stringValue(data.daily.sunset[0])
      : null;
    if (!sunriseRaw || !sunsetRaw) return null;

    const sunrise = formatSolarClock(sunriseRaw);
    const sunset = formatSolarClock(sunsetRaw);
    const daylight = formatDaylightLength(sunriseRaw, sunsetRaw);
    if (!sunrise || !sunset || !daylight) return null;
    return { sunrise, sunset, daylight };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const weatherColumns = (value: unknown): WidgetColumn[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    const item = asRecord(raw);
    if (!item) return [];
    const time = stringValue(item.time);
    const temperature = finiteNumber(item.temperature);
    if (!time || temperature === null) return [];
    return [{ label: time, value: formatDegree(temperature) }];
  }).slice(0, 6);
};

const weatherForecastDetail = (items: WidgetColumn[]) =>
  items.length === 0
    ? ''
    : `FORECAST ${items.map((item) => `${item.label}=${item.value}`).join('|')}`;

const buildWeatherSection = (
  value: unknown,
  solar: SolarData | null,
  fetchedAt?: string,
): WidgetSection | null => {
  const weather = asRecord(value);
  if (!weather) return null;
  const temperature = finiteNumber(weather.temperature);
  const low = finiteNumber(weather.min);
  const high = finiteNumber(weather.max);
  const location = stringValue(weather.location);
  const condition = stringValue(weather.condition);
  const observedAt = stringValue(weather.observedAt);
  if (temperature === null && low === null && high === null) return null;
  const range = low === null && high === null ? '' : `${formatDegree(low)} / ${formatDegree(high)}`;
  const weatherDetail = [condition, range].filter(Boolean).join(' / ');
  const solarDetail = solar
    ? `↑${solar.sunrise} ↓${solar.sunset} ☀${solar.daylight}`
    : '';
  const forecastColumns = weatherColumns(weather.forecast);
  const forecastDetail = weatherForecastDetail(forecastColumns);
  const detail = [weatherDetail, solarDetail, forecastDetail].filter(Boolean).join('\n');
  const weatherRows: WidgetRow[] = [];
  if (low !== null) weatherRows.push({ label: 'LOW', value: formatDegree(low) });
  if (high !== null) weatherRows.push({ label: 'HIGH', value: formatDegree(high) });

  return {
    id: 'weather',
    index: '01',
    label: 'WEATHER',
    primary: formatTemperature(temperature),
    secondary: location ?? undefined,
    detail: detail || undefined,
    span: 'full',
    layout: 'stack',
    observedAt: observedAt ?? undefined,
    fetchedAt,
    rows: weatherRows,
    columns: forecastColumns,
  };
};

const hourlyBars = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const prices = value
    .map(finiteNumber)
    .filter((price): price is number => price !== null);
  if (prices.length === 0) return [];

  const hourly: number[] = [];
  for (let index = 0; index < prices.length; index += 4) {
    const chunk = prices.slice(index, index + 4);
    if (chunk.length === 0) continue;
    hourly.push(chunk.reduce((sum, price) => sum + price, 0) / chunk.length);
  }
  if (hourly.length === 0) return [];

  const low = Math.min(...hourly);
  const high = Math.max(...hourly);
  if (high === low) return hourly.map(() => 0.5);

  return hourly.slice(0, 32).map((price) => (price - low) / (high - low));
};

const buildElectricitySection = (
  value: unknown,
  monthAverage: number | null,
  fetchedAt?: string,
): WidgetSection | null => {
  const electricity = asRecord(value);
  if (!electricity) return null;
  const price = finiteNumber(electricity.price);
  const average = finiteNumber(electricity.average);
  const low = finiteNumber(electricity.low);
  const high = finiteNumber(electricity.high);
  if ([price, average, low, high].every((item) => item === null)) return null;
  return {
    id: 'electricity',
    index: '02',
    label: 'ELECTRICITY',
    primary: formatPrice(average),
    secondary: 'DAY AVG / TODAY',
    detail: `MONTH AVG ${formatNumber(monthAverage)}  LOW ${formatNumber(low)}  HIGH ${formatNumber(high)}`,
    span: 'full',
    layout: 'split',
    fetchedAt,
    bars: hourlyBars(electricity.series),
    rows: price === null ? [] : [{ label: 'NOW', value: formatPrice(price) }],
  };
};

const marketRow = (label: string, value: unknown): WidgetRow => {
  const number = finiteNumber(value);
  return { label, value: formatPercent(number, true, 2), tone: toneFor(number) };
};

const buildMarketsSection = (value: unknown, fetchedAt?: string): WidgetSection | null => {
  const markets = asRecord(value);
  if (!markets) return null;
  const median = finiteNumber(markets.median);
  const month1Median = finiteNumber(markets.month1Median);
  const year1Median = finiteNumber(markets.year1Median);
  const observedAt = stringValue(markets.observedAt);
  const rows = [
    marketRow('WORLD', markets.world),
    marketRow('USA', markets.usa),
    marketRow('FINLAND', markets.finland),
    marketRow('BTC / EUR', markets.btcEur),
    marketRow('REMEDY', markets.remedy),
  ];
  if (median === null && rows.every((row) => row.value === '--')) return null;
  const longerMedians = [
    `1M ${formatPercent(month1Median, true, 2)}`,
    `1Y ${formatPercent(year1Median, true, 2)}`,
  ].join('  ·  ');
  return {
    id: 'markets',
    index: '03',
    label: 'MARKETS',
    primary: formatPercent(median, true, 2),
    secondary: '1D / MEDIAN',
    detail: longerMedians,
    tone: toneFor(median),
    span: 'full',
    layout: 'split',
    observedAt: observedAt ?? undefined,
    fetchedAt,
    rows,
  };
};

const timestampOf = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const hslClock = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Helsinki',
  }).format(date);
};

const hslCountdown = (departureAt: string, now: number) => {
  const departure = timestampOf(departureAt);
  if (departure === null) return null;
  const delta = departure - now;
  if (delta <= 0) return null;
  return `${Math.ceil(delta / 60_000)} MIN`;
};

const buildHslSection = (
  data: WidgetHslData | null,
  generatedAt: string
): WidgetSection | null => {
  if (!data) return null;
  const generatedTimestamp = timestampOf(generatedAt) ?? Date.now();
  const upcoming = data.departures
    .map((departure) => ({
      ...departure,
      timestamp: timestampOf(departure.departureAt),
      countdown: hslCountdown(departure.departureAt, generatedTimestamp),
    }))
    .filter(
      (departure): departure is typeof departure & { timestamp: number; countdown: string } =>
        departure.timestamp !== null && departure.countdown !== null
    )
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5);

  const next = upcoming[0];
  if (!next) return null;

  return {
    id: 'hsl',
    index: '04',
    label: 'HSL',
    primary: next.countdown,
    secondary: [next.route, next.headsign].filter(Boolean).join(' / ').toUpperCase(),
    detail: `${hslClock(next.departureAt)} / ${next.realtime ? 'LIVE' : 'SCHED'}`,
    tone: next.realtime ? 'accent' : 'neutral',
    span: 'full',
    layout: 'split',
    fetchedAt: data.fetchedAt,
    countdownTargetMs: next.timestamp,
    rows: upcoming.slice(0, 4).map((departure) => ({
      label: departure.route,
      value: hslClock(departure.departureAt),
      tone: departure.realtime ? 'accent' : 'neutral',
      secondary: [departure.route, departure.headsign].filter(Boolean).join(' / ').toUpperCase(),
      countdownTargetMs: departure.timestamp,
    })),
  };
};

const buildRatesSection = (
  value: unknown,
  index = '04',
  fetchedAt?: string,
): WidgetSection | null => {
  const rates = asRecord(value);
  if (!rates) return null;
  const current = finiteNumber(rates.euribor3m);
  const yearAgo = finiteNumber(rates.yearAgo);
  const observedAt = stringValue(rates.observedAt);
  if (current === null && yearAgo === null) return null;
  return {
    id: 'rates',
    index,
    label: 'RATES',
    primary: formatPercent(current, false, 2),
    secondary: '3M EURIBOR',
    detail: `1Y AGO ${formatPercent(yearAgo, false, 2)}`,
    span: 'half',
    layout: 'stack',
    observedAt: observedAt ?? undefined,
    fetchedAt,
  };
};

const helsinkiDateTime = (value: unknown) => {
  const dateString = stringValue(value);
  if (!dateString) return null;
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Helsinki',
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('weekday').toUpperCase()} ${part('day')} ${part('hour')}:${part('minute')}`.trim();
};

const buildLiigaSection = (value: unknown, index = '05'): WidgetSection | null => {
  const liiga = asRecord(value);
  if (!liiga) return null;
  const standing = asRecord(liiga.ilvesStanding);
  const live = asRecord(liiga.liveIlvesGame);
  const next = asRecord(liiga.nextIlvesGame);

  if (live) {
    const home = stringValue(live.homeTeam) ?? '--';
    const away = stringValue(live.awayTeam) ?? '--';
    const homeGoals = finiteNumber(live.homeGoals);
    const awayGoals = finiteNumber(live.awayGoals);
    return {
      id: 'liiga',
      index,
      label: 'LIIGA',
      primary: homeGoals !== null && awayGoals !== null ? `${homeGoals.toFixed(0)}-${awayGoals.toFixed(0)}` : 'LIVE',
      secondary: 'ILVES / LIVE',
      detail: `${home.toUpperCase()} - ${away.toUpperCase()}`,
      tone: 'accent',
      span: 'half',
      layout: 'stack',
      rows: [{ label: home.toUpperCase(), value: away.toUpperCase() }],
    };
  }

  const rank = finiteNumber(standing?.rank);
  const totalTeams = finiteNumber(standing?.totalTeams);
  const nextHome = stringValue(next?.homeTeam);
  const nextAway = stringValue(next?.awayTeam);
  const nextAt = helsinkiDateTime(next?.start);
  if (!standing && !next) return null;

  const rows: WidgetRow[] = [];
  if (nextHome && nextAway) {
    rows.push({ label: 'NEXT', value: `${nextHome.toUpperCase()} - ${nextAway.toUpperCase()}` });
  }
  if (nextAt) rows.push({ label: 'START', value: nextAt });

  return {
    id: 'liiga',
    index,
    label: 'LIIGA',
    primary: rank !== null && totalTeams !== null ? `${rank.toFixed(0)}/${totalTeams.toFixed(0)}` : 'ILVES',
    secondary: nextHome && nextAway
      ? `${nextHome.toUpperCase()} - ${nextAway.toUpperCase()}`
      : 'ILVES / STANDING',
    detail: nextAt ?? undefined,
    span: 'half',
    layout: 'stack',
    rows,
  };
};

export const buildWidgetV2Payload = (
  base: BaseWidgetData | null,
  liiga: LiigaData | null,
  channel: 'prod' | 'dev',
  generatedAt = new Date().toISOString(),
  solar: SolarData | null = null,
  hsl: WidgetHslData | null = null,
  electricityMonthAverage: number | null = null,
): WidgetV2Payload => {
  const baseFetchedAt = stringValue(base?.updated) ?? generatedAt;
  const hslSection = buildHslSection(hsl, generatedAt);
  const hasHsl = hslSection !== null;
  const sections = [
    buildWeatherSection(base?.weather, solar, baseFetchedAt),
    buildElectricitySection(base?.electricity, electricityMonthAverage, baseFetchedAt),
    buildMarketsSection(base?.markets, baseFetchedAt),
    hslSection,
    buildRatesSection(base?.rates, hasHsl ? '05' : '04', baseFetchedAt),
    buildLiigaSection(liiga, hasHsl ? '06' : '05'),
  ].filter((section): section is WidgetSection => section !== null);

  return {
    schemaVersion: 2,
    minEngineVersion: 2,
    channel,
    generatedAt: baseFetchedAt,
    title: 'CURRENT / SNAPSHOT',
    pageUrl: 'https://aapopihkala.fi/current/snapshot/',
    theme: channel === 'dev' ? DEV_THEME : PROD_THEME,
    layouts: channel === 'dev' ? DEV_LAYOUTS : PROD_LAYOUTS,
    sections,
  };
};

export const onRequestGet = async (context: WidgetV2Context) => {
  const url = new URL(context.request.url);
  const channel = url.searchParams.get('channel') === 'dev' ? 'dev' : 'prod';
  const generatedAt = new Date().toISOString();

  const [baseResponse, liigaResponse, solar, hsl, electricityMonthResponse] = await Promise.all([
    getWidgetResponse({ request: context.request }),
    fetchLiigaResponse(4_000),
    fetchSolarData(),
    fetchWidgetHslData({
      request: context.request,
      apiKey: context.env?.DIGITRANSIT_API_KEY,
      timeoutMs: 4_000,
    }),
    getElectricityMonthResponse(),
  ]);
  const [base, liiga, electricityMonth] = await Promise.all([
    readJson<BaseWidgetData>(baseResponse),
    readJson<LiigaData>(liigaResponse),
    readJson<ElectricityMonthData>(electricityMonthResponse),
  ]);
  const payload = buildWidgetV2Payload(
    base,
    liiga,
    channel,
    generatedAt,
    solar,
    hsl,
    finiteNumber(electricityMonth?.average),
  );
  const hasSections = payload.sections.length > 0;

  return Response.json(
    hasSections ? payload : { ...payload, error: 'widget_data_unavailable' },
    {
      status: hasSections ? 200 : 503,
      headers: {
        'Cache-Control': channel === 'dev'
          ? 'no-store'
          : 'public, max-age=60, s-maxage=180, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
        'X-Widget-Schema': '2',
      },
    }
  );
};