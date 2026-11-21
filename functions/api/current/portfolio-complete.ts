import { onRequestGet as getBasePortfolio } from './portfolio-stable';
import { projectForestShortPeriods } from './portfolio-projection';
import { estimatePortfolioPeriods } from './portfolio-estimation';
import { parseInvestingFundHistory, recoverNordicReturnPeriods } from './portfolio-fund-recovery';

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

type OpShortHistorySpec = {
  id: 'op-asia-index-a' | 'op-europe-index-a' | 'op-world-index-a';
  isin: string;
  opUrl: string;
  investingUrl: string;
};

type NavPoint = {
  observedAt: string;
  value: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const READER_BASE = 'https://r.jina.ai/';
const FETCH_TIMEOUT_MS = 2_500;
const TASK_TIMEOUT_MS = 5_500;
const MAX_REFERENCE_GAP_MS = 5 * DAY_MS;

const OP_SHORT_HISTORY_SPECS: OpShortHistorySpec[] = [
  {
    id: 'op-asia-index-a',
    isin: 'FI4000029491',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-asia-index',
    investingUrl: 'https://fi.investing.com/funds/op-aasia-indeksi-a-historical-data',
  },
  {
    id: 'op-europe-index-a',
    isin: 'FI4000029301',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-europe-index',
    investingUrl: 'https://fi.investing.com/funds/op-eurooppa-indeksi-a-historical-data',
  },
  {
    id: 'op-world-index-a',
    isin: 'FI4000261128',
    opUrl: 'https://www.op.fi/en/private-customers/savings-and-investments/funds/all-funds/op-world-index',
    investingUrl: 'https://fi.investing.com/funds/fi4000261128-historical-data',
  },
];

const htmlToText = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

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

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export const fetchTextWithTimeout = async (
  input: string,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(input, { ...init, signal: controller.signal });
    const body = await response.text();
    return { body, ok: response.ok, status: response.status };
  } finally {
    clearTimeout(timer);
  }
};

