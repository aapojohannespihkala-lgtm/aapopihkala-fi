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

test('original P123C wall source alpha stays unmodified on BOTH faces and device masks restore', () => {
  // Preserve original scene67 source mesh/material: glTF already contains
  // BLEND / alpha 0.38. Neither NORTH nor SOUTH may clone or tint it.
  expect(viewer).toContain('Original P123C source wall is already');
  expect(viewer).toContain('glTF alphaMode BLEND and opacity 0.38');
  const begin = viewer.indexOf('const applyP137EScene67SourceFace =');
  const finish = viewer.indexOf('const applyP137EScene67TopPlan =', begin);
  expect(begin).toBeGreaterThan(0);
  expect(finish).toBeGreaterThan(begin);
  const face = viewer.slice(begin, finish);
  expect(face).toContain("activeModelSourceKind !== 'work-test'");
  expect(face).toContain("canvas.dataset.workTestReviewMode !== p137eScene67ReviewId");
  expect(face).toContain('source.sourceWallMesh !== 406');
  expect(face).toContain('applyP137EScene67DeviceFaceMask(');
  expect(face).toContain("'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED'");
  expect(face).not.toContain('material.clone()');
  expect(face).not.toContain('applyP137EScene67SouthWallPresentation(');

  // Only temporary source-device visibility may vary; all three logical
  // identities are verified, and the exact original visibility is restored.
  const maskBegin = viewer.indexOf('const applyP137EScene67DeviceFaceMask =');
  const maskEnd = viewer.indexOf('const applyP137EScene67SourceFace =', maskBegin);
  expect(maskBegin).toBeGreaterThan(0);
  expect(maskEnd).toBeGreaterThan(maskBegin);
  const mask = viewer.slice(maskBegin, maskEnd);
  expect(mask).toContain('fullModelScene?.children?.length !== 4');
  expect(mask).toContain('new Set(allSourceIds).size !== 3');
  expect(mask).toContain('child.userData?.presentationOnly !== true');
  expect(mask).toContain("child.userData?.HUMAN_REVIEW !== 'NOT_RUN'");
  expect(mask).toContain('child.visible = visibleSourceIds.includes(child.userData.logicalDeviceId)');
  expect(viewer).toContain('const restoreP137EDevicePresentation = () => {');
  expect(viewer).toContain('entry.object.visible = entry.visible');
  expect(viewer).toContain('p137eDevicePresentationOriginals.length = 0');
  expect(viewer).toContain('const restoreP137EWallPresentation = () => {');
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
