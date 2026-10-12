import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  handlePrivatePlacementReviewRequest,
  isPrivatePlacementReviewPath,
  readBoundedPlacementRequest,
} from '../../worker/privateReviewPlacement';

const origin = 'https://aapopihkala.fi';
const base = '/private-model/review-placement/g2';
const request = (path: string, method = 'GET', headers?: HeadersInit) =>
  new Request(origin + path, { method, headers });

// Generated only in memory. No real Access or Google credentials in fixtures.
const readinessAuth = (async () => {
  const keys = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const team = 'https://p137e-readiness-fixture.cloudflareaccess.com';
  const aud = 'fixture-readiness-audience';
  const kid = 'fixture-readiness-key';
  const unsigned = encode({ alg: 'RS256', kid }) + '.' +
    encode({ iss: team, aud, exp: Math.floor(Date.now() / 1000) + 900 });
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey,
    new TextEncoder().encode(unsigned));
  const token = unsigned + '.' + Buffer.from(signature).toString('base64url');
  const jwk = { ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid, alg: 'RS256' };
  const pem = '-----BEGIN PRIVATE KEY-----\n' +
    Buffer.from(await crypto.subtle.exportKey('pkcs8', keys.privateKey)).toString('base64') +
    '\n-----END PRIVATE KEY-----';
  return { team, aud, token, jwk, pem };
})();

for (const [scenario, status, failureCode] of [
  ['credentials', 503, 'G2_OAUTH_CREDENTIALS_MISSING'],
  ['signing', 503, 'G2_OAUTH_SIGNING_FAILED'],
  ['oauth', 503, 'G2_OAUTH_TOKEN_FAILED'],
  ['docs', 503, 'G2_NATIVE_READ_FAILED'],
  ['docs-json', 503, 'G2_NATIVE_READ_INVALID'],
  ['docs-network-error', 503, 'G2_NATIVE_READ_TRANSPORT_FAILED'],
  ['document-shape', 409, 'G2_NATIVE_DOCUMENT_INVALID'],
  ['current-source', 409, 'G2_CURRENT_SOURCE_NOT_READY'],
  ['untrusted-error', 503, 'G2_OAUTH_TOKEN_TRANSPORT_FAILED'],
] as const) {
  test('authenticated G2 readiness distinguishes ' + scenario + ' without exposing private data', async () => {
    const auth = await readinessAuth;
    const originalFetch = globalThis.fetch;
    let oauthCalls = 0, docsCalls = 0;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url === auth.team + '/cdn-cgi/access/certs') {
        return Response.json({ keys: [auth.jwk] });
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        oauthCalls++;
        expect(init?.method).toBe('POST');
        if (scenario === 'untrusted-error') throw new Error('private-fixture-secret-must-not-leak');
        return scenario === 'oauth'
          ? Response.json({ error: 'private-fixture-secret-must-not-leak' }, { status: 400 })
          : Response.json({ access_token: 'private-fixture-token', token_type: 'Bearer' });
      }
      if (url.startsWith('https://docs.googleapis.com/v1/documents/')) {
        docsCalls++;
        expect(init?.method).toBe('GET');
        if (scenario === 'docs-network-error') throw new Error('private-fixture-secret-must-not-leak');
        if (scenario === 'docs') return Response.json({ error: 'private-fixture-secret-must-not-leak' }, { status: 403 });
        if (scenario === 'docs-json') return new Response('private-fixture-secret-must-not-leak', { status: 200 });
        if (scenario === 'current-source') return Response.json({
          documentId: '1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE',
          revisionId: 'private-fixture-revision',
          tabs: [{ tabProperties: { tabId: 'fixture-tab' }, documentTab: { body: { content: [] } } }],
        });
        return Response.json({});
      }
      throw new Error('Unexpected fixture network request');
    };
    try {
      const response = await handlePrivatePlacementReviewRequest(
        request(base + '/targets', 'GET', { 'Cf-Access-Jwt-Assertion': auth.token }),
        { CF_ACCESS_TEAM_DOMAIN: auth.team, CF_ACCESS_AUD: auth.aud,
          P137E_G2_REVIEW_RELEASE_ENABLED: 'true',
          P137E_G2_SERVICE_ACCOUNT_EMAIL: scenario === 'credentials' ? 'invalid' : 'fixture@sample.iam.gserviceaccount.com',
          P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: scenario === 'signing' ? 'invalid-key' : auth.pem },
      );
      expect(response.status).toBe(status);
      const result = await response.text();
      expect(JSON.parse(result)).toEqual({
        error: status === 409 ? 'source-not-ready' : 'g2-unavailable', failureCode,
      });
      expect(result).not.toContain('private-fixture');
      expect(result).not.toContain('PRIVATE KEY');
      expect(result).not.toContain(auth.token);
      expect(oauthCalls).toBe(scenario === 'credentials' || scenario === 'signing' ? 0 : 1);
      expect(docsCalls).toBe(['docs', 'docs-json', 'docs-network-error', 'document-shape', 'current-source'].includes(scenario) ? 1 : 0);
    } finally { globalThis.fetch = originalFetch; }
  });
}

