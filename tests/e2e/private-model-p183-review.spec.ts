import { expect, test } from '@playwright/test';

import {
  p178bCandidateId,
  p183P160ClosureReviewId,
  getRequestedReviewCandidateId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p183P160ClosureContextOpacity,
  p183P160ClosureTargetOpacity,
  prepareP183P160ClosureReviewPresentation,
} from '../../src/scripts/privateModelP183ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P183 review alias resolves to the exact P178B survivor', () => {
  expect(getRequestedReviewCandidateId(`?review=${p183P160ClosureReviewId}`)).toBe(
    p178bCandidateId,
  );
});

test('P183 P160 closure review presents D architecture at 80 percent and unique context at 20 percent', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeMesh = (name: string) => {
    const material = new THREE.MeshBasicMaterial({ color: 0x8f989e, opacity: 1 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    mesh.name = name;
    return mesh;
  };

  const fullDWall = makeMesh('D_WALL_TARGET');
  const terrain = makeMesh('WHOLE_BUILDING_TERRAIN_CONTEXT');
  terrain.position.x = 8;
  fullScene.add(fullDWall, terrain);

  const dWall = makeMesh('D_WALL_TARGET');
  const dStair = makeMesh('D_STAIR_TARGET');
  dStair.position.x = 2;
  dScene.add(dWall, dStair);

  const sourceTargetMaterial = dWall.material;
  const sourceContextMaterial = terrain.material;

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);

  expect(presentation.composite).not.toBeNull();
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.suppressedDuplicateContextCount).toBe(1);
  expect(presentation.targetBounds).not.toBeNull();

  const targetClone = presentation.composite!.children[1]?.getObjectByName('D_WALL_TARGET');
  const targetMaterial = (targetClone as any).material;
  expect(targetMaterial).not.toBe(sourceTargetMaterial);
  expect(targetMaterial.opacity).toBe(p183P160ClosureTargetOpacity);
  expect(targetMaterial.userData.p183PresentationRole).toBe('D_ARCHITECTURE_TARGET_80');

  const contextClone = presentation.composite!.children[0]?.getObjectByName(
    'WHOLE_BUILDING_TERRAIN_CONTEXT',
  );
  const contextMaterial = (contextClone as any).material;
  expect(contextMaterial).not.toBe(sourceContextMaterial);
  expect(contextMaterial.opacity).toBe(p183P160ClosureContextOpacity);
  expect(contextMaterial.userData.p183PresentationRole).toBe('BUILDING_TERRAIN_CONTEXT_20');

  expect((sourceTargetMaterial as any).opacity).toBe(1);
  expect((sourceContextMaterial as any).opacity).toBe(1);
});
