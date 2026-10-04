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
  isP183WallOcclusionSurface,
  p183P160ClosureTargetOpacity,
  p183TargetPrimaryRenderOrderBase,
  p183TargetSupportRenderOrderBase,
  p183P178bIntegrationRootName,
  prepareP183P160ClosureReviewPresentation,
  resolveP183P160ClosureIntegrationRoot,
  resolveP183WallSemanticClass,
} from '../../src/scripts/privateModelP183ReviewPresentation';
import {
  isEdgeMeshCandidate,
  isSemanticViewerLine,
} from '../../src/scripts/privateModelEdgeVisibility';
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
  expect(presentation.hiddenAuxiliaryContextCount).toBe(0);
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


test('P183 wall occlusion uses explicit metadata and never color or raw mesh names', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeMesh = (
    name: string,
    color: number,
    userData: Record<string, unknown>,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 0.2),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.name = name;
    mesh.userData = userData;
    return mesh;
  };

  const blueShell = makeMesh('BLUE_SHELL_CONTEXT', 0x2277aa, {
    wallClass: 'gableEnvelope',
    representationKind: 'wallThicknessSolid',
    physicalThicknessClaim: true,
  });
  blueShell.position.z = -2;
  fullScene.add(blueShell);

  const greenHelper = makeMesh('GREEN_TRANSPARENT_HELPER', 0x00aa44, {
    PresentationOnly: true,
    Pass: '123C',
    sourceP122BNode: 432,
  });
  greenHelper.position.z = 1;
  fullScene.add(greenHelper);

  const unknownGreen = makeMesh('G2_WALL_INT_NAME_ONLY', 0x00ff2e, {});
  unknownGreen.position.z = 3;
  fullScene.add(unknownGreen);

  const primaryRoot = new THREE.Group();
  primaryRoot.name = 'D_INTERIOR_PRIMARY_ROOT';
  const supportRoot = new THREE.Group();
  supportRoot.name = 'P183_SUPPORT_ROOT';

  const hostWall = makeMesh('D1F_HOST_WORK_ENVELOPE', 0x8855aa, {
    coveringHostIds: ['I04'],
    openingTreatment: 'P154C_WORK_TEST_CUTOUT_APPLIED',
  });
  const semanticLowWall = makeMesh('R210_LOWWALL', 0xccaa33, {
    G2Id: 'G2_WALL_INT_D_2F_TEST_001',
  });
  const stairSupport = makeMesh('STAIR_SUPPORT', 0xccaa22, {
    representationKind: 'guardWorkEnvelopeClosure',
  });

  primaryRoot.add(hostWall);
  supportRoot.add(semanticLowWall, stairSupport);
  dScene.add(primaryRoot, supportRoot);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const contextCloneRoot = presentation.composite!.children[0];
  const targetCloneRoot = presentation.composite!.children[1];
  const blueShellClone = contextCloneRoot.getObjectByName('BLUE_SHELL_CONTEXT') as any;
  const greenHelperClone = contextCloneRoot.getObjectByName('GREEN_TRANSPARENT_HELPER') as any;
  const unknownGreenClone = contextCloneRoot.getObjectByName('G2_WALL_INT_NAME_ONLY') as any;
  const hostWallClone = targetCloneRoot.getObjectByName('D1F_HOST_WORK_ENVELOPE') as any;
  const semanticLowWallClone = targetCloneRoot.getObjectByName('R210_LOWWALL') as any;
  const stairClone = targetCloneRoot.getObjectByName('STAIR_SUPPORT') as any;

  expect(resolveP183WallSemanticClass(semanticLowWallClone)).toBe('INTERIOR');
  expect(resolveP183WallSemanticClass(unknownGreenClone)).toBeNull();

  for (const wall of [blueShellClone, greenHelperClone, hostWallClone, semanticLowWallClone]) {
    expect(isP183WallOcclusionSurface(wall)).toBe(true);
    expect(wall.renderOrder).toBe(p183PhysicalWallRenderOrder);
    expect(wall.userData.p183PhysicalOcclusionSort).toBe(true);
    expect(wall.material.depthTest).toBe(true);
    expect(wall.material.depthWrite).toBe(false);
  }

  expect(hostWallClone.material.opacity).toBe(p183P160ClosureTargetOpacity);
  expect(semanticLowWallClone.material.opacity).toBe(p183P160ClosureTargetOpacity);
  expect(blueShellClone.material.opacity).toBe(p183P160ClosureContextOpacity);
  expect(greenHelperClone.material.opacity).toBe(p183P160ClosureContextOpacity);

  expect(isP183WallOcclusionSurface(unknownGreenClone)).toBe(false);
  expect(unknownGreenClone.userData.p183WallSemanticClass).toBeUndefined();
  expect(unknownGreenClone.renderOrder).toBeGreaterThanOrEqual(p183ContextRenderOrderBase);
  expect(stairClone.userData.p183WallSemanticClass).toBeUndefined();
  expect(stairClone.renderOrder).toBeGreaterThanOrEqual(p183TargetSupportRenderOrderBase);

  expect(blueShellClone.material.color.getHex()).toBe(0x2277aa);
  expect(greenHelperClone.material.color.getHex()).toBe(0x00aa44);
  expect(unknownGreenClone.material.color.getHex()).toBe(0x00ff2e);
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


