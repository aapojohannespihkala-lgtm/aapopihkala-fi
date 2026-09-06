const SVG_NS = 'http://www.w3.org/2000/svg';
const HISTORY_URL = 'https://parassahko.fi/tilastot/data.json';
const HISTORY_PAGE_URL = 'https://parassahko.fi/tilastot';
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_NAMES_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type HistoryDay = {
  day: string;
  average: number;
  hours: number;
};

type TodaySnapshot = {
  average: number;
  hours: number;
};

const datePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: HELSINKI_TIME_ZONE,
});

const readSvgNumber = (element: Element, attribute: string) => {
  const value = Number(element.getAttribute(attribute));
  return Number.isFinite(value) ? value : Number.NaN;
};

const readDateParts = (date: Date) => {
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
  };
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const normalizeHistoryDays = (value: unknown): HistoryDay[] => {
  if (!value || typeof value !== 'object') return [];

  const daily = (value as { daily?: unknown }).daily;
  if (!Array.isArray(daily)) return [];

  const result: HistoryDay[] = [];
  for (const entry of daily) {
    if (!entry || typeof entry !== 'object') continue;

    const candidate = entry as { day?: unknown; average?: unknown; hours?: unknown };
    if (
      typeof candidate.day !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(candidate.day) ||
      typeof candidate.average !== 'number' ||
      !Number.isFinite(candidate.average) ||
      typeof candidate.hours !== 'number' ||
      !Number.isFinite(candidate.hours) ||
      candidate.hours <= 0 ||
      candidate.hours > 25
    ) {
      continue;
    }

    result.push({
      day: candidate.day,
      average: candidate.average,
      hours: candidate.hours,
    });
  }

  return result;
};

const calculateMonthToDateAverage = (
  historyDays: HistoryDay[],
  now: Date,
  today: TodaySnapshot
) => {
  const parts = readDateParts(now);
  const dayOfMonth = Number(parts.day);
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return null;

  const byDay = new Map(historyDays.map((entry) => [entry.day, entry]));
  let weightedTotal = today.average * today.hours;
  let totalHours = today.hours;

  for (let day = 1; day < dayOfMonth; day += 1) {
    const key = `${parts.year}-${parts.month}-${String(day).padStart(2, '0')}`;
    const entry = byDay.get(key);
    if (!entry) return null;

    weightedTotal += entry.average * entry.hours;
    totalHours += entry.hours;
  }

  if (totalHours <= 0) return null;
  return weightedTotal / totalHours;
};

const readWindowPrice = (label: SVGGElement, headline: SVGTextElement) => {
  const stored = label.dataset.windowPrice;
  if (stored) return stored;

  const current = headline.textContent ?? '';
  const separatorIndex = current.indexOf('·');
  const price = separatorIndex >= 0 ? current.slice(separatorIndex + 1).trim() : current.trim();
  label.dataset.windowPrice = price;
  return price;
};

const readWindowRange = (label: SVGGElement, range: SVGTextElement) => {
  const stored = label.dataset.windowRange;
  if (stored) return stored;

  const value = range.textContent?.trim() ?? '';
  label.dataset.windowRange = value;
  return value;
};

const splitWindowRange = (value: string) => {
  const match = value.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return [value, ''] as const;
  return [`${match[1]} -`, match[2]] as const;
};

