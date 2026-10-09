import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  m5bCandidateId,
  m5bCurrentReviewId,
  m5bR1109CandidateId,
  m5bR1109ReviewId,
} from '../../src/scripts/privateModelWorkTest';

test('M5B R1109 exact review identity resolves the persisted five-downspout candidate', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));

  expect(m5bR1109CandidateId).toBe('m5b-r1109-five-downspout-presence-zones');
  expect(m5bR1109ReviewId).toBe('m5b-r1109-five-downspout-presence-zones-review');
  expect(getRequestedReviewCandidateId(`?review=${m5bR1109ReviewId}`)).toBe(m5bR1109CandidateId);
  expect(registry.candidates[m5bR1109CandidateId]).toEqual({
    driveFileId: '1DKfV84-Jg786fHSBP4cyZC_B6hsdsaww',
  });
});

test('M5B R1109 routing does not retarget the legacy current review alias', () => {
  expect(getRequestedReviewCandidateId(`?review=${m5bCurrentReviewId}`)).toBe(m5bCandidateId);
  expect(m5bCandidateId).not.toBe(m5bR1109CandidateId);
});