const withTaskTimeout = async <T>(promise: Promise<T>, id: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${id} timed out`)), TASK_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const fetchTextWithReaderFallback = async (
  url: string,
  directHeaders: Record<string, string>,
  locale: string
) => {
  let directError: unknown;

  try {
    const result = await fetchTextWithTimeout(url, { headers: directHeaders });
    if (!result.ok) throw new Error(`direct request failed: ${result.status}`);
    return result.body;
  } catch (error) {
    directError = error;
  }

  try {
    const result = await fetchTextWithTimeout(`${READER_BASE}${url}`, {
      headers: {
        Accept: 'text/plain',
        'X-Cache-Tolerance': '300',
        'X-Locale': locale,
        'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
      },
    });
    if (!result.ok) throw new Error(`reader request failed: ${result.status}`);
    return result.body;
  } catch (readerError) {
    throw readerError instanceof Error
      ? readerError
      : directError instanceof Error
        ? directError
        : new Error('source request failed');
  }
};

const fetchOfficialOpNav = async (spec: OpShortHistorySpec): Promise<NavPoint> => {
  const body = await fetchTextWithReaderFallback(
    spec.opUrl,
    {
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
    'en-US'
  );

  const text = htmlToText(body);
  if (!text.includes(spec.isin)) throw new Error(`OP NAV ISIN mismatch for ${spec.id}`);

  const match = text.match(/Unit value\s*\((\d{1,2})\.(\d{1,2})\.\)\s*([\d\s.,]+)\s*EUR/i);
  if (!match) throw new Error(`OP NAV missing for ${spec.id}`);
  const value = parseNumber(match[3]);
  if (value === null || value <= 0) throw new Error(`OP NAV invalid for ${spec.id}`);

  return {
    observedAt: inferObservationDate(Number(match[1]), Number(match[2])),
    value,
  };
};

const parseInvestingHistory = (body: string, isin: string): NavPoint[] => {
  const history = parseInvestingFundHistory(body, isin);
  if (history.length < 2) throw new Error(`Investing ISIN-matched history unavailable for ${isin}`);
  return history;
};

const fetchInvestingHistory = async (spec: OpShortHistorySpec) => {
  const body = await fetchTextWithReaderFallback(
    spec.investingUrl,
    {
      Accept: 'text/html',
      'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
    'fi-FI'
  );
  return parseInvestingHistory(body, spec.isin);
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
    if (relativeError > 0.0015) throw new Error('Investing NAV does not match OP NAV');
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
  const previousTime = Date.parse(`${previous.observedAt}T00:00:00Z`);
  if (latestTime - previousTime > MAX_REFERENCE_GAP_MS) {
    throw new Error('OP previous NAV is too stale');
  }

  const weekTarget = latestTime - 7 * DAY_MS;
  const weekReference = findReference(points, weekTarget);
  if (!weekReference) throw new Error('OP 1W NAV reference is missing');
  const weekReferenceTime = Date.parse(`${weekReference.observedAt}T00:00:00Z`);
  if (weekTarget - weekReferenceTime > MAX_REFERENCE_GAP_MS) {
    throw new Error('OP 1W NAV reference is too stale');
  }

  return {
    today: percentChange(latest, previous),
    week1: percentChange(latest, weekReference),
  };
};

// Use a validated and recent third-party NAV series only when OP's official
// NAV is unavailable. A conflicting official and third-party NAV fails closed.
export const buildInvestingOnlyShortChanges = (history: NavPoint[], now = new Date()) => {
  const latest = history.at(-1);
  const previous = history.at(-2);
  if (!latest || !previous) return null;
  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const previousTime = Date.parse(`${previous.observedAt}T00:00:00Z`);
  if (!Number.isFinite(latestTime) || latestTime > now.getTime() + DAY_MS ||
      now.getTime() - latestTime > 10 * DAY_MS ||
      latestTime - previousTime > MAX_REFERENCE_GAP_MS || previous.value <= 0) return null;
  const weekTarget = latestTime - 7 * DAY_MS;
  const reference = findReference(history, weekTarget);
  const referenceTime = reference ? Date.parse(`${reference.observedAt}T00:00:00Z`) : NaN;
  return {
    latest,
    today: percentChange(latest, previous),
    week1: reference && Number.isFinite(referenceTime) &&
      weekTarget - referenceTime <= MAX_REFERENCE_GAP_MS
      ? percentChange(latest, reference) : null,
  };
};

const enrichOpShortHistory = async (item: PortfolioItem, spec: OpShortHistorySpec) => {
  if (item.changes.today !== null && item.changes.week1 !== null) {
    return { item, enriched: false };
  }
  const [officialResult, historyResult] = await Promise.allSettled([
    withTaskTimeout(fetchOfficialOpNav(spec), `${spec.id} OP NAV`),
    withTaskTimeout(fetchInvestingHistory(spec), `${spec.id} Investing history`),
  ]);
  if (historyResult.status !== 'fulfilled') return { item, enriched: false };

  let short: { today: number | null; week1: number | null };
  let latest: NavPoint;
  if (officialResult.status === 'fulfilled') {
    try {
      short = buildShortChanges(officialResult.value, historyResult.value);
    } catch {
      return { item, enriched: false };
    }
    latest = officialResult.value;
  } else {
    const recovered = buildInvestingOnlyShortChanges(historyResult.value);
    if (!recovered) return { item, enriched: false };
    short = recovered;
    latest = recovered.latest;
  }
  const changes = {
    ...item.changes,
    today: item.changes.today ?? short.today,
    week1: item.changes.week1 ?? short.week1,
  };
  const enriched = changes.today !== item.changes.today || changes.week1 !== item.changes.week1;
  return {
    item: {
      ...item,
      price: item.price ?? latest.value,
      observedAt: latest.observedAt > item.observedAt ? latest.observedAt : item.observedAt,
      changes,
    },
    enriched,
  };
};

export const onRequestGet = async () => {
  const baseResponse = await getBasePortfolio();
  if (!baseResponse.ok) return baseResponse;

  let body: PortfolioResponse;
  try {
    body = (await baseResponse.json()) as PortfolioResponse;
  } catch {
    return baseResponse;
  }
  if (!Array.isArray(body.items)) return baseResponse;

  const specById = new Map(OP_SHORT_HISTORY_SPECS.map((spec) => [spec.id, spec]));
  const results = await Promise.all(
    body.items.map((item) => {
      const spec = specById.get(item.id as OpShortHistorySpec['id']);
      return spec ? enrichOpShortHistory(item, spec) : Promise.resolve({ item, enriched: false });
    })
  );
  const enriched = results.some((result) => result.enriched);
  // The old screening API drops Nordnet Sverige and Spiltan 5Y returns.
  // Fill null periods from the same exact ISIN's public structured fund
  // payload, without changing previously sourced values.
  const nordic = await Promise.all(results.map(async (result) => {
    const item = result.item;
    if ((item.id !== 'nordnet-sweden' && item.id !== 'spiltan-investmentbolag') ||
        Object.values(item.changes).every((change) => change !== null)) return { item, recovered: false };
    const supplementary = await recoverNordicReturnPeriods(item.id);
    if (!supplementary) return { item, recovered: false };
    const changes = { ...item.changes };
    for (const period of Object.keys(changes) as Array<keyof PerformanceChanges>) {
      if (changes[period] === null) changes[period] = supplementary.changes[period];
    }
    return { item: { ...item, changes }, recovered: changes.year5 !== item.changes.year5 };
  }));
  const nordicEnriched = nordic.some((result) => result.recovered);

  return new Response(
    JSON.stringify({
      ...body,
      items: nordic.map((result) => estimatePortfolioPeriods(projectForestShortPeriods(result.item))),
      source: [body.source,
        ...(enriched ? ['Investing.com ISIN-matched OP NAV history'] : []),
        ...(nordicEnriched ? ['Nordnet ISIN-matched historical returns'] : []),
      ].join(' + '),
      version: Math.max(body.version ?? 0, 16),
    }),
    {
      status: baseResponse.status,
      headers: baseResponse.headers,
    }
  );
};