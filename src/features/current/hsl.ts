import {
  updateHslGpsPassageState,
  type HslGpsPassageState,
} from './hsl-passage-state';

type HslVehicle = {
  id: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  bearing: number | null;
  speedKmh: number | null;
  updatedAt: string | null;
  currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
};

type HslModelPrediction = {
  predictedAt: string;
  adjustmentSeconds: number;
  confidenceSeconds: number | null;
  sampleSize: number;
  method: 'hsl-residual' | 'gps-history' | 'hsl-residual+gps-history';
};

type HslDeparture = {
  route: string;
  headsign: string;
  scheduledAt: string;
  departureAt: string;
  delaySeconds: number;
  realtime: boolean;
  realtimeState: string;
  vehicle: HslVehicle | null;
  model?: HslModelPrediction | null;
};

type HslLearningSummary = {
  enabled: true;
  version: string;
  observations: number;
  arrivals: number;
  scoredTrips: number;
  modelScoredTrips: number;
  hslMaeSeconds: number | null;
  modelMaeSeconds: number | null;
  modelWins: number;
  lastArrivalAt: string | null;
};

type HslResponse = {
  source: string;
  vehicleSource?: string;
  fetchedAt: string;
  stop: {
    code: string;
    name: string;
  };
  routes: string[];
  departures: HslDeparture[];
  learning?: HslLearningSummary;
};

type VisibleDeparture = {
  departure: HslDeparture;
  previous: boolean;
};

const REFRESH_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 8_000;
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const DEFAULT_QUERY = {
  stopCode: 'E3239',
  stopName: 'Ylisrinne',
  routes: ['121', '125'],
} as const;
const MAX_PREVIOUS_DEPARTURES = 2;
const MAX_UPCOMING_DEPARTURES = 6;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isNullableNumber = (value: unknown) => value === null || typeof value === 'number';

const isHslVehicle = (value: unknown): value is HslVehicle => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    isNullableNumber(value.distanceMeters) &&
    isNullableNumber(value.bearing) &&
    isNullableNumber(value.speedKmh) &&
    (value.updatedAt === null || typeof value.updatedAt === 'string') &&
    (value.currentStatus === 'INCOMING_AT' ||
      value.currentStatus === 'STOPPED_AT' ||
      value.currentStatus === 'IN_TRANSIT_TO')
  );
};

const isHslModelPrediction = (value: unknown): value is HslModelPrediction => {
  if (!isRecord(value)) return false;
  return (
    typeof value.predictedAt === 'string' &&
    typeof value.adjustmentSeconds === 'number' &&
    isNullableNumber(value.confidenceSeconds) &&
    typeof value.sampleSize === 'number' &&
    (value.method === 'hsl-residual' ||
      value.method === 'gps-history' ||
      value.method === 'hsl-residual+gps-history')
  );
};

const isHslLearningSummary = (value: unknown): value is HslLearningSummary => {
  if (!isRecord(value) || value.enabled !== true) return false;
  return (
    typeof value.version === 'string' &&
    typeof value.observations === 'number' &&
    typeof value.arrivals === 'number' &&
    typeof value.scoredTrips === 'number' &&
    typeof value.modelScoredTrips === 'number' &&
    isNullableNumber(value.hslMaeSeconds) &&
    isNullableNumber(value.modelMaeSeconds) &&
    typeof value.modelWins === 'number' &&
    (value.lastArrivalAt === null || typeof value.lastArrivalAt === 'string')
  );
};

const isHslResponse = (value: unknown): value is HslResponse => {
  if (!isRecord(value) || !isRecord(value.stop) || !Array.isArray(value.departures)) return false;
  if (typeof value.fetchedAt !== 'string') return false;
  if (typeof value.stop.code !== 'string' || typeof value.stop.name !== 'string') return false;
  if (value.learning !== undefined && !isHslLearningSummary(value.learning)) return false;

  return value.departures.every((departure) => {
    if (!isRecord(departure)) return false;
    return (
      typeof departure.route === 'string' &&
      typeof departure.headsign === 'string' &&
      typeof departure.scheduledAt === 'string' &&
      typeof departure.departureAt === 'string' &&
      typeof departure.delaySeconds === 'number' &&
      typeof departure.realtime === 'boolean' &&
      typeof departure.realtimeState === 'string' &&
      (departure.vehicle === null || isHslVehicle(departure.vehicle)) &&
      (departure.model === undefined || departure.model === null || isHslModelPrediction(departure.model))
    );
  });
};

