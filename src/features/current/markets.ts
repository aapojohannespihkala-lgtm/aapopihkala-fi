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
  maximum: number;
  step: number;
  ticks: number[];
};

type ChartState = {
  series: MarketSeries;
  values: number[];
  scale: AxisScale;
};

const MARKETS_API_URL = '/api/current/markets';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const MARKET_IDS = new Set<MarketMacroId>(['euribor-3m']);
const SERIES_IDS = new Set<MarketSeriesId>(['euribor-3m', 'world']);
const AXIS_STEPS: Record<MarketSeriesId, number> = {
  'euribor-3m': 0.2,
  world: 10,
};
const CHART_WIDTH = 240;
const CHART_HEIGHT = 64;
const CHART_PADDING = 2;
const SCALE_EPSILON = 1e-9;

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

const buildAxisScale = (values: number[], step: number): AxisScale => {
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  let minimum = Math.floor((rawMinimum + SCALE_EPSILON) / step) * step;
  let maximum = Math.ceil((rawMaximum - SCALE_EPSILON) / step) * step;

  if (maximum <= minimum) {
    minimum -= step;
    maximum += step;
  }

  const ticks: number[] = [];
  for (let value = maximum; value >= minimum - SCALE_EPSILON; value -= step) {
    ticks.push(Number(value.toFixed(10)));
  }

  return { minimum, maximum, step, ticks };
};

const formatAxisValue = (id: MarketSeriesId, value: number) =>
  id === 'euribor-3m' ? `${value.toFixed(1)}%` : value.toFixed(0);

const getPlotValues = (series: MarketSeries) => {
  if (series.id === 'euribor-3m') return series.points.map((point) => point.value);

  const baseline = series.points[0]?.value;
  if (!baseline || !Number.isFinite(baseline)) return [];
  return series.points.map((point) => (point.value / baseline) * 100);
};

