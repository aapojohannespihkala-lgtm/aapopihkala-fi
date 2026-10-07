import { expect, test } from '@playwright/test';

import {
  m5aZ2AbsoluteZBasis,
  m5aZ2AbsoluteZContract,
  m5aZ2ExpectedTargetKeys,
  m5aZ2ReviewCamera,
  m5aZ2ReviewContextOpacity,
  m5aZ2ReviewQuestionText,
  m5aZ2ReviewTargetOpacity,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeMaterial = () => new THREE.MeshBasicMaterial({ opacity: 1 });

const commonNoPromotion = {
  Pass: 'M5A-Z2',
  ModelStage: 'WORK_TEST_VIEW',
  Canonical: false,
  presentationOnly: true,
  workAssumption: true,
  sourceDerivedTopology: true,
  exactXYClaim: false,
  exactZClaim: false,
  physicalElevationClaim: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  publishToCURRENT: false,
  absoluteZContract: m5aZ2AbsoluteZContract,
};

const makeWell = (id: string, x: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), makeMaterial());
  mesh.position.set(x, 0, -2);
  mesh.userData = {
    ...commonNoPromotion,
    G2IdCandidate: id,
    representationKind: 'wellMarkerWork',
    physicalWellGeometryClaim: false,
    absoluteZBasis: m5aZ2AbsoluteZBasis,
  };
  return mesh;
};

const makeRoute = (id: string, x: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), makeMaterial());
  mesh.position.set(x, 0, -2.2);
  mesh.userData = {
    ...commonNoPromotion,
    G2IdCandidate: id,
    representationKind: 'referenceRouteWork',
    physicalRouteClaim: false,
    exactSlopeClaim: false,
    absoluteZBasis: m5aZ2AbsoluteZBasis,
  };
  return mesh;
};

const makeBoundary = (role: string, x: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), makeMaterial());
  mesh.position.set(x, 0, -2.4);
  mesh.userData = {
    ...commonNoPromotion,
    representationKind: 'unresolvedBoundaryMarker',
    boundaryStatus: 'UNRESOLVED_BOUNDARY',
    boundaryRole: role,
    physicalRouteClaim: false,
    externalNetworkConnectionClaim: false,
  };
  return mesh;
};

const makeFixture = () => {
  const scene = new THREE.Group();
  const axisRoot = new THREE.Group();
  axisRoot.rotation.x = -Math.PI / 2;
  scene.add(axisRoot);

  const targetObjects = [
    makeWell('G2_DRAIN_WELL_SOK1_001', 0),
    makeWell('G2_DRAIN_WELL_SOK2_001', 1),
    makeWell('G2_DRAIN_WELL_SOK3_001', 2),
    makeWell('G2_DRAIN_WELL_PVK_001', 3),
    makeRoute('G2_DRAIN_LINK_PVK_SOK1_001', 4),
    makeRoute('G2_DRAIN_LINK_PVK_SOK3_001', 5),
    makeRoute('G2_DRAIN_LINK_SOK1_SOK2_001', 6),
    makeRoute('G2_DRAIN_LINK_SOK3_BUILDING_END_001', 7),
    makeRoute('G2_DRAIN_LINK_SOK2_BUILDING_END_001', 8),
    makeRoute('G2_DRAIN_LINK_PVK_DISCHARGE_001', 9),
    makeRoute('G2_DRAIN_LINK_PVK_PARKING_001', 10),
    makeBoundary('PVK_DISCHARGE', 11),
    makeBoundary('PVK_PARKING', 12),
  ];

  axisRoot.add(...targetObjects);

  const building = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 10), makeMaterial());
  building.position.set(6, -2.5, 3);
  building.userData = { G2Id: 'G2_BUILDING_CONTEXT_M5A_Z2_TEST' };
  axisRoot.add(building);

  const oldDrainage = makeRoute('G2_DRAIN_LINK_PVK_SOK1_001', 14);
  oldDrainage.userData.Pass = 'M5A-R3-Z1C';
  axisRoot.add(oldDrainage);

  scene.updateMatrixWorld(true);
  return { scene, targetObjects, building, oldDrainage };
};

test('M5A-Z2 helper selects the exact 4+7+2 system targets and applies 80/20 presentation', () => {
  const { scene, targetObjects, building, oldDrainage } = makeFixture();
  const result = prepareM5AZ2SystemReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(13);
  expect(result.expectedTargetRenderableCount).toBe(m5aZ2ExpectedTargetKeys.length);
  expect(result.missingTargetKeys).toEqual([]);
  expect(result.duplicateTargetKeys).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.kindCounts).toEqual({
    wellMarkerWork: 4,
    referenceRouteWork: 7,
    unresolvedBoundaryMarker: 2,
  });
  expect(result.contextRenderableCount).toBe(2);
  expect(result.targetBounds).not.toBeNull();

  for (const target of targetObjects) {
    expect((target.material as THREE.Material & { opacity: number }).opacity).toBe(
      m5aZ2ReviewTargetOpacity,
    );
    expect(target.userData.m5aZ2ReviewRole).toBe('QUESTION_TARGET_80');
  }

  for (const context of [building, oldDrainage]) {
    expect((context.material as THREE.Material & { opacity: number }).opacity).toBe(
      m5aZ2ReviewContextOpacity,
    );
    expect(context.userData.m5aZ2ReviewRole).toBe('BUILDING_DRAINAGE_CONTEXT_20');
  }
});

test('M5A-Z2 review contract stays free-orbit and explicitly limits the absolute-Z claim', () => {
  expect(m5aZ2ReviewCamera).toEqual({
    coordinateFrame: 'YLIS-G1-LOCAL',
    projection: 'PERSPECTIVE',
    controls: 'FREE_ORBIT',
    framing: 'TARGET_BOUNDS',
  });
  expect(m5aZ2ReviewQuestionText).toContain('4 kaivoa');
  expect(m5aZ2ReviewQuestionText).toContain('7 reittiä');
  expect(m5aZ2ReviewQuestionText).toContain('2 ratkaisemattoman rajan');
  expect(m5aZ2ReviewQuestionText).toContain(m5aZ2AbsoluteZBasis);
  expect(m5aZ2ReviewQuestionText).toContain('exact-Z');
  expect(m5aZ2ReviewQuestionText).toContain('as-built');
});

test('M5A-Z2 helper rejects promotion-like target semantics', () => {
  const { scene, targetObjects } = makeFixture();
  targetObjects[0].userData.currentGeometryClaim = true;
  targetObjects[4].userData.exactSlopeClaim = true;

  const result = prepareM5AZ2SystemReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(13);
  expect(result.semanticViolationCount).toBe(2);
});

test('M5A-Z2 helper reports a missing required boundary target', () => {
  const { scene, targetObjects } = makeFixture();
  targetObjects[targetObjects.length - 1].removeFromParent();

  const result = prepareM5AZ2SystemReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(12);
  expect(result.missingTargetKeys).toEqual(['boundary:PVK_PARKING']);
  expect(result.semanticViolationCount).toBe(0);
});
