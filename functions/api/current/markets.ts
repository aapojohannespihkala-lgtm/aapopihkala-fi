type MarketMacroId = 'euribor-3m';
type MarketSeriesId = 'euribor-3m' | 'world';

type Observation = {
  value: number;
  observedAt: string;
};

type MarketMacroItem = Observation & {
  id: MarketMacroId;
};

type MarketSeries = Observation & {
  id: MarketSeriesId;
  change1y: number;
  points: Observation[];
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: unknown;
      indicators?: {
        quote?: Array<{
          close?: unknown;
        }>;
      };
    }>;
  };
};

const ECB_BASE_URL = 'https://data-api.ecb.europa.eu/service/data';
const EURIBOR_MONTHLY_HISTORY_URL = `${ECB_BASE_URL}/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?lastNObservations=13&format=csvdata&detail=dataonly`;
const EURIBOR_URL =
  'https://www.suomenpankki.fi/en/statistics/interest-rates-and-exchange-rates/euribor-rates/';
const EURIBOR_DAILY_HISTORY_URL =
  'https://reports.suomenpankki.fi/WebForms/ReportViewerPage.aspx?output=&report=%2Ftilastot%2Fmarkkina-_ja_hallinnolliset_korot%2Feuriborkorot_pv_chrt_en';
const WORLD_SYMBOL = 'URTH';
const WORLD_URLS = [
  `https://query1.finance.yahoo.com/v8/finance/chart/${WORLD_SYMBOL}?range=1y&interval=1d`,
  `https://query2.finance.yahoo.com/v8/finance/chart/${WORLD_SYMBOL}?range=1y&interval=1d`,
];
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SERIES_POINTS = 96;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const parseEcbObservations = (csv: string): Observation[] => {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) throw new Error('ECB response has no observations');

  const headers = parseCsvLine(lines[0]);
  const timeIndex = headers.indexOf('TIME_PERIOD');
  const valueIndex = headers.indexOf('OBS_VALUE');

  if (timeIndex < 0 || valueIndex < 0) throw new Error('ECB response shape changed');

  const observations = lines.slice(1).flatMap((line) => {
    const row = parseCsvLine(line);
    const rawObservedAt = row[timeIndex] ?? '';
    const value = Number(row[valueIndex]);
    const observedAt = /^\d{4}-\d{2}$/.test(rawObservedAt) ? `${rawObservedAt}-01` : rawObservedAt;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || !Number.isFinite(value)) return [];
    return [{ value, observedAt }];
  });

  if (observations.length < 2) throw new Error('ECB response has too few observations');
  return observations.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const htmlToText = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#43;|&#x2b;/gi, '+')
    .replace(/&minus;|&#8722;|&#x2212;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const toIsoDate = (day: string, month: string, year: string) => {
  const monthIndex = MONTHS[month];
  if (monthIndex === undefined) throw new Error('Bank of Finland date is invalid');
  return new Date(Date.UTC(Number(year), monthIndex, Number(day))).toISOString().slice(0, 10);
};

const parseEuribor3mObservations = (html: string): Observation[] => {
  const text = htmlToText(html);
  const rowPattern =
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)/g;
  const byDate = new Map<string, Observation>();

  for (const match of text.matchAll(rowPattern)) {
    const observedAt = toIsoDate(match[1], match[2], match[3]);
    const value = Number(match[6]);
    if (Number.isFinite(value)) byDate.set(observedAt, { observedAt, value });
  }

  const observations = [...byDate.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  if (observations.length < 2) throw new Error('Bank of Finland response has too few Euribor observations');
  return observations;
};

const fetchEuribor3m = async (): Promise<MarketMacroItem> => {
  const response = await fetch(EURIBOR_URL, {
    headers: { Accept: 'text/html' },
  });

  if (!response.ok) throw new Error(`Bank of Finland request failed: ${response.status}`);

  const observations = parseEuribor3mObservations(await response.text());
  const latest = observations.at(-1);
  if (!latest) throw new Error('Euribor latest observation is missing');

  return {
    id: 'euribor-3m',
    ...latest,
  };
};

