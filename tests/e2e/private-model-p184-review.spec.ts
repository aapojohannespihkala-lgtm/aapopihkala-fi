import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p184dCandidateId,
  p184dReviewId,
  p184gCandidateId,
  p184gReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p184DCabinetFrontReferenceKind,
  p184DReviewContextOpacity,
  p184DReviewTargetOpacity,
  p184DTargetG2Id,
  p184DTargetRepresentationKind,
  prepareP184DReviewPresentation,
  prepareP184ReviewPresentation,
} from '../../src/scripts/privateModelP184ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P184D review alias resolves to the exact P184D survivor', () => {
  expect(getRequestedReviewCandidateId(`?review=${p184dReviewId}`)).toBe(p184dCandidateId);
});

test('P184G review alias resolves to the exact axis self-consistency successor', () => {
  expect(getRequestedReviewCandidateId(`?review=${p184gReviewId}`)).toBe(p184gCandidateId);
});

test('P184D review keeps only the exact island plus explicit D 2F architecture context at 80/20', () => {
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
    presentationLayer: 'D_ARCH_FURNITURE',
    hostStorey: 'D_2F',
    sourceChainCabinetFrontXM: 0.831,
    exactXYClaim: false,
  };

  const sourceContextMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const d2fContext = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    sourceContextMaterial,
  );
  d2fContext.name = 'P134B_ARCH_BASE_CLONE__P125A_BLUE_P86_VIEW_G2_WINDOW_N_D_2F_001';
  d2fContext.userData = {
    G2Id: 'G2_WINDOW_N_D_2F_001',
    representationKind: 'referenceOpening',
    presentationLayer: 'CURRENT_D',
    presentationGroup: 'ARCH_BASE',
  };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.name = 'P134B_ARCH_BASE_CLONE__P125A_BLUE_P86_VIEW_G2_WINDOW_N_D_1F_001';
  unrelated.userData = {
    G2Id: 'G2_WINDOW_N_D_1F_001',
    representationKind: 'referenceOpening',
    presentationLayer: 'CURRENT_D',
    presentationGroup: 'ARCH_BASE',
  };

  axisRoot.add(island, d2fContext, unrelated);

  const presentation = prepareP184DReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(1);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.hiddenNonTargetRenderableCount).toBe(1);
  expect(presentation.cabinetFrontReferenceRenderableCount).toBe(1);
  expect(presentation.sourceChainCabinetFrontXM).toBeCloseTo(0.831, 6);
  expect(presentation.targetBounds).not.toBeNull();

  expect(d2fContext.visible).toBe(true);
  const contextMaterial = d2fContext.material as any;
  expect(contextMaterial).not.toBe(sourceContextMaterial);
  expect(contextMaterial.opacity).toBe(p184DReviewContextOpacity);
  expect(contextMaterial.transparent).toBe(true);
  expect(contextMaterial.depthWrite).toBe(false);
  expect(d2fContext.userData.p184DReviewRole).toBe('D_2F_ARCH_CONTEXT_20');

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

test('P184 pass-aware review selects the requested successor pass and preserves P184D compatibility', () => {
  const scene = new THREE.Group();

  const p184dIsland = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.85, 0.9),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  p184dIsland.position.set(2.481, 3.9, 3.21);
  p184dIsland.userData = {
    Pass: 'P184D',
    G2Id: p184DTargetG2Id,
    representationKind: p184DTargetRepresentationKind,
    sourceChainCabinetFrontXM: 0.831,
  };

  const p184fIsland = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.85, 0.9),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  p184fIsland.position.set(4.072, 3.9, 3.21);
  p184fIsland.userData = {
    Pass: 'P184G',
    G2Id: p184DTargetG2Id,
    representationKind: p184DTargetRepresentationKind,
    cabinetFrontX: 5.722,
  };

  scene.add(p184dIsland, p184fIsland);

  const presentation = prepareP184ReviewPresentation(scene, 'P184G');

  expect(presentation.targetRenderableCount).toBe(1);
  expect(presentation.cabinetFrontReferenceRenderableCount).toBe(1);
  expect(presentation.sourceChainCabinetFrontXM).toBeCloseTo(5.722, 6);
  expect(p184fIsland.visible).toBe(true);
  expect(p184fIsland.userData.p184ReviewPass).toBe('P184G');
  expect(p184fIsland.userData.p184ReviewRole).toBe('ISLAND_TARGET_80');
  expect(p184fIsland.userData.p184DReviewPresentation).toBeUndefined();
  expect(p184dIsland.visible).toBe(false);

  const reference = scene.getObjectByName(
    'P184G_SOURCE_CHAIN_CABINET_FRONT_X_REFERENCE_VIEWER_ONLY',
  ) as any;
  expect(reference).toBeTruthy();
  expect(reference.position.x).toBeCloseTo(5.722, 6);
  expect(reference.userData.p184ReviewPass).toBe('P184G');
  expect(reference.userData.extentBasis).toBe('P184G_TARGET_BOUNDS_ONLY');

  const legacyScene = new THREE.Group();
  const legacyIsland = p184dIsland.clone();
  legacyIsland.material = new THREE.MeshBasicMaterial({ opacity: 1 });
  legacyIsland.userData = { ...p184dIsland.userData };
  legacyIsland.visible = true;
  legacyScene.add(legacyIsland);

  const legacyPresentation = prepareP184DReviewPresentation(legacyScene);
  expect(legacyPresentation.targetRenderableCount).toBe(1);
  expect(legacyIsland.userData.p184DReviewPresentation).toBe(true);
  expect(legacyIsland.userData.p184DReviewRole).toBe('ISLAND_TARGET_80');
  expect(
    legacyScene.getObjectByName(
      'P184D_SOURCE_CHAIN_CABINET_FRONT_X_REFERENCE_VIEWER_ONLY',
    ),
  ).toBeTruthy();
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
