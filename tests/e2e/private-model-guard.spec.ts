import { expect, test, type Page } from '@playwright/test';

import {
  handlePrivateModelRequest,
  isPrivateModelPath,
  type PrivateModelEnv,
} from '../../worker/privateModel';
import {
  getRequestedReviewCandidateId,
  isWorkTestCandidate,
} from '../../src/scripts/privateModelWorkTest';
import {
  formatSelectionMetadataKey,
  scalarSelectionMetadataValue,
  selectionMetadataEntries,
} from '../../src/scripts/privateModelSelectionMetadata';
import { createSelectionHighlightController } from '../../src/scripts/privateModelSelectionHighlight';
import { pickSelectableObjectAtClientPoint } from '../../src/scripts/privateModelSelectionPicking';
import {
  hasVisibleEdgeMaterial,
  isEdgeMeshCandidate,
  isSemanticViewerLine,
  isTreeVisible,
} from '../../src/scripts/privateModelEdgeVisibility';
import { computeVisibleBounds } from '../../src/scripts/privateModelVisibleBounds';
import {
  p160WarmFloorContextOpacity,
  p160WarmFloorReviewEdgeHex,
  p160WarmFloorReviewEdgeOpacity,
  p160WarmFloorReviewHex,
  p160WarmFloorReviewOpacity,
  p172bDOverviewFloorOpacity,
  p172bDOverviewNeutralWallHex,
  prepareP160WarmFloorReviewPresentation,
  prepareP171Q1WorkShellPresentation,
  prepareP172bDOverviewPresentation,
} from '../../src/scripts/privateModelDOverviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';
import {
  isObjectVisibilityRenderable,
  nearestNamedAncestor,
  sceneNameForObject,
  selectionKindLabel,
} from '../../src/scripts/privateModelSelectionIdentity';

import {
  clampViewerLayerOpacity,
  mergeViewerLayerState,
  type ViewerLayerState,
} from '../../src/scripts/privateModelLayerState';

test('private viewer visible bounds helper preserves mesh filtering and optional non-mesh geometry', () => {
  const root = new THREE.Group();

  const visibleMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6));
  visibleMesh.position.set(5, 0, 0);
  root.add(visibleMesh);

  const hiddenParent = new THREE.Group();
  hiddenParent.visible = false;
  const hiddenMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20));
  hiddenMesh.position.set(100, 0, 0);
  hiddenParent.add(hiddenMesh);
  root.add(hiddenParent);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-10, 1, 0),
    new THREE.Vector3(-8, 1, 0),
  ]);
  const line = new THREE.Line(lineGeometry);
  root.add(line);

  const meshBounds = computeVisibleBounds(root);
  expect(meshBounds).not.toBeNull();
  expect(meshBounds!.min.x).toBeCloseTo(4);
  expect(meshBounds!.max.x).toBeCloseTo(6);
  expect(meshBounds!.min.y).toBeCloseTo(-2);
  expect(meshBounds!.max.y).toBeCloseTo(2);
  expect(meshBounds!.min.z).toBeCloseTo(-3);
  expect(meshBounds!.max.z).toBeCloseTo(3);

  const geometryBounds = computeVisibleBounds(root, true);
  expect(geometryBounds).not.toBeNull();
  expect(geometryBounds!.min.x).toBeCloseTo(-10);
  expect(geometryBounds!.max.x).toBeCloseTo(6);

  const hiddenOnlyRoot = new THREE.Group();
  const hiddenOnlyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  hiddenOnlyMesh.visible = false;
  hiddenOnlyRoot.add(hiddenOnlyMesh);
  expect(computeVisibleBounds(hiddenOnlyRoot)).toBeNull();
});

test('private viewer P160 review hides auxiliary footprints and renders exactly two unified warm floors', () => {
  const interior = new THREE.Group();
  interior.name = 'D CURRENT INTERIOR - BABYLON Y-UP';

  const helperMaterial1F = new THREE.MeshBasicMaterial({
    color: 0x2e9a63,
    transparent: true,
    opacity: 0.12,
  });
  const helper1F = new THREE.Mesh(new THREE.BoxGeometry(2, 0.02, 2), helperMaterial1F);
  helper1F.name = 'P117D_REVIEW_FLOOR_1F';
  helper1F.userData = {
    representationKind: 'referenceFootprint',
    G2Id: 'G2_D15_SPACE_HUONE2_1F_SRC',
  };
  interior.add(helper1F);

  const helperMaterial2F = new THREE.MeshBasicMaterial({
    color: 0x2e9a63,
    transparent: true,
    opacity: 0.16,
  });
  const helper2F = new THREE.Mesh(new THREE.BoxGeometry(2, 0.02, 2), helperMaterial2F);
  helper2F.name = 'P123C_CONTEXT_STAIR_2F';
  helper2F.userData = {
    representationKind: 'stairHostFootprint',
    G2Id: 'G2_STAIR_D_2F_HOST_R_POLY',
  };
  interior.add(helper2F);

  const storageHelperMaterial = new THREE.MeshBasicMaterial({
    color: 0x2e9a63,
    transparent: true,
    opacity: 0.12,
  });
  const storageHelper = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.02, 2),
    storageHelperMaterial,
  );
  storageHelper.name = 'P117D_REVIEW_STORAGE_1F';
  storageHelper.userData = {
    representationKind: 'referenceFootprint',
    G2Id: 'G2_D15_SPACE_VARASTO_1F_SRC',
  };
  interior.add(storageHelper);

  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, opacity: 0.8 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), wallMaterial);
  wall.name = 'P154C_WALL_CONTEXT';
  wall.userData = { representationKind: 'wallContext' };
  interior.add(wall);

  const presentation = prepareP160WarmFloorReviewPresentation(interior);
  const clonedHelper1F = presentation.interiorClone.getObjectByName(helper1F.name) as any;
  const clonedHelper2F = presentation.interiorClone.getObjectByName(helper2F.name) as any;
  const clonedStorageHelper = presentation.interiorClone.getObjectByName(storageHelper.name) as any;
  const clonedWall = presentation.interiorClone.getObjectByName(wall.name) as any;
  const floor1F = presentation.interiorClone.getObjectByName(
    'P160_UNIFIED_WARM_FLOOR_1F_VIEWER_ONLY',
  ) as any;
  const floor2F = presentation.interiorClone.getObjectByName(
    'P160_UNIFIED_WARM_FLOOR_2F_VIEWER_ONLY',
  ) as any;

  expect(presentation.interiorClone).not.toBe(interior);
  expect(presentation.floorSurfaceCount).toBe(2);
  expect(presentation.floorEdgeCount).toBe(2);
  expect(presentation.hiddenHelperSurfaceCount).toBe(3);
  expect(presentation.contextRenderableCount).toBe(1);

  expect(clonedHelper1F.visible).toBe(false);
  expect(clonedHelper2F.visible).toBe(false);
  expect(clonedStorageHelper.visible).toBe(false);
  expect(clonedHelper1F.userData.p160WarmFloorAuxiliaryHidden).toBe(true);
  expect(clonedHelper2F.userData.p160WarmFloorAuxiliaryHidden).toBe(true);
  expect(clonedStorageHelper.userData.p160WarmFloorAuxiliaryHidden).toBe(true);

  expect(floor1F).toBeTruthy();
  expect(floor2F).toBeTruthy();
  expect(floor1F.userData.p160UnifiedWarmFloor).toBe(true);
  expect(floor2F.userData.p160UnifiedWarmFloor).toBe(true);
  expect(floor1F.userData.p160FloorStorey).toBe('1F');
  expect(floor2F.userData.p160FloorStorey).toBe('2F');
  expect(floor1F.userData.p160StairOpeningPreserved).toBe(false);
  expect(floor2F.userData.p160StairOpeningPreserved).toBe(true);
  expect(floor1F.material.opacity).toBe(p160WarmFloorReviewOpacity);
  expect(floor2F.material.opacity).toBe(p160WarmFloorReviewOpacity);
  expect(floor1F.material.color.getHex()).toBe(p160WarmFloorReviewHex);
  expect(floor1F.material.polygonOffset).toBe(true);
  expect(floor1F.renderOrder).toBe(20);

  presentation.interiorClone.updateMatrixWorld(true);
  const floor1FBounds = new THREE.Box3().setFromObject(floor1F);
  expect(floor1FBounds.min.x).toBeCloseTo(0.22, 5);
  expect(floor1FBounds.max.x).toBeCloseTo(6.25, 5);
  expect(floor1FBounds.min.y).toBeCloseTo(0, 5);
  expect(floor1FBounds.max.y).toBeCloseTo(0, 5);
  expect(floor1FBounds.min.z).toBeCloseTo(-8.724, 5);
  expect(floor1FBounds.max.z).toBeCloseTo(-0.249, 5);

  const floor2FBounds = new THREE.Box3().setFromObject(floor2F);
  expect(floor2FBounds.min.x).toBeCloseTo(0.22, 5);
  expect(floor2FBounds.max.x).toBeCloseTo(6.25, 5);
  expect(floor2FBounds.min.y).toBeCloseTo(2.76, 5);
  expect(floor2FBounds.max.y).toBeCloseTo(2.76, 5);
  expect(floor2FBounds.min.z).toBeCloseTo(-10.59, 5);
  expect(floor2FBounds.max.z).toBeCloseTo(-0.25, 5);

  const down = new THREE.Vector3(0, -1, 0);
  const stairVoidRay = new THREE.Raycaster(new THREE.Vector3(1, 3.5, -6), down);
  expect(stairVoidRay.intersectObject(floor2F, false)).toHaveLength(0);
  const warmFloorRay = new THREE.Raycaster(new THREE.Vector3(4, 3.5, -6), down);
  expect(warmFloorRay.intersectObject(floor2F, false).length).toBeGreaterThan(0);

  const floor1FEdge = floor1F.getObjectByName(
    'P160_UNIFIED_WARM_FLOOR_1F_VIEWER_ONLY__EDGE',
  ) as any;
  const floor2FEdge = floor2F.getObjectByName(
    'P160_UNIFIED_WARM_FLOOR_2F_VIEWER_ONLY__EDGE',
  ) as any;
  expect(floor1FEdge).toBeTruthy();
  expect(floor2FEdge).toBeTruthy();
  expect(floor1FEdge.material.color.getHex()).toBe(p160WarmFloorReviewEdgeHex);
  expect(floor1FEdge.material.opacity).toBe(p160WarmFloorReviewEdgeOpacity);
  expect(floor1FEdge.renderOrder).toBe(21);

  expect(clonedWall.material).not.toBe(wallMaterial);
  expect(clonedWall.material.opacity).toBe(p160WarmFloorContextOpacity);
  expect(clonedWall.material.transparent).toBe(true);
  expect(clonedWall.material.depthWrite).toBe(false);
  expect(clonedWall.userData.p160WarmFloorReviewContext).toBe(true);

  expect(helperMaterial1F.opacity).toBeCloseTo(0.12);
  expect(helperMaterial2F.opacity).toBeCloseTo(0.16);
  expect(storageHelperMaterial.opacity).toBeCloseTo(0.12);
  expect(wallMaterial.opacity).toBeCloseTo(0.8);
});

test('private viewer P172B D-overview presentation clone does not mutate source geometry or materials', () => {
  const interior = new THREE.Group();
  interior.name = 'D CURRENT INTERIOR - BABYLON Y-UP';

  const referenceMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa44, transparent: true, opacity: 0.16 });
  const reference = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), referenceMaterial);
  reference.name = 'P123C_CONTEXT_REFERENCE';
  reference.userData = { representationKind: 'referenceFootprint', presentationOnly: true };
  interior.add(reference);

  const lowWallMaterial = new THREE.MeshBasicMaterial({ color: 0xccaa33, transparent: true, opacity: 0.58 });
  const lowWall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lowWallMaterial);
  lowWall.name = 'P123C_LOWWALL_HELPER';
  lowWall.userData = { PresentationOnly: true, Pass: '123C', sourceLowWallNode: 420 };
  interior.add(lowWall);

  const wallMaterialA = new THREE.MeshBasicMaterial({ color: 0x00ff2e, transparent: true, opacity: 0.38 });
  const wallA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMaterialA);
  wallA.name = 'P123C_WALL_HELPER_A';
  wallA.userData = { PresentationOnly: true, Pass: '123C', sourceP122BNode: 432 };
  interior.add(wallA);

  const wallMaterialB = new THREE.MeshBasicMaterial({ color: 0x3399ff, transparent: true, opacity: 0.24 });
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMaterialB);
  wallB.name = 'P123C_WALL_HELPER_B';
  wallB.userData = { PresentationOnly: true, Pass: '123C', sourceP123BNode: 436 };
  interior.add(wallB);

  const workShell = new THREE.Group();
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x949ea8, transparent: true, opacity: 0.22 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), floorMaterial);
  floor.name = 'P167F_CD_2F_WORKSHELL_CLEARANCE_TEST';
  floor.userData = { representationKind: 'presentationFloorWorkShellWithPreciseStairClearance' };
  workShell.add(floor);

  const presentation = prepareP172bDOverviewPresentation(interior, workShell);
  const clonedReference = presentation.interiorClone.getObjectByName(reference.name) as any;
  const clonedLowWall = presentation.interiorClone.getObjectByName(lowWall.name) as any;
  const clonedWallA = presentation.interiorClone.getObjectByName(wallA.name) as any;
  const clonedWallB = presentation.interiorClone.getObjectByName(wallB.name) as any;
  const clonedFloor = presentation.workShellClone.getObjectByName(floor.name) as any;

  expect(presentation.interiorClone).not.toBe(interior);
  expect(presentation.workShellClone).not.toBe(workShell);
  expect(presentation.hiddenContextHelperCount).toBe(2);
  expect(presentation.neutralWallMeshCount).toBe(2);
  expect(presentation.floorMeshCount).toBe(1);
  expect(clonedReference.visible).toBe(false);
  expect(clonedLowWall.visible).toBe(false);

  expect(clonedWallA.material).not.toBe(wallMaterialA);
  expect(clonedWallB.material).not.toBe(wallMaterialB);
  expect(clonedWallA.material.opacity).toBe(1);
  expect(clonedWallA.material.transparent).toBe(false);
  expect(clonedWallA.material.color.getHex()).toBe(p172bDOverviewNeutralWallHex);
  expect(clonedWallB.material.color.getHex()).toBe(p172bDOverviewNeutralWallHex);
  expect(wallMaterialA.opacity).toBeCloseTo(0.38);
  expect(wallMaterialA.transparent).toBe(true);
  expect(wallMaterialA.color.getHex()).toBe(0x00ff2e);
  expect(wallMaterialB.opacity).toBeCloseTo(0.24);
  expect(wallMaterialB.color.getHex()).toBe(0x3399ff);

  expect(clonedFloor.material).not.toBe(floorMaterial);
  expect(clonedFloor.material.opacity).toBe(p172bDOverviewFloorOpacity);
  expect(clonedFloor.material.transparent).toBe(true);
  expect(floorMaterial.opacity).toBeCloseTo(0.22);
  expect(reference.visible).toBe(true);
  expect(lowWall.visible).toBe(true);
});

test('private viewer P171 Q1 replaces translucent floor volumes with one top-surface-only presentation mesh', () => {
  const workShell = new THREE.Group();
  workShell.quaternion.set(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
  const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x949ea8,
    transparent: true,
    opacity: 0.22,
  });
  const floorParts = [
    { name: 'WEST', position: [-1.5, 0, 0], scale: [1, 4, 0.1] },
    { name: 'EAST', position: [1.5, 0, 0], scale: [1, 4, 0.1] },
    { name: 'SOUTH', position: [0, -1.5, 0], scale: [2, 1, 0.1] },
    { name: 'NORTH', position: [0, 1.5, 0], scale: [2, 1, 0.1] },
  ].map(({ name, position, scale }) => {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), floorMaterial);
    floor.name = `P167F_CD_2F_WORKSHELL_CLEARANCE_${name}`;
    floor.position.set(...(position as [number, number, number]));
    floor.scale.set(...(scale as [number, number, number]));
    floor.userData = {
      representationKind: 'presentationFloorWorkShellWithPreciseStairClearance',
      clearancePartRole: name,
    };
    workShell.add(floor);
    return floor;
  });

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xaeb4b8 }),
  );
  wall.name = 'P167F_WALL_CONTEXT_TEST';
  wall.userData = { representationKind: 'presentationWallContext' };
  workShell.add(wall);

  const presentation = prepareP171Q1WorkShellPresentation(workShell);
  const clonedWall = presentation.workShellClone.getObjectByName(wall.name) as any;
  const surface = presentation.floorSurface as any;
  const surfaceBounds = surface.geometry.boundingBox as any;
  presentation.workShellClone.updateMatrixWorld(true);
  const worldSurfaceBounds = new THREE.Box3().setFromObject(surface);

  expect(presentation.workShellClone).not.toBe(workShell);
  expect(presentation.suppressedFloorMeshCount).toBe(4);
  expect(presentation.hiddenFloorVolumeMeshCount).toBe(4);
  expect(presentation.floorSurfaceMeshCount).toBe(1);
  expect(surface.name).toBe('P171_Q1_FLOOR_SHELL_TOP_SURFACE_VIEWER_ONLY');
  expect(surface.userData.viewerSuppressEdgeOverlay).toBe(true);
  expect(surface.userData.p171Q1InternalSeamSuppression).toBe(true);
  expect(surface.userData.representationKind).toBe(
    'presentationFloorWorkShellTopSurfaceReview',
  );
  expect(surface.userData.sourcePartCount).toBe(4);
  expect(surface.geometry.getAttribute('position').count).toBe(16);
  expect(surface.geometry.getIndex()?.count).toBe(24);
  expect(surfaceBounds.min.x).toBeCloseTo(-2);
  expect(surfaceBounds.max.x).toBeCloseTo(2);
  expect(surfaceBounds.min.y).toBeCloseTo(-2);
  expect(surfaceBounds.max.y).toBeCloseTo(2);
  expect(surfaceBounds.min.z).toBeCloseTo(0.05);
  expect(surfaceBounds.max.z).toBeCloseTo(0.05);
  expect(worldSurfaceBounds.min.x).toBeCloseTo(-2);
  expect(worldSurfaceBounds.max.x).toBeCloseTo(2);
  expect(worldSurfaceBounds.min.y).toBeCloseTo(0.05);
  expect(worldSurfaceBounds.max.y).toBeCloseTo(0.05);
  expect(worldSurfaceBounds.min.z).toBeCloseTo(-2);
  expect(worldSurfaceBounds.max.z).toBeCloseTo(2);
  expect(surface.material.opacity).toBeCloseTo(0.22);
  expect(surface.material.transparent).toBe(true);
  expect(surface.material.depthWrite).toBe(false);
  expect(surface.material.polygonOffset).toBe(true);
  expect(clonedWall.userData.viewerSuppressEdgeOverlay).toBeUndefined();

  for (const floor of floorParts) {
    const clonedFloor = presentation.workShellClone.getObjectByName(floor.name) as any;
    expect(clonedFloor.visible).toBe(false);
    expect(clonedFloor.userData.viewerSuppressEdgeOverlay).toBe(true);
    expect(clonedFloor.userData.p171Q1ReplacedByTopSurfaceOnly).toBe(true);
    expect(floor.visible).toBe(true);
    expect(floor.userData.viewerSuppressEdgeOverlay).toBeUndefined();
    expect(floor.userData.p171Q1ReplacedByTopSurfaceOnly).toBeUndefined();
  }
  expect(floorMaterial.opacity).toBeCloseTo(0.22);
});

test('private viewer layer-state helper preserves partial updates and clamps opacity', () => {
  const baseline: ViewerLayerState = {
    roofVisible: true,
    roofOpacity: 0.4,
    locusVisible: false,
    edgeMode: 'visible',
  };

  expect(mergeViewerLayerState(baseline, { roofVisible: false })).toEqual({
    roofVisible: false,
    roofOpacity: 0.4,
    locusVisible: false,
    edgeMode: 'visible',
  });
  expect(mergeViewerLayerState(baseline, { roofOpacity: 1.25, edgeMode: 'none' })).toEqual({
    roofVisible: true,
    roofOpacity: 1,
    locusVisible: false,
    edgeMode: 'none',
  });
  expect(mergeViewerLayerState(baseline, { roofOpacity: -0.25, locusVisible: true })).toEqual({
    roofVisible: true,
    roofOpacity: 0,
    locusVisible: true,
    edgeMode: 'visible',
  });
  expect(clampViewerLayerOpacity(0.65)).toBe(0.65);
});