const fetchEuriborMonthlyHistory = async () => {
  const response = await fetch(EURIBOR_MONTHLY_HISTORY_URL, {
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) throw new Error(`ECB Euribor history request failed: ${response.status}`);
  return parseEcbObservations(await response.text());
};

const fetchEuriborDailyHistory = async () => {
  const response = await fetch(EURIBOR_DAILY_HISTORY_URL, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });

  if (!response.ok) throw new Error(`Bank of Finland Euribor history request failed: ${response.status}`);
  return parseEuribor3mObservations(await response.text());
};

const parseYahooObservations = (data: YahooChartResponse): Observation[] => {
  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    throw new Error('Yahoo Finance response shape changed');
  }

  const observations: Observation[] = [];
  const count = Math.min(timestamps.length, closes.length);

  for (let index = 0; index < count; index += 1) {
    const timestamp = timestamps[index];
    const value = closes[index];
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;

    observations.push({
      observedAt: new Date(timestamp * 1000).toISOString().slice(0, 10),
      value,
    });
  }

  if (observations.length < 2) throw new Error('Yahoo Finance response has too few observations');
  return observations.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const fetchWorldObservations = async () => {
  let lastError: unknown;

  for (const url of WORLD_URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
        },
      });

      if (!response.ok) throw new Error(`Yahoo Finance request failed: ${response.status}`);
      return parseYahooObservations((await response.json()) as YahooChartResponse);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Yahoo Finance request failed');
};

const sampleObservations = (observations: Observation[]) => {
  if (observations.length <= MAX_SERIES_POINTS) return observations;

  const sampled: Observation[] = [observations[0]];
  const step = (observations.length - 1) / (MAX_SERIES_POINTS - 1);

  for (let index = 1; index < MAX_SERIES_POINTS - 1; index += 1) {
    sampled.push(observations[Math.round(index * step)]);
  }

  sampled.push(observations.at(-1) as Observation);
  return sampled;
};

const buildEuriborSeries = (
  histories: Observation[][],
  current: MarketMacroItem
): MarketSeries => {
  const byDate = new Map<string, Observation>();

  for (const history of histories) {
    for (const item of history) byDate.set(item.observedAt, item);
  }

  byDate.set(current.observedAt, { value: current.value, observedAt: current.observedAt });

  const latestTime = Date.parse(`${current.observedAt}T00:00:00Z`);
  const cutoffTime = latestTime - 370 * DAY_MS;
  const observations = [...byDate.values()]
    .filter((item) => Date.parse(`${item.observedAt}T00:00:00Z`) >= cutoffTime)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const first = observations[0];

  if (!first || observations.length < 2) throw new Error('Euribor one-year history is incomplete');

  return {
    id: 'euribor-3m',
    value: current.value,
    observedAt: current.observedAt,
    change1y: current.value - first.value,
    points: sampleObservations(observations),
  };
};

const buildWorldSeries = (observations: Observation[]): MarketSeries => {
  const first = observations[0];
  const latest = observations.at(-1);

  if (!first || !latest || first.value === 0) throw new Error('World series is invalid');

  return {
    id: 'world',
    value: latest.value,
    observedAt: latest.observedAt,
    change1y: (latest.value / first.value - 1) * 100,
    points: sampleObservations(observations),
  };
};

export const onRequestGet = async () => {
  try {
    const euribor = await fetchEuribor3m();
    const [euriborMonthlyResult, euriborDailyResult, worldResult] = await Promise.allSettled([
      fetchEuriborMonthlyHistory(),
      fetchEuriborDailyHistory(),
      fetchWorldObservations(),
    ]);
    const series: MarketSeries[] = [];
    const euriborHistories: Observation[][] = [];

    if (euriborMonthlyResult.status === 'fulfilled') {
      euriborHistories.push(euriborMonthlyResult.value);
    }

    if (euriborDailyResult.status === 'fulfilled') {
      euriborHistories.push(euriborDailyResult.value);
    }

    if (euriborHistories.length > 0) {
      try {
        series.push(buildEuriborSeries(euriborHistories, euribor));
      } catch {
        // Keep the live Euribor value available even if its history is incomplete.
      }
    }

    if (worldResult.status === 'fulfilled') {
      try {
        series.push(buildWorldSeries(worldResult.value));
      } catch {
        // The world chart is optional and must not take down the Euribor reading.
      }
    }

    return jsonResponse(
      {
        items: [euribor],
        series,
        source: 'Bank of Finland + ECB + Yahoo Finance',
      },
      200
    );
  } catch {
    return jsonResponse({ error: 'market_data_unavailable' }, 502);
  }
};