import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_CANDIDATES,
  PRIVATE_WORK_TEST_CATALOG_PATH,
  PRIVATE_WORK_TEST_IMPORT_PATH,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  handlePrivateWorkTestRequest,
  isPrivateWorkTestObjectValid,
  isPrivateWorkTestPath,
  isTrustedPrivateWorkTestSourceUrl,
} from '../../worker/privateWorkTest';
import type { PrivateModelEnv } from '../../worker/privateModel';

test('private WORK_TEST route matching is bounded to the dedicated prefix', () => {
  expect(isPrivateWorkTestPath('/private-model/work-test')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/catalog.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/import.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p136b-d-current-wall-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p137j-d1f-user-current-doors.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-testing')).toBe(false);
  expect(isPrivateWorkTestPath('/private-model/model.glb')).toBe(false);
});

test('private WORK_TEST candidate allowlist exposes only the named p136B and p137J routes', () => {
  expect(PRIVATE_WORK_TEST_CANDIDATES).toHaveLength(2);

  const p136b = PRIVATE_WORK_TEST_CANDIDATES[0];
  expect(p136b.id).toBe('p136b-d-current-wall-corrected');
  expect(p136b.objectKey).toBe('work-test/p136b-d-current-wall-corrected.glb');
  expect(p136b.expectedSize).toBe(1_149_768);
  expect(p136b.expectedSha256).toBe(
    '8a0f78f3f150f43fda65c93f9536594fe72d7713a6a6a946191e00b61cc4f4bf',
  );

  const p137j = PRIVATE_WORK_TEST_CANDIDATES[1];
  expect(p137j.id).toBe('p137j-d1f-user-current-doors');
  expect(p137j.objectKey).toBe('work-test/p137j-d1f-user-current-doors.glb');
  expect(p137j.expectedSize).toBe(1_154_364);
  expect(p137j.expectedSha256).toBe(
    '9e8a7286b1fbeb9730cf1a8ed358fbd07391c5cc7bb084320b30a4506b3186a4',
  );

  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    expect(getPrivateWorkTestCandidate(candidate.path)?.id).toBe(candidate.id);
    expect(getPrivateWorkTestCandidateById(candidate.id)?.path).toBe(candidate.path);
  }
  expect(getPrivateWorkTestCandidateById('not-allowlisted')).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/model.glb')).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/../model.glb')).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/p136b-d-current-wall-corrected.glb/extra')).toBeNull();
});

test('private WORK_TEST candidates require exact R2 size and SHA metadata before availability', () => {
  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize,
          customMetadata: { sha256: candidate.expectedSha256 },
        },
        candidate,
      ),
    ).toBe(true);

    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize + 1,
          customMetadata: { sha256: candidate.expectedSha256 },
        },
        candidate,
      ),
    ).toBe(false);

    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize,
          customMetadata: { sha256: '00'.repeat(32) },
        },
        candidate,
      ),
    ).toBe(false);

    expect(isPrivateWorkTestObjectValid({ size: candidate.expectedSize }, candidate)).toBe(false);
  }
});

test('private WORK_TEST ingest accepts only signed oaiusercontent raw-file URLs', () => {
  const trusted =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=2026-09-29T10%3A00%3A00Z&sig=signature';

  expect(isTrustedPrivateWorkTestSourceUrl(trusted)).toBe(true);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/not-raw?se=x&sig=y',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com.evil.example/files/abc123/raw?se=x&sig=y',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'http://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x&sig=y',
    ),
  ).toBe(false);
});

test('private WORK_TEST ingest fails closed before R2 access without Access configuration', async () => {
  let bucketReads = 0;
  let bucketWrites = 0;
  const env = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
      put: async () => {
        bucketWrites += 1;
        throw new Error('must not write');
      },
    },
  } as unknown as PrivateModelEnv;

  const response = await handlePrivateWorkTestRequest(
    new Request(`https://example.test${PRIVATE_WORK_TEST_IMPORT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: PRIVATE_WORK_TEST_CANDIDATES[0].id,
        sourceUrl:
          'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x&sig=y',
      }),
    }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(bucketReads).toBe(0);
  expect(bucketWrites).toBe(0);
});

test('private WORK_TEST catalog fails closed before R2 access without Access configuration', async () => {
  let bucketReads = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
    },
  };

  const response = await handlePrivateWorkTestRequest(
    new Request(`https://example.test${PRIVATE_WORK_TEST_CATALOG_PATH}`, { method: 'GET' }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(bucketReads).toBe(0);
});

test('private WORK_TEST backend rejects writes before auth or R2 access', async () => {
  let bucketReads = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
    },
  };

  const response = await handlePrivateWorkTestRequest(
    new Request('https://example.test/private-model/work-test/p136b-d-current-wall-corrected.glb', {
      method: 'POST',
    }),
    env,
  );

  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD');
  expect(bucketReads).toBe(0);
});
