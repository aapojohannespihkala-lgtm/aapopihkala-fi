import { expect, test } from '@playwright/test';

import {
  p178bCandidateId,
  p183P160ClosureReviewId,
  getRequestedReviewCandidateId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p183ContextRenderOrderBase,
  p183LegacyIntegrationRootName,
  p183P160ClosureContextOpacity,
  p183PhysicalWallRenderOrder,
  p183P160ClosureTargetOpacity,
  p183TargetPrimaryRenderOrderBase,
  p183TargetSupportRenderOrderBase,
  p183P178bIntegrationRootName,
  prepareP183P160ClosureReviewPresentation,
  resolveP183P160ClosureIntegrationRoot,
  resolveP183WallSemanticClass,
} from '../../src/scripts/privateModelP183ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P183 review alias resolves to the exact P178B survivor', () => {
  expect(getRequestedReviewCandidateId(`?review=${p183P160ClosureReviewId}`)).toBe(
    p178bCandidateId,
  );
});

test('P183 review root resolver prefers the P178B replacement and falls back to legacy P167F', () => {
  const fullScene = new THREE.Group();
  const legacyRoot = new THREE.Group();
  legacyRoot.name = p183LegacyIntegrationRootName;
  const p178bRoot = new THREE.Group();
  p178bRoot.name = p183P178bIntegrationRootName;
  fullScene.add(legacyRoot, p178bRoot);

  expect(resolveP183P160ClosureIntegrationRoot(fullScene)).toBe(p178bRoot);

  fullScene.remove(p178bRoot);
  expect(resolveP183P160ClosureIntegrationRoot(fullScene)).toBe(legacyRoot);
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
  expect(targetMaterial.depthWrite).toBe(false);
  expect(targetMaterial.side).toBe(THREE.DoubleSide);
  expect(targetMaterial.userData.p183PresentationRole).toBe('D_ARCHITECTURE_TARGET_80');
  expect((targetClone as any).userData.p183RenderBand).toBe('D_INTERIOR_PRIMARY');
  expect((targetClone as any).renderOrder).toBeGreaterThanOrEqual(
    p183TargetPrimaryRenderOrderBase,
  );

  const contextClone = presentation.composite!.children[0]?.getObjectByName(
    'WHOLE_BUILDING_TERRAIN_CONTEXT',
  );
  const contextMaterial = (contextClone as any).material;
  expect(contextMaterial).not.toBe(sourceContextMaterial);
  expect(contextMaterial.opacity).toBe(p183P160ClosureContextOpacity);
  expect(contextMaterial.userData.p183PresentationRole).toBe('BUILDING_TERRAIN_CONTEXT_20');
  expect((contextClone as any).userData.p183RenderBand).toBe('BUILDING_TERRAIN_CONTEXT');
  expect((contextClone as any).renderOrder).toBeGreaterThanOrEqual(p183ContextRenderOrderBase);
  expect((targetClone as any).renderOrder).toBeGreaterThan((contextClone as any).renderOrder);

  expect((sourceTargetMaterial as any).opacity).toBe(1);
  expect((sourceContextMaterial as any).opacity).toBe(1);
});


