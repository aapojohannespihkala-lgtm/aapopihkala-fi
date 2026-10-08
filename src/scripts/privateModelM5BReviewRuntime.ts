import {
  m5bCurrentReviewId,
  m5bPlannedSok2ComparisonReviewId,
} from './privateModelWorkTest';
import {
  getM5BReviewSceneIndex,
  m5bCurrentTargetIds,
  m5bPlannedSok2TargetIds,
  m5bReviewContextOpacity,
  m5bReviewTargetOpacity,
  type M5BReviewVariant,
} from './privateModelM5BReviewPresentation';

export type M5BReviewPresentationResult = {
  variant: M5BReviewVariant;
  sceneIndex: number;
  targetRenderableCount: number;
  contextRenderableCount: number;
  suppressedCrossVariantCount: number;
  semanticViolationCount: number;
  foundTargetIds: string[];
  missingTargetIds: readonly string[];
  questionScope: string;
  downspoutContext: string;
  targetMeanings: string[];
};

export type M5BReviewRuntimeState = {
  dataset: Record<string, string>;
  statusText: string;
  standardViewPreset: 'whole-building';
};

const configByVariant = {
  CURRENT: {
    reviewId: m5bCurrentReviewId,
    question: 'ROOF_STORMWATER_CURRENT_ROUTE_RELATION',
    targetIds: m5bCurrentTargetIds,
    statusLabel: 'M5B roof stormwater current route',
    clarityLabel:
      '5 syöksyränniä: 4 nurkkaa + eteläjulkisivu C-B; sininen = rajattu WORK_TEST-stubi, ei koko todistettu putkilinja',
  },
  PLANNED_SOK2_COMPARISON: {
    reviewId: m5bPlannedSok2ComparisonReviewId,
    question: 'ROOF_STORMWATER_PLANNED_SOK2_COMPARISON_RELATION',
    targetIds: m5bPlannedSok2TargetIds,
    statusLabel: 'M5B roof stormwater planned SOK2 comparison',
    clarityLabel:
      'planned SOK2 on vertailuesitys; nykyhavaintokonteksti on 5 syöksyränniä, ei toteuma-/tilausväite',
  },
} as const;

const targetIdsEqual = (
  expected: readonly string[],
  actual: readonly string[],
) =>
  expected.length === actual.length &&
  expected.every((id) => actual.includes(id));

export const assertM5BReviewPresentationReady = (
  variant: M5BReviewVariant,
  presentation: M5BReviewPresentationResult,
) => {
  const expectedSceneIndex = getM5BReviewSceneIndex(variant);
  const expectedTargetIds = configByVariant[variant].targetIds;

  if (presentation.variant !== variant) {
    throw new Error(
      `M5B review variant mismatch: expected ${variant}, got ${presentation.variant}`,
    );
  }
  if (presentation.sceneIndex !== expectedSceneIndex) {
    throw new Error(
      `M5B review scene mismatch: expected ${expectedSceneIndex}, got ${presentation.sceneIndex}`,
    );
  }
  if (presentation.targetRenderableCount !== expectedTargetIds.length) {
    throw new Error(
      `M5B review target count mismatch: expected ${expectedTargetIds.length}, got ${presentation.targetRenderableCount}`,
    );
  }
  if (presentation.missingTargetIds.length !== 0) {
    throw new Error(
      `M5B review targets missing: ${presentation.missingTargetIds.join(',')}`,
    );
  }
  if (!targetIdsEqual(expectedTargetIds, presentation.foundTargetIds)) {
    throw new Error('M5B review target identity mismatch');
  }
  if (presentation.semanticViolationCount !== 0) {
    throw new Error(
      `M5B review no-promotion semantic violations: ${presentation.semanticViolationCount}`,
    );
  }
  if (!presentation.questionScope?.trim()) {
    throw new Error('M5B review question scope missing');
  }
  if (!presentation.downspoutContext?.includes('5 syöksyränniä')) {
    throw new Error('M5B review five-downspout context missing');
  }
  if (presentation.targetMeanings.length !== expectedTargetIds.length) {
    throw new Error(
      `M5B review target meaning count mismatch: expected ${expectedTargetIds.length}, got ${presentation.targetMeanings.length}`,
    );
  }
};

export const createM5BReviewRuntimeState = (
  variant: M5BReviewVariant,
  presentation: M5BReviewPresentationResult,
): M5BReviewRuntimeState => {
  assertM5BReviewPresentationReady(variant, presentation);

  const config = configByVariant[variant];
  const targetIds = config.targetIds;
  const sceneIndex = getM5BReviewSceneIndex(variant);

  return {
    standardViewPreset: 'whole-building',
    dataset: {
      workTestReviewMode: config.reviewId,
      m5bReviewVariant: variant,
      m5bReviewQuestion: config.question,
      m5bReviewQuestionScope: presentation.questionScope,
      m5bDownspoutContext: presentation.downspoutContext,
      m5bReviewTargetMeanings: presentation.targetMeanings.join(' | '),
      m5bReviewClarityLabel: config.clarityLabel,
      m5bSceneIndex: String(sceneIndex),
      m5bTargetG2Ids: targetIds.join(','),
      m5bReviewTargetOpacity: m5bReviewTargetOpacity.toFixed(2),
      m5bReviewContextOpacity: m5bReviewContextOpacity.toFixed(2),
      m5bReviewTargetRenderableCount: String(
        presentation.targetRenderableCount,
      ),
      m5bReviewContextRenderableCount: String(
        presentation.contextRenderableCount,
      ),
      m5bReviewSuppressedCrossVariantCount: String(
        presentation.suppressedCrossVariantCount,
      ),
      m5bExactXYClaim: 'false',
      m5bExactZClaim: 'false',
      m5bPhysicalRouteClaim: 'false',
      m5bCurrentGeometryClaim: 'false',
      m5bAsBuiltClaim: 'false',
      m5bCanonical: 'false',
      m5bPublishToCurrent: 'false',
      m5bHumanReview: 'NOT_RUN',
      m5bReviewCameraMode: 'PERSPECTIVE_FREE_ORBIT',
      standardViewPreset: 'whole-building',
    },
    statusText:
      `${config.statusLabel} - WORK_TEST / targets 80 % / context 20 % / scene ${sceneIndex} / ${config.clarityLabel} / HUMAN_REVIEW NOT_RUN`,
  };
};
