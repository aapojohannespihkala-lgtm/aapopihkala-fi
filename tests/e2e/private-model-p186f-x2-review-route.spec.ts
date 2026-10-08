import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const candidateId = 'p186f-x2-d-themo-room-adjacent-work-assumption';
const reviewId = `${candidateId}-review`;

test('P186F-X2 D Themo one-link review id resolves to the published WORK_TEST candidate', () => {
  const directResolvedCandidateId = getRequestedReviewCandidateId(`?review=${reviewId}`);

  expect(directResolvedCandidateId).toBe(candidateId);
  expect(getRequestedReviewCandidateId(`?foo=bar&review=${reviewId}`)).toBe(candidateId);

  if (directResolvedCandidateId === null) {
    throw new Error('P186F-X2 D Themo review id did not resolve to a WORK_TEST candidate');
  }

  const candidate = getPrivateWorkTestCandidateById(directResolvedCandidateId);

  expect(candidate).toMatchObject({
    id: candidateId,
    label: 'P186F-X2 D Themo room-adjacent work assumption - WORK_TEST',
    path: '/private-model/work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  });
});
