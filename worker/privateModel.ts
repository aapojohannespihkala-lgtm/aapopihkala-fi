type AssetsBinding = { fetch(request: Request): Promise<Response> };

type PrivateModelObject = {
  body: ReadableStream<Uint8Array> | null;
  size?: number;
  etag?: string;
  customMetadata?: Record<string, string>;
  writeHttpMetadata?: (headers: Headers) => void;
};

type PrivateModelBucket = {
  get(key: string): Promise<PrivateModelObject | null>;
  put?(
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
  ): Promise<PrivateModelObject>;
};

export type PrivateModelEnv = {
  ASSETS: AssetsBinding;
  PRIVATE_MODEL_BUCKET?: PrivateModelBucket;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_PUBLISHER_AUD?: string;
  CF_ACCESS_PUBLISHER_COMMON_NAME?: string;
  CF_ACCESS_READBACK_AUD?: string;
  CF_ACCESS_READBACK_COMMON_NAME?: string;
};

export const PRIVATE_MODEL_PREFIX = '/private-model';
const PRIVATE_MODEL_PATH = `${PRIVATE_MODEL_PREFIX}/model.glb`;
export const PRIVATE_MODEL_PUBLISH_PATH = `${PRIVATE_MODEL_PREFIX}/publish/model.glb`;
export const PRIVATE_MODEL_VERIFY_PATH = `${PRIVATE_MODEL_PREFIX}/verify/model.glb`;
export const PRIVATE_MODEL_MACHINE_PUBLISH_PATH =
  `${PRIVATE_MODEL_PREFIX}/work-test/publish/current-model.glb`;
export const PRIVATE_MODEL_MACHINE_VERIFY_PATH =
  `${PRIVATE_MODEL_PREFIX}/work-test/verify/current-model.glb`;
const PRIVATE_MODEL_OBJECT_KEY = 'model.glb';
const ACCESS_HEADER = 'cf-access-jwt-assertion';
const JWKS_TTL_MS = 5 * 60 * 1000;

type JwtHeader = { alg?: string; kid?: string };
type JwtPayload = {
  type?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  common_name?: string;
};

type CachedJwks = {
  origin: string;
  expiresAt: number;
  keys: Array<JsonWebKey & { kid?: string }>;
};

let cachedJwks: CachedJwks | undefined;

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

const methodNotAllowed = (allow = 'GET, HEAD') => {
  const headers = privateHeaders();
  headers.set('Allow', allow);
  return new Response('Method not allowed', { status: 405, headers });
};

const privateJsonResponse = (payload: unknown, status = 200) => {
  const body = JSON.stringify(payload);
  const headers = privateHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Content-Length', String(new TextEncoder().encode(body).byteLength));
  return new Response(body, { status, headers });
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const decodeJsonSegment = <T>(value: string): T =>
  JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;

const normalizeTeamDomain = (value: string | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!url.hostname.endsWith('.cloudflareaccess.com')) return null;
    if (url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
};

const audienceMatches = (claim: JwtPayload['aud'], expected: string) =>
  typeof claim === 'string' ? claim === expected : Array.isArray(claim) && claim.includes(expected);

const fetchJwks = async (teamOrigin: string) => {
  const now = Date.now();
  if (cachedJwks && cachedJwks.origin === teamOrigin && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }

  const response = await fetch(`${teamOrigin}/cdn-cgi/access/certs`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  if (!Array.isArray(payload.keys) || payload.keys.length === 0) return null;

  cachedJwks = {
    origin: teamOrigin,
    expiresAt: now + JWKS_TTL_MS,
    keys: payload.keys,
  };
  return payload.keys;
};

const denyAccess = (reason: string) => {
  console.info(`private-model auth deny: ${reason}`);
  return false;
};

const verifyPrivateModelAccessToken = async (
  request: Request,
  teamDomain: string | undefined,
  audienceValue: string | undefined,
  payloadGuard?: (payload: JwtPayload) => string | null,
) => {
  const teamOrigin = normalizeTeamDomain(teamDomain);
  const audience = audienceValue?.trim();
  const token = request.headers.get(ACCESS_HEADER);

  if (!teamOrigin) return denyAccess('team-domain-config');
  if (!audience) return denyAccess('audience-config');
  if (!token) return denyAccess('jwt-missing');

  const parts = token.split('.');
  if (parts.length !== 3) return denyAccess('jwt-shape');

  try {
    const header = decodeJsonSegment<JwtHeader>(parts[0]);
    const payload = decodeJsonSegment<JwtPayload>(parts[1]);

    if (header.alg !== 'RS256') return denyAccess('jwt-alg');
    if (!header.kid) return denyAccess('jwt-kid');
    if (payload.iss !== teamOrigin) return denyAccess('jwt-issuer');
    if (!audienceMatches(payload.aud, audience)) return denyAccess('jwt-audience');

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) return denyAccess('jwt-expired');
    if (typeof payload.nbf === 'number' && payload.nbf > now) return denyAccess('jwt-not-before');

    const keys = await fetchJwks(teamOrigin);
    if (!keys) return denyAccess('jwks-fetch');

    const jwk = keys.find((candidate) => candidate.kid === header.kid);
    if (!jwk) return denyAccess('jwks-kid');

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = decodeBase64Url(parts[2]);
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      signedData,
    );
    if (!verified) return denyAccess('jwt-signature');

    const payloadError = payloadGuard?.(payload);
    return payloadError ? denyAccess(payloadError) : true;
  } catch {
    return denyAccess('jwt-exception');
  }
};

