type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  precipitation: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  is_day: number;
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  is_day: number[];
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_min: number[];
  temperature_2m_max: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  sunshine_duration: number[];
};

type OpenMeteoResponse = {
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
};

type HourPoint = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
};

type DailyPoint = {
  time: string;
  label: string;
  minimum: number;
  maximum: number;
  rainProbability: number;
  weatherCode: number;
};

const LOCATION = {
  latitude: 60.1719,
  longitude: 24.7314,
  timeZone: 'Europe/Helsinki',
} as const;

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Light freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Light snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy thunderstorm with hail',
};

const roundOne = (value: number) => Math.round(value * 10) / 10;

const formatTime = (value: string) => {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? '--:--';
};

const formatDirection = (degrees: number) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return directions[index];
};

const formatWeekday = (value: string) => {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: LOCATION.timeZone,
  })
    .format(date)
    .toUpperCase();
};

const getWeatherDescription = (code: number) =>
  weatherDescriptions[code] ?? 'Variable weather';

const getWeatherKind = (code: number) => {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloud';
};

const weatherIconSvg = (code: number, isDay = true) => {
  const kind = getWeatherKind(code);
  const base = 'fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';

  const sun = `
    <circle cx="18" cy="18" r="5.1" />
    <path d="M18 5.2v4.1M18 26.7v4.1M5.2 18h4.1M26.7 18h4.1M8.9 8.9l2.9 2.9M24.2 24.2l2.9 2.9M27.1 8.9l-2.9 2.9M11.8 24.2l-2.9 2.9" />
  `;

  const moon = '<path d="M23.9 9.2a9.7 9.7 0 1 0 2.8 17.1 10.6 10.6 0 0 1-2.8-17.1Z" />';
  const cloud = '<path d="M9.3 24.5h16.5a4.8 4.8 0 0 0 .3-9.6 8.1 8.1 0 0 0-15.4-1.8 5.7 5.7 0 0 0-1.4 11.4Z" />';

  let drawing = cloud;

  if (kind === 'clear') {
    drawing = isDay ? sun : moon;
  } else if (kind === 'partly') {
    drawing = `
      <g transform="translate(-5 -5) scale(.72)">${isDay ? sun : moon}</g>
      <path d="M10 25h16a4.5 4.5 0 0 0 .2-9 7.5 7.5 0 0 0-14.3-1.7A5.3 5.3 0 0 0 10 25Z" />
    `;
  } else if (kind === 'fog') {
    drawing = `
      <path d="M10 19.5h15a4.1 4.1 0 0 0 .2-8.2 7 7 0 0 0-13.3-1.5 4.8 4.8 0 0 0-1.9 9.7Z" />
      <path d="M7 24h22M10 28h16" />
    `;
  } else if (kind === 'rain') {
    drawing = `${cloud}<path d="M13 27.5l-1.3 3M19 27.5l-1.3 3M25 27.5l-1.3 3" />`;
  } else if (kind === 'snow') {
    drawing = `${cloud}<path d="M12.5 29h.1M18.5 27.5h.1M24.5 29h.1" stroke-width="2.6" />`;
  } else if (kind === 'thunder') {
    drawing = `${cloud}<path d="M19.5 26.5h-4l2-4.5h4l-1.8 3.3h3.2l-5.7 6.2Z" />`;
  }

  return `<svg class="weather-symbol weather-symbol--${kind}" viewBox="0 0 36 36" aria-hidden="true"><g ${base}>${drawing}</g></svg>`;
};

const getHourPoints = (data: OpenMeteoResponse): HourPoint[] => {
  const currentHour = `${data.current.time.slice(0, 13)}:00`;
  const foundIndex = data.hourly.time.findIndex((time) => time >= currentHour);
  const startIndex = foundIndex >= 0 ? foundIndex : 0;

  return data.hourly.time.slice(startIndex, startIndex + 24).map((time, offset) => {
    const index = startIndex + offset;
    return {
      time,
      temperature: data.hourly.temperature_2m[index],
      rainProbability: data.hourly.precipitation_probability[index] ?? 0,
      precipitation: data.hourly.precipitation[index] ?? 0,
      weatherCode: data.hourly.weather_code[index] ?? data.current.weather_code,
      isDay: (data.hourly.is_day[index] ?? 0) === 1,
    };
  });
};

