/**
 * Unreleased P137E WORK_TEST client for the EXISTING native G2 Worker route.
 * Not wired into the viewer: the client gate defaults to false, and independent
 * server release/Cloudflare Access/G2 credentials gates remain mandatory.
 */
const BASE = '/private-model/review-placement/g2';
const RECORD_ID = /^P137E_G2_[A-Za-z0-9_-]{12,64}$/;
const REQUEST_LIMIT = 16000;
const RESPONSE_LIMIT = 32768;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// Reject promotion tokens at any depth, not just in the top-level envelope.
// Target identity/current-installation provenance is not a geometry promotion.
const noPromotionBooleanKeys = new Set([
  'currentGeometry', 'currentGeometryClaim', 'canonical', 'Canonical',
  'asBuilt', 'asBuiltClaim', 'publishToCURRENT', 'exactXY', 'exactXYClaim',
  'exactZClaim', 'physicalElevationClaim', 'exactSlopeClaim',
  'surveyGeometryClaim', 'surveyExactClaim',
]);
const noNestedPromotion = (value, seen = new WeakSet(), depth = 0) => {
  if (depth > 24) return false;
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (noPromotionBooleanKeys.has(key) && child !== false) return false;
    if ((key === 'humanReview' || key === 'humanReviewStatus') &&
        child !== 'NOT_RUN') return false;
    if (key === 'stage' && child !== 'WORK_TEST_ONLY') return false;
    // A string status must not smuggle approval or publication into a
    // WORK_TEST observation, even when all top-level flags are false.
    if ((key === 'status' || key === 'reviewStatus' ||
         key === 'approvalStatus') && typeof child === 'string' &&
        /^(?:CURRENT|CANONICAL|AS[_-]?BUILT|PUBLISHED|PRODUCTION|APPROVED|HUMAN_REVIEW_PASS(?:_SCOPED)?|READY_FOR_HUMAN_REVIEW)$/i.test(child)) {
      return false;
    }
    if (!noNestedPromotion(child, seen, depth + 1)) return false;
  }
  seen.delete(value);
  return true;
};
const isWorkTest = p => object(p) &&
  p.kind === 'P137E_G2_REVIEW_OBSERVATION' &&
  p.stage === 'WORK_TEST_ONLY' && object(p.anchor) &&
  object(p.observation) && object(p.resolution) &&
  p.persisted === false && p.humanReview === 'NOT_RUN' &&
  p.currentGeometry === false && p.canonical === false && p.asBuilt === false &&
  noNestedPromotion(p);
const ordered = value => Array.isArray(value) ? value.map(ordered) :
  object(value) ? Object.fromEntries(Object.keys(value).sort()
    .map(k => [k, ordered(value[k])])) : value;
const sameJson = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));

async function boundedJson(response) {
  if (!response?.ok) throw new Error('P137E_G2_UNAVAILABLE');
  if (response.redirected) throw new Error('P137E_G2_REDIRECT_REJECTED');
  const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (mime !== 'application/json') throw new Error('P137E_G2_RESPONSE_TYPE_INVALID');
  const len = response.headers.get('content-length');
  if (len !== null && (!/^\d+$/.test(len) || Number(len) > RESPONSE_LIMIT)) {
    throw new Error('P137E_G2_RESPONSE_TOO_LARGE');
  }
  if (!response.body) throw new Error('P137E_G2_RESPONSE_EMPTY');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks = [];
  let bytes = 0, completed = false;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) {
        chunks.push(decoder.decode());
        completed = true;
        break;
      }
      if (!(next.value instanceof Uint8Array)) throw new Error('P137E_G2_RESPONSE_INVALID');
      bytes += next.value.byteLength;
      if (bytes > RESPONSE_LIMIT) throw new Error('P137E_G2_RESPONSE_TOO_LARGE');
      chunks.push(decoder.decode(next.value, { stream: true }));
    }
  } finally {
    if (!completed) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  try { return JSON.parse(chunks.join('')); }
  catch { throw new Error('P137E_G2_RESPONSE_INVALID'); }
}

/**
 * User-interface releases must never substitute for the server's own gates.
 * A missing canReview is intentionally dormant, not approval to call the Worker.
 * @param {{
 *   origin?: string,
 *   canReview?: () => boolean,
 *   fetcher?: (url: string, options: RequestInit) => Promise<Response>
 * }} [config]
 */
