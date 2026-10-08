import { expect, test } from '@playwright/test';

import {
  m5aZ2ExpectedTargetKeys,
  m5aZ2ReviewCamera,
  m5aZ2ReviewContextOpacity,
  m5aZ2ReviewQuestionText,
  m5aZ2ReviewTargetOpacity,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const reviewUrl = new URL(`https://aapopihkala.fi/private-model/?review=${reviewId}`);

test('M5A-Z2D R1090 presentation contract targets the next render-visibility gate', () => {
  expect(reviewUrl.href).toBe(
    'https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review',
  );
  expect(reviewUrl.searchParams.get('review')).toBe(reviewId);

  expect(m5aZ2ReviewQuestionText).toContain('4 kaivoa');
  expect(m5aZ2ReviewQuestionText).toContain('7 reittiä');
  expect(m5aZ2ReviewQuestionText).toContain('2 ratkaisemattoman rajan markkeria');
  expect(m5aZ2ReviewQuestionText).toContain('HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE');
  expect(m5aZ2ReviewQuestionText).toContain('exact-Z- tai as-built-väite');
});

test('M5A-Z2D R1090 presentation contract keeps the target/context visibility hierarchy explicit', () => {
  expect(m5aZ2ReviewTargetOpacity).toBe(0.8);
  expect(m5aZ2ReviewContextOpacity).toBe(0.2);
  expect(m5aZ2ReviewCamera).toMatchObject({
    coordinateFrame: 'YLIS-G1-LOCAL',
    projection: 'PERSPECTIVE',
    controls: 'FREE_ORBIT',
    framing: 'TARGET_BOUNDS',
  });

  const wellTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('G2_DRAIN_WELL_'),
  );
  const routeTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('G2_DRAIN_LINK_'),
  );
  const boundaryTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('boundary:'),
  );

  expect(m5aZ2ExpectedTargetKeys).toHaveLength(13);
  expect(new Set(m5aZ2ExpectedTargetKeys).size).toBe(m5aZ2ExpectedTargetKeys.length);
  expect(wellTargets).toHaveLength(4);
  expect(routeTargets).toHaveLength(7);
  expect(boundaryTargets).toHaveLength(2);
});

test('M5A-Z2D R1090 empty-scene presentation readback keeps source limits visible', () => {
  const presentation = prepareM5AZ2SystemReviewPresentation({
    updateMatrixWorld: () => undefined,
    traverse: () => undefined,
  });

  expect(presentation.expectedTargetRenderableCount).toBe(m5aZ2ExpectedTargetKeys.length);
  expect(presentation.missingTargetKeys).toEqual([...m5aZ2ExpectedTargetKeys]);
  expect(presentation.reviewQuestionText).toBe(m5aZ2ReviewQuestionText);
  expect(presentation.reviewCamera).toBe(m5aZ2ReviewCamera);
  expect(presentation.sourceClassification).toBe(
    'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE / WORK_TEST / NOT_EXACT_Z / NOT_AS_BUILT',
  );
});
