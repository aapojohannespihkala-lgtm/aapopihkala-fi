type MarketPerformanceId =
  | 'handelsbanken-usa'
  | 'nordnet-finland'
  | 'ishares-world'
  | 'ishares-europe'
  | 'nordnet-sweden'
  | 'spiltan-investmentbolag'
  | 'storebrand-japan'
  | 'franklin-sp500-climate'
  | 'xact-norden'
  | 'nordea'
  | 'marimekko'
  | 'remedy'
  | 'op-asia-index-a'
  | 'op-europe-index-a'
  | 'op-world-index-a'
  | 'op-forest-owner-b'
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
  symbol?: string;
};

type LivePerformanceSpec = PerformanceSpec & {
  symbol: string;
};

type MarketPerformanceItem = LivePerformanceSpec & {
  price: number;
  observedAt: string;
  changes: {
    today: number;
    week1: number;
    month1: number;
    month6: number;
    year1: number;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const YAHOO_BATCH_SIZE = 2;
const YAHOO_BATCH_PAUSE_MS = 220;
const YAHOO_RETRY_PAUSE_MS = 180;

// Current2 portfolio prototype. Exchange-traded holdings and crypto use exact Yahoo symbols.
// Traditional funds stay in the expected count but are intentionally not proxied
// with an index: their exact NAV/history adapters will be added separately.
const PERFORMANCE_SPECS: PerformanceSpec[] = [
  { id: 'handelsbanken-usa', label: 'HANDELSBANKEN USA INDEKSI' },
  { id: 'nordnet-finland', label: 'NORDNET SUOMI INDEKSI' },
  { id: 'ishares-world', label: 'ISHARES CORE MSCI WORLD UCITS ETF USD (ACC)', symbol: 'EUNL.DE' },
  { id: 'ishares-europe', label: 'ISHARES CORE MSCI EUROPE UCITS ETF EUR (ACC)', symbol: 'EUNK.DE' },
  { id: 'nordnet-sweden', label: 'NORDNET SVERIGE INDEX' },
  { id: 'spiltan-investmentbolag', label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG' },
  { id: 'storebrand-japan', label: 'STOREBRAND JAPAN A EUR' },
  { id: 'franklin-sp500-climate', label: 'FRANKLIN S&P 500 PARIS ALIGNED CLIMATE UCITS ETF', symbol: 'FLX5.DE' },
  { id: 'xact-norden', label: 'XACT NORDEN', symbol: 'XACT-NORDEN.ST' },
  { id: 'nordea', label: 'NORDEA', symbol: 'NDA-FI.HE' },
  { id: 'marimekko', label: 'MARIMEKKO', symbol: 'MEKKO.HE' },
  { id: 'remedy', label: 'REMEDY', symbol: 'REMEDY.HE' },
  { id: 'op-asia-index-a', label: 'OP-AASIA INDEKSI A' },
  { id: 'op-europe-index-a', label: 'OP-EUROOPPA INDEKSI A' },
  { id: 'op-world-index-a', label: 'OP-MAAILMA INDEKSI A' },
  { id: 'op-forest-owner-b', label: 'OP-METSÄNOMISTAJA B' },
  { id: 'btc', label: 'BTC', symbol: 'BTC-EUR' },
  { id: 'bnb', label: 'BNB', symbol: 'BNB-EUR' },
  { id: 'eth', label: 'ETH', symbol: 'ETH-EUR' },
];

const LIVE_SPECS = PERFORMANCE_SPECS.filter(
  (spec): spec is LivePerformanceSpec => typeof spec.symbol === 'string'
);

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const jsonResponse = (body: unknown, status: number) =>
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
  const period2 = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const period1 = period2 - 740 * 24 * 60 * 60;
  const query = `period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?${query}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?${query}`,
  ];
  let lastError: unknown;

  for (let index = 0; index < urls.length; index += 1) {
    try {
      const response = await fetch(urls[index], {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
        },
      });
      if (!response.ok) throw new Error(`Yahoo Finance request failed: ${response.status}`);
      return parseYahooObservations((await response.json()) as YahooChartResponse);
    } catch (error) {
      lastError = error;
      if (index < urls.length - 1) await sleep(YAHOO_RETRY_PAUSE_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Yahoo Finance request failed');
};

const findReference = (observations: Observation[], targetTime: number) => {
  let candidate = observations[0];

  for (const item of observations) {
    const itemTime = Date.parse(`${item.observedAt}T00:00:00Z`);
    if (itemTime > targetTime) break;
    candidate = item;
  }

  return candidate;
};

const percentChange = (latest: number, reference: number) => {
  if (!Number.isFinite(reference) || reference === 0) return 0;
  return (latest / reference - 1) * 100;
};

const buildPerformanceItem = (
  spec: LivePerformanceSpec,
  observations: Observation[]
): MarketPerformanceItem => {
  const latest = observations.at(-1);
  const previous = observations.at(-2);
  if (!latest || !previous) throw new Error(`${spec.id} observations are incomplete`);

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const week = findReference(observations, latestTime - 7 * DAY_MS);
  const month = findReference(observations, latestTime - 30 * DAY_MS);
  const sixMonths = findReference(observations, latestTime - 183 * DAY_MS);
  const year = findReference(observations, latestTime - 365 * DAY_MS);

  return {
    ...spec,
    price: latest.value,
    observedAt: latest.observedAt,
    changes: {
      today: percentChange(latest.value, previous.value),
      week1: percentChange(latest.value, week.value),
      month1: percentChange(latest.value, month.value),
      month6: percentChange(latest.value, sixMonths.value),
      year1: percentChange(latest.value, year.value),
    },
  };
};

const fetchLivePerformance = async () => {
  const settled: PromiseSettledResult<MarketPerformanceItem>[] = [];

  for (let index = 0; index < LIVE_SPECS.length; index += YAHOO_BATCH_SIZE) {
    const batch = LIVE_SPECS.slice(index, index + YAHOO_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (spec) =>
        buildPerformanceItem(spec, await fetchYahooObservations(spec.symbol))
      )
    );

    settled.push(...results);

    if (index + YAHOO_BATCH_SIZE < LIVE_SPECS.length) {
      await sleep(YAHOO_BATCH_PAUSE_MS);
    }
  }

  return settled;
};

export const onRequestGet = async () => {
  const settled = await fetchLivePerformance();

  const items = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : []
  );
  const unavailable = settled.flatMap((result, index) =>
    result.status === 'rejected' ? [LIVE_SPECS[index].id] : []
  );

  return jsonResponse(
    {
      items,
      expected: PERFORMANCE_SPECS.length,
      liveExpected: LIVE_SPECS.length,
      unavailable,
      source: 'Yahoo Finance + exact fund NAV adapters pending',
    },
    200
  );
};
