type SnapshotHourlyWeather = {
  time?: unknown;
  temperature_2m?: unknown;
  weather_code?: unknown;
  precipitation_probability?: unknown;
};

type SnapshotDailyWeather = {
  time?: unknown;
  sunrise?: unknown;
  sunset?: unknown;
};

type SnapshotHourlyWeatherResponse = {
  hourly?: SnapshotHourlyWeather;
  daily?: SnapshotDailyWeather;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const CALENDAR_INTERVAL_MS = 60 * 1000;
const FORECAST_SLOT_STEPS = [0, 2, 4, 6] as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const helsinkiMinuteFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const helsinkiCalendarFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  weekday: 'short',
  timeZone: HELSINKI_TIME_ZONE,
});

const getHelsinkiMinuteKey = (date: Date) => {
  const parts = Object.fromEntries(
    helsinkiMinuteFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}T${parts.hour ?? '00'}:${parts.minute ?? '00'}`;
};

const getHelsinkiCalendarParts = (date: Date) =>
  Object.fromEntries(
    helsinkiCalendarFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

const getIsoWeekNumber = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
};

const readClockMinutes = (value: string) => {
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const formatSolarTime = (value: string) => value.slice(11, 16) || '--:--';

const formatDaylightLength = (sunrise: string, sunset: string) => {
  const start = readClockMinutes(sunrise);
  const end = readClockMinutes(sunset);
  if (start === null || end === null) return '--';

  const duration = end >= start ? end - start : end + 24 * 60 - start;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}H ${String(minutes).padStart(2, '0')}M`;
};

const buildForecastUrl = () => {
  const params = new URLSearchParams({
    latitude: '60.1719',
    longitude: '24.7314',
    timezone: HELSINKI_TIME_ZONE,
    forecast_days: '2',
    temperature_unit: 'celsius',
    hourly: ['temperature_2m', 'weather_code', 'precipitation_probability'].join(','),
    daily: ['sunrise', 'sunset'].join(','),
  });

  return `${WEATHER_API_URL}?${params.toString()}`;
};

const getShortCondition = (code: number) => {
  if (code <= 1) return 'Clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Variable weather';
};

const renderForecastIcon = (target: SVGSVGElement, code: number) => {
  const stroke = 'currentColor';
  const cloud = `<path d="M8 22h15.5c3.2 0 5.5-2 5.5-4.6 0-2.8-2.3-4.7-5.1-4.7-.8-3.7-3.8-6.1-7.6-6.1-4.4 0-7.8 3.2-8.1 7.4C5 14.3 3 16.2 3 18.8 3 20.7 5 22 8 22Z" fill="none" stroke="${stroke}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>`;

  if (code <= 1) {
    target.innerHTML = `<circle cx="16" cy="15" r="5.2" fill="none" stroke="${stroke}" stroke-width="1.2"/><path d="M16 5v3M16 22v3M6 15h3M23 15h3M9 8l2 2M21 20l2 2M23 8l-2 2M11 20l-2 2" fill="none" stroke="${stroke}" stroke-width="1.05" stroke-linecap="round"/>`;
    return;
  }

  if (code === 2) {
    target.innerHTML = `<circle cx="22" cy="9" r="4.2" fill="none" stroke="${stroke}" stroke-width="1.05"/>${cloud}`;
    return;
  }

  if (code === 3) {
    target.innerHTML = cloud;
    return;
  }

  if (code === 45 || code === 48) {
    target.innerHTML = `${cloud}<path d="M7 26h19M10 29h14" fill="none" stroke="${stroke}" stroke-width="1.05" stroke-linecap="round"/>`;
    return;
  }

  if (code >= 71 && code <= 86) {
    target.innerHTML = `${cloud}<circle cx="11" cy="27" r="1" fill="${stroke}"/><circle cx="17" cy="28" r="1" fill="${stroke}"/><circle cx="23" cy="26.5" r="1" fill="${stroke}"/>`;
    return;
  }

  if (code >= 95) {
    target.innerHTML = `${cloud}<path d="M18 22l-4 5h4l-2 4 7-7h-4l3-2Z" fill="none" stroke="${stroke}" stroke-width="1.1" stroke-linejoin="round"/>`;
    return;
  }

  target.innerHTML = `${cloud}<path d="M10 25l-1.5 4M17 25l-1.5 4M24 25l-1.5 4" fill="none" stroke="${stroke}" stroke-width="1.05" stroke-linecap="round"/>`;
};

