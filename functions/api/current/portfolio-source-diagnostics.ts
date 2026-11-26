import { parseNordnetEmbeddedFund } from './portfolio-fund-recovery';

// Read-only and single-source probe. The existing strict live-smoke remains
// authoritative: diagnostics never turn an incomplete portfolio into success.
const FUNDS = {
  'handelsbanken-usa': {
    isin: 'SE0006800140', label: 'HANDELSBANKEN USA INDEKSI',
    url: 'https://www.nordnet.se/fonder/lista/handelsbanken-usa-index-a1-eur-348def3b',
  },
  'nordnet-finland': {
    isin: 'SE0005993102', label: 'NORDNET SUOMI INDEKSI',
    url: 'https://www.nordnet.fi/rahastot/lista/nordnet-suomi-indeksi-eur-a401761d',
  },
  'storebrand-japan': {
    isin: 'SE0013801479', label: 'STOREBRAND JAPAN A EUR',
    url: 'https://www.nordnet.fi/rahastot/lista/storebrand-japan-a-eur-dbe9644c',
  },
  'nordnet-sweden': {
    isin: 'SE0002756973', label: 'NORDNET SVERIGE INDEX',
    url: 'https://www.nordnet.se/fonder/lista/nordnet-sverige-index-sek-aa7a9014',
  },
  'spiltan-investmentbolag': {
    isin: 'SE0004297927', label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG',
    url: 'https://www.nordnet.se/fonder/lista/spiltan-aktiefond-investmentbolag-sek-d8fe1a7e',
  },
} as const;

export const diagnoseCurrentFundSource = async (
  id: string,
  requestSource: typeof fetch = fetch,
  timeoutMs = 6_000,
): Promise<Response> => {
  const spec = FUNDS[id as keyof typeof FUNDS];
  if (!spec) return Response.json({ error: 'invalid_fund' }, { status: 400 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };
  try {
    const response = await requestSource(spec.url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/json;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
      },
    });
    const length = Number(response.headers.get('content-length'));
    const common = {
      id, source: new URL(spec.url).hostname, httpStatus: response.status,
      elapsedMs: Date.now() - started,
      declaredBytes: Number.isFinite(length) && length > 0 ? length : null,
    };
    if (!response.ok || length > 2_000_000) {
      return Response.json({ ...common, parsed: false, reason: response.ok ? 'oversized' : 'http_error' }, { headers });
    }
    const text = await response.text();
    if (text.length > 2_000_000) {
      return Response.json({ ...common, parsed: false, reason: 'oversized' }, { headers });
    }
    const parsed = parseNordnetEmbeddedFund(text, { ...spec, id });
    return Response.json({
      ...common,
      receivedBytes: text.length,
      matchedIsin: text.includes(spec.isin),
      parsed: parsed !== null,
      observedAt: parsed?.observedAt ?? null,
      populatedPeriods: parsed ? Object.values(parsed.changes).filter(Number.isFinite).length : 0,
    }, { headers });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'unknown';
    return Response.json({
      id, source: new URL(spec.url).hostname,
      elapsedMs: Date.now() - started,
      parsed: false,
      reason: name === 'AbortError' ? 'timeout' : 'request_failed',
    }, { headers });
  } finally {
    clearTimeout(timer);
  }
};
