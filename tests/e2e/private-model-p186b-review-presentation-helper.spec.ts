import { expect, test } from '@playwright/test';

import {
  p186bExpectedSourceLineItemCount,
  p186bReviewContextOpacity,
  p186bReviewTargetOpacity,
  p186bTargetSelectors,
  prepareP186BReviewPresentation,
} from '../../src/scripts/privateModelP186BReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const target = (selector: string, lines: number) => {
  const material = new THREE.LineBasicMaterial({ opacity: 1 });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 1),
  ]);
  const object = new THREE.LineSegments(geometry, material);
  object.userData = {
    Pass: 'P186B',
    Canonical: false,
    canonical: false,
    hostStorey: 'D_2F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'sourceVectorPlanLineOverlay',
    sourcePdfDriveId: '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
    sourceSelector: selector,
    sourceLineItemCount: lines,
    sourceGraphicOnly: true,
    presentationOnly: true,
    physicalCableRouteClaim: false,
    deviceGeometryClaim: false,
    symbolSemanticClaim: false,
    exactZClaim: false,
    currentGeometryClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  };
  return { object, material };
};

test('P186B helper applies exact 80/20 review hierarchy to the persisted two-selector contract', () => {
  const scene = new THREE.Group();
  const a = target('BLACK_LINE_PATH_STROKE_WIDTH_0.84PT', 5701);
  const b = target('BLACK_LINE_PATH_STROKE_WIDTH_1.08PT', 1622);

  const contextMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const context = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), contextMaterial);
  context.userData = { G2Id: 'G2_WALL_D_2F_001', presentationLayer: 'CURRENT_D' };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.userData = { G2Id: 'G2_WALL_D_1F_001', presentationLayer: 'CURRENT_D' };

  scene.add(a.object, b.object, context, unrelated);
  const result = prepareP186BReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(2);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.hiddenNonQuestionRenderableCount).toBe(1);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.sourceLineItemCount).toBe(p186bExpectedSourceLineItemCount);
  expect(result.sourceLineItemCount).toBe(7323);
  expect(result.missingTargetSelectors).toEqual([]);
  expect(new Set(result.foundTargetSelectors)).toEqual(
    new Set(p186bTargetSelectors.map((item) => item.sourceSelector)),
  );

  expect((a.object.material as any).opacity).toBe(p186bReviewTargetOpacity);
  expect((b.object.material as any).opacity).toBe(p186bReviewTargetOpacity);
  expect((context.material as any).opacity).toBe(p186bReviewContextOpacity);
  expect(unrelated.visible).toBe(false);
});

test('P186B helper reports no-promotion and line-count violations', () => {
  const scene = new THREE.Group();
  const a = target('BLACK_LINE_PATH_STROKE_WIDTH_0.84PT', 5701);
  const b = target('BLACK_LINE_PATH_STROKE_WIDTH_1.08PT', 1621);
  a.object.userData.current = true;
  scene.add(a.object, b.object);

  const result = prepareP186BReviewPresentation(scene);
  expect(result.targetRenderableCount).toBe(2);
  expect(result.semanticViolationCount).toBe(2);
  expect(result.sourceLineItemCount).toBe(7322);
});
