import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  isM5AZ2SystemReviewCandidateId,
  isM5AZ2SystemReviewId,
  m5aZ2D1036CandidateId,
  m5aZ2D1036ReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  getRequestedM5AZ2SystemCandidateId,
  getRequestedM5AZ2SystemReviewId,
  m5aZ2SystemReviewRuntimeCandidateIds,
  m5aZ2SystemReviewRuntimeReviewIds,
} from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';

test('M5A-Z2D diameter review is part of the guarded Z2 system route', () => {
  const search = `?review=${m5aZ2D1036ReviewId}`;

  expect(m5aZ2D1036CandidateId).toBe('m5a-z2d-d100-d300-diameter');
  expect(m5aZ2D1036ReviewId).toBe('m5a-z2d-d100-d300-diameter-review');
  expect(getRequestedReviewCandidateId(search)).toBe(m5aZ2D1036CandidateId);
  expect(isM5AZ2SystemReviewCandidateId(m5aZ2D1036CandidateId)).toBe(true);
  expect(isM5AZ2SystemReviewId(m5aZ2D1036ReviewId)).toBe(true);
  expect(getRequestedM5AZ2SystemCandidateId(search)).toBe(m5aZ2D1036CandidateId);
  expect(getRequestedM5AZ2SystemReviewId(search)).toBe(m5aZ2D1036ReviewId);
  expect(m5aZ2SystemReviewRuntimeCandidateIds).toContain(m5aZ2D1036CandidateId);
  expect(m5aZ2SystemReviewRuntimeReviewIds).toContain(m5aZ2D1036ReviewId);
});
