import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const privateModelIndexSource = readFileSync(
  join(process.cwd(), 'src/pages/private-model/index.astro'),
  'utf8',
);

const r1090CandidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const r1090ReviewId = `${r1090CandidateId}-review`;

test('R1090 review URL is wired to the M5A-Z2 presentation runtime state', () => {
  expect(privateModelIndexSource).toContain(r1090CandidateId);
  expect(privateModelIndexSource).toContain(r1090ReviewId);

  const r1090ReviewPredicate = new RegExp(
    [
      'const\\s+isM5aZ2SystemReviewRequested\\s*=\\s*\\(\\)\\s*=>',
      '[\\s\\S]{0,320}',
      'isPrivateModelReviewRequested\\(\\s*window\\.location\\.search,\\s*m5aZ2ReviewId\\s*,?\\s*\\)',
      '[\\s\\S]{0,120}',
      '\\|\\|',
      '[\\s\\S]{0,320}',
      'isPrivateModelReviewRequested\\(\\s*window\\.location\\.search,\\s*m5aZ2R1090ReviewId\\s*,?\\s*\\)',
    ].join(''),
  );

  const r1090RuntimeSelector = new RegExp(
    [
      '\\(\\s*candidate\\.id\\s*===\\s*m5aZ2CandidateId\\s*\\|\\|\\s*candidate\\.id\\s*===\\s*m5aZ2R1090CandidateId\\s*\\)',
      '[\\s\\S]{0,240}',
      'isM5aZ2SystemReviewRequested\\(\\)',
      '[\\s\\S]{0,180}',
      '\\?\\s*[\"\\\']Z2_ABSOLUTE_Z_SYSTEM[\"\\\']',
    ].join(''),
  );

  expect(privateModelIndexSource).toMatch(r1090ReviewPredicate);
  expect(privateModelIndexSource).toMatch(r1090RuntimeSelector);
});
