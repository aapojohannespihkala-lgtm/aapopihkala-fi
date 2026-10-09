import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const expectedDriveFileId = '13eciLeS58jwGLzy-TUhePIF7h7177zHj';
const expectedReviewUrl =
  'https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review';
const expectedReview = new URL(expectedReviewUrl);

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

const forbiddenReadyClaims = [
  'READY_FOR_HUMAN_REVIEW / PASS',
  'READY_FOR_HUMAN_REVIEW: PASS',
  'READY_FOR_HUMAN_REVIEW=PASS',
  'HUMAN_REVIEW / PASS',
  'HUMAN_REVIEW: PASS',
  'HUMAN_REVIEW=PASS',
];

const forbiddenLiveReadinessPassClaims = [
  'AUTHENTICATED_AUTOLOAD / PASS',
  'AUTHENTICATED_AUTOLOAD: PASS',
  'AUTHENTICATED_AUTOLOAD=PASS',
  'RENDER_VISIBILITY / PASS',
  'RENDER_VISIBILITY: PASS',
  'RENDER_VISIBILITY=PASS',
  'VISIBILITY_PROBE_REQUIRED / PASS',
  'USER_LIVE_RETRY_REQUIRED / PASS',
];

const forbiddenMergeCompletionClaims = [
  'MAIN_MERGE / PASS',
  'MAIN_MERGE: PASS',
  'MAIN_MERGE=PASS',
  'MERGE_COMPLETE / PASS',
  'MERGE_COMPLETE: PASS',
  'MERGE_COMPLETE=PASS',
  'PR_CLOSED / PASS',
  'PR_CLOSED: PASS',
  'PR_CLOSED=PASS',
  'PR_MERGED / PASS',
  'PR_MERGED: PASS',
  'PR_MERGED=PASS',
];

const docsPath = path.join(
  process.cwd(),
  'docs',
  'ylisrinne',
  'm5a-z2d-r1090-runtime-wiring-map.md',
);
const candidateMapPath = path.join(process.cwd(), '.github', 'work-test-candidates.json');

const docsContent = readFileSync(docsPath, 'utf8');
const workTestMap = JSON.parse(readFileSync(candidateMapPath, 'utf8')) as {
  candidates?: Record<string, { driveFileId?: string }>;
};

test('M5A-Z2D R1090 handoff stays aligned with the exact WORK_TEST source identity', () => {
  expect(workTestMap.candidates?.[candidateId]).toEqual({
    driveFileId: expectedDriveFileId,
  });

  expect(docsContent).toContain(candidateId);
  expect(docsContent).toContain(expectedDriveFileId);
  expect(docsContent).toContain(
    '3adf908ae64ff75a235823223f32b1cf36de16fb03321e75c8816dd16212739a',
  );
});

test('M5A-Z2D R1090/R1091 handoff records the current R1091 publish gate without false success', () => {
  expect(docsContent).toContain('## R1091 V5 publish/readback status');
  expect(docsContent).toContain('Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface');
  expect(docsContent).toContain('Run `37965098816` failed at the machine publish PUT with HTTP 422');
  expect(docsContent).toContain('runtime identity mismatch');
  expect(docsContent).toContain('retry only after the runtime identity patch and this contract-expectation refresh are merged and deployed');
});

test('M5A-Z2D R1090 handoff keeps the next gate at authenticated render visibility', () => {
  expect(docsContent).toContain('## Review/autoload gate');
  expect(docsContent).toContain(expectedReviewUrl);
  expect(docsContent).toContain('authenticated one-link live behavior');
  expect(docsContent).toContain('render the relevant R1090 well-top ground-surface correction');
  expect(docsContent).toContain('VISIBILITY_PROBE_REQUIRED');
  expect(docsContent).toContain('not `READY_FOR_HUMAN_REVIEW`');
});

test('M5A-Z2D R1090 review URL stays a one-link entrypoint without transport or promotion state', () => {
  expect(expectedReview.origin).toBe('https://aapopihkala.fi');
  expect(expectedReview.pathname).toBe('/private-model/');
  expect([...expectedReview.searchParams.keys()]).toEqual(['review']);
  expect(expectedReview.searchParams.get('review')).toBe(`${candidateId}-review`);

  for (const paramName of forbiddenTransportParams) {
    expect(expectedReview.searchParams.has(paramName)).toBe(false);
  }

  for (const paramName of forbiddenPromotionParams) {
    expect(expectedReview.searchParams.has(paramName)).toBe(false);
  }

  expect(expectedReview.href).not.toContain('.glb');
  expect(expectedReview.href).not.toContain('/work-test/');
  expect(expectedReview.href).not.toContain('READY_FOR_HUMAN_REVIEW');
  expect(expectedReview.href).not.toContain('HUMAN_REVIEW');
});

test('M5A-Z2D R1090 handoff keeps no-promotion boundaries explicit', () => {
  expect(docsContent).toContain('This mapping note does not change GLB bytes');
  expect(docsContent).toContain('publishToCURRENT');
  expect(docsContent).toContain('HUMAN_REVIEW');

  for (const claim of forbiddenReadyClaims) {
    expect(docsContent).not.toContain(claim);
  }

  for (const claim of forbiddenLiveReadinessPassClaims) {
    expect(docsContent).not.toContain(claim);
  }

  for (const claim of forbiddenMergeCompletionClaims) {
    expect(docsContent).not.toContain(claim);
  }
});

test('M5A-Z2D R1090 handoff no longer treats implementation or one-link wiring as the next patch', () => {
  expect(docsContent).not.toContain('Required next code patch');
  expect(docsContent).not.toContain('continue with the actual runtime allowlist patch');
  expect(docsContent).not.toContain('Build check run `37837733136` on vielä `in_progress`');
});
