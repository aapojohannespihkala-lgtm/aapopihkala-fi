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

  const r1090RuntimeSelector = new RegExp(
    [
      'candidate\\.id\\s*===\\s*(?:m5aZ2R1090CandidateId|[\"\\\']m5a-z2d-r1090-well-top-ground-surface[\"\\\'])',
      '[\\s\\S]{0,360}',
      'isM5aZ2R1090SystemReviewRequested\\(\\)',
      '[\\s\\S]{0,360}',
      '\\?\\s*[\"\\\']Z2_ABSOLUTE_Z_SYSTEM[\"\\\']',
    ].join(''),
  );

  expect(privateModelIndexSource).toMatch(r1090RuntimeSelector);
});
