import { expect, test } from '@playwright/test';

import { seedPrivateWorkTestCandidateFromSource } from '../../worker/privateWorkTest';

test('private WORK_TEST background seed validates exact source bytes and R2 readback', async () => {
  const candidate = {
    id: 'unit-background-seed',
    label: 'unit background seed',
    path: '/private-model/work-test/unit-background-seed.glb',
    objectKey: 'work-test/unit-background-seed.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/unit/raw?se=x&sig=y';
  let stored:
    | { body: ReadableStream<Uint8Array> | null; size: number; customMetadata: Record<string, string> }
    | null = null;
  let writes = 0;

  const bucket = {
    get: async () => stored,
    put: async (
      _key: string,
      value: ArrayBuffer,
      options: { customMetadata: Record<string, string> },
    ) => {
      writes += 1;
      stored = {
        body: null,
        size: value.byteLength,
        customMetadata: options.customMetadata,
      };
      return stored;
    },
  };
  const fetchImpl = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62, 0x63]), {
      status: 200,
      headers: { 'Content-Length': '3' },
    });
    Object.defineProperty(response, 'url', {
      value: sourceUrl,
      configurable: true,
    });
    return response;
  }) as typeof fetch;

  const result = await seedPrivateWorkTestCandidateFromSource(
    candidate,
    sourceUrl,
    bucket,
    fetchImpl,
    100,
  );

  expect(result).toEqual({ ok: true });
  expect(writes).toBe(1);
  expect(stored).toEqual({
    body: null,
    size: 3,
    customMetadata: { sha256: candidate.expectedSha256 },
  });
});

test('private WORK_TEST background seed hard-times a source that never settles', async () => {
  const candidate = {
    id: 'unit-background-timeout',
    label: 'unit background timeout',
    path: '/private-model/work-test/unit-background-timeout.glb',
    objectKey: 'work-test/unit-background-timeout.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/unit-timeout/raw?se=x&sig=y';
  let writes = 0;
  const bucket = {
    get: async () => null,
    put: async () => {
      writes += 1;
      return { body: null };
    },
  };
  const fetchImpl = (() => new Promise<Response>(() => {})) as typeof fetch;

  const result = await seedPrivateWorkTestCandidateFromSource(
    candidate,
    sourceUrl,
    bucket,
    fetchImpl,
    5,
  );

  expect(result).toEqual({ ok: false, error: 'source-fetch-timeout', status: 504 });
  expect(writes).toBe(0);
});


test('private WORK_TEST seed classifies source fetch rejection', async () => {
  const candidate = {
    id: 'unit-source-fetch-failed',
    label: 'unit source fetch failed',
    path: '/private-model/work-test/unit-source-fetch-failed.glb',
    objectKey: 'work-test/unit-source-fetch-failed.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const bucket = { get: async () => null, put: async () => ({ body: null }) };
  const fetchImpl = (async () => {
    throw new Error('network failed');
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(
      candidate,
      'https://unit.oaiusercontent.com/files/fetch-failed/raw?se=x&sig=y',
      bucket,
      fetchImpl,
      100,
    ),
  ).resolves.toEqual({ ok: false, error: 'source-fetch-failed', status: 502 });
});

test('private WORK_TEST seed classifies source body read rejection', async () => {
  const candidate = {
    id: 'unit-source-body-failed',
    label: 'unit source body failed',
    path: '/private-model/work-test/unit-source-body-failed.glb',
    objectKey: 'work-test/unit-source-body-failed.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/body-failed/raw?se=x&sig=y';
  const bucket = { get: async () => null, put: async () => ({ body: null }) };
  const fetchImpl = (async () => {
    const response = new Response(
      new ReadableStream({
        pull() {
          throw new Error('body stream failed');
        },
      }),
      { status: 200 },
    );
    Object.defineProperty(response, 'url', {
      value: sourceUrl,
      configurable: true,
    });
    return response;
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, bucket, fetchImpl, 100),
  ).resolves.toEqual({ ok: false, error: 'source-fetch-failed', status: 502 });
});

test('private WORK_TEST seed classifies denied resolved source', async () => {
  const candidate = {
    id: 'unit-source-denied',
    label: 'unit source denied',
    path: '/private-model/work-test/unit-source-denied.glb',
    objectKey: 'work-test/unit-source-denied.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/source-denied/raw?se=x&sig=y';
  const bucket = { get: async () => null, put: async () => ({ body: null }) };
  const fetchImpl = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62, 0x63]), { status: 200 });
    Object.defineProperty(response, 'url', {
      value: 'https://example.test/not-trusted',
      configurable: true,
    });
    return response;
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, bucket, fetchImpl, 100),
  ).resolves.toEqual({ ok: false, error: 'source-fetch-denied', status: 502 });
});

