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
