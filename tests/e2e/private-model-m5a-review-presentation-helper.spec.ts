import { expect, test } from '@playwright/test';

import {
  m5aExpectedTargetCounts,
  m5aExpectedTargetRenderableCount,
  m5aReviewContextOpacity,
  m5aReviewQuestionText,
  m5aReviewSourceContext,
  m5aReviewTargetOpacity,
  prepareM5AReviewPresentation,
} from '../../src/scripts/privateModelM5AReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeTarget = (
  representationKind: keyof typeof m5aExpectedTargetCounts,
  index: number,
  pass = 'M5A',
) => {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  object.position.set(index * 0.5, 0, index * 0.25);
  object.userData = {
    Pass: pass,
    Canonical: false,
    representationKind,
    presentationOnly: true,
    workAssumption: true,
    sourceDerivedTopology: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalElevationClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
    ...(representationKind === 'wellMarkerWork'
      ? { physicalWellGeometryClaim: false }
      : { physicalRouteClaim: false }),
    ...(representationKind === 'unresolvedBoundaryMarker'
      ? { boundaryStatus: 'UNRESOLVED_BOUNDARY' }
      : {}),
  };
  return object;
};

test('M5A helper presents the exact 4+7+4 drainage topology target set at 80/20', () => {
  const scene = new THREE.Group();
  let index = 0;
  for (const [kind, count] of Object.entries(m5aExpectedTargetCounts)) {
    for (let i = 0; i < count; i += 1) {
      scene.add(makeTarget(kind as keyof typeof m5aExpectedTargetCounts, index));
      index += 1;
    }
  }

  const context = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1, 3),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  context.userData = { G2Id: 'G2_BUILDING_CONTEXT_001' };
  scene.add(context);

  const result = prepareM5AReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(m5aExpectedTargetRenderableCount);
  expect(result.targetRenderableCount).toBe(15);
  expect(result.targetCounts).toEqual(m5aExpectedTargetCounts);
  expect(result.missingTargetKinds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.targetBounds).not.toBeNull();

  for (const object of scene.children.slice(0, 15)) {
    expect((object as any).material.opacity).toBe(m5aReviewTargetOpacity);
    expect((object as any).userData.m5aReviewRole).toBe('QUESTION_TARGET_80');
  }
  expect((context.material as any).opacity).toBe(m5aReviewContextOpacity);
  expect(context.userData.m5aReviewRole).toBe('BUILDING_SITE_CONTEXT_20');
});

test('M5A helper accepts source-informed M5A-R1 targets without weakening no-promotion semantics', () => {
  const scene = new THREE.Group();
  let index = 0;
  for (const [kind, count] of Object.entries(m5aExpectedTargetCounts)) {
    for (let i = 0; i < count; i += 1) {
      scene.add(makeTarget(kind as keyof typeof m5aExpectedTargetCounts, index, 'M5A-R1'));
      index += 1;
    }
  }

  const result = prepareM5AReviewPresentation(scene);
  expect(result.targetRenderableCount).toBe(m5aExpectedTargetRenderableCount);
  expect(result.targetCounts).toEqual(m5aExpectedTargetCounts);
  expect(result.missingTargetKinds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);

  scene.children[0].userData.exactXYClaim = true;
  const promotionCheck = prepareM5AReviewPresentation(scene);
  expect(promotionCheck.targetRenderableCount).toBe(m5aExpectedTargetRenderableCount);
  expect(promotionCheck.semanticViolationCount).toBe(1);
});

test('M5A review source context keeps the human question qualitative and self-contained', () => {
  expect(m5aReviewQuestionText).toContain('suhteellinen topologia');
  expect(m5aReviewQuestionText).toContain('yleinen sijoittuminen');
  expect(m5aReviewSourceContext.sourceDrawingDriveId).toBe(
    '1KZhDDXnI5MsO4wNWzRwYCaGNQuOo0TCC',
  );
  expect(m5aReviewSourceContext.sourceDrawingByteSize).toBe(1132069);
  expect(m5aReviewSourceContext.sourcePreviewUrl).toBe(
    '/private-model/source-reference/m5a-drainman.pdf',
  );
  expect(m5aReviewSourceContext.namedWells).toEqual(['SOK1', 'SOK2', 'SOK3', 'PVK']);
  expect(m5aReviewSourceContext.supportedLinkCount).toBe(7);
  expect(m5aReviewSourceContext.drawingLowerMapping).toBe('+X / itäpääty / WORK_ASSUMPTION');
  expect(m5aReviewSourceContext.drawingUpperMapping).toBe('-X / länsipääty / WORK_ASSUMPTION');
  expect(m5aReviewSourceContext.drawingLeftMapping).toContain('WORK_ASSUMPTION');
  expect(m5aReviewSourceContext.exactXYClaim).toBe(false);
  expect(m5aReviewSourceContext.exactZClaim).toBe(false);
  expect(m5aReviewSourceContext.physicalRouteClaim).toBe(false);
  expect(m5aReviewSourceContext.currentGeometryClaim).toBe(false);
  expect(m5aReviewSourceContext.asBuiltClaim).toBe(false);
  expect(m5aReviewSourceContext.canonical).toBe(false);
});

test('M5A helper blocks promotion-like target semantics', () => {
  const scene = new THREE.Group();
  let index = 0;
  for (const [kind, count] of Object.entries(m5aExpectedTargetCounts)) {
    for (let i = 0; i < count; i += 1) {
      scene.add(makeTarget(kind as keyof typeof m5aExpectedTargetCounts, index));
      index += 1;
    }
  }
  scene.children[0].userData.exactXYClaim = true;

  const result = prepareM5AReviewPresentation(scene);
  expect(result.targetRenderableCount).toBe(15);
  expect(result.semanticViolationCount).toBe(1);
});
