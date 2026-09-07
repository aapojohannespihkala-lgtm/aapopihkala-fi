type MarketMacroId = 'euribor-3m';
type MarketSeriesId = 'euribor-3m' | 'world';

type MacroItem = {
  id: MarketMacroId;
  value: number;
  observedAt: string;
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

type AxisScale = {
  minimum: number;
  midpoint: number;
  maximum: number;
  step: number;
};

const MARKETS_API_URL = '/api/current/markets';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const MARKET_IDS = new Set<MarketMacroId>(['euribor-3m']);
const SERIES_IDS = new Set<MarketSeriesId>(['euribor-3m', 'world']);
const NICE_FACTORS = [1, 2, 2.5, 5, 10];

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
    item.id === 'euribor-3m' &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
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

const formatEuriborValue = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);

const formatSeriesChange = (series: MarketSeries) => {
  const sign = series.change1y > 0 ? '+' : '';
  return series.id === 'euribor-3m'
    ? `${sign}${series.change1y.toFixed(3)} PP`
    : `${sign}${series.change1y.toFixed(2)}%`;
};

const niceStep = (minimumStep: number) => {
  if (!Number.isFinite(minimumStep) || minimumStep <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(minimumStep));
  const fraction = minimumStep / magnitude;
  const factor = NICE_FACTORS.find((candidate) => candidate >= fraction) ?? 10;
  return factor * magnitude;
};

const buildAxisScale = (values: number[]): AxisScale => {
  let rawMinimum = Math.min(...values);
  let rawMaximum = Math.max(...values);

  if (rawMinimum === rawMaximum) {
    const padding = Math.max(Math.abs(rawMinimum) * 0.05, 0.5);
    rawMinimum -= padding;
    rawMaximum += padding;
  }

  const step = niceStep((rawMaximum - rawMinimum) / 2);
  let minimum = Math.floor(rawMinimum / step) * step;
  let maximum = minimum + step * 2;

  if (maximum < rawMaximum) {
    maximum = Math.ceil(rawMaximum / step) * step;
    minimum = maximum - step * 2;
  }

  return {
    minimum,
    midpoint: minimum + step,
    maximum: minimum + step * 2,
    step,
  };
};

const decimalPlacesForStep = (step: number) => {
  for (let decimals = 0; decimals <= 3; decimals += 1) {
    const scaled = step * 10 ** decimals;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-8) return decimals;
  }
  return 3;
};

const formatAxisValue = (series: MarketSeries, value: number, step: number) => {
  const decimals = decimalPlacesForStep(step);
  const formatted = value.toFixed(decimals);
  return series.id === 'euribor-3m' ? `${formatted}%` : formatted;
};

const getPlotValues = (series: MarketSeries) => {
  if (series.id === 'euribor-3m') return series.points.map((point) => point.value);

  const baseline = series.points[0]?.value;
  if (!baseline || !Number.isFinite(baseline)) return [];
  return series.points.map((point) => (point.value / baseline) * 100);
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
      if (target) target.textContent = formatEuriborValue(item.value);
    }
  };

  const renderSparkline = (series: MarketSeries) => {
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${series.id}"]`);
    const path = svg?.querySelector<SVGPathElement>('path');
    const values = getPlotValues(series);
    if (!svg || !path || values.length < 2) return;

    const width = 240;
    const height = 56;
    const padding = 2;
    const scale = buildAxisScale(values);
    const range = scale.maximum - scale.minimum || 1;
    const drawableWidth = width - padding * 2;
    const drawableHeight = height - padding * 2;

    const d = values
      .map((value, index) => {
        const x = padding + (index / (values.length - 1)) * drawableWidth;
        const y = padding + (1 - (value - scale.minimum) / range) * drawableHeight;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    path.setAttribute('d', d);
    svg.classList.remove('markets-sparkline--pending');
    svg.setAttribute(
      'aria-label',
      series.id === 'euribor-3m'
        ? '3 month Euribor one year trend'
        : 'World equity one year trend indexed to 100 at the start of the period'
    );

    const axisTicks: Array<['max' | 'mid' | 'min', number]> = [
      ['max', scale.maximum],
      ['mid', scale.midpoint],
      ['min', scale.minimum],
    ];

    for (const [level, value] of axisTicks) {
      const target = root.querySelector<HTMLElement>(
        `[data-market-axis="${series.id}"][data-axis-level="${level}"]`
      );
      if (target) target.textContent = formatAxisValue(series, value, scale.step);
    }

    const fallback = root.querySelector<HTMLElement>(
      `[data-market-sparkline-fallback="${series.id}"]`
    );
    if (fallback) fallback.hidden = true;
  };

  const renderSeries = (seriesItems: MarketSeries[]) => {
    for (const series of seriesItems) {
      const changeTarget = root.querySelector<HTMLElement>(
        `[data-market-series-change="${series.id}"]`
      );
      if (changeTarget) changeTarget.textContent = formatSeriesChange(series);

      if (series.id === 'world') {
        const observationTarget = root.querySelector<HTMLElement>('[data-markets-observation]');
        if (observationTarget) observationTarget.textContent = series.observedAt;
      }

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