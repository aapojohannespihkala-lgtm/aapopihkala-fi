import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p185cCandidateId,
  p185cReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p185ReviewContextOpacity,
  p185ReviewTargetOpacity,
  p185TargetRepresentationKinds,
  prepareP185ReviewPresentation,
} from '../../src/scripts/privateModelP185ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P185C registry and explicit review alias resolve the exact persisted electrical overlay', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[p185cCandidateId]).toEqual({
    driveFileId: '1_w5gLNffz7DaAlZt_IcvQNV8TYKzdIn1',
  });
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBe(p185cCandidateId);
});

test('P185C review contract stays a bounded WORK_TEST route', () => {
  expect(p185cCandidateId).toBe('p185c-d2015-electrical-source-overlay');
  expect(p185cReviewId).toBe('p185c-d2015-electrical-source-overlay-review');
});

const makeTarget = (
  representationKind: 'sourceVectorPlanOverlay' | 'electricalPanelSourceLabelAnchorMarker',
) => {
  const sourceMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const object = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 1), sourceMaterial);
  object.userData = {
    Pass: 'P185C',
    ModelStage: 'WORK_TEST_PRESENTATION',
    Canonical: false,
    representationKind,
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    exactXYClaim: false,
    exactZClaim: false,
    physicalCableRouteClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
    ...(representationKind === 'sourceVectorPlanOverlay'
      ? {
          sourceFragmentCount: 366,
          floorHeatingCableGeometryClaim: false,
          closedHeatingZoneClaim: false,
        }
      : {
          sourceText: 'RYHMäKESKUS RK',
          electricalPanelGeometryClaim: false,
        }),
  };
  return { object, sourceMaterial };
};

test('P185C question presentation keeps exact electrical targets at 80 and D 1F architecture context at 20', () => {
  const scene = new THREE.Group();
  const overlay = makeTarget('sourceVectorPlanOverlay');
  const rk = makeTarget('electricalPanelSourceLabelAnchorMarker');
  overlay.object.position.set(2, 0, 3);
  rk.object.position.set(5.654, 0, 8.497);

  const d1fContextMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const d1fContext = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), d1fContextMaterial);
  d1fContext.name = 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001';
  d1fContext.userData = {
    G2Id: 'G2_WALL_D_1F_001',
    presentationLayer: 'CURRENT_D',
  };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 2),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.name = 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001';
  unrelated.userData = {
    G2Id: 'G2_WALL_D_2F_001',
    presentationLayer: 'CURRENT_D',
  };

  scene.add(overlay.object, rk.object, d1fContext, unrelated);
  const presentation = prepareP185ReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(1);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetRepresentationKinds).toEqual([]);
  expect(new Set(presentation.foundTargetRepresentationKinds)).toEqual(
    new Set(p185TargetRepresentationKinds),
  );
  expect(presentation.targetBounds).not.toBeNull();

  expect(overlay.object.visible).toBe(true);
  expect(rk.object.visible).toBe(true);
  expect(unrelated.visible).toBe(false);
  expect(d1fContext.visible).toBe(true);

  const overlayMaterial = overlay.object.material as any;
  const rkMaterial = rk.object.material as any;
  const contextMaterial = d1fContext.material as any;
  expect(overlayMaterial).not.toBe(overlay.sourceMaterial);
  expect(rkMaterial).not.toBe(rk.sourceMaterial);
  expect(overlayMaterial.opacity).toBe(p185ReviewTargetOpacity);
  expect(rkMaterial.opacity).toBe(p185ReviewTargetOpacity);
  expect(contextMaterial).not.toBe(d1fContextMaterial);
  expect(contextMaterial.opacity).toBe(p185ReviewContextOpacity);
  expect(overlay.object.userData.p185ReviewRole).toBe('QUESTION_TARGET_80');
  expect(rk.object.userData.p185ReviewRole).toBe('QUESTION_TARGET_80');
  expect(d1fContext.userData.p185ReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
});

test('P185C presentation reports no-promotion semantic violations instead of silently promoting source graphics', () => {
  const scene = new THREE.Group();
  const overlay = makeTarget('sourceVectorPlanOverlay');
  const rk = makeTarget('electricalPanelSourceLabelAnchorMarker');
  overlay.object.userData.exactXYClaim = true;
  scene.add(overlay.object, rk.object);

  const presentation = prepareP185ReviewPresentation(scene);
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.semanticViolationCount).toBe(1);
});

test('private viewer wires P185C review alias to D 1F 80/20 presentation without HUMAN_REVIEW promotion', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(viewerSource).toContain('prepareP185ReviewPresentation');
  expect(viewerSource).toContain('isP185cElectricalSourceReviewRequested');
  expect(viewerSource).toContain('applyP185cReviewState');
  expect(viewerSource).toContain("candidate.id === p185cCandidateId");
  expect(viewerSource).toContain("p185ReviewQuestion: 'D_1F_D2015_ELECTRICAL_SOURCE_OVERLAY_RELATION'");
  expect(viewerSource).toContain('p185ReviewTargetOpacity.toFixed(2)');
  expect(viewerSource).toContain('p185ReviewContextOpacity.toFixed(2)');
  expect(viewerSource).toContain("p185FloorHeatingCableGeometryClaim: 'false'");
  expect(viewerSource).toContain("p185ElectricalPanelGeometryClaim: 'false'");
  expect(viewerSource).toContain("p185PhysicalCableRouteClaim: 'false'");
  expect(viewerSource).toContain("p185HumanReview: 'NOT_RUN'");
  expect(viewerSource).toContain("standardViewPreset: 'd-1f'");
  expect(viewerSource).toContain("applyStandardViewPreset('d-1f')");
});
