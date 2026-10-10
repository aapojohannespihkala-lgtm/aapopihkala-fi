import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  m5aR1115ExpectedSceneName,
  selectM5AR1115ReviewScene,
} from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';
import {
  m5aR1115ReviewTargetIds,
  m5aR1115SceneIndex,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';

const commonUserData = {
  Pass: 'M5A-R1115-P1',
  ModelStage: 'WORK_TEST_VIEW',
  representationKind: 'plannedWellRaisePresenceAnnotationWork',
  sourceContract: 'G2_R1115',
  sourceQuoteDriveId: '1g127d10q590Y8ADSZv5u4wwk9W_P5px1',
  sourceWellBindingClass: 'YLISRINNE_PROJECT_SCOPE_DERIVED',
  quoteWellNames: 'NOT_SPECIFIED',
  phase: 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED',
  planned: true,
  ordered: false,
  implemented: false,
  plannedRaiseHeightM: null,
  physicalWellDiameterClaim: false,
  physicalWellHeightClaim: false,
  physicalRaiseHeightClaim: false,
  currentGeometryClaim: false,
  physicalRouteClaim: false,
  exactXYClaim: false,
  exactZClaim: false,
  asBuiltClaim: false,
  Canonical: false,
  canonical: false,
  publishToCURRENT: false,
  presentationOnly: true,
  workAssumption: true,
  HUMAN_REVIEW: 'NOT_RUN',
} as const;

const target = (id: string, x: number) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.3),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(x, 0, 0);
  mesh.userData = { ...commonUserData, G2IdCandidate: id };
  return mesh;
};

const exactScene = () => {
  const scene = new THREE.Group();
  scene.name = m5aR1115ExpectedSceneName;
  scene.add(target(m5aR1115ReviewTargetIds[0], -0.75));
  scene.add(target(m5aR1115ReviewTargetIds[1], 26.15));
  const context = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 10),
    new THREE.MeshBasicMaterial(),
  );
  context.userData = { representationKind: 'buildingContext' };
  scene.add(context);
  return scene;
};

const gltfWithScene64 = (scene: any) => {
  const scenes = Array.from({ length: m5aR1115SceneIndex + 1 }, () => new THREE.Group());
  scenes[m5aR1115SceneIndex] = scene;
  return { scenes };
};

test('R1115 selector accepts only the exact scene64 identity and returns target-bounds runtime state', () => {
  const scene = exactScene();
  const selected = selectM5AR1115ReviewScene(gltfWithScene64(scene));

  expect(selected.scene).toBe(scene);
  expect(selected.presentation.ready).toBe(true);
  expect(selected.presentation.targetRenderableCount).toBe(2);
  expect(selected.presentation.createdProxyCount).toBe(0);
  expect(selected.runtimeState.targetBounds).toBe(selected.presentation.targetBounds);
  expect(selected.runtimeState.dataset).toMatchObject({
    workTestReviewMode: 'm5a-r1115-sok23-planned-raise-presence-review',
    m5aR1115SceneIndex: '64',
    m5aR1115TargetRenderableCount: '2',
    m5aR1115Ordered: 'false',
    m5aR1115Implemented: 'false',
    m5aR1115HumanReview: 'NOT_RUN',
  });
});

test('R1115 selector fails closed before presentation when scene64 is missing or renamed', () => {
  const missingScenes = Array.from({ length: m5aR1115SceneIndex }, () => new THREE.Group());
  expect(() => selectM5AR1115ReviewScene({ scenes: missingScenes })).toThrow(
    /scene 64 missing/,
  );

  const renamed = exactScene();
  renamed.name = 'WRONG R1115 SCENE';
  const firstTarget = renamed.children[0];
  expect(firstTarget.scale.x).toBe(1);

  expect(() => selectM5AR1115ReviewScene(gltfWithScene64(renamed))).toThrow(
    /scene identity mismatch/,
  );
  expect(firstTarget.scale.x).toBe(1);
});

test('R1115 selector fails closed when an exact scene target is semantically promoted', () => {
  const scene = exactScene();
  const promoted = scene.children[1];
  promoted.userData.implemented = true;

  expect(() => selectM5AR1115ReviewScene(gltfWithScene64(scene))).toThrow(
    /source contract not ready/,
  );
});
