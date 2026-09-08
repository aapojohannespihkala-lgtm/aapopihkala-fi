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

type SnapshotMacroSeries = {
  id?: unknown;
  change1y?: unknown;
};

type SnapshotMacroResponse = {
  items?: unknown;
  series?: unknown;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
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

  setText(root, '[data-snapshot-electricity-now]', current ? formatPrice(current.price) : '--.--');
  setText(root, '[data-snapshot-electricity-average]', formatPrice(average));
  setText(root, '[data-snapshot-electricity-low]', formatPrice(low));
  setText(root, '[data-snapshot-electricity-high]', formatPrice(high));
};

const applyTone = (element: HTMLElement, value: number) => {
  element.classList.remove('is-positive', 'is-negative');
  if (value > 0.005) element.classList.add('is-positive');
  if (value < -0.005) element.classList.add('is-negative');
};

const loadMarkets = async (root: HTMLElement) => {
  const response = await fetch('/api/current/markets?portfolio=1&v=6', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Markets request failed: ${response.status}`);

  const data = (await response.json()) as SnapshotPortfolioResponse;
  if (!Array.isArray(data.items)) throw new Error('Markets response is incomplete');

  const byId = new Map<string, SnapshotPortfolioItem>();
  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as SnapshotPortfolioItem;
    if (typeof item.id === 'string') byId.set(item.id, item);
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

  setText(root, '[data-snapshot-euribor]', euribor.value.toFixed(3));
  setText(
    root,
    '[data-snapshot-euribor-change]',
    euriborSeries && isFiniteNumber(euriborSeries.change1y)
      ? formatRateChange(euriborSeries.change1y)
      : 'N/A'
  );
};

export const initCurrentSnapshot = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.snapshotInitialized === 'true') return;

  root.dataset.snapshotInitialized = 'true';

  const refreshButton = root.querySelector<HTMLButtonElement>('[data-snapshot-refresh]');
  const status = root.querySelector<HTMLElement>('[data-snapshot-status]');

  const refresh = async () => {
    root.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'REFRESHING LIVE DATA';

    const results = await Promise.allSettled([
      loadWeather(root),
      loadElectricity(root),
      loadMarkets(root),
      loadRates(root),
    ]);

    const failures = results.filter((result) => result.status === 'rejected').length;
    root.setAttribute('aria-busy', 'false');

    if (status) {
      status.textContent =
        failures === 0
          ? 'LIVE DATA / OK'
          : failures === results.length
            ? 'LIVE DATA / UNAVAILABLE'
            : `LIVE DATA / ${results.length - failures} OF ${results.length} SOURCES`;
    }

    if (failures < results.length) {
      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'snapshot', at: new Date().toISOString() },
        })
      );
    }
  };

  refreshButton?.addEventListener('click', () => void refresh());
  void refresh();
  window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
};
