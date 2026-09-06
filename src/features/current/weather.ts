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
  isDay: boolean;
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

const getWeatherDescription = (code: number) =>
  weatherDescriptions[code] ?? 'Variable weather';

const getHourPoints = (data: OpenMeteoResponse): HourPoint[] => {
  const currentHour = `${data.current.time.slice(0, 13)}:00`;
  const startIndex = Math.max(
    0,
    data.hourly.time.findIndex((time) => time >= currentHour)
  );

  return data.hourly.time.slice(startIndex, startIndex + 24).map((time, offset) => {
    const index = startIndex + offset;
    return {
      time,
      temperature: data.hourly.temperature_2m[index],
      rainProbability: data.hourly.precipitation_probability[index] ?? 0,
      precipitation: data.hourly.precipitation[index] ?? 0,
      isDay: (data.hourly.is_day[index] ?? 0) === 1,
    };
  });
};

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

const renderChart = (svg: SVGSVGElement, points: HourPoint[]) => {
  const containerWidth = svg.parentElement?.getBoundingClientRect().width ?? 760;
  const width = Math.max(320, Math.round(containerWidth));
  const height = width < 560 ? 238 : 272;
  const left = width < 560 ? 34 : 42;
  const right = 12;
  const top = 18;
  const bottom = 42;
  const rainHeight = width < 560 ? 36 : 42;
  const plotBottom = height - bottom;
  const rainTop = plotBottom - rainHeight;
  const tempBottom = rainTop - 12;
  const tempHeight = tempBottom - top;
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
  const gridValues = [maximum, (maximum + minimum) / 2, minimum];

  const nightRects = points
    .map((point, index) => {
      if (point.isDay) return '';
      const x = left + xStep * index - xStep / 2;
      const safeX = Math.max(left, x);
      const rectWidth = index === 0 || index === points.length - 1 ? xStep / 2 : xStep;
      return `<rect x="${safeX.toFixed(2)}" y="${top}" width="${rectWidth.toFixed(2)}" height="${(tempBottom - top).toFixed(2)}" fill="var(--bar)" opacity="0.42" />`;
    })
    .join('');

  const gridLines = gridValues
    .map((value) => {
      const y = top + ((maximum - value) / span) * tempHeight;
      return `
        <line x1="${left}" x2="${width - right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="var(--line-soft)" stroke-width="1" vector-effect="non-scaling-stroke" />
        <text x="0" y="${(y + 3).toFixed(2)}" fill="var(--stone-light)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9">${Math.round(value)}°</text>
      `;
    })
    .join('');

  const rainBars = points
    .map((point, index) => {
      const barWidth = Math.max(2, Math.min(10, xStep * 0.48));
      const barHeight = (Math.max(0, Math.min(100, point.rainProbability)) / 100) * (rainHeight - 5);
      const x = left + xStep * index - barWidth / 2;
      const y = plotBottom - barHeight;
      const fill = point.rainProbability >= 50 ? 'var(--lichen)' : 'var(--line)';
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="1" fill="${fill}" opacity="0.82" />`;
    })
    .join('');

  const labels = points
    .map((point, index) => {
      if (index % 4 !== 0 && index !== points.length - 1) return '';
      const x = left + xStep * index;
      const anchor = index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle';
      return `<text x="${x.toFixed(2)}" y="${height - 9}" text-anchor="${anchor}" fill="var(--stone)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9" letter-spacing="0.04em">${formatTime(point.time)}</text>`;
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
    <text x="0" y="${rainTop + 13}" fill="var(--stone-light)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8" letter-spacing="0.06em">RAIN</text>
    ${rainBars}
    <path data-weather-temperature-path d="${path}" fill="none" stroke="var(--moss-deep)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <line x1="${currentPoint.x.toFixed(2)}" x2="${currentPoint.x.toFixed(2)}" y1="${top}" y2="${plotBottom}" stroke="var(--lichen)" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" />
    <circle cx="${currentPoint.x.toFixed(2)}" cy="${currentPoint.y.toFixed(2)}" r="3.2" fill="var(--page)" stroke="var(--moss-deep)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
    ${labels}
  `;
};

const buildApiUrl = () => {
  const params = new URLSearchParams({
    latitude: String(LOCATION.latitude),
    longitude: String(LOCATION.longitude),
    timezone: LOCATION.timeZone,
    forecast_days: '3',
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
  const feelsTarget = root.querySelector<HTMLElement>('[data-weather-feels]');
  const windTarget = root.querySelector<HTMLElement>('[data-weather-wind]');
  const rainNowTarget = root.querySelector<HTMLElement>('[data-weather-rain-now]');
  const rainNoteTarget = root.querySelector<HTMLElement>('[data-weather-rain-note]');
  const sunTarget = root.querySelector<HTMLElement>('[data-weather-sun]');
  const todayTarget = root.querySelector<HTMLElement>('[data-weather-today]');
  const errorTarget = root.querySelector<HTMLElement>('[data-weather-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-weather-retry]');
  const chart = root.querySelector<SVGSVGElement>('[data-weather-chart]');

  if (
    !temperatureTarget ||
    !conditionTarget ||
    !feelsTarget ||
    !windTarget ||
    !rainNowTarget ||
    !rainNoteTarget ||
    !sunTarget ||
    !todayTarget ||
    !errorTarget ||
    !chart
  ) {
    return;
  }

  let latestPoints: HourPoint[] = [];
  let resizeFrame = 0;

  const renderLatestChart = () => {
    if (latestPoints.length === 0) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => renderChart(chart, latestPoints));
  };

  const resizeObserver = new ResizeObserver(renderLatestChart);
  resizeObserver.observe(chart.parentElement ?? chart);

  const setLoadingState = () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;
  };

  const renderData = (data: OpenMeteoResponse) => {
    const points = getHourPoints(data);
    if (points.length === 0) throw new Error('Open-Meteo returned no hourly forecast data');

    latestPoints = points;

    temperatureTarget.textContent = roundOne(data.current.temperature_2m).toFixed(1);
    conditionTarget.textContent = getWeatherDescription(data.current.weather_code);
    feelsTarget.textContent = `${roundOne(data.current.apparent_temperature).toFixed(1)}°`;
    windTarget.textContent = `${roundOne(data.current.wind_speed_10m).toFixed(1)} m/s ${formatDirection(data.current.wind_direction_10m)}`;
    rainNowTarget.textContent = `${roundOne(data.current.precipitation).toFixed(1)} mm`;
    rainNoteTarget.textContent = getRainNote(points);

    const sunrise = data.daily.sunrise[0] ? formatTime(data.daily.sunrise[0]) : '--:--';
    const sunset = data.daily.sunset[0] ? formatTime(data.daily.sunset[0]) : '--:--';
    const sunshineHours = Number.isFinite(data.daily.sunshine_duration?.[0])
      ? `${roundOne(data.daily.sunshine_duration[0] / 3600).toFixed(1)} h sun`
      : '';
    sunTarget.textContent = [`${sunrise} - ${sunset}`, sunshineHours]
      .filter(Boolean)
      .join(' · ');

    const minimum = Math.round(data.daily.temperature_2m_min[0]);
    const maximum = Math.round(data.daily.temperature_2m_max[0]);
    const rain = roundOne(data.daily.precipitation_sum[0]).toFixed(1);
    todayTarget.textContent = `${minimum}° / ${maximum}° · ${rain} mm`;

    renderLatestChart();
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
