import { onRequestGet as getCompletePortfolio } from './portfolio-complete';

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
  opUrl: string;
  rowLabel: string;
  investingUrl?: string;
};

type NavPoint = {
  observedAt: string;
  value: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const READER_BASE = 'https://r.jina.ai/';

const OP_RECOVERY_SPECS: OpRecoverySpec[] = [
  {
    id: 'op-asia-index-a',
    label: 'OP-AASIA INDEKSI A',
    isin: 'FI4000029491',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-asia-index',
    rowLabel: 'OP-Asia Index A',
    investingUrl: 'https://fi.investing.com/funds/op-aasia-indeksi-a-historical-data',
  },
  {
    id: 'op-europe-index-a',
    label: 'OP-EUROOPPA INDEKSI A',
    isin: 'FI4000029301',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-europe-index',
    rowLabel: 'OP-Europe Index A',
    investingUrl: 'https://fi.investing.com/funds/op-eurooppa-indeksi-a-historical-data',
  },
  {
    id: 'op-world-index-a',
    label: 'OP-MAAILMA INDEKSI A',
    isin: 'FI4000261128',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-world-index',
    rowLabel: 'OP-World Index A',
    investingUrl: 'https://fi.investing.com/funds/fi4000261128-historical-data',
  },
  {
    id: 'op-forest-owner-b',
    label: 'OP-METSÄNOMISTAJA B',
    isin: 'FI4000108436',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-forest-owner',
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

const ORDER_BY_ID = new Map(PORTFOLIO_ORDER.map((id, index) => [id, index] as const));

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

const annualizedToCumulative = (value: number | null, years: number) => {
  if (value === null) return null;
  return (Math.pow(1 + value / 100, years) - 1) * 100;
};

const fetchReaderText = async (url: string) => {
  const response = await fetch(`${READER_BASE}${url}`, {
    headers: {
      Accept: 'text/plain',
      'X-Cache-Tolerance': '300',
      'X-Locale': 'en-US',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Reader request failed: ${response.status}`);
  return normalizeText(await response.text());
};

const extractOfficialNav = (text: string, spec: OpRecoverySpec): NavPoint | null => {
  if (!text.includes(spec.isin)) throw new Error(`OP ISIN mismatch for ${spec.id}`);

  const match = text.match(/Unit value\s*\((\d{1,2})\.(\d{1,2})\.\)\s*([\d\s.,]+)\s*EUR/i);
  if (!match) return null;
  const value = parseNumber(match[3]);
  if (value === null || value <= 0) return null;

  return {
    observedAt: inferObservationDate(Number(match[1]), Number(match[2])),
    value,
  };
};

const parseInvestingHistory = (body: string, isin: string): NavPoint[] => {
  const text = normalizeText(body);
  if (!new RegExp(`ISIN\\s*:?\\s*${isin}`, 'i').test(text)) {
    throw new Error(`Investing ISIN mismatch for ${isin}`);
  }

  const points = new Map<string, NavPoint>();
  const rowPattern = /(\d{2})\.(\d{2})\.(\d{4})\s+([\d\s]+,\d{2,4})\b/g;
  for (const match of text.matchAll(rowPattern)) {
    const value = parseNumber(match[4]);
    if (value === null || value <= 0) continue;
    const observedAt = `${match[3]}-${match[2]}-${match[1]}`;
    points.set(observedAt, { observedAt, value });
  }

  const result = [...points.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  if (result.length < 2) throw new Error(`Investing history incomplete for ${isin}`);
  return result;
};

const fetchInvestingHistory = async (spec: OpRecoverySpec) => {
  if (!spec.investingUrl) return [];

  try {
    const response = await fetch(spec.investingUrl, {
      headers: {
        Accept: 'text/html',
        'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
      },
    });
    if (!response.ok) throw new Error(`Investing request failed: ${response.status}`);
    return parseInvestingHistory(await response.text(), spec.isin);
  } catch {
    return parseInvestingHistory(await fetchReaderText(spec.investingUrl), spec.isin);
  }
};

const findReference = (points: NavPoint[], targetTime: number): NavPoint | null => {
  let candidate: NavPoint | null = null;
  for (const point of points) {
    const pointTime = Date.parse(`${point.observedAt}T00:00:00Z`);
    if (pointTime > targetTime) break;
    candidate = point;
  }
  return candidate;
};

const percentChange = (latest: NavPoint, reference: NavPoint | null) => {
  if (!reference || reference.value === 0) return null;
  return (latest.value / reference.value - 1) * 100;
};

const buildShortChanges = (official: NavPoint, history: NavPoint[]) => {
  const byDate = new Map(history.map((point) => [point.observedAt, point]));
  const sameDate = byDate.get(official.observedAt);
  if (sameDate) {
    const relativeError = Math.abs(sameDate.value / official.value - 1);
    if (relativeError > 0.001) throw new Error('Investing NAV does not match OP NAV');
  }

  byDate.set(official.observedAt, official);
  const points = [...byDate.values()]
    .filter((point) => point.observedAt <= official.observedAt)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const latest = points.at(-1);
  const previous = points.at(-2);
  if (!latest || !previous || latest.observedAt !== official.observedAt) {
    throw new Error('OP short history is incomplete');
  }

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  return {
    today: percentChange(latest, previous),
    week1: percentChange(latest, findReference(points, latestTime - 7 * DAY_MS)),
  };
};

const recoverOpFund = async (spec: OpRecoverySpec): Promise<PortfolioItem> => {
  const text = await fetchReaderText(spec.opUrl);
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
  const officialNav = extractOfficialNav(text, spec);

  let today: number | null = null;
  let week1: number | null = null;
  if (officialNav && spec.investingUrl) {
    try {
      const short = buildShortChanges(officialNav, await fetchInvestingHistory(spec));
      today = short.today;
      week1 = short.week1;
    } catch {
      // Preserve the official OP long-period row even if short-history enrichment is unavailable.
    }
  }

  return {
    id: spec.id,
    label: spec.label,
    symbol: spec.isin,
    price: officialNav?.value ?? null,
    observedAt: officialNav?.observedAt ?? extractObservationDate(text),
    changes: {
      today,
      week1,
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

export const onRequestGet = async () => {
  const response = await getCompletePortfolio();
  if (!response.ok) return response;

  let body: PortfolioResponse;
  try {
    body = (await response.json()) as PortfolioResponse;
  } catch {
    return response;
  }
  if (!Array.isArray(body.items)) return response;

  const byId = new Map(body.items.map((item) => [item.id, item] as const));
  const missingSpecs = OP_RECOVERY_SPECS.filter((spec) => !byId.has(spec.id));
  if (missingSpecs.length === 0) return response;

  const recoveredResults = await Promise.allSettled(missingSpecs.map(recoverOpFund));
  const recovered: PortfolioItem[] = [];
  for (const result of recoveredResults) {
    if (result.status === 'fulfilled') recovered.push(result.value);
  }

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
      source: recovered.length > 0 ? `${body.source} + OP official reader fallback` : body.source,
      version: Math.max(body.version ?? 0, 7),
    }),
    {
      status: response.status,
      headers: response.headers,
    }
  );
};
