import { onRequestGet as getBasePortfolio } from './portfolio';

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

const fetchOfficialOpNav = async (spec: OpShortHistorySpec): Promise<NavPoint> => {
  const response = await fetch(spec.opUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`OP NAV request failed: ${response.status}`);

  const text = htmlToText(await response.text());
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

const parseInvestingHistory = (html: string, isin: string): NavPoint[] => {
  const text = htmlToText(html);
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

const fetchInvestingHistory = async (spec: OpShortHistorySpec) => {
  const response = await fetch(spec.investingUrl, {
    headers: {
      Accept: 'text/html',
      'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Investing request failed: ${response.status}`);
  return parseInvestingHistory(await response.text(), spec.isin);
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

const enrichOpShortHistory = async (item: PortfolioItem, spec: OpShortHistorySpec) => {
  if (item.changes.today !== null && item.changes.week1 !== null) return { item, enriched: false };

  try {
    const [official, history] = await Promise.all([
      fetchOfficialOpNav(spec),
      fetchInvestingHistory(spec),
    ]);
    const short = buildShortChanges(official, history);
    const changes = {
      ...item.changes,
      today: item.changes.today ?? short.today,
      week1: item.changes.week1 ?? short.week1,
    };
    const enriched = changes.today !== item.changes.today || changes.week1 !== item.changes.week1;

    return {
      item: {
        ...item,
        price: item.price ?? official.value,
        observedAt: official.observedAt > item.observedAt ? official.observedAt : item.observedAt,
        changes,
      },
      enriched,
    };
  } catch {
    return { item, enriched: false };
  }
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

  return new Response(
    JSON.stringify({
      ...body,
      items: results.map((result) => result.item),
      source: enriched ? `${body.source} + Investing.com exact OP NAV history` : body.source,
      version: Math.max(body.version ?? 0, 6),
    }),
    {
      status: baseResponse.status,
      headers: baseResponse.headers,
    }
  );
};