export const verifyPrivateModelAccess = async (
  request: Request,
  env: Pick<PrivateModelEnv, 'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_AUD'>,
) =>
  verifyPrivateModelAccessToken(
    request,
    env.CF_ACCESS_TEAM_DOMAIN,
    env.CF_ACCESS_AUD,
  );

const privateModelServiceTokenClaimError = (
  payload: Pick<JwtPayload, 'type' | 'sub' | 'common_name'>,
  expectedCommonName: string,
  role: 'publisher' | 'readback',
) => {
  if (payload.type !== 'app') return `${role}-token-type`;
  if (payload.sub !== '') return `${role}-token-sub`;
  if (payload.common_name !== expectedCommonName) return `${role}-common-name`;
  return null;
};

export const privateModelPublisherClaimError = (
  payload: Pick<JwtPayload, 'type' | 'sub' | 'common_name'>,
  expectedCommonName: string,
) => privateModelServiceTokenClaimError(payload, expectedCommonName, 'publisher');

export const privateModelReadbackClaimError = (
  payload: Pick<JwtPayload, 'type' | 'sub' | 'common_name'>,
  expectedCommonName: string,
) => privateModelServiceTokenClaimError(payload, expectedCommonName, 'readback');

export const verifyPrivateModelPublisherAccess = async (
  request: Request,
  env: Pick<
    PrivateModelEnv,
    'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_PUBLISHER_AUD' | 'CF_ACCESS_PUBLISHER_COMMON_NAME'
  >,
) => {
  const publisherAudience = env.CF_ACCESS_PUBLISHER_AUD?.trim();
  const publisherCommonName = env.CF_ACCESS_PUBLISHER_COMMON_NAME?.trim();
  if (!publisherAudience) return denyAccess('publisher-audience-config');
  if (!publisherCommonName) return denyAccess('publisher-common-name-config');

  return verifyPrivateModelAccessToken(
    request,
    env.CF_ACCESS_TEAM_DOMAIN,
    publisherAudience,
    (payload) => privateModelPublisherClaimError(payload, publisherCommonName),
  );
};

export const verifyPrivateModelReadbackAccess = async (
  request: Request,
  env: Pick<
    PrivateModelEnv,
    'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_READBACK_AUD' | 'CF_ACCESS_READBACK_COMMON_NAME'
  >,
) => {
  const readbackAudience = env.CF_ACCESS_READBACK_AUD?.trim();
  const readbackCommonName = env.CF_ACCESS_READBACK_COMMON_NAME?.trim();
  if (!readbackAudience) return denyAccess('readback-audience-config');
  if (!readbackCommonName) return denyAccess('readback-common-name-config');

  return verifyPrivateModelAccessToken(
    request,
    env.CF_ACCESS_TEAM_DOMAIN,
    readbackAudience,
    (payload) => privateModelReadbackClaimError(payload, readbackCommonName),
  );
};

