const OPEN_METEO_ORIGIN = 'https://api.open-meteo.com';
const OPEN_METEO_FORECAST_PATH = '/v1/forecast';
const FALLBACK_BASE_URL = 'https://aapopihkala.fi/';

export const CURRENT_WEATHER_TIMEOUT_MS = 8_000;

type GuardedFetch = typeof fetch & {
  currentExternalFetchGuard?: true;
};

const getRequestUrl = (input: RequestInfo | URL) =>
  input instanceof Request ? input.url : String(input);

const getUpstreamSignal = (input: RequestInfo | URL, init?: RequestInit) =>
  init?.signal ?? (input instanceof Request ? input.signal : undefined);

export const fetchCurrentExternal = async (
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = CURRENT_WEATHER_TIMEOUT_MS
) => {
  let url: URL;

  try {
    url = new URL(getRequestUrl(input), FALLBACK_BASE_URL);
  } catch {
    return fetchImpl(input, init);
  }

  const isCurrentWeatherRequest =
    url.origin === OPEN_METEO_ORIGIN &&
    url.pathname === OPEN_METEO_FORECAST_PATH;

  if (!isCurrentWeatherRequest) {
    return fetchImpl(input, init);
  }

  const controller = new AbortController();
  const upstreamSignal = getUpstreamSignal(input, init);
  const forwardAbort = () => controller.abort(upstreamSignal?.reason);

  if (upstreamSignal?.aborted) {
    controller.abort(upstreamSignal.reason);
  } else {
    upstreamSignal?.addEventListener('abort', forwardAbort, { once: true });
  }

  const timeout = setTimeout(
    () => controller.abort(new DOMException('Current weather request timed out', 'TimeoutError')),
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

export const installCurrentExternalFetchGuard = () => {
  const currentFetch = window.fetch as GuardedFetch;
  if (currentFetch.currentExternalFetchGuard) return;

  const fetchImpl = currentFetch.bind(window);
  const guardedFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    fetchCurrentExternal(fetchImpl, input, init)) as GuardedFetch;

  guardedFetch.currentExternalFetchGuard = true;
  window.fetch = guardedFetch;
};
