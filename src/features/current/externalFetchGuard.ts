const OPEN_METEO_ORIGIN = 'https://api.open-meteo.com';
const OPEN_METEO_FORECAST_PATH = '/v1/forecast';
const FALLBACK_BASE_URL = 'https://aapopihkala.fi/';

export const CURRENT_WEATHER_TIMEOUT_MS = 8_000;
// Snapshot composes several Current API feeds in one screen. Bound each browser request so one
// stalled edge response cannot leave the whole summary refreshing indefinitely.
export const CURRENT_SNAPSHOT_API_TIMEOUT_MS = 10_000;

type GuardedFetch = typeof fetch & {
  currentExternalFetchGuard?: true;
};

type CurrentFetchGuardOptions = {
  pageUrl?: string;
  weatherTimeoutMs?: number;
  snapshotApiTimeoutMs?: number;
};

const getRequestUrl = (input: RequestInfo | URL) =>
  input instanceof Request ? input.url : String(input);

const getUpstreamSignal = (input: RequestInfo | URL, init?: RequestInit) =>
  init?.signal ?? (input instanceof Request ? input.signal : undefined);

const getTimeoutLabel = (isWeatherRequest: boolean) =>
  isWeatherRequest ? 'Current weather request timed out' : 'Current Snapshot API request timed out';

export const fetchCurrentGuarded = async (
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
  options: CurrentFetchGuardOptions = {}
) => {
  const pageUrl = options.pageUrl ?? FALLBACK_BASE_URL;
  let url: URL;
  let page: URL;

  try {
    url = new URL(getRequestUrl(input), pageUrl);
    page = new URL(pageUrl, FALLBACK_BASE_URL);
  } catch {
    return fetchImpl(input, init);
  }

  const isCurrentWeatherRequest =
    url.origin === OPEN_METEO_ORIGIN &&
    url.pathname === OPEN_METEO_FORECAST_PATH;
  const isSnapshotApiRequest =
    page.pathname === '/current/snapshot/' &&
    url.origin === page.origin &&
    url.pathname.startsWith('/api/current/');

  if (!isCurrentWeatherRequest && !isSnapshotApiRequest) {
    return fetchImpl(input, init);
  }

  const timeoutMs = isCurrentWeatherRequest
    ? options.weatherTimeoutMs ?? CURRENT_WEATHER_TIMEOUT_MS
    : options.snapshotApiTimeoutMs ?? CURRENT_SNAPSHOT_API_TIMEOUT_MS;
  const controller = new AbortController();
  const upstreamSignal = getUpstreamSignal(input, init);
  const forwardAbort = () => controller.abort(upstreamSignal?.reason);

  if (upstreamSignal?.aborted) {
    controller.abort(upstreamSignal.reason);
  } else {
    upstreamSignal?.addEventListener('abort', forwardAbort, { once: true });
  }

  const timeout = setTimeout(
    () => controller.abort(new DOMException(getTimeoutLabel(isCurrentWeatherRequest), 'TimeoutError')),
    timeoutMs
  );

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener('abort', forwardAbort);
  }
};

export const fetchCurrentExternal = async (
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = CURRENT_WEATHER_TIMEOUT_MS
) =>
  fetchCurrentGuarded(fetchImpl, input, init, {
    weatherTimeoutMs: timeoutMs,
  });

export const installCurrentExternalFetchGuard = () => {
  const currentFetch = window.fetch as GuardedFetch;
  if (currentFetch.currentExternalFetchGuard) return;

  const fetchImpl = currentFetch.bind(window);
  const guardedFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    fetchCurrentGuarded(fetchImpl, input, init, {
      pageUrl: window.location.href,
    })) as GuardedFetch;

  guardedFetch.currentExternalFetchGuard = true;
  window.fetch = guardedFetch;
};
