import { expect, test } from '@playwright/test';
import { createP137EG2WorkerClient } from '../../src/scripts/privateModelP137EG2WorkerClient.mjs';

const origin = 'https://aapopihkala.fi';
const recordId = 'P137E_G2_0123456789abcdef';
const payload = {
  kind: 'P137E_G2_REVIEW_OBSERVATION',
  stage: 'WORK_TEST_ONLY',
  anchor: { targetId: 'D1F_USER_CURRENT_DOOR_A', floor: '1F', xM: 3.235, yM: 5.063 },
  observation: { noteRaw: 'WORK_TEST only' },
  resolution: { status: 'UNMAPPED' },
  persisted: false, humanReview: 'NOT_RUN',
  currentGeometry: false, canonical: false, asBuilt: false,
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const client = (response: Response, calls: Array<{url: string; options: any}> = [],
  enabled = true) => createP137EG2WorkerClient({
    origin, canReview: () => enabled,
    fetcher: async (url: string, options: any) => {
      calls.push({ url, options });
      return response;
    },
  });

test('dormant P137E G2 client makes no network calls', async () => {
  let count = 0;
  const c = createP137EG2WorkerClient({
    origin, fetcher: async () => { count++; return json({}); },
  });
  await expect(c.targets()).rejects.toThrow('REVIEW_NOT_RELEASED');
  await expect(c.persist(payload)).rejects.toThrow('REVIEW_NOT_RELEASED');
  await expect(c.readback(recordId)).rejects.toThrow('REVIEW_NOT_RELEASED');
  expect(count).toBe(0);
});

test('targets must remain source-bound, unapproved and same-origin', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const result = {
    status: 'WORK_TEST_TARGETS_ONLY', documentRevision: 'G2_REV_TEST',
    targets: [{
      targetId: 'D1F_USER_CURRENT_DOOR_A', approvedWallHosts: [], exactXY: false,
      currentGeometry: false, canonical: false, asBuilt: false,
    }],
  };
  expect((await client(json(result), calls).targets()).targets).toHaveLength(1);
  expect(calls[0].url).toBe(origin + '/private-model/review-placement/g2/targets');
  expect(calls[0].options.credentials).toBe('same-origin');
  expect(calls[0].options.mode).toBe('same-origin');
  expect(calls[0].options.redirect).toBe('error');
  expect(calls[0].options.cache).toBe('no-store');
});

test('targets fail closed when native G2 repeats a source target identity', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const target = {
    targetId: 'D_THEMO_CURRENT_LOBBY_01', approvedWallHosts: [],
    exactXY: false, currentGeometry: false, canonical: false, asBuilt: false,
  };
  const base = { status: 'WORK_TEST_TARGETS_ONLY', documentRevision: 'G2_REV_TEST' };
  await expect(client(json({ ...base, targets: [target, { ...target }] }), calls)
    .targets()).rejects.toThrow('TARGET_EVIDENCE_INVALID');
  expect(calls).toHaveLength(1);
  await expect(client(json({
    ...base, targets: [target, { ...target, targetId: 'D_THEMO_CURRENT_BATHROOM_01' }],
  })).targets()).resolves.toMatchObject({ targets: [
    { targetId: 'D_THEMO_CURRENT_LOBBY_01' },
    { targetId: 'D_THEMO_CURRENT_BATHROOM_01' },
  ] });
});

test('POST receipt requires a separate unchanged durable GET from G2', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const reply = { receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
    readback: { recordId, payload } };
  const c = createP137EG2WorkerClient({
    origin, canReview: () => true,
    fetcher: async (url: string, options: any) => {
      calls.push({ url, options });
      return options.method === 'POST' ? json(reply) : json({ recordId, payload });
    },
  });
  const receipt = await c.persist(payload);
  expect(receipt.recordId).toBe(recordId);
  expect(calls).toHaveLength(2);
  expect(calls.map(call => call.options.method)).toEqual(['POST', 'GET']);
  expect(calls[0].url).toBe(origin + '/private-model/review-placement/g2/observations');
  expect(calls[1].url).toBe(origin + '/private-model/review-placement/g2/observations/' + recordId);
  expect(JSON.parse(calls[0].options.body)).toEqual({ payload });
  expect(calls[1].options.credentials).toBe('same-origin');
  expect(calls[1].options.redirect).toBe('error');
  expect(calls[1].options.cache).toBe('no-store');
});

