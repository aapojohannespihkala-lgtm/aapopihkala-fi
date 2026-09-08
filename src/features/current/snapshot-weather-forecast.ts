type SnapshotHourlyWeather = {
  time?: unknown;
  temperature_2m?: unknown;
  weather_code?: unknown;
  precipitation_probability?: unknown;
};

type SnapshotHourlyWeatherResponse = {
  hourly?: SnapshotHourlyWeather;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const FORECAST_OFFSETS_HOURS = [2, 4, 6] as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const helsinkiHourFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const getHelsinkiHourKey = (date: Date) => {
  const parts = Object.fromEntries(
    helsinkiHourFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}T${parts.hour ?? '00'}:00`;
};

const buildForecastUrl = () => {
  const params = new URLSearchParams({
    latitude: '60.1719',
    longitude: '24.7314',
    timezone: HELSINKI_TIME_ZONE,
    forecast_days: '2',
    temperature_unit: 'celsius',
    hourly: ['temperature_2m', 'weather_code', 'precipitation_probability'].join(','),
  });

  return `${WEATHER_API_URL}?${params.toString()}`;
};

const getShortCondition = (code: number) => {
  if (code <= 1) return 'CLEAR';
  if (code === 2) return 'CLOUDY';
  if (code === 3) return 'OVERCAST';
  if (code === 45 || code === 48) return 'FOG';
  if (code >= 51 && code <= 57) return 'DRIZZLE';
  if (code >= 61 && code <= 67) return 'RAIN';
  if (code >= 71 && code <= 77) return 'SNOW';
  if (code >= 80 && code <= 82) return 'SHOWERS';
  if (code >= 85 && code <= 86) return 'SNOW';
  if (code >= 95) return 'STORM';
  return 'VARIABLE';
};

const hasPrecipitation = (code: number) =>
  (code >= 51 && code <= 67) ||
  (code >= 71 && code <= 86) ||
  code >= 95;

const formatCondition = (code: number, precipitationProbability: number | undefined) => {
  const condition = getShortCondition(code);
  if (
    hasPrecipitation(code) &&
    isFiniteNumber(precipitationProbability) &&
    precipitationProbability >= 40
  ) {
    return `${condition} ${Math.round(precipitationProbability)}%`;
  }

  return condition;
};

const createForecastMarkup = () => {
  const container = document.createElement('div');
  container.className = 'snapshot-weather__forecast';
  container.dataset.snapshotWeatherForecast = 'true';
  container.setAttribute('aria-label', 'Weather during the next six hours');

  const label = document.createElement('span');
  label.className = 'snapshot-weather__forecast-label';
  label.textContent = 'NEXT 6H';
  container.append(label);

  FORECAST_OFFSETS_HOURS.forEach((_, index) => {
    const slot = document.createElement('span');
    slot.className = 'snapshot-weather__forecast-slot';
    slot.dataset.snapshotWeatherForecastSlot = String(index);

    const time = document.createElement('time');
    time.className = 'snapshot-weather__forecast-time';
    time.dataset.snapshotWeatherForecastTime = String(index);
    time.textContent = '--';

    const temperature = document.createElement('strong');
    temperature.className = 'snapshot-weather__forecast-temperature';
    temperature.dataset.snapshotWeatherForecastTemperature = String(index);
    temperature.textContent = '--°';

    const condition = document.createElement('span');
    condition.className = 'snapshot-weather__forecast-condition';
    condition.dataset.snapshotWeatherForecastCondition = String(index);
    condition.textContent = 'WAITING';

    slot.append(time, temperature, condition);
    container.append(slot);
  });

  return container;
};

const ensureForecast = (root: HTMLElement) => {
  const existing = root.querySelector<HTMLElement>('[data-snapshot-weather-forecast]');
  if (existing) return existing;

  const weather = root.querySelector<HTMLElement>('.snapshot-weather');
  const source = weather?.querySelector<HTMLElement>('.snapshot-source');
  if (!weather || !source) return null;

  const forecast = createForecastMarkup();
  weather.insertBefore(forecast, source);
  return forecast;
};

const renderUnavailable = (forecast: HTMLElement) => {
  FORECAST_OFFSETS_HOURS.forEach((_, index) => {
    const time = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-time="${index}"]`);
    const temperature = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-temperature="${index}"]`);
    const condition = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-condition="${index}"]`);

    if (time) time.textContent = '--';
    if (temperature) temperature.textContent = '--°';
    if (condition) condition.textContent = 'N/A';
  });
};

const loadForecast = async (root: HTMLElement, forecast: HTMLElement) => {
  const response = await fetch(buildForecastUrl(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Hourly weather request failed: ${response.status}`);

  const data = (await response.json()) as SnapshotHourlyWeatherResponse;
  const times = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
  const temperatures = Array.isArray(data.hourly?.temperature_2m) ? data.hourly.temperature_2m : [];
  const codes = Array.isArray(data.hourly?.weather_code) ? data.hourly.weather_code : [];
  const precipitation = Array.isArray(data.hourly?.precipitation_probability)
    ? data.hourly.precipitation_probability
    : [];

  if (times.length === 0) throw new Error('Hourly weather response is incomplete');

  const now = new Date();

  FORECAST_OFFSETS_HOURS.forEach((offset, slotIndex) => {
    const targetKey = getHelsinkiHourKey(new Date(now.getTime() + offset * 60 * 60 * 1000));
    const hourlyIndex = times.findIndex((value) => value === targetKey);

    const timeTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-time="${slotIndex}"]`);
    const temperatureTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-temperature="${slotIndex}"]`);
    const conditionTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-condition="${slotIndex}"]`);

    if (hourlyIndex < 0) {
      if (timeTarget) timeTarget.textContent = '--';
      if (temperatureTarget) temperatureTarget.textContent = '--°';
      if (conditionTarget) conditionTarget.textContent = 'N/A';
      return;
    }

    const time = times[hourlyIndex];
    const temperature = temperatures[hourlyIndex];
    const code = codes[hourlyIndex];
    const probability = precipitation[hourlyIndex];

    if (timeTarget) {
      timeTarget.textContent = typeof time === 'string' ? time.slice(11, 13) : '--';
    }

    if (temperatureTarget) {
      temperatureTarget.textContent = isFiniteNumber(temperature)
        ? `${Math.round(temperature)}°`
        : '--°';
    }

    if (conditionTarget) {
      conditionTarget.textContent = isFiniteNumber(code)
        ? formatCondition(code, isFiniteNumber(probability) ? probability : undefined)
        : 'N/A';
    }
  });

  forecast.dataset.state = 'ready';
  root.dispatchEvent(new CustomEvent('snapshot:weather-forecast-updated'));
};

export const initSnapshotWeatherForecast = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.weatherForecastInitialized === 'true') return;

  const forecast = ensureForecast(root);
  if (!forecast) return;

  root.dataset.weatherForecastInitialized = 'true';
  const refreshButton = root.querySelector<HTMLButtonElement>('[data-snapshot-refresh]');

  const refresh = async () => {
    forecast.dataset.state = 'loading';
    try {
      await loadForecast(root, forecast);
    } catch {
      forecast.dataset.state = 'error';
      renderUnavailable(forecast);
    }
  };

  refreshButton?.addEventListener('click', () => void refresh());
  void refresh();
  window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
};