test('private viewer WORK_TEST routing module preserves review aliases and candidate validation', () => {
  const expectedRoutes = {
    'p153c-d-stair-review': 'p153c-d-stair-guard-lowwall',
    'p154c-d-wall-cutouts-review': 'p154c-d-wall-cutouts',
    'p161-multisource-systems-review': 'p161-multisource-systems-carrier',
    'p170a-p161-review-visibility-review': 'p170a-p161-review-visibility',
    'p170d-p161-review-visibility-correction-review': 'p170d-p161-review-visibility-correction',
    'p171c-d-stair-opening-guard-lowwall-junction-review': 'p171c-d-stair-opening-guard-lowwall-junction',
    'p173d-whole-building-d-wall-hr67-rebase-review': 'p173d-whole-building-d-wall-hr67-rebase',
    'p174a-r2-west-gable-termination-correction-review': 'p174a-r2-west-gable-termination-correction',
    'p175b-r3-near-building-flatter-terrain-review':
      'p175b-r3-near-building-flatter-terrain',
    'p176a-hr6-full-visible-west-gable-termination-correction-review':
      'p176a-hr6-full-visible-west-gable-termination-correction',
    'p177b-hr6-direct-d-storage-north-wall-line-corrected-review':
      'p177b-hr6-direct-d-storage-north-wall-line-corrected',
    'p164b-d-corrected-stair-review': 'p164b-d-corrected-stair',
    'p167f-whole-building-precise-stair-review': 'p167f-whole-building-precise-stair',
    'p168a-whole-building-roof-eave-correction-review': 'p168a-whole-building-roof-eave-correction',
    'p169a-whole-building-ac-storage-visible-review': 'p169a-whole-building-ac-storage-visible',
    'p169f-whole-building-ac-storage-doors-review': 'p169f-whole-building-ac-storage-doors',
    'p159-whole-building-storage-context-review': 'p159-whole-building-storage-context',
    'p160-d-composite-architecture-review': 'p160-d-composite-architecture',
    'p156i-2017-kvv-main-review': 'p156i-2017-kvv-main-presentation',
    'p150fr-whole-building-substructure-review': 'p150fr-whole-building-substructure',
    'p150g-whole-building-end-plinth-review': 'p150g-whole-building-end-plinth',
    'p151c-whole-building-review': 'p151c-whole-building-carrier',
    'p155cb-d-storage-roof-review': 'p155cb-d-storage-roof',
    'p145b-1974-iv-section-worktargets-review': 'p145b-1974-iv-section-worktargets',
    'p144c-g3-1974-iv-review': 'p144c-g3-1974-iv-on-p143h',
    'p143j-scalgo-label-flow-review': 'p143j-scalgo-label-flow',
    'p143h-scalgo-label-axis-review': 'p143h-scalgo-label-axis',
    'p143g-scalgo-cartography-review': 'p143g-scalgo-cartography',
    'p143f-scalgo-contours-review': 'p143f-scalgo-contours',
    'p143a-scalgo-terrain-review': 'p143a-scalgo-terrain',
    'p143d-scalgo-infra-review': 'p143a-scalgo-terrain',
    'p139ac-ground-infra-review': 'p139ab-z-credible-wastewater-review',
    'p139ad-locus-work-z-review': 'p139ab-z-credible-wastewater-review',
  } as const;

  for (const [reviewId, candidateId] of Object.entries(expectedRoutes)) {
    expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(candidateId);
  }

  expect(getRequestedReviewCandidateId('?review=unknown-review')).toBeNull();
  expect(getRequestedReviewCandidateId('')).toBeNull();

  expect(
    isWorkTestCandidate({
      id: 'p149g-valid-candidate',
      label: 'P149G valid candidate',
      path: '/private-model/work-test/p149g-valid-candidate.glb',
    }),
  ).toBe(true);
  expect(
    isWorkTestCandidate({
      id: 'p149g-valid-candidate',
      label: 'P149G invalid path',
      path: '/private-model/model.glb',
    }),
  ).toBe(false);
});

test('private viewer edge visibility helper preserves semantic line and mesh filtering', () => {
  const root: any = { visible: true, parent: null };
  const visibleParent: any = { visible: true, parent: root };
  const hiddenParent: any = { visible: false, parent: root };
  const visibleMaterial = { opacity: 1, userData: {} };
  const routePresentationLayers = new Set(['G3_LOCUS_SITE']);
  const isRoofLayerMember = (object: any) => object?.userData?.presentationLayer === 'REFERENCE_ROOF';
  const isArchBaseMaterial = (material: any) =>
    material?.userData?.presentationGroup === 'ARCH_BASE';
  const candidateOptions = {
    modelRoot: root,
    routePresentationLayers,
    isRoofLayerMember,
    isArchBaseMaterial,
  };

  expect(isSemanticViewerLine({ name: 'utility marker', userData: {} })).toBe(true);
  expect(isSemanticViewerLine({ name: 'wall face', userData: {} })).toBe(false);
  expect(isSemanticViewerLine({ userData: { presentationLayer: 'REFERENCE_ROOF' } })).toBe(true);

  expect(isTreeVisible({ visible: true, parent: visibleParent }, root)).toBe(true);
  expect(isTreeVisible({ visible: true, parent: hiddenParent }, root)).toBe(false);
  expect(hasVisibleEdgeMaterial({ material: visibleMaterial })).toBe(true);
  expect(hasVisibleEdgeMaterial({ material: { opacity: 0 } })).toBe(false);

  const architecturalMesh = {
    name: 'ARCH_WALL',
    isMesh: true,
    geometry: {},
    visible: true,
    parent: visibleParent,
    material: visibleMaterial,
    userData: {},
  };
  expect(isEdgeMeshCandidate(architecturalMesh, candidateOptions)).toBe(true);
  expect(
    isEdgeMeshCandidate(
      { ...architecturalMesh, userData: { viewerSuppressEdgeOverlay: true } },
      candidateOptions,
    ),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate({ ...architecturalMesh, parent: hiddenParent }, candidateOptions),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate(
      { ...architecturalMesh, userData: { presentationLayer: 'G3_LOCUS_SITE' } },
      candidateOptions,
    ),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate(
      { ...architecturalMesh, userData: { presentationSubgroup: 'WATER' } },
      candidateOptions,
    ),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate({ ...architecturalMesh, name: 'TERRAIN_SURFACE' }, candidateOptions),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate(
      { ...architecturalMesh, userData: { presentationOnly: true } },
      candidateOptions,
    ),
  ).toBe(false);
  expect(
    isEdgeMeshCandidate(
      {
        ...architecturalMesh,
        userData: { presentationOnly: true, presentationLayer: 'REFERENCE_ROOF' },
      },
      candidateOptions,
    ),
  ).toBe(true);
  expect(
    isEdgeMeshCandidate(
      {
        ...architecturalMesh,
        userData: { presentationOnly: true },
        material: { opacity: 1, userData: { presentationGroup: 'ARCH_BASE' } },
      },
      candidateOptions,
    ),
  ).toBe(true);
});

test('private viewer selection identity helper preserves object and scene semantics', () => {
  const root: any = { name: 'MODEL_ROOT', parent: null };
  const fallback: any = { name: 'FALLBACK_SCENE', isScene: true, parent: root };
  const scene: any = { name: 'VISIBLE_SCENE_NAME', isScene: true, parent: root };
  const group: any = { name: 'GROUP_A', parent: scene };
  const mesh: any = { name: 'MESH_A', isMesh: true, type: 'Mesh', parent: group };
  const unnamedGroup: any = { name: '', parent: scene };
  const line: any = { isLine: true, type: 'Line', parent: unnamedGroup };
  const segments: any = { isLineSegments: true, type: 'LineSegments', parent: root };
  const custom: any = { type: 'Points', parent: root };

  const names = new WeakMap<object, string>();
  names.set(scene, 'SOURCE_SCENE_NAME');
  names.set(fallback, 'SOURCE_FALLBACK_NAME');

  expect(nearestNamedAncestor(mesh, root)).toBe('GROUP_A');
  expect(nearestNamedAncestor(line, root)).toBe('VISIBLE_SCENE_NAME');
  expect(nearestNamedAncestor({ parent: root }, root)).toBe('');

  expect(sceneNameForObject(mesh, root, names, fallback)).toBe('SOURCE_SCENE_NAME');
  expect(sceneNameForObject(custom, root, names, fallback)).toBe('SOURCE_FALLBACK_NAME');
  expect(sceneNameForObject(custom, root, new WeakMap<object, string>(), fallback)).toBe(
    'FALLBACK_SCENE',
  );
  expect(sceneNameForObject(custom, root, names, null)).toBe('');

  expect(selectionKindLabel(mesh)).toBe('Mesh');
  expect(selectionKindLabel(segments)).toBe('LineSegments');
  expect(selectionKindLabel(line)).toBe('Line');
  expect(selectionKindLabel(custom)).toBe('Points');
  expect(selectionKindLabel({})).toBe('-');

  expect(isObjectVisibilityRenderable(mesh)).toBe(true);
  expect(isObjectVisibilityRenderable(line)).toBe(true);
  expect(isObjectVisibilityRenderable(segments)).toBe(true);
  expect(isObjectVisibilityRenderable(custom)).toBe(false);
  expect(isObjectVisibilityRenderable(null)).toBe(false);
});

test('private viewer selection metadata helper preserves bounded scalar priority semantics', () => {
  const stopAt = { userData: { shouldNotRender: 'stop-root' }, parent: null };
  const parent = {
    userData: {
      Pass: 'PARENT_PASS',
      representationKind: 'wallSolid',
      Canonical: false,
      humanReview: 'NOT_RUN',
      inherited: ' parent value ',
      nested: { ignored: true },
      longValue: 'x'.repeat(181),
    },
    parent: stopAt,
  };
  const child = {
    userData: {
      Pass: 'CHILD_PASS',
      geometryType: 'mesh',
      PresentationOnly: true,
      current: false,
      finite: 2.5,
      notFinite: Number.POSITIVE_INFINITY,
      blank: '   ',
    },
    parent,
  };

  expect(selectionMetadataEntries(child, stopAt)).toEqual([
    ['Pass', 'CHILD_PASS'],
    ['representationKind', 'wallSolid'],
    ['geometryType', 'mesh'],
    ['PresentationOnly', 'true'],
    ['Canonical', 'false'],
    ['current', 'false'],
    ['humanReview', 'NOT_RUN'],
    ['finite', '2.5'],
    ['inherited', 'parent value'],
  ]);
  expect(formatSelectionMetadataKey('representationKind')).toBe('Representation Kind');
  expect(formatSelectionMetadataKey('source_role-test')).toBe('Source role test');
  expect(scalarSelectionMetadataValue(false)).toBe('false');
  expect(scalarSelectionMetadataValue({ nested: true })).toBeNull();
  expect(scalarSelectionMetadataValue('x'.repeat(181))).toBeNull();

  let chain: any = { userData: { depth0: 'value0' }, parent: stopAt };
  for (let index = 1; index < 10; index += 1) {
    chain = { userData: { [`depth${index}`]: `value${index}` }, parent: chain };
  }
  const bounded = selectionMetadataEntries(chain, stopAt);
  expect(bounded).toHaveLength(8);
  expect(bounded.some(([key]) => key === 'depth1')).toBe(false);
  expect(bounded.some(([key]) => key === 'depth2')).toBe(true);

  const many = {
    userData: Object.fromEntries(
      Array.from({ length: 24 }, (_, index) => [`field${String(index).padStart(2, '0')}`, index]),
    ),
    parent: stopAt,
  };
  expect(selectionMetadataEntries(many, stopAt)).toHaveLength(12);
});

test('private viewer selection picking helper preserves hit filtering and pointer normalization', () => {
  const pointer = { x: 0, y: 0 };
  const camera = { id: 'camera' };
  const modelRoot = { children: [{ id: 'root-child' }] };
  const visibleMesh = { id: 'visible', isMesh: true };
  const hiddenMesh = { id: 'hidden', isMesh: true };
  const materialHiddenLine = { id: 'material-hidden', isLine: true };
  const unsupported = { id: 'unsupported', type: 'Points' };
  const setFromCameraCalls: Array<{ x: number; y: number; camera: any }> = [];
  const intersectCalls: Array<{ objects: any[]; recursive: boolean }> = [];

  const raycaster = {
    setFromCamera: (nextPointer: { x: number; y: number }, nextCamera: any) => {
      setFromCameraCalls.push({ x: nextPointer.x, y: nextPointer.y, camera: nextCamera });
    },
    intersectObjects: (objects: any[], recursive: boolean) => {
      intersectCalls.push({ objects, recursive });
      return [
        { object: unsupported },
        { object: hiddenMesh },
        { object: materialHiddenLine },
        { object: visibleMesh },
      ];
    },
  };

  const picked = pickSelectableObjectAtClientPoint({
    canvas: {
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 100 }),
    },
    camera,
    modelRoot,
    raycaster,
    pointer,
    clientX: 160,
    clientY: 45,
    isEffectivelyVisible: (object) => object !== hiddenMesh,
    hasVisibleMaterial: (object) => object !== materialHiddenLine,
  });

  expect(picked).toBe(visibleMesh);
  expect(pointer).toEqual({ x: 0.5, y: 0.5 });
  expect(setFromCameraCalls).toEqual([{ x: 0.5, y: 0.5, camera }]);
  expect(intersectCalls).toEqual([{ objects: modelRoot.children, recursive: true }]);

  let zeroRectRaycast = false;
  expect(
    pickSelectableObjectAtClientPoint({
      canvas: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 100 }),
      },
      camera,
      modelRoot,
      raycaster: {
        setFromCamera: () => {
          zeroRectRaycast = true;
        },
        intersectObjects: () => [],
      },
      pointer,
      clientX: 0,
      clientY: 0,
      isEffectivelyVisible: () => true,
      hasVisibleMaterial: () => true,
    }),
  ).toBeNull();
  expect(zeroRectRaycast).toBe(false);
});

test('private viewer selection highlight controller replaces and disposes helper lifecycle', () => {
  const events: string[] = [];

  class FakeBoxHelper {
    geometry = { dispose: () => events.push(`geometry:dispose:${this.object.id}`) };
    material = { dispose: () => events.push(`material:dispose:${this.object.id}`) };

    constructor(
      readonly object: { id: string },
      readonly color?: number,
    ) {
      events.push(`construct:${object.id}:${color?.toString(16)}`);
    }

    update() {
      events.push(`update:${this.object.id}`);
    }
  }

  const scene = {
    add: (helper: FakeBoxHelper) => events.push(`scene:add:${helper.object.id}`),
    remove: (helper: FakeBoxHelper) => events.push(`scene:remove:${helper.object.id}`),
  };
  const controller = createSelectionHighlightController({
    scene,
    BoxHelper: FakeBoxHelper,
  });

  controller.select({ id: 'first' });
  controller.update();
  controller.select({ id: 'second' });
  controller.clear();
  controller.clear();
  controller.update();

  expect(events).toEqual([
    'construct:first:356a8a',
    'scene:add:first',
    'update:first',
    'update:first',
    'scene:remove:first',
    'geometry:dispose:first',
    'material:dispose:first',
    'construct:second:356a8a',
    'scene:add:second',
    'update:second',
    'scene:remove:second',
    'geometry:dispose:second',
    'material:dispose:second',
  ]);
});

const makeMinimalGlb = (json: Record<string, unknown>) => {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonChunk.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);

  return Buffer.concat([header, chunkHeader, jsonChunk]);
};


