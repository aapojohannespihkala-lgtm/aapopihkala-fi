import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  PRIVATE_SOURCE_REFERENCES,
  PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX,
  PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX,
  getPrivateSourceReference,
  getPrivateSourceReferenceById,
  getPrivateSourceReferencePublishTarget,
  getPrivateSourceReferenceVerifyTarget,
  isPrivateSourceReferenceObjectValid,
  isPrivateSourceReferencePath,
  validatePrivateSourceReferenceBytes,
  writePrivateSourceReferenceFromRequest,
  type PrivateSourceReference,
} from '../../worker/privateSourceReference';

test('private source-reference routes stay bounded to exact allowlisted PDF paths', () => {
  expect(isPrivateSourceReferencePath('/private-model/source-reference')).toBe(true);
  expect(isPrivateSourceReferencePath('/private-model/source-reference/m5a-drainman.pdf')).toBe(true);
  expect(isPrivateSourceReferencePath('/private-model/work-test/m5a-drain-topology.glb')).toBe(false);

  const reference = getPrivateSourceReferenceById('m5a-drainman');
  expect(reference).toMatchObject({
    id: 'm5a-drainman',
    label: 'Salaojapiirros Drainman.pdf',
    path: '/private-model/source-reference/m5a-drainman.pdf',
    objectKey: 'source-reference/m5a-drainman.pdf',
    expectedSize: 1_132_069,
    expectedSha256: '963bcc1a3a1492a965a7842d8a409d062d8de091d4c8177cf7114c91b359a2c7',
    contentType: 'application/pdf',
  });
  expect(PRIVATE_SOURCE_REFERENCES).toHaveLength(1);
  expect(getPrivateSourceReference(reference!.path)).toEqual(reference);
  expect(
    getPrivateSourceReferencePublishTarget(
      `${PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX}m5a-drainman.pdf`,
    ),
  ).toEqual(reference);
  expect(
    getPrivateSourceReferenceVerifyTarget(
      `${PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX}m5a-drainman.pdf`,
    ),
  ).toEqual(reference);
  expect(
    getPrivateSourceReferencePublishTarget(
      `${PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX}m5a-drainman.glb`,
    ),
  ).toBeNull();
});

test('private source-reference exact byte validator checks both size and SHA-256', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\nunit-test\n');
  const exact = {
    expectedSize: 19,
    expectedSha256: 'c79ac69c50f14fed23d3ce237d029e9b1f666273a1120e9eb6f09351e2662e33',
  };

  expect(await validatePrivateSourceReferenceBytes(bytes.buffer as ArrayBuffer, exact)).toBeNull();
  expect(
    await validatePrivateSourceReferenceBytes(bytes.buffer as ArrayBuffer, {
      ...exact,
      expectedSize: 18,
    }),
  ).toBe('source-size-mismatch');
  expect(
    await validatePrivateSourceReferenceBytes(bytes.buffer as ArrayBuffer, {
      ...exact,
      expectedSha256: '0'.repeat(64),
    }),
  ).toBe('source-sha256-mismatch');
});

test('private source-reference write stores validated PDF with private inline R2 metadata', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\nunit-test\n');
  const reference: PrivateSourceReference = {
    id: 'unit-source',
    label: 'Unit source.pdf',
    path: '/private-model/source-reference/unit-source.pdf',
    objectKey: 'source-reference/unit-source.pdf',
    expectedSize: 19,
    expectedSha256: 'c79ac69c50f14fed23d3ce237d029e9b1f666273a1120e9eb6f09351e2662e33',
    contentType: 'application/pdf',
  };

  const stored = new Map<string, any>();
  const bucket = {
    async get(key: string) {
      return stored.get(key) ?? null;
    },
    async put(
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
    ) {
      const object = {
        body: new Response(value).body,
        size: value.byteLength,
        customMetadata: options.customMetadata,
        httpMetadata: options.httpMetadata,
      };
      stored.set(key, object);
      return object;
    },
  };

  const request = new Request('https://example.test/private-model/source-reference/publish/unit-source.pdf', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.byteLength),
    },
    body: bytes,
  });

  const result = await writePrivateSourceReferenceFromRequest(request, bucket, reference);
  expect(result).toEqual({ ok: true, alreadyReady: false });

  const object = stored.get(reference.objectKey);
  expect(isPrivateSourceReferenceObjectValid(object, reference)).toBe(true);
  expect(object.httpMetadata).toEqual({
    contentType: 'application/pdf',
    contentDisposition: 'inline; filename="m5a-drainman.pdf"',
    cacheControl: 'private, no-store',
  });
});

test('source-reference registry and publisher workflow bind the exact canonical Drive PDF identity', () => {
  const registry = JSON.parse(
    readFileSync('.github/source-reference-candidates.json', 'utf8'),
  ) as {
    version: number;
    references: Record<string, {
      driveFileId: string;
      expectedSize: number;
      expectedSha256: string;
      path: string;
    }>;
  };
  const source = registry.references['m5a-drainman'];

  expect(registry.version).toBe(1);
  expect(source).toEqual({
    driveFileId: '1KZhDDXnI5MsO4wNWzRwYCaGNQuOo0TCC',
    expectedSize: 1_132_069,
    expectedSha256: '963bcc1a3a1492a965a7842d8a409d062d8de091d4c8177cf7114c91b359a2c7',
    path: '/private-model/source-reference/m5a-drainman.pdf',
  });

  const publisher = readFileSync('.github/workflows/publish-source-reference.yml', 'utf8');
  expect(publisher).toContain('google-github-actions/auth@v3');
  expect(publisher).toContain('https://www.googleapis.com/auth/drive.readonly');
  expect(publisher).toContain('Content-Type: application/pdf');
  expect(publisher).toContain('source-reference/verify');
  expect(publisher).toContain('Production source-reference byte-for-byte readback verified.');
});

test('worker routes source-reference requests before generic private-model asset handling', () => {
  const workerSource = readFileSync('worker/index.ts', 'utf8');
  const sourceRoute = workerSource.indexOf('isPrivateSourceReferencePath(url.pathname)');
  const genericRoute = workerSource.indexOf('isPrivateModelPath(url.pathname)');

  expect(sourceRoute).toBeGreaterThan(-1);
  expect(genericRoute).toBeGreaterThan(sourceRoute);
});
