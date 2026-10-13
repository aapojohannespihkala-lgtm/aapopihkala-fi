import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createP137EG2WorkerClient } from '../../src/scripts/privateModelP137EG2WorkerClient.mjs';
import { buildPlacementReviewDraft } from '../../src/scripts/privateModelReviewPlacementDraft';
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


const nativeG2SourceFixtureParagraphs = () => [
    '3D-D/G2 p137J - D 1F kaksi käyttäjävahvistettua nykytilan ovea WORK_TEST-geometriaksi 2026-09-29',
    'Tila: PASS_USER_CURRENT_DOOR_WORK_GEOMETRY_2_OF_2 / HUMAN_REVIEW_IN_PROGRESS.',
    'Pysyvät review-ankkurit: \u0060D1F_USER_CURRENT_DOOR_A\u0060 = p137E \u0060HUMAN_REVIEW_ANCHOR_A\u0060, klikattu YLIS-G1-LOCAL X=3,235 m / Y=5,063 m. \u0060D1F_USER_CURRENT_DOOR_B\u0060 = \u0060HUMAN_REVIEW_ANCHOR_B\u0060, klikattu X=3,852 / Y=4,314 m.',
    '3D-D/G2 p137N - D 1F A/B historical/source-ID reconciliation 2026-09-29',
    'Tila: PASS_NEGATIVE_SOURCE_ID_RECONCILIATION / KEEP_USER_CURRENT_IDENTITIES / HUMAN_REVIEW_IN_PROGRESS.',
    'Johtopäätös p137I-C0:n mukaan: Historiallista G2_DOOR-ID:tä ei luoda eikä 7/7 source-ID-joukkoa muuteta. P137J:n pysyvät \u0060D1F_USER_CURRENT_DOOR_A/B\u0060 reviewDoorId:t säilyvät current-only identiteetteinä.',
    'R989 - D current Themo room/group provenance - 8.10.2026',
    'Tila: PASS_CURRENT_INSTALLATION_ROOM_BINDING / HISTORICAL_GROUP_CONTEXT_BOUND / NO_GEOMETRY_MUTATION / NO_PROMOTION.',
    'Current installation evidence: \u0060Ylisrinne - huollon ja ylläpidon seuranta\u0060 vahvistaa käyttäjän ilmoituksella, että kaikki 3 x Themo-lattialämmitystermostaatti asennettiin 7.10.2026. Käyttäjä vahvisti 8.10.2026 myös laitteiden huonenimien olevan oikein: Bathroom, Bedroom ja Lobby.',
    'Loogiset nykylaite-identiteetit tulevaa tietomallikulutusta varten: \u0060D_THEMO_CURRENT_BATHROOM_01\u0060 = Themo / Bathroom; \u0060D_THEMO_CURRENT_BEDROOM_01\u0060 = Themo / Bedroom; \u0060D_THEMO_CURRENT_LOBBY_01\u0060 = Themo / Lobby. Näillä identiteeteillä on \u0060currentInstallationEvidence=true\u0060 ja \u0060roomAssignmentEvidence=USER_CONFIRMED\u0060, mutta ei fyysistä pistekoordinaattia eikä 3D-laitegeometriaa.',
    'Historiallinen ryhmäkonteksti peritään muuttamatta G2 r791/r886 -evidenssistä: Bathroom -> source component C -> \u0060sourceGroupKey=10.2\u0060 / \u0060sourceScheduleName=pesuhuone/sauna\u0060; Bedroom -> A -> \u0060sourceGroupKey=10.3\u0060 / \u0060sourceScheduleName=makuuhuone\u0060; Lobby -> B -> \u0060sourceGroupKey=10.1\u0060 / \u0060sourceScheduleName=eteinen\u0060. Ryhmäsidonnan luokka on \u0060HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY\u0060. Se on vuoden 2015 sähköaineistosta johdettu historiallinen group-context, ei vuoden 2026 current/as-built-kytkentävahvistus.',
    'No-promotion / materialisointiraja: \u0060exactCurrentXYClaim=false\u0060, \u0060exactZClaim=false\u0060, \u0060deviceGeometryClaim=false\u0060, \u0060physicalCableRouteClaim=false\u0060, \u0060continuousCableTopologyClaim=false\u0060, \u0060currentGeometryClaim=false\u0060, \u0060asBuilt=false\u0060, \u0060canonical=false\u0060, \u0060publishToCURRENT=false\u0060 ja \u0060HUMAN_REVIEW=NOT_RUN\u0060.',
    'R999 - fixture terminator',
  ];