const makeTriangleGlb = (
  nodeExtras: Record<string, unknown> = {},
  materialExtras: Record<string, unknown> | null = null,
  materialOpacity = 1,
) => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'D_1F_TEST_GROUP', mesh: 0, extras: nodeExtras }],
    meshes: [
      {
        name: 'TEST_TRIANGLE',
        primitives: [
          {
            attributes: { POSITION: 0 },
            ...(materialExtras ? { material: 0 } : {}),
          },
        ],
      },
    ],
    ...(materialExtras
      ? {
          materials: [
            {
              name: 'TEST_ARCH_BASE',
              pbrMetallicRoughness: {
                baseColorFactor: [0.45, 0.55, 0.65, materialOpacity],
                metallicFactor: 0,
                roughnessFactor: 1,
              },
              alphaMode: materialOpacity < 1 ? 'BLEND' : 'OPAQUE',
              doubleSided: true,
              extras: materialExtras,
            },
          ],
        }
      : {}),
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (positions.length % 4)) % 4;
  const binChunk = Buffer.concat([positions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeP177bAlignmentGlb = () => {
  const positions = Buffer.alloc(144);
  [
    0, 10.81, 0,
    0.12, 10.81, 0,
    0.12, 10.81, 2,
    0, 10.81, 0,
    0.12, 10.81, 2,
    0, 10.81, 2,
    0, 10.81, 3,
    0.12, 10.81, 3,
    0.12, 10.81, 5,
    0, 10.81, 3,
    0.12, 10.81, 5,
    0, 10.81, 5,
  ].forEach((value, index) => positions.writeFloatLE(value, index * 4));

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P177B HR-6 DIRECT D-STORAGE NORTH WALL LINE CORRECTED - WORK_TEST',
        nodes: [2],
        extras: {
          Pass: 'P177B',
          successorOfPass: 'P176A',
          currentClaim: false,
          asBuiltClaim: false,
          Canonical: false,
          publishToCURRENT: false,
          humanReview: 'CORRECTION_REQUIRED_NOT_PASS',
        },
      },
    ],
    nodes: [
      {
        name: 'P177B_LOWER_D_STORAGE_NORTH_TERMINATION_LINE',
        mesh: 0,
        extras: { reviewRole: 'LOWER_D_STORAGE_NORTH_TERMINATION', targetNorthY: 10.81 },
      },
      {
        name: 'P177B_UPPER_2F_NORTH_REFERENCE_LINE',
        mesh: 1,
        extras: { reviewRole: 'UPPER_2F_NORTH_REFERENCE', targetNorthY: 10.81 },
      },
      {
        name: 'P177B_YLIS_G1_LOCAL_ROOT',
        children: [0, 1],
        rotation: [-0.7071067811865476, 0, 0, 0.7071067811865476],
      },
    ],
    meshes: [
      { name: 'P177B_LOWER_ALIGNMENT_SURFACE', primitives: [{ attributes: { POSITION: 0 } }] },
      { name: 'P177B_UPPER_ALIGNMENT_SURFACE', primitives: [{ attributes: { POSITION: 1 } }] },
    ],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 72, target: 34962 },
      { buffer: 0, byteOffset: 72, byteLength: 72, target: 34962 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 6,
        type: 'VEC3',
        min: [0, 10.81, 0],
        max: [0.12, 10.81, 2],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 6,
        type: 'VEC3',
        min: [0, 10.81, 3],
        max: [0.12, 10.81, 5],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binChunk = positions;
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const makeP143dTerrainGlb = () => {
  const positions = Buffer.alloc(48);
  [
    0, 0, -80,
    80, 0, -80,
    0, 0, 80,
    80, 0, 80,
  ].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const indices = Buffer.alloc(12);
  [0, 2, 1, 1, 2, 3].forEach((value, index) => {
    indices.writeUInt16LE(value, index * 2);
  });

  const binary = Buffer.concat([positions, indices]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143A SCALGO CURRENT TERRAIN + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [0],
      },
    ],
    nodes: [
      {
        name: 'P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_NODE',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          ModelStage: 'WORK_TEST_VIEW',
          Pass: '143A',
          geometryType: 'terrainReferenceSurface',
          representationKind: 'currentTerrainReference',
          workVerticalOffsetM: 21.75,
          verticalBridgeStatus: 'WORK_OFFSET_UNVERIFIED',
        },
      },
    ],
    meshes: [
      {
        name: 'P143A_TEST_TERRAIN_MESH',
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
          },
        ],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: positions.length,
        byteLength: indices.length,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        type: 'VEC3',
        min: [0, 0, -80],
        max: [80, 0, 80],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 6,
        type: 'SCALAR',
        min: [0],
        max: [3],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeP139abReviewGlb = () => {
  const architecturePositions = Buffer.alloc(36);
  [-1, 0, -1, 1, 0, -1, 0, 2, 1].forEach((value, index) => {
    architecturePositions.writeFloatLE(value, index * 4);
  });

  const routePositions = Buffer.alloc(24);
  [-1, -0.5, 0, 1, -0.5, 0].forEach((value, index) => {
    routePositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([architecturePositions, routePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 2,
    scenes: [
      {
        name: 'P139E WATER + WASTEWATER CONNECTION ZONE REVIEW ON P139C - BABYLON Y-UP',
        nodes: [0],
      },
      {
        name: 'P139H TEST SHARED ARCHITECTURE OWNER - BABYLON Y-UP',
        nodes: [2],
      },
      {
        name: 'P139AB Z CREDIBILITY REVIEW - SOURCE Z / DATUM UNVERIFIED - NOT AS-BUILT',
        nodes: [3],
      },
    ],
    nodes: [
      { name: 'P139E_TEST_ROOT', children: [1] },
      {
        name: 'P139AB_TEST_ARCH_BUILDING',
        mesh: 0,
        extras: { presentationGroup: 'ARCH_BASE' },
      },
      { name: 'P139H_TEST_ROOT', children: [1] },
      {
        name: 'P139AB_TEST_ROOT',
        children: [4],
        extras: { reviewScope: 'Z_CREDIBILITY_ONLY', buildingContext: true },
      },
      {
        name: 'P139AB_TEST_Z_ROUTE',
        mesh: 1,
        extras: { presentationLayer: 'Z_CREDIBLE_WASTEWATER_REVIEW' },
      },
    ],
    meshes: [
      {
        name: 'P139AB_TEST_ARCH_MESH',
        primitives: [{ attributes: { POSITION: 0 } }],
      },
      {
        name: 'P139AB_TEST_Z_ROUTE_MESH',
        primitives: [{ attributes: { POSITION: 1 }, mode: 3 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: architecturePositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: architecturePositions.length,
        byteLength: routePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, 0, -1],
        max: [1, 2, 1],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, -0.5, 0],
        max: [1, -0.5, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeDReviewGlb = (options: { includeUserCurrentDoors?: boolean } = {}) => {
  const { includeUserCurrentDoors = false } = options;
  const wallPositions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    wallPositions.writeFloatLE(value, index * 4);
  });
  const contextPositions = Buffer.alloc(36);
  [-1, -1, -0.1, 1, -1, -0.1, 0, 1, -0.1].forEach((value, index) => {
    contextPositions.writeFloatLE(value, index * 4);
  });
  const leaked2FLinePositions = Buffer.alloc(24);
  [-0.75, -0.75, -0.2, 0.75, -0.75, -0.2].forEach((value, index) => {
    leaked2FLinePositions.writeFloatLE(value, index * 4);
  });
  const doorMarkerIds = [
    'G2_DOOR_EXT_D_1F_S_001',
    'G2_DOOR_EXT_D_1F_N_001',
    'G2_DOOR_INT_D_1F_VH_WEST_2015_001',
    'G2_DOOR_INT_D_1F_WC_001',
    'G2_DOOR_INT_D_1F_SAUNA_PESUH_2015_001',
    'G2_DOOR_INT_D_1F_VH_NORTH_2015_001',
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
    'G2_DOOR_EXT_D_2F_S_001_ANCHOR',
    'G2_DOOR_INT_D_2F_WC_001',
    'G2_DOOR_INT_D_2F_ROOM4_001',
    'G2_DOOR_INT_D_2F_ROOM3_001',
  ];
  const userCurrentDoorIds = [
    'D1F_USER_CURRENT_DOOR_A',
    'D1F_USER_CURRENT_DOOR_B',
  ];
  const userCurrentDoorNodes = includeUserCurrentDoors
    ? userCurrentDoorIds.map((reviewDoorId, index) => ({
        name: `P137J_HMARK_USER_DOOR_${index === 0 ? 'A' : 'B'}_D_1F`,
        mesh: 3,
        translation: [0.2 + index * 0.2, 0, 0.2 + index * 0.05],
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '137J',
          reviewDoorId,
          reviewAnchorId: `HUMAN_REVIEW_ANCHOR_${index === 0 ? 'A' : 'B'}`,
          storey: '1F',
          sourceClass: 'USER_CURRENT_STATE_DIRECT_OBSERVATION',
          userConfirmedDoor: true,
          userConfirmedCurrentState: true,
          approx: true,
          markerType: 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR',
          markerVerticalExtentM: null,
          doorHeightClaim: false,
          doorLeafGeometryAdded: false,
          physicalDoorVoid: false,
          asBuiltClaim: false,
          refinementPending: true,
        },
      }))
    : [];

  const binary = Buffer.concat([wallPositions, contextPositions, leaked2FLinePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [0] },
    ],
    nodes: [
      {
        name: 'P136B_D_REVIEW_ROOT',
        children: [
          1,
          2,
          3,
          4,
          ...doorMarkerIds.map((_, index) => 5 + index),
          ...userCurrentDoorNodes.map((_, index) => 5 + doorMarkerIds.length + index),
        ],
      },
      {
        name: 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '123C',
          sourceP123BNode: 434,
          alpha: 0.38,
        },
      },
      {
        name: 'P117D_REVIEW_P87_VIEW_G2_D15_SPACE_SAUNA_1F_SRC',
        mesh: 1,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '117D',
          representationKind: 'referenceFootprint',
        },
      },
      {
        name: 'P87_VIEW_P84_OUTLINE_G2_D15_SPACE_WC_2F_SRC',
        mesh: 2,
        extras: {
          presentationOnly: true,
          presentationLayer: 'CURRENT_D_OUTLINE',
        },
      },
      {
        name: 'P123C_D2F_TRANSPARENT_FULL_WALL_HELPER',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '123C',
          sourceP122BNode: 432,
          alpha: 0.38,
        },
      },
      ...doorMarkerIds.map((g2Id, index) => ({
        name: `P128B_HMARK_${g2Id}`,
        mesh: 3,
        translation: [0, 0, index * 0.01],
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '128B',
          derivedFromG2Id: g2Id,
          storey: index < 7 ? '1F' : '2F',
          markerType: 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR',
          markerVerticalExtentM: null,
          doorHeightClaim: false,
          doorLeafGeometryAdded: false,
          physicalDoorVoid: false,
          asBuiltClaim: false,
        },
      })),
      ...userCurrentDoorNodes,
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 1 }, material: 1 }] },
      { primitives: [{ attributes: { POSITION: 2 }, material: 1, mode: 1 }] },
      { primitives: [{ attributes: { POSITION: 2 }, material: 2, mode: 1 }] },
    ],
    materials: [
      {
        name: 'P123C_D_REVIEW_WALL_TRANSPARENT',
        pbrMetallicRoughness: { baseColorFactor: [0.08, 1, 0.18, 0.38] },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        name: 'P117D_D1F_REVIEW_CONTEXT_TRANSPARENT',
        pbrMetallicRoughness: { baseColorFactor: [0.18, 0.68, 0.42, 0.12] },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        name: 'P128B_D_DOOR_HORIZONTAL_ONLY_MARKER_ORANGE',
        pbrMetallicRoughness: { baseColorFactor: [0.78, 0.22, 0.1, 1] },
        doubleSided: true,
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: wallPositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: wallPositions.length,
        byteLength: contextPositions.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: wallPositions.length + contextPositions.length,
        byteLength: leaked2FLinePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, -0.1],
        max: [1, 1, -0.1],
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-0.75, -0.75, -0.2],
        max: [0.75, -0.75, -0.2],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const makeMeshAndLineGlb = () => {
  const trianglePositions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    trianglePositions.writeFloatLE(value, index * 4);
  });

  const linePositions = Buffer.alloc(24);
  [20, 0, 0, 24, 0, 0].forEach((value, index) => {
    linePositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([trianglePositions, linePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      { name: 'BUILDING_MESH', mesh: 0 },
      {
        name: 'SITE_LINE',
        mesh: 1,
        extras: { presentationLayer: 'REFERENCE_ROOF' },
      },
    ],
    meshes: [
      { name: 'BUILDING_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] },
      {
        name: 'SITE_LINE_SEGMENTS',
        primitives: [{ attributes: { POSITION: 1 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: trianglePositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: trianglePositions.length,
        byteLength: linePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [20, 0, 0],
        max: [24, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};



const makeAdjacentTrianglesWithLinesGlb = () => {
  const triangleA = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => {
    triangleA.writeFloatLE(value, index * 4);
  });
  const triangleB = Buffer.alloc(36);
  [1, 0, 0, 1, 1, 0, 0, 1, 0].forEach((value, index) => {
    triangleB.writeFloatLE(value, index * 4);
  });
  const legacyLine = Buffer.alloc(24);
  [0.2, 0.2, 0, 0.8, 0.8, 0].forEach((value, index) => {
    legacyLine.writeFloatLE(value, index * 4);
  });
  const semanticLine = Buffer.alloc(24);
  [0, 0.5, 0, 1, 0.5, 0].forEach((value, index) => {
    semanticLine.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([triangleA, triangleB, legacyLine, semanticLine]);
  const offsets = [
    0,
    triangleA.length,
    triangleA.length + triangleB.length,
    triangleA.length + triangleB.length + legacyLine.length,
  ];
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P146A EDGE MODE TEST - BABYLON Y-UP', nodes: [0, 1, 2, 3] }],
    nodes: [
      { name: 'ARCH_TRIANGLE_A', mesh: 0 },
      { name: 'ARCH_TRIANGLE_B', mesh: 1 },
      { name: 'LEGACY_UNTYPED_GRAY_LINE', mesh: 2 },
      {
        name: 'SEMANTIC_ANNOTATION_LINE',
        mesh: 3,
        extras: { presentationLayer: 'TECHNICAL_ANNOTATION' },
      },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 } }] },
      { primitives: [{ attributes: { POSITION: 1 } }] },
      { primitives: [{ attributes: { POSITION: 2 }, mode: 1 }] },
      { primitives: [{ attributes: { POSITION: 3 }, mode: 1 }] },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: offsets[0], byteLength: triangleA.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[1], byteLength: triangleB.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[2], byteLength: legacyLine.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[3], byteLength: semanticLine.length, target: 34962 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [0.2, 0.2, 0],
        max: [0.8, 0.8, 0],
      },
      {
        bufferView: 3,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [0, 0.5, 0],
        max: [1, 0.5, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeLineGlb = () => {
  const linePositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    linePositions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [
      {
        name: 'SITE_LINE',
        mesh: 0,
        extras: { presentationLayer: 'REFERENCE_ROOF' },
      },
    ],
    meshes: [
      {
        name: 'SITE_LINE_SEGMENTS',
        primitives: [{ attributes: { POSITION: 0 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: linePositions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: linePositions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (linePositions.length % 4)) % 4;
  const binChunk = Buffer.concat([linePositions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeLocusLayerGlb = () => {
  const waterPositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    waterPositions.writeFloatLE(value, index * 4);
  });

  const wastewaterPositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    wastewaterPositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([waterPositions, wastewaterPositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      {
        name: 'LOCUS_WATER_LINE',
        mesh: 0,
        extras: {
          presentationLayer: 'G3_LOCUS_SITE',
          presentationSubgroup: 'WATER',
          ModelStage: 'WORK_TEST_PRESENTATION',
        },
      },
      {
        name: 'LOCUS_WASTEWATER_LINE',
        mesh: 1,
        extras: {
          presentationLayer: 'G3_LOCUS_SITE',
          presentationSubgroup: 'WASTEWATER',
          ModelStage: 'WORK_TEST_PRESENTATION',
        },
      },
    ],
    meshes: [
      {
        name: 'LOCUS_WATER_SEGMENTS',
        primitives: [{ attributes: { POSITION: 0 }, mode: 1 }],
      },
      {
        name: 'LOCUS_WASTEWATER_SEGMENTS',
        primitives: [{ attributes: { POSITION: 1 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: waterPositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: waterPositions.length,
        byteLength: wastewaterPositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const openToolbarMenu = async (page: Page, selector: '#view-menu' | '#model-menu' | '#more-menu') => {
  const menu = page.locator(selector);
  if ((await menu.getAttribute('open')) === null) {
    await menu.locator(':scope > summary').click();
  }
};

const clickViewAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#view-menu');
  await page.getByRole('button', { name, exact: true }).click();
};

const clickModelAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name, exact: true }).click();
};

const clickMoreAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#more-menu');
  await page.getByRole('button', { name, exact: true }).click();
};


test('private model route matching is bounded to its own prefix', () => {
  expect(isPrivateModelPath('/private-model')).toBe(true);
  expect(isPrivateModelPath('/private-model/')).toBe(true);
  expect(isPrivateModelPath('/private-model/model.glb')).toBe(true);
  expect(isPrivateModelPath('/private-modelish')).toBe(false);
  expect(isPrivateModelPath('/current/private-model')).toBe(false);
});

test('private model handler fails closed before static assets without Access configuration', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/', { method: 'GET' }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(assetFetches).toBe(0);
});

test('private model handler rejects unsupported methods before auth or assets', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/model.glb', { method: 'POST' }),
    env,
  );

  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD');
  expect(assetFetches).toBe(0);
});

test('private viewer view menu stays inside a short viewport and keeps every preset reachable', async ({ page }) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });

  await page.setViewportSize({ width: 1536, height: 768 });
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await openToolbarMenu(page, '#view-menu');

  const panel = page.locator('#view-menu > .toolbar-menu-panel');
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.y + box.height).toBeLessThanOrEqual(758);

  const finalPreset = page.getByRole('button', { name: 'Julk -X', exact: true });
  await finalPreset.scrollIntoViewIfNeeded();
  await expect(finalPreset).toBeVisible();
});


test('private viewer resolves the source D scene even when Three runtime names are sanitized', async ({
  page,
}) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');

  await expect(page.locator('#view-menu > summary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Layerit' })).toBeVisible();
  await expect(page.locator('#model-source-badge')).toBeVisible();
  await expect(page.locator('#more-menu > summary')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');

  await clickViewAction(page, 'D-asunto');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(page.getByRole('status')).toHaveText('D-asunto - molemmat kerrokset, vapaa 3D');
});



test('private viewer selects a visible mesh, shows bounded identity, metadata, and ignores orbit drags', async ({ page }) => {
  const model = makeTriangleGlb({
    Pass: '149E_TEST',
    representationKind: 'wallSolid',
    Canonical: false,
    humanReview: 'NOT_RUN',
    nestedIgnored: { shouldNotRender: true },
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  await expect(panel).toBeHidden();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).not.toHaveText('-');
  await expect(page.locator('#selection-floor')).toHaveText('1F');
  await expect(page.locator('#selection-scene')).toHaveText('P133D REVIEW ROOT - BABYLON Y-UP');
  await expect(page.locator('#selection-kind')).toHaveText('Mesh');
  const metadataDetails = page.locator('#selection-panel details.selection-metadata');
  await expect(metadataDetails).not.toHaveAttribute('open', '');
  await metadataDetails.locator('summary').click();
  await expect(metadataDetails).toHaveAttribute('open', '');
  await expect(page.locator('#selection-metadata-list')).toContainText('Pass');
  await expect(page.locator('#selection-metadata-list')).toContainText('149E_TEST');
  await expect(page.locator('#selection-metadata-list')).toContainText('Representation Kind');
  await expect(page.locator('#selection-metadata-list')).toContainText('wallSolid');
  await expect(page.locator('#selection-metadata-list')).toContainText('Canonical');
  await expect(page.locator('#selection-metadata-list')).toContainText('false');
  await expect(page.locator('#selection-metadata-list')).toContainText('Human Review');
  await expect(page.locator('#selection-metadata-list')).toContainText('NOT_RUN');
  await expect(page.locator('#selection-metadata-list')).not.toContainText('shouldNotRender');
  const metadataCount = Number(await canvas.getAttribute('data-selection-metadata-count'));
  expect(metadataCount).toBeGreaterThanOrEqual(4);
  await expect(canvas).toHaveAttribute('data-selection-metadata-source', 'userData');

  await page.getByRole('button', { name: 'Tyhjennä' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#selection-mesh')).toHaveText('-');
  await expect(page.locator('#selection-group')).toHaveText('-');
  await expect(page.locator('#selection-scene')).toHaveText('-');
  await expect(page.locator('#selection-floor')).toHaveText('-');
  await expect(page.locator('#selection-kind')).toHaveText('-');
  await expect(canvas).not.toHaveAttribute('data-selection-metadata-count', /.+/);
  await expect(canvas).not.toHaveAttribute('data-selection-metadata-source', /.+/);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40);
  await page.mouse.up();
  await expect(panel).toBeHidden();
});



test('private viewer can isolate, hide, and restore a selected object without changing model data', async ({ page }) => {
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  const showAll = page.locator('#show-all-objects-button');
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'inactive');
  await expect(showAll).toBeDisabled();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Isoloi' }).click();
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'active');
  await expect(canvas).toHaveAttribute('data-object-visibility-mode', 'isolate');
  await expect(showAll).toBeEnabled();
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Piilota' }).click();
  await expect(canvas).toHaveAttribute('data-object-visibility-mode', 'hide');
  await expect(panel).toBeHidden();

  await page.locator('#more-menu > summary').click();
  await showAll.click();
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'inactive');
  await expect(showAll).toBeDisabled();
  expect(await canvas.getAttribute('data-object-visibility-mode')).toBeNull();
  expect(await canvas.getAttribute('data-object-visibility-target')).toBeNull();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
});


test('private viewer can enable, adjust, and disable the presentation-only horizontal clipping plane', async ({ page }) => {
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const toggle = page.locator('#clip-plane-enabled');
  const height = page.locator('#clip-plane-height');
  const value = page.locator('#clip-plane-value');

  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'inactive');

  await page.locator('#more-menu > summary').click();
  await expect(toggle).toBeEnabled();
  await expect(height).toBeDisabled();

  const min = Number(await height.getAttribute('min'));
  const max = Number(await height.getAttribute('max'));
  expect(Number.isFinite(min)).toBe(true);
  expect(Number.isFinite(max)).toBe(true);
  expect(max).toBeGreaterThan(min);

  await toggle.check();
  await expect(height).toBeEnabled();
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'active');
  await expect(canvas).toHaveAttribute('data-horizontal-clip-side', 'above');

  const requested = min + (max - min) * 0.5;
  await height.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, requested);

  const applied = Number(await canvas.getAttribute('data-horizontal-clip-height-m'));
  expect(Math.abs(applied - requested)).toBeLessThan(0.01);
  await expect(value).toContainText('m');

  await toggle.uncheck();
  await expect(height).toBeDisabled();
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'inactive');
  await expect(canvas).not.toHaveAttribute('data-horizontal-clip-height-m', /.+/);
  await expect(canvas).not.toHaveAttribute('data-horizontal-clip-side', /.+/);
  await expect(canvas).toHaveAttribute('data-horizontal-clip-min-y', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-horizontal-clip-max-y', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
});


test('private viewer derives four edge modes from mesh geometry and preserves semantic lines', async ({ page }) => {
  const model = makeAdjacentTrianglesWithLinesGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'visible');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '2');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '4');
  await expect(canvas).toHaveAttribute('data-edge-legacy-suppressed-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-semantic-line-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'true');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const edgeMode = page.locator('#edge-mode-select');

  await edgeMode.selectOption('object');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'object');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '6');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'false');

  await edgeMode.selectOption('unified');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'unified');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '4');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'false');

  await edgeMode.selectOption('none');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'none');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '0');
  await expect(canvas).toHaveAttribute('data-edge-legacy-suppressed-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-semantic-line-count', '1');
});


test('private viewer selects visible LineSegments and clears hidden line selection', async ({ page }) => {
  const model = makeLineGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).toContainText('SITE_LINE');

  await page.getByRole('button', { name: 'Layerit' }).click();
  await page.locator('#roof-layer-visible').uncheck();
  await expect(panel).toBeHidden();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeHidden();
});

