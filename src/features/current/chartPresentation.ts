type MarketSeriesId = 'euribor-3m' | 'world';

type MarketPoint = {
  value: number;
  observedAt: string;
};

type MarketSeries = MarketPoint & {
  id: MarketSeriesId;
  change1y: number;
  points: MarketPoint[];
};

type MarketPayload = {
  series?: unknown;
};

type MarketScale = {
  minimum: number;
  maximum: number;
  ticks: number[];
};

type MarketGeometry = {
  width: number;
  height: number;
  left: number;
  right: number;
  plotTop: number;
  plotBottom: number;
  plotWidth: number;
  plotHeight: number;
};

const MARKET_IDS: MarketSeriesId[] = ['euribor-3m', 'world'];
const MARKET_AXIS_STEPS: Record<MarketSeriesId, number> = {
  'euribor-3m': 0.2,
  world: 10,
};
const SVG_NS = 'http://www.w3.org/2000/svg';

const isMarketPoint = (value: unknown): value is MarketPoint => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<MarketPoint>;
  return (
    typeof point.value === 'number' &&
    Number.isFinite(point.value) &&
    typeof point.observedAt === 'string' &&
    point.observedAt.length > 0
  );
};

const isMarketSeries = (value: unknown): value is MarketSeries => {
  if (!value || typeof value !== 'object') return false;
  const series = value as Partial<MarketSeries>;
  return (
    (series.id === 'euribor-3m' || series.id === 'world') &&
    typeof series.value === 'number' &&
    Number.isFinite(series.value) &&
    typeof series.change1y === 'number' &&
    Number.isFinite(series.change1y) &&
    typeof series.observedAt === 'string' &&
    Array.isArray(series.points) &&
    series.points.length >= 2 &&
    series.points.every(isMarketPoint)
  );
};

const installChartStyles = () => {
  if (document.getElementById('current-chart-presentation-styles')) return;

  const style = document.createElement('style');
  style.id = 'current-chart-presentation-styles';
  style.textContent = `
    .current-shell .electricity-chart .electricity-chart__window-label,
    .current-shell .electricity-chart .electricity-chart__window-label--low,
    .current-shell .electricity-chart .electricity-chart__window-label--high {
      fill: var(--stone-light) !important;
    }

    .current-shell .markets-sparkline-tooltip {
      display: none !important;
    }

    .current-shell .markets-chart-annotation {
      fill: var(--ink-soft);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.035em;
      text-anchor: middle;
      pointer-events: none;
    }

    .current-shell .markets-chart-annotation__date {
      fill: var(--stone);
      font-size: 9px;
      font-weight: 500;
    }

    @media (max-width: 640px) {
      .current-shell .markets-chart-annotation {
        font-size: 10px;
      }

      .current-shell .markets-chart-annotation__date {
        font-size: 8.5px;
      }
    }
  `;
  document.head.append(style);
};

const parseClockRange = (value: string) => {
  const match = value.trim().match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
};

const normalizeElectricityLabel = (group: SVGGElement) => {
  const texts = Array.from(group.querySelectorAll<SVGTextElement>(':scope > text'));
  const valueNode = texts[0];
  if (!valueNode) return;

  const originalValue = valueNode.textContent?.trim() ?? '';
  if (originalValue.includes('·')) {
    const compactValue = originalValue.split('·').at(-1)?.trim();
    if (compactValue && compactValue !== originalValue) valueNode.textContent = compactValue;
  }

  const baseY = Number(valueNode.getAttribute('y') || '11');
  const normalizedBaseY = Number.isFinite(baseY) ? baseY : 11;

  const rangeNode =
    group.querySelector<SVGTextElement>('[data-electricity-inspection-range]') ??
    texts.find(
      (text) =>
        text.classList.contains('electricity-chart__window-range') &&
        !text.hasAttribute('data-electricity-window-range-end')
    );
  if (!rangeNode) return;

  const currentRange = rangeNode.textContent?.trim() ?? '';
  const parsedCurrentRange = parseClockRange(currentRange);
  if (parsedCurrentRange) {
    rangeNode.dataset.fullClockRange = currentRange;
  }

  const fullRange = parsedCurrentRange ? currentRange : rangeNode.dataset.fullClockRange ?? '';
  const parsed = parseClockRange(fullRange);
  if (!parsed) return;

  const startText = `${parsed.start} -`;
  if (rangeNode.textContent !== startText) rangeNode.textContent = startText;
  rangeNode.classList.add('electricity-chart__window-range');
  rangeNode.setAttribute('y', String(normalizedBaseY + 10));
  rangeNode.removeAttribute('data-electricity-window-range-end');

  let endNode = group.querySelector<SVGTextElement>('[data-electricity-window-range-end]');
  if (!endNode) {
    endNode = document.createElementNS(SVG_NS, 'text');
    endNode.classList.add('electricity-chart__window-range');
    endNode.setAttribute('data-electricity-window-range-end', '');
    group.append(endNode);
  }

  if (endNode.textContent !== parsed.end) endNode.textContent = parsed.end;
  endNode.setAttribute('y', String(normalizedBaseY + 20));
};

