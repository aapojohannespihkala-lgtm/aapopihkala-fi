import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;

test('M5A-Z2D R1090 conventional review id autoloads the exact well-top correction candidate', () => {
  expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(candidateId);
});

test('M5A-Z2D R1090 review id is the one-link candidate review route', () => {
  expect(reviewId).toBe('m5a-z2d-r1090-well-top-ground-surface-review');
});