test('private viewer exposes Locus as a semantic parent layer with WATER and WASTEWATER child layers', async ({ page }) => {
  const model = makeLocusLayerGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  await page.getByRole('button', { name: 'Layerit' }).click();

  const locusToggle = page.locator('#locus-layer-visible');
  const waterToggle = page.locator('#locus-water-visible');
  const wastewaterToggle = page.locator('#locus-wastewater-visible');

  await expect(page.getByText('Locus kunnallistekniikka (WORK_TEST)')).toBeVisible();
  await expect(page.locator('#locus-layer-children')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-locus-layer-hierarchy', 'presentationSubgroup');
  await expect(locusToggle).toBeEnabled();
  await expect(locusToggle).not.toBeChecked();
  await expect(waterToggle).toBeChecked();
  await expect(wastewaterToggle).toBeChecked();
  await expect(waterToggle).toBeDisabled();
  await expect(wastewaterToggle).toBeDisabled();
  await expect(page.locator('#locus-layer-count')).toHaveText('2 kohdetta');
  await expect(page.locator('#locus-water-count')).toHaveText('Vesi 1');
  await expect(page.locator('#locus-wastewater-count')).toHaveText('Jätevesi 1');
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'off');

  await locusToggle.check();
  await expect(waterToggle).toBeEnabled();
  await expect(wastewaterToggle).toBeEnabled();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'all');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'true');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');

  await waterToggle.uncheck();
  await expect(locusToggle).toBeChecked();
  await expect(locusToggle).toHaveJSProperty('indeterminate', true);
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');

  await clickMoreAction(page, 'Sovita näkymään');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).toContainText('WASTEWATER');

  await clickViewAction(page, 'Tontti');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'site');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');

  await clickViewAction(page, 'Infra');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');

  await locusToggle.uncheck();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'false');
  await expect(waterToggle).toBeDisabled();
  await expect(wastewaterToggle).toBeDisabled();
  await expect(panel).toBeHidden();

  await locusToggle.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'all');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'true');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');
  await expect(waterToggle).toBeEnabled();
  await expect(wastewaterToggle).toBeEnabled();
});

test('private viewer restores active preset camera and semantic layer defaults only on explicit reset', async ({ page }) => {
  const model = makeLocusLayerGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  await page.getByRole('button', { name: 'Layerit' }).click();
  const locusToggle = page.locator('#locus-layer-visible');
  const waterToggle = page.locator('#locus-water-visible');
  const wastewaterToggle = page.locator('#locus-wastewater-visible');
  const edgeMode = page.locator('#edge-mode-select');

  await locusToggle.check();
  await waterToggle.uncheck();
  await edgeMode.selectOption('none');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');

  await clickViewAction(page, 'Infra');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');

  await clickViewAction(page, 'Vapaa 3D');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');

  await clickMoreAction(page, 'Palauta näkymän oletukset');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'disabled');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'reset:infra');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'all');
  await expect(canvas).toHaveAttribute('data-locus-water-visible', 'true');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'visible');
  await expect(waterToggle).toBeChecked();
  await expect(wastewaterToggle).toBeChecked();
});

test('private viewer fits inside the browser viewport without document scrolling', async ({ page }) => {
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/octet-stream',
      body: '',
    });
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 700, height: 520 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/private-model/');

    const metrics = await page.evaluate(() => {
      const viewportElement = document.querySelector<HTMLElement>('.viewport');
      const rect = viewportElement?.getBoundingClientRect();
      return {
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportTop: rect?.top ?? -1,
        viewportBottom: rect?.bottom ?? -1,
        innerHeight: window.innerHeight,
      };
    });

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.bodyClientHeight + 1);
    expect(metrics.viewportTop).toBeGreaterThanOrEqual(0);
    expect(metrics.viewportBottom).toBeLessThanOrEqual(metrics.innerHeight + 1);
  }
});



test('private viewer uses a true orthographic isometric preset without resetting layer state', async ({ page }) => {
  const model = makeTriangleGlb({ presentationLayer: 'REFERENCE_ROOF' });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const opacity = page.locator('#roof-layer-opacity');
  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(page.locator('#roof-layer-opacity-value')).toHaveText('40 %');

  await clickViewAction(page, 'Isometrinen');
  await expect(page.locator('#viewer-status')).toHaveText('Isometrinen - ortografinen 3/4-näkymä');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(opacity).toHaveValue('40');
  await expect(page.locator('#roof-layer-visible')).toBeChecked();

  const canvas = page.locator('#private-model-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
});

test('private viewer roof test layer toggles explicit roof metadata and exposes opacity control', async ({
  page,
}) => {
  const model = makeTriangleGlb({ presentationLayer: 'REFERENCE_ROOF' });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const layerPanel = page.locator('#layers-panel');
  const roofToggle = page.locator('#roof-layer-visible');
  const opacity = page.locator('#roof-layer-opacity');

  await expect(layerPanel).toBeVisible();
  await expect(page.getByText('Katto (testi)')).toBeVisible();
  await expect(page.locator('#roof-layer-count')).toHaveText('1 kohdetta');
  await expect(roofToggle).toBeChecked();
  await expect(opacity).toHaveValue('100');

  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(page.locator('#roof-layer-opacity-value')).toHaveText('40 %');

  const canvas = page.locator('#private-model-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await roofToggle.uncheck();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeHidden();

  await roofToggle.check();
  await opacity.fill('100');
  await opacity.dispatchEvent('input');
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();

  await page.getByRole('button', { name: 'Sulje' }).click();
  await expect(layerPanel).toBeHidden();
});


test('private viewer makes ARCH_BASE opaque and uses absolute roof opacity', async ({ page }) => {
  const model = makeTriangleGlb(
    { presentationLayer: 'REFERENCE_ROOF' },
    { presentationGroup: 'ARCH_BASE' },
    0.58,
  );

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-arch-base-opacity', '1');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const opacity = page.locator('#roof-layer-opacity');
  const output = page.locator('#roof-layer-opacity-value');

  await expect(output).toHaveAttribute('data-material-opacity', '1');

  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(output).toHaveText('40 %');
  await expect(output).toHaveAttribute('data-material-opacity', '0.4');

  await opacity.fill('100');
  await opacity.dispatchEvent('input');
  await expect(output).toHaveAttribute('data-material-opacity', '1');

  await clickViewAction(page, 'Isometrinen');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(output).toHaveAttribute('data-material-opacity', '1');
});

test('private viewer full-model fit includes visible line geometry and excludes hidden line layers', async ({ page }) => {
  const model = makeMeshAndLineGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const visibleFitCenter = Number(await canvas.getAttribute('data-fit-center-x'));
  const visibleFitRadius = Number(await canvas.getAttribute('data-fit-radius'));
  expect(visibleFitCenter).toBeGreaterThan(10);
  expect(visibleFitRadius).toBeGreaterThan(12);

  await clickViewAction(page, 'Isometrinen');
  const visibleIsoCenter = Number(await canvas.getAttribute('data-iso-fit-center-x'));
  expect(visibleIsoCenter).toBeGreaterThan(10);

  await page.getByRole('button', { name: 'Layerit' }).click();
  await page.locator('#roof-layer-visible').uncheck();
  await clickMoreAction(page, 'Sovita näkymään');

  const hiddenFitCenter = Number(await canvas.getAttribute('data-fit-center-x'));
  const hiddenFitRadius = Number(await canvas.getAttribute('data-fit-radius'));
  expect(Math.abs(hiddenFitCenter)).toBeLessThan(0.01);
  expect(hiddenFitRadius).toBeLessThan(2);

  await clickViewAction(page, 'Isometrinen');
  const hiddenIsoCenter = Number(await canvas.getAttribute('data-iso-fit-center-x'));
  expect(Math.abs(hiddenIsoCenter)).toBeLessThan(0.01);
});




test('private viewer turns p136B D floor views into isolated review views', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: makeDReviewGlb(),
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toBeEnabled();
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-prepared', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '11');

  await clickViewAction(page, 'D 1F');
  await expect(page.getByRole('status')).toHaveText(
    'D 1F - tarkastusnäkymä, tarkastusgeometria korostettu',
  );
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-emphasis-count', '1');
  await expect(canvas).toHaveAttribute('data-d-review-context-hidden-count', '1');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '9');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '7');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'true');

  const knownDoorLegend = page.locator('#d1-known-door-legend');
  const knownDoorLabels = page.locator('#d1-known-door-label-layer .d1-known-door-label');
  await expect(knownDoorLegend).toBeVisible();
  await expect(knownDoorLabels).toHaveCount(7);
  await expect(knownDoorLabels.first()).toHaveCSS('position', 'absolute');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '0');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(page.locator('#d1-known-door-legend-list li')).toHaveCount(7);
  await expect
    .poll(async () =>
      knownDoorLabels.evaluateAll((nodes) =>
        nodes.every((node) => {
          const element = node as HTMLElement;
          return Boolean(element.style.left && element.style.top);
        }),
      ),
    )
    .toBe(true);

  const knownDoorIds = await knownDoorLabels.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).dataset.g2Id),
  );
  expect(knownDoorIds).toEqual([
    'G2_DOOR_EXT_D_1F_S_001',
    'G2_DOOR_EXT_D_1F_N_001',
    'G2_DOOR_INT_D_1F_VH_WEST_2015_001',
    'G2_DOOR_INT_D_1F_WC_001',
    'G2_DOOR_INT_D_1F_SAUNA_PESUH_2015_001',
    'G2_DOOR_INT_D_1F_VH_NORTH_2015_001',
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
  ]);
  await expect(page.locator('#d1-known-door-legend-list code').nth(0)).toHaveText(
    'G2_DOOR_EXT_D_1F_S_001',
  );
  await expect(page.locator('#d1-known-door-legend-list code').nth(6)).toHaveText(
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
  );

  await expect(canvas).toHaveAttribute('data-d2f-boundary-context-prepared', 'true');
  await expect(canvas).toHaveAttribute(
    'data-d2f-boundary-context-source',
    'G1_G2_D2F_PLAN_HOST_ENVELOPE',
  );

  const coordinatePanel = page.locator('#coordinate-panel');
  await expect(coordinatePanel).toBeVisible();
  await expect(page.locator('#coordinate-floor')).toHaveText('D 1F');
  await expect(canvas).toHaveAttribute('data-review-coordinate-frame', 'YLIS-G1-LOCAL');
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'true');
  await expect(canvas).toHaveAttribute('data-review-grid-major-step-m', '1');
  await expect(canvas).toHaveAttribute('data-review-grid-minor-step-m', '0.5');

  const coordinateBox = await canvas.boundingBox();
  expect(coordinateBox).not.toBeNull();
  if (!coordinateBox) return;

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.5,
    coordinateBox.y + coordinateBox.height * 0.5,
  );
  await expect(canvas).toHaveAttribute('data-review-pointer-x', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-review-pointer-y', /-?\d+\.\d{3}/);
  await expect(page.locator('#coordinate-pointer')).toContainText('X ');
  await expect(page.locator('#coordinate-pointer')).toContainText('Y ');
  const centerX = Number(await canvas.getAttribute('data-review-pointer-x'));
  const centerY = Number(await canvas.getAttribute('data-review-pointer-y'));

  await canvas.click({ position: { x: coordinateBox.width * 0.5, y: coordinateBox.height * 0.5 } });
  await expect(canvas).toHaveAttribute('data-review-anchor-x', centerX.toFixed(3));
  await expect(canvas).toHaveAttribute('data-review-anchor-y', centerY.toFixed(3));
  await expect(page.locator('#coordinate-anchor')).toContainText('X ');
  await expect(page.locator('#coordinate-anchor')).toContainText('Y ');

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.75,
    coordinateBox.y + coordinateBox.height * 0.5,
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-review-pointer-x')))
    .toBeGreaterThan(centerX);

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.5,
    coordinateBox.y + coordinateBox.height * 0.25,
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-review-pointer-y')))
    .toBeGreaterThan(centerY);

  await clickViewAction(page, 'D 2F');
  await expect(page.getByRole('status')).toHaveText(
    'D 2F - tarkastusnäkymä, sisäseinät korostettu; rajaavat seinät kontekstina',
  );
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-emphasis-count', '1');
  await expect(canvas).toHaveAttribute('data-d-review-context-hidden-count', '0');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '7');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '9');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '4');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'false');
  await expect(knownDoorLegend).toBeHidden();
  await expect(page.locator('#d1-known-door-label-layer')).toBeHidden();
  await expect(page.locator('#coordinate-floor')).toHaveText('D 2F');
  await expect(coordinatePanel).toBeVisible();
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'true');

  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-interior');
  await expect(canvas).toHaveAttribute('data-content-floor', '2F');

  // Camera changes must preserve the active D content scope instead of restoring the full model.
  await clickViewAction(page, 'Isometrinen');
  await expect(coordinatePanel).toBeHidden();
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-interior');
  await expect(canvas).toHaveAttribute('data-content-floor', '2F');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '7');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '9');
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');

  await clickViewAction(page, 'Vapaa 3D');
  await expect(coordinatePanel).toBeHidden();
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'false');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'false');
  await expect(knownDoorLegend).toBeHidden();
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-interior');
  await expect(canvas).toHaveAttribute('data-content-floor', '2F');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '7');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '9');
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');
});


test('private viewer makes p137J user-current D1F doors visible as A/B review markers', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  const candidateId = 'p137j-d1f-user-current-doors';
  const candidateLabel = 'p138D architecture baseline - p137J geometry';
  const candidatePath = '/private-model/work-test/p137j-d1f-user-current-doors.glb';

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: makeDReviewGlb({ includeUserCurrentDoors: true }),
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '13');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '2');

  await clickViewAction(page, 'D 1F');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '9');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '2');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'true');

  const userDoorSection = page.locator('#d1-user-door-legend-section');
  const userDoorLabels = page.locator('#d1-known-door-label-layer .d1-user-door-label');
  await expect(userDoorSection).toBeVisible();
  await expect(userDoorLabels).toHaveCount(2);
  await expect(userDoorLabels.nth(0)).toHaveText('A');
  await expect(userDoorLabels.nth(1)).toHaveText('B');
  await expect(userDoorLabels.nth(0)).toHaveCSS('position', 'absolute');
  expect(
    await userDoorLabels.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.reviewDoorId),
    ),
  ).toEqual(['D1F_USER_CURRENT_DOOR_A', 'D1F_USER_CURRENT_DOOR_B']);
  await expect(page.locator('#d1-user-door-legend-list code').nth(0)).toHaveText(
    'D1F_USER_CURRENT_DOOR_A',
  );
  await expect(page.locator('#d1-user-door-legend-list code').nth(1)).toHaveText(
    'D1F_USER_CURRENT_DOOR_B',
  );

  await clickViewAction(page, 'D 2F');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '4');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(userDoorSection).toBeHidden();

  await clickViewAction(page, 'Vapaa 3D');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(userDoorSection).toBeHidden();
});


test('private viewer loads an allowlisted WORK_TEST candidate from the protected catalog and returns to CURRENT', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';
  let currentLoads = 0;
  let candidateLoads = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    currentLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    candidateLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-work-test-catalog', 'ready');
  await expect(page.locator('#work-test-file-input')).toHaveCount(0);
  await expect(page.locator('#work-test-select')).toBeEnabled();
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await expect(page.locator('#work-test-select')).toContainText(candidateLabel);
  await expect(page.locator('#work-test-button')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeHidden();

  await clickModelAction(page, 'Avaa WORK_TEST');

  await expect(page.getByRole('status')).toHaveText('WORK_TEST-malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'work-test');
  await openToolbarMenu(page, '#model-menu');
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeVisible();
  expect(currentLoads).toBe(1);
  expect(candidateLoads).toBe(1);

  await clickModelAction(page, 'Palaa CURRENTiin');

  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeHidden();
  expect(currentLoads).toBe(2);
  expect(candidateLoads).toBe(1);
});

test('private viewer opens p139N in the guarded SITE_PLAN_OVERLAY scene with routes default-off', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P139N PHYSICAL CONTEXT - UNRESOLVED Z ROUTES EXCLUDED - BABYLON Y-UP',
        nodes: [0],
      },
      {
        name: 'P139N SITE_PLAN_OVERLAY - Z UNKNOWN - PLAN ONLY - NOT AS-BUILT',
        nodes: [1],
      },
    ],
    nodes: [
      { name: 'PHYSICAL_ROOT' },
      { name: 'PLAN_ROOT', children: [2, 3, 4] },
      {
        name: 'P139H_LAYER_LOCUS_PARCEL_ROUTES',
        extras: { presentationLayer: 'LOCUS_PARCEL_ROUTES' },
        children: [5, 6],
      },
      {
        name: 'P139H_LAYER_KVV_1974_SITE_ROUTES',
        extras: { presentationLayer: 'KVV_1974_SITE_ROUTES' },
        children: [7, 8],
      },
      {
        name: 'P139H_LAYER_KVV_2017_A1F_WATER',
        extras: { presentationLayer: 'KVV_2017_A1F_WATER' },
        children: [9],
      },
      { name: 'LOCUS_WATER', extras: { presentationSubgroup: 'WATER' } },
      { name: 'LOCUS_WASTEWATER', extras: { presentationSubgroup: 'WASTEWATER' } },
      { name: 'KVV1974_WATER', extras: { presentationSubgroup: 'WATER' } },
      { name: 'KVV1974_WASTEWATER', extras: { presentationSubgroup: 'WASTEWATER' } },
      { name: 'KVV2017_WATER', extras: { presentationSubgroup: 'WATER' } },
    ],
  });
  const candidateId = 'p139n-federated-kvv-review';
  const candidateLabel = 'p139N federated KVV review - PLAN ONLY';
  const candidatePath = '/private-model/work-test/p139n-federated-kvv-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'site-plan-only');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'SITE ORTHO / PLAN ONLY - Z UNKNOWN / NOT AS-BUILT',
  );
  await expect(canvas).toHaveAttribute('data-locus-layer-count', '5');
  await expect(canvas).toHaveAttribute('data-locus-water-count', '3');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-count', '2');
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Kunnallistekniikka / KVV-reitit (WORK_TEST)')).toBeVisible();
  const routes = page.locator('#locus-layer-visible');
  await expect(routes).toBeEnabled();
  await routes.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
});

test('private viewer opens p139AB as a Z-only orthographic wastewater review', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP139abReviewGlb();
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'z-credibility-only');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'Z-KATSELU - vain lähteistetyt jätevesikorkeudet - datum sitomatta / ei as-built',
  );

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Z-review: vain Z-lähteistetty jätevesi')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer autoloads the exact p143A SCALGO terrain review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P143A SCALGO CURRENT TERRAIN + P142A ARCHITECTURE - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p143a-scalgo-terrain';
  const candidateLabel = 'p143A SCALGO terrain + architecture - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143a-scalgo-terrain.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143a-scalgo-terrain-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-terrain-review');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO MAASTO + RAKENNUS - WORK_TEST - pystykorkosilta oletus / ei as-built',
  );
});

test('private viewer autoloads the exact p143F SCALGO contour review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143F SCALGO TERRAIN + 1M/0.1M CONTOURS + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143f-scalgo-contours';
  const candidateLabel = 'p143F SCALGO terrain + contours - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143f-scalgo-contours.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143a-scalgo-terrain',
            label: 'p143A SCALGO terrain + architecture - WORK_TEST',
            path: '/private-model/work-test/p143a-scalgo-terrain.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143f-scalgo-contours-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-contour-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO MAASTO + KORKEUSKÄYRÄT - 1 m pää / 0,10 m väli - välikäyrät interpoloitu 1 m rasterista',
  );
});

test('private viewer autoloads the exact p143G SCALGO cartography review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143G SCALGO SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143g-scalgo-cartography';
  const candidateLabel = 'p143G SCALGO smoothed cartography - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143g-scalgo-cartography.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143f-scalgo-contours',
            label: 'p143F SCALGO terrain + contours - WORK_TEST',
            path: '/private-model/work-test/p143f-scalgo-contours.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143g-scalgo-cartography-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-cartography-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-label-placement', 'high-side');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-flow-barbs', 'downhill');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - 1 m pää / 0,5 m puolikäyrä / 0,10 m väli - silotettu esitys 1 m rasterista',
  );
});

test('private viewer autoloads the exact p143H SCALGO technical label-axis review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143H SCALGO TECH LABELS + PAIRED GRADIENT BARBS + SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143h-scalgo-label-axis';
  const candidateLabel = 'p143H SCALGO technical labels + paired barbs - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143h-scalgo-label-axis.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143g-scalgo-cartography',
            label: 'p143G SCALGO smoothed cartography - WORK_TEST',
            path: '/private-model/work-test/p143g-scalgo-cartography.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143h-scalgo-label-axis-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-axis-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '14');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - pienemmät technical korkoluvut - numero ja valumaväkänen samalla gradienttiakselilla',
  );
});