const initElectricityAnnotationParity = () => {
  const chart = document.querySelector<SVGSVGElement>('[data-electricity-chart]');
  if (!chart || chart.dataset.annotationParityInitialized === 'true') return;
  chart.dataset.annotationParityInitialized = 'true';

  let frame = 0;
  const normalize = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      chart
        .querySelectorAll<SVGGElement>('.electricity-chart__window-label')
        .forEach(normalizeElectricityLabel);
    });
  };

  const observer = new MutationObserver(normalize);
  observer.observe(chart, { childList: true, subtree: true, characterData: true });
  normalize();
};

const formatMarketDate = (observedAt: string) => {
  const date = new Date(`${observedAt}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return observedAt.toUpperCase();

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase();
};

const formatMarketInspectionValue = (id: MarketSeriesId, value: number) => {
  if (id === 'euribor-3m') return `${value.toFixed(3)}%`;
  const change = value - 100;
  const sign = change > 0 ? '+' : '';
  return `${value.toFixed(1)} · ${sign}${change.toFixed(1)}%`;
};

const formatAxisValue = (id: MarketSeriesId, value: number) =>
  id === 'euribor-3m' ? `${value.toFixed(1)}%` : value.toFixed(0);

const getMarketValues = (series: MarketSeries) => {
  if (series.id === 'euribor-3m') return series.points.map((point) => point.value);
  const baseline = series.points[0]?.value;
  if (!baseline || !Number.isFinite(baseline)) return [];
  return series.points.map((point) => (point.value / baseline) * 100);
};

const buildMarketScale = (values: number[], step: number): MarketScale => {
  const epsilon = 1e-9;
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  let minimum = Math.floor((rawMinimum + epsilon) / step) * step;
  let maximum = Math.ceil((rawMaximum - epsilon) / step) * step;

  if (maximum <= minimum) {
    minimum -= step;
    maximum += step;
  }

  const ticks: number[] = [];
  for (let value = maximum; value >= minimum - epsilon; value -= step) {
    ticks.push(Number(value.toFixed(10)));
  }

  return { minimum, maximum, ticks };
};

const getMarketGeometry = (stage: HTMLElement): MarketGeometry => {
  const measuredWidth = stage.getBoundingClientRect().width || stage.clientWidth || 240;
  const width = Math.max(220, Math.round(measuredWidth));
  const mobile = window.matchMedia('(max-width: 640px)').matches;
  const height = mobile ? 116 : 128;
  const plotTop = mobile ? 28 : 30;
  const plotBottom = mobile ? 8 : 10;
  const left = 2;
  const right = 4;

  return {
    width,
    height,
    left,
    right,
    plotTop,
    plotBottom,
    plotWidth: width - left - right,
    plotHeight: height - plotTop - plotBottom,
  };
};

const createSvgElement = <K extends keyof SVGElementTagNameMap>(name: K) =>
  document.createElementNS(SVG_NS, name);

const initResponsiveMarketCharts = () => {
  const root = document.querySelector<HTMLElement>('[data-current-markets]');
  if (!root || root.dataset.responsiveChartsInitialized === 'true') return;
  root.dataset.responsiveChartsInitialized = 'true';

  const seriesCache = new Map<MarketSeriesId, MarketSeries>();
  const scaleCache = new Map<MarketSeriesId, MarketScale>();
  const geometryCache = new Map<MarketSeriesId, MarketGeometry>();
  const inspectedIndexes = new Map<MarketSeriesId, number | null>();
  const svgCache = new Map<MarketSeriesId, SVGSVGElement>();
  let refreshPromise: Promise<void> | null = null;
  let resizeFrame = 0;

  const renderAxis = (
    id: MarketSeriesId,
    axis: HTMLElement,
    scale: MarketScale,
    geometry: MarketGeometry
  ) => {
    const range = scale.maximum - scale.minimum || 1;
    const labels = scale.ticks.map((value) => {
      const label = document.createElement('span');
      const ratio = (scale.maximum - value) / range;
      label.className = 'markets-sparkline-axis__tick';
      label.dataset.axisValue = String(value);
      label.textContent = formatAxisValue(id, value);
      label.style.top = `${geometry.plotTop + ratio * geometry.plotHeight}px`;
      return label;
    });

    axis.style.minHeight = `${geometry.height}px`;
    axis.style.height = `${geometry.height}px`;
    axis.replaceChildren(...labels);
  };

  const renderInspection = (id: MarketSeriesId, index: number) => {
    const series = seriesCache.get(id);
    const scale = scaleCache.get(id);
    const geometry = geometryCache.get(id);
    const svg = svgCache.get(id);
    const values = series ? getMarketValues(series) : [];
    const pointData = series?.points[index];
    const value = values[index];
    if (!series || !scale || !geometry || !svg || !pointData || value === undefined) return;

    const range = scale.maximum - scale.minimum || 1;
    const x =
      geometry.left +
      (index / Math.max(1, values.length - 1)) * geometry.plotWidth;
    const y =
      geometry.plotTop +
      (1 - (value - scale.minimum) / range) * geometry.plotHeight;

    const line = svg.querySelector<SVGLineElement>('[data-market-inspection-line]');
    const point = svg.querySelector<SVGCircleElement>('[data-market-inspection-point]');
    const annotation = svg.querySelector<SVGGElement>('[data-market-annotation]');
    const valueNode = svg.querySelector<SVGTextElement>('[data-market-annotation-value]');
    const dateNode = svg.querySelector<SVGTextElement>('[data-market-annotation-date]');

    line?.setAttribute('x1', x.toFixed(2));
    line?.setAttribute('x2', x.toFixed(2));
    line?.setAttribute('opacity', '1');
    point?.setAttribute('cx', x.toFixed(2));
    point?.setAttribute('cy', y.toFixed(2));
    point?.setAttribute('opacity', '1');

    const halfWidth = window.matchMedia('(max-width: 640px)').matches ? 42 : 50;
    const labelX = Math.max(
      geometry.left + halfWidth,
      Math.min(geometry.width - geometry.right - halfWidth, x)
    );
    if (valueNode) valueNode.textContent = formatMarketInspectionValue(id, value);
    if (dateNode) dateNode.textContent = formatMarketDate(pointData.observedAt);
    annotation?.setAttribute('transform', `translate(${labelX.toFixed(2)} 0)`);
    annotation?.setAttribute('opacity', '1');
  };

  const hideInspection = (id: MarketSeriesId) => {
    const svg = svgCache.get(id);
    svg?.querySelector('[data-market-inspection-line]')?.setAttribute('opacity', '0');
    svg?.querySelector('[data-market-inspection-point]')?.setAttribute('opacity', '0');
    svg?.querySelector('[data-market-annotation]')?.setAttribute('opacity', '0');
  };

  const renderSeries = (series: MarketSeries) => {
    const svg = svgCache.get(series.id);
    const stage = root.querySelector<HTMLElement>(`[data-market-chart-stage="${series.id}"]`);
    const axis = root.querySelector<HTMLElement>(`[data-market-axis="${series.id}"]`);
    if (!svg || !stage || !axis) return;

    const values = getMarketValues(series);
    if (values.length < 2) return;

    const scale = buildMarketScale(values, MARKET_AXIS_STEPS[series.id]);
    const geometry = getMarketGeometry(stage);
    const range = scale.maximum - scale.minimum || 1;

    seriesCache.set(series.id, series);
    scaleCache.set(series.id, scale);
    geometryCache.set(series.id, geometry);

    stage.style.minHeight = `${geometry.height}px`;
    stage.style.height = `${geometry.height}px`;
    svg.style.height = `${geometry.height}px`;
    svg.setAttribute('height', String(geometry.height));
    svg.setAttribute('viewBox', `0 0 ${geometry.width} ${geometry.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');

    const grid = createSvgElement('g');
    grid.classList.add('markets-sparkline-grid');
    grid.setAttribute('data-market-grid', '');

    for (const tick of scale.ticks) {
      const ratio = (scale.maximum - tick) / range;
      const y = geometry.plotTop + ratio * geometry.plotHeight;
      const line = createSvgElement('line');
      line.setAttribute('x1', String(geometry.left));
      line.setAttribute('x2', String(geometry.width - geometry.right));
      line.setAttribute('y1', y.toFixed(2));
      line.setAttribute('y2', y.toFixed(2));
      line.style.stroke = 'var(--stone-light)';
      line.style.strokeOpacity = '0.18';
      grid.append(line);
    }

    const path = createSvgElement('path');
    path.setAttribute('data-market-line', '');
    const d = values
      .map((value, index) => {
        const x =
          geometry.left +
          (index / Math.max(1, values.length - 1)) * geometry.plotWidth;
        const y =
          geometry.plotTop +
          (1 - (value - scale.minimum) / range) * geometry.plotHeight;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
    path.setAttribute('d', d);

    const inspectionLine = createSvgElement('line');
    inspectionLine.classList.add('markets-sparkline__inspection-line');
    inspectionLine.setAttribute('data-market-inspection-line', '');
    inspectionLine.setAttribute('x1', '0');
    inspectionLine.setAttribute('x2', '0');
    inspectionLine.setAttribute('y1', String(geometry.plotTop));
    inspectionLine.setAttribute('y2', String(geometry.plotTop + geometry.plotHeight));
    inspectionLine.setAttribute('opacity', '0');

    const inspectionPoint = createSvgElement('circle');
    inspectionPoint.classList.add('markets-sparkline__inspection-point');
    inspectionPoint.setAttribute('data-market-inspection-point', '');
    inspectionPoint.setAttribute('cx', '0');
    inspectionPoint.setAttribute('cy', '0');
    inspectionPoint.setAttribute('r', '3');
    inspectionPoint.setAttribute('opacity', '0');

    const annotation = createSvgElement('g');
    annotation.classList.add('markets-chart-annotation');
    annotation.setAttribute('data-market-annotation', '');
    annotation.setAttribute('opacity', '0');

    const annotationValue = createSvgElement('text');
    annotationValue.setAttribute('data-market-annotation-value', '');
    annotationValue.setAttribute('y', '11');
    annotationValue.textContent = '--';

    const annotationDate = createSvgElement('text');
    annotationDate.classList.add('markets-chart-annotation__date');
    annotationDate.setAttribute('data-market-annotation-date', '');
    annotationDate.setAttribute('y', '22');
    annotationDate.textContent = '-- --- ----';

    annotation.append(annotationValue, annotationDate);

    const hitTarget = createSvgElement('rect');
    hitTarget.setAttribute('data-market-hit-target', series.id);
    hitTarget.setAttribute('x', '0');
    hitTarget.setAttribute('y', '0');
    hitTarget.setAttribute('width', String(geometry.width));
    hitTarget.setAttribute('height', String(geometry.height));
    hitTarget.setAttribute('fill', 'transparent');
    hitTarget.setAttribute('pointer-events', 'all');

    svg.replaceChildren(grid, path, inspectionLine, inspectionPoint, annotation, hitTarget);
    svg.classList.remove('markets-sparkline--pending');
    renderAxis(series.id, axis, scale, geometry);

    const fallback = root.querySelector<HTMLElement>(
      `[data-market-sparkline-fallback="${series.id}"]`
    );
    if (fallback) fallback.hidden = true;

    const inspectedIndex = inspectedIndexes.get(series.id);
    if (
      inspectedIndex !== null &&
      inspectedIndex !== undefined &&
      inspectedIndex < values.length
    ) {
      renderInspection(series.id, inspectedIndex);
    }
  };

  const renderAll = () => {
    for (const id of MARKET_IDS) {
      const series = seriesCache.get(id);
      if (series) renderSeries(series);
    }
  };

  const bindInteraction = (id: MarketSeriesId, svg: SVGSVGElement) => {
    let activeTouchPointerId: number | null = null;

    const inspectAtClientX = (clientX: number) => {
      const series = seriesCache.get(id);
      const geometry = geometryCache.get(id);
      if (!series || !geometry) return;
      const values = getMarketValues(series);
      if (values.length === 0) return;

      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0) return;
      const localX = ((clientX - rect.left) / rect.width) * geometry.width;
      const ratio = Math.max(
        0,
        Math.min(1, (localX - geometry.left) / geometry.plotWidth)
      );
      const index = Math.round(ratio * (values.length - 1));
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
          // Pointer capture is optional for synthetic events and older browsers.
        }
      }
      inspectAtClientX(event.clientX);
    });

    svg.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && activeTouchPointerId !== event.pointerId) return;
      inspectAtClientX(event.clientX);
    });

    svg.addEventListener('pointerup', (event) => {
      if (activeTouchPointerId !== event.pointerId) return;
      activeTouchPointerId = null;
      try {
        svg.releasePointerCapture(event.pointerId);
      } catch {
        // The pointer may already be released.
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
      const series = seriesCache.get(id);
      const values = series ? getMarketValues(series) : [];
      if (values.length === 0) return;
      const index = values.length - 1;
      inspectedIndexes.set(id, index);
      renderInspection(id, index);
    });

    svg.addEventListener('blur', () => {
      inspectedIndexes.set(id, null);
      hideInspection(id);
    });

    svg.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const series = seriesCache.get(id);
      const values = series ? getMarketValues(series) : [];
      if (values.length === 0) return;

      event.preventDefault();
      const currentIndex = inspectedIndexes.get(id) ?? values.length - 1;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = Math.max(0, Math.min(values.length - 1, currentIndex + direction));
      inspectedIndexes.set(id, nextIndex);
      renderInspection(id, nextIndex);
    });
  };

  for (const id of MARKET_IDS) {
    const original = root.querySelector<SVGSVGElement>(`[data-market-sparkline="${id}"]`);
    if (!original) continue;

    const replacement = original.cloneNode(false) as SVGSVGElement;
    replacement.removeAttribute('viewBox');
    replacement.removeAttribute('height');
    original.replaceWith(replacement);
    svgCache.set(id, replacement);
    bindInteraction(id, replacement);

    const tooltip = root.querySelector<HTMLElement>(`[data-market-tooltip="${id}"]`);
    if (tooltip) tooltip.hidden = true;
  }

  const refreshData = () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const response = await fetch(`/api/current/markets?_charts=${Date.now()}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as MarketPayload;
        if (!Array.isArray(payload.series)) return;

        for (const candidate of payload.series) {
          if (isMarketSeries(candidate)) seriesCache.set(candidate.id, candidate);
        }

        requestAnimationFrame(renderAll);
      } catch {
        // Keep the last successfully rendered chart if the presentation refresh fails.
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(renderAll);
  });

  for (const id of MARKET_IDS) {
    const stage = root.querySelector<HTMLElement>(`[data-market-chart-stage="${id}"]`);
    if (stage) resizeObserver.observe(stage);
  }

  window.addEventListener('current:data-updated', (event) => {
    if (!(event instanceof CustomEvent) || event.detail?.source !== 'markets') return;
    renderAll();
    void refreshData();
  });

  void refreshData();
};

export const initCurrentChartPresentation = () => {
  const init = () => {
    installChartStyles();
    initElectricityAnnotationParity();
    initResponsiveMarketCharts();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
};
