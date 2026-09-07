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
  price: number | null;
  observedAt: string;
  changes: MarketPerformanceChanges;
};

type OpFundSpec = PerformanceSpec & {
  url: string;
  rowLabel: string;
};

type NordnetFundSpec = PerformanceSpec & {
  url: string;
  rowLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPECTED_HOLDINGS = 19;

const YAHOO_SPECS: PerformanceSpec[] = [
  {
    id: 'handelsbanken-usa',
    label: 'HANDELSBANKEN USA INDEKSI',
    symbol: '0P00015D8I.ST',
  },
  {
    id: 'nordnet-finland',
    label: 'NORDNET SUOMI INDEKSI',
    symbol: '0P000134K9.ST',
  },
  { id: 'ishares-world', label: 'ISHARES CORE MSCI WORLD UCITS ETF USD (ACC)', symbol: 'EUNL.DE' },
  { id: 'ishares-europe', label: 'ISHARES CORE MSCI EUROPE UCITS ETF EUR (ACC)', symbol: 'EUNK.DE' },
  {
    id: 'nordnet-sweden',
    label: 'NORDNET SVERIGE INDEX',
    symbol: '0P0000J24W.ST',
  },
  {
    id: 'spiltan-investmentbolag',
    label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG',
    symbol: '0P0000ULAP.ST',
  },
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

const OP_SPECS: OpFundSpec[] = [
  {
    id: 'op-asia-index-a',
    label: 'OP-AASIA INDEKSI A',
    symbol: 'FI4000029491',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-asia-index',
    rowLabel: 'OP-Asia Index A',
  },
  {
    id: 'op-europe-index-a',
    label: 'OP-EUROOPPA INDEKSI A',
    symbol: 'FI4000029301',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-europe-index',
    rowLabel: 'OP-Europe Index A',
  },
  {
    id: 'op-world-index-a',
    label: 'OP-MAAILMA INDEKSI A',
    symbol: 'FI4000261128',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-world-index',
    rowLabel: 'OP-World Index A',
  },
  {
    id: 'op-forest-owner-b',
    label: 'OP-METSÄNOMISTAJA B',
    symbol: 'FI4000108436',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-forest-owner',
    rowLabel: 'OP-Forest Owner B',
  },
];

const NORDNET_FALLBACK_SPECS: NordnetFundSpec[] = [
  {
    id: 'handelsbanken-usa',
    label: 'HANDELSBANKEN USA INDEKSI',
    symbol: 'SE0006800140',
    url: 'https://www.nordnet.fi/rahastot/lista/handelsbanken-usa-index-a1-eur-348def3b',
    rowLabel: 'Handelsbanken Usa Indeksi',
  },
  {
    id: 'nordnet-finland',
    label: 'NORDNET SUOMI INDEKSI',
    symbol: 'SE0005993102',
    url: 'https://www.nordnet.fi/rahastot/lista/nordnet-suomi-indeksi-eur-a401761d',
    rowLabel: 'Nordnet Suomi Indeksi',
  },
  {
    id: 'nordnet-sweden',
    label: 'NORDNET SVERIGE INDEX',
    symbol: 'SE0002756973',
    url: 'https://www.nordnet.fi/rahastot/lista/nordnet-sverige-index-sek-aa7a9014',
    rowLabel: 'Nordnet Sverige Index',
  },
  {
    id: 'spiltan-investmentbolag',
    label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG',
    symbol: 'SE0004297927',
    url: 'https://www.nordnet.fi/rahastot/lista/spiltan-aktiefond-investmentbolag-sek-d8fe1a7e',
    rowLabel: 'Spiltan Aktiefond Investmentbolag',
  },
];

const STOREBRAND_SPEC: NordnetFundSpec = {
  id: 'storebrand-japan',
  label: 'STOREBRAND JAPAN A EUR',
  symbol: 'SE0013801479',
  url: 'https://www.nordnet.fi/rahastot/lista/storebrand-japan-a-eur-dbe9644c',
  rowLabel: 'Storebrand Japan A EUR',
};

const NORDNET_FALLBACK_BY_ID = new Map(
  NORDNET_FALLBACK_SPECS.map((spec) => [spec.id, spec] as const)
);

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

const buildYahooPerformanceItem = (
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

const htmlToText = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&minus;|&#8722;|&#x2212;/gi, '−')
    .replace(/&#43;|&#x2b;/gi, '+')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const parsePercentToken = (token: string): number | null => {
  const normalized = token.trim().replace(/−/g, '-');
  if (normalized === '-') return null;
  const value = Number(normalized.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(value) ? value : null;
};

const extractReturnTokens = (segment: string, count: number) => {
  const matches = segment.match(/[+−-]?\d+(?:[.,]\d+)?\s*%|\s-\s/g) ?? [];
  return matches.slice(0, count).map(parsePercentToken);
};

const extractFundRow = (
  text: string,
  sectionTitle: string,
  nextSectionTitle: string,
  rowLabel: string,
  count: number
) => {
  const sectionStart = text.indexOf(sectionTitle);
  if (sectionStart < 0) throw new Error(`${sectionTitle} section is missing`);
  const nextSection = text.indexOf(nextSectionTitle, sectionStart + sectionTitle.length);
  const section = text.slice(sectionStart, nextSection > sectionStart ? nextSection : undefined);
  const rowStart = section.indexOf(rowLabel);
  if (rowStart < 0) throw new Error(`${rowLabel} row is missing`);

  const values = extractReturnTokens(
    section.slice(rowStart + rowLabel.length, rowStart + rowLabel.length + 420),
    count
  );
  if (values.length < count) throw new Error(`${rowLabel} return row is incomplete`);
  return values;
};

const inferObservationDate = (day: number, month: number) => {
  const now = new Date();
  let year = now.getUTCFullYear();
  let candidate = Date.UTC(year, month - 1, day);
  if (candidate > now.getTime() + 31 * DAY_MS) {
    year -= 1;
    candidate = Date.UTC(year, month - 1, day);
  }
  return new Date(candidate).toISOString().slice(0, 10);
};

const extractOpObservationDate = (text: string) => {
  const match = text.match(/Accumulated profit\s*\((\d{1,2})\.(\d{1,2})\)/i);
  if (!match) return new Date().toISOString().slice(0, 10);
  return inferObservationDate(Number(match[1]), Number(match[2]));
};

const annualizedToCumulative = (value: number | null, years: number) => {
  if (value === null) return null;
  return (Math.pow(1 + value / 100, years) - 1) * 100;
};

const fetchOpFund = async (spec: OpFundSpec): Promise<MarketPerformanceItem> => {
  const response = await fetch(spec.url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`OP request failed: ${response.status}`);

  const text = htmlToText(await response.text());
  const accumulated = extractFundRow(
    text,
    'Accumulated profit',
    'Yearly performance',
    spec.rowLabel,
    6
  );
  const yearly = extractFundRow(
    text,
    'Yearly performance',
    'Key figures',
    spec.rowLabel,
    6
  );

  return {
    id: spec.id,
    label: spec.label,
    symbol: spec.symbol,
    price: null,
    observedAt: extractOpObservationDate(text),
    changes: {
      today: null,
      week1: null,
      month1: accumulated[0],
      month3: accumulated[1],
      month6: accumulated[2],
      ytd: yearly[5],
      year1: accumulated[3],
      year3: annualizedToCumulative(accumulated[4], 3),
      year5: annualizedToCumulative(accumulated[5], 5),
    },
  };
};

const fetchNordnetFund = async (spec: NordnetFundSpec): Promise<MarketPerformanceItem> => {
  const response = await fetch(spec.url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Nordnet request failed: ${response.status}`);

  const text = htmlToText(await response.text());
  const titleIndex = text.indexOf(spec.rowLabel);
  if (titleIndex < 0) throw new Error(`${spec.rowLabel} row is missing`);

  const summary = text.slice(titleIndex + spec.rowLabel.length, titleIndex + spec.rowLabel.length + 420);
  const dailyMatch = summary.match(/([+−-]?\d+(?:[.,]\d+)?)\s*%\s*(\d{1,2})\.(\d{1,2})\./);
  const yearMatch = summary.match(/([+−-]?\d+(?:[.,]\d+)?)\s*%\s*12\s*kk/i);
  const navDateMatch = summary.match(/NAV\s*\((\d{1,2})\.(\d{1,2})\.\)/i);
  if (!yearMatch) throw new Error(`${spec.rowLabel} 12 month return is missing`);

  const today = dailyMatch ? parsePercentToken(`${dailyMatch[1]}%`) : null;
  const year1 = parsePercentToken(`${yearMatch[1]}%`);
  const dateMatch = dailyMatch ?? navDateMatch;
  const observedAt = dateMatch
    ? inferObservationDate(Number(dateMatch[2]), Number(dateMatch[3]))
    : new Date().toISOString().slice(0, 10);

  return {
    id: spec.id,
    label: spec.label,
    symbol: spec.symbol,
    price: null,
    observedAt,
    changes: {
      today,
      week1: null,
      month1: null,
      month3: null,
      month6: null,
      ytd: null,
      year1,
      year3: null,
      year5: null,
    },
  };
};

const loadYahooWithFallback = async (spec: PerformanceSpec): Promise<MarketPerformanceItem> => {
  try {
    return buildYahooPerformanceItem(spec, await fetchYahooObservations(spec.symbol));
  } catch (error) {
    const fallback = NORDNET_FALLBACK_BY_ID.get(spec.id);
    if (!fallback) throw error;
    return fetchNordnetFund(fallback);
  }
};

export const onRequestGet = async () => {
  const tasks: Array<{ id: MarketPerformanceId; load: () => Promise<MarketPerformanceItem> }> = [
    ...YAHOO_SPECS.map((spec) => ({
      id: spec.id,
      load: () => loadYahooWithFallback(spec),
    })),
    ...OP_SPECS.map((spec) => ({ id: spec.id, load: () => fetchOpFund(spec) })),
    { id: STOREBRAND_SPEC.id, load: () => fetchNordnetFund(STOREBRAND_SPEC) },
  ];

  const settled = await Promise.allSettled(tasks.map((task) => task.load()));
  const items = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : []
  );
  const unavailable = settled.flatMap((result, index) =>
    result.status === 'rejected' ? [tasks[index].id] : []
  );

  return jsonResponse({
    items,
    expected: EXPECTED_HOLDINGS,
    liveExpected: tasks.length,
    unavailable,
    source: 'Yahoo Finance + OP + Nordnet',
    version: 4,
  });
};