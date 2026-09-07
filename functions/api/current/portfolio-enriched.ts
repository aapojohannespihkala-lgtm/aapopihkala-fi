import { onRequestGet as getBasePortfolio } from './portfolio';

type MarketPerformanceId =
  | 'handelsbanken-usa'
  | 'nordnet-finland'
  | 'nordnet-sweden'
  | 'spiltan-investmentbolag'
  | 'storebrand-japan';

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

type MainSearchRow = {
  market_data_order_book_id?: unknown;
};

type MainSearchGroup = {
  results?: unknown;
};

type NordnetPoint = {
  value: number;
  observedAt: string;
};

type PriceTimeSeriesResponse = {
  pricePoints?: unknown;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const NORDNET_ISIN_BY_ID: Record<MarketPerformanceId, string> = {
  'handelsbanken-usa': 'SE0006800140',
  'nordnet-finland': 'SE0005993102',
  'nordnet-sweden': 'SE0002756973',
  'spiltan-investmentbolag': 'SE0004297927',
  'storebrand-japan': 'SE0013801479',
};

const PERIOD_KEYS: Array<keyof PerformanceChanges> = [
  'today',
  'week1',
  'month1',
  'month3',
  'month6',
  'ytd',
  'year1',
  'year3',
  'year5',
];

const isTargetId = (id: string): id is MarketPerformanceId => id in NORDNET_ISIN_BY_ID;

const hasMissingPeriods = (item: PortfolioItem) =>
  PERIOD_KEYS.some((key) => item.changes[key] === null);

const fetchNordnetOrderBookId = async (isin: string) => {
  const url = new URL('https://public.nordnet.se/api/2/main_search');
  url.searchParams.set('query', isin);
  url.searchParams.set('instrument_group', 'FUND');
  url.searchParams.set('limit', '5');
  url.searchParams.set('search_space', 'INSTRUMENTS');
  url.searchParams.set('use_nnx_instrument_search', 'true');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'fi',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Nordnet search failed: ${response.status}`);

  const groups = (await response.json()) as unknown;
  if (!Array.isArray(groups)) throw new Error('Nordnet search response shape changed');

  for (const group of groups as MainSearchGroup[]) {
    if (!Array.isArray(group.results)) continue;
    for (const row of group.results as MainSearchRow[]) {
      const orderBookId = row.market_data_order_book_id;
      if (
        typeof orderBookId === 'string' &&
        /^\d+:FUND_[A-Z]{3}$/.test(orderBookId)
      ) {
        return orderBookId;
      }
    }
  }

  throw new Error(`Nordnet market data ID missing for ${isin}`);
};

const parseNordnetPoints = (data: PriceTimeSeriesResponse): NordnetPoint[] => {
  if (!Array.isArray(data.pricePoints)) throw new Error('Nordnet time series response shape changed');

  const points = data.pricePoints.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const value = (raw as { value?: unknown }).value;
    const timeStamp = (raw as { timeStamp?: unknown }).timeStamp;
    if (typeof value !== 'number' || !Number.isFinite(value)) return [];
    if (typeof timeStamp !== 'number' || !Number.isFinite(timeStamp)) return [];
    return [{
      value,
      observedAt: new Date(timeStamp).toISOString().slice(0, 10),
    }];
  });

  if (points.length < 2) throw new Error('Nordnet time series has too few observations');
  return points.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const fetchNordnetSeries = async (
  orderBookId: string,
  period: 'YEAR_3' | 'ALL',
  resolution: 'DAY' | 'WEEK'
) => {
  const url = `https://api.prod.nntech.io/market-data/price-time-series/v2/period/${period}/identifier/${orderBookId}?resolution=${resolution}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-locale': 'fi-FI',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    },
  });
  if (!response.ok) throw new Error(`Nordnet time series failed: ${response.status}`);
  return parseNordnetPoints((await response.json()) as PriceTimeSeriesResponse);
};