test('P137E fixture Worker POST stores one observation and separately reads its native G2 bytes', async () => {
  // Entire chain is simulated; no production Google credentials, G2 writes or user claims.
  const auth = await readinessAuth;
  const originalFetch = globalThis.fetch;
  const docId = '1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE';
  const paragraphs = nativeG2SourceFixtureParagraphs();  let revision = 'FIXTURE_SOURCE_REV_1';
  let docsWrites = 0, docsGets = 0;
  let lastNetworkStage = 'not-started';
  const result = buildPlacementReviewDraft({
    context: { targetId: 'D_THEMO_CURRENT_BATHROOM_01', floor: '1F', approvedWallHosts: [] },
    coordinate: { xM: 3.235, yM: 5.063 },
    noteRaw: 'Fixture only: not a surveyed or approved Themo location.',
  });
  expect(result.status).toBe('READY_FOR_G2_HANDOFF');
  if (result.status !== 'READY_FOR_G2_HANDOFF') throw new Error('Fixture invalid');
  const payload = result.payload;
  const env = {
    CF_ACCESS_TEAM_DOMAIN: auth.team,
    CF_ACCESS_AUD: auth.aud,
    P137E_G2_REVIEW_RELEASE_ENABLED: 'true',
    P137E_G2_SERVICE_ACCOUNT_EMAIL: 'fixture@example.iam.gserviceaccount.com',
    P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: auth.pem,
  };
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === auth.team + '/cdn-cgi/access/certs') { lastNetworkStage = 'access-jwks'; return Response.json({ keys: [auth.jwk] }); }
    if (url === 'https://oauth2.googleapis.com/token') {
      lastNetworkStage = 'oauth';
      expect(init?.redirect).toBe('manual');
      return Response.json({ access_token: 'fixture-token', token_type: 'Bearer' });
    }
    if (url.startsWith('https://docs.googleapis.com/v1/documents/')) {
      expect(init?.redirect).toBe('manual');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer fixture-token');
      expect(url.startsWith('https://docs.googleapis.com/v1/documents/' + docId)).toBe(true);
      if (url.endsWith(':batchUpdate')) {
        lastNetworkStage = 'docs-post';
        docsWrites++;
        const body = JSON.parse(String(init?.body));
        expect(body.writeControl.requiredRevisionId).toBe('FIXTURE_SOURCE_REV_1');
        expect(body.requests).toHaveLength(1);
        expect(body.requests[0].insertText.endOfSegmentLocation.tabId).toBe('t.0');
        paragraphs.push(body.requests[0].insertText.text.trim());
        revision = 'FIXTURE_SOURCE_REV_2';
        return Response.json({ documentId: docId, replies: [{}] });
      }
      lastNetworkStage = 'docs-get';
      docsGets++;
      return Response.json({
        documentId: docId, revisionId: revision,
        tabs: [{ tabProperties: { tabId: 't.0' }, documentTab: { body: {
          content: paragraphs.map(s => ({ paragraph: { elements: [{ textRun: { content: s + '\n' } }] } })),
        } } }],
      });
    }
    throw new Error('Unexpected network call in fixture');
  };
  try {
    const headers = {
      'Cf-Access-Jwt-Assertion': auth.token,
      Origin: origin, 'Content-Type': 'application/json',
    };
    const wrong = await handlePrivatePlacementReviewRequest(
      new Request(origin + base + '/observations', {
        method: 'POST', headers: { ...headers, Origin: 'https://other.invalid' },
        body: JSON.stringify({ payload }),
      }), env,
    );
    expect(wrong.status).toBe(404);
    expect(docsWrites).toBe(0);
    const response = await handlePrivatePlacementReviewRequest(
      new Request(origin + base + '/observations', {
        method: 'POST', headers, body: JSON.stringify({ payload }),
      }), env,
    );
    expect(response.status, JSON.stringify({ lastNetworkStage, docsWrites, docsGets, revision })).toBe(200);
    const ack = await response.json();
    expect(ack.receipt.status).toBe('PERSISTED_TO_EXISTING_G2');
    expect(ack.receipt.recordId).toMatch(/^P137E_G2_[A-Za-z0-9_-]{12,64}$/);
    expect(ack.readback).toEqual({ recordId: ack.receipt.recordId, payload });
    expect(docsWrites).toBe(1);
    expect(docsGets).toBeGreaterThanOrEqual(3);
    expect(revision).toBe('FIXTURE_SOURCE_REV_2');
    const independentlyRead = await handlePrivatePlacementReviewRequest(
      request(base + '/observations/' + ack.receipt.recordId, 'GET',
        { 'Cf-Access-Jwt-Assertion': auth.token }), env,
    );
    expect(independentlyRead.status).toBe(200);
    expect(await independentlyRead.json()).toEqual({ recordId: ack.receipt.recordId, payload });
    expect(docsWrites).toBe(1);
    expect(payload.humanReview).toBe('NOT_RUN');
    expect(payload.currentGeometry).toBe(false);
    expect(payload.canonical).toBe(false);
    expect(payload.asBuilt).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('P137E existing-record Worker GET reads three exact decimal heights without a G2 write', async () => {
  const auth = await readinessAuth;
  const originalFetch = globalThis.fetch;
  const docId = '1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE';
  const fixtures = [
    { recordId: 'P137E_G2_FIXTURE_LOBBY_HEIGHT_0001', targetId: 'D_THEMO_CURRENT_LOBBY_01', cm: 148, metres: 1.48 },
    { recordId: 'P137E_G2_FIXTURE_BEDROOM_HEIGHT_0001', targetId: 'D_THEMO_CURRENT_BEDROOM_01', cm: 148, metres: 1.48 },
    { recordId: 'P137E_G2_FIXTURE_BATHROOM_HEIGHT_0001', targetId: 'D_THEMO_CURRENT_BATHROOM_01', cm: 140, metres: 1.4 },
  ];
  const stored = fixtures.map((fixture, i) => {
    const draft = buildPlacementReviewDraft({
      context: { targetId: fixture.targetId, floor: '1F', approvedWallHosts: [] },
      coordinate: { xM: 1 + i, yM: 2 },
      noteRaw: fixture.cm + ' cm lattiasta. Synthetic WORK_TEST fixture only.',
    });
    if (draft.status !== 'READY_FOR_G2_HANDOFF') throw new Error('Fixture invalid');
    // Model independently stored decimal JSON. Do not derive expected metres
    // through the parser under test or POST a freshly rebuilt observation.
    draft.payload.observation.height = {
      status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: fixture.metres, zM: null,
    };
    return { schema: 'P137E_G2_REVIEW_OBSERVATION_V1', recordId: fixture.recordId,
      sourceDocumentId: docId, sourceRevision: 'FIXTURE_PERSISTED_REV',
      payload: draft.payload };
  });
  const env = {
    CF_ACCESS_TEAM_DOMAIN: auth.team, CF_ACCESS_AUD: auth.aud,
    P137E_G2_REVIEW_RELEASE_ENABLED: 'true',
    P137E_G2_SERVICE_ACCOUNT_EMAIL: 'fixture@example.iam.gserviceaccount.com',
    P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: auth.pem,
  };
  let docsGets = 0, docsWrites = 0;
  const workerStatuses: number[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === auth.team + '/cdn-cgi/access/certs') return Response.json({ keys: [auth.jwk] });
    if (url === 'https://oauth2.googleapis.com/token') {
      expect(init?.method).toBe('POST');
      return Response.json({ access_token: 'fixture-token', token_type: 'Bearer' });
    }
    if (url.startsWith('https://docs.googleapis.com/v1/documents/' + docId)) {
      if (init?.method !== 'GET') {
        docsWrites++;
        throw new Error('Existing-record fixture must not write G2');
      }
      docsGets++;
      const paragraphs = [...nativeG2SourceFixtureParagraphs(), ...stored.map(record =>
        'P137E_G2_REVIEW_OBSERVATION_V1 | ' + record.recordId + ' | ' + JSON.stringify(record))];
      return Response.json({ documentId: docId, revisionId: 'FIXTURE_CURRENT_REV',
        tabs: [{ tabProperties: { tabId: 't.0' }, documentTab: { body: {
          content: paragraphs.map(content => ({ paragraph: { elements: [
            { textRun: { content: content + '\n' } },
          ] } })),
        } } }],
      });
    }
    throw new Error('Unexpected fixture network request');
  };
  const client = createP137EG2WorkerClient({
    origin, canReview: () => true,
    fetcher: async (url, options) => {
      expect(options.method).toBe('GET');
      expect(options.body).toBeUndefined();
      expect(fixtures.some(fixture => url === origin + base + '/observations/' + fixture.recordId)).toBe(true);
      const response = await handlePrivatePlacementReviewRequest(new Request(url, {
        ...options, headers: { 'Cf-Access-Jwt-Assertion': auth.token },
      }), env);
      workerStatuses.push(response.status);
      return response;
    },
  });
  try {
    for (const record of stored) {
      expect(await client.readback(record.recordId)).toEqual({
        recordId: record.recordId, payload: record.payload,
      });
    }
    expect(workerStatuses).toEqual([200, 200, 200]);
    expect(docsGets).toBe(3);
    expect(docsWrites).toBe(0);
    expect(stored[2].payload.observation.height.aboveFinishedFloorM).toBe(1.4);
    // A materially different stored height still fails exact reconstruction.
    stored[2].payload.observation.height.aboveFinishedFloorM = 1.41;
    await expect(client.readback(stored[2].recordId)).rejects.toThrow('P137E_G2_UNAVAILABLE');
    expect(workerStatuses[3]).toBe(404);
    expect(docsWrites).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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
