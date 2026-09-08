import { onRequestGet as getResilientPortfolio } from './portfolio-resilient';

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

type PortfolioResponse = {
  items: PortfolioItem[];
  expected: number;
  liveExpected: number;
  unavailable: string[];
  source: string;
  version: number;
};

type OpRecoverySpec = {
  id: 'op-asia-index-a' | 'op-europe-index-a' | 'op-world-index-a' | 'op-forest-owner-b';
  label: string;
  isin: string;
  url: string;
  rowLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const READER_BASE = 'https://r.jina.ai/';
const RECOVERY_FETCH_TIMEOUT_MS = 2_500;
const RECOVERY_TASK_TIMEOUT_MS = 6_000;
const RECOVERY_ATTEMPTS = 2;

const OP_RECOVERY_SPECS: OpRecoverySpec[] = [
  {
    id: 'op-asia-index-a',
    label: 'OP-AASIA INDEKSI A',
    isin: 'FI4000029491',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-asia-index',
    rowLabel: 'OP-Asia Index A',
  },
  {
    id: 'op-europe-index-a',
    label: 'OP-EUROOPPA INDEKSI A',
    isin: 'FI4000029301',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-europe-index',
    rowLabel: 'OP-Europe Index A',
  },
  {
    id: 'op-world-index-a',
    label: 'OP-MAAILMA INDEKSI A',
    isin: 'FI4000261128',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-world-index',
    rowLabel: 'OP-World Index A',
  },
  {
    id: 'op-forest-owner-b',
    label: 'OP-METSÄNOMISTAJA B',
    isin: 'FI4000108436',
    url: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-forest-owner',
    rowLabel: 'OP-Forest Owner B',
  },
];

const PORTFOLIO_ORDER = [
  'handelsbanken-usa',
  'nordnet-finland',
  'ishares-world',
  'ishares-europe',
  'nordnet-sweden',
  'spiltan-investmentbolag',
  'storebrand-japan',
  'franklin-sp500-climate',
  'xact-norden',
  'nordea',
  'marimekko',
  'remedy',
  'op-asia-index-a',
  'op-europe-index-a',
  'op-world-index-a',
  'op-forest-owner-b',
  'btc',
  'bnb',
  'eth',
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

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

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
    section.slice(rowStart + rowLabel.length, rowStart + rowLabel.length + 640),
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

const extractObservationDate = (text: string) => {
  const match = text.match(/Accumulated profit\s*\((\d{1,2})\.(\d{1,2})\)/i);
  if (!match) return new Date().toISOString().slice(0, 10);
  return inferObservationDate(Number(match[1]), Number(match[2]));
};

const extractOfficialNav = (text: string) => {
  const match = text.match(/Unit value\s*\((\d{1,2})\.(\d{1,2})\.\)\s*([\d\s.,]+)\s*EUR/i);
  if (!match) return null;
  const value = parseNumber(match[3]);
  if (value === null || value <= 0) return null;
  return {
    value,
    observedAt: inferObservationDate(Number(match[1]), Number(match[2])),
  };
};

const annualizedToCumulative = (value: number | null, years: number) => {
  if (value === null) return null;
  return (Math.pow(1 + value / 100, years) - 1) * 100;
};

const fetchWithTimeout = async (input: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECOVERY_FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const withTaskTimeout = async <T>(promise: Promise<T>, id: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${id} recovery timed out`)), RECOVERY_TASK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const recoverOpFundOnce = async (spec: OpRecoverySpec): Promise<PortfolioItem> => {
  const response = await fetchWithTimeout(`${READER_BASE}${spec.url}`, {
    headers: {
      Accept: 'text/plain',
      'X-Cache-Tolerance': '300',
      'X-Locale': 'en-US',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`OP reader request failed: ${response.status}`);

  const text = normalizeText(await response.text());
  if (!text.includes(spec.isin)) throw new Error(`OP reader ISIN mismatch for ${spec.id}`);

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
  const nav = extractOfficialNav(text);

  return {
    id: spec.id,
    label: spec.label,
    symbol: spec.isin,
    price: nav?.value ?? null,
    observedAt: nav?.observedAt ?? extractObservationDate(text),
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

const recoverOpFund = async (spec: OpRecoverySpec): Promise<PortfolioItem> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < RECOVERY_ATTEMPTS; attempt += 1) {
    try {
      return await recoverOpFundOnce(spec);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${spec.id} recovery failed`);
};

export const onRequestGet = async () => {
  const response = await getResilientPortfolio();
  if (!response.ok) return response;

  let body: PortfolioResponse;
  try {
    body = (await response.clone().json()) as PortfolioResponse;
  } catch {
    return response;
  }
  if (!Array.isArray(body.items)) return response;

  const byId = new Map(body.items.map((item) => [item.id, item] as const));
  const missingSpecs = OP_RECOVERY_SPECS.filter((spec) => !byId.has(spec.id));
  if (missingSpecs.length === 0) return response;

  const settled = await Promise.allSettled(
    missingSpecs.map((spec) => withTaskTimeout(recoverOpFund(spec), spec.id))
  );
  const recovered = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : []
  );

  for (const item of recovered) byId.set(item.id, item);
  const recoveredIds = new Set(recovered.map((item) => item.id));
  const items = [...byId.values()].sort(
    (left, right) =>
      (ORDER_BY_ID.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (ORDER_BY_ID.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  );
  const unavailable = (body.unavailable ?? []).filter((id) => !recoveredIds.has(id));

  return new Response(
    JSON.stringify({
      ...body,
      items,
      unavailable,
      source: recovered.length > 0 ? `${body.source} + OP official reader fallback` : body.source,
      version: Math.max(body.version ?? 0, 11),
    }),
    {
      status: response.status,
      headers: response.headers,
    }
  );
};
