// Mirrors Android SolarDetailVisual.kt and the web Widget's 24-hour disk.
// The latitude-based solar ellipse remains available on /current/weather/.
const CIRCLE_RADIUS_PERCENT = 43;

const readClockMinutes = (clock: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(clock);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
    ? hours * 60 + minutes
    : null;
};

export type DayNightDiskGeometry = {
  sunX: number;
  sunY: number;
  horizonY: number;
  horizonLeft: number;
  aboveHorizon: boolean;
};

export const getDayNightDiskGeometry = (
  sunrise: string,
  sunset: string,
  nowMinutes: number,
): DayNightDiskGeometry | null => {
  const rise = readClockMinutes(sunrise);
  const set = readClockMinutes(sunset);
  if (rise === null || set === null || set <= rise || !Number.isFinite(nowMinutes)) {
    return null;
  }

  const daylightFraction = (set - rise) / 1440;
  const horizonOffset = Math.cos(Math.PI * daylightFraction);
  const horizonY = 50 - CIRCLE_RADIUS_PERCENT * horizonOffset;
  const horizonLeft =
    50 - CIRCLE_RADIUS_PERCENT * Math.sqrt(Math.max(0, 1 - horizonOffset ** 2));
  const solarNoon = (rise + set) / 2;
  const elapsed = ((nowMinutes - solarNoon) % 1440 + 1440) % 1440;
  const angle = (2 * Math.PI * elapsed) / 1440;

  return {
    sunX: 50 + CIRCLE_RADIUS_PERCENT * Math.sin(angle),
    sunY: 50 - CIRCLE_RADIUS_PERCENT * Math.cos(angle),
    horizonY,
    horizonLeft,
    aboveHorizon: nowMinutes >= rise && nowMinutes <= set,
  };
};

const helsinkiMinutesNow = (): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Helsinki',
  }).formatToParts(new Date());
  const part = (kind: string) => Number(parts.find((entry) => entry.type === kind)?.value ?? 0);
  return part('hour') * 60 + part('minute');
};

export const initCurrentDayNightDisk = () => {
  const solarRoot = document.querySelector<HTMLElement>('.current-shell [data-weather-solar]');
  const diagram = solarRoot?.querySelector<HTMLElement>('.weather-solar-diagram');
  const disk = solarRoot?.querySelector<HTMLElement>('[data-weather-daynight-disk]');
  const sunriseTarget = solarRoot?.querySelector<HTMLElement>('[data-weather-sunrise]');
  const sunsetTarget = solarRoot?.querySelector<HTMLElement>('[data-weather-sunset]');
  if (!diagram || !disk || !sunriseTarget || !sunsetTarget) return;
  if (disk.dataset.daynightInitialized === 'true') return;
  disk.dataset.daynightInitialized = 'true';

  let lastClockKey = '';
  const update = () => {
    const sunrise = sunriseTarget.textContent?.trim() ?? '';
    const sunset = sunsetTarget.textContent?.trim() ?? '';
    const now = helsinkiMinutesNow();
    const key = `${sunrise}|${sunset}|${now}`;
    if (key === lastClockKey) return;
    lastClockKey = key;

    const geometry = getDayNightDiskGeometry(sunrise, sunset, now);
    diagram.classList.toggle('has-daynight-disk', geometry !== null);
    disk.hidden = geometry === null;
    if (!geometry) return;

    disk.style.setProperty('--sun-x', `${geometry.sunX.toFixed(2)}%`);
    disk.style.setProperty('--sun-y', `${geometry.sunY.toFixed(2)}%`);
    disk.style.setProperty('--horizon-y', `${geometry.horizonY.toFixed(2)}%`);
    disk.style.setProperty('--horizon-left', `${geometry.horizonLeft.toFixed(2)}%`);
    disk.style.setProperty('--sun-fill', geometry.aboveHorizon ? 'var(--moss-deep)' : 'transparent');
    disk.dataset.sunAboveHorizon = String(geometry.aboveHorizon);
  };

  window.addEventListener('current:data-updated', (event) => {
    if (event instanceof CustomEvent && event.detail?.source === 'weather') update();
  });
  window.setInterval(update, 1000);
  update();
};
