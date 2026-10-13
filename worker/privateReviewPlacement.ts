import {
  verifyPrivateModelAccess,
  type PrivateModelEnv,
} from './privateModel';
import {
  createNativeG2GoogleDocsPorts,
} from '../src/scripts/privateModelReviewPlacementG2GoogleDocs';
import {
  createNativeG2PlacementPersistenceAdapter,
} from '../src/scripts/privateModelReviewPlacementG2Persistence';
import {
  readNativeG2CurrentPlacementTargets,
} from '../src/scripts/privateModelReviewPlacementG2CurrentCombined';
import { p137EG2ReadinessFailureCodes } from '../src/scripts/privateModelP137EG2WorkerClient.mjs';
import type {
  PlacementReviewHandoff,
} from '../src/scripts/privateModelReviewPlacementDraft';

/**
 * Dormant P137E transport for the EXISTING native G2 document.
 *
 * Activation requires all three independent gates:
 * 1. A deliberately configured server-only release flag after review approval.
 * 2. A verified Cloudflare Access JWT for this private model application.
 * 3. A server-held, G2-scoped Google service account.
 *
 * This route must never become a client-side document proxy or a way to
 * upgrade WORK_TEST observations into CURRENT, canonical or as-built geometry.
 */
export type PrivatePlacementReviewEnv = Pick<
  PrivateModelEnv,
  'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_AUD'
> & {
  P137E_G2_REVIEW_RELEASE_ENABLED?: string;
  P137E_G2_SERVICE_ACCOUNT_EMAIL?: string;
  P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM?: string;
};

const PREFIX = '/private-model/review-placement/g2';
const TARGETS = PREFIX + '/targets';
const OBSERVATIONS = PREFIX + '/observations';
const RECORD_ID = /^P137E_G2_[A-Za-z0-9_-]{12,64}$/;
const readinessFailureCodes = new Set<string>(p137EG2ReadinessFailureCodes);

export const isPrivatePlacementReviewPath = (pathname: string) =>
  pathname === TARGETS ||
  pathname === OBSERVATIONS ||
  pathname.startsWith(OBSERVATIONS + '/');

const headers = () => new Headers({
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Content-Type': 'application/json; charset=utf-8',
});

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: headers() });

const hidden = () => reply({ error: 'not-found' }, 404);

const isConfigured = (env: PrivatePlacementReviewEnv) =>
  env.P137E_G2_REVIEW_RELEASE_ENABLED === 'true' &&
  typeof env.P137E_G2_SERVICE_ACCOUNT_EMAIL === 'string' &&
  env.P137E_G2_SERVICE_ACCOUNT_EMAIL.length > 0 &&
  typeof env.P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM === 'string' &&
  env.P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM.length > 0;

/** Read no more than the existing 16 kB POST budget, including chunked requests
 * with no Content-Length. Bound both bytes and read time, including stalled streams.
 */
export const readBoundedPlacementRequest = async (
  request: Request,
  maxBytes = 16000,
  timeoutMs = 5000,
): Promise<string | null> => {
  if (
    !request.body || maxBytes !== 16000 ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 5000
  ) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks: string[] = [];
  let size = 0;
  let completed = false;
  const deadlineAt = Date.now() + timeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    while (true) {
      // Also check elapsed time when empty chunks keep the microtask queue busy.
      const remainingMs = deadlineAt - Date.now();
      if (remainingMs <= 0) return null;
      const next = await Promise.race([
        reader.read(),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), remainingMs);
        }),
      ]);
      clearTimeout(timer);
      if (next === null) return null;
      if (next.done) {
        completed = true;
        chunks.push(decoder.decode());
        return chunks.join('');
      }
      if (!(next.value instanceof Uint8Array)) return null;
      size += next.value.byteLength;
      if (size > maxBytes) return null;
      chunks.push(decoder.decode(next.value, { stream: true }));
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    // Cancellation is best effort: an untrusted source may never acknowledge it.
    if (!completed) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

