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
  m5bCurrentTargetIds,
  m5bPlannedSok2TargetIds,
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

test('M5B registry and explicit review aliases resolve exact persisted candidate', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[m5bCandidateId]).toEqual({
    driveFileId: '1gbF7fElI5WhgsuAA9V1GKAXPAWrJyo9P',
  });
  expect(getRequestedReviewCandidateId(`?review=${m5bCurrentReviewId}`)).toBe(m5bCandidateId);
  expect(
    getRequestedReviewCandidateId(`?review=${m5bPlannedSok2ComparisonReviewId}`),
  ).toBe(m5bCandidateId);
});

test('M5B current review uses scene56 and only current SOK1/SOK2 routes as targets', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentTargetIds[0]);
  const current2 = makeRoute(m5bCurrentTargetIds[1]);
  const planned = makeRoute(m5bPlannedSok2TargetIds[0], {
    planned: true, ordered: false, implemented: false, current: false,
    presentationOnlyComparison: true,
  });
  const context = makeRoute('BUILDING_CONTEXT');
  root.add(current1, current2, planned, context);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');

  expect(getM5BReviewSceneIndex('CURRENT')).toBe(56);
  expect(result.targetRenderableCount).toBe(2);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect((current1.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect((current2.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect(planned.visible).toBe(false);
  expect((context.material as any).opacity).toBe(m5bReviewContextOpacity);
});

test('M5B current review resolves persisted G2IdCandidate target identity', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentTargetIds[0], {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentTargetIds[0],
  });
  const current2 = makeRoute(m5bCurrentTargetIds[1], {
    G2Id: undefined,
    G2IdCandidate: m5bCurrentTargetIds[1],
  });
  root.add(current1, current2);

  const result = prepareM5BReviewPresentation(root, 'CURRENT');

  expect(result.targetRenderableCount).toBe(2);
  expect(result.foundTargetIds).toEqual([...m5bCurrentTargetIds]);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect((current1.material as any).opacity).toBe(m5bReviewTargetOpacity);
  expect((current2.material as any).opacity).toBe(m5bReviewTargetOpacity);
});

test('M5B planned comparison uses scene57, planned SOK2 targets, current SOK1 context and no current SOK2', () => {
  const root = new THREE.Group();
  const current1 = makeRoute(m5bCurrentTargetIds[0]);
  const current2 = makeRoute(m5bCurrentTargetIds[1]);
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

  expect(getM5BReviewSceneIndex('PLANNED_SOK2_COMPARISON')).toBe(57);
  expect(result.targetRenderableCount).toBe(2);
  expect(result.missingTargetIds).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
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
