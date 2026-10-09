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

const id = 'm5a-z2d-r1090-well-top-ground-surface';
const objectKey = 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb';
const path = '/private-model/' + objectKey;
const expectedSha256 = '3adf908ae64ff75a235823223f32b1cf36de16fb03321e75c8816dd16212739a';

test('M5A-Z2D R1090 runtime allowlist exposes the exact well-top ground-surface WORK_TEST candidate', () => {
  const candidate = getPrivateWorkTestCandidateById(id);

  expect(candidate).toMatchObject({
    id,
    label: 'M5A-Z2D R1090 well-top ground-surface correction - WORK_TEST',
    path,
    objectKey,
    expectedSize: 3_103_036,
    expectedSha256,
  });

  expect(getPrivateWorkTestCandidate(path)).toBe(candidate);
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}${id}.glb`)).toBe(
    candidate,
  );
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}${id}.glb`)).toBe(
    candidate,
  );
  expect(getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}${id}.glb`)).toBe(
    candidate,
  );

  expect(getPrivateWorkTestCandidateById('m5a-z2d-d100-d300-diameter')).toBeDefined();
});
