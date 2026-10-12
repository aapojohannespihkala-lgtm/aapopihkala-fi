import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Check the *real* Astro production entrypoint. Camera descriptor unit tests
// alone cannot establish that the viewer ever calls source-camera logic.
const viewer = readFileSync(
  new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8',
);

test('real WORK_TEST viewer exposes two scene67 camera controls, initially hidden', () => {
  expect(viewer).toContain('id="p137e-north-face-button" type="button" hidden');
  expect(viewer).toContain('id="p137e-south-face-button" type="button" hidden');
  expect(viewer).toContain("p137eNorthFaceButton.hidden = false");
  expect(viewer).toContain("p137eSouthFaceButton.hidden = false");
  expect(viewer).toContain("applyP137EScene67SourceFace('NORTH')");
  expect(viewer).toContain("applyP137EScene67SourceFace('SOUTH')");
});

test('actual camera callsite consumes the merged scene67 source-bound descriptor', () => {
  expect(viewer).toContain("from '../../scripts/privateModelP137ETwoSidedSourceCamera'");
  expect(viewer).toContain('deriveP137ETwoFaceSourceCameras(fullModelScene, aspect)');
  expect(viewer).toContain("modelRoot.children[0] !== fullModelScene");
  expect(viewer).toContain("activeModelSourceKind !== 'work-test'");
  expect(viewer).toContain("!isP137EScene67ReviewRequested()");
  expect(viewer).toContain("canvas.dataset.workTestReviewMode !== p137eScene67ReviewId");
  expect(viewer).toContain('selection.sourceIds.length !== (face === \'NORTH\' ? 1 : 2)');
  expect(viewer).toContain("source.sourceWallMesh !== 406");
});

test('the production callsite applies orthographic position and target after source QA', () => {
  const start = viewer.indexOf('const applyP137EScene67SourceFace =');
  const stop = viewer.indexOf('const applyP137EScene67ReviewState =', start);
  expect(start).toBeGreaterThan(0);
  expect(stop).toBeGreaterThan(start);
  const fn = viewer.slice(start, stop);
  expect(fn.indexOf('deriveP137ETwoFaceSourceCameras(fullModelScene, aspect)'))
    .toBeLessThan(fn.indexOf('activeCamera = isoCamera'));
  expect(fn).toContain('isoCamera.position.set(...selection.eye)');
  expect(fn).toContain('isoCamera.up.set(...selection.up)');
  expect(fn).toContain('isoControls.target.copy(target)');
  expect(fn).toContain('isoCamera.updateProjectionMatrix()');
  expect(fn).toContain("setIsoRotationMode('disabled')");
});

test('source camera cannot promote model or human approval, or leak to next candidate', () => {
  expect(viewer).toContain("selection.productionRenderVerified !== false");
  expect(viewer).toContain("source.humanReview !== 'NOT_RUN'");
  expect(viewer).toContain("p137eScene67ProductionRenderVerified: 'false'");
  expect(viewer).toContain("p137eHumanReview: 'NOT_RUN'");
  expect(viewer).toContain("if (p137eNorthFaceButton) p137eNorthFaceButton.hidden = true");
  expect(viewer).toContain("delete canvas.dataset.p137eScene67CameraFace");
});

test('responsive resize retains selected source face rather than resetting generic iso', () => {
  const start = viewer.indexOf('const updateSize =');
  const stop = viewer.indexOf('const refreshFullModelFitMetrics =', start);
  const resize = viewer.slice(start, stop);
  expect(resize).toContain("canvas.dataset.workTestReviewMode === p137eScene67ReviewId");
  expect(resize).toContain('applyP137EScene67SourceFace(canvas.dataset.p137eScene67CameraFace)');
});
