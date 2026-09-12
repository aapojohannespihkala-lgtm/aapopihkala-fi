const OPEN_METEO_ORIGIN = 'https://api.open-meteo.com';
const OPEN_METEO_FORECAST_PATH = '/v1/forecast';
const FALLBACK_BASE_URL = 'https://aapopihkala.fi/';

export const CURRENT_WEATHER_TIMEOUT_MS = 8_000;
// Snapshot prioritizes visible value completeness. Keep the browser deadline long enough for one
// bounded server-side completeness retry while still preventing a stalled edge response forever.
export const CURRENT_SNAPSHOT_API_TIMEOUT_MS = 13_000;
export const CURRENT_SNAPSHOT_FAILURE_RETRY_MS = 30_000;

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
    const response = await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
    // fetch() resolves when headers arrive, so keep the deadline active until the body is readable.
    if (response.body) await response.clone().arrayBuffer();
    return response;
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

const installSnapshotFailureRecovery = () => {
  if (window.location.pathname !== '/current/snapshot/') return;

  const setup = () => {
    const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
    const status = root?.querySelector<HTMLElement>('[data-snapshot-status]');
    const refreshButton = root?.querySelector<HTMLButtonElement>('[data-snapshot-refresh]');
    if (!root || !status || !refreshButton) return;

    let retryTimer = 0;

    const clearRetry = () => {
      window.clearTimeout(retryTimer);
      retryTimer = 0;
    };

    const scheduleRetry = () => {
      clearRetry();
      const value = status.textContent?.trim() ?? '';
      const degraded =
        value === 'LIVE DATA / UNAVAILABLE' || /^LIVE DATA \/ \d+ OF \d+ SOURCES$/.test(value);
      if (!degraded) return;

      retryTimer = window.setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          scheduleRetry();
          return;
        }
        refreshButton.click();
      }, CURRENT_SNAPSHOT_FAILURE_RETRY_MS);
    };

    const observer = new MutationObserver(scheduleRetry);
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    scheduleRetry();

    window.addEventListener(
      'pagehide',
      () => {
        clearRetry();
        observer.disconnect();
      },
      { once: true }
    );
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
};

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
  installSnapshotFailureRecovery();
};
