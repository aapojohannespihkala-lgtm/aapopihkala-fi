import { onRequestGet as getRecoveredPortfolio } from './portfolio-recovered';

type PerformanceChanges = {
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

type PortfolioItem = {
  id: string;
  label: string;
  symbol: string;
  price: number | null;
  observedAt: string;
  changes: PerformanceChanges;
};

type RecoveryError = {
  id: string;
  stage: string;
  message: string;
};

type PortfolioResponse = {
  items: PortfolioItem[];
  expected: number;
  liveExpected: number;
  unavailable: string[];
  source: string;
  version: number;
  recoveryErrors?: RecoveryError[];
};

type OpFallbackSpec = {
  id: 'op-asia-index-a' | 'op-europe-index-a' | 'op-world-index-a' | 'op-forest-owner-b';
  label: string;
  isin: string;
  investingUrl: string;
  quarterly?: boolean;
};

type Observation = {
  observedAt: string;
  value: number;
};

type InvestingHistoryRow = {
  rowDateTimestamp?: unknown;
  rowDateRaw?: unknown;
  last_closeRaw?: unknown;
  last_close?: unknown;
};

type InvestingHistoryResponse = {
  data?: unknown;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 230;

const OP_FALLBACK_SPECS: OpFallbackSpec[] = [
  {
    id: 'op-asia-index-a',
    label: 'OP-AASIA INDEKSI A',
    isin: 'FI4000029491',
    investingUrl: 'https://fi.investing.com/funds/op-aasia-indeksi-a',
  },
  {
    id: 'op-europe-index-a',
    label: 'OP-EUROOPPA INDEKSI A',
    isin: 'FI4000029301',
    investingUrl: 'https://fi.investing.com/funds/op-eurooppa-indeksi-a',
  },
  {
    id: 'op-world-index-a',
    label: 'OP-MAAILMA INDEKSI A',
    isin: 'FI4000261128',
    investingUrl: 'https://fi.investing.com/funds/fi4000261128',
  },
  {
    id: 'op-forest-owner-b',
    label: 'OP-METSÄNOMISTAJA B',
    isin: 'FI4000108436',
    investingUrl: 'https://fi.investing.com/funds/op-metsanomistaja-b',
    quarterly: true,
  },
];

const PORTFOLIO_ORDER = [
  'handelsbanken-usa',
  'nordnet-finland',
  'ishares-world',
  'ishares-europe',
  'nordnet-sweden',
  'spiltan-investmentbolag',
  'franklin-sp500-climate',
  'xact-norden',
  'nordea',
  'marimekko',
  'remedy',
  'btc',
  'bnb',
  'eth',
  'op-asia-index-a',
  'op-europe-index-a',
  'op-world-index-a',
  'op-forest-owner-b',
  'storebrand-japan',
] as const;

const ORDER_BY_ID = new Map<string, number>(
  PORTFOLIO_ORDER.map((id, index) => [id, index] as const)
);

const normalizeText = (body: string) =>
  body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&minus;|&#8722;|&#x2212;/gi, '−')
    .replace(/&#43;|&#x2b;/gi, '+')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const parsePercent = (value: string) => {
  const parsed = Number(value.replace(/−/g, '-').replace('%', '').replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const parseApiNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes('.') && trimmed.includes(',')
    ? trimmed.replace(/,/g, '')
    : trimmed.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const annualizedToCumulative = (value: number | null, years: number) => {
  if (value === null) return null;
  return (Math.pow(1 + value / 100, years) - 1) * 100;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message.slice(0, 220) : String(error).slice(0, 220);

const extractPerformance = (text: string) => {
  const labels = ['Rahaston tuotto', 'Fund Return', 'Fund performance'];
  const start = labels
    .map((label) => text.indexOf(label))
    .find((index) => typeof index === 'number' && index >= 0);

  if (start === undefined || start < 0) throw new Error('Investing fund-return row is missing');

  const segment = text.slice(start, start + 850);
  const tokens = segment.match(/[+−-]?\d+(?:[.,]\d+)?\s*%/g) ?? [];
  const values = tokens.slice(0, 6).map(parsePercent);
  if (values.length < 5 || values.slice(0, 5).some((value) => value === null)) {
    throw new Error('Investing fund-return row is incomplete');
  }

  return {
    ytd: values[0] ?? null,
    month3: values[1] ?? null,
    year1: values[2] ?? null,
    year3: values[3] ?? null,
    year5: values[4] ?? null,
  };
};

const extractInstrumentId = (html: string) => {
  const patterns = [
    /["']instrument_id["']\s*:\s*["']?(\d+)/i,
    /\\["']instrument_id\\["']\s*:\s*\\?["']?(\d+)/i,
    /["']instrumentId["']\s*:\s*["']?(\d+)/i,
    /["']pair_ID["']\s*:\s*["']?(\d+)/i,
    /["']pairId["']\s*:\s*["']?(\d+)/i,
    /data-pair-id=["'](\d+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  throw new Error('Investing instrument id is missing');
};

const fetchInvestingOverview = async (spec: OpFallbackSpec) => {
  const response = await fetch(spec.investingUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Investing overview request failed: ${response.status}`);

  const html = await response.text();
  const text = normalizeText(html);
  if (!text.includes(spec.isin)) throw new Error('Investing overview ISIN mismatch');

  return {
    html,
    text,
    performance: extractPerformance(text),
  };
};

const parseHistory = (body: InvestingHistoryResponse): Observation[] => {
  if (!Array.isArray(body.data)) throw new Error('Investing history data array is missing');

  const observations: Observation[] = [];
  for (const rawRow of body.data) {
    if (!rawRow || typeof rawRow !== 'object') continue;
    const row = rawRow as InvestingHistoryRow;

    let observedAt: string | null = null;
    if (typeof row.rowDateTimestamp === 'string') {
      const time = Date.parse(row.rowDateTimestamp);
      if (Number.isFinite(time)) observedAt = new Date(time).toISOString().slice(0, 10);
    } else if (typeof row.rowDateRaw === 'number' && Number.isFinite(row.rowDateRaw)) {
      observedAt = new Date(row.rowDateRaw * 1000).toISOString().slice(0, 10);
    }

    const value = parseApiNumber(row.last_closeRaw) ?? parseApiNumber(row.last_close);
    if (!observedAt || value === null || value <= 0) continue;
    observations.push({ observedAt, value });
  }

  const byDate = new Map(observations.map((item) => [item.observedAt, item] as const));
  const result = [...byDate.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  if (result.length < 2) throw new Error('Investing history has too few observations');
  return result;
};

const fetchInvestingHistory = async (
  spec: OpFallbackSpec,
  instrumentId: string
): Promise<Observation[]> => {
  const end = new Date();
  const start = new Date(end.getTime() - HISTORY_DAYS * DAY_MS);
  const params = new URLSearchParams({
    'start-date': start.toISOString().slice(0, 10),
    'end-date': end.toISOString().slice(0, 10),
    'time-frame': 'Daily',
    'add-missing-rows': 'false',
  });
  const url = `https://api.investing.com/api/financialdata/historical/${instrumentId}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'domain-id': 'www',
      Referer: `${spec.investingUrl}-historical-data`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`Investing history API failed: ${response.status}`);

  let body: InvestingHistoryResponse;
  try {
    body = (await response.json()) as InvestingHistoryResponse;
  } catch {
    throw new Error('Investing history API returned non-JSON content');
  }
  return parseHistory(body);
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

const percentChange = (latest: Observation, reference: Observation | null) => {
  if (!reference || reference.value === 0) return null;
  return (latest.value / reference.value - 1) * 100;
};

const buildIndexFund = async (
  spec: OpFallbackSpec,
  overview: Awaited<ReturnType<typeof fetchInvestingOverview>>
): Promise<PortfolioItem> => {
  const instrumentId = extractInstrumentId(overview.html);
  const observations = await fetchInvestingHistory(spec, instrumentId);
  const latest = observations.at(-1);
  const previous = observations.at(-2);
  if (!latest || !previous) throw new Error('Investing index history is incomplete');

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const month6 = percentChange(latest, findReference(observations, latestTime - 183 * DAY_MS));
  const month1 = percentChange(latest, findReference(observations, latestTime - 30 * DAY_MS));
  const week1 = percentChange(latest, findReference(observations, latestTime - 7 * DAY_MS));
  if (month6 === null || month1 === null || week1 === null) {
    throw new Error('Investing history does not cover required short periods');
  }

  return {
    id: spec.id,
    label: spec.label,
    symbol: spec.isin,
    price: latest.value,
    observedAt: latest.observedAt,
    changes: {
      today: (latest.value / previous.value - 1) * 100,
      week1,
      month1,
      month3: overview.performance.month3,
      month6,
      ytd: overview.performance.ytd,
      year1: overview.performance.year1,
      year3: annualizedToCumulative(overview.performance.year3, 3),
      year5: annualizedToCumulative(overview.performance.year5, 5),
    },
  };
};

const buildQuarterlyFund = (
  spec: OpFallbackSpec,
  overview: Awaited<ReturnType<typeof fetchInvestingOverview>>
): PortfolioItem => ({
  id: spec.id,
  label: spec.label,
  symbol: spec.isin,
  price: null,
  observedAt: new Date().toISOString().slice(0, 10),
  changes: {
    today: null,
    week1: null,
    month1: null,
    month3: overview.performance.month3,
    month6: null,
    ytd: overview.performance.ytd,
    year1: overview.performance.year1,
    year3: annualizedToCumulative(overview.performance.year3, 3),
    year5: annualizedToCumulative(overview.performance.year5, 5),
  },
});

const recoverFromInvesting = async (spec: OpFallbackSpec): Promise<PortfolioItem> => {
  const overview = await fetchInvestingOverview(spec);
  return spec.quarterly ? buildQuarterlyFund(spec, overview) : buildIndexFund(spec, overview);
};

export const onRequestGet = async () => {
  const response = await getRecoveredPortfolio();
  if (!response.ok) return response;

  let body: PortfolioResponse;
  try {
    body = (await response.json()) as PortfolioResponse;
  } catch {
    return response;
  }
  if (!Array.isArray(body.items)) return response;

  const byId = new Map(body.items.map((item) => [item.id, item] as const));
  const missingSpecs = OP_FALLBACK_SPECS.filter((spec) => !byId.has(spec.id));
  if (missingSpecs.length === 0) return response;

  const results = await Promise.allSettled(missingSpecs.map(recoverFromInvesting));
  const recovered: PortfolioItem[] = [];
  const errors: RecoveryError[] = [...(body.recoveryErrors ?? [])];

  results.forEach((result, index) => {
    const spec = missingSpecs[index];
    if (!spec) return;
    if (result.status === 'fulfilled') {
      recovered.push(result.value);
      return;
    }
    errors.push({
      id: spec.id,
      stage: 'investing-fallback',
      message: errorMessage(result.reason),
    });
  });

  for (const item of recovered) byId.set(item.id, item);
  const recoveredIds = new Set(recovered.map((item) => item.id));
  const items = [...byId.values()].sort(
    (a, b) => (ORDER_BY_ID.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (ORDER_BY_ID.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
  const unavailable = (body.unavailable ?? []).filter((id) => !recoveredIds.has(id));

  return new Response(
    JSON.stringify({
      ...body,
      items,
      unavailable,
      recoveryErrors: errors,
      source: recovered.length > 0 ? `${body.source} + Investing.com exact OP fallback` : body.source,
      version: Math.max(body.version ?? 0, 8),
    }),
    {
      status: response.status,
      headers: response.headers,
    }
  );
};
