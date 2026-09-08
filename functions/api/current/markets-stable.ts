import { onRequestGet as getResilientMarketsResponse } from './markets-resilient';

type Observation = {
  value: number;
  observedAt: string;
};

type MarketSeries = Observation & {
  id: 'euribor-3m' | 'world';
  change1y: number;
  points: Observation[];
};

type MarketsPayload = {
  items?: unknown;
  series?: unknown;
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

const EURIBOR_CURRENT_XML_URL =
  'https://reports.suomenpankki.fi/WebForms/ReportViewerPage.aspx?output=&report=%2Ftilastot%2Fmarkkina-_ja_hallinnolliset_korot%2Feuribor_korot_today_xml_en';
const EURIBOR_MONTHLY_HISTORY_URL =
  'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?lastNObservations=13&format=csvdata&detail=dataonly';
const WORLD_URLS = [
  'https://query1.finance.yahoo.com/v8/finance/chart/URTH?range=1y&interval=1d',
  'https://query2.finance.yahoo.com/v8/finance/chart/URTH?range=1y&interval=1d',
];
const MAX_SERIES_POINTS = 96;
const BASE_RESPONSE_TIMEOUT_MS = 5_000;
const UPSTREAM_FETCH_TIMEOUT_MS = 5_000;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=1800',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const textContent = (value: string) =>
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#43;|&#x2b;/gi, '+')
    .replace(/&minus;|&#8722;|&#x2212;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const parseCurrentEuribor = (xml: string): Observation => {
  const text = textContent(xml);
  const row = text.match(
    /(\d{4}-\d{2}-\d{2})\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)/
  );

  if (!row) throw new Error('Bank of Finland XML response shape changed');

  const value = Number(row[4]);
  if (!Number.isFinite(value)) throw new Error('Bank of Finland XML 3M Euribor is invalid');

  return { observedAt: row[1], value };
};

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

const parseEcbMonthly = (csv: string): Observation[] => {
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
    const observedAt = /^\d{4}-\d{2}$/.test(rawObservedAt) ? `${rawObservedAt}-01` : rawObservedAt;
    const value = Number(row[valueIndex]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || !Number.isFinite(value)) return [];
    return [{ observedAt, value }];
  });

  if (observations.length < 2) throw new Error('ECB response has too few observations');
  return observations.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const parseYahoo = (data: YahooChartResponse): Observation[] => {
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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const fetchWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const fetchText = async (url: string, accept: string) => {
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: accept,
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Upstream request failed: ${response.status}`);
  return response.text();
};

const fetchWorld = async () => {
  let lastError: unknown;
  for (const url of WORLD_URLS) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
        },
      });
      if (!response.ok) throw new Error(`Yahoo Finance request failed: ${response.status}`);
      return parseYahoo((await response.json()) as YahooChartResponse);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Yahoo Finance request failed');
};

const buildEuriborSeries = (monthly: Observation[], current: Observation): MarketSeries => {
  const byDate = new Map<string, Observation>();
  for (const item of monthly) byDate.set(item.observedAt, item);
  byDate.set(current.observedAt, current);

  const observations = [...byDate.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
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

const hasCompleteFeed = (payload: MarketsPayload) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const series = Array.isArray(payload.series) ? payload.series : [];
  const hasEuriborItem = items.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item as { id?: unknown }).id === 'euribor-3m' &&
      typeof (item as { value?: unknown }).value === 'number'
  );
  const seriesIds = new Set(
    series.flatMap((item) =>
      item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'
        ? [(item as { id: string }).id]
        : []
    )
  );

  return hasEuriborItem && seriesIds.has('euribor-3m') && seriesIds.has('world');
};

const buildStablePayload = async () => {
  const [currentXml, monthlyCsv, worldResult] = await Promise.all([
    fetchText(EURIBOR_CURRENT_XML_URL, 'application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8'),
    fetchText(EURIBOR_MONTHLY_HISTORY_URL, 'text/csv'),
    fetchWorld().then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason })
    ),
  ]);

  const current = parseCurrentEuribor(currentXml);
  const monthly = parseEcbMonthly(monthlyCsv);
  const series: MarketSeries[] = [buildEuriborSeries(monthly, current)];

  if (worldResult.status === 'fulfilled') {
    series.push(buildWorldSeries(worldResult.value));
  }

  return {
    items: [{ id: 'euribor-3m', ...current }],
    series,
    source: 'Bank of Finland XML + ECB + Yahoo Finance',
    recovered: true,
    recovery: 'bof-xml',
  };
};

export const onRequestGetWithBaseTimeout = async (
  context: { request: Request },
  baseResponseTimeoutMs = BASE_RESPONSE_TIMEOUT_MS
) => {
  let baseResponse: Response | null = null;

  try {
    baseResponse = await withTimeout(
      getResilientMarketsResponse(context),
      baseResponseTimeoutMs,
      'Primary market feed'
    );
  } catch {
    // A slow or failed primary feed must not prevent the independent recovery path.
  }

  if (baseResponse?.ok) {
    try {
      const payload = (await baseResponse.clone().json()) as MarketsPayload;
      if (hasCompleteFeed(payload)) return baseResponse;
    } catch {
      // Fall through to the XML-based recovery path.
    }
  }

  try {
    return jsonResponse(await buildStablePayload());
  } catch {
    return baseResponse?.ok ? baseResponse : jsonResponse({ error: 'market_data_unavailable' }, 502);
  }
};

export const onRequestGet = async (context: { request: Request }) =>
  onRequestGetWithBaseTimeout(context);
