import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_PUBLISH_PREFIX,
  PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
} from '../../worker/privateWorkTest';

test('M5A-Z2D diameter candidate is registered for bounded backend publish and readback', () => {
  const candidate = getPrivateWorkTestCandidateById('m5a-z2d-d100-d300-diameter');

  expect(candidate).toMatchObject({
    id: 'm5a-z2d-d100-d300-diameter',
    label: 'M5A-Z2D D100 pipes + D300/D315 wells - WORK_TEST',
    path: '/private-model/work-test/m5a-z2d-d100-d300-diameter.glb',
    objectKey: 'work-test/m5a-z2d-d100-d300-diameter.glb',
    expectedSize: 3_085_140,
    expectedSha256: '15047af6e2f7db2080f554d241d66625a6797f5e24ae737b19627ae1f4aa87fd',
  });

  expect(getPrivateWorkTestCandidate('/private-model/work-test/m5a-z2d-d100-d300-diameter.glb')).toBe(
    candidate,
  );
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}m5a-z2d-d100-d300-diameter.glb`)).toBe(
    candidate,
  );
  expect(getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}m5a-z2d-d100-d300-diameter.glb`)).toBe(
    candidate,
  );
});
