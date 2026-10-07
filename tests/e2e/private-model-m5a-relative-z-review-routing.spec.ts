import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  m5aR3Z1cCandidateId,
  m5aR3Z1cReviewId,
  m5aR3Z1cSok1Sok2RelativeZReviewId,
} from '../../src/scripts/privateModelWorkTest';

test('SOK1-SOK2 relative-Z review id autoloads the exact existing Z1C candidate', () => {
  expect(m5aR3Z1cSok1Sok2RelativeZReviewId).toBe(
    'm5a-r3-z1c-sok1-sok2-relative-z-review',
  );
  expect(
    getRequestedReviewCandidateId(
      `?review=${m5aR3Z1cSok1Sok2RelativeZReviewId}`,
    ),
  ).toBe(m5aR3Z1cCandidateId);
});

test('dedicated relative-Z routing does not change the existing whole-system Z1C review route', () => {
  expect(getRequestedReviewCandidateId(`?review=${m5aR3Z1cReviewId}`)).toBe(
    m5aR3Z1cCandidateId,
  );
  expect(m5aR3Z1cSok1Sok2RelativeZReviewId).not.toBe(m5aR3Z1cReviewId);
});
