import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const viewer = readFileSync(
  new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8',
);
const workflow = readFileSync(
  new URL('../../.github/workflows/private-model-production-review-smoke.yml',
    import.meta.url), 'utf8',
);

test('R1125 viewer imports the existing source-bound camera projector', () => {
  expect(viewer).toContain("import { deriveM5AR1125SourceCameraCenters } from '../../scripts/privateModelM5AR1125SourceCameraCenters.mjs'");
  expect(viewer.match(/deriveM5AR1125SourceCameraCenters\(/g)).toHaveLength(1);
  expect(viewer).not.toContain('R1125_SYNTHETIC_CAMERA_CENTERS');
});

test('R1125 projected centers come from selected scene63 AFTER real viewer focus', () => {
  const block = viewer.slice(viewer.indexOf('applyM5aDrainageReviewState(m5aDrainageReviewMode, isM5AR1125SourceReview);'));
  const focus = block.indexOf('applyM5aDrainageReviewState(');
  const project = block.indexOf('deriveM5AR1125SourceCameraCenters({');
  const publish = block.indexOf('canvas.dataset.m5aR1125SourceCameraCenters =');
  expect(focus).toBeGreaterThanOrEqual(0);
  expect(project).toBeGreaterThan(focus);
  expect(publish).toBeGreaterThan(project);
  expect(block.slice(0, publish)).toContain("canvas.dataset.m5aReviewCameraFocusApplied !== 'true'");
  expect(block.slice(project, publish)).toContain('sceneRoot: fullModelScene');
  expect(block.slice(project, publish)).toContain('camera: activeCamera');
  expect(block.slice(project, publish)).toContain('sceneIndex: 63');
  expect(block.slice(project, publish)).toContain('canvas.getBoundingClientRect()');
  expect(block.slice(project, publish)).toContain('window.devicePixelRatio || 1');
});

test('R1125 exact 13, no-promotion and missing-camera values fail closed', () => {
  const block = viewer.slice(viewer.indexOf('if (isM5AR1125SourceReview) {\n              // Release proof input'));
  expect(block).toContain('sourceCameraProjection.sourceTargetCount !== 13');
  expect(block).toContain('sourceCameraProjection.centers.length !== 13');
  expect(block).toContain('sourceCameraProjection.originalGlbDigestAuthenticated !== false');
  expect(block).toContain('sourceCameraProjection.productionScreenshotVerified !== false');
  expect(block).toContain("sourceCameraProjection.humanReview !== 'NOT_RUN'");
  expect(block).toContain('throw new Error(\'R1125 exact source-camera projection gate incomplete\')');
  expect(viewer).toContain('delete canvas.dataset.m5aR1125SourceCameraCenters;');
  expect(viewer).toContain('selectM5AR1125SourceBoundReviewScene(gltf)');
});

test('R1125 production smoke consumes the exact viewer output, not synthetic data', () => {
  expect(workflow).toContain("JSON.parse(d.m5aR1125SourceCameraCenters ?? '')");
  expect(workflow).toContain('projection.sourceSceneIndex !== 63');
  expect(workflow).toContain('projection.sourceTargetCount !== 13');
  expect(workflow).toContain('projection.radiusPx !== radius');
  expect(workflow).toContain('m5aR1125PixelEvidence.allSourceTargetsVisible !== true');
  expect(workflow).toContain('exactRawGlbByteReadbackVerified: false');
});
