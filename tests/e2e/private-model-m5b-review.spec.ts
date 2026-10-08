import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  m5bCandidateId,
  m5bCurrentReviewId,
  m5bPlannedSok2ComparisonReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  getM5BReviewSceneIndex,
  m5bCurrentDownspoutContext,
  m5bCurrentReviewQuestionScope,
  m5bCurrentRouteStubIds,
  m5bCurrentTargetIds,
  m5bCurrentVerticalDownspoutProxyIds,
  m5bCurrentVerticalDownspoutProxyMeaningById,
  m5bCurrentVerticalDownspoutReviewScope,
  m5bPlannedSok2ReviewQuestionScope,
  m5bPlannedSok2TargetIds,
  m5bPlannedSok2TargetMeaningById,
  m5bReviewContextOpacity,
  m5bReviewTargetOpacity,
  m5bVerticalDownspoutProxyRadius,
  m5bVerticalDownspoutProxyWallOffset,
  m5bVerticalDownspoutShortFacadeLateralFix,
  m5bVerticalDownspoutShortFacadeLateralInsetRatio,
  m5bVerticalDownspoutWallAttachmentFix,
  m5bVerticalDownspoutWallAttachmentOffset,
  m5bVerticalDownspoutWallSkinInsetMinM,
  prepareM5BReviewPresentation,
} from '../../src/scripts/privateModelM5BReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeRoute = (id: string, extra: Record<string, unknown> = {}) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 1),
    new THREE.MeshBasicMaterial({ color: 0x668899 }),
  );
  mesh.name = id;
  mesh.userData = {
    G2Id: id,
    presentationOnly: true,
    workAssumption: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalRouteClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    Canonical: false,
    publishToCURRENT: false,
    ...extra,
  };
  return mesh;
};

const makeBuildingContext = () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0xcccccc }),
  );
  mesh.name = 'M5B_BUILDING_WALL_CONTEXT';
  mesh.position.set(0, 2, 0);
  mesh.userData = { role: 'building-wall-context' };
  return mesh;
};

const makeRoofOverhangContext = () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(12, 1, 10),
    new THREE.MeshBasicMaterial({ color: 0xbbbbbb }),
  );
  mesh.name = 'M5B_ROOF_EAVE_CONTEXT';
  mesh.position.set(0, 4.5, 0);
  mesh.userData = { role: 'roof-eave-context' };
  return mesh;
};

const makeLargeReviewFootprintContext = () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(60, 3, 60),
    new THREE.MeshBasicMaterial({ color: 0x999999 }),
  );
  mesh.name = 'M5B_REVIEW_FOOTPRINT_CONTEXT_HELPER';
  mesh.position.set(40, 1.5, 40);
  mesh.userData = { role: 'review-footprint-helper' };
  return mesh;
};

const currentProxyMeanings = () =>
  m5bCurrentVerticalDownspoutProxyIds.map(
    (id) => m5bCurrentVerticalDownspoutProxyMeaningById[id],
  );

test('M5B registry and explicit review aliases resolve exact persisted candidate', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[m5bCandidateId]).toEqual({
    driveFileId: '1U2qEo0vP5VdRRwdJmugH-XOq5h-4TUBI',
  });
  expect(getRequestedReviewCandidateId(`?review=${m5bCurrentReviewId}`)).toBe(m5bCandidateId);
  expect(
    getRequestedReviewCandidateId(`?review=${m5bPlannedSok2ComparisonReviewId}`),
  ).toBe(m5bCandidateId);
});

