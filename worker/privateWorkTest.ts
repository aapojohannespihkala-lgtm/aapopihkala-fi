import {
  PRIVATE_MODEL_PREFIX,
  verifyPrivateModelAccess,
  type PrivateModelEnv,
} from './privateModel';

const PRIVATE_WORK_TEST_PREFIX = `${PRIVATE_MODEL_PREFIX}/work-test`;
export const PRIVATE_WORK_TEST_CATALOG_PATH = `${PRIVATE_WORK_TEST_PREFIX}/catalog.json`;

export type PrivateWorkTestCandidate = {
  id: string;
  label: string;
  path: string;
  objectKey: string;
  expectedSize: number;
  expectedSha256: string;
};

export const PRIVATE_WORK_TEST_CANDIDATES = [
  {
    id: 'p136b-d-current-wall-corrected',
    label: 'p136B - D current wall corrected',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p136b-d-current-wall-corrected.glb`,
    objectKey: 'work-test/p136b-d-current-wall-corrected.glb',
    expectedSize: 1_149_768,
    expectedSha256: '8a0f78f3f150f43fda65c93f9536594fe72d7713a6a6a946191e00b61cc4f4bf',
  },
] as const satisfies readonly PrivateWorkTestCandidate[];

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

const methodNotAllowed = () => {
  const headers = privateHeaders();
  headers.set('Allow', 'GET, HEAD');
  return new Response('Method not allowed', { status: 405, headers });
};

const privateJsonResponse = (request: Request, payload: unknown) => {
  const body = JSON.stringify(payload);
  const headers = privateHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Content-Length', String(new TextEncoder().encode(body).byteLength));
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers,
  });
};

export const isPrivateWorkTestPath = (pathname: string) =>
  pathname === PRIVATE_WORK_TEST_PREFIX || pathname.startsWith(`${PRIVATE_WORK_TEST_PREFIX}/`);

export const getPrivateWorkTestCandidate = (pathname: string) =>
  PRIVATE_WORK_TEST_CANDIDATES.find((candidate) => candidate.path === pathname) ?? null;

export const isPrivateWorkTestObjectValid = (
  object: { size?: number; customMetadata?: Record<string, string> },
  candidate: PrivateWorkTestCandidate,
) =>
  object.size === candidate.expectedSize &&
  object.customMetadata?.sha256?.trim().toLowerCase() === candidate.expectedSha256;

export const handlePrivateWorkTestRequest = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();

  const bucket = env.PRIVATE_MODEL_BUCKET;
  if (!bucket) {
    console.info('private-model work-test deny: bucket-binding');
    return notFound();
  }

  const pathname = new URL(request.url).pathname;

  if (pathname === PRIVATE_WORK_TEST_CATALOG_PATH) {
    const candidates = [];

    for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
      const object = await bucket.get(candidate.objectKey);
      const identity = object as
        | ({ size?: number; customMetadata?: Record<string, string> } & typeof object)
        | null;
      if (!identity || !isPrivateWorkTestObjectValid(identity, candidate)) continue;

      candidates.push({
        id: candidate.id,
        label: candidate.label,
        path: candidate.path,
      });
    }

    return privateJsonResponse(request, { candidates });
  }

  const candidate = getPrivateWorkTestCandidate(pathname);
  if (!candidate) return notFound();

  const object = await bucket.get(candidate.objectKey);
  const identity = object as
    | ({ size?: number; customMetadata?: Record<string, string> } & typeof object)
    | null;

  if (!object || !identity || !isPrivateWorkTestObjectValid(identity, candidate)) {
    console.info('private-model work-test deny: candidate-not-ready');
    return notFound();
  }

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  headers.set('Content-Type', 'model/gltf-binary');
  headers.set('Content-Disposition', 'inline');
  headers.set('Content-Length', String(candidate.expectedSize));
  if (object.etag) headers.set('ETag', object.etag);

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers,
  });
};