const timestampOf = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

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
  const timestamp = timestampOf(value);
  if (timestamp === null) return '--';

  const deltaMs = timestamp - Date.now();
  if (deltaMs > 0) return `${Math.ceil(deltaMs / 60_000)} MIN`;
  if (deltaMs > -30_000) return 'NOW';

  return `${Math.max(1, Math.ceil(Math.abs(deltaMs) / 60_000))} MIN AGO`;
};

const formatDelay = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes === 0) return '';
  return `${minutes > 0 ? '+' : ''}${minutes} MIN`;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} M`;
  if (meters < 10_000) return `${(meters / 1000).toFixed(1)} KM`;
  return `${Math.round(meters / 1000)} KM`;
};

const formatVehicleAge = (value: string | null) => {
  if (!value) return '';
  const timestamp = timestampOf(value);
  if (timestamp === null) return '';
  return `${Math.max(0, Math.floor((Date.now() - timestamp) / 1000))} S`;
};

const formatVehicleSummary = (vehicle: HslVehicle) => {
  const parts = ['GPS'];
  if (vehicle.distanceMeters !== null) {
    parts.push(
      vehicle.currentStatus === 'STOPPED_AT' && vehicle.distanceMeters <= 120
        ? 'AT STOP'
        : `${formatDistance(vehicle.distanceMeters)} AWAY`
    );
  }
  if (vehicle.currentStatus === 'STOPPED_AT') {
    parts.push('STOPPED');
  } else if (vehicle.speedKmh !== null && vehicle.speedKmh >= 1) {
    parts.push(`${Math.round(vehicle.speedKmh)} KM/H`);
  }
  return parts.join(' / ');
};

const formatConfidence = (seconds: number | null) => {
  if (seconds === null) return '';
  if (seconds < 60) return '±<1 MIN';
  return `±${Math.max(1, Math.round(seconds / 60))} MIN`;
};

const formatMae = (seconds: number | null) =>
  seconds === null ? '--' : `${(seconds / 60).toFixed(1)} MIN`;

const passageKey = (departure: HslDeparture) =>
  `${departure.route}|${departure.scheduledAt}|${departure.vehicle?.id ?? ''}`;

const updateGpsPassageStates = (
  departures: HslDeparture[],
  states: Map<string, HslGpsPassageState>
) => {
  const activeKeys = new Set<string>();

  for (const departure of departures) {
    if (!departure.vehicle) continue;
    const key = passageKey(departure);
    activeKeys.add(key);
    const next = updateHslGpsPassageState(states.get(key), {
      distanceMeters: departure.vehicle.distanceMeters,
      updatedAt: departure.vehicle.updatedAt,
    });
    if (next) states.set(key, next);
  }

  for (const key of states.keys()) {
    if (!activeKeys.has(key)) states.delete(key);
  }
};

const isPreviousDeparture = (
  departure: HslDeparture,
  now: number,
  gpsPassageStates: Map<string, HslGpsPassageState>
) => {
  if (departure.vehicle) {
    return gpsPassageStates.get(passageKey(departure))?.passed === true;
  }

  const effectiveTime = timestampOf(departure.realtime ? departure.departureAt : departure.scheduledAt);
  return effectiveTime !== null && effectiveTime < now;
};

const selectVisibleDepartures = (
  departures: HslDeparture[],
  gpsPassageStates: Map<string, HslGpsPassageState>
): VisibleDeparture[] => {
  const now = Date.now();
  updateGpsPassageStates(departures, gpsPassageStates);

  const sorted = departures
    .map((departure) => ({ departure, scheduledTime: timestampOf(departure.scheduledAt) }))
    .filter(
      (entry): entry is { departure: HslDeparture; scheduledTime: number } =>
        entry.scheduledTime !== null
    )
    .sort((a, b) => a.scheduledTime - b.scheduledTime);

  const previous = sorted
    .filter(({ departure }) => isPreviousDeparture(departure, now, gpsPassageStates))
    .slice(-MAX_PREVIOUS_DEPARTURES)
    .map(({ departure }) => ({ departure, previous: true }));

  const upcoming = sorted
    .filter(({ departure }) => !isPreviousDeparture(departure, now, gpsPassageStates))
    .slice(0, MAX_UPCOMING_DEPARTURES)
    .map(({ departure }) => ({ departure, previous: false }));

  return [...previous, ...upcoming];
};

const errorMessage = (status: number, error: string | null) => {
  if (status === 503 || error === 'missing_configuration') return 'DIGITRANSIT API KEY NOT CONFIGURED.';
  if (status === 404 || error === 'stop_not_found') return 'YLISRINNE E3239 NOT FOUND.';
  if (error === 'upstream_auth_failed') return 'DIGITRANSIT AUTHENTICATION FAILED.';
  return 'HSL DATA UNAVAILABLE.';
};

export const initCurrentHsl = () => {
  const root = document.querySelector<HTMLElement>('[data-current-hsl]');
  if (!root || root.dataset.hslInitialized === 'true') return;
  root.dataset.hslInitialized = 'true';

  const status = root.querySelector<HTMLElement>('[data-hsl-status]');
  const results = root.querySelector<HTMLElement>('[data-hsl-results]');
  const departuresTarget = root.querySelector<HTMLElement>('[data-hsl-departures]');
  const empty = root.querySelector<HTMLElement>('[data-hsl-empty]');
  const error = root.querySelector<HTMLElement>('[data-hsl-error]');
  const learningPanel = root.querySelector<HTMLElement>('[data-hsl-learning]');
  const learningState = root.querySelector<HTMLElement>('[data-hsl-learning-state]');
  const learningArrivals = root.querySelector<HTMLElement>('[data-hsl-learning-arrivals]');
  const learningHslMae = root.querySelector<HTMLElement>('[data-hsl-learning-hsl-mae]');
  const learningModelMae = root.querySelector<HTMLElement>('[data-hsl-learning-model-mae]');
  const learningWins = root.querySelector<HTMLElement>('[data-hsl-learning-wins]');
  const learningMeta = root.querySelector<HTMLElement>('[data-hsl-learning-meta]');

  if (!status || !results || !departuresTarget || !empty || !error) return;

  const currentQuery = {
    stopCode: DEFAULT_QUERY.stopCode,
    stopName: DEFAULT_QUERY.stopName,
    routes: [...DEFAULT_QUERY.routes],
  };
  const gpsPassageStates = new Map<string, HslGpsPassageState>();
  let latestData: HslResponse | null = null;
  let activeController: AbortController | null = null;
  let refreshTimer = 0;

  const renderLearning = (learning: HslLearningSummary | undefined) => {
    if (
      !learningPanel ||
      !learningState ||
      !learningArrivals ||
      !learningHslMae ||
      !learningModelMae ||
      !learningWins ||
      !learningMeta
    ) {
      return;
    }

    if (!learning) {
      learningPanel.hidden = true;
      return;
    }

    learningPanel.hidden = false;
    learningState.textContent = learning.modelScoredTrips >= 5 ? 'COMPARING' : 'LEARNING';
    learningArrivals.textContent = String(learning.arrivals);
    learningHslMae.textContent = formatMae(learning.hslMaeSeconds);
    learningModelMae.textContent = formatMae(learning.modelMaeSeconds);
    learningWins.textContent =
      learning.modelScoredTrips > 0
        ? `${learning.modelWins} / ${learning.modelScoredTrips}`
        : '--';
    learningMeta.textContent = `${learning.version.toUpperCase()} / ${learning.observations} OBS / 5 MIN SCORE WINDOW`;
  };

  const render = (data: HslResponse) => {
    latestData = data;
    departuresTarget.replaceChildren();

    const visibleDepartures = selectVisibleDepartures(data.departures, gpsPassageStates);
    const previousCount = visibleDepartures.filter(({ previous }) => previous).length;
    const liveCount = visibleDepartures.filter(({ departure }) => departure.realtime).length;
    const gpsCount = visibleDepartures.filter(({ departure }) => departure.vehicle !== null).length;
    const modelCount = visibleDepartures.filter(({ departure }) => departure.model != null).length;
    status.textContent = `${data.stop.name} / ${data.stop.code} / ${previousCount} PREV / ${liveCount} LIVE / ${gpsCount} GPS${modelCount > 0 ? ` / ${modelCount} AAPO` : ''}`;

    let upcomingStarted = false;

    for (const { departure, previous } of visibleDepartures) {
      const row = document.createElement('div');
      row.className = previous ? 'hsl-departure hsl-departure--previous' : 'hsl-departure';
      row.dataset.hslDeparture = '';
      row.dataset.hslPrevious = String(previous);

      if (!previous && !upcomingStarted && previousCount > 0) {
        row.classList.add('hsl-departure--first-upcoming');
        upcomingStarted = true;
      }

      const line = document.createElement('p');
      line.className = 'hsl-departure__line';
      line.textContent = departure.route;

      const destinationWrap = document.createElement('div');
      destinationWrap.className = 'hsl-departure__destination-wrap';

      const destination = document.createElement('p');
      destination.className = 'hsl-departure__destination';
      destination.textContent = departure.headsign || 'Destination unavailable';
      destinationWrap.append(destination);

      if (departure.vehicle) {
        const vehicle = document.createElement('p');
        vehicle.className = 'hsl-departure__vehicle';
        vehicle.textContent = formatVehicleSummary(departure.vehicle);
        destinationWrap.append(vehicle);
      }

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

      if (departure.model) {
        const modelRow = document.createElement('span');
        modelRow.className = 'hsl-departure__model';

        const modelCountdown = document.createElement('span');
        modelCountdown.dataset.hslModelCountdown = departure.model.predictedAt;
        modelCountdown.textContent = `AAPO ${formatCountdown(departure.model.predictedAt)}`;

        const modelMeta = document.createElement('span');
        const confidence = formatConfidence(departure.model.confidenceSeconds);
        modelMeta.textContent = `${confidence ? `${confidence} / ` : ''}N${departure.model.sampleSize}`;

        modelRow.append(modelCountdown, modelMeta);
        time.append(modelRow);
      }

      const stateWrap = document.createElement('div');
      stateWrap.className = 'hsl-departure__state-wrap';

      const realtime = document.createElement('p');
      realtime.className = departure.vehicle || departure.realtime
        ? 'hsl-departure__state hsl-departure__state--live'
        : 'hsl-departure__state';
      realtime.textContent = departure.vehicle ? 'GPS' : departure.realtime ? 'LIVE' : 'SCHED';
      stateWrap.append(realtime);

      if (departure.vehicle?.updatedAt) {
        const age = document.createElement('span');
        age.className = 'hsl-departure__state-age';
        age.dataset.hslVehicleAge = departure.vehicle.updatedAt;
        age.textContent = formatVehicleAge(departure.vehicle.updatedAt);
        stateWrap.append(age);
      }

      row.append(line, destinationWrap, time, stateWrap);
      departuresTarget.append(row);
    }

    renderLearning(data.learning);
    const hasDepartures = visibleDepartures.length > 0;
    results.hidden = !hasDepartures;
    empty.hidden = hasDepartures;
    error.hidden = true;
  };

  const updateRelativeTimes = () => {
    if (!latestData) return;
    for (const target of root.querySelectorAll<HTMLElement>('[data-hsl-countdown]')) {
      const value = target.dataset.hslCountdown;
      if (value) target.textContent = formatCountdown(value);
    }
    for (const target of root.querySelectorAll<HTMLElement>('[data-hsl-model-countdown]')) {
      const value = target.dataset.hslModelCountdown;
      if (value) target.textContent = `AAPO ${formatCountdown(value)}`;
    }
    for (const target of root.querySelectorAll<HTMLElement>('[data-hsl-vehicle-age]')) {
      const value = target.dataset.hslVehicleAge;
      if (value) target.textContent = formatVehicleAge(value);
    }
  };

  const requestDepartures = async () => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    root.setAttribute('aria-busy', 'true');
    error.hidden = true;

    try {
      const response = await fetch('/api/current/hsl', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentQuery),
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
      root.removeAttribute('aria-busy');
    }
  };

  const refresh = () => {
    if (document.visibilityState !== 'visible') return;
    void requestDepartures();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });

  status.textContent = 'YLISRINNE / E3239 / FETCHING';
  void requestDepartures();
  refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
  window.setInterval(updateRelativeTimes, 5_000);

  window.addEventListener('pagehide', () => {
    activeController?.abort();
    window.clearInterval(refreshTimer);
  }, { once: true });
};
