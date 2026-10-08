import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;

test('M5A-Z2D R1090 one-link review id resolves to the published WORK_TEST candidate', () => {
  const directResolvedCandidateId = getRequestedReviewCandidateId(`?review=${reviewId}`);

  expect(directResolvedCandidateId).toBe(candidateId);
  expect(getRequestedReviewCandidateId(`?foo=bar&review=${reviewId}`)).toBe(candidateId);

  if (directResolvedCandidateId === null) {
    throw new Error('M5A-Z2D R1090 review id did not resolve to a WORK_TEST candidate');
  }

  const candidate = getPrivateWorkTestCandidateById(directResolvedCandidateId);

  expect(candidate).toMatchObject({
    id: candidateId,
    label: 'M5A-Z2D R1090 well-top ground-surface correction - WORK_TEST',
    path: '/private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb',
    objectKey: 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb',
    expectedSize: 3_089_152,
    expectedSha256: 'e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605',
  });
});
