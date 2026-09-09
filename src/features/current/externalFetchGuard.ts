const OPEN_METEO_ORIGIN = 'https://api.open-meteo.com';

export const CURRENT_WEATHER_TIMEOUT_MS = 8_000;

type GuardedFetch = typeof fetch & {
  currentExternalFetchGuard?: true;
};

const getRequestUrl = (input: RequestInfo | URL) =>
  input instanceof Request ? input.url : String(input);

export const fetchCurrentExternal = async (
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = CURRENT_WEATHER_TIMEOUT_MS
) => {
  let url: URL;

  try {
    url = new URL(getRequestUrl(input), window.location.href);
  } catch {
    return fetchImpl(input, init);
  }

  if (url.origin !== OPEN_METEO_ORIGIN || init?.signal) {
    return fetchImpl(input, init);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
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
