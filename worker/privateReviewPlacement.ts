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
      const source = await readNativeG2CurrentPlacementTargets(ports.getDocument);
      if (!source) return reply({ error: 'source-not-ready' }, 409);
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

    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 16000) return hidden();
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
  } catch {
    // Do not disclose Google tokens, private G2 text or upstream errors.
    return reply({ error: 'g2-unavailable' }, 503);
  }
};
