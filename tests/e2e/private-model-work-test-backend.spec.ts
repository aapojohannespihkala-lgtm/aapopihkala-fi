import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_CANDIDATES,
  PRIVATE_WORK_TEST_CATALOG_PATH,
  PRIVATE_WORK_TEST_IMPORT_PATH,
  PRIVATE_WORK_TEST_UPLOAD_PREFIX,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestUploadCandidate,
  handlePrivateWorkTestRequest,
  isPrivateWorkTestObjectValid,
  isPrivateWorkTestPath,
  isTrustedPrivateWorkTestResolvedSourceUrl,
  isTrustedPrivateWorkTestSourceUrl,
  validatePrivateWorkTestUploadBytes,
} from '../../worker/privateWorkTest';
import type { PrivateModelEnv } from '../../worker/privateModel';

test('private WORK_TEST route matching is bounded to the dedicated prefix', () => {
  expect(isPrivateWorkTestPath('/private-model/work-test')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/catalog.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/import.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/upload/p143h-scalgo-label-axis.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p136b-d-current-wall-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p137j-d1f-user-current-doors.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/g3-locus-site-p06-axis-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p139n-federated-kvv-review.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p139ab-z-credible-wastewater-review.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143a-scalgo-terrain.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143f-scalgo-contours.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143g-scalgo-cartography.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143h-scalgo-label-axis.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143j-scalgo-label-flow.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p145b-1974-iv-section-worktargets.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p155cb-d-storage-roof.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p151c-whole-building-carrier.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p150fr-whole-building-substructure.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p150g-whole-building-end-plinth.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p156i-2017-kvv-main-presentation.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p154c-d-wall-cutouts.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p153c-d-stair-guard-lowwall.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-testing')).toBe(false);
  expect(isPrivateWorkTestPath('/private-model/model.glb')).toBe(false);
});

test('private WORK_TEST candidate allowlist exposes named review routes including P145B, P155C-B, P151C, P150F-R, P150G and P156I', () => {
  expect(PRIVATE_WORK_TEST_CANDIDATES).toHaveLength(19);

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

  const locus = PRIVATE_WORK_TEST_CANDIDATES[2];
  expect(locus.id).toBe('g3-locus-site-p06-axis-corrected');
  expect(locus.objectKey).toBe('work-test/g3-locus-site-p06-axis-corrected.glb');
  expect(locus.expectedSize).toBe(1_158_672);
  expect(locus.expectedSha256).toBe(
    '0b4549b160fadf9c6c15adc1fb04fc0c0b0f9b46e6e19b6844a55205356d7efb',
  );

  const p139n = PRIVATE_WORK_TEST_CANDIDATES[3];
  expect(p139n.id).toBe('p139n-federated-kvv-review');
  expect(p139n.objectKey).toBe('work-test/p139n-federated-kvv-review.glb');
  expect(p139n.expectedSize).toBe(1_193_724);
  expect(p139n.expectedSha256).toBe(
    'b713b9cc29b1e865dc7ca0b640589d9d1440cffe5e665297c6760745a149e515',
  );

  const p139ab = PRIVATE_WORK_TEST_CANDIDATES[4];
  expect(p139ab.id).toBe('p139ab-z-credible-wastewater-review');
  expect(p139ab.objectKey).toBe('work-test/p139ab-z-credible-wastewater-review.glb');
  expect(p139ab.expectedSize).toBe(1_199_352);
  expect(p139ab.expectedSha256).toBe(
    '6470e7c529546231725856e94c11203d86b1e66f0e6645bb36ce01aec2275159',
  );

  const p143a = PRIVATE_WORK_TEST_CANDIDATES[5];
  expect(p143a.id).toBe('p143a-scalgo-terrain');
  expect(p143a.objectKey).toBe('work-test/p143a-scalgo-terrain.glb');
  expect(p143a.expectedSize).toBe(1_352_620);
  expect(p143a.expectedSha256).toBe(
    '383e26a1ebbae28afa3caf3bbf614368574a5eca93db422b451369edac95961e',
  );

  const p143f = PRIVATE_WORK_TEST_CANDIDATES[6];
  expect(p143f.id).toBe('p143f-scalgo-contours');
  expect(p143f.objectKey).toBe('work-test/p143f-scalgo-contours.glb');
  expect(p143f.expectedSize).toBe(1_481_704);
  expect(p143f.expectedSha256).toBe(
    '2f0be722f43a0e47ad59f2c65e1f1449a6e5af51b80811e71f8a5dc9a28fbfb0',
  );

  const p143g = PRIVATE_WORK_TEST_CANDIDATES[7];
  expect(p143g.id).toBe('p143g-scalgo-cartography');
  expect(p143g.objectKey).toBe('work-test/p143g-scalgo-cartography.glb');
  expect(p143g.expectedSize).toBe(1_661_536);
  expect(p143g.expectedSha256).toBe(
    'fdde532b713249178111a9e830ebe6b52cf8a600b9f206fdc049abb072d55e02',
  );

  const p143h = PRIVATE_WORK_TEST_CANDIDATES[8];
  expect(p143h.id).toBe('p143h-scalgo-label-axis');
  expect(p143h.objectKey).toBe('work-test/p143h-scalgo-label-axis.glb');
  expect(p143h.expectedSize).toBe(1_673_484);
  expect(p143h.expectedSha256).toBe(
    '768972c522f63de0629020874f690b796b54f7c6d70125248d51f39b8d682c56',
  );

  const p143j = PRIVATE_WORK_TEST_CANDIDATES[9];
  expect(p143j.id).toBe('p143j-scalgo-label-flow');
  expect(p143j.objectKey).toBe('work-test/p143j-scalgo-label-flow.glb');
  expect(p143j.expectedSize).toBe(1_684_500);
  expect(p143j.expectedSha256).toBe(
    '4c2cea0eccff70754952750b12be7c24d150545feac0e17b3f86ebbb24c28578',
  );

  const p144c = PRIVATE_WORK_TEST_CANDIDATES[10];
  expect(p144c.id).toBe('p144c-g3-1974-iv-on-p143h');
  expect(p144c.objectKey).toBe('work-test/p144c-g3-1974-iv-on-p143h.glb');
  expect(p144c.expectedSize).toBe(1_720_068);
  expect(p144c.expectedSha256).toBe(
    '739e5cfed61edae7464af4edf77dfdf4c34354def6f88c993c2ca62f2c29ece1',
  );

  const p145b = PRIVATE_WORK_TEST_CANDIDATES[11];
  expect(p145b.id).toBe('p145b-1974-iv-section-worktargets');
  expect(p145b.objectKey).toBe('work-test/p145b-1974-iv-section-worktargets.glb');
  expect(p145b.expectedSize).toBe(1_732_508);
  expect(p145b.expectedSha256).toBe(
    '0d6754bde828bba9b7e78806c5ab8eac0a11a5077f43b8f3a5410f74e16c40e9',
  );

  const p155cb = PRIVATE_WORK_TEST_CANDIDATES[12];
  expect(p155cb.id).toBe('p155cb-d-storage-roof');
  expect(p155cb.objectKey).toBe('work-test/p155cb-d-storage-roof.glb');
  expect(p155cb.expectedSize).toBe(1_187_956);
  expect(p155cb.expectedSha256).toBe(
    '9adf08632a89b8a76540addd611e7d5b6a9be59b76b3e4e871621b6f624f7c82',
  );

  const p151c = PRIVATE_WORK_TEST_CANDIDATES[13];
  expect(p151c.id).toBe('p151c-whole-building-carrier');
  expect(p151c.objectKey).toBe('work-test/p151c-whole-building-carrier.glb');
  expect(p151c.expectedSize).toBe(1_913_540);
  expect(p151c.expectedSha256).toBe(
    '67581d3d4f4a444c182a89c56c09235a22e6055e7f9edd7d0d28a6960329b043',
  );

  const p150fr = getPrivateWorkTestCandidateById('p150fr-whole-building-substructure');
  expect(p150fr).toMatchObject({
    id: 'p150fr-whole-building-substructure',
    objectKey: 'work-test/p150fr-whole-building-substructure.glb',
    expectedSize: 1_919_860,
    expectedSha256: '13ca8995e873982a91d7fe1bd82eff97a3a09f9688507b2fa488244cca1b0e03',
  });

  const p150g = getPrivateWorkTestCandidateById('p150g-whole-building-end-plinth');
  expect(p150g).toMatchObject({
    id: 'p150g-whole-building-end-plinth',
    label: 'P150G whole-building end-plinth correction - WORK_TEST',
    path: '/private-model/work-test/p150g-whole-building-end-plinth.glb',
    objectKey: 'work-test/p150g-whole-building-end-plinth.glb',
    expectedSize: 1_986_004,
    expectedSha256: 'a17fdc1cbc29c4ecfcab3e94554b5ea5860c9a19db33e21f24c324acf70d6d89',
  });

  const p156i = getPrivateWorkTestCandidateById('p156i-2017-kvv-main-presentation');
  expect(p156i).toMatchObject({
    id: 'p156i-2017-kvv-main-presentation',
    objectKey: 'work-test/p156i-2017-kvv-main-presentation.glb',
    expectedSize: 1_848_532,
    expectedSha256: '072890e75cd693c05dc705d6a5581e999b9124d37d99aa914336c0a1d9b3ef3f',
  });

  const p154c = getPrivateWorkTestCandidateById('p154c-d-wall-cutouts');
  expect(p154c).toMatchObject({
    id: 'p154c-d-wall-cutouts',
    objectKey: 'work-test/p154c-d-wall-cutouts.glb',
    expectedSize: 1_535_172,
    expectedSha256: '0653be4435879acb479ca272dc8fd4a3c7299c863c0082797236d4c5c20167c0',
  });

  const p153c = getPrivateWorkTestCandidateById('p153c-d-stair-guard-lowwall');
  expect(p153c).toMatchObject({
    id: 'p153c-d-stair-guard-lowwall',
    objectKey: 'work-test/p153c-d-stair-guard-lowwall.glb',
    expectedSize: 1_743_512,
    expectedSha256: '03525ed32e75f721c90dee0a566abea2d00c742a5f4d29ec43c2b13fafe7ed94',
  });

  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    expect(getPrivateWorkTestCandidate(candidate.path)?.id).toBe(candidate.id);
    expect(getPrivateWorkTestCandidateById(candidate.id)?.path).toBe(candidate.path);
  }
  expect(getPrivateWorkTestCandidateById('not-allowlisted')).toBeNull();
  const p143hUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143h-scalgo-label-axis.glb`;
  expect(getPrivateWorkTestUploadCandidate(p143hUploadPath)?.id).toBe('p143h-scalgo-label-axis');
  const p143jUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143j-scalgo-label-flow.glb`;
  expect(getPrivateWorkTestUploadCandidate(p143jUploadPath)?.id).toBe('p143j-scalgo-label-flow');
  const p145bUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p145b-1974-iv-section-worktargets.glb`;
  expect(getPrivateWorkTestUploadCandidate(p145bUploadPath)?.id).toBe('p145b-1974-iv-section-worktargets');
  const p155cbUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p155cb-d-storage-roof.glb`;
  expect(getPrivateWorkTestUploadCandidate(p155cbUploadPath)?.id).toBe('p155cb-d-storage-roof');
  const p151cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p151c-whole-building-carrier.glb`;
  expect(getPrivateWorkTestUploadCandidate(p151cUploadPath)?.id).toBe('p151c-whole-building-carrier');
  const p150frUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p150fr-whole-building-substructure.glb`;
  expect(getPrivateWorkTestUploadCandidate(p150frUploadPath)?.id).toBe('p150fr-whole-building-substructure');
  const p150gUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p150g-whole-building-end-plinth.glb`;
  expect(getPrivateWorkTestUploadCandidate(p150gUploadPath)?.id).toBe('p150g-whole-building-end-plinth');
  const p156iUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p156i-2017-kvv-main-presentation.glb`;
  expect(getPrivateWorkTestUploadCandidate(p156iUploadPath)?.id).toBe('p156i-2017-kvv-main-presentation');
  const p154cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p154c-d-wall-cutouts.glb`;
  expect(getPrivateWorkTestUploadCandidate(p154cUploadPath)?.id).toBe('p154c-d-wall-cutouts');
  const p153cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p153c-d-stair-guard-lowwall.glb`;
  expect(getPrivateWorkTestUploadCandidate(p153cUploadPath)?.id).toBe('p153c-d-stair-guard-lowwall');
  expect(getPrivateWorkTestUploadCandidate(`${p143hUploadPath}/extra`)).toBeNull();
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}../model.glb`)).toBeNull();
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}not-allowlisted.glb`)).toBeNull();
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

