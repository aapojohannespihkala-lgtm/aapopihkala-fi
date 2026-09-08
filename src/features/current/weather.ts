type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  weather_code: number;
  is_day: number;
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  is_day: number[];
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_min: number[];
  temperature_2m_max: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
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

export type SolarOrbitGeometry = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  horizonY: number;
  declinationDegrees: number;
};

export type SolarPosition = {
  x: number;
  y: number;
  aboveHorizon: boolean;
};

const LOCATION = {
  latitude: 60.1719,
  longitude: 24.7314,
  timeZone: 'Europe/Helsinki',
} as const;

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SOLAR_VIEWBOX = {
  width: 120,
  height: 44,
  cx: 60,
  horizonY: 22,
  xScale: 52,
  yScale: 22,
} as const;
const SVG_NS = 'http://www.w3.org/2000/svg';

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

const formatTime = (value: string) => {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? '--:--';
};

const readClockMinutes = (value: string) => {
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const parseIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const getSolarDeclinationRadians = (dateValue: string) => {
  const date = parseIsoDate(dateValue);
  if (!date) return null;

  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - yearStart) / 86_400_000) + 1;
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInYear = isLeapYear ? 366 : 365;
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / daysInYear;

  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  );
};

export const getSolarOrbitGeometry = (
  dateValue: string,
  latitude = LOCATION.latitude
): SolarOrbitGeometry | null => {
  const declination = getSolarDeclinationRadians(dateValue);
  if (declination === null) return null;

  const latitudeRadians = latitude * DEG_TO_RAD;
  const cosDeclination = Math.cos(declination);

  return {
    cx: SOLAR_VIEWBOX.cx,
    cy:
      SOLAR_VIEWBOX.horizonY -
      SOLAR_VIEWBOX.yScale * Math.sin(latitudeRadians) * Math.sin(declination),
    rx: SOLAR_VIEWBOX.xScale * cosDeclination,
    ry: SOLAR_VIEWBOX.yScale * Math.cos(latitudeRadians) * cosDeclination,
    horizonY: SOLAR_VIEWBOX.horizonY,
    declinationDegrees: declination * RAD_TO_DEG,
  };
};

const normalizeHourAngle = (degrees: number) => {
  const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180;
  return wrapped * DEG_TO_RAD;
};

export const getSolarPosition = (
  dateValue: string,
  currentTime: string,
  sunrise: string,
  sunset: string,
  latitude = LOCATION.latitude
): SolarPosition | null => {
  const geometry = getSolarOrbitGeometry(dateValue, latitude);
  const declination = getSolarDeclinationRadians(dateValue);
  const current = readClockMinutes(currentTime);
  const start = readClockMinutes(sunrise);
  const end = readClockMinutes(sunset);

  if (
    !geometry ||
    declination === null ||
    current === null ||
    start === null ||
    end === null ||
    end <= start
  ) {
    return null;
  }

  const solarNoon = (start + end) / 2;
  const hourAngle = normalizeHourAngle((current - solarNoon) / 4);
  const latitudeRadians = latitude * DEG_TO_RAD;
  const cosDeclination = Math.cos(declination);
  const altitudeProjection =
    Math.sin(latitudeRadians) * Math.sin(declination) +
    Math.cos(latitudeRadians) * cosDeclination * Math.cos(hourAngle);

  return {
    x:
      SOLAR_VIEWBOX.cx +
      SOLAR_VIEWBOX.xScale * cosDeclination * Math.sin(hourAngle),
    y: SOLAR_VIEWBOX.horizonY - SOLAR_VIEWBOX.yScale * altitudeProjection,
    aboveHorizon: altitudeProjection >= 0,
  };
};

const formatWeekday = (value: string) => {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase();
};

