type PriceEntry = {
  price: number;
  startDate: string;
  endDate: string;
};

type PriceResponse = {
  prices: PriceEntry[];
};

type PricePoint = {
  price: number;
  start: Date;
  end: Date;
  startMs: number;
  endMs: number;
};

type PriceWindow = {
  average: number;
  startIndex: number;
  points: PricePoint[];
};

const PRICE_API_URL = 'https://api.porssisahko.net/v2/latest-prices.json';
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const NETWORK_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DISPLAY_REFRESH_INTERVAL_MS = 60 * 1000;
const QUARTER_MS = 15 * 60 * 1000;

const datePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const readLocalParts = (date: Date) => {
  const parts = Object.fromEntries(
    datePartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: parts.year ?? '0000',
    month: parts.month ?? '00',
    day: parts.day ?? '00',
    hour: Number(parts.hour ?? 0),
    minute: Number(parts.minute ?? 0),
  };
};

const getLocalDateKey = (date: Date) => {
  const parts = readLocalParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const getLocalMinuteOfDay = (date: Date) => {
  const parts = readLocalParts(date);
  return parts.hour * 60 + parts.minute;
};

const formatClock = (date: Date) => timeFormatter.format(date);

const formatPrice = (value: number) => {
  if (!Number.isFinite(value)) return '--.--';

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatRange = (start: Date, end: Date) => `${formatClock(start)} - ${formatClock(end)}`;

const averagePrice = (points: PricePoint[]) => {
  if (points.length === 0) return Number.NaN;
  return points.reduce((sum, point) => sum + point.price, 0) / points.length;
};

const normalizePrices = (response: PriceResponse): PricePoint[] => {
  if (!Array.isArray(response.prices)) return [];

  return response.prices
    .map((entry) => {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      const startMs = start.getTime();
      const endMs = end.getTime();

      return {
        price: Number(entry.price),
        start,
        end,
        startMs,
        endMs,
      };
    })
    .filter(
      (point) =>
        Number.isFinite(point.price) &&
        Number.isFinite(point.startMs) &&
        Number.isFinite(point.endMs) &&
        point.endMs > point.startMs
    )
    .sort((a, b) => a.startMs - b.startMs);
};

const getTodayPoints = (points: PricePoint[], now: Date) => {
  const todayKey = getLocalDateKey(now);
  return points.filter((point) => getLocalDateKey(point.start) === todayKey);
};

const getCurrentIndex = (points: PricePoint[], now: Date) => {
  const nowMs = now.getTime();
  return points.findIndex((point) => point.startMs <= nowMs && point.endMs > nowMs);
};

const getCurrentHourPoints = (points: PricePoint[], currentIndex: number) => {
  if (currentIndex < 0 || currentIndex >= points.length) return [];

  const minute = readLocalParts(points[currentIndex].start).minute;
  const quarterOffset = Math.max(0, Math.min(3, Math.floor(minute / 15)));
  const startIndex = Math.max(0, currentIndex - quarterOffset);
  const hourPoints = points.slice(startIndex, startIndex + 4);

  if (hourPoints.length !== 4) return [];
  if (hourPoints[3].endMs - hourPoints[0].startMs !== 4 * QUARTER_MS) return [];

  return hourPoints;
};

const findPriceWindow = (points: PricePoint[], mode: 'lowest' | 'highest'): PriceWindow | null => {
  const windowSize = 8;
  let best: PriceWindow | null = null;

  for (let startIndex = 0; startIndex <= points.length - windowSize; startIndex += 1) {
    const windowPoints = points.slice(startIndex, startIndex + windowSize);
    const duration = windowPoints[windowPoints.length - 1].endMs - windowPoints[0].startMs;

    if (duration !== windowSize * QUARTER_MS) continue;

    const average = averagePrice(windowPoints);
    if (!Number.isFinite(average)) continue;

    if (
      !best ||
      (mode === 'lowest' && average < best.average) ||
      (mode === 'highest' && average > best.average)
    ) {
      best = { average, startIndex, points: windowPoints };
    }
  }

  return best;
};

const buildStepPath = (
  points: PricePoint[],
  xBoundary: (index: number) => number,
  yFor: (price: number) => number
) => {
  if (points.length === 0) return '';

  let path = `M ${xBoundary(0).toFixed(2)} ${yFor(points[0].price).toFixed(2)}`;

  points.forEach((point, index) => {
    const right = xBoundary(index + 1);
    path += ` H ${right.toFixed(2)}`;

    if (index < points.length - 1) {
      path += ` V ${yFor(points[index + 1].price).toFixed(2)}`;
    }
  });

  return path;
};

const renderChart = (
  svg: SVGSVGElement,
  points: PricePoint[],
  currentIndex: number,
  cheapestWindow: PriceWindow | null,
  expensiveWindow: PriceWindow | null
) => {
  if (points.length === 0) {
    svg.innerHTML = '';
    return;
  }

  const containerWidth = svg.parentElement?.getBoundingClientRect().width ?? 760;
  const width = Math.max(300, Math.round(containerWidth));
  const height = width < 560 ? 142 : 168;
  const left = 8;
  const right = 8;
  const top = 12;
  const bottom = 25;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const prices = points.map((point) => point.price);
  const rawMinimum = Math.min(...prices);
  const rawMaximum = Math.max(...prices);
  const rawSpan = Math.max(0.2, rawMaximum - rawMinimum);
  const padding = Math.max(0.15, rawSpan * 0.12);
  const minimum = Math.min(0, rawMinimum - padding);
  const maximum = Math.max(0, rawMaximum + padding);
  const span = Math.max(0.2, maximum - minimum);

  const xBoundary = (index: number) => left + (index / points.length) * plotWidth;
  const xCenter = (index: number) => (xBoundary(index) + xBoundary(index + 1)) / 2;
  const yFor = (price: number) => top + ((maximum - price) / span) * plotHeight;
  const zeroY = yFor(0);
  const linePath = buildStepPath(points, xBoundary, yFor);
  const areaPath = `${linePath} L ${xBoundary(points.length).toFixed(2)} ${zeroY.toFixed(2)} L ${xBoundary(0).toFixed(2)} ${zeroY.toFixed(2)} Z`;

  const renderBand = (window: PriceWindow | null, className: string, dataAttribute: string) => {
    if (!window) return '';
    const x = xBoundary(window.startIndex);
    const bandWidth = xBoundary(window.startIndex + window.points.length) - x;
    return `<rect ${dataAttribute} class="${className}" x="${x.toFixed(2)}" y="${top}" width="${bandWidth.toFixed(2)}" height="${plotHeight}" rx="1" />`;
  };

  const guides = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const y = top + plotHeight * ratio;
      return `<line x1="${left}" x2="${width - right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" class="electricity-chart__guide" />`;
    })
    .join('');

  const currentMarker =
    currentIndex >= 0
      ? `
        <line data-electricity-current-line x1="${xCenter(currentIndex).toFixed(2)}" x2="${xCenter(currentIndex).toFixed(2)}" y1="${top}" y2="${top + plotHeight}" class="electricity-chart__current-line" />
        <circle data-electricity-current-point cx="${xCenter(currentIndex).toFixed(2)}" cy="${yFor(points[currentIndex].price).toFixed(2)}" r="3" class="electricity-chart__current-point" />
      `
      : '';

  const axisHours = [0, 6, 12, 18];
  const axisLabels = axisHours
    .map((hour) => {
      const index = points.findIndex((point) => {
        const parts = readLocalParts(point.start);
        return parts.hour === hour && parts.minute === 0;
      });
      const x = index >= 0 ? xBoundary(index) : left + (hour / 24) * plotWidth;
      return `<text x="${x.toFixed(2)}" y="${height - 5}" text-anchor="middle" class="electricity-chart__axis-label">${String(hour).padStart(2, '0')}</text>`;
    })
    .join('');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('height', String(height));
  svg.innerHTML = `
    <title>Finland day-ahead spot electricity prices today in 15 minute intervals</title>
    ${renderBand(cheapestWindow, 'electricity-chart__band electricity-chart__band--low', 'data-electricity-low-band')}
    ${renderBand(expensiveWindow, 'electricity-chart__band electricity-chart__band--high', 'data-electricity-high-band')}
    ${guides}
    <line x1="${left}" x2="${width - right}" y1="${zeroY.toFixed(2)}" y2="${zeroY.toFixed(2)}" class="electricity-chart__zero" />
    <path d="${areaPath}" class="electricity-chart__area" />
    <path data-electricity-price-path d="${linePath}" class="electricity-chart__line" />
    ${currentMarker}
    ${axisLabels}
    <text x="${width - right}" y="${height - 5}" text-anchor="end" class="electricity-chart__axis-label">24</text>
  `;
};

