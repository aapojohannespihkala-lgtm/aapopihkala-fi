import {
  verifyPrivateModelAccess,
  verifyPrivateModelPublisherAccess,
  verifyPrivateModelReadbackAccess,
  type PrivateModelEnv,
} from './privateModel';

export const PRIVATE_AI_STATUS_DATA_PATH = '/private-model/status/data.json';
export const PRIVATE_AI_STATUS_PUBLISH_PATH = '/private-model/work-test/publish/ai-status.json';
export const PRIVATE_AI_STATUS_VERIFY_PATH = '/private-model/work-test/verify/ai-status.json';
const PRIVATE_AI_STATUS_OBJECT_KEY = 'status/ai-status.json';
const PRIVATE_AI_STATUS_MAX_BYTES = 64 * 1024;
const HANDOFF_DOCUMENT_ID = '1MmJdjTZSUXiDS308bLNasdenyPJeXXZe4otwxHX62Go';

type AiStatusObject = {
  body: ReadableStream<Uint8Array> | null;
  size?: number;
  etag?: string;
  writeHttpMetadata?: (headers: Headers) => void;
};

type AiStatusBucket = {
  get(key: string): Promise<AiStatusObject | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options: {
      httpMetadata: {
        contentType: string;
        contentDisposition: string;
        cacheControl: string;
      };
      customMetadata: Record<string, string>;
    },
  ): Promise<unknown>;
};

export type PrivateAiStatusPayload = {
  version: 1;
  generatedAt: string;
  source: {
    documentId: string;
    modifiedTime: string;
    version: string;
  };
  summary: {
    activePackages: number;
    activeLines: number;
    passesToday: number;
  };
  active: Array<{
    id: string;
    lane: string;
    laneCode: string;
    title: string;
    goal: string;
    state: 'CLAIMED' | 'ACTIVE';
    updatedAt: string;
  }>;
  recent: Array<{
    time: string;
    state: 'PASS' | 'CLAIM' | 'CHECKPOINT';
    lane: string;
    title: string;
    detail: string;
  }>;
  humanAction: {
    title: string;
    detail: string;
  } | null;
};

const privateHeaders = () =>
  new Headers({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: privateHeaders(),
  });

const methodNotAllowed = (allow: string) => {
  const headers = privateHeaders();
  headers.set('Allow', allow);
  return new Response('Method not allowed', { status: 405, headers });
};

const jsonError = (error: string, status: number) => {
  const headers = privateHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return Response.json({ error }, { status, headers });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBoundedString = (value: unknown, max = 600) =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

const isIsoDate = (value: unknown) =>
  isBoundedString(value, 64) && Number.isFinite(Date.parse(value));

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

const validActiveEntry = (value: unknown) => {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ['id', 'lane', 'laneCode', 'title', 'goal', 'state', 'updatedAt'])) {
    return false;
  }
  return (
    isBoundedString(value.id, 180) &&
    isBoundedString(value.lane, 120) &&
    isBoundedString(value.laneCode, 120) &&
    isBoundedString(value.title, 320) &&
    isBoundedString(value.goal, 600) &&
    (value.state === 'CLAIMED' || value.state === 'ACTIVE') &&
    isIsoDate(value.updatedAt)
  );
};

const validRecentEntry = (value: unknown) => {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ['time', 'state', 'lane', 'title', 'detail'])) return false;
  return (
    isIsoDate(value.time) &&
    (value.state === 'PASS' || value.state === 'CLAIM' || value.state === 'CHECKPOINT') &&
    isBoundedString(value.lane, 120) &&
    isBoundedString(value.title, 320) &&
    typeof value.detail === 'string' &&
    value.detail.length <= 600
  );
};

