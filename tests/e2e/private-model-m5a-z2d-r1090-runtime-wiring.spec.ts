import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const legacyM5aZ2CandidateId = 'm5a-z2-absolute-z-host-floor-datum';
const legacyM5aZ2ReviewId = `${legacyM5aZ2CandidateId}-review`;
const runtimeFile = resolve(process.cwd(), 'src/pages/private-model/index.astro');
const workTestFile = resolve(process.cwd(), 'src/scripts/privateModelWorkTest.ts');
const runtimeHelperFile = resolve(process.cwd(), 'src/scripts/privateModelM5AZ2SystemReviewRuntime.ts');

test('R1090 work-test contract keeps the shared M5A-Z2 system review predicate inputs centralized', () => {
  const source = readFileSync(workTestFile, 'utf8');

  expect(source).toContain(`export const m5aZ2R1090CandidateId = '${candidateId}'`);
  expect(source).toContain('export const m5aZ2R1090ReviewId = `${m5aZ2R1090CandidateId}-review`;');
  expect(source).toContain(`export const m5aZ2LegacyCandidateId = '${legacyM5aZ2CandidateId}'`);
  expect(source).toContain('export const m5aZ2LegacyReviewId = `${m5aZ2LegacyCandidateId}-review`;');
  expect(source).toContain('export const m5aZ2SystemCandidateIds = new Set<string>([');
  expect(source).toContain('m5aZ2LegacyCandidateId,');
  expect(source).toContain('m5aZ2R1090CandidateId,');
  expect(source).toContain('export const m5aZ2SystemReviewIds = new Set<string>([');
  expect(source).toContain('m5aZ2LegacyReviewId,');
  expect(source).toContain('m5aZ2R1090ReviewId,');
  expect(source).toContain('export const isM5AZ2SystemReviewCandidateId = (candidateId: string) =>');
  expect(source).toContain('export const isM5AZ2SystemReviewId = (reviewId: string | null) =>');
  expect(source).toContain('[m5aZ2LegacyReviewId]: m5aZ2LegacyCandidateId,');
  expect(source).toContain('[m5aZ2R1090ReviewId]: m5aZ2R1090CandidateId,');
});

test('R1090 runtime helper resolves the shared M5A-Z2 system review request from the URL', () => {
  const source = readFileSync(runtimeHelperFile, 'utf8');

  expect(source).toContain("from './privateModelWorkTest';");
  expect(source).toContain('isM5AZ2SystemReviewId,');
  expect(source).toContain('m5aZ2LegacyReviewId,');
  expect(source).toContain('m5aZ2R1090ReviewId,');
  expect(source).toContain('export const m5aZ2SystemReviewRuntimeReviewIds = Object.freeze([');
  expect(source).toContain('m5aZ2LegacyReviewId,');
  expect(source).toContain('m5aZ2R1090ReviewId,');
  expect(source).toContain("const reviewQueryKey = 'review';");
  expect(source).toContain('export const getRequestedM5AZ2SystemReviewId = (search: string) =>');
  expect(source).toContain('return isM5AZ2SystemReviewId(reviewId) ? reviewId : null;');
  expect(source).toContain('export const getActiveM5AZ2SystemReviewId = (search: string) =>');
  expect(source).toContain('getRequestedM5AZ2SystemReviewId(search) ?? m5aZ2LegacyReviewId;');
  expect(source).toContain('export const isM5AZ2SystemReviewRequested = (search: string) =>');
});

test('R1090 reviewer entrypoint remains a short one-link review URL', () => {
  const url = new URL(`/private-model/?review=${reviewId}`, 'https://aapopihkala.fi');

  expect(url.href).toBe('https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review');
  expect(url.origin).toBe('https://aapopihkala.fi');
  expect(url.pathname).toBe('/private-model/');
  expect(Array.from(url.searchParams.keys())).toEqual(['review']);
  expect(url.searchParams.get('review')).toBe(reviewId);
  expect(url.hash).toBe('');
});

test('R1090 review activates the existing M5A-Z2 absolute-Z presentation runtime branch', () => {
  const source = readFileSync(runtimeFile, 'utf8');

  expect(source).toContain("prepareM5AZ2SystemReviewPresentation(fullModelScene)");
  expect(source).toContain("'Z2_ABSOLUTE_Z_SYSTEM'");
  const helperSource = readFileSync(runtimeHelperFile, 'utf8');
  expect(helperSource).toContain('m5aZ2LegacyCandidateId,');
  expect(helperSource).toContain('m5aZ2R1090CandidateId,');
  expect(helperSource).toContain('m5aZ2LegacyReviewId,');
  expect(helperSource).toContain('m5aZ2R1090ReviewId,');
  expect(source).toContain('privateModelM5AZ2SystemReviewRuntime');
  expect(source).toContain('getRequestedM5AZ2SystemCandidateId(window.location.search)');
  expect(source).toContain('isM5AZ2SystemReviewRequested(window.location.search)');
  expect(source).toContain('requestedM5aZ2SystemCandidateId === candidate.id');
  expect(source).toContain('getActiveM5AZ2SystemReviewId(window.location.search)');
  const routing = source.slice(source.indexOf('const requestedM5aZ2SystemCandidateId ='), source.indexOf('const isM5BCurrentReview ='));
  expect(routing).toContain('m5aDrainageReviewMode');
  expect(routing).toMatch(/isM5aZ2SystemReview\s*\?\s*'Z2_ABSOLUTE_Z_SYSTEM'/);

});

test('R1090 review exposes the active matched review id and ready state on the canvas', () => {
  const source = readFileSync(runtimeFile, 'utf8');

  expect(source).toContain('private-model-canvas');
  expect(source).toContain('dataset.workTestReviewMode');

  const reviewModeIndex = source.indexOf('dataset.workTestReviewMode');
  expect(reviewModeIndex).toBeGreaterThanOrEqual(0);

  const reviewModeWindow = source.slice(
    Math.max(0, reviewModeIndex - 900),
    Math.min(source.length, reviewModeIndex + 900),
  );

  expect(reviewModeWindow).toContain('m5aDrainageReviewMode');
  expect(reviewModeWindow).not.toContain('dataset.workTestReviewMode = m5aZ2ReviewId');
  expect(reviewModeWindow).toMatch(
    /dataset\.workTestReviewMode\s*=\s*(matchedM5aZ2SystemReviewId|activeM5aZ2SystemReviewId|requestedM5aZ2SystemReviewId|activeReviewId|reviewId|m5aZ2R1090ReviewId)/,
  );
  expect(reviewModeWindow).toContain('m5aZ2ReviewState');
  expect(reviewModeWindow).toContain("'ready'");
});