export const isPrivateCurrentModelMachinePath = (pathname: string) =>
  pathname === PRIVATE_MODEL_MACHINE_PUBLISH_PATH || pathname === PRIVATE_MODEL_MACHINE_VERIFY_PATH;

export const isPrivateModelPath = (pathname: string) =>
  pathname === PRIVATE_MODEL_PREFIX || pathname.startsWith(`${PRIVATE_MODEL_PREFIX}/`);

const sha256Hex = async (value: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

type PrivateCurrentModelValidation =
  | { ok: true; size: number; sha256: string }
  | { ok: false; error: string };

export const validatePrivateCurrentModelCandidateBytes = async (
  bytes: ArrayBuffer,
): Promise<PrivateCurrentModelValidation> => {
  if (bytes.byteLength < 20) return { ok: false, error: 'current-glb-too-small' };

  const view = new DataView(bytes);
  const magic = new TextDecoder().decode(new Uint8Array(bytes, 0, 4));
  if (magic !== 'glTF') return { ok: false, error: 'current-glb-magic' };
  if (view.getUint32(4, true) !== 2) return { ok: false, error: 'current-glb-version' };
  if (view.getUint32(8, true) !== bytes.byteLength) {
    return { ok: false, error: 'current-glb-length' };
  }

  const jsonLength = view.getUint32(12, true);
  const jsonType = view.getUint32(16, true);
  if (jsonType !== 0x4e4f534a || 20 + jsonLength > bytes.byteLength) {
    return { ok: false, error: 'current-glb-json-chunk' };
  }

  let payload: {
    scene?: number;
    scenes?: Array<{ extras?: Record<string, unknown> }>;
  };
  try {
    const jsonText = new TextDecoder()
      .decode(new Uint8Array(bytes, 20, jsonLength))
      .replace(/[\u0000 ]+$/g, '');
    payload = JSON.parse(jsonText) as typeof payload;
  } catch {
    return { ok: false, error: 'current-glb-json-parse' };
  }

  if (!Number.isInteger(payload.scene) || !Array.isArray(payload.scenes)) {
    return { ok: false, error: 'current-glb-default-scene' };
  }
  const scene = payload.scenes[payload.scene as number];
  const extras = scene?.extras;
  if (!extras) return { ok: false, error: 'current-candidate-extras' };

  const required = {
    ModelStage: 'CURRENT_CANDIDATE',
    currentCandidate: true,
    currentDistribution: false,
    Canonical: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
    objectLevelNoPromotionPreserved: true,
    normalOpeningMode: 'WHOLE_BUILDING_FREE_ORBIT',
  } as const;
  for (const [key, expected] of Object.entries(required)) {
    if (extras[key] !== expected) return { ok: false, error: `current-candidate-${key}` };
  }

  return {
    ok: true,
    size: bytes.byteLength,
    sha256: await sha256Hex(bytes),
  };
};

type PrivateCurrentModelWriteResult =
  | { ok: true; size: number; sha256: string }
  | { ok: false; error: string; status: number };

const writePrivateCurrentModelFromRequest = async (
  request: Request,
  bucket: PrivateModelBucket,
): Promise<PrivateCurrentModelWriteResult> => {
  let bytes: ArrayBuffer;
  try {
    bytes = await request.arrayBuffer();
  } catch {
    return { ok: false, error: 'current-body-read-failed', status: 400 };
  }

  const validation = await validatePrivateCurrentModelCandidateBytes(bytes);
  if (!validation.ok) return { ok: false, error: validation.error, status: 422 };
  if (!bucket.put) return { ok: false, error: 'current-r2-write-unavailable', status: 500 };

  try {
    await bucket.put(PRIVATE_MODEL_OBJECT_KEY, bytes, {
      httpMetadata: {
        contentType: 'model/gltf-binary',
        contentDisposition: 'inline',
        cacheControl: 'private, no-store',
      },
      customMetadata: {
        sha256: validation.sha256,
        modelStage: 'CURRENT_CANDIDATE',
      },
    });
  } catch {
    return { ok: false, error: 'current-r2-write-failed', status: 500 };
  }

  let written: PrivateModelObject | null;
  try {
    written = await bucket.get(PRIVATE_MODEL_OBJECT_KEY);
  } catch {
    return { ok: false, error: 'current-r2-readback-failed', status: 500 };
  }
  if (
    !written ||
    written.size !== validation.size ||
    written.customMetadata?.sha256 !== validation.sha256
  ) {
    return { ok: false, error: 'current-r2-readback-failed', status: 500 };
  }

  return { ok: true, size: validation.size, sha256: validation.sha256 };
};

const handlePrivateCurrentModelPublish = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  if (!(await verifyPrivateModelPublisherAccess(request, env))) return notFound();
  if (request.method !== 'PUT') return methodNotAllowed('PUT');
  if (!env.PRIVATE_MODEL_BUCKET) {
    console.info('private-model current publish deny: bucket-binding');
    return notFound();
  }

  const result = await writePrivateCurrentModelFromRequest(request, env.PRIVATE_MODEL_BUCKET);
  if (!result.ok) return privateJsonResponse({ error: result.error }, result.status);
  return privateJsonResponse({
    ready: true,
    model: {
      path: PRIVATE_MODEL_PATH,
      size: result.size,
      sha256: result.sha256,
    },
  });
};

