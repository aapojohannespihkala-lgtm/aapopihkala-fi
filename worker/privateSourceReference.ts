import {
  PRIVATE_MODEL_PREFIX,
  verifyPrivateModelAccess,
  verifyPrivateModelPublisherAccess,
  verifyPrivateModelReadbackAccess,
  type PrivateModelEnv,
} from './privateModel';

export const PRIVATE_SOURCE_REFERENCE_PREFIX = `${PRIVATE_MODEL_PREFIX}/source-reference`;
export const PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX = `${PRIVATE_SOURCE_REFERENCE_PREFIX}/publish/`;
export const PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX = `${PRIVATE_SOURCE_REFERENCE_PREFIX}/verify/`;

export type PrivateSourceReference = {
  id: string;
  label: string;
  path: string;
  objectKey: string;
  expectedSize: number;
  expectedSha256: string;
  contentType: 'application/pdf';
};

export const PRIVATE_SOURCE_REFERENCES = [
  {
    id: 'm5a-drainman',
    label: 'Salaojapiirros Drainman.pdf',
    path: `${PRIVATE_SOURCE_REFERENCE_PREFIX}/m5a-drainman.pdf`,
    objectKey: 'source-reference/m5a-drainman.pdf',
    expectedSize: 1_132_069,
    expectedSha256: '963bcc1a3a1492a965a7842d8a409d062d8de091d4c8177cf7114c91b359a2c7',
    contentType: 'application/pdf',
  },
] as const satisfies readonly PrivateSourceReference[];

type PrivateSourceReferenceObject = {
  body: ReadableStream<Uint8Array> | null;
  size?: number;
  etag?: string;
  customMetadata?: Record<string, string>;
  writeHttpMetadata?: (headers: Headers) => void;
};

type PrivateSourceReferenceBucket = {
  get(key: string): Promise<PrivateSourceReferenceObject | null>;
  put(
    key: string,
    value: ArrayBuffer,
    options: {
      httpMetadata: {
        contentType: string;
        contentDisposition: string;
        cacheControl: string;
      };
      customMetadata: Record<string, string>;
    },
  ): Promise<PrivateSourceReferenceObject>;
};

const privateHeaders = () =>
  new Headers({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: privateHeaders(),
  });

const methodNotAllowed = (allow = 'GET, HEAD') => {
  const headers = privateHeaders();
  headers.set('Allow', allow);
  return new Response('Method not allowed', { status: 405, headers });
};

const privateJsonResponse = (request: Request, payload: unknown, status = 200) => {
  const body = JSON.stringify(payload);
  const headers = privateHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Content-Length', String(new TextEncoder().encode(body).byteLength));
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers,
  });
};

export const isPrivateSourceReferencePath = (pathname: string) =>
  pathname === PRIVATE_SOURCE_REFERENCE_PREFIX ||
  pathname.startsWith(`${PRIVATE_SOURCE_REFERENCE_PREFIX}/`);

export const getPrivateSourceReferenceById = (id: string) =>
  PRIVATE_SOURCE_REFERENCES.find((reference) => reference.id === id) ?? null;

export const getPrivateSourceReference = (pathname: string) =>
  PRIVATE_SOURCE_REFERENCES.find((reference) => reference.path === pathname) ?? null;

const referenceIdFromPdfPath = (pathname: string, prefix: string) => {
  if (!pathname.startsWith(prefix) || !pathname.endsWith('.pdf')) return null;
  const id = pathname.slice(prefix.length, -'.pdf'.length);
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  return id;
};

export const getPrivateSourceReferencePublishTarget = (pathname: string) => {
  const id = referenceIdFromPdfPath(pathname, PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX);
  return id ? getPrivateSourceReferenceById(id) : null;
};

export const getPrivateSourceReferenceVerifyTarget = (pathname: string) => {
  const id = referenceIdFromPdfPath(pathname, PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX);
  return id ? getPrivateSourceReferenceById(id) : null;
};

