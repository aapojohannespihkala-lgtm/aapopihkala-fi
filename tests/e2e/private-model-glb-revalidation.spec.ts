import { expect, test } from '@playwright/test';

import {
  PRIVATE_GLB_REVALIDATE_CACHE_CONTROL,
  privateGlbEtag,
  privateGlbIfNoneMatchHits,
} from '../../worker/privateGlbRevalidation';
import {
  PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX,
  getPrivateWorkTestCandidateById,
  handlePrivateWorkTestRequest,
} from '../../worker/privateWorkTest';
import { handlePrivateModelRequest, type PrivateModelEnv } from '../../worker/privateModel';

const SHA = 'a'.repeat(64);

test('GLB validator is a strong SHA-256 ETag and If-None-Match uses weak comparison', () => {
  expect(privateGlbEtag(SHA)).toBe(`"sha256-${SHA}"`);
  expect(privateGlbEtag(` ${SHA.toUpperCase()} `)).toBe(`"sha256-${SHA}"`);
  expect(privateGlbEtag('not-a-sha')).toBeNull();
  expect(privateGlbEtag(undefined)).toBeNull();

  const etag = privateGlbEtag(SHA)!;
  const req = (value?: string) =>
    new Request('https://example.test/x', value ? { headers: { 'If-None-Match': value } } : {});
  expect(privateGlbIfNoneMatchHits(req(), etag)).toBe(false);
  expect(privateGlbIfNoneMatchHits(req(etag), etag)).toBe(true);
  expect(privateGlbIfNoneMatchHits(req(`"x", W/${etag}`), etag)).toBe(true);
  expect(privateGlbIfNoneMatchHits(req('*'), etag)).toBe(true);
  expect(privateGlbIfNoneMatchHits(req(`"sha256-${'b'.repeat(64)}"`), etag)).toBe(false);
});

const createAccessJwtSigner = async (teamOrigin: string, kid: string) => {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey & { kid?: string };
  jwk.kid = kid;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const sign = async (payload: Record<string, unknown>) => {
    const signed = `${encode({ alg: 'RS256', kid })}.${encode({ iss: teamOrigin, ...payload })}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(signed));
    return `${signed}.${Buffer.from(signature).toString('base64url')}`;
  };
  return { jwk, sign };
};

const streamOf = (bytes: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

test('authenticated viewer GLB routes revalidate with SHA ETag and answer 304 without the body', async () => {
  const originalFetch = globalThis.fetch;
  const teamOrigin = 'https://glb-revalidation-unit.cloudflareaccess.com';
  const signer = await createAccessJwtSigner(teamOrigin, 'glb-revalidation-unit-key');
  globalThis.fetch = (async () => Response.json({ keys: [signer.jwk] })) as typeof fetch;

  const candidate = getPrivateWorkTestCandidateById('p150g-whole-building-end-plinth');
  expect(candidate).toBeTruthy();
  const bytes = new TextEncoder().encode('unit-glb');
  const currentSha = 'c'.repeat(64);
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    PRIVATE_MODEL_BUCKET: {
      get: async (key: string) => {
        if (key === candidate!.objectKey) {
          return {
            body: streamOf(bytes),
            size: candidate!.expectedSize,
            customMetadata: { sha256: candidate!.expectedSha256 },
          };
        }
        if (key === 'model.glb') {
          return { body: streamOf(bytes), size: bytes.length, customMetadata: { sha256: currentSha } };
        }
        return null;
      },
    },
    CF_ACCESS_TEAM_DOMAIN: teamOrigin,
    CF_ACCESS_AUD: 'viewer-aud',
    CF_ACCESS_READBACK_AUD: 'readback-aud',
    CF_ACCESS_READBACK_COMMON_NAME: 'readback-client.access',
  } as unknown as PrivateModelEnv;
  const now = Math.floor(Date.now() / 1000);
  const viewerToken = await signer.sign({ aud: ['viewer-aud'], exp: now + 300, sub: 'human-user' });
  const readbackToken = await signer.sign({
    type: 'app', aud: ['readback-aud'], exp: now + 300, sub: '', common_name: 'readback-client.access',
  });

  try {
    const candidateEtag = `"sha256-${candidate!.expectedSha256}"`;
    const get = (path: string, token: string, ifNoneMatch?: string) =>
      new Request(`https://example.test${path}`, {
        headers: {
          'cf-access-jwt-assertion': token,
          ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}),
        },
      });

    const first = await handlePrivateWorkTestRequest(get(candidate!.path, viewerToken), env);
    expect(first.status).toBe(200);
    expect(first.headers.get('Cache-Control')).toBe(PRIVATE_GLB_REVALIDATE_CACHE_CONTROL);
    expect(first.headers.get('ETag')).toBe(candidateEtag);
    expect(first.headers.get('X-Robots-Tag')).toContain('noindex');

    const cached = await handlePrivateWorkTestRequest(get(candidate!.path, viewerToken, candidateEtag), env);
    expect(cached.status).toBe(304);
    expect(cached.headers.get('ETag')).toBe(candidateEtag);
    expect(cached.headers.get('Cache-Control')).toBe(PRIVATE_GLB_REVALIDATE_CACHE_CONTROL);
    expect(await cached.text()).toBe('');

    const stale = await handlePrivateWorkTestRequest(get(candidate!.path, viewerToken, `"sha256-${'b'.repeat(64)}"`), env);
    expect(stale.status).toBe(200);

    // Revalidation never bypasses Access: a conditional request without a token is denied.
    const anonymous = await handlePrivateWorkTestRequest(
      new Request(`https://example.test${candidate!.path}`, { headers: { 'If-None-Match': candidateEtag } }),
      env,
    );
    expect(anonymous.status).toBe(404);

    // Machine readback stays uncacheable.
    const readback = await handlePrivateWorkTestRequest(
      get(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}p150g-whole-building-end-plinth.glb`, readbackToken, candidateEtag),
      env,
    );
    expect(readback.status).toBe(200);
    expect(readback.headers.get('Cache-Control')).toBe('private, no-store');

    const currentEtag = `"sha256-${currentSha}"`;
    const current = await handlePrivateModelRequest(get('/private-model/model.glb', viewerToken), env);
    expect(current.status).toBe(200);
    expect(current.headers.get('ETag')).toBe(currentEtag);
    expect(current.headers.get('Cache-Control')).toBe(PRIVATE_GLB_REVALIDATE_CACHE_CONTROL);

    const currentCached = await handlePrivateModelRequest(get('/private-model/model.glb', viewerToken, currentEtag), env);
    expect(currentCached.status).toBe(304);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