test('POST echo cannot fake durability when independent G2 GET differs or fails', async () => {
  const reply = { receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
    readback: { recordId, payload } };
  const cases = [
    { get: { recordId, payload: { ...payload, anchor: { ...payload.anchor, xM: 100 } } },
      reason: 'DURABLE_READBACK_INVALID' },
    { get: { recordId: 'P137E_G2_different1234', payload },
      reason: 'DURABLE_READBACK_INVALID' },
    { get: { recordId, payload: { ...payload, observation: { canonical: true } } },
      reason: 'DURABLE_READBACK_INVALID' },
    { get: { error: 'not-found' }, status: 404, reason: 'UNAVAILABLE' },
  ];
  for (const scenario of cases) {
    const methods: string[] = [];
    const c = createP137EG2WorkerClient({
      origin, canReview: () => true,
      fetcher: async (_url: string, options: any) => {
        methods.push(options.method);
        return options.method === 'POST'
          ? json(reply)
          : json(scenario.get, scenario.status ?? 200);
      },
    });
    await expect(c.persist(payload)).rejects.toThrow(scenario.reason);
    expect(methods).toEqual(['POST', 'GET']);
  }
});

test('POST rejects modified coordinates and invented acknowledgement', async () => {
  const mutated = { ...payload, anchor: { ...payload.anchor, xM: 4.5 } };
  const falseReadback = { receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
    readback: { recordId, payload: mutated } };
  await expect(client(json(falseReadback)).persist(payload))
    .rejects.toThrow('DURABLE_READBACK_INVALID');
  await expect(client(json({ receipt: { status: 'ok', recordId }, readback: { recordId, payload } }))
    .persist(payload)).rejects.toThrow('DURABLE_READBACK_INVALID');
});

test('promoted geometry and incomplete WORK_TEST payloads fail before network', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const c = client(json({}), calls);
  await expect(c.persist({ ...payload, canonical: true }))
    .rejects.toThrow('PROMOTION_REJECTED');
  await expect(c.persist({ ...payload, humanReview: 'PASS' }))
    .rejects.toThrow('PROMOTION_REJECTED');
  await expect(c.persist({ ...payload, resolution: null }))
    .rejects.toThrow('PROMOTION_REJECTED');
  expect(calls).toHaveLength(0);
});

test('nested WORK_TEST promotion flags fail before any G2 POST', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const c = client(json({}), calls);
  const mutations = [
    { anchor: { ...payload.anchor, host: { canonical: true } } },
    { anchor: { ...payload.anchor, height: { exactZClaim: true } } },
    { observation: { ...payload.observation, metadata: { asBuilt: true } } },
    { observation: { ...payload.observation, metadata: { humanReview: 'PASS' } } },
    { resolution: { ...payload.resolution, props: { publishToCURRENT: true } } },
    { resolution: { ...payload.resolution, props: { stage: 'CURRENT' } } },
    { resolution: { ...payload.resolution, props: { exactXY: true } } },
    { resolution: { ...payload.resolution, nested: { provenance: { surveyGeometryClaim: true } } } },
  ];
  for (const mutation of mutations) {
    await expect(c.persist({ ...payload, ...mutation }))
      .rejects.toThrow('PROMOTION_REJECTED');
  }
  expect(calls).toHaveLength(0);
});

