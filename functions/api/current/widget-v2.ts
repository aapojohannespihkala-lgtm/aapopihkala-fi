import { fetchLiigaResponse } from './liiga';
import { onRequestGet as getWidgetResponse } from './widget';

type Tone = 'neutral' | 'positive' | 'negative' | 'accent';
type WidgetRow = { label: string; value: string; tone?: Tone };
type WidgetColumn = { label: string; value: string; tone?: Tone };

export type WidgetSection = {
  id: string;
  index: string;
  label: string;
  primary: string;
  secondary?: string;
  detail?: string;
  tone?: Tone;
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
  refreshMinutes: number;
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

type LiigaData = {
  ilvesStanding?: unknown;
  liveIlvesGame?: unknown;
  nextIlvesGame?: unknown;
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
  large: ['weather', 'electricity', 'markets', 'rates', 'liiga'],
};
const DEV_LAYOUTS: WidgetLayouts = { ...PROD_LAYOUTS };

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

const weatherColumns = (value: unknown): WidgetColumn[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    const item = asRecord(raw);
    if (!item) return [];
    const time = stringValue(item.time);
    const temperature = finiteNumber(item.temperature);
    if (!time || temperature === null) return [];
    return [{ label: time, value: formatDegree(temperature) }];
  }).slice(0, 4);
};

const buildWeatherSection = (value: unknown): WidgetSection | null => {
  const weather = asRecord(value);
  if (!weather) return null;
  const temperature = finiteNumber(weather.temperature);
  const low = finiteNumber(weather.min);
  const high = finiteNumber(weather.max);
  const location = stringValue(weather.location);
  const condition = stringValue(weather.condition);
  if (temperature === null && low === null && high === null) return null;
  const range = low === null && high === null ? '' : `${formatTemperature(low)} / ${formatTemperature(high)}`;
  const detail = [condition, range].filter(Boolean).join(' / ');

  return {
    id: 'weather',
    index: '01',
    label: 'WEATHER',
    primary: formatTemperature(temperature),
    secondary: location ?? undefined,
    detail: detail || undefined,
    columns: weatherColumns(weather.forecast),
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

const buildElectricitySection = (value: unknown): WidgetSection | null => {
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
    detail: `NOW ${formatNumber(price)}  LOW ${formatNumber(low)}  HIGH ${formatNumber(high)}`,
    bars: hourlyBars(electricity.series),
  };
};

const marketRow = (label: string, value: unknown): WidgetRow => {
  const number = finiteNumber(value);
  return { label, value: formatPercent(number, true, 2), tone: toneFor(number) };
};

const buildMarketsSection = (value: unknown): WidgetSection | null => {
  const markets = asRecord(value);
  if (!markets) return null;
  const median = finiteNumber(markets.median);
  const rows = [
    marketRow('WORLD', markets.world),
    marketRow('USA', markets.usa),
    marketRow('FINLAND', markets.finland),
    marketRow('BTC / EUR', markets.btcEur),
    marketRow('REMEDY', markets.remedy),
  ];
  if (median === null && rows.every((row) => row.value === '--')) return null;
  return {
    id: 'markets',
    index: '03',
    label: 'MARKETS',
    primary: formatPercent(median, true, 2),
    secondary: '1D / MEDIAN',
    tone: toneFor(median),
    rows,
  };
};

const buildRatesSection = (value: unknown): WidgetSection | null => {
  const rates = asRecord(value);
  if (!rates) return null;
  const current = finiteNumber(rates.euribor3m);
  const yearAgo = finiteNumber(rates.yearAgo);
  if (current === null && yearAgo === null) return null;
  return {
    id: 'rates',
    index: '04',
    label: 'RATES',
    primary: formatPercent(current, false, 2),
    secondary: '3M EURIBOR',
    detail: `1Y AGO ${formatPercent(yearAgo, false, 2)}`,
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

const buildLiigaSection = (value: unknown): WidgetSection | null => {
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
      index: '05',
      label: 'LIIGA',
      primary: homeGoals !== null && awayGoals !== null ? `${homeGoals.toFixed(0)}-${awayGoals.toFixed(0)}` : 'LIVE',
      secondary: 'ILVES / LIVE',
      tone: 'accent',
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
    index: '05',
    label: 'LIIGA',
    primary: rank !== null && totalTeams !== null ? `${rank.toFixed(0)}/${totalTeams.toFixed(0)}` : 'ILVES',
    secondary: 'ILVES / STANDING',
    rows,
  };
};

export const buildWidgetV2Payload = (
  base: BaseWidgetData | null,
  liiga: LiigaData | null,
  channel: 'prod' | 'dev',
  generatedAt = new Date().toISOString(),
): WidgetV2Payload => {
  const sections = [
    buildWeatherSection(base?.weather),
    buildElectricitySection(base?.electricity),
    buildMarketsSection(base?.markets),
    buildRatesSection(base?.rates),
    buildLiigaSection(liiga),
  ].filter((section): section is WidgetSection => section !== null);

  return {
    schemaVersion: 2,
    minEngineVersion: 2,
    channel,
    generatedAt: stringValue(base?.updated) ?? generatedAt,
    refreshMinutes: 15,
    title: 'CURRENT / SNAPSHOT',
    pageUrl: 'https://aapopihkala.fi/current/snapshot/',
    theme: channel === 'dev' ? DEV_THEME : PROD_THEME,
    layouts: channel === 'dev' ? DEV_LAYOUTS : PROD_LAYOUTS,
    sections,
  };
};

export const onRequestGet = async (context: { request: Request }) => {
  const url = new URL(context.request.url);
  const channel = url.searchParams.get('channel') === 'dev' ? 'dev' : 'prod';

  const [baseResponse, liigaResponse] = await Promise.all([
    getWidgetResponse({ request: context.request }),
    fetchLiigaResponse(4_000),
  ]);
  const [base, liiga] = await Promise.all([
    readJson<BaseWidgetData>(baseResponse),
    readJson<LiigaData>(liigaResponse),
  ]);
  const payload = buildWidgetV2Payload(base, liiga, channel);
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