const simplifyWindowLabel = (label: SVGGElement, band: SVGRectElement) => {
  const lines = label.querySelectorAll<SVGTextElement>('text');
  const headline = lines[0];
  const rangeStartLine = lines[1];
  if (!headline || !rangeStartLine) return;

  const price = readWindowPrice(label, headline);
  const [rangeStart, rangeEnd] = splitWindowRange(readWindowRange(label, rangeStartLine));
  const bandX = readSvgNumber(band, 'x');
  if (!Number.isFinite(bandX)) return;

  let unitLine = label.querySelector<SVGTextElement>('[data-electricity-window-unit]');
  if (!unitLine) {
    unitLine = document.createElementNS(SVG_NS, 'text');
    unitLine.setAttribute('data-electricity-window-unit', '');
    unitLine.setAttribute('class', 'electricity-chart__window-unit');
    label.insertBefore(unitLine, rangeStartLine);
  }

  let rangeEndLine = label.querySelector<SVGTextElement>('[data-electricity-window-range-end]');
  if (!rangeEndLine) {
    rangeEndLine = document.createElementNS(SVG_NS, 'text');
    rangeEndLine.setAttribute('data-electricity-window-range-end', '');
    rangeEndLine.setAttribute('class', 'electricity-chart__window-range');
    label.append(rangeEndLine);
  }

  headline.textContent = price || '--.--';
  headline.setAttribute('y', '7');
  headline.setAttribute('x', '0');
  headline.setAttribute('text-anchor', 'start');

  unitLine.textContent = 'c/kWh';
  unitLine.setAttribute('y', '14');
  unitLine.setAttribute('x', '0');
  unitLine.setAttribute('text-anchor', 'start');

  rangeStartLine.textContent = rangeStart;
  rangeStartLine.setAttribute('y', '23');
  rangeStartLine.setAttribute('x', '0');
  rangeStartLine.setAttribute('text-anchor', 'start');

  rangeEndLine.textContent = rangeEnd;
  rangeEndLine.setAttribute('y', '31');
  rangeEndLine.setAttribute('x', '0');
  rangeEndLine.setAttribute('text-anchor', 'start');

  label.setAttribute('transform', `translate(${bandX.toFixed(2)} 0)`);
};

