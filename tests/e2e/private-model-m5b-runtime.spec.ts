import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  assertM5BReviewPresentationReady,
  createM5BReviewRuntimeState,
  type M5BReviewPresentationResult,
} from '../../src/scripts/privateModelM5BReviewRuntime';
import {
  m5bCurrentTargetIds,
  m5bPlannedSok2TargetIds,
} from '../../src/scripts/privateModelM5BReviewPresentation';

const currentPresentation = (): M5BReviewPresentationResult => ({
  variant: 'CURRENT',
  sceneIndex: 60,
  targetRenderableCount: 2,
  contextRenderableCount: 11,
  suppressedCrossVariantCount: 2,
  semanticViolationCount: 0,
  foundTargetIds: [...m5bCurrentTargetIds],
  missingTargetIds: [],
});

const plannedPresentation = (): M5BReviewPresentationResult => ({
  variant: 'PLANNED_SOK2_COMPARISON',
  sceneIndex: 61,
  targetRenderableCount: 2,
  contextRenderableCount: 12,
  suppressedCrossVariantCount: 1,
  semanticViolationCount: 0,
  foundTargetIds: [...m5bPlannedSok2TargetIds],
  missingTargetIds: [],
});

test('M5B CURRENT runtime state binds scene60, exact targets, 80/20 and no-promotion metadata', () => {
  const state = createM5BReviewRuntimeState('CURRENT', currentPresentation());

  expect(state.standardViewPreset).toBe('whole-building');
  expect(state.dataset.workTestReviewMode).toBe(
    'm5b-roof-stormwater-current-review',
  );
  expect(state.dataset.m5bReviewQuestion).toBe(
    'ROOF_STORMWATER_CURRENT_ROUTE_RELATION',
  );
  expect(state.dataset.m5bSceneIndex).toBe('60');
  expect(state.dataset.m5bTargetG2Ids).toBe(m5bCurrentTargetIds.join(','));
  expect(state.dataset.m5bReviewTargetOpacity).toBe('0.80');
  expect(state.dataset.m5bReviewContextOpacity).toBe('0.20');
  expect(state.dataset.m5bExactXYClaim).toBe('false');
  expect(state.dataset.m5bExactZClaim).toBe('false');
  expect(state.dataset.m5bPhysicalRouteClaim).toBe('false');
  expect(state.dataset.m5bCurrentGeometryClaim).toBe('false');
  expect(state.dataset.m5bAsBuiltClaim).toBe('false');
  expect(state.dataset.m5bCanonical).toBe('false');
  expect(state.dataset.m5bPublishToCurrent).toBe('false');
  expect(state.dataset.m5bHumanReview).toBe('NOT_RUN');
  expect(state.dataset.m5bReviewCameraMode).toBe('PERSPECTIVE_FREE_ORBIT');
});

test('M5B PLANNED runtime state binds scene61 and only planned SOK2 targets', () => {
  const state = createM5BReviewRuntimeState(
    'PLANNED_SOK2_COMPARISON',
    plannedPresentation(),
  );

  expect(state.dataset.workTestReviewMode).toBe(
    'm5b-roof-stormwater-planned-sok2-comparison-review',
  );
  expect(state.dataset.m5bReviewQuestion).toBe(
    'ROOF_STORMWATER_PLANNED_SOK2_COMPARISON_RELATION',
  );
  expect(state.dataset.m5bSceneIndex).toBe('61');
  expect(state.dataset.m5bTargetG2Ids).toBe(m5bPlannedSok2TargetIds.join(','));
  expect(state.dataset.m5bReviewSuppressedCrossVariantCount).toBe('1');
  expect(state.statusText).toContain('scene 61');
});

test('M5B runtime readiness rejects missing targets and semantic promotion violations', () => {
  const missing = currentPresentation();
  missing.targetRenderableCount = 1;
  missing.foundTargetIds = [m5bCurrentTargetIds[0]];
  missing.missingTargetIds = [m5bCurrentTargetIds[1]];

  expect(() => assertM5BReviewPresentationReady('CURRENT', missing)).toThrow(
    /target count mismatch/,
  );

  const promoted = plannedPresentation();
  promoted.semanticViolationCount = 1;
  expect(() =>
    assertM5BReviewPresentationReady('PLANNED_SOK2_COMPARISON', promoted),
  ).toThrow(/no-promotion semantic violations/);
});

test('M5B runtime readiness rejects cross-variant or wrong-scene presentation results', () => {
  expect(() =>
    assertM5BReviewPresentationReady('CURRENT', plannedPresentation()),
  ).toThrow(/variant mismatch/);

  const wrongScene = currentPresentation();
  wrongScene.sceneIndex = 61;
  expect(() =>
    assertM5BReviewPresentationReady('CURRENT', wrongScene),
  ).toThrow(/scene mismatch/);
});

test('M5B runtime is wired into the private viewer with scene selection, cleanup and no-promotion state', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');

  expect(source).toContain('const isM5BCurrentReview =');
  expect(source).toContain('const isM5BPlannedSok2ComparisonReview =');
  expect(source).toContain('const reviewScene = gltf.scenes?.[sceneIndex];');
  expect(source).toContain('prepareM5BReviewPresentation(reviewScene, variant)');
  expect(source).toContain(
    'm5bRuntimeState = createM5BReviewRuntimeState(variant, presentation);',
  );
  expect(source).toContain('clearM5BReviewState();');
  expect(source).toContain('Object.assign(canvas.dataset, m5bRuntimeState.dataset);');
  expect(source).toContain('applyStandardViewPreset(m5bRuntimeState.standardViewPreset);');
});
