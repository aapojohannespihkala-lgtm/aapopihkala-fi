import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p184hApplianceOnP185cReviewId,
  p185cCandidateId,
  p185cReviewId,
  p185cX2CandidateId,
  p185cX2ReviewId,
} from '../../src/scripts/privateModelWorkTest';

test('P185C persisted overlay stays registered but its orientation-invalid position review alias is blocked', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[p185cCandidateId]).toEqual({
    driveFileId: '1_w5gLNffz7DaAlZt_IcvQNV8TYKzdIn1',
  });
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBeNull();
  expect(getRequestedReviewCandidateId(`?review=${p184hApplianceOnP185cReviewId}`)).toBe(
    p185cCandidateId,
  );
});

test('P185C review identifier remains reserved for the invalidated historical route', () => {
  expect(p185cCandidateId).toBe('p185c-d2015-electrical-source-overlay');
  expect(p185cReviewId).toBe('p185c-d2015-electrical-source-overlay-review');
});


test('P185C-X2 corrected overlay owns a distinct review route while historical P185C stays blocked', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(p185cX2CandidateId).toBe('p185c-x2-d2015-electrical-source-overlay-p28-corrected');
  expect(p185cX2ReviewId).toBe('p185c-x2-d2015-electrical-source-overlay-p28-corrected-review');
  expect(registry.candidates[p185cX2CandidateId]).toEqual({
    driveFileId: '1EQSaRlpgvUFGEWG9fmTiKwFuKwrUlyA6',
  });
  expect(getRequestedReviewCandidateId(`?review=${p185cX2ReviewId}`)).toBe(p185cX2CandidateId);
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBeNull();
});
