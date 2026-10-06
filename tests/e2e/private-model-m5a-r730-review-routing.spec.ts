import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  m5aCurrentUseReviewQuestionText,
  m5aReviewQuestionText,
} from '../../src/scripts/privateModelM5AReviewPresentation';
import {
  getRequestedReviewCandidateId,
  m5aDrainageCandidateId,
  m5aDrainageReviewId,
  m5aR730CandidateId,
  m5aR730ReviewId,
} from '../../src/scripts/privateModelWorkTest';

test('R730 drainage review routing preserves legacy scope and current-use uncertainty', () => {
  expect(getRequestedReviewCandidateId(`?review=${m5aR730ReviewId}`)).toBe(m5aR730CandidateId);
  expect(getRequestedReviewCandidateId(`?review=${m5aDrainageReviewId}`)).toBe(
    m5aDrainageCandidateId,
  );

  expect(m5aCurrentUseReviewQuestionText).not.toBe(m5aReviewQuestionText);
  expect(m5aCurrentUseReviewQuestionText).toContain('koko salaojajärjestelmän');
  expect(m5aCurrentUseReviewQuestionText).toContain('CURRENT-käyttömallin');
  expect(m5aCurrentUseReviewQuestionText).toContain('neljä avointa rajapistettä');

  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(viewerSource).toContain('m5aR730CandidateId');
  expect(viewerSource).toContain('m5aR730ReviewId');
  expect(viewerSource).toContain("'CURRENT_USE_SYSTEM'");
  expect(viewerSource).toContain(
    "'DRAINAGE_SYSTEM_CURRENT_MODEL_USABILITY_WITH_UNCERTAINTY'",
  );
  expect(viewerSource).toContain('m5aReviewScope: mode');
  expect(viewerSource).toContain("m5aHumanReview: 'NOT_RUN'");
  expect(viewerSource).toContain("m5aCurrentClaim: 'false'");
  expect(viewerSource).toContain("m5aAsBuiltClaim: 'false'");
  expect(viewerSource).toContain("m5aCanonical: 'false'");
  expect(viewerSource).toContain("m5aPublishToCurrent: 'false'");
});
