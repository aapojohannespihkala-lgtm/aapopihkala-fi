import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p184hApplianceOnP185cReviewId,
  p185cCandidateId,
  p185cReviewId,
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
