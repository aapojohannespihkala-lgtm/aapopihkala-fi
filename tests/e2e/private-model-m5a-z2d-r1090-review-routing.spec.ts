import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const search = `?review=${reviewId}`;
const expectedPath = '/private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb';

test('M5A-Z2D R1090 review route resolves to the exact runtime WORK_TEST candidate', () => {
  const candidate = getPrivateWorkTestCandidateById(candidateId);

  expect(candidate).toMatchObject({
    id: candidateId,
    label: 'M5A-Z2D R1090 well-top ground-surface correction - WORK_TEST',
    path: expectedPath,
    objectKey: 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb',
    expectedSize: 3_089_152,
    expectedSha256: 'e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605',
  });

  expect(getRequestedReviewCandidateId(search)).toBe(candidateId);
});