/**
 * This cannot be enabled by URL, an uploaded JSON record or localStorage.
 * No Google OAuth credential is returned to the browser, even on failure.
 */
export const handlePrivatePlacementReviewRequest = async (
  request: Request,
  env: PrivatePlacementReviewEnv,
): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!isPrivatePlacementReviewPath(path) || !isConfigured(env)) return hidden();
  if (!(await verifyPrivateModelAccess(request, env))) return hidden();
  if (url.search || url.hash) return hidden();

  const isTargets = path === TARGETS;
  const isCreate = path === OBSERVATIONS;
  const recordId = !isTargets && !isCreate && path.startsWith(OBSERVATIONS + '/')
    ? path.slice(OBSERVATIONS.length + 1) : null;
  if (recordId !== null && !RECORD_ID.test(recordId)) return hidden();

  const allowedMethod = isCreate ? 'POST' : 'GET';
  if (request.method !== allowedMethod) {
    const h = headers();
    h.set('Allow', allowedMethod);
    return new Response(JSON.stringify({ error: 'method-not-allowed' }), { status: 405, headers: h });
  }

  if (isCreate) {
    // Cloudflare Access authentication alone is not a CSRF defence.
    // Require an exact same-origin JSON request and bounded body.
    if (
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
    ) return hidden();
    const sizeHeader = Number(request.headers.get('Content-Length') ?? '0');
    if (!Number.isFinite(sizeHeader) || sizeHeader > 16000 || sizeHeader < 0) return hidden();
  }

  const ports = createNativeG2GoogleDocsPorts({
    credentials: {
      clientEmail: env.P137E_G2_SERVICE_ACCOUNT_EMAIL!,
      privateKeyPem: env.P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM!,
    },
  });
  const adapter = createNativeG2PlacementPersistenceAdapter(ports);

  try {
    if (isTargets) {
      // Read outside the projector's intentional null-on-read-error boundary.
      // This keeps OAuth/Docs failures distinct from an invalid current source.
      const document = await ports.getDocument();
      if (!document) return reply({ error: 'source-not-ready', failureCode: 'G2_NATIVE_DOCUMENT_INVALID' }, 409);
      const source = await readNativeG2CurrentPlacementTargets(async () => document);
      if (!source) return reply({ error: 'source-not-ready', failureCode: 'G2_CURRENT_SOURCE_NOT_READY' }, 409);
      return reply({
        status: 'WORK_TEST_TARGETS_ONLY',
        documentRevision: source.revisionId,
        targets: source.targets.map((target) => ({
          targetId: target.reviewTargetId,
          apartment: target.apartment,
          floor: target.floor,
          coordinateFrame: target.coordinateFrame,
          approvedWallHosts: [],
          exactXY: false,
          currentGeometry: false,
          canonical: false,
          asBuilt: false,
        })),
      });
    }
    if (recordId !== null) {
      const record = await adapter.readback(recordId);
      if (!record) return hidden();
      return reply({ recordId: record.recordId, payload: record.payload });
    }

    const text = await readBoundedPlacementRequest(request);
    if (text === null) return hidden();
    let submitted: unknown;
    try {
      submitted = JSON.parse(text);
    } catch {
      return hidden();
    }
    // The adapter independently reconstructs this against a fresh native G2
    // revision. Never trust the browser's claimed target, wall host or flags.
    const payload = (submitted as { payload?: unknown } | null)?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return hidden();
    const receipt = await adapter.persist(payload as PlacementReviewHandoff);
    const readback = await adapter.readback(receipt.recordId);
    if (!readback) return reply({ error: 'readback-failed' }, 503);
    return reply({ receipt, readback });
  } catch (error) {
    // Do not disclose Google tokens, private G2 text or upstream errors.
    if (isTargets) {
      const code = error instanceof Error && readinessFailureCodes.has(error.message)
        ? error.message : 'G2_NATIVE_UNAVAILABLE';
      return reply({ error: 'g2-unavailable', failureCode: code }, 503);
    }
    return reply({ error: 'g2-unavailable' }, 503);
  }
};
