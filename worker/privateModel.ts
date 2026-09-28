type AssetsBinding = { fetch(request: Request): Promise<Response> };

type PrivateModelObject = {
  body: ReadableStream<Uint8Array> | null;
  size?: number;
  etag?: string;
  writeHttpMetadata?: (headers: Headers) => void;
};

type PrivateModelBucket = {
  get(key: string): Promise<PrivateModelObject | null>;
};

export type PrivateModelEnv = {
  ASSETS: AssetsBinding;
  PRIVATE_MODEL_BUCKET?: PrivateModelBucket;
  PRIVATE_MODEL_OBJECT_KEY?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

export const PRIVATE_MODEL_PREFIX = '/private-model';
const PRIVATE_MODEL_PATH = `${PRIVATE_MODEL_PREFIX}/model.glb`;
const ACCESS_HEADER = 'cf-access-jwt-assertion';
const JWKS_TTL_MS = 5 * 60 * 1000;

type JwtHeader = { alg?: string; kid?: string };
type JwtPayload = {
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iss?: string;
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

const methodNotAllowed = () => {
  const headers = privateHeaders();
  headers.set('Allow', 'GET, HEAD');
  return new Response('Method not allowed', { status: 405, headers });
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

export const verifyPrivateModelAccess = async (
  request: Request,
  env: Pick<PrivateModelEnv, 'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_AUD'>,
) => {
  const teamOrigin = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  const audience = env.CF_ACCESS_AUD?.trim();
  const token = request.headers.get(ACCESS_HEADER);
  if (!teamOrigin || !audience || !token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const header = decodeJsonSegment<JwtHeader>(parts[0]);
    const payload = decodeJsonSegment<JwtPayload>(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) return false;
    if (payload.iss !== teamOrigin || !audienceMatches(payload.aud, audience)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) return false;
    if (typeof payload.nbf === 'number' && payload.nbf > now) return false;

    const keys = await fetchJwks(teamOrigin);
    const jwk = keys?.find((candidate) => candidate.kid === header.kid);
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = decodeBase64Url(parts[2]);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);
  } catch {
    return false;
  }
};

export const isPrivateModelPath = (pathname: string) =>
  pathname === PRIVATE_MODEL_PREFIX || pathname.startsWith(`${PRIVATE_MODEL_PREFIX}/`);

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
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();

  const pathname = new URL(request.url).pathname;
  if (pathname === PRIVATE_MODEL_PATH) {
    const key = env.PRIVATE_MODEL_OBJECT_KEY?.trim();
    if (!key || !env.PRIVATE_MODEL_BUCKET) return notFound();

    const object = await env.PRIVATE_MODEL_BUCKET.get(key);
    if (!object) return notFound();

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
