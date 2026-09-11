type SnapshotWeatherResponse = {
  current?: {
    temperature_2m?: unknown;
    weather_code?: unknown;
  };
  daily?: {
    temperature_2m_min?: unknown;
    temperature_2m_max?: unknown;
  };
};

type SnapshotPriceEntry = {
  price?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

type SnapshotElectricityResponse = {
  prices?: unknown;
};

type SnapshotPortfolioItem = {
  id?: unknown;
  changes?: {
    today?: unknown;
  };
};

type SnapshotPortfolioResponse = {
  items?: unknown;
};

type SnapshotMacroItem = {
  id?: unknown;
  value?: unknown;
};

type SnapshotSeriesPoint = {
  value?: unknown;
  observedAt?: unknown;
};

type SnapshotMacroSeries = {
  id?: unknown;
  change1y?: unknown;
  points?: unknown;
};

type SnapshotMacroResponse = {
  items?: unknown;
  series?: unknown;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const MARKET_RETRY_DELAYS_MS = [0, 700, 1_500] as const;
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const QUARTER_MS = 15 * 60 * 1000;

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

const SELECTED_MARKETS = [
  'ishares-world',
  'handelsbanken-usa',
  'nordnet-finland',
  'btc',
  'remedy',
] as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatRateChange = (value: number) => {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${Math.abs(value).toFixed(3)} PP`;
};

const formatAverageComparison = (current: number, average: number) => {
  if (Math.abs(average) < 0.005) return 'NOW · VS AVG N/A';

  const percent = ((current - average) / Math.abs(average)) * 100;
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±';
  return `NOW · ${sign}${Math.abs(rounded)}% VS AVG`;
};

const localDateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: HELSINKI_TIME_ZONE,
});

const getLocalDateKey = (date: Date) => {
  const parts = Object.fromEntries(
    localDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}`;
};

const buildWeatherUrl = () => {
  const params = new URLSearchParams({
    latitude: '60.1719',
    longitude: '24.7314',
    timezone: HELSINKI_TIME_ZONE,
    forecast_days: '1',
    temperature_unit: 'celsius',
    current: ['temperature_2m', 'weather_code'].join(','),
    daily: ['temperature_2m_min', 'temperature_2m_max'].join(','),
  });

  return `${WEATHER_API_URL}?${params.toString()}`;
};

const setText = (root: HTMLElement, selector: string, value: string) => {
  const target = root.querySelector<HTMLElement>(selector);
  if (target) target.textContent = value;
};

const renderWeatherIcon = (root: HTMLElement, code: number) => {
  const target = root.querySelector<SVGSVGElement>('[data-snapshot-weather-icon]');
  if (!target) return;

  const stroke = 'currentColor';
  const cloud = `<path d="M25 47h44c10 0 17-6 17-14s-7-14-16-14c-2-9-10-15-20-15-11 0-20 8-21 19-8 1-14 6-14 13 0 6 4 11 10 11Z" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  if (code <= 1) {
    target.innerHTML = `<circle cx="48" cy="32" r="13" fill="none" stroke="${stroke}" stroke-width="1.5"/><path d="M48 8v8M48 48v8M24 32h8M64 32h8M31 15l6 6M59 43l6 6M65 15l-6 6M37 43l-6 6" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round"/>`;
    return;
  }

  if (code === 2 || code === 3) {
    target.innerHTML = code === 2
      ? `<circle cx="64" cy="19" r="11" fill="none" stroke="${stroke}" stroke-width="1.3"/>${cloud}`
      : cloud;
    return;
  }

  if (code === 45 || code === 48) {
    target.innerHTML = `${cloud}<path d="M23 53h50M31 59h38" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round"/>`;
    return;
  }

  if (code >= 71 && code <= 86) {
    target.innerHTML = `${cloud}<circle cx="35" cy="56" r="1.4" fill="${stroke}"/><circle cx="49" cy="58" r="1.4" fill="${stroke}"/><circle cx="63" cy="55" r="1.4" fill="${stroke}"/>`;
    return;
  }

  if (code >= 95) {
    target.innerHTML = `${cloud}<path d="M52 48l-7 9h7l-4 7 12-12h-7l5-4Z" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
    return;
  }

  target.innerHTML = `${cloud}<path d="M35 53l-3 7M50 53l-3 7M65 53l-3 7" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round"/>`;
};

const renderElectricityChart = (root: HTMLElement, values: number[]) => {
  const path = root.querySelector<SVGPathElement>('[data-snapshot-electricity-chart-path]');
  if (!path || values.length === 0) return;

  const hourly = Array.from({ length: Math.ceil(values.length / 4) }, (_, index) => {
    const chunk = values.slice(index * 4, index * 4 + 4);
    return chunk.reduce((sum, value) => sum + value, 0) / chunk.length;
  }).slice(0, 24);

  const minimum = Math.min(...hourly);
  const maximum = Math.max(...hourly);
  const span = Math.max(maximum - minimum, 0.001);
  const width = 240;
  const left = 6;
  const right = 234;
  const bottom = 52;
  const top = 6;
  const step = hourly.length > 1 ? (right - left) / (hourly.length - 1) : 0;

  const commands = hourly.map((value, index) => {
    const x = left + index * step;
    const normalized = (value - minimum) / span;
    const y = bottom - normalized * (bottom - top);
    return `M${x.toFixed(2)} ${bottom}V${y.toFixed(2)}`;
  });

  path.setAttribute('d', commands.join(''));
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  path.closest('svg')?.setAttribute('data-chart-points', String(hourly.length));
};

const renderEuriborChart = (root: HTMLElement, points: SnapshotSeriesPoint[]) => {
  const path = root.querySelector<SVGPathElement>('[data-snapshot-euribor-chart-path]');
  if (!path) return;

  const values = points.flatMap((point) => isFiniteNumber(point.value) ? [point.value] : []);
  if (values.length < 2) {
    path.removeAttribute('d');
    return;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 0.001);
  const width = 220;
  const height = 64;
  const padX = 5;
  const padY = 6;

  const d = values.map((value, index) => {
    const x = padX + (index / (values.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (value - minimum) / span) * (height - padY * 2);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  path.setAttribute('d', d);
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  setText(root, '[data-snapshot-euribor-chart-high]', maximum.toFixed(1));
  setText(root, '[data-snapshot-euribor-chart-low]', minimum.toFixed(1));
};

const loadWeather = async (root: HTMLElement) => {
  const response = await fetch(buildWeatherUrl(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);

  const data = (await response.json()) as SnapshotWeatherResponse;
  const temperature = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  const lows = data.daily?.temperature_2m_min;
  const highs = data.daily?.temperature_2m_max;
  const low = Array.isArray(lows) ? lows[0] : undefined;
  const high = Array.isArray(highs) ? highs[0] : undefined;

  if (!isFiniteNumber(temperature) || !isFiniteNumber(code)) {
    throw new Error('Weather response is incomplete');
  }

  setText(root, '[data-snapshot-weather-temperature]', temperature.toFixed(1));
  setText(root, '[data-snapshot-weather-condition]', WEATHER_DESCRIPTIONS[code] ?? 'Variable weather');
  setText(root, '[data-snapshot-weather-low]', isFiniteNumber(low) ? String(Math.round(low)) : '--');
  setText(root, '[data-snapshot-weather-high]', isFiniteNumber(high) ? String(Math.round(high)) : '--');
  renderWeatherIcon(root, code);
};

const loadElectricity = async (root: HTMLElement) => {
  const response = await fetch('/api/current/electricity', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Electricity request failed: ${response.status}`);

  const data = (await response.json()) as SnapshotElectricityResponse;
  if (!Array.isArray(data.prices)) throw new Error('Electricity response is incomplete');

  const points = data.prices
    .flatMap((entry) => {
      const item = entry as SnapshotPriceEntry;
      const price = item.price;
      const startDate = item.startDate;
      const endDate = item.endDate;
      if (!isFiniteNumber(price) || typeof startDate !== 'string' || typeof endDate !== 'string') return [];

      const start = new Date(startDate);
      const end = new Date(endDate);
      const startMs = start.getTime();
      const endMs = end.getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return [];

      return [{ price, start, startMs, endMs }];
    })
    .sort((a, b) => a.startMs - b.startMs);

  const now = new Date();
  const today = getLocalDateKey(now);
  const dayPoints = points.filter((point) => getLocalDateKey(point.start) === today);
  if (dayPoints.length === 0) throw new Error('Electricity day is unavailable');

  const nowMs = now.getTime();
  const current =
    dayPoints.find((point) => point.startMs <= nowMs && point.startMs + QUARTER_MS > nowMs) ??
    dayPoints.find((point) => point.startMs <= nowMs && point.endMs >= nowMs);

  const values = dayPoints.map((point) => point.price);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const low = Math.min(...values);
  const high = Math.max(...values);

  const hero = root.querySelector<HTMLElement>('[data-snapshot-electricity-now]');
  const secondary = root.querySelector<HTMLElement>('[data-snapshot-electricity-average]');
  const secondaryLabel = secondary?.closest('div')?.querySelector<HTMLElement>('dt');

  if (hero) {
    hero.textContent = formatPrice(average);
    hero.dataset.snapshotElectricityDayAverage = 'true';
  }

  setText(root, '.snapshot-electricity__value .snapshot-micro', 'DAY AVG / TODAY');

  if (secondary) {
    secondary.textContent = current ? formatPrice(current.price) : '--.--';
    secondary.dataset.snapshotElectricityCurrent = 'true';
  }

  if (secondaryLabel) {
    secondaryLabel.textContent = current
      ? formatAverageComparison(current.price, average)
      : 'NOW · UNAVAILABLE';
  }

  setText(root, '[data-snapshot-electricity-low]', formatPrice(low));
  setText(root, '[data-snapshot-electricity-high]', formatPrice(high));
  renderElectricityChart(root, values);
};

const applyTone = (element: HTMLElement, value: number) => {
  element.classList.remove('is-positive', 'is-negative');
  if (value > 0.005) element.classList.add('is-positive');
  if (value < -0.005) element.classList.add('is-negative');
};

const fetchSnapshotMarkets = async (url: string) => {
  let lastError: unknown;

  for (const delay of MARKET_RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Markets request failed: ${response.status}`);
      return (await response.json()) as SnapshotPortfolioResponse;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Markets request failed');
};

const loadMarkets = async (root: HTMLElement) => {
  const data = await fetchSnapshotMarkets('/api/current/markets?portfolio=1&v=6');
  if (!Array.isArray(data.items)) throw new Error('Markets response is incomplete');

  setText(root, '.snapshot-markets .snapshot-kicker', 'TODAY / SELECTED PERFORMANCE');

  const byId = new Map<string, SnapshotPortfolioItem>();
  const todayValues: number[] = [];
  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as SnapshotPortfolioItem;
    if (typeof item.id === 'string') byId.set(item.id, item);
    const value = item.changes?.today;
    if (isFiniteNumber(value)) todayValues.push(value);
  }

  todayValues.sort((left, right) => left - right);
  const medianTarget = root.querySelector<HTMLElement>('[data-snapshot-market-median]');
  if (medianTarget) {
    const midpoint = Math.floor(todayValues.length / 2);
    const median = todayValues.length === 0
      ? null
      : todayValues.length % 2 === 1
        ? todayValues[midpoint]
        : (todayValues[midpoint - 1] + todayValues[midpoint]) / 2;

    medianTarget.textContent = median === null ? 'N/A' : formatPercent(median);
    medianTarget.classList.remove('is-positive', 'is-negative');
    if (median !== null) applyTone(medianTarget, median);
  }

  for (const id of SELECTED_MARKETS) {
    const target = root.querySelector<HTMLElement>(`[data-snapshot-market="${id}"]`);
    if (!target) continue;

    const value = byId.get(id)?.changes?.today;
    if (!isFiniteNumber(value)) {
      target.textContent = 'N/A';
      target.classList.remove('is-positive', 'is-negative');
      continue;
    }

    target.textContent = formatPercent(value);
    applyTone(target, value);
  }
};

const loadRates = async (root: HTMLElement) => {
  const response = await fetch('/api/current/markets', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Rates request failed: ${response.status}`);

  const data = (await response.json()) as SnapshotMacroResponse;
  const items = Array.isArray(data.items) ? data.items : [];
  const series = Array.isArray(data.series) ? data.series : [];

  const euribor = items.find((raw) => {
    const item = raw as SnapshotMacroItem;
    return item?.id === 'euribor-3m' && isFiniteNumber(item.value);
  }) as SnapshotMacroItem | undefined;

  const euriborSeries = series.find((raw) => {
    const item = raw as SnapshotMacroSeries;
    return item?.id === 'euribor-3m' && isFiniteNumber(item.change1y);
  }) as SnapshotMacroSeries | undefined;

  if (!euribor || !isFiniteNumber(euribor.value)) throw new Error('Euribor is unavailable');

  setText(root, '[data-snapshot-euribor]', euribor.value.toFixed(2));
  setText(
    root,
    '[data-snapshot-euribor-change]',
    euriborSeries && isFiniteNumber(euriborSeries.change1y)
      ? formatRateChange(euriborSeries.change1y)
      : 'N/A'
  );

  if (euriborSeries && Array.isArray(euriborSeries.points)) {
    renderEuriborChart(root, euriborSeries.points as SnapshotSeriesPoint[]);
  }
};

export const initCurrentSnapshot = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.snapshotInitialized === 'true') return;

  root.dataset.snapshotInitialized = 'true';

  type SnapshotSourceName = 'weather' | 'electricity' | 'markets' | 'rates' | 'liiga';
  type SnapshotSourceState = 'pending' | 'fulfilled' | 'rejected';

  const refreshButton = root.querySelector<HTMLButtonElement>('[data-snapshot-refresh]');
  const status = root.querySelector<HTMLElement>('[data-snapshot-status]');
  const sourceStates: Record<SnapshotSourceName, SnapshotSourceState> = {
    weather: 'pending',
    electricity: 'pending',
    markets: 'pending',
    rates: 'pending',
    liiga: 'pending',
  };
  let refreshing = false;

  const readLiigaState = (): SnapshotSourceState => {
    const liiga = root.querySelector<HTMLElement>('[data-snapshot-liiga]');
    if (!liiga) return 'pending';
    if (liiga.classList.contains('is-unavailable')) return 'rejected';

    const position = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-position]');
    const homeTeam = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]');
    const schedule = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-schedule]');
    const positionLabel = position?.getAttribute('aria-label') ?? '';
    const homeTeamText = homeTeam?.textContent?.trim() ?? '';
    const scheduleText = schedule?.textContent?.trim() ?? '';

    if (
      (positionLabel.startsWith('League position ') && positionLabel !== 'League position unavailable') ||
      (homeTeamText !== '' && homeTeamText !== '---') ||
      scheduleText === 'NO SCHEDULED GAME'
    ) {
      return 'fulfilled';
    }

    return 'pending';
  };

  const renderStatus = () => {
    if (!status) return;

    const states = Object.values(sourceStates);
    const hasPending = refreshing || states.some((state) => state === 'pending');
    root.setAttribute('aria-busy', hasPending ? 'true' : 'false');

    if (hasPending) {
      status.textContent = 'REFRESHING LIVE DATA';
      return;
    }

    const fulfilled = states.filter((state) => state === 'fulfilled').length;
    status.textContent =
      fulfilled === states.length
        ? 'LIVE DATA / OK'
        : fulfilled === 0
          ? 'LIVE DATA / UNAVAILABLE'
          : `LIVE DATA / ${fulfilled} OF ${states.length} SOURCES`;
  };

  const syncLiigaStateFromDom = () => {
    const nextState = readLiigaState();
    if (nextState === 'pending' && sourceStates.liiga !== 'pending') return;
    if (nextState === sourceStates.liiga) return;
    sourceStates.liiga = nextState;
    renderStatus();
  };

  const mutationTouchesLiiga = (mutation: MutationRecord) => {
    const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
    if (target?.closest('[data-snapshot-liiga]')) return true;

    return Array.from(mutation.addedNodes).some((node) =>
      node instanceof Element && (node.matches('[data-snapshot-liiga]') || node.querySelector('[data-snapshot-liiga]'))
    );
  };

  const liigaObserver = new MutationObserver((mutations) => {
    if (mutations.some(mutationTouchesLiiga)) syncLiigaStateFromDom();
  });
  liigaObserver.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'aria-label'],
  });

  const handleDataUpdated = (event: Event) => {
    const detail = (event as CustomEvent<{ source?: string }>).detail;
    if (detail?.source !== 'liiga') return;
    sourceStates.liiga = 'fulfilled';
    renderStatus();
  };
  window.addEventListener('current:data-updated', handleDataUpdated);
  syncLiigaStateFromDom();

  const baseSources = [
    ['weather', () => loadWeather(root)],
    ['electricity', () => loadElectricity(root)],
    ['markets', () => loadMarkets(root)],
    ['rates', () => loadRates(root)],
  ] as const;

  const refresh = async () => {
    refreshing = true;
    for (const [name] of baseSources) sourceStates[name] = 'pending';
    renderStatus();

    const results = await Promise.allSettled(baseSources.map(([, load]) => load()));
    results.forEach((result, index) => {
      const [name] = baseSources[index];
      sourceStates[name] = result.status === 'fulfilled' ? 'fulfilled' : 'rejected';
    });

    refreshing = false;
    renderStatus();

    if (results.some((result) => result.status === 'fulfilled')) {
      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'snapshot', at: new Date().toISOString() },
        })
      );
    }
  };

  refreshButton?.addEventListener('click', () => {
    sourceStates.liiga = 'pending';
    void refresh();
  });
  void refresh();
  window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
};