test('private viewer autoloads the exact p143J SCALGO building-bypass label-flow review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143J SCALGO LABEL FLOW CORRIDORS + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143j-scalgo-label-flow';
  const candidateLabel = 'p143J SCALGO building-bypass label flow - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143j-scalgo-label-flow.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143h-scalgo-label-axis',
            label: 'p143H SCALGO technical labels + paired barbs - WORK_TEST',
            path: '/private-model/work-test/p143h-scalgo-label-axis.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143j-scalgo-label-flow-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-flow-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-label-placement', 'building-bypass-flow-corridors');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-flow-barbs', 'downhill-paired');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '11');
  await expect(canvas).toHaveAttribute('data-scalgo-label-flow-corridor-count', '2');
  await expect(canvas).toHaveAttribute('data-scalgo-label-minimum-same-corridor-spacing-m', '3.0');
  await expect(canvas).toHaveAttribute('data-scalgo-label-building-exclusion', 'true');
  await expect(canvas).toHaveAttribute('data-scalgo-label-corridor-semantic-boundary', 'annotation-placement-only');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - korkoluvut kahdella talon ohi kulkevalla sijoituskäytävällä - paired valumaväkäset',
  );
});

test('private viewer autoloads P144C G3 1974 IV anchors on the exact p143H cartography successor', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P144C G3 1974 IV P04 OVERLAY + P143H SCALGO TECH LABELS - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p144c-g3-1974-iv-on-p143h';
  const candidateLabel = 'P144C G3 1974 IV anchors + p143H cartography - WORK_TEST';
  const candidatePath = '/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143h-scalgo-label-axis',
            label: 'p143H SCALGO technical labels + paired barbs - WORK_TEST',
            path: '/private-model/work-test/p143h-scalgo-label-axis.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p144c-g3-1974-iv-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p144c-g3-1974-iv-overlay-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '14');
  await expect(canvas).toHaveAttribute('data-g3-source-phase', '1974');
  await expect(canvas).toHaveAttribute('data-g3-overlay-primitive', 'POINTS');
  await expect(canvas).toHaveAttribute('data-g3-overlay-anchor-count', '32');
  await expect(canvas).toHaveAttribute('data-g3-section-anchor-count-excluded', '6');
  await expect(canvas).toHaveAttribute('data-g3-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-display-z-rule', 'federationHostZ+0.100m');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'G3 1974 IV - 32 plan-ankkuria p143H-kartografian päällä - display-Z on katseluoffset, ei fyysinen IV-korko',
  );
});

test('private viewer autoloads the exact P145B 1974 IV section work-target review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P145B 1974 IV SECTION WORK TARGETS ON P144C - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p145b-1974-iv-section-worktargets';
  const candidateLabel = 'P145B 1974 IV section work-targets - WORK_TEST';
  const candidatePath = '/private-model/work-test/p145b-1974-iv-section-worktargets.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p144c-g3-1974-iv-on-p143h',
            label: 'P144C G3 1974 IV anchors + p143H cartography - WORK_TEST',
            path: '/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p145b-1974-iv-section-worktargets-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p145b-1974-iv-section-worktargets-review',
  );
  await expect(canvas).toHaveAttribute('data-g3-source-phase', '1974');
  await expect(canvas).toHaveAttribute('data-g3-overlay-primitive', 'SECTION_WORK_TARGETS');
  await expect(canvas).toHaveAttribute('data-g3-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-g3-work-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-g3-section-work-target-count', '12');
  await expect(canvas).toHaveAttribute(
    'data-g3-section-station-status',
    'WORK_ASSUMPTION_UNRESOLVED',
  );
  await expect(canvas).toHaveAttribute(
    'data-g3-section-plane-orientation-status',
    'WORK_ASSUMPTION_UNRESOLVED',
  );
  await expect(canvas).toHaveAttribute('data-g3-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'G3 1974 IV - 12 section work-targetia - WORK_TEST / presentation-only / workAssumption - station/orientation unresolved - ei fyysinen Z/penetration',
  );
});

test('private viewer autoloads the exact P155C-B D storage-roof review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P155C-B D STORAGE ROOF PRESENTATION - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p155cb-d-storage-roof';
  const candidateLabel = 'P155C-B D storage roof presentation - WORK_TEST';
  const candidatePath = '/private-model/work-test/p155cb-d-storage-roof.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p155cb-d-storage-roof-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p155cb-d-storage-roof-review');
  await expect(canvas).toHaveAttribute('data-p155-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p155-current-relative-level', 'MATCH_1F_ROOF_ZONE');
  await expect(canvas).toHaveAttribute('data-p155-absolute-top-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p155-physical-roof-thickness-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P155C-B D-varaston kattoreferenssi - WORK_TEST / presentation-only - ei fyysinen kattorakenne',
  );
});

test('private viewer autoloads the exact P151C whole-building review carrier', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P151C WHOLE BUILDING MINIMUM REVIEW CARRIER - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p151c-whole-building-carrier';
  const candidateLabel = 'P151C whole-building minimum review carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p151c-whole-building-carrier.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p151c-whole-building-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p151c-whole-building-review');
  await expect(canvas).toHaveAttribute('data-p151-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p151-carrier-role', 'WHOLE_BUILDING_MINIMUM_REVIEW_CARRIER');
  await expect(canvas).toHaveAttribute(
    'data-p151-excluded-branches',
    'P158B,P153,P154C,NEW_G3_COMMON,P150_FOUNDATION',
  );
  await expect(canvas).toHaveAttribute('data-p151-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText(
    'P151C koko rakennus - WORK_TEST minimum review carrier - 14/14 locked scope - ei CURRENT/as-built',
  );
});



test('private viewer autoloads the exact P150F-R whole-building substructure review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P150F WHOLE-BUILDING MINIMUM REVIEW CARRIER + SUBSTRUCTURE WORK ENVELOPES - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150fr-whole-building-substructure';
  const candidateLabel = 'P150F-R whole-building + substructure successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150fr-whole-building-substructure.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p150fr-whole-building-substructure-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150fr-whole-building-substructure-review',
  );
  await expect(canvas).toHaveAttribute('data-p150fr-predecessor-candidate', 'p151c-whole-building-carrier');
  await expect(canvas).toHaveAttribute('data-p150fr-inherited-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p150fr-substructure-target-count', '2');
  await expect(canvas).toHaveAttribute('data-p150fr-substructure-delta-pass', 'P150D');
  await expect(canvas).toHaveAttribute(
    'data-p150fr-substructure-target-ids',
    'G2_SUBSTRUCTURE_CD_STORAGE_WORK_001,G2_SUBSTRUCTURE_AB_WORK_001',
  );
  await expect(canvas).toHaveAttribute(
    'data-p150fr-scope',
    'P133H owner + P147D/P148D roof/guard delta + P150A cut-terrain + P150D substructure WORK_TEST envelopes',
  );
  await expect(canvas).toHaveAttribute('data-p150fr-excluded-branches', 'P158B,P153,P154C,NEW_G3_COMMON');
  await expect(canvas).toHaveAttribute('data-p150fr-work-depth-m', '0.600');
  await expect(canvas).toHaveAttribute('data-p150fr-depth-status', 'REFINABLE_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p150fr-physical-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-physical-foundation-depth-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p150fr-metadata-repair-of-pass', 'P150F');
  await expect(canvas).toHaveAttribute('data-p150fr-presentation-truthfulness', 'PASS');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText(
    'P150F-R koko rakennus + alusrakennekuoret - WORK_TEST / 14/14 base + P150D targetit 2/2 - syvyys 0,600 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P150G whole-building end-plinth review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P150G WHOLE-BUILDING + END-PLINTH HUMAN-REVIEW CORRECTION - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150g-whole-building-end-plinth';
  const candidateLabel = 'P150G whole-building end-plinth correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150g-whole-building-end-plinth.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p150g-whole-building-end-plinth-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150g-whole-building-end-plinth-review',
  );
  await expect(canvas).toHaveAttribute('data-p150g-predecessor-candidate', 'p150fr-whole-building-substructure');
  await expect(canvas).toHaveAttribute('data-p150g-inherited-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p150g-p150d-target-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p150g-p150d-target-ids',
    'G2_SUBSTRUCTURE_CD_STORAGE_WORK_001,G2_SUBSTRUCTURE_AB_WORK_001',
  );
  await expect(canvas).toHaveAttribute('data-p150g-correction-target-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p150g-correction-target-ids',
    'G2_SUBSTRUCTURE_WEST_GABLE_WING_WORK_001,G2_SUBSTRUCTURE_EAST_GABLE_WING_WORK_001',
  );
  await expect(canvas).toHaveAttribute('data-p150g-correction-zone-count', '4');
  await expect(canvas).toHaveAttribute(
    'data-p150g-correction-basis',
    'USER_HUMAN_REVIEW_RELATION_PLUS_EXISTING_GABLE_GEOMETRY',
  );
  await expect(canvas).toHaveAttribute(
    'data-p150g-scope',
    'P133H owner + P147D/P148D roof/guard delta + P150G cut-terrain refinement + P150D substructure WORK_TEST envelopes + P150G end-plinth correction',
  );
  await expect(canvas).toHaveAttribute('data-p150g-excluded-branches', 'P158B,P153,P154C,NEW_G3_COMMON');
  await expect(canvas).toHaveAttribute('data-p150g-work-depth-m', '0.600');
  await expect(canvas).toHaveAttribute('data-p150g-depth-status', 'REFINABLE_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p150g-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p150g-physical-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-physical-foundation-depth-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-physical-ground-surface-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute(
    'data-p150g-predecessor-human-review-feedback',
    'P150F-R_FEEDBACK_CAPTURED_CORRECTION_REQUIRED',
  );
  await expect(canvas).toHaveAttribute('data-p150g-active-ground-contact-root-node-index', '919');
  await expect(canvas).toHaveAttribute('data-p150g-correction-root-node-index', '922');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'Koko rakennus + korjattu päätysokkeli (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P150G koko rakennus + korjattu päätysokkeli - WORK_TEST / P150D targetit 2/2 + P150G korjaustargetit 2/2 / zone4/4 - syvyys 0,600 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P161 multisource systems review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const p161IvPlanNodes = Array.from({ length: 32 }, (_, index) => ({
    name: `G3_IV_1974_PLAN_ANCHOR_${String(index + 1).padStart(3, '0')}__DISPLAY`,
    extras: {
      systemDomain: 'IV',
      phase: '1974',
      sourceGeometryDimension: '2D_XY_PLAN',
      presentationOnly: true,
    },
  }));
  const p161StandalonePositions = Buffer.alloc(36);
  [-0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0].forEach((value, index) => {
    p161StandalonePositions.writeFloatLE(value, index * 4);
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P161 MULTISOURCE SYSTEMS REVIEW CARRIER - BABYLON Y-UP',
        nodes: [0, 33, 35, 44],
      },
    ],
    nodes: [
      {
        name: 'P144C_G3_1974_IV_P04_PRESENTATION_OVERLAY_ROOT_BABYLON_Y_UP',
        children: Array.from({ length: 32 }, (_, index) => index + 1),
        extras: {
          Pass: 'P144C',
          Purpose: 'presentationOnlyFederatedOverlay',
          sourceObjectCount: 32,
          sourcePrimitiveCount: 32,
        },
      },
      ...p161IvPlanNodes,
      {
        name: 'P156I_2017_KVV_MAIN_WORK_ASSUMPTION_PRESENTATION_ROOT_BABYLON_Y_UP',
        children: [34],
        extras: {
          Pass: 'P156I',
          Purpose: 'mainCandidate2017PresentationSuccessor',
          sourcePrimitiveCount: 82,
        },
      },
      {
        name: 'G3_KVV_2017_1F_WATER_MAIN_WORK_CANDIDATE_001__P156I_DISPLAY',
        extras: {
          Pass: 'P156I',
          sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION',
          systemDomain: 'KVV/käyttövesi',
          sourcePrimitiveCount: 82,
          presentationOnly: true,
        },
      },
      {
        name: 'P144E G3 1974 IV SECTION SIDECAR - BABYLON Y-UP',
        children: [36, 40],
        extras: {
          Purpose: 'presentationOnlySectionSidecarRoot',
          sectionStationStatus: 'UNRESOLVED_SOURCE',
          physicalZClaim: false,
        },
      },
      {
        name: 'P144E_SECTION_AA_PRESENTATION_SIDECAR',
        children: [37, 38, 39],
        extras: { placementMode: 'PRESENTATION_SIDECAR' },
      },
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `P144E_SECTION_AA_ANCHOR_${index + 1}`,
        extras: {
          G3Id: `P144E_AA_${index + 1}`,
          placementMode: 'PRESENTATION_SIDECAR',
        },
      })),
      {
        name: 'P144E_SECTION_BB_PRESENTATION_SIDECAR',
        children: [41, 42, 43],
        extras: { placementMode: 'PRESENTATION_SIDECAR' },
      },
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `P144E_SECTION_BB_ANCHOR_${index + 1}`,
        extras: {
          G3Id: `P144E_BB_${index + 1}`,
          placementMode: 'PRESENTATION_SIDECAR',
        },
      })),
      {
        name: 'P161_KVV_STANDALONE_DISPLAY',
        mesh: 0,
        extras: {
          sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION',
          systemDomain: 'KVV/käyttövesi',
          presentationOnly: true,
        },
      },
    ],
    buffers: [
      {
        byteLength: p161StandalonePositions.length,
        uri: `data:application/octet-stream;base64,${p161StandalonePositions.toString('base64')}`,
      },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: p161StandalonePositions.length }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-0.5, -0.5, 0],
        max: [0.5, 0.5, 0],
      },
    ],
    meshes: [
      {
        name: 'P161_STANDALONE_DISPLAY_TRIANGLE',
        primitives: [{ attributes: { POSITION: 0 } }],
      },
    ],
  });
  const candidateId = 'p161-multisource-systems-carrier';
  const candidateLabel = 'P161 multisource systems review carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p161-multisource-systems-carrier.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p161-multisource-systems-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p161-multisource-systems-review');
  await expect(canvas).toHaveAttribute('data-p161-owner-candidate', 'p156i-2017-kvv-main-presentation');
  await expect(canvas).toHaveAttribute('data-p161-kvv2017-primitive-count', '82');
  await expect(canvas).toHaveAttribute('data-p161-iv1974-plan-anchor-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-iv1974-plan-unique-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-section-sidecar-anchor-count', '6');
  await expect(canvas).toHaveAttribute('data-p161-source-families-separate', 'true');
  await expect(canvas).toHaveAttribute('data-p161-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-same-pipe-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p161-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p161-section-station-status', 'UNRESOLVED_SOURCE');
  await expect(canvas).toHaveAttribute('data-p161-section-vertical-datum-status', 'LOCAL_SECTION_ONLY');
  await expect(canvas).toHaveAttribute('data-p161-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P161 multisource systems - WORK_TEST / P156I 2017 KVV + 1974 IV plan 32 + section sidecar 6 / lähdeperheet erillään - ei CURRENT/as-built',
  );

  const systemsLayer = page.locator('#locus-layer-visible');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P161 tekniset järjestelmät (WORK_TEST)',
  );
  await expect(systemsLayer).toBeEnabled();
  await expect(systemsLayer).toBeChecked();
  await expect(page.locator('#locus-layer-count')).toHaveText('120 lähdekohdetta');
  await expect(page.locator('#locus-water-count')).toHaveText('KVV 2017: 82');
  await expect(page.locator('#locus-wastewater-count')).toHaveText(
    'IV 1974: 38 (32 suunnitelma + 6 leikkaus)',
  );
  await expect(canvas).toHaveAttribute('data-p161-kvv-layer-count', '82');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-layer-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-section-sidecar-layer-count', '6');
  await expect(canvas).toHaveAttribute('data-p161-system-layer-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p161-visible-system-layer-renderable-count', '1');

  await page.locator('#layers-button').click();
  await expect(page.locator('#layers-panel')).toBeVisible();
  await expect(page.locator('#p161-system-layer-children')).toBeVisible();
  await expect(page.locator('#locus-layer-children')).toBeHidden();
  await expect(canvas).toHaveAttribute('data-locus-layer-hierarchy', 'p161SystemFamily');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'all');

  const kvvLayer = page.locator('#p161-kvv-visible');
  const ivPlanLayer = page.locator('#p161-iv-plan-visible');
  const ivSectionLayer = page.locator('#p161-iv-section-visible');
  await expect(kvvLayer).toBeEnabled();
  await expect(ivPlanLayer).toBeEnabled();
  await expect(ivSectionLayer).toBeEnabled();
  await expect(kvvLayer).toBeChecked();
  await expect(ivPlanLayer).toBeChecked();
  await expect(ivSectionLayer).toBeChecked();
  await expect(page.locator('#p161-kvv-count')).toHaveText('KVV 2017: 82');
  await expect(page.locator('#p161-iv-plan-count')).toHaveText('IV 1974 suunnitelma: 32');
  await expect(page.locator('#p161-iv-section-count')).toHaveText('IV 1974 leikkaus: 6');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
  await expect(page.locator('#selection-mesh')).toContainText('P161_KVV_STANDALONE_DISPLAY');

  await kvvLayer.uncheck();
  await expect(systemsLayer).toBeChecked();
  await expect(systemsLayer).toHaveJSProperty('indeterminate', true);
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-p161-kvv-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-visible-system-layer-renderable-count', '0');
  await expect(page.locator('#selection-panel')).toBeHidden();

  await ivPlanLayer.uncheck();
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'true');

  await kvvLayer.check();
  await expect(canvas).toHaveAttribute('data-p161-kvv-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-visible-system-layer-renderable-count', '1');

  const modelBadge = page.locator('#model-source-badge');
  const badgeText = `WORK_TEST: ${candidateLabel}`;
  await expect(modelBadge).toHaveText(badgeText);
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await clickViewAction(page, 'Tontti');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'site');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(modelBadge).toHaveText(badgeText);
  await expect(canvas).toHaveAttribute('data-p161-kvv-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'true');
  await clickViewAction(page, 'Infra');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(modelBadge).toHaveText(badgeText);
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');

  await ivSectionLayer.uncheck();
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'mixed');
  await expect(systemsLayer).toBeChecked();
  await expect(systemsLayer).toHaveJSProperty('indeterminate', true);

  await systemsLayer.uncheck();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'off');
  await expect(canvas).toHaveAttribute('data-p161-kvv-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'false');
  await expect(canvas).toHaveAttribute('data-p161-visible-system-layer-renderable-count', '0');
  await expect(kvvLayer).toBeDisabled();
  await expect(ivPlanLayer).toBeDisabled();
  await expect(ivSectionLayer).toBeDisabled();

  await systemsLayer.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
  await expect(canvas).toHaveAttribute('data-locus-layer-parent-state', 'all');
  await expect(canvas).toHaveAttribute('data-p161-kvv-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-iv-section-visible', 'true');
  await expect(canvas).toHaveAttribute('data-p161-visible-system-layer-renderable-count', '1');
  await expect(kvvLayer).toBeEnabled();
  await expect(ivPlanLayer).toBeEnabled();
  await expect(ivSectionLayer).toBeEnabled();
});

