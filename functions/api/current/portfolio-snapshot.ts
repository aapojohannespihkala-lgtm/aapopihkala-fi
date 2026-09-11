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

const SNAPSHOT_SELECTED_IDS = new Set([
  'ishares-world',
  'handelsbanken-usa',
  'nordnet-finland',
  'btc',
  'remedy',
]);

const PERFORMANCE_PERIODS = [
  'today',
  'week1',
  'month1',
  'month3',
  'month6',
  'ytd',
  'year1',
  'year3',
  'year5',
] as const;

const hasVisibleSnapshotValues = (body: PortfolioResponse) => {
  if (!Array.isArray(body.items)) return false;
  if (body.items.length < body.expected || body.unavailable.length > 0) return false;

  const byId = new Map(body.items.map((item) => [item.id, item] as const));
  return [...SNAPSHOT_SELECTED_IDS].every((id) => {
    const value = byId.get(id)?.changes.today;
    return typeof value === 'number' && Number.isFinite(value);
  });
};

const mergeItem = (current: PortfolioItem | undefined, incoming: PortfolioItem) => {
  if (!current) return incoming;

  const changes = { ...current.changes };
  for (const period of PERFORMANCE_PERIODS) {
    if (changes[period] === null && incoming.changes[period] !== null) {
      changes[period] = incoming.changes[period];
    }
  }

  return {
    ...current,
    price: current.price ?? incoming.price,
    observedAt: current.observedAt || incoming.observedAt,
    changes,
  };
};

export const onRequestGet = async () => {
  const firstResponse = await getResilientPortfolio();
  if (!firstResponse.ok) return firstResponse;

  let firstBody: PortfolioResponse;
  try {
    firstBody = (await firstResponse.clone().json()) as PortfolioResponse;
  } catch {
    return firstResponse;
  }

  if (hasVisibleSnapshotValues(firstBody)) return firstResponse;

  const secondResponse = await getResilientPortfolio();
  if (!secondResponse.ok) return firstResponse;

  let secondBody: PortfolioResponse;
  try {
    secondBody = (await secondResponse.json()) as PortfolioResponse;
  } catch {
    return firstResponse;
  }

  const byId = new Map<string, PortfolioItem>();
  for (const item of firstBody.items ?? []) byId.set(item.id, item);
  for (const item of secondBody.items ?? []) byId.set(item.id, mergeItem(byId.get(item.id), item));

  const items = [...byId.values()];
  const unavailable = [...new Set([...(firstBody.unavailable ?? []), ...(secondBody.unavailable ?? [])])]
    .filter((id) => !byId.has(id));

  return new Response(
    JSON.stringify({
      ...firstBody,
      items,
      unavailable,
      source: `${firstBody.source} + Snapshot completeness retry`,
      version: Math.max(firstBody.version ?? 0, secondBody.version ?? 0, 15),
    }),
    {
      status: firstResponse.status,
      headers: firstResponse.headers,
    }
  );
};
