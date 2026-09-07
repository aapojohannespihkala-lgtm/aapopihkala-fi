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

type DisplayRow = {
  id: MarketPerformanceId;
  label: string;
  identifier: string;
};

const API_URL = '/api/current/market-performance';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const DISPLAY_ROWS: DisplayRow[] = [
  { id: 'handelsbanken-usa', label: 'Handelsbanken Usa Indeksi', identifier: 'SE0006800140' },
  { id: 'nordnet-finland', label: 'Nordnet Suomi Indeksi', identifier: 'SE0005993102' },
  { id: 'ishares-world', label: 'iShares Core MSCI World UCITS ETF USD (Acc)', identifier: 'EUNL.DE' },
  { id: 'ishares-europe', label: 'iShares Core MSCI Europe UCITS ETF EUR (Acc)', identifier: 'EUNK.DE' },
  { id: 'nordnet-sweden', label: 'Nordnet Sverige Index', identifier: 'SE0002756973' },
  { id: 'spiltan-investmentbolag', label: 'Spiltan Aktiefond Investmentbolag', identifier: 'SE0004297927' },
  { id: 'storebrand-japan', label: 'Storebrand Japan A EUR', identifier: 'SE0013801479' },
  { id: 'franklin-sp500-climate', label: 'Franklin S&P 500 Paris Aligned Climate UCITS ETF', identifier: 'FLX5.DE' },
  { id: 'xact-norden', label: 'XACT Norden', identifier: 'XACT-NORDEN.ST' },
  { id: 'nordea', label: 'Nordea', identifier: 'NDA-FI.HE' },
  { id: 'marimekko', label: 'Marimekko', identifier: 'MEKKO.HE' },
  { id: 'remedy', label: 'Remedy', identifier: 'REMEDY.HE' },
  { id: 'op-asia-index-a', label: 'OP-Aasia Indeksi A', identifier: 'FI4000029491' },
  { id: 'op-europe-index-a', label: 'OP-Eurooppa Indeksi A', identifier: 'FI4000029301' },
  { id: 'op-world-index-a', label: 'OP-Maailma Indeksi A', identifier: 'FI4000261128' },
  { id: 'op-forest-owner-b', label: 'OP-Metsänomistaja B', identifier: 'FI4000108436' },
  { id: 'btc', label: 'BTC', identifier: 'BTC-EUR' },
  { id: 'bnb', label: 'BNB', identifier: 'BNB-EUR' },
  { id: 'eth', label: 'ETH', identifier: 'ETH-EUR' },
];

const IDS = new Set<MarketPerformanceId>(DISPLAY_ROWS.map((row) => row.id));

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

const formatPrice = (item: MarketPerformanceItem) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: item.price >= 1000 ? 0 : 2,
    maximumFractionDigits: item.price >= 1000 ? 0 : 2,
  }).format(item.price);

const formatChange = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const applyChangeTone = (element: HTMLElement, value: number) => {
  element.classList.remove('is-positive', 'is-negative', 'is-flat');
  element.classList.add(value > 0.005 ? 'is-positive' : value < -0.005 ? 'is-negative' : 'is-flat');
};

const createCell = (period: keyof MarketPerformanceItem['changes'], className?: string) => {
  const cell = document.createElement('span');
  cell.setAttribute('role', 'cell');
  cell.dataset.marketPerformanceChange = period;
  cell.textContent = '--';
  if (className) cell.className = className;
  return cell;
};

const syncDisplayRows = (root: HTMLElement) => {
  const table = root.querySelector<HTMLElement>('.markets-custom-table');
  if (!table || table.dataset.portfolioRowsReady === 'true') return;

  table.querySelectorAll('[data-market-performance-row]').forEach((row) => row.remove());

  for (const item of DISPLAY_ROWS) {
    const row = document.createElement('div');
    row.className = 'markets-custom-row';
    row.setAttribute('role', 'row');
    row.dataset.marketPerformanceRow = item.id;

    const market = document.createElement('span');
    market.className = 'markets-custom-market';
    market.setAttribute('role', 'rowheader');

    const label = document.createElement('strong');
    label.textContent = item.label;
    const identifier = document.createElement('small');
    identifier.textContent = item.identifier;
    market.append(label, identifier);

    const price = document.createElement('span');
    price.className = 'markets-custom-price';
    price.setAttribute('role', 'cell');
    price.dataset.marketPerformancePrice = '';
    price.textContent = '--';

    row.append(
      market,
      price,
      createCell('today'),
      createCell('week1', 'period-week1'),
      createCell('month1'),
      createCell('month6', 'period-month6'),
      createCell('year1')
    );
    table.append(row);
  }

  table.dataset.portfolioRowsReady = 'true';
};

export const initCurrentMarketPerformance = () => {
  const root = document.querySelector<HTMLElement>('[data-current-market-performance]');
  if (!root || root.dataset.marketPerformanceInitialized === 'true') return;
  root.dataset.marketPerformanceInitialized = 'true';

  syncDisplayRows(root);

  const status = root.querySelector<HTMLElement>('[data-market-performance-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-market-performance-retry]');

  const render = (items: MarketPerformanceItem[], expected: number) => {
    for (const item of items) {
      const row = root.querySelector<HTMLElement>(`[data-market-performance-row="${item.id}"]`);
      if (!row) continue;

      const price = row.querySelector<HTMLElement>('[data-market-performance-price]');
      if (price) price.textContent = formatPrice(item);

      const values: Array<[keyof MarketPerformanceItem['changes'], number]> = [
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
          ? `LIVE / ${items.length} HOLDINGS`
          : `PARTIAL / ${items.length} OF ${expected} HOLDINGS`;
    }
  };

  const load = async () => {
    root.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'LOADING / MARKET DATA';

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Market performance request failed: ${response.status}`);

      const data = (await response.json()) as MarketPerformanceResponse;
      const items = Array.isArray(data.items) ? data.items.filter(isPerformanceItem) : [];
      if (items.length === 0) throw new Error('Market performance response contained no rows');

      const expected = typeof data.expected === 'number' ? data.expected : DISPLAY_ROWS.length;
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
