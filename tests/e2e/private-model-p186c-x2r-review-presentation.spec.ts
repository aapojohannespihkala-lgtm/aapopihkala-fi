import { expect, test } from '@playwright/test';

import {
  p186cX2rContextG2Ids,
  p186cX2rExpectedComponents,
  p186cX2rExpectedSourceFragmentCount,
  p186cX2rFloorHeatingSourcePdfDriveId,
  p186cX2rReviewContextOpacity,
  p186cX2rReviewQuestionText,
  p186cX2rReviewSourceContext,
  p186cX2rReviewTargetOpacity,
  prepareP186cX2rFloorHeatingReviewPresentation,
} from '../../src/scripts/privateModelP186CX2RReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeMaterial = () => new THREE.MeshStandardMaterial({ color: 0xffffff });

const makeTarget = (
  partition: keyof typeof p186cX2rExpectedComponents,
  position: [number, number, number],
) => {
  const expected = p186cX2rExpectedComponents[partition];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.4), makeMaterial());
  mesh.position.set(...position);
  mesh.userData = {
    Pass: 'P186C-X2R',
    ModelStage: 'WORK_TEST_GEOMETRY',
    Canonical: false,
    canonical: false,
    presentationOnly: true,
    workAssumption: true,
    coordinateSystem: 'YLIS-G1-LOCAL',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'floorHeatingCableWorkRouteProxy',
    sourcePdfDriveId: p186cX2rFloorHeatingSourcePdfDriveId,
    sourcePlanXYRole: 'HISTORICAL_2015_ROUTE_GUIDE',
    sourceFragmentPartition: partition,
    sourceFragmentCount: expected.sourceFragmentCount,
    sourcePlanLineWidthM: 0.012,
    finishedFloorZM: 0,
    workZRangeM: [-0.03, -0.02],
    workCenterDepthM: 0.025,
    proxyThicknessM: 0.01,
    refinable: true,
    floorHeatingCableGeometryClaim: false,
    closedHeatingZoneClaim: false,
    physicalCableRouteClaim: false,
    continuousCableTopologyClaim: false,
    exactCurrentXYClaim: false,
    exactZClaim: false,
    currentGeometryClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
    sourceCableType: expected.sourceCableType,
    sourcePowerW: expected.sourcePowerW,
    sourceSstl: expected.sourceSstl,
    sourceInstallSpacingCm: expected.sourceInstallSpacingCm,
    derivedGroupKey: expected.derivedGroupKey,
    derivedGroupName: expected.derivedGroupName,
    derivedGroupBindingAuthority:
      'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
  };
  return mesh;
};

const makeContext = (g2Id: string, index: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 1.2), makeMaterial());
  mesh.position.set((index % 3) * 1.8, -0.2, Math.floor(index / 3) * 1.5);
  mesh.userData = {
    G2Id: g2Id,
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  };
  return mesh;
};

const makeFixture = () => {
  const scene = new THREE.Group();
  const targets = [
    makeTarget('A', [0, 0, 0]),
    makeTarget('B', [2, 0, 0]),
    makeTarget('C', [4, 0, 0]),
  ];
  const contexts = p186cX2rContextG2Ids.map(makeContext);
  const distractor = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), makeMaterial());
  distractor.position.set(8, 0, 0);
  distractor.userData = {
    G2Id: 'G2_UNRELATED_D2F_CONTEXT',
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  };
  scene.add(...targets, ...contexts, distractor);
  scene.updateMatrixWorld(true);
  return { scene, targets, contexts, distractor };
};

