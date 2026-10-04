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
  p183P160ClosureTargetOpacity,
  p183TargetPrimaryRenderOrderBase,
  p183TargetSupportRenderOrderBase,
  p183P178bIntegrationRootName,
  prepareP183P160ClosureReviewPresentation,
  resolveP183P160ClosureIntegrationRoot,
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


test('P183 P160 closure review keeps transparent D interior above support with deterministic camera-independent render order', () => {
  const fullScene = new THREE.Group();
  const contextMaterial = new THREE.MeshBasicMaterial({ color: 0x777777 });
  const contextMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), contextMaterial);
  contextMesh.name = 'SITE_CONTEXT';
  fullScene.add(contextMesh);

  const targetComposite = new THREE.Group();
  const dInterior = new THREE.Group();
  dInterior.name = 'D_INTERIOR_PRIMARY_ROOT';
  const support = new THREE.Group();
  support.name = 'P183_SUPPORT_ROOT';

  const makeTarget = (name: string, color: number) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.name = name;
    return mesh;
  };

  dInterior.add(
    makeTarget('GREEN_INTERIOR_WALL_A', 0x00aa44),
    makeTarget('GREEN_INTERIOR_WALL_B', 0x00aa44),
  );
  support.add(
    makeTarget('BLUE_SHELL_SUPPORT', 0x2277aa),
    makeTarget('STAIR_SUPPORT', 0xccaa22),
  );
  targetComposite.add(dInterior, support);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, targetComposite);
  const contextCloneRoot = presentation.composite!.children[0];
  const targetCloneRoot = presentation.composite!.children[1];
  const primaryClone = targetCloneRoot.children[0];
  const supportClone = targetCloneRoot.children[1];

  const renderOrders = (root: any) => {
    const orders: number[] = [];
    root.traverse((object: any) => {
      if (object?.material) orders.push(object.renderOrder);
    });
    return orders;
  };

  const primaryOrders = renderOrders(primaryClone);
  const supportOrders = renderOrders(supportClone);
  const contextOrders = renderOrders(contextCloneRoot);
  const allOrders = [...contextOrders, ...supportOrders, ...primaryOrders];

  expect(primaryOrders).toHaveLength(2);
  expect(supportOrders).toHaveLength(2);
  expect(contextOrders).toHaveLength(1);
  expect(Math.min(...primaryOrders)).toBeGreaterThanOrEqual(p183TargetPrimaryRenderOrderBase);
  expect(Math.min(...supportOrders)).toBeGreaterThanOrEqual(p183TargetSupportRenderOrderBase);
  expect(Math.min(...primaryOrders)).toBeGreaterThan(Math.max(...supportOrders));
  expect(Math.min(...supportOrders)).toBeGreaterThan(Math.max(...contextOrders));
  expect(new Set(allOrders).size).toBe(allOrders.length);

  const stableBeforeCameraChange = renderOrders(targetCloneRoot);
  targetCloneRoot.rotation.y = Math.PI * 0.75;
  targetCloneRoot.updateMatrixWorld(true);
  expect(renderOrders(targetCloneRoot)).toEqual(stableBeforeCameraChange);

  primaryClone.traverse((object: any) => {
    if (!object?.material) return;
    expect(object.userData.p183RenderBand).toBe('D_INTERIOR_PRIMARY');
    expect(object.material.opacity).toBe(p183P160ClosureTargetOpacity);
    expect(object.material.depthWrite).toBe(false);
  });
  supportClone.traverse((object: any) => {
    if (!object?.material) return;
    expect(object.userData.p183RenderBand).toBe('TARGET_SUPPORT');
    expect(object.material.opacity).toBe(p183P160ClosureTargetOpacity);
    expect(object.material.depthWrite).toBe(false);
  });
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