const findReference = (points: NordnetPoint[], targetTime: number): NordnetPoint | null => {
  let candidate: NordnetPoint | null = null;
  for (const point of points) {
    const pointTime = Date.parse(`${point.observedAt}T00:00:00Z`);
    if (pointTime > targetTime) break;
    candidate = point;
  }
  return candidate;
};

const yearsBefore = (time: number, years: number) => {
  const date = new Date(time);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.getTime();
};

const cumulativeChange = (latest: NordnetPoint, reference: NordnetPoint | null) => {
  if (!reference) return null;
  const latestFactor = 1 + latest.value / 100;
  const referenceFactor = 1 + reference.value / 100;
  if (!Number.isFinite(latestFactor) || !Number.isFinite(referenceFactor) || referenceFactor <= 0) {
    return null;
  }
  return (latestFactor / referenceFactor - 1) * 100;
};

const buildSeriesChanges = (daily: NordnetPoint[], weekly: NordnetPoint[]): PerformanceChanges => {
  const latest = daily.at(-1);
  const previous = daily.at(-2);
  if (!latest || !previous) throw new Error('Nordnet daily series is incomplete');

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const latestDate = new Date(latestTime);
  const previousYearEnd = Date.UTC(latestDate.getUTCFullYear(), 0, 1) - DAY_MS;
  const longLatest = weekly.at(-1);

  return {
    today: cumulativeChange(latest, previous),
    week1: cumulativeChange(latest, findReference(daily, latestTime - 7 * DAY_MS)),
    month1: cumulativeChange(latest, findReference(daily, latestTime - 30 * DAY_MS)),
    month3: cumulativeChange(latest, findReference(daily, latestTime - 92 * DAY_MS)),
    month6: cumulativeChange(latest, findReference(daily, latestTime - 183 * DAY_MS)),
    ytd: cumulativeChange(latest, findReference(daily, previousYearEnd)),
    year1: cumulativeChange(latest, findReference(daily, yearsBefore(latestTime, 1))),
    year3: cumulativeChange(latest, findReference(daily, yearsBefore(latestTime, 3))),
    year5: longLatest
      ? cumulativeChange(longLatest, findReference(weekly, yearsBefore(Date.parse(`${longLatest.observedAt}T00:00:00Z`), 5)))
      : null,
  };
};

const enrichItem = async (item: PortfolioItem) => {
  if (!isTargetId(item.id) || !hasMissingPeriods(item)) return { item, enriched: false };

  try {
    const orderBookId = await fetchNordnetOrderBookId(NORDNET_ISIN_BY_ID[item.id]);
    const [daily, weekly] = await Promise.all([
      fetchNordnetSeries(orderBookId, 'YEAR_3', 'DAY'),
      fetchNordnetSeries(orderBookId, 'ALL', 'WEEK'),
    ]);
    const seriesChanges = buildSeriesChanges(daily, weekly);
    let enriched = false;
    const changes = { ...item.changes };

    for (const key of PERIOD_KEYS) {
      if (changes[key] === null && seriesChanges[key] !== null) {
        changes[key] = seriesChanges[key];
        enriched = true;
      }
    }

    const latestObservedAt = daily.at(-1)?.observedAt ?? item.observedAt;
    return {
      item: {
        ...item,
        observedAt: latestObservedAt > item.observedAt ? latestObservedAt : item.observedAt,
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

  const enrichedResults = await Promise.all(body.items.map(enrichItem));
  const enriched = enrichedResults.some((result) => result.enriched);
  const items = enrichedResults.map((result) => result.item);
  const unavailable = body.unavailable.filter((id) => items.every((item) => item.id !== id));

  return new Response(
    JSON.stringify({
      ...body,
      items,
      unavailable,
      source: enriched ? `${body.source} + Nordnet market data` : body.source,
      version: Math.max(body.version ?? 0, 5),
    }),
    {
      status: baseResponse.status,
      headers: baseResponse.headers,
    }
  );
};