test('P186C-X2R bounded review isolates exactly A/B/C and six D1F source-room contexts at 80/20', () => {
  const { scene, targets, contexts, distractor } = makeFixture();
  const result = prepareP186cX2rFloorHeatingReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(3);
  expect(result.expectedTargetRenderableCount).toBe(3);
  expect(result.missingTargetComponents).toEqual([]);
  expect(result.foundTargetComponents).toEqual({ A: 1, B: 1, C: 1 });
  expect(result.sourceFragmentCount).toBe(p186cX2rExpectedSourceFragmentCount);
  expect(result.expectedSourceFragmentCount).toBe(366);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.contextRenderableCount).toBe(6);
  expect(result.expectedContextRenderableCount).toBe(6);
  expect(result.missingContextG2Ids).toEqual([]);
  expect(result.foundContextG2Ids).toEqual([...p186cX2rContextG2Ids].sort());
  expect(result.hiddenNonQuestionRenderableCount).toBe(1);
  expect(result.targetBounds).not.toBeNull();

  for (const target of targets) {
    expect(target.visible).toBe(true);
    expect((target.material as THREE.Material & { opacity: number }).opacity).toBe(
      p186cX2rReviewTargetOpacity,
    );
    expect(target.userData.p186cX2rReviewRole).toBe('QUESTION_TARGET_80');
  }

  for (const context of contexts) {
    expect(context.visible).toBe(true);
    expect((context.material as THREE.Material & { opacity: number }).opacity).toBe(
      p186cX2rReviewContextOpacity,
    );
    expect(context.userData.p186cX2rReviewRole).toBe(
      'D_1F_SOURCE_ROOM_CONTEXT_20',
    );
  }

  expect(distractor.visible).toBe(false);
  expect(distractor.userData.p186cX2rReviewRole).toBe(
    'NON_QUESTION_CONTEXT_SUPPRESSED',
  );
});

test('P186C-X2R review contract preserves source and no-promotion boundaries', () => {
  expect(p186cX2rReviewSourceContext.sourceHref).toContain(
    p186cX2rFloorHeatingSourcePdfDriveId,
  );
  expect(p186cX2rReviewSourceContext.sourceRole).toBe(
    'HISTORICAL_2015_ROUTE_GUIDE',
  );
  expect(p186cX2rReviewSourceContext.limit).toContain('Ei fyysinen nykykaapelireitti');
  expect(p186cX2rReviewQuestionText).toContain('WORK_TEST-reittiproxyt A/B/C');
  expect(p186cX2rReviewQuestionText).toContain('fyysisiksi nykykaapelireiteiksi');
  expect(p186cX2rExpectedComponents).toEqual({
    A: {
      sourceFragmentCount: 126,
      derivedGroupKey: '10.3',
      derivedGroupName: 'makuuhuone',
      sourceCableType: 'DEVI DTIP-10 120M',
      sourcePowerW: 1200,
      sourceSstl: '8169441',
      sourceInstallSpacingCm: 11,
    },
    B: {
      sourceFragmentCount: 116,
      derivedGroupKey: '10.1',
      derivedGroupName: 'eteinen',
      sourceCableType: 'DEVI DTIP-10 140M',
      sourcePowerW: 1400,
      sourceSstl: '8169445',
      sourceInstallSpacingCm: 10,
    },
    C: {
      sourceFragmentCount: 124,
      derivedGroupKey: '10.2',
      derivedGroupName: 'pesuhuone/sauna',
      sourceCableType: 'DEVI DTIP-10 100M',
      sourcePowerW: 1000,
      sourceSstl: '8169439',
      sourceInstallSpacingCm: 10,
    },
  });
});

test('P186C-X2R review rejects promotion-like semantics and source-fragment drift', () => {
  const { scene, targets } = makeFixture();
  targets[1].userData.currentGeometryClaim = true;
  targets[2].userData.sourceFragmentCount = 123;

  const result = prepareP186cX2rFloorHeatingReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(3);
  expect(result.missingTargetComponents).toEqual([]);
  expect(result.sourceFragmentCount).toBe(365);
  expect(result.semanticViolationCount).toBe(2);
});

test('P186C-X2R review requires the exact six 2015 D1F room-context footprints', () => {
  const { scene, contexts } = makeFixture();
  contexts[0].userData.G2Id = 'G2_D15_SPACE_WRONG_1F_SRC';

  const result = prepareP186cX2rFloorHeatingReviewPresentation(scene);

  expect(result.contextRenderableCount).toBe(5);
  expect(result.missingContextG2Ids).toEqual(['G2_D15_SPACE_SAUNA_1F_SRC']);
});
