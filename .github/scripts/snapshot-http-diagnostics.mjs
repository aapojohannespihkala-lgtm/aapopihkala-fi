// Keep public Snapshot smoke diagnostics scoped to known endpoints and strip query strings.
export const snapshotEndpoint = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.hostname === 'aapopihkala.fi' && url.pathname.startsWith('/api/current/')) {
    return url.pathname;
  }
  if (url.hostname === 'api.open-meteo.com' && url.pathname === '/v1/forecast') {
    return 'api.open-meteo.com/v1/forecast';
  }
  return null;
};

export const snapshotResponseDiagnostic = (rawUrl, status, method = 'GET') => {
  const endpoint = snapshotEndpoint(rawUrl);
  if (!endpoint) return null;
  return { endpoint, method, httpStatus: status };
};

export const snapshotRequestFailureDiagnostic = (rawUrl, error, method = 'GET') => {
  const endpoint = snapshotEndpoint(rawUrl);
  if (!endpoint) return null;
  const networkError = typeof error === 'string'
    ? (error.match(/\bnet::[A-Z_]+/)?.[0] ?? 'request_failed')
    : 'request_failed';
  return { endpoint, method, networkError };
};