export const initCurrentElectricity = () => {
  const root = document.querySelector<HTMLElement>('[data-current-electricity]');
  if (!root) return;
  if (root.dataset.electricityInitialized === 'true') return;

  root.dataset.electricityInitialized = 'true';

  const priceTarget = root.querySelector<HTMLElement>('[data-electricity-price]');
  const intervalTarget = root.querySelector<HTMLElement>('[data-electricity-interval]');
  const currentStatusTarget = root.querySelector<HTMLElement>('[data-electricity-current-status]');
  const hourAverageTarget = root.querySelector<HTMLElement>('[data-electricity-hour-average]');
  const hourRangeTarget = root.querySelector<HTMLElement>('[data-electricity-hour-range]');
  const dayAverageTarget = root.querySelector<HTMLElement>('[data-electricity-day-average]');
  const cheapestValueTarget = root.querySelector<HTMLElement>('[data-electricity-cheapest-value]');
  const cheapestRangeTarget = root.querySelector<HTMLElement>('[data-electricity-cheapest-range]');
  const expensiveValueTarget = root.querySelector<HTMLElement>('[data-electricity-expensive-value]');
  const expensiveRangeTarget = root.querySelector<HTMLElement>('[data-electricity-expensive-range]');
  const lowValueTarget = root.querySelector<HTMLElement>('[data-electricity-low-value]');
  const lowRangeTarget = root.querySelector<HTMLElement>('[data-electricity-low-range]');
  const highValueTarget = root.querySelector<HTMLElement>('[data-electricity-high-value]');
  const highRangeTarget = root.querySelector<HTMLElement>('[data-electricity-high-range]');
  const chart = root.querySelector<SVGSVGElement>('[data-electricity-chart]');
  const errorTarget = root.querySelector<HTMLElement>('[data-electricity-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-electricity-retry]');

  if (
    !priceTarget ||
    !intervalTarget ||
    !currentStatusTarget ||
    !hourAverageTarget ||
    !hourRangeTarget ||
    !dayAverageTarget ||
    !cheapestValueTarget ||
    !cheapestRangeTarget ||
    !expensiveValueTarget ||
    !expensiveRangeTarget ||
    !lowValueTarget ||
    !lowRangeTarget ||
    !highValueTarget ||
    !highRangeTarget ||
    !chart ||
    !errorTarget
  ) {
    return;
  }

  let cachedPoints: PricePoint[] = [];
  let latestTodayPoints: PricePoint[] = [];
  let latestCurrentIndex = -1;
  let latestCheapestWindow: PriceWindow | null = null;
  let latestExpensiveWindow: PriceWindow | null = null;
  let resizeFrame = 0;

  const renderLatestChart = () => {
    if (latestTodayPoints.length === 0) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() =>
      renderChart(
        chart,
        latestTodayPoints,
        latestCurrentIndex,
        latestCheapestWindow,
        latestExpensiveWindow
      )
    );
  };

  const resizeObserver = new ResizeObserver(renderLatestChart);
  resizeObserver.observe(chart.parentElement ?? chart);

  const renderCachedData = () => {
    if (cachedPoints.length === 0) return;

    const now = new Date();
    const todayPoints = getTodayPoints(cachedPoints, now);
    if (todayPoints.length === 0) return;

    const currentIndex = getCurrentIndex(todayPoints, now);
    const currentPoint = currentIndex >= 0 ? todayPoints[currentIndex] : null;
    const hourPoints = getCurrentHourPoints(todayPoints, currentIndex);
    const cheapestWindow = findPriceWindow(todayPoints, 'lowest');
    const expensiveWindow = findPriceWindow(todayPoints, 'highest');
    const lowPoint = todayPoints.reduce((lowest, point) =>
      point.price < lowest.price ? point : lowest
    );
    const highPoint = todayPoints.reduce((highest, point) =>
      point.price > highest.price ? point : highest
    );

    priceTarget.textContent = currentPoint ? formatPrice(currentPoint.price) : '--.--';
    intervalTarget.textContent = currentPoint
      ? formatRange(currentPoint.start, currentPoint.end)
      : 'Current interval unavailable';
    currentStatusTarget.textContent = currentPoint
      ? `CURRENT ${formatClock(currentPoint.start)}`
      : 'TODAY';

    hourAverageTarget.textContent = formatPrice(averagePrice(hourPoints));
    hourRangeTarget.textContent =
      hourPoints.length === 4
        ? formatRange(hourPoints[0].start, hourPoints[hourPoints.length - 1].end)
        : '--:-- - --:--';

    dayAverageTarget.textContent = formatPrice(averagePrice(todayPoints));

    cheapestValueTarget.textContent = formatPrice(cheapestWindow?.average ?? Number.NaN);
    cheapestRangeTarget.textContent = cheapestWindow
      ? formatRange(
          cheapestWindow.points[0].start,
          cheapestWindow.points[cheapestWindow.points.length - 1].end
        )
      : '--:-- - --:--';

    expensiveValueTarget.textContent = formatPrice(expensiveWindow?.average ?? Number.NaN);
    expensiveRangeTarget.textContent = expensiveWindow
      ? formatRange(
          expensiveWindow.points[0].start,
          expensiveWindow.points[expensiveWindow.points.length - 1].end
        )
      : '--:-- - --:--';

    lowValueTarget.textContent = formatPrice(lowPoint.price);
    lowRangeTarget.textContent = formatRange(lowPoint.start, lowPoint.end);
    highValueTarget.textContent = formatPrice(highPoint.price);
    highRangeTarget.textContent = formatRange(highPoint.start, highPoint.end);

    latestTodayPoints = todayPoints;
    latestCurrentIndex = currentIndex;
    latestCheapestWindow = cheapestWindow;
    latestExpensiveWindow = expensiveWindow;
    renderLatestChart();

    root.setAttribute('aria-busy', 'false');
    errorTarget.hidden = true;
  };

  const loadPrices = async () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;

    try {
      const response = await fetch(PRICE_API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Pörssisähkö.net request failed: ${response.status}`);
      }

      const data = (await response.json()) as PriceResponse;
      const points = normalizePrices(data);

      if (points.length === 0) {
        throw new Error('Pörssisähkö.net returned no usable price data');
      }

      cachedPoints = points;
      renderCachedData();

      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'electricity', at: new Date().toISOString() },
        })
      );
    } catch (error) {
      void error;
      root.setAttribute('aria-busy', 'false');
      errorTarget.hidden = false;
      intervalTarget.textContent = 'Price data unavailable';
    }
  };

  retryButton?.addEventListener('click', loadPrices);
  loadPrices();
  window.setInterval(renderCachedData, DISPLAY_REFRESH_INTERVAL_MS);
  window.setInterval(loadPrices, NETWORK_REFRESH_INTERVAL_MS);
};
