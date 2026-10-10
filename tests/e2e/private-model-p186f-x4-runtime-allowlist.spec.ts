import { readFileSync } from 'node:fs';
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
import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';

const id = 'p186f-x4-d-themo-door-plan-clear-work-assumption';
const reviewId = `${id}-review`;
const objectKey = `work-test/${id}.glb`;
const path = `/private-model/${objectKey}`;
const expectedSha256 = '3089d0f58c23044aa5606d6e8a3306e8dcacaddbcc38961fa22a240e345fbb9f';
const driveFileId = '1AgV43pyhDcJbdni-wB6mFsMBvfh8ITHt';

test('P186F-X4 exact persisted source has bounded WORK_TEST machine routes', () => {
  const candidate = getPrivateWorkTestCandidateById(id);

  expect(candidate).toMatchObject({
    id,
    label: 'P186F-X4 D Themo door-plan-clear work assumption - WORK_TEST',
    path,
    objectKey,
    expectedSize: 3_228_624,
    expectedSha256,
  });
  expect(getPrivateWorkTestCandidate(path)).toBe(candidate);
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}${id}.glb`)).toBe(candidate);
});

test('P186F-X4 conventional one-link review identity is exact and does not retarget X2', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));

  expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(id);
  expect(registry.candidates[id]).toEqual({ driveFileId });

  const x2 = getPrivateWorkTestCandidateById('p186f-x2-d-themo-room-adjacent-work-assumption');
  expect(x2).toMatchObject({
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  });
});
