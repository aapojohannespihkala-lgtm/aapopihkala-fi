import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const viewerSource = readFileSync(resolve(repoRoot, 'src/pages/private-model/index.astro'), 'utf8');

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = 'm5a-z2d-r1090-well-top-ground-surface-review';

test('M5A-Z2D R1090 review route is explicitly bound to the exact WORK_TEST candidate', () => {
  expect(viewerSource).toContain(`const m5aZ2dR1090CandidateId = '${candidateId}';`);
  expect(viewerSource).toContain(`const m5aZ2dR1090ReviewId = '${reviewId}';`);
  expect(viewerSource).toContain('candidate.id === m5aZ2dR1090CandidateId');
  expect(viewerSource).toContain(
    'isPrivateModelReviewRequested(window.location.search, m5aZ2dR1090ReviewId)',
  );
});