test('private viewer autoloads exact P170A review visibility successor with P161 hierarchy', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const ivPlanNodes = Array.from({ length: 32 }, (_, index) => ({
    name: `P170A_IV_PLAN_SOURCE_${index + 1}`,
    extras: {
      systemDomain: 'IV',
      phase: '1974',
      sourceGeometryDimension: '2D_XY_PLAN',
      presentationOnly: true,
    },
  }));
  const sectionNodes = Array.from({ length: 6 }, (_, index) => ({
    name: `P170A_IV_SECTION_SOURCE_${index + 1}`,
    extras: {
      placementMode: 'PRESENTATION_SIDECAR',
      G3Id: `P170A_SECTION_${index + 1}`,
      presentationOnly: true,
    },
  }));
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P170A P161 SYSTEMS REVIEW VISIBILITY AIDS + EXACT P161 SOURCE GEOMETRY - BABYLON Y-UP', nodes: Array.from({ length: 43 }, (_, index) => index) }],
    nodes: [
      {
        name: 'P170A_KVV_2017_REVIEW_VISIBILITY_AID_BABYLON_Y_UP',
        extras: { Pass: 'P170A', presentationVisibilityAid: true, familyRef: 'KVV_2017', presentationOnly: true },
      },
      {
        name: 'P156I_SOURCE_COUNT',
        extras: { Pass: 'P156I', sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION', sourcePrimitiveCount: 82, presentationOnly: true },
      },
      {
        name: 'P170A_IV_1974_PLAN_REVIEW_VISIBILITY_AID_BABYLON_Y_UP',
        extras: { Pass: 'P170A', presentationVisibilityAid: true, familyRef: 'IV_1974_PLAN', presentationOnly: true },
      },
      ...ivPlanNodes,
      {
        name: 'P170A_IV_1974_SECTION_REVIEW_VISIBILITY_AIDS_BABYLON_Y_UP',
        extras: { Pass: 'P170A', presentationVisibilityAid: true, familyRef: 'IV_1974_SECTION', presentationOnly: true },
      },
      ...sectionNodes,
      {
        name: 'P170A_SOURCE_COUNT_SENTINEL',
        extras: { sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION', sourcePrimitiveCount: 82, presentationOnly: true },
      },
    ],
  });
  const candidateId = 'p170a-p161-review-visibility';
  const candidateLabel = 'P170A P161 review visibility presentation successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p170a-p161-review-visibility.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p170a-p161-review-visibility-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p170a-p161-review-visibility-review');
  await expect(canvas).toHaveAttribute('data-p170-geometry-pass', 'P170A');
  await expect(canvas).toHaveAttribute('data-p170-review-visibility-aid', 'true');
  await expect(canvas).toHaveAttribute('data-p170-visibility-scale-exaggerated', 'true');
  await expect(canvas).toHaveAttribute('data-p170-physical-geometry-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p170-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p170-human-review', 'NOT_RUN');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P170A tekniset järjestelmät (WORK_TEST / review visibility aids)',
  );
  await expect(page.locator('#locus-layer-count')).toHaveText('120 lähdekohdetta');
  await page.locator('#layers-button').click();
  await expect(page.locator('#p161-system-layer-children')).toBeVisible();
  await expect(page.locator('#viewer-status')).toHaveText(
    'P170A P161 review visibility - WORK_TEST / KVV 82 + IV plan 32 + IV section 6 / presentation-only visibility aids - HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads exact P170D-R2 corrected spatial visibility successor', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const ivPlanNodes = Array.from({ length: 32 }, (_, index) => ({
    name: `P144C_IV_PLAN_SOURCE_${index + 1}`,
    extras: {
      systemDomain: 'IV',
      phase: '1974',
      sourceGeometryDimension: '2D_XY_PLAN',
      presentationOnly: true,
    },
  }));
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P170D-R2 P161 SPATIAL REVIEW VISIBILITY CORRECTED - BABYLON Y-UP',
        nodes: Array.from({ length: 35 }, (_, index) => index),
      },
    ],
    nodes: [
      {
        name: 'P170D_R2_KVV_2017_CORRECTED_VISIBILITY_AID_BABYLON_Y_UP',
        extras: {
          Pass: 'P170D-R2',
          presentationVisibilityAid: true,
          familyRef: 'KVV_2017',
          presentationOnly: true,
          physicalGeometryClaim: false,
          physicalZClaim: false,
        },
      },
      {
        name: 'P156I_SOURCE_COUNT',
        extras: {
          Pass: 'P156I',
          sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION',
          sourcePrimitiveCount: 82,
          presentationOnly: true,
        },
      },
      {
        name: 'P170D_R2_IV_1974_PLAN_CORRECTED_VISIBILITY_AID_BABYLON_Y_UP',
        extras: {
          Pass: 'P170D-R2',
          presentationVisibilityAid: true,
          familyRef: 'IV_1974_PLAN',
          presentationOnly: true,
          physicalGeometryClaim: false,
          physicalZClaim: false,
        },
      },
      ...ivPlanNodes,
      {
        name: 'P170A_IV_1974_SECTION_REVIEW_VISIBILITY_AIDS_BABYLON_Y_UP',
        extras: {
          Pass: 'P170A',
          presentationVisibilityAid: true,
          familyRef: 'IV_1974_SECTION',
          placementMode: 'PRESENTATION_SIDECAR',
          G3Id: 'DETACHED_SECTION_SENTINEL',
          presentationOnly: true,
        },
      },
    ],
  });
  const candidateId = 'p170d-p161-review-visibility-correction';
  const candidateLabel = 'P170D-R2 P161 review visibility placement correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p170d-p161-review-visibility-correction.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p170d-p161-review-visibility-correction-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p170d-p161-review-visibility-correction-review',
  );
  await expect(canvas).toHaveAttribute('data-p170-parent-pass', 'P170A');
  await expect(canvas).toHaveAttribute('data-p170-geometry-pass', 'P170D-R2');
  await expect(canvas).toHaveAttribute(
    'data-p170-review-visibility-aid-families',
    'KVV_2017,IV_1974_PLAN',
  );
  await expect(canvas).toHaveAttribute('data-p170-correction-scope', 'SPATIAL_REVIEW_VISIBILITY_PLACEMENT');
  await expect(canvas).toHaveAttribute('data-p170-kvv-review-z-by-host', 'A-B:-0.940,C-D:+0.060');
  await expect(canvas).toHaveAttribute('data-p170-iv-plan-source-display-anchor-z-reused', 'true');
  await expect(canvas).toHaveAttribute('data-p170-iv-section-in-default-review', 'false');
  await expect(canvas).toHaveAttribute('data-p170-excluded-detached-roots', '903,905,914,921,922');
  await expect(canvas).toHaveAttribute(
    'data-p170-plausibility-gate',
    'PASS_WITH_EXPLICIT_WORK_TEST_VERTICAL_ASSUMPTION',
  );
  await expect(canvas).toHaveAttribute('data-p170-physical-geometry-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p170-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p170-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p161-section-sidecar-layer-count', '0');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P170D-R2 tekniset järjestelmät (WORK_TEST / corrected spatial visibility)',
  );
  await expect(page.locator('#locus-layer-count')).toHaveText('114 lähdekohdetta');
  await page.locator('#layers-button').click();
  await expect(page.locator('#p161-system-layer-children')).toBeVisible();
  await expect(page.locator('#p161-iv-section-visible')).toBeDisabled();
  await expect(page.locator('#viewer-status')).toHaveText(
    'P170D-R2 P161 visibility correction - WORK_TEST / KVV 82 host-level review Z + IV plan 32 source-display anchors / detached section + stacked review excluded - HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads exact P171C D stair opening + guard/lowWall junction successor', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P171C D STAIR GUARD + LOWWALL JUNCTION - WORK_TEST',
        nodes: [1, 2, 4, 5, 6, 7],
        extras: {
          Pass: 'P171C',
          successorOfPass: 'P171B-R2',
          representationKind: 'guardLowWallJunctionWorkTestSuccessor',
          presentationOnly: true,
          workAssumption: true,
          junctionBindingNodeIndex: 6,
          junctionBindingRootNodeIndex: 7,
          physicalGuardClaim: false,
          physicalLowWallClaim: false,
          physicalJunctionClaim: false,
          Canonical: false,
          currentClaim: false,
          asBuiltClaim: false,
          publishToCURRENT: false,
          humanReview: 'NOT_RUN',
        },
      },
      {
        name: 'D CURRENT INTERIOR - BABYLON Y-UP',
        nodes: [0],
      },
    ],
    nodes: [
      {
        name: 'D_CURRENT_INTERIOR_REVIEW_PLACEHOLDER',
      },
      {
        name: 'P167F_FLOOR_INTERFLOOR_WORKSHELL_WITH_PRECISE_STAIR_CLEARANCE_ROOT_BABYLON_Y_UP',
      },
      {
        name: 'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST',
        children: [3],
      },
      {
        name: 'P167D_D_PRECISE_STAIR_SOURCE_PLAN_ROOT_BABYLON_Y_UP',
      },
      {
        name: 'P171B_R2_D_STAIR_OPENING_WORKTEST_ENVELOPE',
        extras: {
          Pass: 'P171B-R2',
          representationKind: 'stairOpeningWorkEnvelope',
          metadataOnly: true,
          visibleGeometryCreated: false,
          physicalOpeningClaim: false,
          physicalFloorShellCutApplied: false,
        },
      },
      {
        name: 'P167F_PRECISE_STAIR_PRESERVED',
        extras: { Pass: 'P167F', presentationOnly: true },
      },
      {
        name: 'P171C_D_STAIR_GUARD_LOWWALL_JUNCTION_WORKTEST_BINDING',
        extras: {
          Pass: 'P171C',
          representationKind: 'guardLowWallJunctionWorkTestBinding',
          metadataOnly: true,
          visibleGeometryCreated: false,
          lowWallReviewIds: ['R209', 'R210'],
          hostZ: 2.76,
          heightApproxM: 1.0,
          heightStatus: 'APPROXIMATE_USER_ESTIMATE_PROPAGATED_AS_WORK_TEST',
          exactJunctionStatus: 'DEFERRED',
          pillarGeometryStatus: 'DEFERRED',
          physicalGuardClaim: false,
          physicalLowWallClaim: false,
          physicalJunctionClaim: false,
        },
      },
      {
        name: 'P171C_D_STAIR_GUARD_LOWWALL_JUNCTION_BINDING_ROOT_BABYLON_Y_UP',
        extras: {
          Pass: 'P171C',
          representationKind: 'guardLowWallJunctionWorkTestBindingRoot',
          sourcePrimitiveMutation: false,
        },
      },
    ],
  });
  const candidateId = 'p171c-d-stair-opening-guard-lowwall-junction';
  const candidateLabel = 'P171C D stair opening + guard/lowWall junction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p171c-d-stair-opening-guard-lowwall-junction.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p171c-d-stair-opening-guard-lowwall-junction-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p171c-d-stair-opening-guard-lowwall-junction-review',
  );
  await expect(canvas).toHaveAttribute('data-p171-parent-pass', 'P171B-R2');
  await expect(canvas).toHaveAttribute('data-p171-geometry-pass', 'P171C');
  await expect(canvas).toHaveAttribute('data-p171-qa-pass', 'P171D');
  await expect(canvas).toHaveAttribute('data-p171-opening-envelope-x-min-m', '0.230');
  await expect(canvas).toHaveAttribute('data-p171-opening-envelope-x-max-m', '2.480');
  await expect(canvas).toHaveAttribute('data-p171-opening-envelope-y-min-m', '5.122');
  await expect(canvas).toHaveAttribute('data-p171-opening-envelope-y-max-m', '7.222');
  await expect(canvas).toHaveAttribute('data-p171-opening-host-z-min-m', '0.000');
  await expect(canvas).toHaveAttribute('data-p171-opening-host-z-max-m', '2.760');
  await expect(canvas).toHaveAttribute('data-p171-presentation-work-shell-cut-applied', 'true');
  await expect(canvas).toHaveAttribute('data-p171-guard-low-wall-review-ids', 'R209,R210');
  await expect(canvas).toHaveAttribute('data-p171-guard-low-wall-host-z', '2.760');
  await expect(canvas).toHaveAttribute(
    'data-p171-height-status',
    'APPROXIMATE_USER_ESTIMATE_PROPAGATED_AS_WORK_TEST',
  );
  await expect(canvas).toHaveAttribute('data-p171-exact-junction-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p171-pillar-geometry-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p171-binding-delta-visible-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-low-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-junction-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-physical-pillar-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p171-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p171-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p171-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p171-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute(
    'data-p171-plausibility-gate',
    'PASS_WITH_EXPLICIT_WORK_TEST_RELATIONAL_JUNCTION_AND_DEFERRED_PHYSICAL_DETAIL',
  );
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-composite', 'true');
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-review-visibility',
    'P167F_WORKSHELL_CLEARANCE_COMPOSITE',
  );
  await expect(canvas).toHaveAttribute('data-p171-q1-review-view', 'FREE_3D_ORBIT');
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-floor-shell-context',
    'P167F_PRESENTATION_WORKSHELL_CLEARANCE',
  );
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-opening-edge-context',
    'STAIR_ENVELOPE_VOID',
  );
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-floor-shell-internal-seams',
    'EDGE_OVERLAY_SUPPRESSED_SOURCE_VOLUME_FALLBACK',
  );
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-floor-shell-presentation',
    'SOURCE_VOLUME_FALLBACK',
  );
  await expect(canvas).toHaveAttribute('data-p171-q1-floor-shell-hidden-volume-count', '0');
  await expect(canvas).toHaveAttribute('data-p171-q1-floor-shell-surface-mesh-count', '0');
  await expect(canvas).toHaveAttribute(
    'data-p171-q1-opening-boundary-context',
    'P171B_R2_PRESENTATION_OPENING_ENVELOPE',
  );
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P171C D stair opening + guard/lowWall junction (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P171C D stair opening + guard/lowWall junction - WORK_TEST / floor-shell top-surface-only + aukon reuna korostettu / vapaa 3D - HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads exact P173D D wall HR-6/HR-7 rebase successor', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P173D WHOLE BUILDING D WALL HR67 REBASE - WORK_TEST',
        nodes: [],
        extras: {
          Pass: 'P173D',
          successorOfPass: 'P171C',
          currentClaim: false,
          asBuiltClaim: false,
          Canonical: false,
          publishToCURRENT: false,
          humanReview: 'PARTIAL_P160_FINDINGS_NOT_FULL_PASS',
        },
      },
    ],
    nodes: [],
  });
  const candidateId = 'p173d-whole-building-d-wall-hr67-rebase';
  const candidateLabel = 'P173D whole-building D wall HR-6/HR-7 rebase - WORK_TEST';
  const candidatePath = '/private-model/work-test/p173d-whole-building-d-wall-hr67-rebase.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p173d-whole-building-d-wall-hr67-rebase-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p173d-whole-building-d-wall-hr67-rebase-review',
  );
  await expect(canvas).toHaveAttribute('data-p173-parent-pass', 'P171C');
  await expect(canvas).toHaveAttribute('data-p173-geometry-pass', 'P173D');
  await expect(canvas).toHaveAttribute('data-p173-qa-pass', 'P173E');
  await expect(canvas).toHaveAttribute('data-p173-target-coverage', '4/4');
  await expect(canvas).toHaveAttribute('data-p173-new-geometry-target-count', '3');
  await expect(canvas).toHaveAttribute('data-p173-existing-equivalent-target-count', '1');
  await expect(canvas).toHaveAttribute('data-p173-storage-north-outer-host-y', '10.810');
  await expect(canvas).toHaveAttribute('data-p173-storage-north-work-inner-face-y', '10.590');
  await expect(canvas).toHaveAttribute('data-p173-storage-north-source-reference-y', '10.544');
  await expect(canvas).toHaveAttribute(
    'data-p173-junction-rule',
    'CONTINUOUS_NO_GAP_AND_ORTHOGONAL_90_DEGREE',
  );
  await expect(canvas).toHaveAttribute('data-p173-source-detailed-opening-identity-count', '18');
  await expect(canvas).toHaveAttribute('data-p173-precise-stair-preserved', 'true');
  await expect(canvas).toHaveAttribute('data-p173-opening-floor-shell-binding-preserved', 'true');
  await expect(canvas).toHaveAttribute('data-p173-guard-low-wall-junction-preserved', 'true');
  await expect(canvas).toHaveAttribute('data-p173-ac-storage-door-root-preserved', 'true');
  await expect(canvas).toHaveAttribute('data-p173-physical-wall-thickness-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p173-exact-physical-face-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p173-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p173-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p173-parent-resource-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p173-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p173-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p173-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p173-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p173-human-review', 'PARTIAL_P160_FINDINGS_NOT_FULL_PASS');
  await expect(canvas).toHaveAttribute(
    'data-p173-plausibility-gate',
    'PASS_FOR_WORK_TEST_SEMANTIC_REBASE_WITH_REFINABLE_STORAGE_NORTH_WALL_PLACEMENT',
  );
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P173D D wall HR-6/HR-7 rebase (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P173D D wall HR-6/HR-7 rebase - WORK_TEST / storage north + 90-degree junction correction / refinable physical detail - HUMAN_REVIEW PARTIAL',
  );
});

test('private viewer autoloads exact P174A-R2 HR-6 west-gable termination correction', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P174A-R2 HR-6 WEST GABLE TERMINATION CORRECTION - WORK_TEST',
        nodes: [],
        extras: {
          Pass: 'P174A-R2',
          successorOfPass: 'P173D',
          currentClaim: false,
          asBuiltClaim: false,
          Canonical: false,
          publishToCURRENT: false,
          humanReview: 'NOT_RUN',
        },
      },
    ],
    nodes: [],
  });
  const candidateId = 'p174a-r2-west-gable-termination-correction';
  const candidateLabel = 'P174A-R2 HR-6 west-gable termination correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p174a-r2-west-gable-termination-correction.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p174a-r2-west-gable-termination-correction-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p174a-r2-west-gable-termination-correction-review',
  );
  await expect(canvas).toHaveAttribute('data-p174-parent-pass', 'P173D');
  await expect(canvas).toHaveAttribute('data-p174-geometry-pass', 'P174A-R2');
  await expect(canvas).toHaveAttribute('data-p174-qa-pass', 'P174B');
  await expect(canvas).toHaveAttribute(
    'data-p174-materialization-strategy',
    'APPEND_ONLY_SCENE_ROOT_REPLACEMENT_REUSING_PARENT_WEST_GABLE_MESH',
  );
  await expect(canvas).toHaveAttribute('data-p174-parent-west-gable-node', '764');
  await expect(canvas).toHaveAttribute('data-p174-replacement-west-gable-node', '1010');
  await expect(canvas).toHaveAttribute('data-p174-replacement-root', '1011');
  await expect(canvas).toHaveAttribute('data-p174-correction-binding', '1012');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-x-min-m', '0.000');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-x-max-m', '0.220');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-y-min-m', '-1.750');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-y-max-m', '10.810');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-z-min-m', '0.000');
  await expect(canvas).toHaveAttribute('data-p174-west-gable-z-max-m', '6.150');
  await expect(canvas).toHaveAttribute('data-p174-parent-north-termination-y', '10.910');
  await expect(canvas).toHaveAttribute('data-p174-corrected-north-termination-y', '10.810');
  await expect(canvas).toHaveAttribute('data-p174-termination-correction-m', '-0.100');
  await expect(canvas).toHaveAttribute('data-p174-thickness-m', '0.220');
  await expect(canvas).toHaveAttribute('data-p174-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p174-parent-resource-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p174-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p174-physical-facade-boundary-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p174-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p174-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p174-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p174-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p174-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p174-plausibility-gate', 'PASS_FOR_BOUNDED_WORK_TEST_CORRECTION');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P174A-R2 HR-6 west-gable termination correction (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P174A-R2 HR-6 west-gable termination correction - WORK_TEST / north termination 10.810 m / bounded parent-subset correction - HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads exact P175B-R3 near-building terrain refinement', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{
      name: 'P175B-R3 NEAR-BUILDING FLATTER TERRAIN - WORK_TEST',
      nodes: [],
      extras: {
        Pass: 'P175B-R3',
        currentClaim: false,
        asBuiltClaim: false,
        Canonical: false,
        publishToCURRENT: false,
        humanReview: 'NOT_RUN',
      },
    }],
    nodes: [],
  });
  const candidateId = 'p175b-r3-near-building-flatter-terrain';
  const candidateLabel = 'P175B-R3 near-building flatter terrain - WORK_TEST';
  const candidatePath = '/private-model/work-test/p175b-r3-near-building-flatter-terrain.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p175b-r3-near-building-flatter-terrain-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p175b-r3-near-building-flatter-terrain-review',
  );
  await expect(canvas).toHaveAttribute('data-p175-parent-pass', 'P174A-R2');
  await expect(canvas).toHaveAttribute('data-p175-contract-pass', 'P175A');
  await expect(canvas).toHaveAttribute('data-p175-geometry-pass', 'P175B-R3');
  await expect(canvas).toHaveAttribute('data-p175-qa-pass', 'P175C');
  await expect(canvas).toHaveAttribute('data-p175-work-band-width-m', '1.000');
  await expect(canvas).toHaveAttribute('data-p175-band-width-status', 'REFINABLE_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p175-vertical-basis', 'PARENT_TERRAIN_DERIVED');
  await expect(canvas).toHaveAttribute('data-p175-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-p175-old-terrain-root', '919');
  await expect(canvas).toHaveAttribute('data-p175-new-terrain-root', '1014');
  await expect(canvas).toHaveAttribute('data-p175-new-terrain-mesh', '524');
  await expect(canvas).toHaveAttribute('data-p175-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p175-physical-walkway-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p175-physical-ground-surface-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p175-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p175-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p175-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p175-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p175-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p175-qa-gate', 'PASS_PERSISTED_EXACT_INDEPENDENT_QA');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P175B-R3 near-building flatter terrain (WORK_TEST / 1,000 m work assumption)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P175B-R3 near-building flatter terrain - WORK_TEST / 1.000 m refinable work-assumption band / HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads exact P176A HR-6 full visible west-gable termination correction', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P176A HR-6 FULL VISIBLE WEST GABLE TERMINATION CORRECTION - WORK_TEST',
        nodes: [],
        extras: {
          Pass: 'P176A',
          successorOfPass: 'P174A-R2',
          currentClaim: false,
          asBuiltClaim: false,
          Canonical: false,
          publishToCURRENT: false,
          humanReview: 'CORRECTION_REQUIRED_NOT_PASS',
        },
      },
    ],
    nodes: [],
  });
  const candidateId = 'p176a-hr6-full-visible-west-gable-termination-correction';
  const candidateLabel = 'P176A HR-6 full visible west-gable termination correction - WORK_TEST';
  const candidatePath =
    '/private-model/work-test/p176a-hr6-full-visible-west-gable-termination-correction.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto(
    '/private-model/?review=p176a-hr6-full-visible-west-gable-termination-correction-review',
  );
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p176a-hr6-full-visible-west-gable-termination-correction-review',
  );
  await expect(canvas).toHaveAttribute('data-p176-parent-pass', 'P174A-R2');
  await expect(canvas).toHaveAttribute('data-p176-geometry-pass', 'P176A');
  await expect(canvas).toHaveAttribute('data-p176-qa-pass', 'P176B');
  await expect(canvas).toHaveAttribute(
    'data-p176-materialization-strategy',
    'APPEND_ONLY_SCENE_ROOT_REPLACEMENT_REUSING_PARENT_CARRIER_MESHES',
  );
  await expect(canvas).toHaveAttribute('data-p176-parent-carrier-nodes', '685,688,690,766');
  await expect(canvas).toHaveAttribute(
    'data-p176-replacement-carrier-nodes',
    '1013,1014,1015,1016',
  );
  await expect(canvas).toHaveAttribute('data-p176-replacement-root', '1017');
  await expect(canvas).toHaveAttribute('data-p176-correction-binding', '1018');
  await expect(canvas).toHaveAttribute('data-p176-preserved-p174-replacement-node', '1010');
  await expect(canvas).toHaveAttribute('data-p176-preserved-below-grade-node', '920');
  await expect(canvas).toHaveAttribute('data-p176-corrected-north-termination-y', '10.810');
  await expect(canvas).toHaveAttribute('data-p176-carrier-count', '4');
  await expect(canvas).toHaveAttribute('data-p176-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p176-parent-resource-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p176-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p176-physical-facade-boundary-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p176-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p176-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p176-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p176-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p176-human-review', 'CORRECTION_REQUIRED_NOT_PASS');
  await expect(canvas).toHaveAttribute('data-p176-qa-gate', 'PASS_INDEPENDENT_EXACT_BIT_QA');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P176A HR-6 full visible west-gable termination correction (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P176A HR-6 full visible west-gable termination correction - WORK_TEST / 4 visible carriers to north termination 10.810 m / HUMAN_REVIEW CORRECTION_REQUIRED',
  );
});

