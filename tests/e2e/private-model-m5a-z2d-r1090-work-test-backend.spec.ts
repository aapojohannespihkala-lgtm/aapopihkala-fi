import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_PUBLISH_PREFIX,
  PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
} from '../../worker/privateWorkTest';

const id = 'm5a-z2d-r1090-well-top-ground-surface';
const objectKey = 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb';
const path = '/private-model/' + objectKey;

test('M5A-Z2D R1090 well-top ground-surface candidate is registered for bounded backend publish and readback', () => {
  const candidate = getPrivateWorkTestCandidateById(id);

  expect(candidate).toMatchObject({
    id,
    path,
    objectKey,
    expectedSize: 3_089_152,
    expectedSha256: 'e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605',
  });

  expect(getPrivateWorkTestCandidate(path)).toBe(candidate);
  expect(
    getPrivateWorkTestPublishCandidate(
      `${PRIVATE_WORK_TEST_PUBLISH_PREFIX}m5a-z2d-r1090-well-top-ground-surface.glb`,
    ),
  ).toBe(candidate);
  expect(
    getPrivateWorkTestVerifyCandidate(
      `${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}m5a-z2d-r1090-well-top-ground-surface.glb`,
    ),
  ).toBe(candidate);
  expect(getPrivateWorkTestCandidateById('m5a-z2d-d100-d300-diameter')).toBeDefined();
});