const getDailyPoints = (data: OpenMeteoResponse): DailyPoint[] =>
  data.daily.time.slice(1, 6).map((time, offset) => {
    const index = offset + 1;
    return {
      time,
      label: offset === 0 ? 'TOM' : formatWeekday(time),
      minimum: data.daily.temperature_2m_min[index],
      maximum: data.daily.temperature_2m_max[index],
      rainProbability: data.daily.precipitation_probability_max[index] ?? 0,
      weatherCode: data.daily.weather_code[index] ?? 3,
    };
  });

const getRainNote = (points: HourPoint[]) => {
  const relevant = points.slice(0, 14);
  const wetIndexes = relevant
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.rainProbability >= 40 || point.precipitation >= 0.1);

  if (wetIndexes.length === 0) return 'No meaningful rain signal in the next 14 h';

  const first = wetIndexes[0].index;
  let last = first;

  for (const { index } of wetIndexes.slice(1)) {
    if (index <= last + 1) last = index;
    else break;
  }

  const window = relevant.slice(first, last + 1);
  const total = window.reduce((sum, point) => sum + point.precipitation, 0);
  const peakProbability = Math.max(...window.map((point) => point.rainProbability));
  const start = formatTime(window[0].time);
  const endHour = `${window.at(-1)?.time.slice(0, 13)}:59`;
  const end = formatTime(endHour);

  return `${start}-${end} · ${peakProbability}% · ${roundOne(total)} mm`;
};

const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };

    const control2 = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    };

    path += ` C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)}, ${control2.x.toFixed(2)} ${control2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
};

const buildLinePath = (points: Array<{ x: number; y: number }>) =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

const renderHourlyPreview = (container: HTMLElement, points: HourPoint[]) => {
  const preview = points.length > 6 ? points.slice(1, 7) : points.slice(0, 6);

  container.innerHTML = preview
    .map(
      (point) => `
        <div class="weather-hour" data-weather-hour>
          <p class="weather-hour__time">${formatTime(point.time)}</p>
          <div class="weather-hour__icon" aria-hidden="true">${weatherIconSvg(point.weatherCode, point.isDay)}</div>
          <p class="weather-hour__temperature">${Math.round(point.temperature)}°</p>
          <p class="weather-hour__rain">${Math.round(point.rainProbability)}% rain</p>
        </div>
      `
    )
    .join('');
};

const renderDailyPreview = (container: HTMLElement, points: DailyPoint[]) => {
  container.innerHTML = points
    .map(
      (point) => `
        <div class="weather-day" data-weather-day>
          <p class="weather-day__name">${point.label}</p>
          <div class="weather-day__icon" aria-hidden="true">${weatherIconSvg(point.weatherCode)}</div>
          <p class="weather-day__rain">${Math.round(point.rainProbability)}% rain</p>
        </div>
      `
    )
    .join('');
};

const renderDailyChart = (svg: SVGSVGElement, points: DailyPoint[]) => {
  const containerWidth = svg.parentElement?.getBoundingClientRect().width ?? 760;
  const width = Math.max(300, Math.round(containerWidth));
  const height = width < 560 ? 118 : 132;
  const top = 28;
  const bottom = 26;
  const plotHeight = height - top - bottom;
  const values = points.flatMap((point) => [point.minimum, point.maximum]);
  const minimum = Math.floor(Math.min(...values) - 1);
  const maximum = Math.ceil(Math.max(...values) + 1);
  const span = Math.max(1, maximum - minimum);

  const xFor = (index: number) => ((index + 0.5) / points.length) * width;
  const yFor = (value: number) => top + ((maximum - value) / span) * plotHeight;

  const maxPoints = points.map((point, index) => ({ x: xFor(index), y: yFor(point.maximum) }));
  const minPoints = points.map((point, index) => ({ x: xFor(index), y: yFor(point.minimum) }));
  const maxPath = buildLinePath(maxPoints);
  const minPath = buildLinePath(minPoints);

  const verticalGuides = points
    .map((_, index) => {
      const x = xFor(index);
      return `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${top}" y2="${height - bottom}" stroke="var(--line-soft)" stroke-width="1" opacity="0.48" vector-effect="non-scaling-stroke" />`;
    })
    .join('');

  const maxMarks = maxPoints
    .map((point, index) => `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.6" fill="var(--page)" stroke="var(--moss-deep)" stroke-width="1.4" vector-effect="non-scaling-stroke" />
      <text x="${point.x.toFixed(2)}" y="${Math.max(11, point.y - 8).toFixed(2)}" text-anchor="middle" fill="var(--ink-soft)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9">${Math.round(points[index].maximum)}°</text>
    `)
    .join('');

  const minMarks = minPoints
    .map((point, index) => `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.4" fill="var(--page)" stroke="var(--stone)" stroke-width="1.2" vector-effect="non-scaling-stroke" />
      <text x="${point.x.toFixed(2)}" y="${Math.min(height - 5, point.y + 15).toFixed(2)}" text-anchor="middle" fill="var(--stone)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9">${Math.round(points[index].minimum)}°</text>
    `)
    .join('');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('height', String(height));
  svg.innerHTML = `
    <title>High and low temperatures for the next five days in Olari</title>
    ${verticalGuides}
    <path data-weather-daily-max-path d="${maxPath}" fill="none" stroke="var(--moss-deep)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <path data-weather-daily-min-path d="${minPath}" fill="none" stroke="var(--stone)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    ${maxMarks}
    ${minMarks}
  `;
};