test('M5B current review uses scene60 and five vertical downspout proxies as targets', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentRouteStubIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubIds[1]);
  const planned = makeRoute(m5bPlannedSok2TargetIds[0], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const building = makeBuildingContext();
  root.add(current1, current2, planned, building);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');
  const proxies = root.children.filter(
    (child: any) => child.userData?.m5bReviewRole === 'VERTICAL_DOWNSPOUT_PROXY_80',
  );

  expect(getM5BReviewSceneIndex('CURRENT')).toBe(60);
  expect(result.targetRenderableCount).toBe(5);
  expect(result.verticalDownspoutProxyCount).toBe(5);
  expect(result.verticalDownspoutProxyIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.foundTargetIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.buildingBoundsContributorCount).toBeGreaterThan(0);
  expect(result.wallEnvelopeContributorCount).toBeGreaterThan(0);
  expect(result.shortFacadeLateralFix).toBe(m5bVerticalDownspoutShortFacadeLateralFix);
  expect(result.wallAttachmentFix).toBe(m5bVerticalDownspoutWallAttachmentFix);
  expect(result.questionScope).toBe(m5bCurrentReviewQuestionScope);
  expect(result.verticalDownspoutReviewScope).toBe(m5bCurrentVerticalDownspoutReviewScope);
  expect(result.downspoutContext).toBe(m5bCurrentDownspoutContext);
  expect(result.targetMeanings).toEqual(currentProxyMeanings());
  expect(proxies).toHaveLength(5);
  expect((proxies[0] as any).material.opacity).toBe(m5bReviewTargetOpacity);
  expect((proxies[0] as any).userData.m5bReviewMeaning).toContain('Pystysuuntainen syöksyränni-proxy');
  expect((proxies[0] as any).userData.m5bReviewShortFacadeLateralFix).toBe(
    m5bVerticalDownspoutShortFacadeLateralFix,
  );
  expect((proxies[0] as any).userData.m5bReviewWallAttachmentFix).toBe(
    m5bVerticalDownspoutWallAttachmentFix,
  );
  expect((proxies[0] as any).userData.exactXYClaim).toBe(false);
  expect((proxies[0] as any).userData.exactZClaim).toBe(false);
  expect((proxies[0] as any).userData.currentGeometryClaim).toBe(false);
  expect(current1.visible).toBe(false);
  expect(current1.userData.m5bReviewRole).toBe('OLD_ROUTE_STUB_SUPPRESSED_FOR_VERTICAL_DOWNSPOUT_REVIEW');
  expect(current2.visible).toBe(false);
  expect(result.suppressedNonQuestionRouteCount).toBe(2);
  expect(planned.visible).toBe(false);
  expect((building.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(building.userData.m5bReviewContentStatus).toBe('CLARITY_CONTEXT_20');
});

test('M5B current review anchors downspout proxies to building context, not broad review footprints', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentRouteStubIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubIds[1]);
  const building = makeBuildingContext();
  const broadFootprint = makeLargeReviewFootprintContext();
  root.add(current1, current2, building, broadFootprint);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');
  const proxies = root.children.filter(
    (child: any) => child.userData?.m5bReviewRole === 'VERTICAL_DOWNSPOUT_PROXY_80',
  );
  const maxAllowedX = 5 + m5bVerticalDownspoutProxyWallOffset + 0.001;
  const maxAllowedZ = 4 + m5bVerticalDownspoutProxyWallOffset + 0.001;

  expect(result.targetRenderableCount).toBe(5);
  expect(result.verticalDownspoutProxyCount).toBe(5);
  expect(result.wallEnvelopeContributorCount).toBe(1);
  expect(proxies).toHaveLength(5);
  for (const proxy of proxies) {
    expect(Math.abs(proxy.position.x)).toBeLessThanOrEqual(maxAllowedX);
    expect(Math.abs(proxy.position.z)).toBeLessThanOrEqual(maxAllowedZ);
    expect((proxy as any).userData.m5bReviewWallBoundsFix).toBe(
      'R1077_FILTERED_BUILDING_WALL_BOUNDS',
    );
  }
  expect((broadFootprint.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(broadFootprint.userData.m5bReviewContentStatus).toBe('CLARITY_CONTEXT_20');
});

test('M5B current review puts short-facade corner proxies inside wall skin and under the roof/eave', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentRouteStubIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubIds[1]);
  const building = makeBuildingContext();
  const roofOverhang = makeRoofOverhangContext();
  root.add(current1, current2, building, roofOverhang);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');
  const proxies = root.children.filter(
    (child: any) => child.userData?.m5bReviewRole === 'VERTICAL_DOWNSPOUT_PROXY_80',
  );
  const cornerProxies = proxies.filter((proxy: any) =>
    String(proxy.userData?.G2Id ?? '').includes('_CORNER_'),
  );
  const southFacadeProxy = proxies.find(
    (proxy: any) => proxy.userData?.G2Id === 'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B',
  );
  const expectedInset = 8 * m5bVerticalDownspoutShortFacadeLateralInsetRatio;
  const expectedWallSkinInset = Math.max(m5bVerticalDownspoutWallSkinInsetMinM, 8 * 0.015);

  expect(result.shortFacadeLateralFix).toBe(m5bVerticalDownspoutShortFacadeLateralFix);
  expect(result.wallAttachmentFix).toBe(m5bVerticalDownspoutWallAttachmentFix);
  expect(result.shortFacadeLateralInsetM).toBeCloseTo(expectedInset, 6);
  expect(result.wallSkinInsetM).toBeCloseTo(expectedWallSkinInset, 6);
  expect(result.wallAttachedCount).toBe(4);
  expect(result.wallEnvelopeContributorCount).toBe(1);
  expect(result.buildingBoundsContributorCount).toBe(2);
  expect(cornerProxies).toHaveLength(4);
  for (const proxy of cornerProxies) {
    const halfHeight = ((proxy as any).geometry.parameters.height ?? 0) / 2;
    expect(Math.abs(proxy.position.x)).toBeCloseTo(5 - expectedWallSkinInset, 6);
    expect(Math.abs(proxy.position.x)).toBeLessThan(5);
    expect(Math.abs(proxy.position.z)).toBeCloseTo(4 - expectedInset, 6);
    expect(Math.abs(proxy.position.z)).toBeLessThan(4);
    expect(proxy.position.y + halfHeight).toBeLessThan(4);
    expect((proxy as any).userData.m5bReviewShortFacadeLateralFix).toBe(
      m5bVerticalDownspoutShortFacadeLateralFix,
    );
    expect((proxy as any).userData.m5bReviewWallAttachmentFix).toBe(
      m5bVerticalDownspoutWallAttachmentFix,
    );
    expect((proxy as any).userData.m5bVerticalProxyWallAttachmentOffsetM).toBe(
      m5bVerticalDownspoutWallAttachmentOffset,
    );
    expect((proxy as any).userData.m5bVerticalProxyWallSkinInsetM).toBeCloseTo(
      expectedWallSkinInset,
      6,
    );
    expect((proxy as any).userData.m5bVerticalProxyWallAttached).toBe(true);
    expect((proxy as any).userData.m5bVerticalProxyEaveUnderRoof).toBe(true);
    expect((proxy as any).userData.m5bVerticalProxyShortFacadeLateralInsetM).toBeCloseTo(
      expectedInset,
      6,
    );
  }
  expect(southFacadeProxy?.position.z).toBeCloseTo(-4 - m5bVerticalDownspoutProxyWallOffset, 6);
  expect((southFacadeProxy as any).userData.m5bVerticalProxyShortFacadeLateralInsetM).toBe(0);
  expect((roofOverhang.material as any).opacity).toBe(m5bReviewContextOpacity);
});

