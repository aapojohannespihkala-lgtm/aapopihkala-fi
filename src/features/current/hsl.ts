type HslDeparture = {
  route: string;
  headsign: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  realtimeState: string;
};

type HslResponse = {
  source: string;
  fetchedAt: string;
  stop: {
    code: string;
    name: string;
  };
  routes: string[];
  departures: HslDeparture[];
};

const REFRESH_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isHslResponse = (value: unknown): value is HslResponse => {
  if (!isRecord(value) || !isRecord(value.stop) || !Array.isArray(value.departures)) return false;
  if (typeof value.fetchedAt !== 'string') return false;
  if (typeof value.stop.code !== 'string' || typeof value.stop.name !== 'string') return false;

  return value.departures.every((departure) => {
    if (!isRecord(departure)) return false;
    return (
      typeof departure.route === 'string' &&
      typeof departure.headsign === 'string' &&
      typeof departure.scheduledAt === 'string' &&
      typeof departure.departureAt === 'string' &&
      typeof departure.delaySeconds === 'number' &&
      typeof departure.realtime === 'boolean' &&
      typeof departure.realtimeState === 'string'
    );
  });
};

const parseRoutes = (value: string) =>
  [...new Set(value.split(/[\s,]+/).map((route) => route.trim().toUpperCase()).filter(Boolean))];

const formatClock = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: HELSINKI_TIME_ZONE,
  }).format(date);
};

const formatCountdown = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '--';

  const minutes = Math.ceil((timestamp - Date.now()) / 60_000);
  if (minutes <= 0) return 'NOW';
  return `${minutes} MIN`;
};

const formatDelay = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes === 0) return '';
  return `${minutes > 0 ? '+' : ''}${minutes} MIN`;
};

const errorMessage = (status: number, error: string | null) => {
  if (status === 503 || error === 'missing_configuration') return 'DIGITRANSIT API KEY NOT CONFIGURED.';
  if (status === 404 || error === 'stop_not_found') return 'STOP NOT FOUND.';
  if (status === 400) return 'CHECK STOP CODE AND ROUTE FILTERS.';
  if (error === 'upstream_auth_failed') return 'DIGITRANSIT AUTHENTICATION FAILED.';
  return 'HSL DATA UNAVAILABLE.';
};

export const initCurrentHsl = () => {
  const root = document.querySelector<HTMLElement>('[data-current-hsl]');
  if (!root || root.dataset.hslInitialized === 'true') return;
  root.dataset.hslInitialized = 'true';

  const form = root.querySelector<HTMLFormElement>('[data-hsl-form]');
  const stopInput = root.querySelector<HTMLInputElement>('[data-hsl-stop]');
  const routesInput = root.querySelector<HTMLInputElement>('[data-hsl-routes]');
  const submit = root.querySelector<HTMLButtonElement>('[data-hsl-submit]');
  const status = root.querySelector<HTMLElement>('[data-hsl-status]');
  const results = root.querySelector<HTMLElement>('[data-hsl-results]');
  const departuresTarget = root.querySelector<HTMLElement>('[data-hsl-departures]');
  const empty = root.querySelector<HTMLElement>('[data-hsl-empty]');
  const error = root.querySelector<HTMLElement>('[data-hsl-error]');

  if (!form || !stopInput || !routesInput || !submit || !status || !results || !departuresTarget || !empty || !error) {
    return;
  }

  let currentQuery: { stopCode: string; routes: string[] } | null = null;
  let latestData: HslResponse | null = null;
  let activeController: AbortController | null = null;
  let refreshTimer = 0;

  const render = (data: HslResponse) => {
    latestData = data;
    departuresTarget.replaceChildren();

    const liveCount = data.departures.filter((departure) => departure.realtime).length;
    status.textContent = `${data.stop.name} / ${data.stop.code} / ${liveCount} LIVE`;

    for (const departure of data.departures) {
      const row = document.createElement('div');
      row.className = 'hsl-departure';
      row.dataset.hslDeparture = '';

      const line = document.createElement('p');
      line.className = 'hsl-departure__line';
      line.textContent = departure.route;

      const destination = document.createElement('p');
      destination.className = 'hsl-departure__destination';
      destination.textContent = departure.headsign || 'Destination unavailable';

      const time = document.createElement('div');
      time.className = 'hsl-departure__time';

      const countdown = document.createElement('span');
      countdown.className = 'hsl-departure__countdown';
      countdown.dataset.hslCountdown = departure.departureAt;
      countdown.textContent = formatCountdown(departure.departureAt);

      const clock = document.createElement('span');
      clock.className = 'hsl-departure__clock';
      clock.textContent = formatClock(departure.departureAt);

      const delay = formatDelay(departure.delaySeconds);
      if (delay) {
        const delayTarget = document.createElement('span');
        delayTarget.className = 'hsl-departure__delay';
        delayTarget.textContent = delay;
        time.append(countdown, clock, delayTarget);
      } else {
        time.append(countdown, clock);
      }

      const realtime = document.createElement('p');
      realtime.className = departure.realtime
        ? 'hsl-departure__state hsl-departure__state--live'
        : 'hsl-departure__state';
      realtime.textContent = departure.realtime ? 'LIVE' : 'SCHED';

      row.append(line, destination, time, realtime);
      departuresTarget.append(row);
    }

    const hasDepartures = data.departures.length > 0;
    results.hidden = !hasDepartures;
    empty.hidden = hasDepartures;
    error.hidden = true;
  };

  const updateCountdowns = () => {
    if (!latestData) return;
    for (const target of root.querySelectorAll<HTMLElement>('[data-hsl-countdown]')) {
      const value = target.dataset.hslCountdown;
      if (value) target.textContent = formatCountdown(value);
    }
  };

  const requestDepartures = async (query: { stopCode: string; routes: string[] }) => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    submit.disabled = true;
    root.setAttribute('aria-busy', 'true');
    error.hidden = true;

    try {
      const response = await fetch('/api/current/hsl', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code = isRecord(payload) && typeof payload.error === 'string' ? payload.error : null;
        throw new Error(`${response.status}:${code ?? ''}`);
      }

      if (!isHslResponse(payload)) throw new Error('502:invalid_upstream_data');

      render(payload);
      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'hsl', at: payload.fetchedAt },
        })
      );
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      const [statusValue, code = ''] = message.split(':', 2);
      const statusCode = Number(statusValue);

      if (!latestData) {
        results.hidden = true;
        empty.hidden = true;
      }

      error.textContent = controller.signal.aborted
        ? 'HSL REQUEST TIMED OUT.'
        : errorMessage(Number.isFinite(statusCode) ? statusCode : 0, code || null);
      error.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      if (activeController === controller) activeController = null;
      submit.disabled = false;
      root.removeAttribute('aria-busy');
    }
  };

  const refresh = () => {
    if (!currentQuery || document.visibilityState !== 'visible') return;
    void requestDepartures(currentQuery);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const stopCode = stopInput.value.trim().toUpperCase();
    const routes = parseRoutes(routesInput.value);
    currentQuery = { stopCode, routes };
    latestData = null;
    status.textContent = 'FETCHING DEPARTURES';
    results.hidden = true;
    empty.hidden = true;
    error.hidden = true;
    void requestDepartures(currentQuery);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });

  refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
  window.setInterval(updateCountdowns, 10_000);

  window.addEventListener('pagehide', () => {
    activeController?.abort();
    window.clearInterval(refreshTimer);
  }, { once: true });
};
