type MarketPerformanceId =
  | 'ishares-world'
  | 'ishares-europe'
  | 'franklin-sp500-climate'
  | 'xact-norden'
  | 'nordea'
  | 'marimekko'
  | 'remedy'
  | 'btc'
  | 'bnb'
  | 'eth';

type Observation = {
  value: number;
  observedAt: string;
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

type PerformanceSpec = {
  id: MarketPerformanceId;
  label: string;
  symbol: string;
};

type MarketPerformanceChanges = {
  today: number | null;
  week1: number | null;
  month1: number | null;
  month3: number | null;
  month6: number | null;
  ytd: number | null;
  year1: number | null;
  year3: number | null;
  year5: number | null;
};

type MarketPerformanceItem = PerformanceSpec & {
  price: number;
  observedAt: string;
  changes: MarketPerformanceChanges;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPECTED_HOLDINGS = 19;

const LIVE_SPECS: PerformanceSpec[] = [
  { id: 'ishares-world', label: 'ISHARES CORE MSCI WORLD UCITS ETF USD (ACC)', symbol: 'EUNL.DE' },
  { id: 'ishares-europe', label: 'ISHARES CORE MSCI EUROPE UCITS ETF EUR (ACC)', symbol: 'EUNK.DE' },
  {
    id: 'franklin-sp500-climate',
    label: 'FRANKLIN S&P 500 PARIS ALIGNED CLIMATE UCITS ETF',
    symbol: 'FLX5.DE',
  },
  { id: 'xact-norden', label: 'XACT NORDEN', symbol: 'XACT-NORDEN.ST' },
  { id: 'nordea', label: 'NORDEA', symbol: 'NDA-FI.HE' },
  { id: 'marimekko', label: 'MARIMEKKO', symbol: 'MEKKO.HE' },
  { id: 'remedy', label: 'REMEDY', symbol: 'REMEDY.HE' },
  { id: 'btc', label: 'BTC', symbol: 'BTC-EUR' },
  { id: 'bnb', label: 'BNB', symbol: 'BNB-EUR' },
  { id: 'eth', label: 'ETH', symbol: 'ETH-EUR' },
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });

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

const fetchYahooObservations = async (symbol: string) => {
  const encoded = encodeURIComponent(symbol);
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=10y&interval=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?range=10y&interval=1d`,
  ];
  let lastError: unknown;

  for (const url of urls) {
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

const findReference = (observations: Observation[], targetTime: number): Observation | null => {
  let candidate: Observation | null = null;

  for (const item of observations) {
    const itemTime = Date.parse(`${item.observedAt}T00:00:00Z`);
    if (itemTime > targetTime) break;
    candidate = item;
  }

  return candidate;
};

const percentChange = (latest: number, reference: Observation | null) => {
  if (!reference || !Number.isFinite(reference.value) || reference.value === 0) return null;
  return (latest / reference.value - 1) * 100;
};

const yearsBefore = (time: number, years: number) => {
  const date = new Date(time);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.getTime();
};

const buildPerformanceItem = (
  spec: PerformanceSpec,
  observations: Observation[]
): MarketPerformanceItem => {
  const latest = observations.at(-1);
  const previous = observations.at(-2);
  if (!latest || !previous) throw new Error(`${spec.id} observations are incomplete`);

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const latestDate = new Date(latestTime);
  const previousYearEnd = Date.UTC(latestDate.getUTCFullYear(), 0, 1) - DAY_MS;

  return {
    ...spec,
    price: latest.value,
    observedAt: latest.observedAt,
    changes: {
      today: (latest.value / previous.value - 1) * 100,
      week1: percentChange(latest.value, findReference(observations, latestTime - 7 * DAY_MS)),
      month1: percentChange(latest.value, findReference(observations, latestTime - 30 * DAY_MS)),
      month3: percentChange(latest.value, findReference(observations, latestTime - 92 * DAY_MS)),
      month6: percentChange(latest.value, findReference(observations, latestTime - 183 * DAY_MS)),
      ytd: percentChange(latest.value, findReference(observations, previousYearEnd)),
      year1: percentChange(latest.value, findReference(observations, yearsBefore(latestTime, 1))),
      year3: percentChange(latest.value, findReference(observations, yearsBefore(latestTime, 3))),
      year5: percentChange(latest.value, findReference(observations, yearsBefore(latestTime, 5))),
    },
  };
};

export const onRequestGet = async () => {
  try {
    const settled = await Promise.allSettled(
      LIVE_SPECS.map(async (spec) =>
        buildPerformanceItem(spec, await fetchYahooObservations(spec.symbol))
      )
    );

    const items = settled.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : []
    );
    const unavailable = settled.flatMap((result, index) =>
      result.status === 'rejected' ? [LIVE_SPECS[index].id] : []
    );

    return jsonResponse({
      items,
      expected: EXPECTED_HOLDINGS,
      liveExpected: LIVE_SPECS.length,
      unavailable,
      source: 'Yahoo Finance',
      version: 2,
    });
  } catch {
    return jsonResponse({
      items: [],
      expected: EXPECTED_HOLDINGS,
      liveExpected: LIVE_SPECS.length,
      unavailable: LIVE_SPECS.map((spec) => spec.id),
      source: 'Yahoo Finance',
      version: 2,
    });
  }
};