test('P177B +X support regression loads geometry-bearing aligned north lines', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP177bAlignmentGlb();
  const jsonChunkLength = candidateModel.readUInt32LE(12);
  const binStart = 20 + jsonChunkLength + 8;
  const fixtureNorthYs = [1, 4, 7, 10].map((floatIndex) =>
    candidateModel.readFloatLE(binStart + floatIndex * 4),
  );
  for (const northY of fixtureNorthYs) {
    expect(Math.abs(northY - 10.81)).toBeLessThanOrEqual(0.00001);
  }

  const candidateId = 'p177b-hr6-direct-d-storage-north-wall-line-corrected';
  const candidateLabel = 'P177B HR-6 direct D-storage north wall-line correction - WORK_TEST';
  const candidatePath =
    '/private-model/work-test/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto(
    '/private-model/?review=p177b-hr6-direct-d-storage-north-wall-line-corrected-review',
  );
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p177b-hr6-direct-d-storage-north-wall-line-corrected-review',
  );
  await expect(canvas).toHaveAttribute('data-p177-source-reference-north-y', '10.544');
  await expect(canvas).toHaveAttribute('data-p177-target-north-y', '10.810');
  await expect(canvas).toHaveAttribute('data-p177-upper-reference-node', '682');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.getByRole('status')).toHaveText(
    'P177B HR-6 direct D-storage north wall-line correction - WORK_TEST / lower + upper north line 10.810 m / HUMAN_REVIEW CORRECTION_REQUIRED',
  );

  await clickViewAction(page, 'Julk +X');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
});

test('private viewer autoloads exact P178B stair guard/lowWall junction closure', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P178B D STAIR GUARD LOWWALL VISIBLE JUNCTION CLOSURE - WORK_TEST', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p178b-d-stair-guard-lowwall-junction-closure';
  const candidateLabel = 'P178B D stair guard/lowWall visible junction closure - WORK_TEST';
  const candidatePath = '/private-model/work-test/p178b-d-stair-guard-lowwall-junction-closure.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p178b-d-stair-guard-lowwall-junction-closure-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p178b-d-stair-guard-lowwall-junction-closure-review',
  );
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-p178-parent-pass', 'P177B');
  await expect(canvas).toHaveAttribute('data-p178-contract-pass', 'P178A');
  await expect(canvas).toHaveAttribute('data-p178-geometry-pass', 'P178B');
  await expect(canvas).toHaveAttribute('data-p178-qa-pass', 'P178C');
  await expect(canvas).toHaveAttribute('data-p178-visible-gap-before-m', '0.100');
  await expect(canvas).toHaveAttribute('data-p178-visible-gap-after-m', '0.000');
  await expect(canvas).toHaveAttribute('data-p178-visible-gap-tolerance-m', '0.005');
  await expect(canvas).toHaveAttribute('data-p178-pillar-zone-status', 'UNRESOLVED_NO_SOLID');
  await expect(canvas).toHaveAttribute('data-p178-pillar-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p178-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-physical-low-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-physical-junction-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-physical-pillar-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p178-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p178-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p178-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p178-human-review-inherited', 'false');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P178B D stair guard/lowWall junction closure (WORK_TEST / visible gap 0,000 m)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P178B D stair guard/lowWall junction closure - WORK_TEST / visible gap 0.000 m / touch-only non-overlapping work envelopes / HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads the exact P164B D corrected stair review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P164B D CORRECTED STAIR WORK_TEST - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p164b-d-corrected-stair';
  const candidateLabel = 'P164B D corrected stair topology - WORK_TEST';
  const candidatePath = '/private-model/work-test/p164b-d-corrected-stair.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p164b-d-corrected-stair-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p164b-d-corrected-stair-review');
  await expect(canvas).toHaveAttribute('data-p164-parent-pass', 'P163B');
  await expect(canvas).toHaveAttribute(
    'data-p164-topology',
    'TWO_FLIGHT_SWITCHBACK_WITH_FOUR_LEVEL_STEPPED_TURN_ZONE',
  );
  await expect(canvas).toHaveAttribute('data-p164-lower-flight-levels', '6');
  await expect(canvas).toHaveAttribute('data-p164-stepped-turn-levels', '4');
  await expect(canvas).toHaveAttribute('data-p164-upper-flight-levels', '6');
  await expect(canvas).toHaveAttribute('data-p164-lower-flight-ascent', 'E_TO_W');
  await expect(canvas).toHaveAttribute('data-p164-stepped-turn-progression', 'S_TO_N');
  await expect(canvas).toHaveAttribute('data-p164-upper-flight-ascent', 'W_TO_E');
  await expect(canvas).toHaveAttribute('data-p164-work-riser-count', '16');
  await expect(canvas).toHaveAttribute('data-p164-work-rise-m', '0.1725');
  await expect(canvas).toHaveAttribute('data-p164-work-run-m', '0.200');
  await expect(canvas).toHaveAttribute('data-p164-work-flight-width-m', '0.800');
  await expect(canvas).toHaveAttribute('data-p164-work-assumption', 'true');
  await expect(canvas).toHaveAttribute(
    'data-p164-plausibility-gate',
    'WARN_WORK_TEST_REFINABLE_AND_DEFERRED_PHYSICAL_DETAIL',
  );
  await expect(canvas).toHaveAttribute('data-p164-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-physical-low-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p164-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p164-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p164-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p164-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.locator('#locus-layer-label')).toHaveText('D corrected stair (WORK_TEST / 6+4+6 levels)');
  await expect(page.getByRole('status')).toHaveText(
    'P164B D corrected stair - WORK_TEST / 6+4+6 levels / E_TO_W + S_TO_N + W_TO_E - refinable - HUMAN_REVIEW NOT_RUN',
  );
});

test('private viewer autoloads the exact P167F whole-building precise stair review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P167F WHOLE BUILDING PRECISE STAIR WORK_TEST - BABYLON Y-UP',
        nodes: [0, 1],
      },
      {
        name: 'D CURRENT INTERIOR - BABYLON Y-UP',
        nodes: [3],
      },
    ],
    nodes: [
      {
        name: 'P167F_FLOOR_INTERFLOOR_WORKSHELL_WITH_PRECISE_STAIR_CLEARANCE_ROOT_BABYLON_Y_UP',
      },
      {
        name: 'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST',
        children: [2],
      },
      {
        name: 'P167D_D_PRECISE_STAIR_SOURCE_PLAN_ROOT_BABYLON_Y_UP',
      },
      {
        name: 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP',
      },
    ],
  });
  const candidateId = 'p167f-whole-building-precise-stair';
  const candidateLabel = 'P167F whole-building precise stair successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p167f-whole-building-precise-stair.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p167f-whole-building-precise-stair-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p167f-whole-building-precise-stair-review');
  await expect(canvas).toHaveAttribute('data-p167-parent-pass', 'P166F');
  await expect(canvas).toHaveAttribute('data-p167-geometry-pass', 'P167F');
  await expect(canvas).toHaveAttribute('data-p167-step-count', '14');
  await expect(canvas).toHaveAttribute('data-p167-overall-x-span-m', '2.250');
  await expect(canvas).toHaveAttribute('data-p167-overall-y-span-m', '2.100');
  await expect(canvas).toHaveAttribute('data-p167-flight-width-m', '0.950');
  await expect(canvas).toHaveAttribute('data-p167-center-gap-m', '0.200');
  await expect(canvas).toHaveAttribute('data-p167-run-m', '0.250');
  await expect(canvas).toHaveAttribute('data-p167-rise-m', '0.184');
  await expect(canvas).toHaveAttribute('data-p167-terminal2-f-level-z', '2.760');
  await expect(canvas).toHaveAttribute('data-p167-direction', 'E_TO_W__S_TO_N__W_TO_E');
  await expect(canvas).toHaveAttribute('data-p167-host-south-y', '5.122');
  await expect(canvas).toHaveAttribute('data-p167-host-north-y', '7.222');
  await expect(canvas).toHaveAttribute('data-p167-wall-contact-gap-m', '0');
  await expect(canvas).toHaveAttribute('data-p167-source-exact-stair-metrics', 'true');
  await expect(canvas).toHaveAttribute('data-p167-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p167-presentation-work-shell-cut-applied', 'true');
  await expect(canvas).toHaveAttribute('data-p167-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p167-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p167-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p167-physical-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute(
    'data-p167-plausibility-gate',
    'WARN_WORK_TEST_SOURCE_EXACT_STAIR_WITH_PRESENTATION_SHELL_CLEARANCE_AND_DEFERRED_PHYSICAL_DETAIL',
  );
  await expect(canvas).toHaveAttribute('data-p167-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p167-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p167-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p167-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p167-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.locator('#locus-layer-label')).toHaveText('P167F precise stair (WORK_TEST / 14 askelta)');
  await expect(page.getByRole('status')).toHaveText(
    'P167F whole-building precise stair - WORK_TEST / 14 askelta / E_TO_W + S_TO_N + W_TO_E / presentation shell clearance - HUMAN_REVIEW NOT_RUN',
  );

  await clickViewAction(page, 'D-asunto');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-composite', 'true');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-supplement-count', '2');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-precise-stair-present', 'true');
  await expect(page.getByRole('status')).toHaveText(
    'D-asunto - molemmat kerrokset, vapaa 3D',
  );
});

test('private viewer autoloads the exact P168A whole-building roof/eave correction review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P168A WHOLE BUILDING ROOF EAVE CORRECTION WORK_TEST - BABYLON Y-UP', nodes: [0, 1] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [3] },
    ],
    nodes: [
      { name: 'P167F_FLOOR_INTERFLOOR_WORKSHELL_WITH_PRECISE_STAIR_CLEARANCE_ROOT_BABYLON_Y_UP' },
      { name: 'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST', children: [2] },
      { name: 'P167D_D_PRECISE_STAIR_SOURCE_PLAN_ROOT_BABYLON_Y_UP' },
      { name: 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP' },
    ],
  });
  const candidateId = 'p168a-whole-building-roof-eave-correction';
  const candidateLabel = 'P168A whole-building roof/eave correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p168a-whole-building-roof-eave-correction.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p168a-whole-building-roof-eave-correction-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p168a-whole-building-roof-eave-correction-review');
  await expect(canvas).toHaveAttribute('data-p168-parent-pass', 'P167F');
  await expect(canvas).toHaveAttribute('data-p168-geometry-pass', 'P168A');
  await expect(canvas).toHaveAttribute('data-p168-qa-pass', 'P168B');
  await expect(canvas).toHaveAttribute('data-p168-correction-scope', 'CD_ROOF_EAVE_PRESENTATION_FACE_REACHABILITY');
  await expect(canvas).toHaveAttribute('data-p168-split-reference-x', '12.700');
  await expect(canvas).toHaveAttribute('data-p168-visible-roof-end-x', '13.250');
  await expect(canvas).toHaveAttribute('data-p168-roof-thickness-m', '0.200');
  await expect(canvas).toHaveAttribute('data-p168-eave-projection-m', '0.550');
  await expect(canvas).toHaveAttribute('data-p168-metric-status', 'HUMAN_REVIEW_APPROX_WORK_TEST');
  await expect(canvas).toHaveAttribute('data-p168-active-presentation-face-node', '754');
  await expect(canvas).toHaveAttribute('data-p168-superseded-presentation-face-node', '930');
  await expect(canvas).toHaveAttribute('data-p168-thin-roof-shell-node', '932');
  await expect(canvas).toHaveAttribute('data-p168-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p168-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p168-correction-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p168-physical-roof-claim', 'false');
  await expect(canvas).toHaveAttribute(
    'data-p168-plausibility-gate',
    'WARN_HUMAN_REVIEW_APPROX_WORK_TEST_ROOF_THICKNESS_AND_EAVE_PROJECTION',
  );
  await expect(canvas).toHaveAttribute('data-p168-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p168-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p168-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p168-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p168-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P168A roof/eave correction (WORK_TEST / approx 0,20 m + 0,55 m)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P168A whole-building roof/eave correction - WORK_TEST / approx kattopaksuus 0,20 m / approx ulotus 0,55 m - HUMAN_REVIEW NOT_RUN',
  );

  await clickViewAction(page, 'D-asunto');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-composite', 'true');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-supplement-count', '2');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-precise-stair-present', 'true');
  await expect(page.getByRole('status')).toHaveText('D-asunto - molemmat kerrokset, vapaa 3D');
});


test('private viewer autoloads the exact P169A whole-building A-C storage visible review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P169A WHOLE BUILDING A-C STORAGE VISIBLE WORK_TEST - BABYLON Y-UP', nodes: [0, 1] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [3] },
    ],
    nodes: [
      { name: 'P167F_FLOOR_INTERFLOOR_WORKSHELL_WITH_PRECISE_STAIR_CLEARANCE_ROOT_BABYLON_Y_UP' },
      { name: 'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST', children: [2] },
      { name: 'P167D_D_PRECISE_STAIR_SOURCE_PLAN_ROOT_BABYLON_Y_UP' },
      { name: 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP' },
    ],
  });
  const candidateId = 'p169a-whole-building-ac-storage-visible';
  const candidateLabel = 'P169A whole-building A-C storage visible envelope - WORK_TEST';
  const candidatePath = '/private-model/work-test/p169a-whole-building-ac-storage-visible.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p169a-whole-building-ac-storage-visible-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p169a-whole-building-ac-storage-visible-review');
  await expect(canvas).toHaveAttribute('data-p168-geometry-pass', 'P168A');
  await expect(canvas).toHaveAttribute('data-p169-parent-pass', 'P168A');
  await expect(canvas).toHaveAttribute('data-p169-geometry-pass', 'P169A');
  await expect(canvas).toHaveAttribute('data-p169-qa-pass', 'P169B');
  await expect(canvas).toHaveAttribute('data-p169-target-surface-count', '12');
  await expect(canvas).toHaveAttribute('data-p169-apartment-group-count', '3');
  await expect(canvas).toHaveAttribute('data-p169-repeated-geometry-authority', 'USER_CURRENT_RELATION_PLUS_D_R_REFERENCE');
  await expect(canvas).toHaveAttribute('data-p169-split-level-parity-m', '1.000');
  await expect(canvas).toHaveAttribute('data-p169-inherited-p168-review-context', 'true');
  await expect(canvas).toHaveAttribute('data-p169-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p169-work-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-p169-opening-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169-foundation-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169-ground-contact-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p169-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p169-physical-metric-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169-plausibility-gate', 'WARN_WORK_TEST_PROPAGATED_PRESENTATION_ENVELOPE');
  await expect(canvas).toHaveAttribute('data-p169-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p169-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p169-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P169A A-C storage envelope (WORK_TEST / 12 presentation surfaces)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P169A whole-building A-C storage visible envelope - WORK_TEST / 12 presentation surface targetia / inherited P168A roof/eave context - HUMAN_REVIEW NOT_RUN',
  );

  await clickViewAction(page, 'D-asunto');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-p167-d-overview-composite', 'true');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-precise-stair-present', 'true');
  await expect(canvas).toHaveAttribute('data-p172b-d-overview-presentation', 'true');
  await expect(canvas).toHaveAttribute('data-p172b-d-overview-floor-opacity', '0.45');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-overview');
  await expect(page.getByRole('status')).toHaveText('D-asunto - molemmat kerrokset, vapaa 3D');

  await clickViewAction(page, 'Isometrinen');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-overview');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-precise-stair-present', 'true');
  await expect(canvas).toHaveAttribute('data-p172b-d-overview-presentation', 'true');
  await expect(canvas).toHaveAttribute('data-p172b-d-overview-floor-opacity', '0.45');
});