const formatDaylightLength = (sunrise: string, sunset: string) => {
  const start = readClockMinutes(sunrise);
  const end = readClockMinutes(sunset);
  if (start === null || end === null) return '--';

  const duration = end >= start ? end - start : end + 24 * 60 - start;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}H ${String(minutes).padStart(2, '0')}M`;
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
      <path d="M10 25h16a4.5 4.5 0 0 0 .2-9 7.5 7.5 0 0 0-14.3-1.7A5.3 5.3 0 0 0 10 25Z" fill="var(--page)" />
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
  const foundIndex = data.hourly.time.findIndex((time) => time > data.current.time);
  const startIndex = foundIndex >= 0 ? foundIndex : 0;

  return data.hourly.time.slice(startIndex, startIndex + 6).map((time, offset) => {
    const index = startIndex + offset;
    return {
      time,
      temperature: data.hourly.temperature_2m[index],
      rainProbability: data.hourly.precipitation_probability[index] ?? 0,
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
      label: formatWeekday(time),
      minimum: data.daily.temperature_2m_min[index],
      maximum: data.daily.temperature_2m_max[index],
      rainProbability: data.daily.precipitation_probability_max[index] ?? 0,
      weatherCode: data.daily.weather_code[index] ?? 3,
    };
  });

const buildLinePath = (points: Array<{ x: number; y: number }>) =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

const renderHourlyPreview = (container: HTMLElement, points: HourPoint[]) => {
  container.innerHTML = points
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
  if (points.length === 0) return;

  const containerWidth = svg.parentElement?.getBoundingClientRect().width ?? 760;
  const width = Math.max(300, Math.round(containerWidth));
  const height = width < 560 ? 124 : 168;
  const top = 18;
  const bottom = 18;
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

  const maxMarks = maxPoints
    .map((point, index) => `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3" fill="var(--page)" stroke="var(--ink)" stroke-width="1.4" vector-effect="non-scaling-stroke" />
      <text x="${point.x.toFixed(2)}" y="${Math.max(10, point.y - 8).toFixed(2)}" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9">${Math.round(points[index].maximum)}°</text>
    `)
    .join('');

  const minMarks = minPoints
    .map((point, index) => `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.7" fill="var(--page)" stroke="var(--stone)" stroke-width="1.25" vector-effect="non-scaling-stroke" />
      <text x="${point.x.toFixed(2)}" y="${Math.min(height - 5, point.y + 15).toFixed(2)}" text-anchor="middle" fill="var(--stone)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9">${Math.round(points[index].minimum)}°</text>
    `)
    .join('');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('height', String(height));
  svg.innerHTML = `
    <title>Daily high and low temperatures for the next five days in Olari</title>
    <path data-weather-daily-max-path d="${maxPath}" fill="none" stroke="var(--ink)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <path data-weather-daily-min-path d="${minPath}" fill="none" stroke="var(--stone)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    ${maxMarks}
    ${minMarks}
  `;
};

const createSvgElement = <K extends keyof SVGElementTagNameMap>(tagName: K) =>
  document.createElementNS(SVG_NS, tagName);

const ensureSolarOrbitElements = (svg: SVGSVGElement, marker: SVGCircleElement) => {
  let visibleOrbit = svg.querySelector<SVGEllipseElement>('[data-weather-solar-orbit-visible]');
  let hiddenOrbit = svg.querySelector<SVGEllipseElement>('[data-weather-solar-orbit-hidden]');
  let horizon = svg.querySelector<SVGLineElement>('[data-weather-solar-horizon]');

  if (visibleOrbit && hiddenOrbit && horizon) {
    return { visibleOrbit, hiddenOrbit, horizon };
  }

  svg.querySelector('path')?.setAttribute('opacity', '0');
  svg
    .querySelectorAll<SVGCircleElement>('circle:not([data-weather-sun-position])')
    .forEach((circle) => circle.setAttribute('opacity', '0'));

  const defs = createSvgElement('defs');
  const aboveClip = createSvgElement('clipPath');
  const belowClip = createSvgElement('clipPath');
  const aboveRect = createSvgElement('rect');
  const belowRect = createSvgElement('rect');

  aboveClip.id = 'weather-solar-above-horizon';
  aboveClip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  aboveRect.setAttribute('x', '0');
  aboveRect.setAttribute('y', '0');
  aboveRect.setAttribute('width', String(SOLAR_VIEWBOX.width));
  aboveRect.setAttribute('height', String(SOLAR_VIEWBOX.horizonY));
  aboveClip.append(aboveRect);

  belowClip.id = 'weather-solar-below-horizon';
  belowClip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  belowRect.setAttribute('x', '0');
  belowRect.setAttribute('y', String(SOLAR_VIEWBOX.horizonY));
  belowRect.setAttribute('width', String(SOLAR_VIEWBOX.width));
  belowRect.setAttribute('height', String(SOLAR_VIEWBOX.height - SOLAR_VIEWBOX.horizonY));
  belowClip.append(belowRect);

  defs.append(aboveClip, belowClip);

  hiddenOrbit = createSvgElement('ellipse');
  hiddenOrbit.setAttribute('data-weather-solar-orbit-hidden', '');
  hiddenOrbit.setAttribute('fill', 'none');
  hiddenOrbit.setAttribute('stroke', 'currentColor');
  hiddenOrbit.setAttribute('stroke-width', '1');
  hiddenOrbit.setAttribute('stroke-linecap', 'round');
  hiddenOrbit.setAttribute('stroke-dasharray', '2.4 2.4');
  hiddenOrbit.setAttribute('opacity', '0.45');
  hiddenOrbit.setAttribute('vector-effect', 'non-scaling-stroke');
  hiddenOrbit.setAttribute('clip-path', 'url(#weather-solar-below-horizon)');

  visibleOrbit = createSvgElement('ellipse');
  visibleOrbit.setAttribute('data-weather-solar-orbit-visible', '');
  visibleOrbit.setAttribute('fill', 'none');
  visibleOrbit.setAttribute('stroke', 'currentColor');
  visibleOrbit.setAttribute('stroke-width', '1');
  visibleOrbit.setAttribute('stroke-linecap', 'round');
  visibleOrbit.setAttribute('vector-effect', 'non-scaling-stroke');
  visibleOrbit.setAttribute('clip-path', 'url(#weather-solar-above-horizon)');

  horizon = createSvgElement('line');
  horizon.setAttribute('data-weather-solar-horizon', '');
  horizon.setAttribute('x1', '7');
  horizon.setAttribute('x2', '113');
  horizon.setAttribute('y1', String(SOLAR_VIEWBOX.horizonY));
  horizon.setAttribute('y2', String(SOLAR_VIEWBOX.horizonY));
  horizon.setAttribute('stroke', 'currentColor');
  horizon.setAttribute('stroke-width', '0.8');
  horizon.setAttribute('opacity', '0.38');
  horizon.setAttribute('vector-effect', 'non-scaling-stroke');

  svg.insertBefore(defs, svg.firstChild);
  svg.insertBefore(hiddenOrbit, marker);
  svg.insertBefore(visibleOrbit, marker);
  svg.insertBefore(horizon, marker);

  return { visibleOrbit, hiddenOrbit, horizon };
};

const renderSolarPosition = (
  solarRoot: HTMLElement,
  marker: SVGCircleElement,
  dateValue: string,
  currentTime: string,
  sunrise: string,
  sunset: string,
  daylightLength: string
) => {
  const sunriseLabel = sunrise ? formatTime(sunrise) : '--:--';
  const sunsetLabel = sunset ? formatTime(sunset) : '--:--';
  solarRoot.setAttribute(
    'aria-label',
    `Sunrise ${sunriseLabel}, sunset ${sunsetLabel}, day length ${daylightLength}`
  );

  const svg = marker.ownerSVGElement;
  const geometry = getSolarOrbitGeometry(dateValue);
  const position = getSolarPosition(dateValue, currentTime, sunrise, sunset);

  if (!svg || !geometry || !position) {
    marker.setAttribute('opacity', '0');
    return;
  }

  const { visibleOrbit, hiddenOrbit } = ensureSolarOrbitElements(svg, marker);
  const ellipseAttributes = {
    cx: geometry.cx.toFixed(2),
    cy: geometry.cy.toFixed(2),
    rx: geometry.rx.toFixed(2),
    ry: geometry.ry.toFixed(2),
  };

  for (const [name, value] of Object.entries(ellipseAttributes)) {
    visibleOrbit.setAttribute(name, value);
    hiddenOrbit.setAttribute(name, value);
  }

  svg.setAttribute(
    'aria-label',
    "Sun's apparent 24-hour path. The solid part is above the horizon and the dashed part is below it."
  );
  svg.setAttribute('data-weather-solar-center-y', geometry.cy.toFixed(2));
  svg.setAttribute('data-weather-solar-declination', geometry.declinationDegrees.toFixed(2));

  marker.setAttribute('cx', position.x.toFixed(2));
  marker.setAttribute('cy', position.y.toFixed(2));
  marker.setAttribute('data-weather-sun-above-horizon', String(position.aboveHorizon));
  marker.setAttribute('stroke', position.aboveHorizon ? 'var(--moss-deep)' : 'currentColor');
  marker.setAttribute('opacity', position.aboveHorizon ? '1' : '0.72');
};

const buildApiUrl = () => {
  const params = new URLSearchParams({
    latitude: String(LOCATION.latitude),
    longitude: String(LOCATION.longitude),
    timezone: LOCATION.timeZone,
    forecast_days: '6',
    temperature_unit: 'celsius',
    current: ['temperature_2m', 'weather_code', 'is_day'].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_min',
      'temperature_2m_max',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
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
  const solarTarget = root.querySelector<HTMLElement>('[data-weather-solar]');
  const sunriseTarget = root.querySelector<HTMLElement>('[data-weather-sunrise]');
  const sunsetTarget = root.querySelector<HTMLElement>('[data-weather-sunset]');
  const daylightTarget = root.querySelector<HTMLElement>('[data-weather-daylight]');
  const sunPositionTarget = root.querySelector<SVGCircleElement>('[data-weather-sun-position]');
  const hoursTarget = root.querySelector<HTMLElement>('[data-weather-hours]');
  const daysTarget = root.querySelector<HTMLElement>('[data-weather-days]');
  const dailyChart = root.querySelector<SVGSVGElement>('[data-weather-daily-chart]');
  const errorTarget = root.querySelector<HTMLElement>('[data-weather-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-weather-retry]');

  if (
    !temperatureTarget ||
    !conditionTarget ||
    !currentIconTarget ||
    !currentMinTarget ||
    !currentMaxTarget ||
    !solarTarget ||
    !sunriseTarget ||
    !sunsetTarget ||
    !daylightTarget ||
    !sunPositionTarget ||
    !hoursTarget ||
    !daysTarget ||
    !dailyChart ||
    !errorTarget
  ) {
    return;
  }

  let latestDailyPoints: DailyPoint[] = [];
  let resizeFrame = 0;

  const renderLatestDailyChart = () => {
    if (latestDailyPoints.length === 0) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() =>
      renderDailyChart(dailyChart, latestDailyPoints)
    );
  };

  const resizeObserver = new ResizeObserver(renderLatestDailyChart);
  resizeObserver.observe(dailyChart.parentElement ?? dailyChart);

  const setLoadingState = () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;
  };

  const renderData = (data: OpenMeteoResponse) => {
    const hourPoints = getHourPoints(data);
    const dailyPoints = getDailyPoints(data);

    if (hourPoints.length === 0 || dailyPoints.length === 0) {
      throw new Error('Open-Meteo returned incomplete forecast data');
    }

    latestDailyPoints = dailyPoints;

    temperatureTarget.textContent = data.current.temperature_2m.toFixed(1);
    conditionTarget.textContent = getWeatherDescription(data.current.weather_code);
    currentIconTarget.innerHTML = weatherIconSvg(
      data.current.weather_code,
      data.current.is_day === 1
    );

    currentMinTarget.textContent = String(Math.round(data.daily.temperature_2m_min[0]));
    currentMaxTarget.textContent = String(Math.round(data.daily.temperature_2m_max[0]));

    const sunrise = data.daily.sunrise[0] ?? '';
    const sunset = data.daily.sunset[0] ?? '';
    const daylightLength = formatDaylightLength(sunrise, sunset);
    const solarDate = data.daily.time[0] ?? data.current.time.slice(0, 10);

    sunriseTarget.textContent = sunrise ? formatTime(sunrise) : '--:--';
    sunsetTarget.textContent = sunset ? formatTime(sunset) : '--:--';
    daylightTarget.textContent = daylightLength;
    renderSolarPosition(
      solarTarget,
      sunPositionTarget,
      solarDate,
      data.current.time,
      sunrise,
      sunset,
      daylightLength
    );

    renderHourlyPreview(hoursTarget, hourPoints);
    renderDailyPreview(daysTarget, dailyPoints);
    renderLatestDailyChart();

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

      if (!response.ok) {
        throw new Error(`Open-Meteo request failed: ${response.status}`);
      }

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