test('P183 suppresses REFERENCE_OTHER floor helpers from context and edge overlay', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeContextMesh = (
    name: string,
    userData: Record<string, unknown>,
  ) => {
    const material = new THREE.MeshBasicMaterial({ color: 0xd0d3d4, opacity: 0.58 });
    material.userData = { presentationGroup: 'ARCH_BASE' };
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.name = name;
    mesh.userData = userData;
    return mesh;
  };

  const referenceFootprint = makeContextMesh('A_REFERENCE_FOOTPRINT', {
    presentationOnly: true,
    presentationLayer: 'REFERENCE_OTHER',
    representationKind: 'referenceFootprint',
  });
  const stairHostFootprint = makeContextMesh('B_STAIR_HOST_FOOTPRINT', {
    presentationOnly: true,
    presentationLayer: 'REFERENCE_OTHER',
    representationKind: 'stairHostFootprint',
  });
  const physicalContext = makeContextMesh('C_PHYSICAL_CONTEXT', {
    presentationOnly: true,
    presentationLayer: 'REFERENCE_OTHER',
    representationKind: 'wallThicknessSolid',
    physicalThicknessClaim: true,
  });
  fullScene.add(referenceFootprint, stairHostFootprint, physicalContext);

  const targetWall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x88aa99 }),
  );
  targetWall.name = 'D_TARGET_WALL';
  dScene.add(targetWall);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const context = presentation.composite!.children[0];
  const referenceClone = context.getObjectByName('A_REFERENCE_FOOTPRINT') as any;
  const stairClone = context.getObjectByName('B_STAIR_HOST_FOOTPRINT') as any;
  const physicalClone = context.getObjectByName('C_PHYSICAL_CONTEXT') as any;

  expect(presentation.hiddenAuxiliaryContextCount).toBe(2);
  for (const helper of [referenceClone, stairClone]) {
    expect(helper.visible).toBe(false);
    expect(helper.userData.p183AuxiliaryContextFloorSurfaceHidden).toBe(true);
    expect(helper.userData.viewerSuppressEdgeOverlay).toBe(true);
    expect(helper.userData.p183ReviewRole).toBe(
      'AUXILIARY_CONTEXT_FLOOR_SURFACE_SUPPRESSED',
    );
  }

  expect(physicalClone.visible).toBe(true);
  expect(physicalClone.material.opacity).toBe(p183P160ClosureContextOpacity);
  expect(physicalClone.userData.viewerSuppressEdgeOverlay).toBeUndefined();

  referenceClone.visible = true;
  expect(
    isEdgeMeshCandidate(referenceClone, {
      modelRoot: presentation.composite!,
      routePresentationLayers: new Set<string>(),
      isRoofLayerMember: () => false,
      isArchBaseMaterial: (material) =>
        material?.userData?.presentationGroup === 'ARCH_BASE',
    }),
  ).toBe(false);
  referenceClone.visible = false;

  expect(
    isEdgeMeshCandidate(physicalClone, {
      modelRoot: presentation.composite!,
      routePresentationLayers: new Set<string>(),
      isRoofLayerMember: () => false,
      isArchBaseMaterial: (material) =>
        material?.userData?.presentationGroup === 'ARCH_BASE',
    }),
  ).toBe(true);

  expect(referenceFootprint.visible).toBe(true);
  expect(referenceFootprint.userData.viewerSuppressEdgeOverlay).toBeUndefined();
  expect(stairHostFootprint.visible).toBe(true);
  expect(stairHostFootprint.userData.viewerSuppressEdgeOverlay).toBeUndefined();
});


