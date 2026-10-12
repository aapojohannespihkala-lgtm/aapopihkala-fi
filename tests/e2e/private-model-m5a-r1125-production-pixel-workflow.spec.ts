import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// This is a workflow-contract regression, NOT authenticated production proof.
// The authenticated runtime scene63 and 13 original source/camera projections
// are a mandatory separate release input.
const workflow = readFileSync(resolve(
  process.cwd(), '.github/workflows/private-model-production-review-smoke.yml',
), 'utf8');
const reviewId = 'm5a-r1125-pvk-diameter-source-split-review';
const candidateId = 'm5a-r1125-pvk-diameter-source-split';

test('R1125 production pixel verifier is scoped to its exact review/candidate pair', () => {
  expect(workflow).toContain("reviewId === '" + reviewId + "'");
  expect(workflow).toContain("candidateId === '" + candidateId + "'");
  expect(workflow).toContain('if (isR1125SourceReview) {');
  expect(workflow).toContain('buildM5AR1125BrowserScreenshotProofExpression(');
  expect(workflow).toContain('m5aR1125PixelEvidence.allSourceTargetsVisible !== true');
  expect(workflow).toContain('m5aR1125PixelEvidence.sourceRoiPixels?.length !== 13');
  expect(workflow).toContain('m5aR1125PixelEvidence.ambiguousSourceKeys?.length !== 0');
  expect(workflow).toContain('m5aR1125PixelEvidence.missingKeys?.length !== 0');
  expect(workflow).toContain('m5a-r1125-source-13-pixels.json');
});

test('R1125 requires the actual viewer scene63 projections and rejects substitutes', () => {
  expect(workflow).toContain("d.m5aR1125SourceDriveId !== '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs'");
  expect(workflow).toContain("d.m5aR1125SourceContract !== 'G2_R1125'");
  expect(workflow).toContain("d.m5aR1125SceneIndex !== '63'");
  expect(workflow).toContain("d.m5aR1125HumanReview !== 'NOT_RUN'");
  expect(workflow).toContain("JSON.parse(d.m5aR1125SourceCameraCenters ?? '')");
  expect(workflow).toContain('R1125 original source-camera projections missing from actual viewer');
  expect(workflow).toContain('projection.sourceSceneIndex !== 63');
  expect(workflow).toContain('projection.sourceTargetCount !== 13');
  expect(workflow).toContain('projection.radiusPx !== radius');
  expect(workflow).toContain('projection.originalGlbDigestAuthenticated !== false');
  expect(workflow).toContain('projection.productionScreenshotVerified !== false');
  expect(workflow).toContain('m5aR1125PixelEvidence.productionProvenanceVerified !== false');
  expect(workflow).toContain("humanReview: 'NOT_RUN'");
});

test('R1125 uses a captured PNG clip and keeps other review hard floors', () => {
  expect(workflow).toContain('const before = (isX4Themo || isR1125SourceReview || p137eScene67SourceEvidence)');
  expect(workflow).toContain('const after = (isX4Themo || isR1125SourceReview || p137eScene67SourceEvidence)');
  expect(workflow).toContain("clip: box, animations: 'disabled'");
  expect(workflow).toContain("'data:image/png;base64,' + before.toString('base64')");
  expect(workflow).toContain("MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR: '1500'");
  expect(workflow).toContain("MIN_CHANGED_PIXELS_HARD_FLOOR: '750'");
  expect(workflow).toContain('detectP186FX4OriginalGreenWallPixels');
  expect(workflow).toContain('detectP186FX4CyanTargetComponents');
  expect(workflow).toContain('detectM5BR1109CyanLocatorComponents');
  expect(workflow).toContain('if (pixelEvidence.nonBackgroundPixels < minNonBackgroundPixels)');
  expect(workflow).toContain('if (pixelEvidence.changedPixels < minChangedPixels)');
});

test('R1125 pixel-only evidence does not promote physical measurements or review', () => {
  expect(workflow).toContain('exactRawGlbByteReadbackVerified: false');
  expect(workflow).toContain("d.m5aPublishToCurrent !== 'false'");
  expect(workflow).toContain("m5aR1125PixelEvidence.humanReview !== 'NOT_RUN'");
  expect(workflow).toContain('m5aR1125PixelEvidence,');
  expect(workflow).not.toMatch(/m5aR1125HumanReview:\s*'PASS'/);
});
