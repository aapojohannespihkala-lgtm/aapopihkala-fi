import '../../styles/current-markets-custom-dynamic.css';

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

type PerformancePeriod =
  | 'today'
  | 'week1'
  | 'month1'
  | 'month3'
  | 'month6'
  | 'ytd'
  | 'year1'
  | 'year3'
  | 'year5';

type MarketPerformanceItem = {
  id: MarketPerformanceId;
  label: string;
  symbol: string;
  price: number;
  observedAt: string;
  changes: Record<PerformancePeriod, number | null>;
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

type PeriodDefinition = {
  key: PerformancePeriod;
  label: string;
  className: string;
};

const API_URL = '/api/current/markets?portfolio=1&v=5';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const PERIODS: PeriodDefinition[] = [
  { key: 'today', label: '1D', className: 'period-day1' },
  { key: 'week1', label: '1W', className: 'period-week1' },
  { key: 'month1', label: '1M', className: 'period-month1' },
  { key: 'month3', label: '3M', className: 'period-month3' },
  { key: 'month6', label: '6M', className: 'period-month6' },
  { key: 'ytd', label: 'YTD', className: 'period-ytd' },
  { key: 'year1', label: '1Y', className: 'period-year1' },
  { key: 'year3', label: '3Y', className: 'period-year3' },
  { key: 'year5', label: '5Y', className: 'period-year5' },
];

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

const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

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
    PERIODS.every(({ key }) => isNullableFiniteNumber(changes[key]))
  );
};

const formatChange = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const applyChangeTone = (element: HTMLElement, value: number) => {
  element.classList.remove('is-positive', 'is-negative', 'is-flat');
  element.classList.add(value > 0.005 ? 'is-positive' : value < -0.005 ? 'is-negative' : 'is-flat');
};

const createCell = (period: PeriodDefinition) => {
  const cell = document.createElement('span');
  cell.setAttribute('role', 'cell');
  cell.dataset.marketPerformanceChange = period.key;
  cell.className = period.className;
  cell.textContent = '--';
  return cell;
};

const syncHeader = (table: HTMLElement) => {
  const header = table.querySelector<HTMLElement>('.markets-custom-row--header');
  if (!header) return;

  header.replaceChildren();

  const market = document.createElement('span');
  market.setAttribute('role', 'columnheader');
  market.textContent = 'MARKET';
  header.append(market);

  for (const period of PERIODS) {
    const cell = document.createElement('span');
    cell.setAttribute('role', 'columnheader');
    cell.className = period.className;
    cell.textContent = period.label;
    header.append(cell);
  }
};

const syncDisplayRows = (root: HTMLElement) => {
  const table = root.querySelector<HTMLElement>('.markets-custom-table');
  if (!table || table.dataset.portfolioRowsReady === 'true') return;

  const panelLabel = root.querySelector<HTMLElement>('.markets-panel-heading--performance .markets-panel-label');
  if (panelLabel) panelLabel.textContent = 'PORTFOLIO / PERFORMANCE';

  syncHeader(table);
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

    row.append(market, ...PERIODS.map(createCell));
    table.append(row);
  }

  table.dataset.portfolioRowsReady = 'true';
};

const resetRows = (root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>('[data-market-performance-row]').forEach((row) => {
    row.removeAttribute('data-market-performance-loaded');

    row.querySelectorAll<HTMLElement>('[data-market-performance-change]').forEach((cell) => {
      cell.textContent = '--';
      cell.classList.remove('is-positive', 'is-negative', 'is-flat');
    });
  });
};

export const initCurrentMarketPerformance = () => {
  const root = document.querySelector<HTMLElement>('[data-current-market-performance]');
  if (!root || root.dataset.marketPerformanceInitialized === 'true') return;
  root.dataset.marketPerformanceInitialized = 'true';

  syncDisplayRows(root);

  const status = root.querySelector<HTMLElement>('[data-market-performance-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-market-performance-retry]');

  const render = (items: MarketPerformanceItem[], expected: number) => {
    resetRows(root);

    for (const item of items) {
      const row = root.querySelector<HTMLElement>(`[data-market-performance-row="${item.id}"]`);
      if (!row) continue;

      for (const period of PERIODS) {
        const target = row.querySelector<HTMLElement>(`[data-market-performance-change="${period.key}"]`);
        if (!target) continue;

        const value = item.changes[period.key];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          target.textContent = '--';
          target.classList.remove('is-positive', 'is-negative', 'is-flat');
          continue;
        }

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
      const expected = typeof data.expected === 'number' ? data.expected : DISPLAY_ROWS.length;

      render(items, expected);
      root.setAttribute('aria-busy', 'false');
    } catch {
      resetRows(root);
      root.setAttribute('aria-busy', 'false');
      if (status) status.textContent = 'DATA UNAVAILABLE';
    }
  };

  retry?.addEventListener('click', load);
  void load();
  window.setInterval(load, REFRESH_INTERVAL_MS);
};
