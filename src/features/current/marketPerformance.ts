type MarketPerformanceId =
  | 'world'
  | 'usa'
  | 'europe'
  | 'nordic'
  | 'finland'
  | 'japan'
  | 'bitcoin'
  | 'remedy';

type MarketPerformanceItem = {
  id: MarketPerformanceId;
  label: string;
  symbol: string;
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

type MarketPerformanceResponse = {
  items?: unknown;
  expected?: unknown;
};

const API_URL = '/api/current/market-performance';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const IDS = new Set<MarketPerformanceId>([
  'world',
  'usa',
  'europe',
  'nordic',
  'finland',
  'japan',
  'bitcoin',
  'remedy',
]);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPerformanceItem = (value: unknown): value is MarketPerformanceItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MarketPerformanceItem>;
  const changes = item.changes as Partial<MarketPerformanceItem['changes']> | undefined;

  return (
    typeof item.id === 'string' &&
    IDS.has(item.id as MarketPerformanceId) &&
    typeof item.label === 'string' &&
    typeof item.symbol === 'string' &&
    isFiniteNumber(item.price) &&
    typeof item.observedAt === 'string' &&
    !!changes &&
    isFiniteNumber(changes.today) &&
    isFiniteNumber(changes.week1) &&
    isFiniteNumber(changes.month1) &&
    isFiniteNumber(changes.month6) &&
    isFiniteNumber(changes.year1)
  );
};

const formatPrice = (item: MarketPerformanceItem) => {
  const maximumFractionDigits =
    item.id === 'bitcoin' || item.price >= 1000 ? 0 : item.price >= 100 ? 2 : 2;

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: item.id === 'bitcoin' || item.price >= 1000 ? 0 : 2,
    maximumFractionDigits,
  }).format(item.price);
};

const formatChange = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const applyChangeTone = (element: HTMLElement, value: number) => {
  element.classList.remove('is-positive', 'is-negative', 'is-flat');
  element.classList.add(value > 0.005 ? 'is-positive' : value < -0.005 ? 'is-negative' : 'is-flat');
};

export const initCurrentMarketPerformance = () => {
  const root = document.querySelector<HTMLElement>('[data-current-market-performance]');
  if (!root || root.dataset.marketPerformanceInitialized === 'true') return;
  root.dataset.marketPerformanceInitialized = 'true';

  const status = root.querySelector<HTMLElement>('[data-market-performance-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-market-performance-retry]');

  const render = (items: MarketPerformanceItem[], expected: number) => {
    for (const item of items) {
      const row = root.querySelector<HTMLElement>(`[data-market-performance-row="${item.id}"]`);
      if (!row) continue;

      const price = row.querySelector<HTMLElement>('[data-market-performance-price]');
      if (price) price.textContent = formatPrice(item);

      const values: Array<[string, number]> = [
        ['today', item.changes.today],
        ['week1', item.changes.week1],
        ['month1', item.changes.month1],
        ['month6', item.changes.month6],
        ['year1', item.changes.year1],
      ];

      for (const [period, value] of values) {
        const target = row.querySelector<HTMLElement>(`[data-market-performance-change="${period}"]`);
        if (!target) continue;
        target.textContent = formatChange(value);
        applyChangeTone(target, value);
      }

      row.dataset.marketPerformanceLoaded = 'true';
    }

    if (status) {
      status.textContent =
        items.length === expected
          ? `LIVE / ${items.length} MARKETS`
          : `PARTIAL / ${items.length} OF ${expected} MARKETS`;
    }
  };

  const load = async () => {
    root.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'LOADING / YAHOO FINANCE';

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Market performance request failed: ${response.status}`);

      const data = (await response.json()) as MarketPerformanceResponse;
      const items = Array.isArray(data.items) ? data.items.filter(isPerformanceItem) : [];
      if (items.length === 0) throw new Error('Market performance response contained no rows');

      const expected = typeof data.expected === 'number' ? data.expected : IDS.size;
      render(items, expected);
      root.setAttribute('aria-busy', 'false');
    } catch {
      root.setAttribute('aria-busy', 'false');
      if (status) status.textContent = 'DATA UNAVAILABLE';
    }
  };

  retry?.addEventListener('click', load);
  void load();
  window.setInterval(load, REFRESH_INTERVAL_MS);
};
