import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runtimeFile = resolve(process.cwd(), 'src/pages/private-model/index.astro');
const x2CandidateId = 'p186f-x2-d-themo-room-adjacent-work-assumption';
const x2ReviewId = `${x2CandidateId}-review`;

test('P186F-X2 uses one exact review URL without aliasing the legacy X1 candidate', () => {
  const url = new URL(`/private-model/?review=${x2ReviewId}`, 'https://aapopihkala.fi');
  expect(url.pathname).toBe('/private-model/');
  expect(Array.from(url.searchParams.keys())).toEqual(['review']);
  expect(url.searchParams.get('review')).toBe(x2ReviewId);

  const runtime = readFileSync(runtimeFile, 'utf8');
  expect(runtime).toContain(`const p186fX2CandidateId = '${x2CandidateId}';`);
  expect(runtime).toContain('const p186fX2ReviewId = `${p186fX2CandidateId}-review`;');
  expect(runtime).toContain('isPrivateModelReviewRequested(window.location.search, p186fX2ReviewId)');
  expect(runtime).toContain('candidate.id === p186fX2CandidateId && isP186fX2ThemoRoomReviewRequested()');
  expect(runtime).toContain("const p186fCandidateId = 'p186f-x1-d-themo-room-presentation';");
  expect(runtime).toContain('candidate.id === p186fCandidateId && isP186fThemoRoomReviewRequested()');
});

test('P186F-X2 activates the opt-in real D1F-wall presentation but never falsely promotes review', () => {
  const runtime = readFileSync(runtimeFile, 'utf8');
  const from = runtime.indexOf('const applyP186fReviewState =');
  const to = runtime.indexOf('const applyP186dReviewState =', from);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  const presentation = runtime.slice(from, to);
  expect(presentation).toContain("const isX2 = variant === 'X2';");
  expect(presentation).toContain('preferRealArchitectureContext: isX2');
  expect(presentation).toContain('presentation.expectedContextRenderableCount');
  expect(presentation).toContain('p186fRealWallContextReady: String(presentation.realArchitectureContextReady)');
  expect(presentation).toContain('p186fRealWallContextRenderableCount: String(presentation.realArchitectureContextRenderableCount)');
  expect(presentation).toContain('workTestReviewMode: isX2 ? p186fX2ReviewId : p186fReviewId');
  expect(presentation).toContain("p186fHumanReview: 'NOT_RUN'");
  expect(presentation).toContain("p186fCanonical: 'false'");
  expect(presentation).toContain("p186fPublishToCurrent: 'false'");
  expect(presentation).toContain("p186fCurrentClaim: 'false'");
  expect(presentation).toContain("p186fAsBuiltClaim: 'false'");
  expect(presentation).toContain('fallback room');
});

test('P186F-X2 uses its matched candidate-specific branch without changing the X1 view mode', () => {
  const runtime = readFileSync(runtimeFile, 'utf8');
  const loader = runtime.slice(runtime.indexOf('const isP186fThemoRoomReview ='), runtime.indexOf('const isP186dLightingReview ='));
  expect(loader).toContain('const isP186fX2ThemoRoomReview =');
  expect(loader).toContain('candidate.id === p186fX2CandidateId');
  expect(runtime).toContain('isP186fThemoRoomReview || isP186fX2ThemoRoomReview');
  expect(runtime).toContain("applyP186fReviewState(isP186fX2ThemoRoomReview ? 'X2' : 'X1')");
});