test('P183 hides only metadata-confirmed residual helper lines', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();
  const makeLine = (name: string, userData: Record<string, unknown>) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
    const line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial());
    line.name = name;
    line.userData = userData;
    return line;
  };

  const outline = makeLine('OUTLINE_HELPER', {
    presentationOnly: true,
    presentationLayer: 'CURRENT_D_OUTLINE',
    physicalWallClaim: false,
  });
  const marker = makeLine('FLOOR_MARKER_HELPER', {
    PresentationOnly: true,
    markerType: 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR',
    physicalDoorVoid: false,
  });
  const physicalEdge = makeLine('PHYSICAL_EDGE', {
    presentationOnly: true,
    presentationLayer: 'CURRENT_D_OUTLINE',
    physicalWallClaim: true,
  });
  const openingReference = makeLine('OPENING_REFERENCE', {
    PresentationOnly: true,
    representationKind: 'referenceOpening',
    physicalDoorVoid: false,
  });
  dScene.add(outline, marker, physicalEdge, openingReference);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const target = presentation.composite!.children[1];

  expect(presentation.hiddenAuxiliaryReviewLineCount).toBe(2);
  expect(target.getObjectByName('OUTLINE_HELPER')!.visible).toBe(false);
  expect(target.getObjectByName('FLOOR_MARKER_HELPER')!.visible).toBe(false);
  expect(target.getObjectByName('PHYSICAL_EDGE')!.visible).toBe(true);
  expect(target.getObjectByName('OPENING_REFERENCE')!.visible).toBe(true);
  expect(outline.visible).toBe(true);
  expect(marker.visible).toBe(true);
});


test('P183 edge classification keeps metadata-confirmed 0.1 m cartography lines semantic without name heuristics', () => {
  const makeLine = (userData: Record<string, unknown>) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
    const line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial());
    line.name = 'P143G_CARTO_MINOR_0P1M_LINES';
    line.userData = userData;
    return line;
  };

  const minorContour = makeLine({
    cartographyClass: 'minor',
    intervalM: 0.1,
  });
  const incompleteCartography = makeLine({
    cartographyClass: 'minor',
  });

  expect(isSemanticViewerLine(minorContour)).toBe(true);
  expect(isSemanticViewerLine(incompleteCartography)).toBe(false);
});