test('P137E transport classifies only its own private G2 paths', () => {
  expect(isPrivatePlacementReviewPath(base + '/targets')).toBe(true);
  expect(isPrivatePlacementReviewPath(base + '/observations')).toBe(true);
  expect(isPrivatePlacementReviewPath(base + '/observations/P137E_G2_0123456789abcdef')).toBe(true);
  expect(isPrivatePlacementReviewPath('/private-model/work-test/catalog.json')).toBe(false);
  expect(isPrivatePlacementReviewPath(base)).toBe(false);
});

test('P137E transport is closed without explicit independent release flag', async () => {
  const paths = [
    base + '/targets',
    base + '/observations',
    base + '/observations/P137E_G2_0123456789abcdef',
  ];
  for (const path of paths) {
    const response = await handlePrivatePlacementReviewRequest(request(path), {});
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect((await response.text()).includes('P137E_G2_0123456789abcdef')).toBe(false);
  }
});

test('P137E release flag alone never exposes native G2 access', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/targets'),
    { P137E_G2_REVIEW_RELEASE_ENABLED: 'true' },
  );
  expect(response.status).toBe(404);
});

test('P137E secret credentials alone cannot activate a review or write', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/observations', 'POST', {
      Origin: origin,
      'Content-Type': 'application/json',
    }),
    {
      P137E_G2_SERVICE_ACCOUNT_EMAIL: 'test@sample.iam.gserviceaccount.com',
      P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: 'DO_NOT_USE_TEST_KEY',
    },
  );
  expect(response.status).toBe(404);
});

test('P137E release plus dummy credentials still fail without verified Access token', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/targets'),
    {
      P137E_G2_REVIEW_RELEASE_ENABLED: 'true',
      P137E_G2_SERVICE_ACCOUNT_EMAIL: 'test@sample.iam.gserviceaccount.com',
      P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: 'DO_NOT_USE_TEST_KEY',
    },
  );
  expect(response.status).toBe(404);
});

test('P137E streamed request accepts exactly 16 kB and rejects 16 kB plus one', async () => {
  const max = new Request(origin + base + '/observations', {
    method: 'POST',
    body: 'x'.repeat(16000),
  });
  expect(await readBoundedPlacementRequest(max)).toBe('x'.repeat(16000));

  const oversized = new Request(origin + base + '/observations', {
    method: 'POST',
    body: 'x'.repeat(16001),
  });
  expect(await readBoundedPlacementRequest(oversized)).toBeNull();
});