test('private WORK_TEST seed classifies declared and actual source size mismatches', async () => {
  const candidate = {
    id: 'unit-source-size-mismatch',
    label: 'unit source size mismatch',
    path: '/private-model/work-test/unit-source-size-mismatch.glb',
    objectKey: 'work-test/unit-source-size-mismatch.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/size-mismatch/raw?se=x&sig=y';
  const bucket = { get: async () => null, put: async () => ({ body: null }) };

  const declaredMismatch = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62, 0x63]), {
      status: 200,
      headers: { 'Content-Length': '4' },
    });
    Object.defineProperty(response, 'url', { value: sourceUrl, configurable: true });
    return response;
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, bucket, declaredMismatch, 100),
  ).resolves.toEqual({ ok: false, error: 'source-size-mismatch', status: 422 });

  const actualMismatch = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62]), { status: 200 });
    Object.defineProperty(response, 'url', { value: sourceUrl, configurable: true });
    return response;
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, bucket, actualMismatch, 100),
  ).resolves.toEqual({ ok: false, error: 'source-size-mismatch', status: 422 });
});

test('private WORK_TEST seed classifies source SHA mismatch', async () => {
  const candidate = {
    id: 'unit-source-sha-mismatch',
    label: 'unit source sha mismatch',
    path: '/private-model/work-test/unit-source-sha-mismatch.glb',
    objectKey: 'work-test/unit-source-sha-mismatch.glb',
    expectedSize: 3,
    expectedSha256: '00'.repeat(32),
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/sha-mismatch/raw?se=x&sig=y';
  const bucket = { get: async () => null, put: async () => ({ body: null }) };
  const fetchImpl = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62, 0x63]), { status: 200 });
    Object.defineProperty(response, 'url', { value: sourceUrl, configurable: true });
    return response;
  }) as typeof fetch;

  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, bucket, fetchImpl, 100),
  ).resolves.toEqual({ ok: false, error: 'source-sha256-mismatch', status: 422 });
});

test('private WORK_TEST seed classifies R2 write and readback failures', async () => {
  const candidate = {
    id: 'unit-r2-failures',
    label: 'unit r2 failures',
    path: '/private-model/work-test/unit-r2-failures.glb',
    objectKey: 'work-test/unit-r2-failures.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const sourceUrl =
    'https://unit.oaiusercontent.com/files/r2-failures/raw?se=x&sig=y';
  const fetchImpl = (async () => {
    const response = new Response(new Uint8Array([0x61, 0x62, 0x63]), { status: 200 });
    Object.defineProperty(response, 'url', { value: sourceUrl, configurable: true });
    return response;
  }) as typeof fetch;

  const writeFailBucket = {
    get: async () => null,
    put: async () => {
      throw new Error('r2 put failed');
    },
  };
  await expect(
    seedPrivateWorkTestCandidateFromSource(candidate, sourceUrl, writeFailBucket, fetchImpl, 100),
  ).resolves.toEqual({ ok: false, error: 'r2-write-failed', status: 500 });

  const readbackThrowBucket = {
    get: async () => {
      throw new Error('r2 get failed');
    },
    put: async () => ({ body: null }),
  };
  await expect(
    seedPrivateWorkTestCandidateFromSource(
      candidate,
      sourceUrl,
      readbackThrowBucket,
      fetchImpl,
      100,
    ),
  ).resolves.toEqual({ ok: false, error: 'r2-readback-failed', status: 500 });

  const readbackMismatchBucket = {
    get: async () => ({
      body: null,
      size: 2,
      customMetadata: { sha256: candidate.expectedSha256 },
    }),
    put: async () => ({ body: null }),
  };
  await expect(
    seedPrivateWorkTestCandidateFromSource(
      candidate,
      sourceUrl,
      readbackMismatchBucket,
      fetchImpl,
      100,
    ),
  ).resolves.toEqual({ ok: false, error: 'r2-readback-failed', status: 500 });
});
