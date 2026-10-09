import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_PUBLISH_PREFIX,
  PRIVATE_WORK_TEST_UPLOAD_PREFIX,
  PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestUploadCandidate,
  getPrivateWorkTestVerifyCandidate,
} from '../../worker/privateWorkTest';

const id = 'm5b-r1109-five-downspout-presence-zones';
const objectKey = 'work-test/m5b-r1109-five-downspout-presence-zones.glb';
const path = '/private-model/' + objectKey;
const expectedSha256 = '92275bb2ecf61054c0bb015d69800b85a899d11f9170a485ccbf62238373fc10';

test('M5B R1109 exact five-downspout WORK_TEST runtime identity is bounded and readback-ready', () => {
  const candidate = getPrivateWorkTestCandidateById(id);

  expect(candidate).toMatchObject({
    id,
    label: 'M5B R1109 five downspout presence zones - WORK_TEST',
    path,
    objectKey,
    expectedSize: 3_102_172,
    expectedSha256,
  });

  expect(getPrivateWorkTestCandidate(path)).toBe(candidate);
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}${id}.glb`)).toBe(candidate);

  // The R1109 zone-only successor does not replace the prior R1090 well-top candidate.
  expect(getPrivateWorkTestCandidateById('m5a-z2d-r1090-well-top-ground-surface')).toBeDefined();
  expect(getPrivateWorkTestCandidateById('m5b-roof-stormwater-current-planned')).toBeDefined();
});