const sha256Hex = async (value: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const validatePrivateSourceReferenceBytes = async (
  bytes: ArrayBuffer,
  expected: Pick<PrivateSourceReference, 'expectedSize' | 'expectedSha256'>,
) => {
  if (bytes.byteLength !== expected.expectedSize) return 'source-size-mismatch' as const;
  const sha256 = await sha256Hex(bytes);
  if (sha256 !== expected.expectedSha256) return 'source-sha256-mismatch' as const;
  return null;
};

export const isPrivateSourceReferenceObjectValid = (
  object: { size?: number; customMetadata?: Record<string, string> },
  reference: PrivateSourceReference,
) =>
  object.size === reference.expectedSize &&
  object.customMetadata?.sha256?.trim().toLowerCase() === reference.expectedSha256;

type PrivateSourceReferenceWriteResult =
  | { ok: true; alreadyReady: boolean }
  | {
      ok: false;
      error:
        | 'source-content-type'
        | 'source-size-mismatch'
        | 'source-sha256-mismatch'
        | 'source-body-read-failed'
        | 'r2-write-failed'
        | 'r2-readback-failed';
      status: number;
    };

export const writePrivateSourceReferenceFromRequest = async (
  request: Request,
  bucket: PrivateSourceReferenceBucket,
  reference: PrivateSourceReference,
): Promise<PrivateSourceReferenceWriteResult> => {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== reference.contentType && contentType !== 'application/octet-stream') {
    return { ok: false, error: 'source-content-type', status: 415 };
  }

  const declaredLength = request.headers.get('Content-Length');
  if (
    declaredLength &&
    Number.isFinite(Number(declaredLength)) &&
    Number(declaredLength) !== reference.expectedSize
  ) {
    return { ok: false, error: 'source-size-mismatch', status: 422 };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await request.arrayBuffer();
  } catch {
    return { ok: false, error: 'source-body-read-failed', status: 400 };
  }

  const validationError = await validatePrivateSourceReferenceBytes(bytes, reference);
  if (validationError) return { ok: false, error: validationError, status: 422 };

  let existing: PrivateSourceReferenceObject | null;
  try {
    existing = await bucket.get(reference.objectKey);
  } catch {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }
  if (existing && isPrivateSourceReferenceObjectValid(existing, reference)) {
    return { ok: true, alreadyReady: true };
  }

  try {
    await bucket.put(reference.objectKey, bytes, {
      httpMetadata: {
        contentType: reference.contentType,
        contentDisposition: `inline; filename="${reference.id}.pdf"`,
        cacheControl: 'private, no-store',
      },
      customMetadata: {
        sha256: reference.expectedSha256,
      },
    });
  } catch {
    return { ok: false, error: 'r2-write-failed', status: 500 };
  }

  let written: PrivateSourceReferenceObject | null;
  try {
    written = await bucket.get(reference.objectKey);
  } catch {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }
  if (!written || !isPrivateSourceReferenceObjectValid(written, reference)) {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }

  return { ok: true, alreadyReady: false };
};

const sourceReferenceResponse = async (
  request: Request,
  bucket: PrivateSourceReferenceBucket,
  reference: PrivateSourceReference,
) => {
  const object = await bucket.get(reference.objectKey);
  if (!object || !isPrivateSourceReferenceObjectValid(object, reference)) return notFound();

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  headers.set('Content-Type', reference.contentType);
  headers.set('Content-Disposition', `inline; filename="${reference.id}.pdf"`);
  headers.set('Content-Length', String(reference.expectedSize));
  if (object.etag) headers.set('ETag', object.etag);

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers,
  });
};

const handlePrivateSourceReferencePublish = async (
  request: Request,
  env: PrivateModelEnv,
  reference: PrivateSourceReference,
) => {
  if (!(await verifyPrivateModelPublisherAccess(request, env))) return notFound();
  if (request.method !== 'PUT') return methodNotAllowed('PUT');

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateSourceReferenceBucket | undefined;
  if (!bucket) return notFound();

  const result = await writePrivateSourceReferenceFromRequest(request, bucket, reference);
  if (!result.ok) return privateJsonResponse(request, { error: result.error }, result.status);
  return privateJsonResponse(request, {
    reference: { id: reference.id, label: reference.label, path: reference.path },
    ready: true,
    published: !result.alreadyReady,
    alreadyReady: result.alreadyReady,
  });
};

const handlePrivateSourceReferenceReadback = async (
  request: Request,
  env: PrivateModelEnv,
  reference: PrivateSourceReference,
) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelReadbackAccess(request, env))) return notFound();

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateSourceReferenceBucket | undefined;
  if (!bucket) return notFound();
  return sourceReferenceResponse(request, bucket, reference);
};

export const handlePrivateSourceReferenceRequest = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  const pathname = new URL(request.url).pathname;

  const publishTarget = getPrivateSourceReferencePublishTarget(pathname);
  if (publishTarget) return handlePrivateSourceReferencePublish(request, env, publishTarget);

  const verifyTarget = getPrivateSourceReferenceVerifyTarget(pathname);
  if (verifyTarget) return handlePrivateSourceReferenceReadback(request, env, verifyTarget);

  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();

  const reference = getPrivateSourceReference(pathname);
  if (!reference) return notFound();

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateSourceReferenceBucket | undefined;
  if (!bucket) return notFound();
  return sourceReferenceResponse(request, bucket, reference);
};
