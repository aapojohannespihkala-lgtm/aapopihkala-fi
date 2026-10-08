import { expect, test } from '@playwright/test';

import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const canonicalReviewUrl = new URL(
  `https://aapopihkala.fi/private-model/?review=${reviewId}`,
);

const forbiddenTransportParams = [
  'bootstrap',
  'file',
  'glb',
  'import',
  'model',
  'path',
  'source',
  'src',
  'upload',
];

test('M5A-Z2D R1090 review URL is a single canonical production link', () => {
  expect(canonicalReviewUrl.origin).toBe('https://aapopihkala.fi');
  expect(canonicalReviewUrl.pathname).toBe('/private-model/');
  expect(canonicalReviewUrl.search).toBe(
    '?review=m5a-z2d-r1090-well-top-ground-surface-review',
  );
  expect([...canonicalReviewUrl.searchParams.keys()]).toEqual(['review']);
});

test('M5A-Z2D R1090 review URL does not depend on manual GLB transport', () => {
  for (const paramName of forbiddenTransportParams) {
    expect(canonicalReviewUrl.searchParams.has(paramName)).toBe(false);
  }
  expect(canonicalReviewUrl.href).not.toContain('.glb');
  expect(canonicalReviewUrl.href).not.toContain('/work-test/');
});

test('M5A-Z2D R1090 review parameter resolves the published WORK_TEST candidate', () => {
  expect(getRequestedReviewCandidateId(canonicalReviewUrl.search)).toBe(candidateId);
});