test('P183 semantic walls keep review opacity without forcing wall classes into render-order bands', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeWall = (
    name: string,
    g2Id: string,
    color: number,
    x: number,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 0.2),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.name = name;
    mesh.position.x = x;
    mesh.userData = { G2Id: g2Id };
    return mesh;
  };

  const exteriorContext = makeWall(
    'BLUE_SHELL_CONTEXT',
    'G2_WALL_EXT_W_1F2F_001',
    0x2277aa,
    0,
  );
  exteriorContext.position.z = -2;
  fullScene.add(exteriorContext);

  const primaryRoot = new THREE.Group();
  primaryRoot.name = 'D_INTERIOR_PRIMARY_ROOT';
  const supportRoot = new THREE.Group();
  supportRoot.name = 'P183_SUPPORT_ROOT';

  const interiorWall = makeWall(
    'GREEN_INTERIOR_WALL',
    'G2_WALL_INT_D_1F_TEST_001',
    0x00aa44,
    0,
  );
  interiorWall.position.z = 2;
  const partyWall = makeWall(
    'BLUE_PARTY_WALL',
    'G2_WALL_PART_CD_1F_TEST_001',
    0x2277aa,
    0,
  );
  const stairSupport = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xccaa22 }),
  );
  stairSupport.name = 'STAIR_SUPPORT';

  primaryRoot.add(interiorWall);
  supportRoot.add(partyWall, stairSupport);
  dScene.add(primaryRoot, supportRoot);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const contextClone = presentation.composite!.children[0].getObjectByName(
    'BLUE_SHELL_CONTEXT',
  ) as any;
  const targetCloneRoot = presentation.composite!.children[1];
  const interiorClone = targetCloneRoot.getObjectByName('GREEN_INTERIOR_WALL') as any;
  const partyClone = targetCloneRoot.getObjectByName('BLUE_PARTY_WALL') as any;
  const stairClone = targetCloneRoot.getObjectByName('STAIR_SUPPORT') as any;

  expect(resolveP183WallSemanticClass(interiorClone)).toBe('INTERIOR');
  expect(resolveP183WallSemanticClass(partyClone)).toBe('PARTY');
  expect(resolveP183WallSemanticClass(contextClone)).toBe('EXTERIOR');

  for (const wall of [interiorClone, partyClone, contextClone]) {
    expect(wall.renderOrder).toBe(p183PhysicalWallRenderOrder);
    expect(wall.userData.p183PhysicalOcclusionSort).toBe(true);
    expect(wall.material.depthTest).toBe(true);
    expect(wall.material.depthWrite).toBe(false);
  }

  expect(interiorClone.material.opacity).toBe(p183P160ClosureTargetOpacity);
  expect(partyClone.material.opacity).toBe(p183P160ClosureTargetOpacity);
  expect(contextClone.material.opacity).toBe(p183P160ClosureContextOpacity);

  expect(stairClone.userData.p183WallSemanticClass).toBeUndefined();
  expect(stairClone.renderOrder).toBeGreaterThanOrEqual(p183TargetSupportRenderOrderBase);
  expect(stairClone.renderOrder).not.toBe(p183PhysicalWallRenderOrder);

  const semanticOrdersBeforeCameraChange = [
    contextClone.renderOrder,
    partyClone.renderOrder,
    interiorClone.renderOrder,
  ];
  targetCloneRoot.rotation.y = Math.PI * 0.75;
  targetCloneRoot.updateMatrixWorld(true);
  expect([
    contextClone.renderOrder,
    partyClone.renderOrder,
    interiorClone.renderOrder,
  ]).toEqual(semanticOrdersBeforeCameraChange);

  expect(resolveP183WallSemanticClass({ name: 'G2_WALL_EXT_N_2F_TEST' })).toBe('EXTERIOR');
  expect(resolveP183WallSemanticClass({ name: 'GREEN_INTERIOR_WALL' })).toBeNull();
});


test('P183 suppresses legacy D floor helper footprints without changing real target styling', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const helper = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
      color: 0x2eae6b,
      transparent: true,
      opacity: 0.12,
    }),
  );
  helper.name = 'D_LEGACY_REFERENCE_FLOOR';
  helper.userData = { representationKind: 'referenceFootprint' };

  const stairHelper = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
      color: 0x2eae6b,
      transparent: true,
      opacity: 0.16,
    }),
  );
  stairHelper.name = 'D_STAIR_HOST_FOOTPRINT';
  stairHelper.userData = { representationKind: 'stairHostFootprint' };

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00aa44, opacity: 1 }),
  );
  wall.name = 'D_WALL_TARGET';
  dScene.add(helper, stairHelper, wall);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const targetCloneRoot = presentation.composite!.children[1];
  const helperClone = targetCloneRoot.getObjectByName('D_LEGACY_REFERENCE_FLOOR') as any;
  const stairHelperClone = targetCloneRoot.getObjectByName('D_STAIR_HOST_FOOTPRINT') as any;
  const wallClone = targetCloneRoot.getObjectByName('D_WALL_TARGET') as any;

  expect(presentation.hiddenAuxiliaryTargetCount).toBe(2);
  expect(presentation.targetRenderableCount).toBe(1);
  expect(helperClone.visible).toBe(false);
  expect(helperClone.userData.p183AuxiliaryFloorSurfaceHidden).toBe(true);
  expect(helperClone.userData.p183ReviewRole).toBe('AUXILIARY_FLOOR_SURFACE_SUPPRESSED');
  expect(stairHelperClone.visible).toBe(false);
  expect(stairHelperClone.userData.p183AuxiliaryFloorSurfaceHidden).toBe(true);
  expect(wallClone.visible).toBe(true);
  expect(wallClone.material.opacity).toBe(p183P160ClosureTargetOpacity);

  expect(helper.visible).toBe(true);
  expect((helper.material as any).opacity).toBe(0.12);
  expect(stairHelper.visible).toBe(true);
  expect((stairHelper.material as any).opacity).toBe(0.16);
});
