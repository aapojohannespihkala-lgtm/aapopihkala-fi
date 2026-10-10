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
import {
  getRequestedReviewCandidateId,
  m5aR1115CandidateId,
  m5aR1115ReviewId,
  m5bR1109CandidateId,
  m5bR1109ReviewId,
} from '../../src/scripts/privateModelWorkTest';

const id = 'm5a-r1115-sok23-planned-raise-presence';
const objectKey = 'work-test/m5a-r1115-sok23-planned-raise-presence.glb';
const path = '/private-model/' + objectKey;
const expectedSha256 = '5dd97f9d6b1bd7c2c4c6e39920b5d8899178f01f6857effb05b7b38686cb534b';
const driveFileId = '1J8huAndqfZYG1DLRKwXE-SwobZfB2jBi';

test('R1115 two planned well-raise markers have exact source-pinned WORK_TEST machine routes', () => {
  const candidate = getPrivateWorkTestCandidateById(id);

  expect(candidate).toMatchObject({
    id,
    label: 'M5A R1115 planned SOK2/SOK3 well raise presence - WORK_TEST',
    path,
    objectKey,
    expectedSize: 3_108_436,
    expectedSha256,
  });
  expect(getPrivateWorkTestCandidate(path)).toBe(candidate);
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}${id}.glb`)).toBe(candidate);
});

test('R1115 one-link technical review points only to the new noncanonical candidate', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));

  expect(m5aR1115CandidateId).toBe(id);
  expect(m5aR1115ReviewId).toBe(`${id}-review`);
  expect(getRequestedReviewCandidateId(`?review=${m5aR1115ReviewId}`)).toBe(id);
  expect(registry.candidates[id]).toEqual({ driveFileId });

  // R1115 annotates a separate scene and does not retarget R1109 or R1090.
  expect(getRequestedReviewCandidateId(`?review=${m5bR1109ReviewId}`)).toBe(m5bR1109CandidateId);
  expect(getPrivateWorkTestCandidateById(m5bR1109CandidateId)).toBeDefined();
  expect(getPrivateWorkTestCandidateById('m5a-z2d-r1090-well-top-ground-surface')).toBeDefined();
});