test('P183 normal review suppresses non-physical P178B guard and stair lowWall closure helpers only', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeMesh = (name: string, userData: Record<string, unknown>) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xbba56c }),
    );
    mesh.name = name;
    mesh.userData = userData;
    return mesh;
  };

  const guardMetadata = {
    representationKind: 'guardWorkEnvelopeClosure',
    workAssumption: true,
    physicalGuardClaim: false,
    physicalJunctionClaim: false,
    Canonical: false,
    publishToCURRENT: false,
  };
  const lowWallMetadata = {
    G2Id: 'G2_WALL_LOW_D_2F_STAIR_001',
    physicalWallClaim: false,
    physicalLowWallClaim: false,
    physicalJunctionClaim: false,
    Canonical: false,
    publishToCURRENT: false,
  };

  const guard = makeMesh('P178B_GUARD_CLOSURE_TEST', guardMetadata);
  const lowWall = makeMesh('P178B_LOWWALL_CLOSURE_TEST', lowWallMetadata);
  const physicalLowWall = makeMesh('P178B_LOWWALL_PHYSICAL_CONTEXT', {
    G2Id: 'G2_WALL_LOW_D_2F_STAIR_001',
    physicalWallClaim: true,
    physicalLowWallClaim: true,
    physicalJunctionClaim: true,
  });
  dScene.add(guard, lowWall, physicalLowWall);

  fullScene.add(
    makeMesh('P178B_GUARD_CLOSURE_TEST', guardMetadata),
    makeMesh('P178B_LOWWALL_CLOSURE_TEST', lowWallMetadata),
  );

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const context = presentation.composite!.children[0];
  const target = presentation.composite!.children[1];

  expect(presentation.hiddenAuxiliaryGuardLowWallCount).toBe(2);
  expect(target.getObjectByName('P178B_GUARD_CLOSURE_TEST')!.visible).toBe(false);
  expect(target.getObjectByName('P178B_GUARD_CLOSURE_TEST')!.userData.p183ReviewRole).toBe(
    'AUXILIARY_GUARD_LOWWALL_CLOSURE_SUPPRESSED',
  );
  expect(target.getObjectByName('P178B_LOWWALL_CLOSURE_TEST')!.visible).toBe(false);
  expect(target.getObjectByName('P178B_LOWWALL_PHYSICAL_CONTEXT')!.visible).toBe(true);
  expect(context.getObjectByName('P178B_GUARD_CLOSURE_TEST')!.visible).toBe(false);
  expect(context.getObjectByName('P178B_LOWWALL_CLOSURE_TEST')!.visible).toBe(false);

  expect(guard.visible).toBe(true);
  expect(lowWall.visible).toBe(true);
});

test('P183 normal review suppresses only non-physical south and north precise stair clearance workshells', () => {
  const fullScene = new THREE.Group();
  const dScene = new THREE.Group();

  const makeMesh = (name: string, userData: Record<string, unknown>) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xbba56c }),
    );
    mesh.name = name;
    mesh.userData = userData;
    return mesh;
  };

  const baseMetadata = {
    Pass: 'P167F',
    ModelStage: 'WORK_TEST_GEOMETRY',
    Canonical: false,
    publishToCURRENT: false,
    representationKind: 'presentationFloorWorkShellWithPreciseStairClearance',
    presentationWorkShellCutApplied: true,
    physicalOpeningClaim: false,
    physicalFloorShellCutApplied: false,
    physicalSlabThicknessClaim: false,
    physicalFloorBuildUpClaim: false,
    currentClaim: false,
    asBuiltClaim: false,
  };

  const south = makeMesh('SOUTH_TEST', { ...baseMetadata, clearancePartRole: 'SOUTH' });
  const north = makeMesh('NORTH_TEST', { ...baseMetadata, clearancePartRole: 'NORTH' });
  const west = makeMesh('WEST_TEST', { ...baseMetadata, clearancePartRole: 'WEST' });
  const east = makeMesh('EAST_TEST', { ...baseMetadata, clearancePartRole: 'EAST' });
  const sourceSouth = south;
  const sourceNorth = north;
  dScene.add(south, north, west, east);

  const presentation = prepareP183P160ClosureReviewPresentation(fullScene, dScene);
  const target = presentation.composite!.children[1];

  expect(presentation.hiddenAuxiliaryTargetCount).toBe(2);
  expect(target.getObjectByName('SOUTH_TEST')!.visible).toBe(false);
  expect(target.getObjectByName('NORTH_TEST')!.visible).toBe(false);
  expect(target.getObjectByName('SOUTH_TEST')!.userData.p183ReviewRole).toBe(
    'AUXILIARY_STAIR_CLEARANCE_WORKSHELL_SUPPRESSED',
  );
  expect(target.getObjectByName('NORTH_TEST')!.userData.p183ReviewRole).toBe(
    'AUXILIARY_STAIR_CLEARANCE_WORKSHELL_SUPPRESSED',
  );
  expect(target.getObjectByName('WEST_TEST')!.visible).toBe(true);
  expect(target.getObjectByName('EAST_TEST')!.visible).toBe(true);
  expect(sourceSouth.visible).toBe(true);
  expect(sourceNorth.visible).toBe(true);
});
