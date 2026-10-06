import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  PRIVATE_SOURCE_REFERENCES,
  PRIVATE_SOURCE_REFERENCE_MACHINE_PUBLISH_PREFIX,
  PRIVATE_SOURCE_REFERENCE_MACHINE_VERIFY_PREFIX,
  PRIVATE_SOURCE_REFERENCE_PUBLISH_PREFIX,
  PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX,
  getPrivateSourceReference,
  getPrivateSourceReferenceById,
  getPrivateSourceReferencePublishTarget,
  getPrivateSourceReferenceVerifyTarget,
  isPrivateSourceReferenceObjectValid,
  isPrivateSourceReferencePath,
  sourceReferenceResponse,
  validatePrivateSourceReferenceBytes,
  writePrivateSourceReferenceFromRequest,
  type PrivateSourceReference,
} from '../../worker/privateSourceReference';

test('private source-reference routes stay bounded to exact allowlisted PDF paths', () => {
  expect(isPrivateSourceReferencePath('/private-model/source-reference')).toBe(true);
  expect(isPrivateSourceReferencePath('/private-model/source-reference/m5a-drainman.pdf')).toBe(true);
  expect(
    isPrivateSourceReferencePath(
      `${PRIVATE_SOURCE_REFERENCE_MACHINE_PUBLISH_PREFIX}m5a-drainman.pdf`,
    ),
  ).toBe(true);
  expect(
    isPrivateSourceReferencePath(
      `${PRIVATE_SOURCE_REFERENCE_MACHINE_VERIFY_PREFIX}m5a-drainman.pdf`,
    ),
  ).toBe(true);
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
    getPrivateSourceReferencePublishTarget(
      `${PRIVATE_SOURCE_REFERENCE_MACHINE_PUBLISH_PREFIX}m5a-drainman.pdf`,
    ),
  ).toEqual(reference);
  expect(
    getPrivateSourceReferenceVerifyTarget(
      `${PRIVATE_SOURCE_REFERENCE_VERIFY_PREFIX}m5a-drainman.pdf`,
    ),
  ).toEqual(reference);
  expect(
    getPrivateSourceReferenceVerifyTarget(
      `${PRIVATE_SOURCE_REFERENCE_MACHINE_VERIFY_PREFIX}m5a-drainman.pdf`,
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
    contentDisposition: 'inline; filename="unit-source.pdf"',
    cacheControl: 'private, no-store',
  });
});

test('private source-reference GET, HEAD and Range fallback expose stable private PDF headers', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\\nunit-response\\n');
  const reference: PrivateSourceReference = {
    id: 'unit-response',
    label: 'Unit response.pdf',
    path: '/private-model/source-reference/unit-response.pdf',
    objectKey: 'source-reference/unit-response.pdf',
    expectedSize: bytes.byteLength,
    expectedSha256: 'f'.repeat(64),
    contentType: 'application/pdf',
  };
  const object = {
    body: new Response(bytes).body,
    size: bytes.byteLength,
    etag: 'unit-etag',
    customMetadata: { sha256: reference.expectedSha256 },
  };
  const bucket = {
    async get(key: string) {
      return key === reference.objectKey
        ? { ...object, body: new Response(bytes).body }
        : null;
    },
    async put() {
      throw new Error('read-only HTTP regression must not write');
    },
  };

  const getResponse = await sourceReferenceResponse(
    new Request('https://example.test/private-model/source-reference/unit-response.pdf', {
      method: 'GET',
    }),
    bucket,
    reference,
  );
  expect(getResponse.status).toBe(200);
  expect(getResponse.headers.get('Content-Type')).toBe('application/pdf');
  expect(getResponse.headers.get('Content-Length')).toBe(String(bytes.byteLength));
  expect(getResponse.headers.get('Content-Disposition')).toBe(
    'inline; filename="unit-response.pdf"',
  );
  expect(getResponse.headers.get('Cache-Control')).toBe('private, no-store');
  expect(getResponse.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(getResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(getResponse.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
  expect(getResponse.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  expect(new Uint8Array(await getResponse.arrayBuffer())).toEqual(bytes);

  const headResponse = await sourceReferenceResponse(
    new Request('https://example.test/private-model/source-reference/unit-response.pdf', {
      method: 'HEAD',
    }),
    bucket,
    reference,
  );
  expect(headResponse.status).toBe(200);
  expect(headResponse.headers.get('Content-Type')).toBe(getResponse.headers.get('Content-Type'));
  expect(headResponse.headers.get('Content-Length')).toBe(
    getResponse.headers.get('Content-Length'),
  );
  expect(headResponse.headers.get('Content-Disposition')).toBe(
    getResponse.headers.get('Content-Disposition'),
  );
  expect((await headResponse.arrayBuffer()).byteLength).toBe(0);

  const rangeResponse = await sourceReferenceResponse(
    new Request('https://example.test/private-model/source-reference/unit-response.pdf', {
      method: 'GET',
      headers: { Range: 'bytes=0-4' },
    }),
    bucket,
    reference,
  );
  expect(rangeResponse.status).toBe(200);
  expect(rangeResponse.headers.get('Content-Length')).toBe(String(bytes.byteLength));
  expect(new Uint8Array(await rangeResponse.arrayBuffer())).toEqual(bytes);
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
  expect(publisher).toContain('/private-model/work-test/publish/source-reference-');
  expect(publisher).toContain('/private-model/work-test/verify/source-reference-');
  expect(publisher).toContain('Production source-reference byte-for-byte readback verified.');
});

test('worker routes source-reference requests before work-test and generic private-model handling', () => {
  const workerSource = readFileSync('worker/index.ts', 'utf8');
  const sourceRoute = workerSource.indexOf('isPrivateSourceReferencePath(url.pathname)');
  const workTestRoute = workerSource.indexOf('isPrivateWorkTestPath(url.pathname)');
  const genericRoute = workerSource.indexOf('isPrivateModelPath(url.pathname)');

  expect(sourceRoute).toBeGreaterThan(-1);
  expect(workTestRoute).toBeGreaterThan(sourceRoute);
  expect(genericRoute).toBeGreaterThan(workTestRoute);
});
