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

test('original wall is selectively translucent on SOUTH and fully restored on NORTH/other models', () => {
  expect(viewer).toContain("originalSourceGeometryUnmodified === true");
  expect(viewer).toContain("child?.userData?.sourceMeshIndex === 406");
  expect(viewer).toContain("const clone = material.clone()");
  expect(viewer).toContain("clone.opacity = 0.38");
  expect(viewer).toContain("clone.transparent = true");
  expect(viewer).toContain("clone.depthWrite = false");
  expect(viewer).toContain("if (face === 'SOUTH') applyP137EScene67SouthWallPresentation()");
  expect(viewer).toContain("p137eScene67WallPresentation = 'NORTH_SOURCE_WALL_OPAQUE'");
  expect(viewer).toContain("p137eScene67WallPresentation = 'SOUTH_SOURCE_WALL_ALPHA_0_38'");
  expect(viewer).toContain('item.mesh.material = item.material');
  expect(viewer).toContain('for (const cloned of item.temporary) cloned.dispose?.()');
  expect(viewer).not.toContain('original[0].geometry.dispose()');
});

test('real scene67 provides source-bound return to original top plan for temporary placement and ruler', () => {
  expect(viewer).toContain('id="p137e-plan-face-button" type="button" hidden');
  expect(viewer).toContain('p137ePlanFaceButton.hidden = false');
  expect(viewer).toContain('p137ePlanFaceButton.hidden = true');
  const a = viewer.indexOf('const applyP137EScene67TopPlan = () => {');
  const b = viewer.indexOf('const applyP137EScene67ReviewState = () => {', a);
  expect(a).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(a);
  const plan = viewer.slice(a, b);
  expect(plan).toContain("activeModelSourceKind !== 'work-test'");
  expect(plan).toContain('!isP137EScene67ReviewRequested()');
  expect(plan).toContain('canvas.dataset.p137eLoadedCandidateId !== p137eScene67CandidateId');
  expect(plan).toContain("fullModelScene.children.length !== 4");
  expect(plan).toContain('modelRoot.children[0] !== fullModelScene');
  expect(plan).toContain('restoreP137EWallPresentation()');
  expect(plan).toContain("activePlanFloor = '1F'");
  expect(plan).toContain('activeCamera = planCamera');
  expect(plan).toContain('setModelScene(fullModelScene)');
  expect(plan).toContain("canvas.dataset.contentScene = 'full-model'");
  expect(plan).toContain("activateDCoordinateReview('1F')");
  expect(plan).toContain("syncViewState('d-plan')");
  expect(plan).toContain('p137eScene67TopPlanToolsReady');
  expect(plan).not.toContain('setModelScene(dInteriorScene)');
  expect(plan).not.toContain('prepareP186dD1fRoomContextBridge');
  expect(plan).not.toContain('prepareP186FX4FloorPlanGuide');
  expect(viewer).toContain("try { applyP137EScene67TopPlan(); }");
});

test('ordinary D1F control returns to source-only scene67 plan but not in any other candidate', () => {
  const start = viewer.indexOf("d1PlanButton.addEventListener('click', () => {");
  expect(start).toBeGreaterThan(0);
  const guard = viewer.slice(start, start + 450);
  expect(guard).toContain('canvas.dataset.workTestReviewMode === p137eScene67ReviewId');
  expect(guard).toContain('applyP137EScene67TopPlan()');
  expect(guard).toContain("applyStandardViewPreset('d-1f')");
  const side = viewer.slice(viewer.indexOf('const applyP137EScene67SourceFace ='), viewer.indexOf('const applyP137EScene67TopPlan ='));
  expect(side).toContain('deactivateDCoordinateReview()');
  expect(side).toContain('activeCamera = isoCamera');
  // Side cameras still disable placement; returning to top plan enables it
  // only after exact original source and selected-candidate checks.
  expect(viewer).toContain("p137eNorthFaceButton?.addEventListener('click'");
  expect(viewer).toContain("p137eSouthFaceButton?.addEventListener('click'");
});
