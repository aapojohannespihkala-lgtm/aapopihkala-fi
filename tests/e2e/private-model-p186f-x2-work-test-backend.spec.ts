import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const p186fX2CandidateId = 'p186f-x2-d-themo-room-adjacent-work-assumption';
const p186fX2ReviewId = `${p186fX2CandidateId}-review`;

test('P186F-X2 backend work-test runtime allowlist exposes the exact successor', () => {
  const candidate = getPrivateWorkTestCandidateById(p186fX2CandidateId);

  expect(candidate).toMatchObject({
    id: p186fX2CandidateId,
    label: 'P186F-X2 D Themo room-adjacent work assumption - WORK_TEST',
    path: expect.stringContaining('/work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb'),
    objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  });
});

test('P186F-X2 one-link review id autoload maps to the published WORK_TEST candidate', () => {
  expect(getRequestedReviewCandidateId(`?review=${p186fX2ReviewId}`)).toBe(p186fX2CandidateId);
  expect(getRequestedReviewCandidateId(`?foo=bar&review=${p186fX2ReviewId}`)).toBe(p186fX2CandidateId);

  const candidate = getPrivateWorkTestCandidateById(
    getRequestedReviewCandidateId(`?review=${p186fX2ReviewId}`),
  );

  expect(candidate).toMatchObject({
    id: p186fX2CandidateId,
    path: '/private-model/work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  });
});