test('P137E chunked input stops before consuming later untrusted chunks', async () => {
  let pulls = 0;
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      if (pulls === 1) controller.enqueue(new Uint8Array(12000));
      else if (pulls === 2) controller.enqueue(new Uint8Array(5000));
      else controller.enqueue(new Uint8Array(10000));
    },
    cancel() { cancelled = true; },
  });
  const request = new Request(origin + base + '/observations', {
    method: 'POST',
    body: source,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(request)).toBeNull();
  expect(pulls).toBeLessThan(4);
  expect(cancelled).toBe(true);
});

test('P137E input decoding rejects malformed UTF-8 and preserves split multibyte text', async () => {
  const bad = new Request(origin + base + '/observations', {
    method: 'POST',
    body: new Uint8Array([0xc3, 0x28]),
  });
  expect(await readBoundedPlacementRequest(bad)).toBeNull();

  const bytes = [new Uint8Array([0xc3]), new Uint8Array([0xa4])];
  let index = 0;
  const good = new Request(origin + base + '/observations', {
    method: 'POST',
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < bytes.length) controller.enqueue(bytes[index++]);
        else controller.close();
      },
    }),
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(good)).toBe('ä');
});

test('Worker routes the dormant G2 review BEFORE generic private model and never exposes secrets', () => {
  const worker = readFileSync(new URL('../../worker/index.ts', import.meta.url), 'utf8');
  const route = readFileSync(new URL('../../worker/privateReviewPlacement.ts', import.meta.url), 'utf8');
  const native = readFileSync(
    new URL('../../src/scripts/privateModelReviewPlacementG2CurrentCombined.ts', import.meta.url), 'utf8');
  const g2 = worker.indexOf('if (isPrivatePlacementReviewPath(url.pathname))');
  const general = worker.indexOf('if (isPrivateModelPath(url.pathname))');
  expect(g2).toBeGreaterThan(-1);
  expect(general).toBeGreaterThan(g2);
  expect(worker).toContain('return handlePrivatePlacementReviewRequest(request, env)');
  expect(route).toContain("env.P137E_G2_REVIEW_RELEASE_ENABLED === 'true'");
  expect(route).toContain('verifyPrivateModelAccess(request, env)');
  expect(route.indexOf('verifyPrivateModelAccess(request, env)'))
    .toBeLessThan(route.indexOf('createNativeG2GoogleDocsPorts({'));
  expect(route).toContain('const document = await ports.getDocument()');
  expect(route).toContain('readNativeG2CurrentPlacementTargets(async () => document)');
  expect(native).toContain('projectNativeG2CurrentThemoReadback(document)');
  expect(native).toContain('projectNativeG2CurrentDoorReadback(document)');
  expect(route).toContain('const readback = await adapter.readback(receipt.recordId)');
  expect(route).toContain("request.headers.get('Origin') !== url.origin");
  expect(route).not.toContain('P137E_G2_REVIEW_RELEASE_ENABLED: \'true\'');
});


test('P137E bounded request cancels a stalled body at its read deadline', async () => {
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"payload":{}}'));
    },
    cancel() { cancelled = true; },
  });
  const stalled = new Request(origin + base + '/observations', {
    method: 'POST', body: source, duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(stalled, 16000, 25)).toBeNull();
  expect(cancelled).toBe(true);
});

test('P137E oversized request returns even when cancellation never resolves', async () => {
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(16001)); },
    cancel() {
      cancelled = true;
      return new Promise<void>(() => {});
    },
  });
  const oversized = new Request(origin + base + '/observations', {
    method: 'POST', body: source, duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(oversized, 16000, 25)).toBeNull();
  expect(cancelled).toBe(true);
});

test('P137E empty chunk flood cannot starve its deadline timer', async () => {
  let cancelled = false;
  let pulls = 0;
  const source = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(0));
    },
    cancel() { cancelled = true; },
  });
  const flooded = new Request(origin + base + '/observations', {
    method: 'POST', body: source, duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(flooded, 16000, 25)).toBeNull();
  expect(pulls).toBeGreaterThan(0);
  expect(cancelled).toBe(true);
});
