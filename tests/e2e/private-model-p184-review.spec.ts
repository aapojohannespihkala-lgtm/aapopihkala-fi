import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p184dCandidateId,
  p184dReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p184DCabinetFrontReferenceKind,
  p184DReviewContextOpacity,
  p184DReviewTargetOpacity,
  p184DTargetG2Id,
  p184DTargetRepresentationKind,
  prepareP184DReviewPresentation,
} from '../../src/scripts/privateModelP184ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P184D review alias resolves to the exact P184D survivor', () => {
  expect(getRequestedReviewCandidateId(`?review=${p184dReviewId}`)).toBe(p184dCandidateId);
});

test('P184D review isolates the exact island target and adds only a viewer-derived cabinet-front reference', () => {
  const scene = new THREE.Group();
  const axisRoot = new THREE.Group();
  axisRoot.rotation.x = -Math.PI / 2;
  scene.add(axisRoot);

  const sourceTargetMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const island = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.85, 0.9),
    sourceTargetMaterial,
  );
  island.name = 'P184D_G2_FURN_D_2F_KITCHEN_ISLAND_001_SOURCE_CHAIN_X_WORKTEST';
  island.position.set(2.481, 3.9, 3.21);
  island.userData = {
    Pass: 'P184D',
    G2Id: p184DTargetG2Id,
    representationKind: p184DTargetRepresentationKind,
    sourceChainCabinetFrontXM: 0.831,
    exactXYClaim: false,
  };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.name = 'UNRELATED_CONTEXT';
  axisRoot.add(island, unrelated);

  const presentation = prepareP184DReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(1);
  expect(presentation.cabinetFrontReferenceRenderableCount).toBe(1);
  expect(presentation.sourceChainCabinetFrontXM).toBeCloseTo(0.831, 6);
  expect(presentation.targetBounds).not.toBeNull();
  expect(unrelated.visible).toBe(false);

  const targetMaterial = island.material as any;
  expect(targetMaterial).not.toBe(sourceTargetMaterial);
  expect(targetMaterial.opacity).toBe(p184DReviewTargetOpacity);
  expect(island.userData.p184DReviewRole).toBe('ISLAND_TARGET_80');

  const reference = scene.getObjectByName(
    'P184D_SOURCE_CHAIN_CABINET_FRONT_X_REFERENCE_VIEWER_ONLY',
  ) as any;
  expect(reference).toBeTruthy();
  expect(reference.material.opacity).toBe(p184DReviewContextOpacity);
  expect(reference.userData.representationKind).toBe(p184DCabinetFrontReferenceKind);
  expect(reference.userData.physicalCabinetGeometryClaim).toBe(false);
  expect(reference.userData.extentBasis).toBe('P184D_TARGET_BOUNDS_ONLY');

  const targetCenter = presentation.targetBounds!.getCenter(new THREE.Vector3());
  expect(reference.position.x).toBeCloseTo(targetCenter.x + (0.831 - 2.481), 6);
  expect(presentation.cabinetFrontWorldX).toBeCloseTo(reference.position.x, 6);
});

test('P184D review refuses to invent a cabinet-front reference when exact target metadata is absent', () => {
  const scene = new THREE.Group();
  const island = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.85, 0.9),
    new THREE.MeshBasicMaterial(),
  );
  island.userData = {
    Pass: 'P184D',
    G2Id: p184DTargetG2Id,
    representationKind: p184DTargetRepresentationKind,
  };
  scene.add(island);

  const presentation = prepareP184DReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(1);
  expect(presentation.cabinetFrontReferenceRenderableCount).toBe(0);
  expect(presentation.sourceChainCabinetFrontXM).toBeNull();
});

test('private viewer wires P184D 80/20 presentation, target camera focus and no-promotion metadata', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(viewerSource).toContain('prepareP184DReviewPresentation');
  expect(viewerSource).toContain('focusP184DReviewCamera');
  expect(viewerSource).toContain('p184ReviewCameraMode');
  expect(viewerSource).toContain("'PERSPECTIVE_FREE_ORBIT'");
  expect(viewerSource).toContain("p184PhysicalCabinetGeometryClaim: 'false'");
  expect(viewerSource).toContain("p184ExactXYClaim: 'false'");
  expect(viewerSource).toContain('p184DReviewTargetOpacity.toFixed(2)');
  expect(viewerSource).toContain('p184DReviewContextOpacity.toFixed(2)');
});
