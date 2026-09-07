type MarketMacroId = 'eur-usd' | 'euribor-3m';
type MarketSeriesId = 'euribor-3m' | 'world';

type MacroItem = {
  id: MarketMacroId;
  value: number;
  observedAt: string;
  change1m: number;
};

type SeriesPoint = {
  value: number;
  observedAt: string;
};

type MarketSeries = SeriesPoint & {
  id: MarketSeriesId;
  change1y: number;
  points: SeriesPoint[];
};

type MarketsResponse = {
  items?: unknown;
  series?: unknown;
};

const MARKETS_API_URL = '/api/current/markets';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const MARKET_IDS = new Set<MarketMacroId>(['eur-usd', 'euribor-3m']);
const SERIES_IDS = new Set<MarketSeriesId>(['euribor-3m', 'world']);

const isSeriesPoint = (value: unknown): value is SeriesPoint => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<SeriesPoint>;
  return (
    typeof point.value === 'number' &&
    Number.isFinite(point.value) &&
    typeof point.observedAt === 'string' &&
    point.observedAt.length > 0
  );
};

const isMacroItem = (value: unknown): value is MacroItem => {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<MacroItem>;
  return (
    typeof item.id === 'string' &&
    MARKET_IDS.has(item.id as MarketMacroId) &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
    typeof item.change1m === 'number' &&
    Number.isFinite(item.change1m) &&
    typeof item.observedAt === 'string' &&
    item.observedAt.length > 0
  );
};

const isMarketSeries = (value: unknown): value is MarketSeries => {
  if (!value || typeof value !== 'object') return false;

  const series = value as Partial<MarketSeries>;
  return (
    typeof series.id === 'string' &&
    SERIES_IDS.has(series.id as MarketSeriesId) &&
    typeof series.value === 'number' &&
    Number.isFinite(series.value) &&
    typeof series.change1y === 'number' &&
    Number.isFinite(series.change1y) &&
    typeof series.observedAt === 'string' &&
    series.observedAt.length > 0 &&
    Array.isArray(series.points) &&
    series.points.length >= 2 &&
    series.points.every(isSeriesPoint)
  );
};

const formatValue = (id: MarketMacroId, value: number) => {
  const decimals = id === 'euribor-3m' ? 3 : 4;

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatWorldValue = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatChange = (item: MacroItem) => {
  if (item.id === 'eur-usd') {
    const magnitude = Math.abs(item.change1m).toFixed(2);
    if (Math.abs(item.change1m) < 0.005) return `FLAT · ${magnitude}% / 1M`;
    return `${item.change1m > 0 ? 'EUR' : 'USD'} STRONGER · ${magnitude}% / 1M`;
  }

  const sign = item.change1m > 0 ? '+' : '';
  return `${sign}${item.change1m.toFixed(3)} PP / 1M`;
};

const formatSeriesChange = (series: MarketSeries) => {
  const sign = series.change1y > 0 ? '+' : '';
  return series.id === 'euribor-3m'
    ? `${sign}${series.change1y.toFixed(3)} PP`
    : `${sign}${series.change1y.toFixed(2)}%`;
};

export const initCurrentMarkets = () => {
  const root = document.querySelector<HTMLElement>('[data-current-markets]');
  if (!root || root.dataset.marketsInitialized === 'true') return;
  root.dataset.marketsInitialized = 'true';

  const errorTarget = root.querySelector<HTMLElement>('[data-markets-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-markets-retry]');

  const renderItems = (items: MacroItem[]) => {
    for (const item of items) {
      const target = root.querySelector<HTMLElement>(`[data-market-value="${item.id}"]`);
      if (target) target.textContent = formatValue(item.id, item.value);

      const changeTarget = root.querySelector<HTMLElement>(`[data-market-change="${item.id}"]`);
      if (changeTarget) changeTarget.textContent = formatChange(item);

      const observationTarget = root.querySelector<HTMLElement>(
        `[data-market-observation="${item.id}"]`
      );
      if (observationTarget) observationTarget.textContent = item.observedAt;
    }
  };

  const renderSparkline = (series: MarketSeries) => {
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${series.id}"]`);
    const path = svg?.querySelector<SVGPathElement>('path');
    if (!svg || !path || series.points.length < 2) return;

    const width = 240;
    const height = 56;
    const padding = 2;
    const values = series.points.map((point) => point.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;
    const drawableWidth = width - padding * 2;
    const drawableHeight = height - padding * 2;

    const d = series.points
      .map((point, index) => {
        const x = padding + (index / (series.points.length - 1)) * drawableWidth;
        const y = padding + (1 - (point.value - minimum) / range) * drawableHeight;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    path.setAttribute('d', d);
    svg.hidden = false;
    svg.setAttribute(
      'aria-label',
      `${series.id === 'euribor-3m' ? '3 month Euribor' : 'World equity proxy'} one year trend`
    );

    const fallback = root.querySelector<HTMLElement>(
      `[data-market-sparkline-fallback="${series.id}"]`
    );
    if (fallback) fallback.hidden = true;
  };

  const renderSeries = (seriesItems: MarketSeries[]) => {
    for (const series of seriesItems) {
      if (series.id === 'world') {
        const valueTarget = root.querySelector<HTMLElement>('[data-market-value="world"]');
        if (valueTarget) valueTarget.textContent = formatWorldValue(series.value);
      }

      const changeTarget = root.querySelector<HTMLElement>(
        `[data-market-series-change="${series.id}"]`
      );
      if (changeTarget) changeTarget.textContent = formatSeriesChange(series);

      const observationTarget = root.querySelector<HTMLElement>(
        `[data-market-observation="${series.id}"]`
      );
      if (observationTarget) observationTarget.textContent = series.observedAt;

      renderSparkline(series);
    }
  };

  const loadMarkets = async () => {
    root.setAttribute('aria-busy', 'true');
    if (errorTarget) errorTarget.hidden = true;

    try {
      const response = await fetch(MARKETS_API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`Markets request failed: ${response.status}`);

      const data = (await response.json()) as MarketsResponse;
      if (!Array.isArray(data.items)) throw new Error('Markets response contained no data');

      const items = data.items.filter(isMacroItem);
      if (items.length !== MARKET_IDS.size) throw new Error('Markets response was incomplete');

      const seriesItems = Array.isArray(data.series) ? data.series.filter(isMarketSeries) : [];

      renderItems(items);
      renderSeries(seriesItems);
      root.setAttribute('aria-busy', 'false');

      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'markets', at: new Date().toISOString() },
        })
      );
    } catch {
      root.setAttribute('aria-busy', 'false');
      if (errorTarget) errorTarget.hidden = false;
    }
  };

  retryButton?.addEventListener('click', loadMarkets);

  void loadMarkets();
  window.setInterval(loadMarkets, REFRESH_INTERVAL_MS);
};