const createForecastMarkup = () => {
  const container = document.createElement('div');
  container.className = 'snapshot-weather__forecast';
  container.dataset.snapshotWeatherForecast = 'true';
  container.setAttribute('aria-label', 'Upcoming weather');

  FORECAST_SLOT_STEPS.forEach((_, index) => {
    const slot = document.createElement('span');
    slot.className = 'snapshot-weather__forecast-slot';
    slot.dataset.snapshotWeatherForecastSlot = String(index);

    const time = document.createElement('time');
    time.className = 'snapshot-weather__forecast-time';
    time.dataset.snapshotWeatherForecastTime = String(index);
    time.textContent = '--:--';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 32 32');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('snapshot-weather__forecast-icon');
    icon.dataset.snapshotWeatherForecastIcon = String(index);

    const temperature = document.createElement('strong');
    temperature.className = 'snapshot-weather__forecast-temperature';
    temperature.dataset.snapshotWeatherForecastTemperature = String(index);
    temperature.textContent = '--°';

    const condition = document.createElement('span');
    condition.hidden = true;
    condition.dataset.snapshotWeatherForecastCondition = String(index);
    condition.textContent = 'Waiting';

    slot.append(time, icon, temperature, condition);
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

const ensureCalendarStyles = () => {
  if (document.querySelector('[data-snapshot-calendar-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotCalendarStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-titleblock__meta {
      min-width: 154px;
      gap: 1px;
    }

    body:has(.snapshot-shell) .snapshot-calendar__date {
      color: var(--ink-soft);
      font-size: 0.53rem;
      font-weight: 650;
      line-height: 1.1;
      letter-spacing: 0.045em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__week,
    body:has(.snapshot-shell) .snapshot-calendar__daylight {
      color: var(--stone);
      font-size: 0.39rem;
      font-weight: 550;
      line-height: 1.05;
      letter-spacing: 0.045em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar {
      display: grid;
      grid-template-columns: auto minmax(62px, 1fr) auto;
      align-items: end;
      gap: 4px;
      margin-top: 1px;
      color: var(--stone);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar time {
      padding-bottom: 1px;
      font-size: 0.36rem;
      line-height: 1;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar svg {
      display: block;
      width: 100%;
      height: 22px;
      overflow: visible;
      color: color-mix(in srgb, var(--ink-soft) 72%, transparent);
    }

    body:has(.snapshot-shell) .snapshot-calendar__daylight {
      margin-top: 1px;
      text-align: center;
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-titleblock__meta {
        min-width: 140px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__date {
        font-size: 0.43rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__week,
      body:has(.snapshot-shell) .snapshot-calendar__daylight {
        font-size: 0.34rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar {
        grid-template-columns: auto minmax(54px, 1fr) auto;
        gap: 3px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar time {
        font-size: 0.32rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar svg {
        height: 19px;
      }
    }

    @media (max-width: 380px), (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-titleblock__meta {
        min-width: 126px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__date {
        font-size: 0.37rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__week,
      body:has(.snapshot-shell) .snapshot-calendar__daylight {
        font-size: 0.29rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar {
        grid-template-columns: auto minmax(44px, 1fr) auto;
        gap: 2px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar time {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar svg {
        height: 16px;
      }
    }
  `;
  document.head.append(style);
};

const ensureCalendarSolar = (root: HTMLElement) => {
  const meta = root.querySelector<HTMLElement>('.snapshot-titleblock__meta');
  if (!meta || meta.dataset.snapshotCalendarReady === 'true') return meta;

  ensureCalendarStyles();

  const date = document.createElement('div');
  date.className = 'snapshot-calendar__date';
  date.dataset.snapshotCalendarDate = 'true';
  date.textContent = '--- / -- --- ----';

  const week = document.createElement('div');
  week.className = 'snapshot-calendar__week';
  week.dataset.snapshotCalendarWeek = 'true';
  week.textContent = 'WEEK / --';

  const solar = document.createElement('div');
  solar.className = 'snapshot-calendar__solar';
  solar.dataset.snapshotCalendarSolar = 'true';
  solar.setAttribute('aria-label', 'Sunrise, sunset and daylight');

  const sunrise = document.createElement('time');
  sunrise.dataset.snapshotCalendarSunrise = 'true';
  sunrise.textContent = '--:--';

  const arc = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arc.setAttribute('viewBox', '0 0 120 40');
  arc.setAttribute('aria-hidden', 'true');
  arc.innerHTML = `
    <path d="M8 32 A52 24 0 0 1 112 32" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" />
    <circle cx="8" cy="32" r="1.4" fill="currentColor" />
    <circle cx="112" cy="32" r="1.4" fill="currentColor" />
    <circle data-snapshot-calendar-sun-position cx="8" cy="32" r="2.1" fill="var(--page)" stroke="var(--moss-deep)" stroke-width="1.3" opacity="0" vector-effect="non-scaling-stroke" />
  `;

  const sunset = document.createElement('time');
  sunset.dataset.snapshotCalendarSunset = 'true';
  sunset.textContent = '--:--';

  solar.append(sunrise, arc, sunset);

  const daylight = document.createElement('div');
  daylight.className = 'snapshot-calendar__daylight';
  daylight.dataset.snapshotCalendarDaylight = 'true';
  daylight.textContent = 'DAYLIGHT / --';

  meta.replaceChildren(date, week, solar, daylight);
  meta.dataset.snapshotCalendarReady = 'true';
  meta.setAttribute('aria-label', 'Helsinki date, week number and daylight');
  return meta;
};

const renderCalendar = (root: HTMLElement) => {
  const parts = getHelsinkiCalendarParts(new Date());
  const weekday = (parts.weekday ?? '---').toUpperCase();
  const day = parts.day ?? '--';
  const month = (parts.month ?? '---').toUpperCase();
  const year = Number(parts.year ?? '0');
  const monthNumber = Number(
    Object.fromEntries(
      helsinkiMinuteFormatter
        .formatToParts(new Date())
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    ).month ?? '0'
  );
  const dayNumber = Number(day);
  const weekNumber = year > 0 && monthNumber > 0 && dayNumber > 0
    ? getIsoWeekNumber(year, monthNumber, dayNumber)
    : null;

  const dateTarget = root.querySelector<HTMLElement>('[data-snapshot-calendar-date]');
  const weekTarget = root.querySelector<HTMLElement>('[data-snapshot-calendar-week]');

  if (dateTarget) dateTarget.textContent = `${weekday} / ${day} ${month} ${parts.year ?? '----'}`;
  if (weekTarget) weekTarget.textContent = weekNumber ? `WEEK / ${String(weekNumber).padStart(2, '0')}` : 'WEEK / --';
};

const renderSolarPosition = (root: HTMLElement) => {
  const solar = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar]');
  const marker = root.querySelector<SVGCircleElement>('[data-snapshot-calendar-sun-position]');
  if (!solar || !marker) return;

  const sunrise = solar.dataset.sunrise;
  const sunset = solar.dataset.sunset;
  if (!sunrise || !sunset) {
    marker.setAttribute('opacity', '0');
    return;
  }

  const start = readClockMinutes(sunrise);
  const end = readClockMinutes(sunset);
  const current = readClockMinutes(getHelsinkiMinuteKey(new Date()));
  if (start === null || end === null || current === null || end <= start || current < start || current > end) {
    marker.setAttribute('opacity', '0');
    return;
  }

  const progress = Math.min(1, Math.max(0, (current - start) / (end - start)));
  const x = 60 - 52 * Math.cos(Math.PI * progress);
  const y = 32 - 24 * Math.sin(Math.PI * progress);
  marker.setAttribute('cx', x.toFixed(2));
  marker.setAttribute('cy', y.toFixed(2));
  marker.setAttribute('opacity', '1');
};

const renderSolarData = (root: HTMLElement, data: SnapshotHourlyWeatherResponse) => {
  const sunrises = Array.isArray(data.daily?.sunrise) ? data.daily.sunrise : [];
  const sunsets = Array.isArray(data.daily?.sunset) ? data.daily.sunset : [];
  const sunrise = typeof sunrises[0] === 'string' ? sunrises[0] : null;
  const sunset = typeof sunsets[0] === 'string' ? sunsets[0] : null;
  if (!sunrise || !sunset) return;

  const sunriseTarget = root.querySelector<HTMLTimeElement>('[data-snapshot-calendar-sunrise]');
  const sunsetTarget = root.querySelector<HTMLTimeElement>('[data-snapshot-calendar-sunset]');
  const daylightTarget = root.querySelector<HTMLElement>('[data-snapshot-calendar-daylight]');
  const solar = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar]');
  const daylight = formatDaylightLength(sunrise, sunset);

  if (sunriseTarget) {
    sunriseTarget.textContent = formatSolarTime(sunrise);
    sunriseTarget.dateTime = sunrise;
  }
  if (sunsetTarget) {
    sunsetTarget.textContent = formatSolarTime(sunset);
    sunsetTarget.dateTime = sunset;
  }
  if (daylightTarget) daylightTarget.textContent = `DAYLIGHT / ${daylight}`;
  if (solar) {
    solar.dataset.sunrise = sunrise;
    solar.dataset.sunset = sunset;
    solar.setAttribute('aria-label', `Sunrise ${formatSolarTime(sunrise)}, sunset ${formatSolarTime(sunset)}, daylight ${daylight}`);
  }

  renderSolarPosition(root);
};

const renderUnavailable = (forecast: HTMLElement) => {
  FORECAST_SLOT_STEPS.forEach((_, index) => {
    const time = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-time="${index}"]`);
    const temperature = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-temperature="${index}"]`);
    const condition = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-condition="${index}"]`);
    const icon = forecast.querySelector<SVGSVGElement>(`[data-snapshot-weather-forecast-icon="${index}"]`);

    if (time) time.textContent = '--:--';
    if (temperature) temperature.textContent = '--°';
    if (condition) condition.textContent = 'Unavailable';
    if (icon) icon.innerHTML = '';
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

  renderSolarData(root, data);

  if (times.length === 0) throw new Error('Hourly weather response is incomplete');

  const nowKey = getHelsinkiMinuteKey(new Date());
  const firstFutureIndex = times.findIndex(
    (value) => typeof value === 'string' && value > nowKey
  );

  if (firstFutureIndex < 0) throw new Error('Upcoming hourly weather is unavailable');

  FORECAST_SLOT_STEPS.forEach((step, slotIndex) => {
    const hourlyIndex = firstFutureIndex + step;
    const timeTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-time="${slotIndex}"]`);
    const temperatureTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-temperature="${slotIndex}"]`);
    const conditionTarget = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-condition="${slotIndex}"]`);
    const iconTarget = forecast.querySelector<SVGSVGElement>(`[data-snapshot-weather-forecast-icon="${slotIndex}"]`);
    const slot = forecast.querySelector<HTMLElement>(`[data-snapshot-weather-forecast-slot="${slotIndex}"]`);

    const time = times[hourlyIndex];
    const temperature = temperatures[hourlyIndex];
    const code = codes[hourlyIndex];
    const probability = precipitation[hourlyIndex];

    if (
      typeof time !== 'string' ||
      !isFiniteNumber(temperature) ||
      !isFiniteNumber(code)
    ) {
      if (timeTarget) timeTarget.textContent = '--:--';
      if (temperatureTarget) temperatureTarget.textContent = '--°';
      if (conditionTarget) conditionTarget.textContent = 'Unavailable';
      if (iconTarget) iconTarget.innerHTML = '';
      return;
    }

    const clock = time.slice(11, 16);
    const condition = getShortCondition(code);
    const rainText = isFiniteNumber(probability) && probability >= 40
      ? `, precipitation ${Math.round(probability)} percent`
      : '';

    if (timeTarget) {
      timeTarget.textContent = clock;
      timeTarget.setAttribute('datetime', time);
    }

    if (temperatureTarget) temperatureTarget.textContent = `${Math.round(temperature)}°`;
    if (conditionTarget) conditionTarget.textContent = condition;
    if (iconTarget) renderForecastIcon(iconTarget, code);
    if (slot) slot.setAttribute('aria-label', `${clock}, ${condition}, ${Math.round(temperature)} degrees${rainText}`);
  });

  forecast.dataset.state = 'ready';
  root.dispatchEvent(new CustomEvent('snapshot:weather-forecast-updated'));
};

export const initSnapshotWeatherForecast = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.weatherForecastInitialized === 'true') return;

  const forecast = ensureForecast(root);
  if (!forecast) return;

  ensureCalendarSolar(root);
  renderCalendar(root);
  renderSolarPosition(root);

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

  const refreshCalendar = () => {
    renderCalendar(root);
    renderSolarPosition(root);
  };

  refreshButton?.addEventListener('click', () => void refresh());
  void refresh();
  window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
  window.setInterval(refreshCalendar, CALENDAR_INTERVAL_MS);
};