export function createP137EG2WorkerClient({
  origin, canReview = () => false, fetcher = globalThis.fetch,
} = {}) {
  if (typeof origin !== 'string' || typeof canReview !== 'function' ||
      typeof fetcher !== 'function') throw new Error('P137E_G2_CLIENT_CONFIG_INVALID');
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.pathname !== '/' || base.search ||
      base.hash || base.username || base.password || base.origin !== origin ||
      (typeof globalThis.location?.origin === 'string' && globalThis.location.origin !== origin)) {
    throw new Error('P137E_G2_CLIENT_ORIGIN_INVALID');
  }
  const request = async (suffix, method = 'GET', payload) => {
    if (canReview() !== true) throw new Error('P137E_G2_REVIEW_NOT_RELEASED');
    const url = new URL(BASE + suffix, base);
    if (url.origin !== base.origin) throw new Error('P137E_G2_CROSS_ORIGIN');
    const body = payload === undefined ? undefined : JSON.stringify({ payload });
    if (body !== undefined && new TextEncoder().encode(body).byteLength > REQUEST_LIMIT) {
      throw new Error('P137E_G2_REQUEST_TOO_LARGE');
    }
    const response = await fetcher(url.toString(), {
      method, credentials: 'same-origin', mode: 'same-origin',
      cache: 'no-store', redirect: 'error',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body }),
    });
    return boundedJson(response);
  };
  return Object.freeze({
    async targets() {
      const reply = await request('/targets');
      if (reply?.status !== 'WORK_TEST_TARGETS_ONLY' ||
          typeof reply.documentRevision !== 'string' || !reply.documentRevision ||
          !Array.isArray(reply.targets) || !reply.targets.every(t =>
            object(t) && typeof t.targetId === 'string' &&
            t.targetId.length > 0 && t.targetId === t.targetId.trim() &&
            Array.isArray(t.approvedWallHosts) && t.approvedWallHosts.length === 0 &&
            t.currentGeometry === false && t.canonical === false &&
            t.asBuilt === false && t.exactXY === false &&
            // Server target rows, not only observation POST/GET payloads,
            // must reject nested promotion and premature approval claims.
            noNestedPromotion(t)) ||
          // One row per native-G2 source identity: duplicate review targets
          // must never become ambiguous selectable options in the viewer.
          new Set(reply.targets.map(t => t.targetId)).size !== reply.targets.length) {
        throw new Error('P137E_G2_TARGET_EVIDENCE_INVALID');
      }
      return reply;
    },
    async persist(payload) {
      if (!isWorkTest(payload)) throw new Error('P137E_G2_PROMOTION_REJECTED');
      const reply = await request('/observations', 'POST', payload);
      if (reply?.receipt?.status !== 'PERSISTED_TO_EXISTING_G2' ||
          typeof reply.receipt.recordId !== 'string' ||
          !RECORD_ID.test(reply.receipt.recordId) ||
          reply.readback?.recordId !== reply.receipt.recordId ||
          !isWorkTest(reply.readback.payload) ||
          !sameJson(reply.readback.payload, payload)) {
        throw new Error('P137E_G2_DURABLE_READBACK_INVALID');
      }
      // The POST's embedded readback is only an echo from the same response.
      // Prove durability using a separate authenticated GET on the exact record.
      const persisted = await request(
        '/observations/' + encodeURIComponent(reply.receipt.recordId),
      );
      if (persisted?.recordId !== reply.receipt.recordId ||
          !isWorkTest(persisted.payload) ||
          !sameJson(persisted.payload, payload)) {
        throw new Error('P137E_G2_DURABLE_READBACK_INVALID');
      }
      return reply.receipt;
    },
    async readback(recordId) {
      if (typeof recordId !== 'string' || !RECORD_ID.test(recordId)) {
        throw new Error('P137E_G2_RECORD_ID_INVALID');
      }
      const reply = await request('/observations/' + encodeURIComponent(recordId));
      if (reply?.recordId !== recordId || !isWorkTest(reply.payload)) {
        throw new Error('P137E_G2_DURABLE_READBACK_INVALID');
      }
      return reply;
    },
  });
}
