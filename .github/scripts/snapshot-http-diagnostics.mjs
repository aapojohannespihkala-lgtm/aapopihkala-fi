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

// A LIVE DATA / OK label is not enough if the browser observed source or JS failures.
export const snapshotBrowserReady = ({ status, failures, httpResponses }) =>
  status === 'LIVE DATA / OK' &&
  Array.isArray(failures) && failures.length === 0 &&
  Array.isArray(httpResponses) &&
  httpResponses.every((response) => Number.isInteger(response?.httpStatus) && response.httpStatus < 500);

export const widgetBrowserResponseFailure = (rawUrl, status, method = 'GET') => {
  const diagnostic = snapshotResponseDiagnostic(rawUrl, status, method);
  return diagnostic?.endpoint === '/api/current/widget-v2' && status >= 500 ? diagnostic : null;
};

export const widgetBrowserRequestFailure = (rawUrl, error, method = 'GET') => {
  const diagnostic = snapshotRequestFailureDiagnostic(rawUrl, error, method);
  return diagnostic?.endpoint === '/api/current/widget-v2' ? diagnostic : null;
};

// Only count actual, visible cards with a nonempty primary value. DOM nodes alone are not proof of rendering.
export const widgetBrowserRenderableSections = (sections) => {
  if (!Array.isArray(sections)) return [];
  const ids = new Set();
  for (const section of sections) {
    if (!section || typeof section.id !== 'string' || !section.id.trim() ||
        section.visible !== true || typeof section.primary !== 'string' ||
        !section.primary.trim()) continue;
    ids.add(section.id);
  }
  return [...ids];
};

// A stale fallback is usable but degraded, never a fresh production success.
export const widgetBrowserReady = ({ loadState, sections, unavailable, failures }) =>
  loadState === 'ready' &&
  unavailable === false &&
  Array.isArray(sections) && sections.length >= 4 &&
  Array.isArray(failures) && failures.length === 0;

// The API can return HTTP 200 with cached data. Reject stale or hollow production payloads.
export const widgetV2ProductionPayloadError = (payload, nowMs = Date.now()) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'invalid_payload';
  if (payload.schemaVersion !== 2 || payload.channel !== 'prod') return 'invalid_schema_or_channel';

  const generatedAtMs = typeof payload.generatedAt === 'string'
    ? Date.parse(payload.generatedAt) : NaN;
  const ageMs = nowMs - generatedAtMs;
  if (!Number.isFinite(ageMs) || ageMs < -120_000 || ageMs > 600_000) {
    return 'invalid_or_stale_generated_at';
  }

  if (!Array.isArray(payload.sections) || payload.sections.length < 4) return 'incomplete_sections';
  const ids = new Set();
  for (const section of payload.sections) {
    if (!section || typeof section !== 'object' ||
        typeof section.id !== 'string' || !section.id.trim() ||
        typeof section.label !== 'string' || !section.label.trim() ||
        typeof section.primary !== 'string' || !section.primary.trim() ||
        ids.has(section.id)) return 'invalid_sections';
    ids.add(section.id);
  }

  // A healthy 200 must render four distinct, known sections in every layout.
  const renderableIds = new Set(['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga']);
  for (const layout of ['compact', 'medium', 'large']) {
    const layoutIds = payload.layouts?.[layout];
    if (!Array.isArray(layoutIds) || new Set(layoutIds).size !== layoutIds.length ||
        layoutIds.filter((id) => renderableIds.has(id) && ids.has(id)).length < 4) {
      return 'invalid_layouts';
    }
  }
  return null;
};
