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
  m5bCurrentRouteStubContextIds,
  m5bCurrentTargetIds,
  m5bCurrentTargetMeaningById,
  m5bPlannedSok2ReviewQuestionScope,
  m5bPlannedSok2TargetIds,
  m5bPlannedSok2TargetMeaningById,
  m5bReviewContextOpacity,
  m5bReviewTargetOpacity,
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

const findDerivedDownspoutMarkers = (root: any) =>
  root.children.filter(
    (child: any) => child?.userData?.m5bVerticalDownspoutMarkerDerived === true,
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

test('M5B current review uses scene60 and creates five vertical downspout targets', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentRouteStubContextIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubContextIds[1]);
  const planned = makeRoute(m5bPlannedSok2TargetIds[0], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const context = makeRoute('BUILDING_CONTEXT');
  root.add(current1, current2, planned, context);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');
  const markers = findDerivedDownspoutMarkers(root);

  expect(getM5BReviewSceneIndex('CURRENT')).toBe(60);
  expect(markers).toHaveLength(5);
  expect(result.targetRenderableCount).toBe(5);
  expect(result.foundTargetIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.questionScope).toBe(m5bCurrentReviewQuestionScope);
  expect(result.questionScope).toContain('pystysuuntaisten');
  expect(result.questionScope).toContain('ei kuulu tähän kysymykseen');
  expect(result.downspoutContext).toBe(m5bCurrentDownspoutContext);
  expect(result.targetMeanings).toEqual(
    m5bCurrentTargetIds.map((id) => m5bCurrentTargetMeaningById[id]),
  );
  expect(markers[0].userData.m5bReviewRole).toBe('QUESTION_TARGET_80');
  expect(markers[0].userData.m5bReviewContentStatus).toBe(
    'VERTICAL_DOWNSPOUT_LOCATION_REVIEW_ONLY',
  );
  expect((markers[0] as any).material.opacity).toBe(m5bReviewTargetOpacity);
  expect(current1.userData.m5bReviewRole).toBe('CURRENT_ROUTE_STUB_CONTEXT_20');
  expect(current2.userData.m5bReviewRole).toBe('CURRENT_ROUTE_STUB_CONTEXT_20');
  expect((current1.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(current1.userData.m5bReviewMeaning).toContain('ei tämän katselukysymyksen varsinainen target');
  expect(planned.visible).toBe(false);
  expect((context.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect(context.userData.m5bReviewContentStatus).toBe('CLARITY_CONTEXT_20');
});

test('M5B current review demotes persisted route candidates to context and still creates vertical targets', () => {
  const root = new THREE.Group();
  const current1 = makeRoute('ROUTE_STUB_CONTEXT_1', {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentRouteStubContextIds[0],
  });
  const current2 = makeRoute('ROUTE_STUB_CONTEXT_2', {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentRouteStubContextIds[1],
  });
  root.add(current1, current2);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');
  const markers = findDerivedDownspoutMarkers(root);

  expect(markers).toHaveLength(5);
  expect(result.targetRenderableCount).toBe(5);
  expect(result.foundTargetIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.downspoutContext).toBe(m5bCurrentDownspoutContext);
  expect(result.targetMeanings).toEqual(
    m5bCurrentTargetIds.map((id) => m5bCurrentTargetMeaningById[id]),
  );
  expect(current1.userData.m5bReviewRole).toBe('CURRENT_ROUTE_STUB_CONTEXT_20');
  expect(current2.userData.m5bReviewRole).toBe('CURRENT_ROUTE_STUB_CONTEXT_20');
  expect((current1.material as any).opacity).toBe(m5bReviewContextOpacity);
  expect((current2.material as any).opacity).toBe(m5bReviewContextOpacity);
});

test('M5B Z2R raw scene61 source-bound SOK1 context receives specific 20-percent role', () => {
  // GLB scene61 node 1101 uses presentationRole + sourceG2IdCandidate,
  // not G2Id/G2IdCandidate. This is context, not an additional current target.
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
    sourceG2IdCandidate: m5bCurrentRouteStubContextIds[0],
    presentationRole: 'CURRENT_SOK1_COMPARISON_CONTEXT',
    presentationOnlyComparison: true,
    currentStateEvidence: false,
  });
  const unrelatedContext = makeRoute('UNRELATED_BUILDING_CONTEXT', {
    G2Id: undefined,
    G2IdCandidate: undefined,
    sourceG2IdCandidate: m5bCurrentRouteStubContextIds[0],
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
  const current1 = makeRoute(m5bCurrentRouteStubContextIds[0]);
  const current2 = makeRoute(m5bCurrentRouteStubContextIds[1]);
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
