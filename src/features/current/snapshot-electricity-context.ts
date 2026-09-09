type MonthAverageResponse = {
  average?: unknown;
  kind?: unknown;
  month?: unknown;
  through?: unknown;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const localClockFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const getMonthName = (month: string) => {
  const monthIndex = Number(month) - 1;
  return MONTH_NAMES[monthIndex] ?? month;
};

const formatThrough = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, , month, day] = match;
  return `${day} ${getMonthName(month)}`;
};

const formatMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month] = match;
  return `${getMonthName(month)} ${year}`;
};

const getCurrentDayFraction = () => {
  const parts = localClockFormatter.formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return Math.min(1, Math.max(0, (hour * 60 + minute) / (24 * 60)));
};

const ensureNowMarker = (root: HTMLElement) => {
  const existing = root.querySelector<HTMLElement>('[data-snapshot-electricity-now-marker]');
  if (existing) return existing;

  const chart = root.querySelector<HTMLElement>('.snapshot-electricity__chart');
  if (!chart) return null;

  const marker = document.createElement('div');
  marker.className = 'snapshot-electricity__now-marker';
  marker.dataset.snapshotElectricityNowMarker = 'true';
  marker.innerHTML = '<span>NOW</span><strong data-snapshot-electricity-now-overlay>--.--</strong>';
  chart.append(marker);
  return marker;
};

const positionNowMarker = (marker: HTMLElement) => {
  const chartPercent = 2.5 + getCurrentDayFraction() * 95;
  const clamped = Math.min(90, Math.max(10, chartPercent));
  marker.style.left = `${clamped}%`;
};

// Capture the base snapshot values before replacing the first support statistic with month average.
const captureBaseElectricity = (root: HTMLElement) => {
  const hero = root.querySelector<HTMLElement>('[data-snapshot-electricity-now]');
  const heroLabel = root.querySelector<HTMLElement>('.snapshot-electricity__value .snapshot-micro');
  const current = root.querySelector<HTMLElement>('[data-snapshot-electricity-average]');
  const currentLabel = current?.closest('div')?.querySelector<HTMLElement>('dt');

  if (
    hero &&
    heroLabel?.textContent?.trim().startsWith('DAY AVG')
  ) {
    const value = hero.textContent?.trim();
    if (value && value !== '--.--') root.dataset.snapshotElectricityDayAverage = value;
  }

  if (
    current &&
    currentLabel?.textContent?.trim().startsWith('NOW')
  ) {
    const value = current.textContent?.trim();
    if (value && value !== '--.--') root.dataset.snapshotElectricityCurrentPrice = value;
  }
};

const renderCurrentPrice = (root: HTMLElement) => {
  const currentPrice = root.dataset.snapshotElectricityCurrentPrice;
  const marker = ensureNowMarker(root);

  if (marker) {
    const overlay = marker.querySelector<HTMLElement>('[data-snapshot-electricity-now-overlay]');
    if (overlay && currentPrice) overlay.textContent = currentPrice;
    positionNowMarker(marker);
  }

  const source = root.querySelector<HTMLElement>('.snapshot-electricity .snapshot-source');
  if (source) source.textContent = 'DATA / PÖRSSISÄHKÖ.NET · PARASSÄHKÖ.FI';
};

const renderMonthAverage = (root: HTMLElement, data: MonthAverageResponse) => {
  const average = data.average;
  if (!isFiniteNumber(average)) return;

  const firstStat = root.querySelector<HTMLElement>('.snapshot-electricity__stats > div:first-child');
  const firstLabel = firstStat?.querySelector<HTMLElement>('dt');
  const firstValue = firstStat?.querySelector<HTMLElement>('dd');
  if (!firstStat || !firstLabel || !firstValue) return;

  firstValue.textContent = formatPrice(average);
  firstValue.dataset.snapshotElectricityMonthAverage = 'true';
  firstLabel.textContent = data.kind === 'last-complete-month' ? 'LAST MONTH AVG' : 'MONTH AVG';

  if (
    data.kind === 'month-to-date' &&
    typeof data.through === 'string'
  ) {
    firstStat.title = `Month average through ${formatThrough(data.through)}`;
  } else if (
    data.kind === 'last-complete-month' &&
    typeof data.month === 'string'
  ) {
    firstStat.title = `Last complete month average ${formatMonth(data.month)}`;
  } else {
    firstStat.removeAttribute('title');
  }
};

export const initSnapshotElectricityContext = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.electricityContextInitialized === 'true') return;

  root.dataset.electricityContextInitialized = 'true';
  let monthData: MonthAverageResponse | null = null;

  const apply = () => {
    captureBaseElectricity(root);
    renderCurrentPrice(root);
    if (monthData) renderMonthAverage(root, monthData);
  };

  const loadMonthAverage = async () => {
    try {
      const response = await fetch('/api/current/electricity-month', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;

      const data = (await response.json()) as MonthAverageResponse;
      if (!isFiniteNumber(data.average)) return;
      monthData = data;
      apply();
    } catch {
      // Keep the day-average hero and current-price chart marker if month history is unavailable.
    }
  };

  window.addEventListener('current:data-updated', () => {
    apply();
    void loadMonthAverage();
  });

  window.addEventListener('resize', () => {
    const marker = root.querySelector<HTMLElement>('[data-snapshot-electricity-now-marker]');
    if (marker) positionNowMarker(marker);
  });

  window.setTimeout(() => apply(), 0);
  window.setTimeout(() => apply(), 350);
  void loadMonthAverage();
};