export const initCurrentElectricityPresentation = () => {
  const root = document.querySelector<HTMLElement>('[data-current-electricity]');
  if (!root || root.dataset.electricityPresentationInitialized === 'true') return;

  const chart = root.querySelector<SVGSVGElement>('[data-electricity-chart]');
  const tooltip = root.querySelector<HTMLElement>('[data-electricity-chart-tooltip]');
  const nowLabel = root.querySelector<HTMLElement>('.electricity-now__label');
  const averageTarget = root.querySelector<HTMLElement>('[data-electricity-price]');
  const averageLabelTarget = root.querySelector<HTMLElement>('[data-electricity-average-label]');
  const comparisonTarget = root.querySelector<HTMLElement>('[data-electricity-average-comparison]');
  const footerLine = root.querySelector<HTMLElement>('.electricity-footer p');
  if (
    !chart ||
    !tooltip ||
    !nowLabel ||
    !averageTarget ||
    !averageLabelTarget ||
    !comparisonTarget ||
    !footerLine
  ) {
    return;
  }

  root.dataset.electricityPresentationInitialized = 'true';
  nowLabel.textContent = 'NOW / 15 MIN';

  let monthTarget = root.querySelector<HTMLElement>('[data-electricity-month-average]');
  if (!monthTarget) {
    monthTarget = document.createElement('p');
    monthTarget.className = 'electricity-month-average';
    monthTarget.dataset.electricityMonthAverage = '';
    monthTarget.hidden = true;
    comparisonTarget.insertAdjacentElement('afterend', monthTarget);
  }

  if (!footerLine.querySelector('[data-electricity-history-source]')) {
    footerLine.append(document.createTextNode(' · HISTORY / '));
    const sourceLink = document.createElement('a');
    sourceLink.dataset.electricityHistorySource = '';
    sourceLink.href = HISTORY_PAGE_URL;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener';
    sourceLink.textContent = 'PARASSÄHKÖ.FI';
    footerLine.append(sourceLink);
  }

  let frame = 0;
  let monthFrame = 0;
  let historyPromise: Promise<HistoryDay[] | null> | null = null;

  const syncInspectionState = () => {
    chart.classList.toggle('electricity-chart--inspecting', !tooltip.hidden);
  };

  const readTodaySnapshot = (): TodaySnapshot | null => {
    if (averageLabelTarget.textContent?.trim() !== 'DAY AVG / TODAY') return null;

    const average = Number(averageTarget.textContent?.trim());
    const path = chart.querySelector<SVGPathElement>('[data-electricity-price-path]');
    const pathData = path?.getAttribute('d') ?? '';
    const quarterCount = pathData.match(/\sH\s/g)?.length ?? 0;
    const hours = quarterCount / 4;

    if (!Number.isFinite(average) || !Number.isFinite(hours) || hours < 23 || hours > 25) {
      return null;
    }

    return { average, hours };
  };

  const loadHistory = () => {
    if (historyPromise) return historyPromise;

    historyPromise = fetch(HISTORY_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`History request failed: ${response.status}`);
        const data: unknown = await response.json();
        const days = normalizeHistoryDays(data);
        return days.length > 0 ? days : null;
      })
      .catch(() => null);

    return historyPromise;
  };

  const hideMonthAverage = () => {
    monthTarget.textContent = '';
    monthTarget.hidden = true;
    monthTarget.removeAttribute('aria-label');
  };

  const syncMonthAverage = async () => {
    const today = readTodaySnapshot();
    if (!today) return;

    const now = new Date();
    const parts = readDateParts(now);
    const monthIndex = Number(parts.month) - 1;
    if (monthIndex < 0 || monthIndex >= MONTH_NAMES.length) {
      hideMonthAverage();
      return;
    }

    const dayOfMonth = Number(parts.day);
    let monthAverage: number | null = null;

    if (dayOfMonth === 1) {
      monthAverage = today.average;
    } else {
      const historyDays = await loadHistory();
      if (historyDays) monthAverage = calculateMonthToDateAverage(historyDays, now, today);
    }

    if (monthAverage === null || !Number.isFinite(monthAverage)) {
      hideMonthAverage();
      return;
    }

    const formatted = formatPrice(monthAverage);
    monthTarget.textContent = `${MONTH_NAMES[monthIndex]} AVG ${formatted} c/kWh`;
    monthTarget.setAttribute(
      'aria-label',
      `${MONTH_NAMES_LONG[monthIndex]} month-to-date average ${formatted} cents per kilowatt-hour`
    );
    monthTarget.hidden = false;
  };

  const scheduleMonthAverageSync = () => {
    if (monthFrame) window.cancelAnimationFrame(monthFrame);
    monthFrame = window.requestAnimationFrame(() => {
      monthFrame = 0;
      void syncMonthAverage();
    });
  };

  const chartObserver = new MutationObserver(() => {
    scheduleWindowLayout();
    scheduleMonthAverageSync();
  });

  const observeChart = () => {
    chartObserver.observe(chart, { childList: true });
  };

  const layoutWindowLabels = () => {
    frame = 0;

    const lowLabel = chart.querySelector<SVGGElement>('[data-electricity-low-label]');
    const highLabel = chart.querySelector<SVGGElement>('[data-electricity-high-label]');
    const lowBand = chart.querySelector<SVGRectElement>('[data-electricity-low-band]');
    const highBand = chart.querySelector<SVGRectElement>('[data-electricity-high-band]');
    if (!lowLabel || !highLabel || !lowBand || !highBand) return;

    chartObserver.disconnect();
    chart.querySelectorAll('[data-electricity-window-leader]').forEach((leader) => leader.remove());
    simplifyWindowLabel(lowLabel, lowBand);
    simplifyWindowLabel(highLabel, highBand);
    observeChart();
    syncInspectionState();
  };

  function scheduleWindowLayout() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(layoutWindowLabels);
  }

  window.addEventListener('current:data-updated', (event) => {
    const detail = (event as CustomEvent<{ source?: string }>).detail;
    if (detail?.source === 'electricity') scheduleMonthAverageSync();
  });

  const tooltipObserver = new MutationObserver(syncInspectionState);
  tooltipObserver.observe(tooltip, { attributes: true, attributeFilter: ['hidden'] });

  const resizeObserver = new ResizeObserver(() => {
    scheduleWindowLayout();
    scheduleMonthAverageSync();
  });
  resizeObserver.observe(chart);

  observeChart();
  syncInspectionState();
  scheduleWindowLayout();
  scheduleMonthAverageSync();
};
