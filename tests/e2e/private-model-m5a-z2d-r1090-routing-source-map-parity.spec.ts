import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const mapPath = path.join(process.cwd(), '.github', 'work-test-candidates.json');
const workTestMap = JSON.parse(readFileSync(mapPath, 'utf8')) as {
  candidates?: Record<string, { driveFileId?: string }>;
};

test('M5A-Z2D R1090 review route and source map resolve the same candidate id', () => {
  expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(candidateId);
  expect(workTestMap.candidates?.[candidateId]).toEqual({
    driveFileId: '13eciLeS58jwGLzy-TUhePIF7h7177zHj',
  });
});