test('nested promoted durable POST response and GET response fail closed', async () => {
  const promoted = {
    ...payload, observation: { ...payload.observation, context: { asBuiltClaim: true } },
  };
  const post = { receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
    readback: { recordId, payload: promoted } };
  await expect(client(json(post)).persist(payload))
    .rejects.toThrow('DURABLE_READBACK_INVALID');
  await expect(client(json({ recordId, payload: promoted })).readback(recordId))
    .rejects.toThrow('DURABLE_READBACK_INVALID');
});

test('nested approval or publication status cannot be POSTed as WORK_TEST', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const c = client(json({}), calls);
  for (const status of ['CURRENT', 'CANONICAL', 'AS_BUILT', 'PUBLISHED',
    'PRODUCTION', 'APPROVED', 'HUMAN_REVIEW_PASS',
    'HUMAN_REVIEW_PASS_SCOPED', 'READY_FOR_HUMAN_REVIEW']) {
    await expect(c.persist({ ...payload, resolution: { status } }))
      .rejects.toThrow('PROMOTION_REJECTED');
  }
  await expect(c.persist({ ...payload, observation: {
    ...payload.observation, metadata: { reviewStatus: 'APPROVED' },
  } })).rejects.toThrow('PROMOTION_REJECTED');
  expect(calls).toHaveLength(0);
});

test('nested promoted status in independent server GET readback is rejected', async () => {
  const promoted = { ...payload, resolution: { status: 'HUMAN_REVIEW_PASS' } };
  await expect(client(json({ recordId, payload: promoted })).readback(recordId))
    .rejects.toThrow('DURABLE_READBACK_INVALID');
});

test('record readback rejects path injection and validates record identity', async () => {
  const calls: Array<{url: string; options: any}> = [];
  const c = client(json({ recordId, payload }), calls);
  await expect(c.readback('../other')).rejects.toThrow('RECORD_ID_INVALID');
  expect(calls).toHaveLength(0);
  await expect(c.readback(recordId)).resolves.toEqual({ recordId, payload });
  expect(calls[0].options.method).toBe('GET');
  expect(calls[0].url).toBe(origin + '/private-model/review-placement/g2/observations/' + recordId);
});

test('server release denial, target promotion and redirects fail closed', async () => {
  await expect(client(json({ error: 'not-found' }, 404)).targets())
    .rejects.toThrow('UNAVAILABLE');
  const promoted = { status: 'WORK_TEST_TARGETS_ONLY', documentRevision: 'r1',
    targets: [{ targetId: 'D_THEMO_CURRENT_BATHROOM_01',
      approvedWallHosts: ['guessed'], exactXY: false,
      currentGeometry: false, canonical: false, asBuilt: false }] };
  await expect(client(json(promoted)).targets()).rejects.toThrow('TARGET_EVIDENCE_INVALID');
  const redirected = json({});
  Object.defineProperty(redirected, 'redirected', { value: true });
  await expect(client(redirected).targets()).rejects.toThrow('REDIRECT_REJECTED');
});

test('bad origin and oversized requests rejected before network', async () => {
  expect(() => createP137EG2WorkerClient({ origin: 'http://aapopihkala.fi' }))
    .toThrow('CLIENT_ORIGIN_INVALID');
  expect(() => createP137EG2WorkerClient({ origin: 'https://evil.example/private/' }))
    .toThrow('CLIENT_ORIGIN_INVALID');
  const calls: Array<{url: string; options: any}> = [];
  const c = client(json({}), calls);
  await expect(c.persist({ ...payload, observation: { noteRaw: 'a'.repeat(16500) } }))
    .rejects.toThrow('REQUEST_TOO_LARGE');
  expect(calls).toHaveLength(0);
});

test('streamed 32-kB reply cap cancels large response', async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(35000)); },
    cancel() { canceled = true; },
  });
  const response = new Response(stream, {
    headers: { 'content-type': 'application/json' },
  });
  await expect(client(response).targets()).rejects.toThrow('RESPONSE_TOO_LARGE');
  expect(canceled).toBe(true);
});