const formatObservationDate = (observedAt: string) => {
  const date = new Date(`${observedAt}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return observedAt;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase();
};

const formatInspectionValue = (id: MarketSeriesId, value: number) => {
  if (id === 'euribor-3m') return `${value.toFixed(3)}%`;

  const change = value - 100;
  const sign = change > 0 ? '+' : '';
  return `${value.toFixed(1)} · ${sign}${change.toFixed(1)}%`;
};

export const initCurrentMarkets = () => {
  const root = document.querySelector<HTMLElement>('[data-current-markets]');
  if (!root || root.dataset.marketsInitialized === 'true') return;
  root.dataset.marketsInitialized = 'true';

  const errorTarget = root.querySelector<HTMLElement>('[data-markets-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-markets-retry]');
  const chartStates = new Map<MarketSeriesId, ChartState>();
  const inspectedIndexes = new Map<MarketSeriesId, number | null>();

  const renderItems = (items: MacroItem[]) => {
    for (const item of items) {
      const target = root.querySelector<HTMLElement>(`[data-market-value="${item.id}"]`);
      if (target) target.textContent = formatEuriborValue(item.value);
    }
  };

  const hideInspection = (id: MarketSeriesId) => {
    const tooltip = root.querySelector<HTMLElement>(`[data-market-tooltip="${id}"]`);
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${id}"]`);
    const line = svg?.querySelector<SVGLineElement>('[data-market-inspection-line]');
    const point = svg?.querySelector<SVGCircleElement>('[data-market-inspection-point]');

    if (tooltip) tooltip.hidden = true;
    line?.setAttribute('opacity', '0');
    point?.setAttribute('opacity', '0');
  };

  const renderInspection = (id: MarketSeriesId, index: number) => {
    const state = chartStates.get(id);
    const pointData = state?.series.points[index];
    const value = state?.values[index];
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${id}"]`);
    const stage = root.querySelector<HTMLElement>(`[data-market-chart-stage="${id}"]`);
    const tooltip = root.querySelector<HTMLElement>(`[data-market-tooltip="${id}"]`);
    const tooltipDate = root.querySelector<HTMLElement>(`[data-market-tooltip-date="${id}"]`);
    const tooltipValue = root.querySelector<HTMLElement>(`[data-market-tooltip-value="${id}"]`);

    if (!state || !pointData || value === undefined || !svg || !stage || !tooltip) {
      hideInspection(id);
      return;
    }

    const range = state.scale.maximum - state.scale.minimum || 1;
    const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;
    const x =
      CHART_PADDING +
      (index / Math.max(1, state.values.length - 1)) * drawableWidth;
    const y =
      CHART_PADDING +
      (1 - (value - state.scale.minimum) / range) * drawableHeight;
    const line = svg.querySelector<SVGLineElement>('[data-market-inspection-line]');
    const marker = svg.querySelector<SVGCircleElement>('[data-market-inspection-point]');

    line?.setAttribute('x1', x.toFixed(2));
    line?.setAttribute('x2', x.toFixed(2));
    line?.setAttribute('y1', String(CHART_PADDING));
    line?.setAttribute('y2', String(CHART_HEIGHT - CHART_PADDING));
    line?.setAttribute('opacity', '1');
    marker?.setAttribute('cx', x.toFixed(2));
    marker?.setAttribute('cy', y.toFixed(2));
    marker?.setAttribute('opacity', '1');

    if (tooltipDate) tooltipDate.textContent = formatObservationDate(pointData.observedAt);
    if (tooltipValue) tooltipValue.textContent = formatInspectionValue(id, value);
    tooltip.hidden = false;

    const stageWidth = stage.clientWidth || CHART_WIDTH;
    const desiredLeft = (x / CHART_WIDTH) * stageWidth;
    const tooltipHalfWidth = tooltip.offsetWidth / 2;
    const clampedLeft = Math.max(
      tooltipHalfWidth + 4,
      Math.min(stageWidth - tooltipHalfWidth - 4, desiredLeft)
    );
    tooltip.style.left = `${clampedLeft}px`;
  };

  const renderAxisAndGrid = (
    id: MarketSeriesId,
    svg: SVGSVGElement,
    scale: AxisScale
  ) => {
    const axis = root.querySelector<HTMLElement>(`[data-market-axis="${id}"]`);
    const grid = svg.querySelector<SVGGElement>('[data-market-grid]');
    const range = scale.maximum - scale.minimum || 1;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;

    if (axis) {
      const labels = scale.ticks.map((value) => {
        const label = document.createElement('span');
        const ratio = (scale.maximum - value) / range;
        label.className = 'markets-sparkline-axis__tick';
        label.dataset.axisValue = String(value);
        label.textContent = formatAxisValue(id, value);
        label.style.top = `${ratio * 100}%`;
        return label;
      });
      axis.replaceChildren(...labels);
    }

    if (grid) {
      const lines = scale.ticks.map((value) => {
        const ratio = (scale.maximum - value) / range;
        const y = CHART_PADDING + ratio * drawableHeight;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(CHART_PADDING));
        line.setAttribute('x2', String(CHART_WIDTH - CHART_PADDING));
        line.setAttribute('y1', y.toFixed(2));
        line.setAttribute('y2', y.toFixed(2));
        return line;
      });
      grid.replaceChildren(...lines);
    }
  };

  const renderSparkline = (series: MarketSeries) => {
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${series.id}"]`);
    const path = svg?.querySelector<SVGPathElement>('[data-market-line]');
    const values = getPlotValues(series);
    if (!svg || !path || values.length < 2) return;

    const scale = buildAxisScale(values, AXIS_STEPS[series.id]);
    const range = scale.maximum - scale.minimum || 1;
    const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;

    const d = values
      .map((value, index) => {
        const x = CHART_PADDING + (index / (values.length - 1)) * drawableWidth;
        const y =
          CHART_PADDING +
          (1 - (value - scale.minimum) / range) * drawableHeight;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    path.setAttribute('d', d);
    svg.classList.remove('markets-sparkline--pending');
    svg.setAttribute(
      'aria-label',
      series.id === 'euribor-3m'
        ? '3 month Euribor one year trend. Touch, hover or use the arrow keys to inspect values.'
        : 'World equity one year trend indexed to 100 at the start of the period. Touch, hover or use the arrow keys to inspect values.'
    );

    renderAxisAndGrid(series.id, svg, scale);
    chartStates.set(series.id, { series, values, scale });

    const inspectedIndex = inspectedIndexes.get(series.id);
    if (inspectedIndex !== null && inspectedIndex !== undefined && inspectedIndex < values.length) {
      renderInspection(series.id, inspectedIndex);
    } else {
      hideInspection(series.id);
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

  const bindChartInteraction = (id: MarketSeriesId) => {
    const svg = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${id}"]`);
    if (!svg) return;

    const hitTarget = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitTarget.dataset.marketHitTarget = id;
    hitTarget.setAttribute('x', '0');
    hitTarget.setAttribute('y', '0');
    hitTarget.setAttribute('width', String(CHART_WIDTH));
    hitTarget.setAttribute('height', String(CHART_HEIGHT));
    hitTarget.setAttribute('fill', 'transparent');
    hitTarget.setAttribute('pointer-events', 'all');
    svg.insertBefore(hitTarget, svg.firstChild);

    let activeTouchPointerId: number | null = null;

    const inspectAtClientX = (clientX: number) => {
      const state = chartStates.get(id);
      if (!state || state.values.length === 0) return;

      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0) return;

      const svgX = ((clientX - rect.left) / rect.width) * CHART_WIDTH;
      const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
      const ratio = Math.max(
        0,
        Math.min(1, (svgX - CHART_PADDING) / drawableWidth)
      );
      const index = Math.round(ratio * (state.values.length - 1));

      inspectedIndexes.set(id, index);
      renderInspection(id, index);
    };

    svg.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      inspectAtClientX(event.clientX);
    });

    svg.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') {
        activeTouchPointerId = event.pointerId;
        try {
          svg.setPointerCapture(event.pointerId);
        } catch {
          // Synthetic pointer events and some browsers may not expose pointer capture.
        }
      }
      inspectAtClientX(event.clientX);
    });

    svg.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && activeTouchPointerId !== event.pointerId) return;
      inspectAtClientX(event.clientX);
    });

    svg.addEventListener('pointerup', (event) => {
      if (activeTouchPointerId === event.pointerId) {
        activeTouchPointerId = null;
        try {
          svg.releasePointerCapture(event.pointerId);
        } catch {
          // The browser may already have released the pointer.
        }
      }
    });

    svg.addEventListener('pointercancel', (event) => {
      if (activeTouchPointerId === event.pointerId) activeTouchPointerId = null;
    });

    svg.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      inspectedIndexes.set(id, null);
      hideInspection(id);
    });

    svg.addEventListener('focus', () => {
      if (inspectedIndexes.get(id) !== null && inspectedIndexes.get(id) !== undefined) return;
      const state = chartStates.get(id);
      if (!state || state.values.length === 0) return;
      const index = state.values.length - 1;
      inspectedIndexes.set(id, index);
      renderInspection(id, index);
    });

    svg.addEventListener('blur', () => {
      inspectedIndexes.set(id, null);
      hideInspection(id);
    });

    svg.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const state = chartStates.get(id);
      if (!state || state.values.length === 0) return;

      event.preventDefault();
      const currentIndex = inspectedIndexes.get(id) ?? state.values.length - 1;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = Math.max(
        0,
        Math.min(state.values.length - 1, currentIndex + direction)
      );
      inspectedIndexes.set(id, nextIndex);
      renderInspection(id, nextIndex);
    });
  };

  for (const id of SERIES_IDS) bindChartInteraction(id);

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