test('private WORK_TEST direct upload validation requires exact size and SHA-256', async () => {
  const abc = new Uint8Array([0x61, 0x62, 0x63]).buffer;
  const expected = {
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };

  await expect(validatePrivateWorkTestUploadBytes(abc, expected)).resolves.toBeNull();
  await expect(
    validatePrivateWorkTestUploadBytes(abc, { ...expected, expectedSize: 4 }),
  ).resolves.toBe('upload-size-mismatch');
  await expect(
    validatePrivateWorkTestUploadBytes(abc, { ...expected, expectedSha256: '00'.repeat(32) }),
  ).resolves.toBe('upload-sha256-mismatch');
});

test('private WORK_TEST ingest accepts only signed oaiusercontent raw-file URLs', () => {
  const trusted =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=2026-09-29T10%3A00%3A00Z&sig=signature';

  expect(isTrustedPrivateWorkTestSourceUrl(trusted)).toBe(true);
  expect(
    isTrustedPrivateWorkTestResolvedSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw',
    ),
  ).toBe(true);
  expect(isTrustedPrivateWorkTestResolvedSourceUrl(trusted)).toBe(true);
  expect(
    isTrustedPrivateWorkTestResolvedSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com.evil.example/files/abc123/raw',
    ),
  ).toBe(false);
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

test('private WORK_TEST direct upload fails closed before R2 access without Access configuration', async () => {
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

  const candidate = PRIVATE_WORK_TEST_CANDIDATES.find(
    (entry) => entry.id === 'p143h-scalgo-label-axis',
  );
  expect(candidate).toBeTruthy();

  const response = await handlePrivateWorkTestRequest(
    new Request(
      `https://example.test${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143h-scalgo-label-axis.glb`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: new Uint8Array([1, 2, 3]),
      },
    ),
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
