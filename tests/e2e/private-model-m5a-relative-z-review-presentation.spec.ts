import { expect, test } from '@playwright/test';

import {
  m5aRelativeZReviewContextOpacity,
  m5aRelativeZReviewTargetOpacity,
  m5aSok1Sok2ExpectedVerticalDeltaM,
  m5aSok1Sok2ReviewCamera,
  m5aSok1Sok2ReviewQuestionText,
  prepareM5ASok1Sok2RelativeZReviewPresentation,
} from '../../src/scripts/privateModelM5ARelativeZReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeMaterial = () => new THREE.MeshBasicMaterial({ opacity: 1 });

const commonNoPromotion = {
  Pass: 'M5A-R3-Z1C',
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
};

const makeWell = (id: string, localPosition: [number, number, number]) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), makeMaterial());
  mesh.position.set(...localPosition);
  mesh.userData = {
    ...commonNoPromotion,
    G2IdCandidate: id,
    representationKind: 'wellMarkerWork',
    physicalWellGeometryClaim: false,
  };
  return mesh;
};

const makeRoute = () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(26.9, 0.08, 0.08), makeMaterial());
  mesh.userData = {
    ...commonNoPromotion,
    G2IdCandidate: 'G2_DRAIN_LINK_SOK1_SOK2_001',
    representationKind: 'referenceRouteWork',
    physicalRouteClaim: false,
    relativeZRole:
      'HIGH_CONFIDENCE_DERIVED_SOURCE_LOCAL_DATUM_BRIDGE_PRESENTATION_PROFILE',
    sourceLocalRelativeZ: true,
    sourceRelativeZPlusSplitLevelDeltaM: 1.14,
    sourceLocalDatumBridgeM: 1,
    exactSlopeClaim: false,
  };
  return mesh;
};

const makeFixture = () => {
  const scene = new THREE.Group();
  const axisRoot = new THREE.Group();
  axisRoot.rotation.x = -Math.PI / 2;
  scene.add(axisRoot);

  const sok1 = makeWell('G2_DRAIN_WELL_SOK1_001', [26.15, -0.75, -1.08680108]);
  const sok2 = makeWell('G2_DRAIN_WELL_SOK2_001', [-0.75, -0.75, 0.05319892]);
  const route = makeRoute();
  route.position.set(12.7, -0.75, (-1.08680108 + 0.05319892) / 2);
  axisRoot.add(sok1, sok2, route);

  const context = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 14), makeMaterial());
  context.position.set(12.7, -2.5, 5.4);
  context.userData = { G2Id: 'G2_BUILDING_CONTEXT_RELATIVE_Z_TEST' };
  axisRoot.add(context);
  scene.updateMatrixWorld(true);

  return { scene, sok1, sok2, route, context };
};

test('SOK1-SOK2 relative-Z helper isolates the exact 3 targets and preserves 80/20 no-promotion presentation', () => {
  const { scene, sok1, sok2, route, context } = makeFixture();
  const result = prepareM5ASok1Sok2RelativeZReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(3);
  expect(result.expectedTargetRenderableCount).toBe(3);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.targetBounds).not.toBeNull();

  for (const target of [sok1, sok2, route]) {
    expect((target.material as THREE.Material & { opacity: number }).opacity).toBe(
      m5aRelativeZReviewTargetOpacity,
    );
    expect(target.userData.m5aRelativeZReviewRole).toBe('QUESTION_TARGET_80');
  }
  expect((context.material as THREE.Material & { opacity: number }).opacity).toBe(
    m5aRelativeZReviewContextOpacity,
  );
  expect(context.userData.m5aRelativeZReviewRole).toBe('BUILDING_DRAINAGE_CONTEXT_20');
});

test('SOK1-SOK2 exact Z1C source-profile fixture resolves to a 1.140 m world vertical delta after the Babylon axis root', () => {
  const { scene } = makeFixture();
  const result = prepareM5ASok1Sok2RelativeZReviewPresentation(scene);

  expect(result.worldVerticalDeltaM).not.toBeNull();
  expect(result.worldVerticalDeltaM ?? 0).toBeCloseTo(m5aSok1Sok2ExpectedVerticalDeltaM, 6);
  expect(result.routeMetadataDeltaM).toBe(m5aSok1Sok2ExpectedVerticalDeltaM);
  expect(result.verticalDeltaErrorM ?? 1).toBeLessThanOrEqual(0.005);
  expect(result.verticalDeltaParity).toBe(true);
});

test('relative-Z review contract selects semantic +Y orthographic elevation so +X is horizontal and +Z vertical', () => {
  expect(m5aSok1Sok2ReviewCamera).toEqual({
    standardViewPreset: 'elev-pos-y',
    coordinateFrame: 'YLIS-G1-LOCAL',
    horizontalAxis: '+X',
    verticalAxis: '+Z',
    viewAxis: '+Y',
    projection: 'ORTHOGRAPHIC',
  });
  expect(m5aSok1Sok2ReviewQuestionText).toContain('1,14 m');
  expect(m5aSok1Sok2ReviewQuestionText).toContain('HIGH_CONFIDENCE_DERIVED');
  expect(m5aSok1Sok2ReviewQuestionText).toContain('exact-Z');
});

test('relative-Z helper rejects promotion-like semantics and wrong route delta', () => {
  const { scene, route } = makeFixture();
  route.userData.currentGeometryClaim = true;
  route.userData.sourceRelativeZPlusSplitLevelDeltaM = 1.2;

  const result = prepareM5ASok1Sok2RelativeZReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(3);
  expect(result.semanticViolationCount).toBe(1);
  expect(result.routeMetadataDeltaM).toBe(1.2);
  expect(result.verticalDeltaParity).toBe(false);
});