const handlePrivateCurrentModelMachineReadback = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelReadbackAccess(request, env))) return notFound();
  if (!env.PRIVATE_MODEL_BUCKET) {
    console.info('private-model current verify deny: bucket-binding');
    return notFound();
  }

  const object = await env.PRIVATE_MODEL_BUCKET.get(PRIVATE_MODEL_OBJECT_KEY);
  const sha256 = object?.customMetadata?.sha256;
  if (!object || typeof object.size !== 'number' || !sha256) {
    console.info('private-model current verify deny: object-not-ready');
    return notFound();
  }

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  headers.set('Content-Type', 'model/gltf-binary');
  headers.set('Content-Disposition', 'inline');
  headers.set('Content-Length', String(object.size));
  headers.set('X-Content-SHA256', sha256);
  if (object.etag) headers.set('ETag', object.etag);

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers,
  });
};

const secureAssetResponse = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (headers.get('Content-Type')?.includes('text/html')) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const handlePrivateModelRequest = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  const pathname = new URL(request.url).pathname;
  if (pathname === PRIVATE_MODEL_PUBLISH_PATH || pathname === PRIVATE_MODEL_MACHINE_PUBLISH_PATH) {
    return handlePrivateCurrentModelPublish(request, env);
  }
  if (pathname === PRIVATE_MODEL_VERIFY_PATH || pathname === PRIVATE_MODEL_MACHINE_VERIFY_PATH) {
    return handlePrivateCurrentModelMachineReadback(request, env);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();

  if (pathname === PRIVATE_MODEL_PATH) {
    if (!env.PRIVATE_MODEL_BUCKET) {
      console.info('private-model r2 deny: bucket-binding');
      return notFound();
    }

    const object = await env.PRIVATE_MODEL_BUCKET.get(PRIVATE_MODEL_OBJECT_KEY);
    if (!object) {
      console.info('private-model r2 deny: object-not-found');
      return notFound();
    }

    const headers = privateHeaders();
    object.writeHttpMetadata?.(headers);
    headers.set('Content-Type', 'model/gltf-binary');
    headers.set('Content-Disposition', 'inline');
    if (typeof object.size === 'number') headers.set('Content-Length', String(object.size));
    if (object.etag) headers.set('ETag', object.etag);

    return new Response(request.method === 'HEAD' ? null : object.body, {
      status: 200,
      headers,
    });
  }

  return secureAssetResponse(await env.ASSETS.fetch(request));
};