test('M5B current review suppresses persisted route-stub G2IdCandidate targets in vertical-location review', () => {
  const root = new THREE.Group();
  const current1 = makeRoute('RAW_ROUTE_STUB_1', {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentRouteStubIds[0],
  });
  const current2 = makeRoute('RAW_ROUTE_STUB_2', {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentRouteStubIds[1],
  });
  const building = makeBuildingContext();
  root.add(current1, current2, building);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');

  expect(result.targetRenderableCount).toBe(5);
  expect(result.foundTargetIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.downspoutContext).toBe(m5bCurrentDownspoutContext);
  expect(result.targetMeanings).toEqual(currentProxyMeanings());
  expect(result.sourceRouteStubIds).toEqual([...m5bCurrentRouteStubIds]);
  expect(current1.visible).toBe(false);
  expect(current2.visible).toBe(false);
  expect(result.suppressedNonQuestionRouteCount).toBe(2);
});

test('M5B Z2R raw scene61 source-bound SOK1 context receives specific 20-percent role', () => {
  const root = new THREE.Group();
  const planned1 = makeRoute(m5bPlannedSok2TargetIds[0], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const planned2 = makeRoute(m5bPlannedSok2TargetIds[1], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const sok1Context = makeRoute('SOK1_CONTEXT_SOURCE_BOUND', {
    G2Id: undefined,
    G2IdCandidate: undefined,
    sourceG2IdCandidate: m5bCurrentRouteStubIds[0],
    presentationRole: 'CURRENT_SOK1_COMPARISON_CONTEXT',
    presentationOnlyComparison: true,
    currentStateEvidence: false,
  });
  const unrelatedContext = makeRoute('UNRELATED_BUILDING_CONTEXT', {
    G2Id: undefined,
    G2IdCandidate: undefined,
    sourceG2IdCandidate: m5bCurrentRouteStubIds[0],
    presentationOnlyComparison: true,
  });
  root.add(planned1, planned2, sok1Context, unrelatedContext);

  const result = prepareM5BReviewPresentation(root, 'PLANNED_SOK2_COMPARISON');

  expect(result.targetRenderableCount).toBe(2);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.questionScope).toBe(m5bPlannedSok2ReviewQuestionScope);
  expect(result.downspoutContext).toContain('5 syöksyränniä');
  expect(result.targetMeanings).toEqual([
    m5bPlannedSok2TargetMeaningById[m5bPlannedSok2TargetIds[0]],
    m5bPlannedSok2TargetMeaningById[m5bPlannedSok2TargetIds[1]],
  ]);
  expect(result.contextRenderableCount).toBe(2);
  expect(sok1Context.userData.m5bReviewRole).toBe('CURRENT_SOK1_COMPARISON_CONTEXT_20');
  expect((sok1Context.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(sok1Context.visible).toBe(true);
  expect(unrelatedContext.userData.m5bReviewRole).toBe('BUILDING_CONTEXT_20');
  expect((unrelatedContext.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect((planned1.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect((planned2.material as any).opacity).toBe(m5bReviewTargetOpacity);
});

test('M5B planned comparison uses scene61, planned SOK2 targets, current SOK1 context and no current SOK2', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentRouteStubIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubIds[1]);
  const planned1 = makeRoute(m5bPlannedSok2TargetIds[0], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const planned2 = makeRoute(m5bPlannedSok2TargetIds[1], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  root.add(current1, current2, planned1, planned2);

  const result = prepareM5BReviewPresentation(root, 'PLANNED_SOK2_COMPARISON');

  expect(getM5BReviewSceneIndex('PLANNED_SOK2_COMPARISON')).toBe(61);
  expect(result.targetRenderableCount).toBe(2);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.downspoutContext).toContain('5 syöksyränniä');
  expect(result.targetMeanings).toHaveLength(2);
  expect((planned1.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect((planned2.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect((current1.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(current1.userData.m5bReviewRole).toBe('CURRENT_SOK1_COMPARISON_CONTEXT_20');
  expect(current2.visible).toBe(false);
  expect(planned1.userData.planned).toBe(true);
  expect(planned1.userData.ordered).toBe(false);
  expect(planned1.userData.implemented).toBe(false);
  expect(planned1.userData.current).toBe(false);
  expect(planned1.userData.presentationOnlyComparison).toBe(true);
});