test('private viewer autoloads the exact P169F A-C storage-door review candidate without inheriting door approval', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P169F A-C STORAGE DOORS WORK_TEST - BABYLON Y-UP', nodes: [0, 1] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [3] },
    ],
    nodes: [
      { name: 'P167F_FLOOR_INTERFLOOR_WORKSHELL_WITH_PRECISE_STAIR_CLEARANCE_ROOT_BABYLON_Y_UP' },
      { name: 'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST', children: [2] },
      { name: 'P167D_D_PRECISE_STAIR_SOURCE_PLAN_ROOT_BABYLON_Y_UP' },
      { name: 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP' },
    ],
  });
  const candidateId = 'p169f-whole-building-ac-storage-doors';
  const candidateLabel = 'P169F A-C storage doors - WORK_TEST';
  const candidatePath = '/private-model/work-test/p169f-whole-building-ac-storage-doors.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p169f-whole-building-ac-storage-doors-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p169f-whole-building-ac-storage-doors-review');
  await expect(canvas).toHaveAttribute('data-p169-human-review', 'SCOPED_PASS_STORAGE_ENVELOPE_ONLY');
  await expect(canvas).toHaveAttribute('data-p169f-parent-pass', 'P169A');
  await expect(canvas).toHaveAttribute('data-p169f-geometry-pass', 'P169F');
  await expect(canvas).toHaveAttribute('data-p169f-qa-pass', 'P169G');
  await expect(canvas).toHaveAttribute('data-p169f-target-door-count', '3');
  await expect(canvas).toHaveAttribute('data-p169f-opening-anchor-count', '3');
  await expect(canvas).toHaveAttribute('data-p169f-proxy-count', '3');
  await expect(canvas).toHaveAttribute('data-p169f-inherited-p169a-envelope', 'true');
  await expect(canvas).toHaveAttribute('data-p169f-parent-human-review', 'SCOPED_PASS_STORAGE_ENVELOPE_ONLY');
  await expect(canvas).toHaveAttribute('data-p169f-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p169f-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-opening-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-physical-metric-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-door-width-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-door-height-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-door-handing-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-foundation-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-ground-contact-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-binary-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-host-role-naming-discrepancy', 'true');
  await expect(canvas).toHaveAttribute('data-p169f-plausibility-gate', 'PASS_WITH_SOURCE_HOST_LABEL_WARN');
  await expect(canvas).toHaveAttribute('data-p169f-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p169f-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P169F A-C storage doors (WORK_TEST / 3 presentation-only doors)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P169F A-C storage doors - WORK_TEST / 3 presentation-only doors / no physical opening or metric claim - HUMAN_REVIEW NOT_RUN',
  );

  await clickViewAction(page, 'D-asunto');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-p167-d-overview-composite', 'true');
  await expect(canvas).toHaveAttribute('data-p167-d-overview-precise-stair-present', 'true');
  await expect(page.getByRole('status')).toHaveText('D-asunto - molemmat kerrokset, vapaa 3D');
});

test('private viewer autoloads the exact P156I 2017 KVV main presentation review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P156I 2017 KVV MAIN WORK_ASSUMPTION + P156B CARRIER - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p156i-2017-kvv-main-presentation';
  const candidateLabel = 'P156I 2017 KVV mainCandidate presentation - WORK_TEST';
  const candidatePath = '/private-model/work-test/p156i-2017-kvv-main-presentation.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p156i-2017-kvv-main-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p156i-2017-kvv-main-review');
  await expect(canvas).toHaveAttribute('data-p156-source-family', 'KVV_MAIN_2017_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p156-time-role', '2017_PROJECT_PLAN_DERIVED');
  await expect(canvas).toHaveAttribute('data-p156-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p156-display-z-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-p156-work-datum-status', 'PRESENTATION_ONLY_REFINABLE');
  await expect(canvas).toHaveAttribute('data-p156-vertical-datum-status', 'OPEN_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-p156-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-same-pipe-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P156I 2017 KVV mainCandidate - WORK_TEST / presentation-only +8,700 m - ei fyysinen putkikorko',
  );
});

test('private viewer composes p143D SCALGO terrain and p139AD assumed-Z infra for depth review', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP143dTerrainGlb();
  const candidateId = 'p143a-scalgo-terrain';
  const candidateLabel = 'p143A SCALGO terrain + architecture - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143a-scalgo-terrain.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143d-scalgo-infra-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-terrain-infra-review');
  await expect(canvas).toHaveAttribute('data-locus-work-z-route-count', '4');
  await expect(canvas).toHaveAttribute('data-locus-work-z-max-elevation', '18.150');
  await expect(canvas).toHaveAttribute('data-scalgo-terrain-base-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO NYKYMAASTO + LOCUS WORK-Z - 4 reittiä - työoffset 21,750 m / ei as-built',
  );

  await clickViewAction(page, 'Julk -Y');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'neg-y');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
  await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
  await expect(page.locator('#height-scale')).toBeVisible();

  await expect(page.locator('#profile-button')).toBeEnabled();
  await clickMoreAction(page, 'Pituusleikkaus');
  await expect(page.locator('#profile-panel')).toBeVisible();
  await expect(page.locator('#profile-route-select')).toHaveValue(
    'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
  );
  await expect(canvas).toHaveAttribute(
    'data-profile-route',
    'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
  );
  await expect(canvas).toHaveAttribute('data-profile-min-cover-m', '3.600');
  await expect(canvas).toHaveAttribute('data-profile-max-cover-m', '3.850');
  const profileSampleCount = Number(await canvas.getAttribute('data-profile-sample-count'));
  const profileTerrainHitCount = Number(await canvas.getAttribute('data-profile-terrain-hit-count'));
  expect(profileSampleCount).toBeGreaterThan(2);
  expect(profileTerrainHitCount).toBe(profileSampleCount);
  const terrainProfilePath = page.locator('#profile-svg [data-series="terrain"]');
  const pipeProfilePath = page.locator('#profile-svg [data-series="pipe"]');
  await expect(terrainProfilePath).toHaveCount(1);
  await expect(pipeProfilePath).toHaveCount(1);
  expect(await terrainProfilePath.getAttribute('d')).toContain('M');
  expect(await pipeProfilePath.getAttribute('d')).toContain('M');
  await expect(page.locator('#profile-summary')).toContainText('peitto min 3,60 m');
  await page.locator('#close-profile-button').click();

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('SCALGO nykymaasto + Locus work-Z infra (WORK_TEST)')).toBeVisible();
});

test('private viewer composes p139AC ground and Z-backed underground infra review on p139AB', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP139abReviewGlb();
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p139ac-ground-infra-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'ground-infra-review');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'MAANPINTA + INFRA - alin maanpinta +18,30 - vain Z-lähteistetty maanalainen infra - ei as-built',
  );

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Maanpinta + Z-lähteistetty maanalainen infra')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer composes p139AD Locus assumed-Z routes below the ground hard ceiling', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP139abReviewGlb();
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p139ad-locus-work-z-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'locus-work-z-review');
  await expect(canvas).toHaveAttribute('data-locus-work-z-route-count', '4');
  await expect(canvas).toHaveAttribute('data-locus-work-z-max-elevation', '18.150');
  await expect(canvas).toHaveAttribute('data-p139ab-building-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p139ab-source-z-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'LOCUS WORK-Z - 4 reittiä oletuskoroilla - max +18,15 < maanpintaraja +18,30 - ei as-built',
  );

  await clickViewAction(page, 'Julk +Y');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-y');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
  await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
  await expect(canvas).toHaveAttribute('data-height-scale-min-z', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-height-scale-max-z', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-height-scale-step-m', /.+/);
  await expect(page.locator('#height-scale')).toBeVisible();
  await expect(page.locator('#height-scale .height-scale-label').first()).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Ortografinen julkisivu +Y - YLIS-G1-LOCAL Z-asteikko',
  );

  await clickViewAction(page, 'Julk +X');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');

  await clickViewAction(page, 'Isometrinen');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'false');
  await expect(canvas).not.toHaveAttribute('data-height-scale-min-z', /.+/);
  await expect(canvas).not.toHaveAttribute('data-height-scale-max-z', /.+/);
  await expect(canvas).not.toHaveAttribute('data-height-scale-step-m', /.+/);

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Locus work-Z + maanpinta + source-Z referenssi')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer imports an exact WORK_TEST candidate from a protected fragment link without a file picker', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=2026-09-29T13%3A00%3A00Z&sig=signature';
  let importRequests = 0;
  let candidateLoads = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/import.json', async (route) => {
    importRequests += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({ candidateId, sourceUrl });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
        ready: true,
        seeded: true,
      }),
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    candidateLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  const fragment = new URLSearchParams({
    workTestCandidate: candidateId,
    workTestImport: sourceUrl,
  }).toString();
  await page.goto(`/private-model/#${fragment}`);

  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-work-test-import', 'ready');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'work-test');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.getByRole('status')).toHaveText('WORK_TEST-malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#work-test-file-input')).toHaveCount(0);
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(importRequests).toBe(1);
  expect(candidateLoads).toBe(1);
});

test('private viewer automatically relays the protected source in-browser when server-side import fails', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143H SCALGO TECH LABELS + PAIRED GRADIENT BARBS + SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143h-scalgo-label-axis';
  const candidateLabel = 'p143H SCALGO technical labels + paired barbs - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143h-scalgo-label-axis.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/fallback/raw?se=2026-09-30T20%3A00%3A00Z&sig=signature';
  let uploaded = false;
  let uploadRequests = 0;
  let sourceRequests = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/import.json', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'source-fetch-denied' }),
    });
  });
  await page.route('https://sdmntprdenmarkeast.oaiusercontent.com/**', async (route) => {
    sourceRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    if (!uploaded) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(
    `**/private-model/work-test/upload/${candidateId}.glb`,
    async (route) => {
      uploadRequests += 1;
      expect(route.request().method()).toBe('PUT');
      expect(route.request().headers()['content-type']).toContain('model/gltf-binary');
      expect(route.request().postDataBuffer()?.byteLength).toBe(candidateModel.byteLength);
      uploaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
          ready: true,
          seeded: true,
          uploaded: true,
        }),
      });
    },
  );
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  const fragment = new URLSearchParams({
    workTestCandidate: candidateId,
    workTestImport: sourceUrl,
  }).toString();
  await page.goto(`/private-model/?review=p143h-scalgo-label-axis-review#${fragment}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-relay', 'ready');
  await expect(canvas).toHaveAttribute('data-work-test-import', 'ready');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-axis-review');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.getByRole('button', { name: 'Tuo WORK_TEST .glb' })).toBeHidden();
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(sourceRequests).toBe(1);
  expect(uploadRequests).toBe(1);
});

test('private viewer bounds a non-settling WORK_TEST import before browser relay fallback', async ({ page }) => {
  test.setTimeout(45_000);

  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P150G WHOLE-BUILDING + END-PLINTH HUMAN-REVIEW CORRECTION - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150g-whole-building-end-plinth';
  const candidateLabel = 'P150G whole-building end-plinth correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150g-whole-building-end-plinth.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/stalled/raw?se=2026-10-01T12%3A00%3A00Z&sig=signature';
  let uploaded = false;
  let sourceRequests = 0;
  let uploadRequests = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      if (url.includes('/private-model/work-test/import.json')) {
        return new Promise<Response>(() => {
          // Deliberately never settle and ignore AbortSignal to prove the hard timeout wins.
        });
      }
      return nativeFetch(input, init);
    }) as typeof window.fetch;
  });
  await page.route('https://sdmntprdenmarkeast.oaiusercontent.com/**', async (route) => {
    sourceRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    if (!uploaded) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(
    `**/private-model/work-test/upload/${candidateId}.glb`,
    async (route) => {
      uploadRequests += 1;
      uploaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
          ready: true,
          seeded: true,
          uploaded: true,
        }),
      });
    },
  );
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  const fragment = new URLSearchParams({
    workTestCandidate: candidateId,
    workTestImport: sourceUrl,
  }).toString();
  const startedAt = Date.now();
  await page.goto(`/private-model/?review=p150g-whole-building-end-plinth-review#${fragment}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-relay', 'ready', { timeout: 36_000 });
  await expect(canvas).toHaveAttribute('data-work-test-import', 'ready');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150g-whole-building-end-plinth-review',
  );
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(29_000);
  expect(Date.now() - startedAt).toBeLessThan(36_000);
  expect(sourceRequests).toBe(1);
  expect(uploadRequests).toBe(1);
});

test('private viewer initializes preset layer defaults once and preserves manual overrides across view modes', async ({ page }) => {
  const model = makeLocusLayerGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  const modelBadge = page.locator('#model-source-badge');

  // View presets must stay inside the currently loaded model; only explicit model actions may swap identity.
  await expect(modelBadge).toHaveText('CURRENT');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');

  await clickViewAction(page, 'Koko rakennus');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'preset:whole-building');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'visible');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const roofToggle = page.locator('#roof-layer-visible');
  const locusToggle = page.locator('#locus-layer-visible');
  const edgeMode = page.locator('#edge-mode-select');
  await expect(locusToggle).toBeEnabled();

  await roofToggle.uncheck();
  await locusToggle.check();
  await edgeMode.selectOption('none');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'manual');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');

  await clickViewAction(page, 'Tontti');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'site');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'manual');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');
  await expect(modelBadge).toHaveText('CURRENT');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');

  await clickViewAction(page, 'Infra');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'manual');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');
  await expect(modelBadge).toHaveText('CURRENT');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
});

test('private viewer keeps the primary toolbar compact and exposes legacy actions through menus', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/private-model/');

  await expect(page.getByText('Ylisrinne 3D', { exact: true })).toBeVisible();
  await expect(page.locator('#view-menu > summary')).toHaveText('Näkymä');
  await expect(page.getByRole('button', { name: 'Layerit' })).toBeVisible();
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#more-menu > summary')).toHaveAttribute('aria-label', 'Lisää toimintoja');
  await expect(page.getByRole('button', { name: 'Sovita näkymään' })).toBeHidden();

  await openToolbarMenu(page, '#view-menu');
  await expect(page.getByRole('button', { name: 'Koko rakennus' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D-asunto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vapaa 3D' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Isometrinen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 1F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 2F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tontti' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Infra' })).toBeVisible();

  await openToolbarMenu(page, '#more-menu');
  await expect(page.getByRole('button', { name: 'Sovita näkymään' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pituusleikkaus' })).toBeDisabled();
});


test('private viewer compares CURRENT and WORK_TEST in the same preserved view', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'WORK TEST ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p149f-compare-candidate';
  const candidateLabel = 'P149F comparison candidate - WORK_TEST';
  const candidatePath = '/private-model/work-test/p149f-compare-candidate.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await clickViewAction(page, 'Koko rakennus');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');

  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name: 'Vertaa WORK_TESTiin' }).click();
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
  await expect(canvas).toHaveAttribute('data-model-comparison-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-model-comparison-view', 'preserved');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.getByRole('status')).toHaveText(`A/B-vertailu: WORK_TEST - ${candidateLabel}`);

  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name: 'Vertaa CURRENTiin' }).click();
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
  await expect(canvas).toHaveAttribute('data-model-comparison-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-model-comparison-view', 'preserved');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.getByRole('status')).toHaveText('A/B-vertailu: CURRENT');
});

test('private viewer fails safe when the protected WORK_TEST catalog is unavailable', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{}',
    });
  });

  await page.goto('/private-model/');

  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute(
    'data-work-test-catalog',
    'unavailable',
  );
  await expect(page.locator('#work-test-select')).toBeDisabled();
  await expect(page.locator('#work-test-select')).toContainText('Ei WORK_TEST-kandidaatteja');
  await expect(page.locator('#work-test-button')).toBeDisabled();
});

test('private viewer autoloads the exact P159 whole-building storage context review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({ asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'CURRENT ROOT', nodes: [] }], nodes: [] });
  const candidateModel = makeMinimalGlb({ asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'WHOLE BUILDING STORAGE CONTEXT WORK_TEST P159 - BABYLON Y-UP', nodes: [] }], nodes: [] });
  const candidateId = 'p159-whole-building-storage-context';
  const candidateLabel = 'P159 whole-building storage context successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p159-whole-building-storage-context.glb';

  await page.route('**/private-model/model.glb', async (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel }));
  await page.route('**/private-model/work-test/catalog.json', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }) }));
  await page.route(`**${candidatePath}`, async (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel }));

  await page.goto('/private-model/?review=p159-whole-building-storage-context-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p159-whole-building-storage-context-review');
  await expect(canvas).toHaveAttribute('data-p159-owner-candidate', 'p150g-whole-building-end-plinth');
  await expect(canvas).toHaveAttribute('data-p159-inherited-human-review-scope', 'END_PLINTH_SCOPE_ONLY');
  await expect(canvas).toHaveAttribute('data-p159-storage-reference-footprint-count', '3');
  await expect(canvas).toHaveAttribute('data-p159-storage-context-source', 'P158B');
  await expect(canvas).toHaveAttribute('data-p159-storage-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p159-storage-physical-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-ground-contact-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-terrain-cut-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-roof-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-physical-metric-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p159-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText('P159 whole-building storage context - WORK_TEST / P150G owner + 3 P158B storage referenceFootprints presentation-only - HUMAN_REVIEW NOT_RUN');
});

test('private viewer autoloads the exact P160 D composite architecture review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'D COMPOSITE ARCHITECTURE WORK_TEST P160 - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p160-d-composite-architecture';
  const candidateLabel = 'P160 D composite architecture carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p160-d-composite-architecture.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p160-d-composite-architecture-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p160-d-composite-architecture-review');
  await expect(canvas).toHaveAttribute('data-p160-owner-candidate', 'p154c-d-wall-cutouts');
  await expect(canvas).toHaveAttribute('data-p160-wall-piece-count', '126');
  await expect(canvas).toHaveAttribute('data-p160-cutout-identity-count', '18');
  await expect(canvas).toHaveAttribute('data-p160-stair-guard-low-wall-delta', 'P153C');
  await expect(canvas).toHaveAttribute('data-p160-storage-roof-delta', 'P155C-B');
  await expect(canvas).toHaveAttribute('data-p160-storage-roof-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p160-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-low-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-roof-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p160-pillar-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p160-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p160-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p160-warm-floor-review-presentation', 'true');
  await expect(canvas).toHaveAttribute('data-p160-warm-floor-review-surface-count', '2');
  await expect(canvas).toHaveAttribute('data-p160-warm-floor-review-geometry', 'TWO_UNIFIED_HEATED_FLOORS_WITH_2F_STAIR_VOID');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText(
    'P160 D composite architecture - WORK_TEST / P154C walls+18 cutouts + P153 stair/guard/lowWall + P155C-B storage roof presentation - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P154C D wall cutout review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'D WALL CUTOUTS WORK_TEST P154C - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p154c-d-wall-cutouts';
  const candidateLabel = 'P154C D wall solids + door/window cutouts - WORK_TEST';
  const candidatePath = '/private-model/work-test/p154c-d-wall-cutouts.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p154c-d-wall-cutouts-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p154c-d-wall-cutouts-review');
  await expect(canvas).toHaveAttribute('data-p154-result-wall-piece-count', '126');
  await expect(canvas).toHaveAttribute('data-p154-cutout-identity-count', '18');
  await expect(canvas).toHaveAttribute('data-p154-door-cutout-count', '11');
  await expect(canvas).toHaveAttribute('data-p154-window-cutout-count', '7');
  await expect(canvas).toHaveAttribute('data-p154-excluded-unmapped-user-opening-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p154-excluded-unmapped-user-opening-ids',
    'D1F_USER_CURRENT_DOOR_A,D1F_USER_CURRENT_DOOR_B',
  );
  await expect(canvas).toHaveAttribute('data-p154-opening-treatment', 'P154C_WORK_TEST_CUTOUT_APPLIED');
  await expect(canvas).toHaveAttribute('data-p154-door-vertical-basis', 'REFINABLE_WORK_ASSUMPTION_2_100M');
  await expect(canvas).toHaveAttribute('data-p154-window-vertical-basis', 'SOURCE_REFERENCE_OPENING');
  await expect(canvas).toHaveAttribute('data-p154-normal-extent-role', 'HOST_SOLID_INTERSECTION_ONLY');
  await expect(canvas).toHaveAttribute('data-p154-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p154-physical-door-height-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p154-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText(
    'P154C D-seinäsolidit + aukot - WORK_TEST / 18 cutoutia - ovikorkeus 2,100 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P153C D stair review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P153C D STAIR GUARD + LOWWALL + P153B STAIR WORK_TEST - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p153c-d-stair-guard-lowwall';
  const candidateLabel = 'P153C D stair + guard/lowWall - WORK_TEST';
  const candidatePath = '/private-model/work-test/p153c-d-stair-guard-lowwall.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p153c-d-stair-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p153c-d-stair-review');
  await expect(canvas).toHaveAttribute('data-p153-work-topology', 'TWO_FLIGHT_SWITCHBACK_WITH_TURN_LANDING');
  await expect(canvas).toHaveAttribute('data-p153-work-riser-count', '16');
  await expect(canvas).toHaveAttribute('data-p153-total-rise-m', '2.760');
  await expect(canvas).toHaveAttribute('data-p153-work-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-p153-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-low-wall-claim', 'false');
  await expect(
    canvas,
  ).toHaveAttribute('data-p153-guard-low-wall-junction-status', 'RELATIONAL_ONLY_EXACT_JUNCTION_UNRESOLVED');
  await expect(canvas).toHaveAttribute('data-p153-pillar-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p153-exact-guard-geometry-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p153-exact-low-wall-height-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p153-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(page.getByRole('status')).toHaveText(
    'P153C D-portaat - WORK_TEST / portaat + opening-frame + guard/lowWall - mitat refinable, pilarijakso DEFERRED',
  );
});