export const validatePrivateAiStatusPayload = (
  value: unknown,
): value is PrivateAiStatusPayload => {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ['version', 'generatedAt', 'source', 'summary', 'active', 'recent', 'humanAction'])) {
    return false;
  }
  if (value.version !== 1 || !isIsoDate(value.generatedAt)) return false;

  const source = value.source;
  if (!isRecord(source) || !hasOnlyKeys(source, ['documentId', 'modifiedTime', 'version'])) return false;
  if (
    source.documentId !== HANDOFF_DOCUMENT_ID ||
    !isIsoDate(source.modifiedTime) ||
    !isBoundedString(source.version, 64)
  ) {
    return false;
  }

  const summary = value.summary;
  if (!isRecord(summary) || !hasOnlyKeys(summary, ['activePackages', 'activeLines', 'passesToday'])) {
    return false;
  }
  for (const key of ['activePackages', 'activeLines', 'passesToday'] as const) {
    const number = summary[key];
    if (!Number.isInteger(number) || (number as number) < 0 || (number as number) > 9999) return false;
  }

  if (!Array.isArray(value.active) || value.active.length > 32 || !value.active.every(validActiveEntry)) {
    return false;
  }
  if (!Array.isArray(value.recent) || value.recent.length > 30 || !value.recent.every(validRecentEntry)) {
    return false;
  }

  if (value.humanAction !== null) {
    if (!isRecord(value.humanAction) || !hasOnlyKeys(value.humanAction, ['title', 'detail'])) return false;
    if (
      !isBoundedString(value.humanAction.title, 160) ||
      !isBoundedString(value.humanAction.detail, 600)
    ) {
      return false;
    }
  }

  return true;
};

export const isPrivateAiStatusPath = (pathname: string) =>
  pathname === PRIVATE_AI_STATUS_DATA_PATH ||
  pathname === PRIVATE_AI_STATUS_PUBLISH_PATH ||
  pathname === PRIVATE_AI_STATUS_VERIFY_PATH;

const serveStoredStatus = async (
  request: Request,
  bucket: AiStatusBucket,
): Promise<Response> => {
  let object: AiStatusObject | null;
  try {
    object = await bucket.get(PRIVATE_AI_STATUS_OBJECT_KEY);
  } catch {
    return notFound();
  }
  if (!object) return notFound();

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Content-Disposition', 'inline');
  if (typeof object.size === 'number') headers.set('Content-Length', String(object.size));
  if (object.etag) headers.set('ETag', object.etag);

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers,
  });
};

const publishStatus = async (
  request: Request,
  bucket: AiStatusBucket,
): Promise<Response> => {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') return jsonError('content-type', 415);

  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > PRIVATE_AI_STATUS_MAX_BYTES) {
    return jsonError('payload-too-large', 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return jsonError('body-read-failed', 400);
  }
  if (new TextEncoder().encode(raw).byteLength > PRIVATE_AI_STATUS_MAX_BYTES) {
    return jsonError('payload-too-large', 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return jsonError('invalid-json', 400);
  }
  if (!validatePrivateAiStatusPayload(payload)) return jsonError('invalid-status-payload', 422);

  const canonical = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(canonical);
  try {
    await bucket.put(PRIVATE_AI_STATUS_OBJECT_KEY, bytes, {
      httpMetadata: {
        contentType: 'application/json; charset=utf-8',
        contentDisposition: 'inline',
        cacheControl: 'private, no-store',
      },
      customMetadata: {
        generatedAt: payload.generatedAt,
        sourceVersion: payload.source.version,
      },
    });
  } catch {
    return jsonError('r2-write-failed', 500);
  }

  return Response.json(
    {
      ready: true,
      generatedAt: payload.generatedAt,
      sourceVersion: payload.source.version,
    },
    { headers: privateHeaders() },
  );
};

export const handlePrivateAiStatusRequest = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  const pathname = new URL(request.url).pathname;
  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as AiStatusBucket | undefined;

  if (pathname === PRIVATE_AI_STATUS_PUBLISH_PATH) {
    if (!(await verifyPrivateModelPublisherAccess(request, env))) return notFound();
    if (request.method !== 'PUT') return methodNotAllowed('PUT');
    if (!bucket?.put) return notFound();
    return publishStatus(request, bucket);
  }

  if (pathname === PRIVATE_AI_STATUS_VERIFY_PATH) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed('GET, HEAD');
    if (!(await verifyPrivateModelReadbackAccess(request, env))) return notFound();
    if (!bucket) return notFound();
    return serveStoredStatus(request, bucket);
  }

  if (pathname === PRIVATE_AI_STATUS_DATA_PATH) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed('GET, HEAD');
    if (!(await verifyPrivateModelAccess(request, env))) return notFound();
    if (!bucket) return notFound();
    return serveStoredStatus(request, bucket);
  }

  return notFound();
};