const renderChart = (svg: SVGSVGElement, points: HourPoint[]) => {
  const containerWidth = svg.parentElement?.getBoundingClientRect().width ?? 760;
  const width = Math.max(300, Math.round(containerWidth));
  const height = width < 560 ? 132 : 150;
  const left = width < 560 ? 31 : 38;
  const right = 8;
  const top = 12;
  const bottom = 26;
  const rainHeight = width < 560 ? 20 : 23;
  const plotBottom = height - bottom;
  const rainTop = plotBottom - rainHeight;
  const tempBottom = rainTop - 8;
  const tempHeight = Math.max(24, tempBottom - top);
  const plotWidth = width - left - right;

  const temperatures = points.map((point) => point.temperature);
  const minimum = Math.floor(Math.min(...temperatures) - 1);
  const maximum = Math.ceil(Math.max(...temperatures) + 1);
  const span = Math.max(1, maximum - minimum);
  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const tempPoints = points.map((point, index) => ({
    x: left + xStep * index,
    y: top + ((maximum - point.temperature) / span) * tempHeight,
  }));

  const path = buildSmoothPath(tempPoints);
  const gridValues = [maximum, minimum];

  const nightRects = points
    .map((point, index) => {
      if (point.isDay) return '';
      const x = left + xStep * index - xStep / 2;
      const safeX = Math.max(left, x);
      const rectWidth = index === 0 || index === points.length - 1 ? xStep / 2 : xStep;
      return `<rect x="${safeX.toFixed(2)}" y="${top}" width="${rectWidth.toFixed(2)}" height="${(tempBottom - top).toFixed(2)}" fill="var(--bar)" opacity="0.36" />`;
    })
    .join('');

  const gridLines = gridValues
    .map((value) => {
      const y = top + ((maximum - value) / span) * tempHeight;
      return `
        <line x1="${left}" x2="${width - right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="var(--line-soft)" stroke-width="1" vector-effect="non-scaling-stroke" />
        <text x="0" y="${(y + 3).toFixed(2)}" fill="var(--stone-light)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8">${Math.round(value)}°</text>
      `;
    })
    .join('');

  const rainBars = points
    .map((point, index) => {
      const barWidth = Math.max(1.5, Math.min(8, xStep * 0.44));
      const barHeight = (Math.max(0, Math.min(100, point.rainProbability)) / 100) * (rainHeight - 3);
      const x = left + xStep * index - barWidth / 2;
      const y = plotBottom - barHeight;
      const fill = point.rainProbability >= 50 ? 'var(--lichen)' : 'var(--line)';
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="0.8" fill="${fill}" opacity="0.78" />`;
    })
    .join('');

  const labels = points
    .map((point, index) => {
      if (index % 6 !== 0 && index !== points.length - 1) return '';
      const x = left + xStep * index;
      const anchor = index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle';
      return `<text x="${x.toFixed(2)}" y="${height - 6}" text-anchor="${anchor}" fill="var(--stone)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8" letter-spacing="0.035em">${formatTime(point.time)}</text>`;
    })
    .join('');

  const currentPoint = tempPoints[0];

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('height', String(height));
  svg.innerHTML = `
    <title>Temperature and rain probability for the next 24 hours in Olari</title>
    ${nightRects}
    ${gridLines}
    <line x1="${left}" x2="${width - right}" y1="${rainTop}" y2="${rainTop}" stroke="var(--line-soft)" stroke-width="1" vector-effect="non-scaling-stroke" />
    ${rainBars}
    <path data-weather-temperature-path d="${path}" fill="none" stroke="var(--moss-deep)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <line x1="${currentPoint.x.toFixed(2)}" x2="${currentPoint.x.toFixed(2)}" y1="${top}" y2="${plotBottom}" stroke="var(--lichen)" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" />
    <circle cx="${currentPoint.x.toFixed(2)}" cy="${currentPoint.y.toFixed(2)}" r="2.8" fill="var(--page)" stroke="var(--moss-deep)" stroke-width="1.35" vector-effect="non-scaling-stroke" />
    ${labels}
  `;
};

const buildApiUrl = () => {
  const params = new URLSearchParams({
    latitude: String(LOCATION.latitude),
    longitude: String(LOCATION.longitude),
    timezone: LOCATION.timeZone,
    forecast_days: '6',
    temperature_unit: 'celsius',
    wind_speed_unit: 'ms',
    precipitation_unit: 'mm',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'precipitation',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_min',
      'temperature_2m_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'sunshine_duration',
    ].join(','),
  });

  return `${WEATHER_API_URL}?${params.toString()}`;
};

export const initCurrentWeather = () => {
  const root = document.querySelector<HTMLElement>('[data-current-weather]');
  if (!root) return;
  if (root.dataset.weatherInitialized === 'true') return;

  root.dataset.weatherInitialized = 'true';

  const temperatureTarget = root.querySelector<HTMLElement>('[data-weather-temperature]');
  const conditionTarget = root.querySelector<HTMLElement>('[data-weather-condition]');
  const currentIconTarget = root.querySelector<HTMLElement>('[data-weather-current-icon]');
  const currentMinTarget = root.querySelector<HTMLElement>('[data-weather-current-min]');
  const currentMaxTarget = root.querySelector<HTMLElement>('[data-weather-current-max]');
  const feelsTarget = root.querySelector<HTMLElement>('[data-weather-feels]');
  const windTarget = root.querySelector<HTMLElement>('[data-weather-wind]');
  const rainNowTarget = root.querySelector<HTMLElement>('[data-weather-rain-now]');
  const hourlyTarget = root.querySelector<HTMLElement>('[data-weather-hours]');
  const dailyTarget = root.querySelector<HTMLElement>('[data-weather-days]');
  const dailyChart = root.querySelector<SVGSVGElement>('[data-weather-daily-chart]');
  const rainNoteTarget = root.querySelector<HTMLElement>('[data-weather-rain-note]');
  const sunTarget = root.querySelector<HTMLElement>('[data-weather-sun]');
  const todayTarget = root.querySelector<HTMLElement>('[data-weather-today]');
  const errorTarget = root.querySelector<HTMLElement>('[data-weather-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-weather-retry]');
  const chart = root.querySelector<SVGSVGElement>('[data-weather-chart]');

  if (
    !temperatureTarget ||
    !conditionTarget ||
    !currentIconTarget ||
    !currentMinTarget ||
    !currentMaxTarget ||
    !feelsTarget ||
    !windTarget ||
    !rainNowTarget ||
    !hourlyTarget ||
    !dailyTarget ||
    !dailyChart ||
    !rainNoteTarget ||
    !sunTarget ||
    !todayTarget ||
    !errorTarget ||
    !chart
  ) {
    return;
  }

  let latestPoints: HourPoint[] = [];
  let latestDailyPoints: DailyPoint[] = [];
  let resizeFrame = 0;

  const renderLatestCharts = () => {
    if (latestPoints.length === 0 || latestDailyPoints.length === 0) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      renderChart(chart, latestPoints);
      renderDailyChart(dailyChart, latestDailyPoints);
    });
  };

  const resizeObserver = new ResizeObserver(renderLatestCharts);
  resizeObserver.observe(chart.parentElement ?? chart);
  resizeObserver.observe(dailyChart.parentElement ?? dailyChart);

  const setLoadingState = () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;
  };

  const renderData = (data: OpenMeteoResponse) => {
    const points = getHourPoints(data);
    const dailyPoints = getDailyPoints(data);

    if (points.length === 0) throw new Error('Open-Meteo returned no hourly forecast data');
    if (dailyPoints.length < 5) throw new Error('Open-Meteo returned insufficient daily forecast data');

    latestPoints = points;
    latestDailyPoints = dailyPoints;

    temperatureTarget.textContent = roundOne(data.current.temperature_2m).toFixed(1);
    conditionTarget.textContent = getWeatherDescription(data.current.weather_code);
    currentIconTarget.innerHTML = weatherIconSvg(data.current.weather_code, data.current.is_day === 1);

    const currentMinimum = Math.round(data.daily.temperature_2m_min[0]);
    const currentMaximum = Math.round(data.daily.temperature_2m_max[0]);
    currentMinTarget.textContent = String(currentMinimum);
    currentMaxTarget.textContent = String(currentMaximum);

    feelsTarget.textContent = `${roundOne(data.current.apparent_temperature).toFixed(1)}°`;
    windTarget.textContent = `${roundOne(data.current.wind_speed_10m).toFixed(1)} m/s ${formatDirection(data.current.wind_direction_10m)}`;
    rainNowTarget.textContent = `${roundOne(data.current.precipitation).toFixed(1)} mm`;

    renderHourlyPreview(hourlyTarget, points);
    renderDailyPreview(dailyTarget, dailyPoints);
    rainNoteTarget.textContent = getRainNote(points);

    const sunrise = data.daily.sunrise[0] ? formatTime(data.daily.sunrise[0]) : '--:--';
    const sunset = data.daily.sunset[0] ? formatTime(data.daily.sunset[0]) : '--:--';
    const sunshineHours = Number.isFinite(data.daily.sunshine_duration?.[0])
      ? `${roundOne(data.daily.sunshine_duration[0] / 3600).toFixed(1)} h sun`
      : '';
    sunTarget.textContent = [`${sunrise} - ${sunset}`, sunshineHours]
      .filter(Boolean)
      .join(' · ');

    const rain = roundOne(data.daily.precipitation_sum[0]).toFixed(1);
    todayTarget.textContent = `${currentMinimum}° / ${currentMaximum}° · ${rain} mm`;

    renderLatestCharts();
    root.setAttribute('aria-busy', 'false');
    errorTarget.hidden = true;

    window.dispatchEvent(
      new CustomEvent('current:data-updated', {
        detail: { source: 'weather', at: new Date().toISOString() },
      })
    );
  };

  const loadWeather = async () => {
    setLoadingState();

    try {
      const response = await fetch(buildApiUrl(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`Open-Meteo request failed: ${response.status}`);

      const data = (await response.json()) as OpenMeteoResponse;
      renderData(data);
    } catch (error) {
      void error;
      root.setAttribute('aria-busy', 'false');
      errorTarget.hidden = false;
      conditionTarget.textContent = 'Forecast unavailable';
    }
  };

  retryButton?.addEventListener('click', loadWeather);
  loadWeather();
  window.setInterval(loadWeather, REFRESH_INTERVAL_MS);
};
