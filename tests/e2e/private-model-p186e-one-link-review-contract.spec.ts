import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  isPrivateModelReviewRequested,
} from '../../src/scripts/privateModelWorkTest';

const candidateId = 'p186e-x1-d2015-electrical-source-label-anchors-p28-corrected';
const reviewId = `${candidateId}-review`;
const canonicalReviewUrl = new URL(
  `https://aapopihkala.fi/private-model/?review=${reviewId}`,
);
const d2fReviewUrl = new URL(`${canonicalReviewUrl.href}&floor=d2f`);

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

const forbiddenPromotionParams = [
  'as-built',
  'asBuilt',
  'canonical',
  'current',
  'humanReview',
  'publishToCURRENT',
  'readyForHumanReview',
];

test('P186E electrical review URL is a canonical production one-link entrypoint', () => {
  expect(canonicalReviewUrl.origin).toBe('https://aapopihkala.fi');
  expect(canonicalReviewUrl.pathname).toBe('/private-model/');
  expect(canonicalReviewUrl.search).toBe(
    '?review=p186e-x1-d2015-electrical-source-label-anchors-p28-corrected-review',
  );
  expect([...canonicalReviewUrl.searchParams.keys()]).toEqual(['review']);
});

test('P186E optional D2F review variant only adds the floor selector', () => {
  expect(d2fReviewUrl.origin).toBe(canonicalReviewUrl.origin);
  expect(d2fReviewUrl.pathname).toBe(canonicalReviewUrl.pathname);
  expect(d2fReviewUrl.searchParams.get('review')).toBe(reviewId);
  expect(d2fReviewUrl.searchParams.get('floor')).toBe('d2f');
  expect([...d2fReviewUrl.searchParams.keys()]).toEqual(['review', 'floor']);
});

test('P186E review URLs do not depend on manual GLB transport', () => {
  for (const url of [canonicalReviewUrl, d2fReviewUrl]) {
    for (const paramName of forbiddenTransportParams) {
      expect(url.searchParams.has(paramName)).toBe(false);
    }
    expect(url.href).not.toContain('.glb');
    expect(url.href).not.toContain('/work-test/');
  }
});

test('P186E review URLs do not smuggle promotion or completed-review state', () => {
  for (const url of [canonicalReviewUrl, d2fReviewUrl]) {
    for (const paramName of forbiddenPromotionParams) {
      expect(url.searchParams.has(paramName)).toBe(false);
    }
    expect(url.href).not.toContain('READY_FOR_HUMAN_REVIEW');
    expect(url.href).not.toContain('HUMAN_REVIEW');
  }
});

test('P186E review URLs do not duplicate control parameters', () => {
  expect(canonicalReviewUrl.searchParams.getAll('review')).toEqual([reviewId]);
  expect(canonicalReviewUrl.searchParams.getAll('floor')).toEqual([]);
  expect(d2fReviewUrl.searchParams.getAll('review')).toEqual([reviewId]);
  expect(d2fReviewUrl.searchParams.getAll('floor')).toEqual(['d2f']);
});

test('P186E review URLs request the exact D electrical review id', () => {
  expect(isPrivateModelReviewRequested(canonicalReviewUrl.search, reviewId)).toBe(true);
  expect(isPrivateModelReviewRequested(d2fReviewUrl.search, reviewId)).toBe(true);
  expect(
    isPrivateModelReviewRequested(
      canonicalReviewUrl.search,
      `${candidateId}-different-review`,
    ),
  ).toBe(false);
});

test('P186E review parameter resolves the exact D electrical WORK_TEST candidate', () => {
  expect(getRequestedReviewCandidateId(canonicalReviewUrl.search)).toBe(candidateId);
  expect(getRequestedReviewCandidateId(d2fReviewUrl.search)).toBe(candidateId);
});
