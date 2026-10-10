import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  m5aR1115ReviewContextOpacity,
  m5aR1115ReviewQuestionScope,
  m5aR1115ReviewTargetIds,
  m5aR1115ReviewTargetOpacity,
  m5aR1115SceneIndex,
  m5aR1115ViewerMarkerScale,
  prepareM5AR1115PlannedRaiseReviewPresentation,
  m5aZ2ExpectedTargetKeys,
  m5aZ2ReviewCamera,
  m5aZ2ReviewContextOpacity,
  m5aZ2ReviewQuestionText,
  m5aZ2ReviewTargetOpacity,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import { createM5AR1115ReviewRuntimeState } from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const reviewUrl = new URL(`https://aapopihkala.fi/private-model/?review=${reviewId}`);

const m5aZ2CommonNoPromotionUserData = {
  Pass: 'M5A-Z2',
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
  absoluteZContract: 'G2_R896',
  absoluteZBasis: 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE',
} as const;

const createRenderableMesh = (userData: Record<string, unknown>) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  mesh.userData = { ...userData };
  return mesh;
};

test('M5A-Z2D R1090 presentation contract targets the next render-visibility gate', () => {
  expect(reviewUrl.href).toBe(
    'https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review',
  );
  expect(reviewUrl.searchParams.get('review')).toBe(reviewId);

  expect(m5aZ2ReviewQuestionText).toContain('4 kaivoa');
  expect(m5aZ2ReviewQuestionText).toContain('7 reittiä');
  expect(m5aZ2ReviewQuestionText).toContain('2 ratkaisemattoman rajan markkeria');
  expect(m5aZ2ReviewQuestionText).toContain('HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE');
  expect(m5aZ2ReviewQuestionText).toContain('exact-Z- tai as-built-väite');
});

test('M5A-Z2D R1090 presentation contract keeps the target/context visibility hierarchy explicit', () => {
  expect(m5aZ2ReviewTargetOpacity).toBe(0.8);
  expect(m5aZ2ReviewContextOpacity).toBe(0.2);
  expect(m5aZ2ReviewCamera).toMatchObject({
    coordinateFrame: 'YLIS-G1-LOCAL',
    projection: 'PERSPECTIVE',
    controls: 'FREE_ORBIT',
    framing: 'TARGET_BOUNDS',
  });

  const wellTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('G2_DRAIN_WELL_'),
  );
  const routeTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('G2_DRAIN_LINK_'),
  );
  const boundaryTargets = m5aZ2ExpectedTargetKeys.filter((key) =>
    key.startsWith('boundary:'),
  );

  expect(m5aZ2ExpectedTargetKeys).toHaveLength(13);
  expect(new Set(m5aZ2ExpectedTargetKeys).size).toBe(m5aZ2ExpectedTargetKeys.length);
  expect(wellTargets).toHaveLength(4);
  expect(routeTargets).toHaveLength(7);
  expect(boundaryTargets).toHaveLength(2);
});

test('M5A-Z2D R1090 empty-scene presentation readback keeps source limits visible', () => {
  const presentation = prepareM5AZ2SystemReviewPresentation({
    updateMatrixWorld: () => undefined,
    traverse: () => undefined,
  });

  expect(presentation.expectedTargetRenderableCount).toBe(m5aZ2ExpectedTargetKeys.length);
  expect(presentation.missingTargetKeys).toEqual([...m5aZ2ExpectedTargetKeys]);
  expect(presentation.reviewQuestionText).toBe(m5aZ2ReviewQuestionText);
  expect(presentation.reviewCamera).toBe(m5aZ2ReviewCamera);
  expect(presentation.sourceClassification).toBe(
    'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE / WORK_TEST / NOT_EXACT_Z / NOT_AS_BUILT',
  );
});

test('M5A-Z2D R1090 presentation mutates renderable targets and context into the review hierarchy', () => {
  const target = createRenderableMesh({
    ...m5aZ2CommonNoPromotionUserData,
    G2IdCandidate: 'G2_DRAIN_WELL_SOK1_001',
    representationKind: 'wellMarkerWork',
    physicalWellGeometryClaim: false,
  });
  const context = createRenderableMesh({
    Pass: 'M2',
    G2IdCandidate: 'G2_BUILDING_CONTEXT_001',
  });
  const root = new THREE.Group();
  root.add(target);
  root.add(context);

  const presentation = prepareM5AZ2SystemReviewPresentation(root);
  const targetMaterial = target.material as any;
  const contextMaterial = context.material as any;

  expect(presentation.targetRenderableCount).toBe(1);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.kindCounts).toMatchObject({
    wellMarkerWork: 1,
    referenceRouteWork: 0,
    unresolvedBoundaryMarker: 0,
  });
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.duplicateTargetKeys).toEqual([]);
  expect(presentation.missingTargetKeys).toEqual(
    m5aZ2ExpectedTargetKeys.filter((key) => key !== 'G2_DRAIN_WELL_SOK1_001'),
  );
  expect(presentation.targetBounds).not.toBeNull();

  expect(target.visible).toBe(true);
  expect(target.renderOrder).toBe(30);
  expect(target.userData).toMatchObject({
    viewerDerived: true,
    m5aZ2ReviewPresentation: true,
    m5aZ2ReviewRole: 'QUESTION_TARGET_80',
  });
  expect(targetMaterial.opacity).toBe(m5aZ2ReviewTargetOpacity);
  expect(targetMaterial.transparent).toBe(true);
  expect(targetMaterial.depthWrite).toBe(true);
  expect(targetMaterial.userData).toMatchObject({
    m5aZ2ReviewPresentation: true,
    m5aZ2PresentationRole: 'QUESTION_TARGET_80',
  });

  expect(context.renderOrder).toBe(5);
  expect(context.userData).toMatchObject({
    viewerDerived: true,
    m5aZ2ReviewPresentation: true,
    m5aZ2ReviewRole: 'BUILDING_DRAINAGE_CONTEXT_20',
  });
  expect(contextMaterial.opacity).toBe(m5aZ2ReviewContextOpacity);
  expect(contextMaterial.transparent).toBe(true);
  expect(contextMaterial.depthWrite).toBe(false);
  expect(contextMaterial.userData).toMatchObject({
    m5aZ2ReviewPresentation: true,
    m5aZ2PresentationRole: 'BUILDING_DRAINAGE_CONTEXT_20',
  });
});


const m5aR1115CommonUserData = {
  Pass: 'M5A-R1115-P1',
  ModelStage: 'WORK_TEST_VIEW',
  representationKind: 'plannedWellRaisePresenceAnnotationWork',
  sourceContract: 'G2_R1115',
  sourceQuoteDriveId: '1g127d10q590Y8ADSZv5u4wwk9W_P5px1',
  sourceWellBindingClass: 'YLISRINNE_PROJECT_SCOPE_DERIVED',
  quoteWellNames: 'NOT_SPECIFIED',
  phase: 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED',
  planned: true,
  ordered: false,
  implemented: false,
  plannedRaiseHeightM: null,
  physicalWellDiameterClaim: false,
  physicalWellHeightClaim: false,
  physicalRaiseHeightClaim: false,
  currentGeometryClaim: false,
  physicalRouteClaim: false,
  exactXYClaim: false,
  exactZClaim: false,
  asBuiltClaim: false,
  Canonical: false,
  canonical: false,
  publishToCURRENT: false,
  presentationOnly: true,
  workAssumption: true,
  HUMAN_REVIEW: 'NOT_RUN',
} as const;

const makeR1115Target = (id: string, x: number) => {
  const target = createRenderableMesh({
    ...m5aR1115CommonUserData,
    G2IdCandidate: id,
  });
  target.position.set(x, 0, 0);
  return target;
};

test('M5A R1115 presentation uses exactly two persisted planned-raise markers with explicit nonphysical emphasis', () => {
  expect(m5aR1115SceneIndex).toBe(64);
  expect(m5aR1115ReviewTargetIds).toEqual([
    'G2_DRAIN_WELL_SOK2_PLANNED_RAISE_ANNOTATION_WORK',
    'G2_DRAIN_WELL_SOK3_PLANNED_RAISE_ANNOTATION_WORK',
  ]);
  expect(m5aR1115ReviewTargetOpacity).toBe(0.8);
  expect(m5aR1115ReviewContextOpacity).toBe(0.2);
  expect(m5aR1115ViewerMarkerScale).toBe(2.5);
  expect(m5aR1115ReviewQuestionScope).toContain('eivät tilattua tai toteutettua korotusta');
  expect(m5aR1115ReviewQuestionScope).toContain('korotuskorkeutta');
  expect(m5aR1115ReviewQuestionScope).toContain('exact XY/Z');
});

test('M5A R1115 presentation makes 2/2 source markers prominent and keeps context at 20 percent', () => {
  const sok2 = makeR1115Target(m5aR1115ReviewTargetIds[0], -0.75);
  const sok3 = makeR1115Target(m5aR1115ReviewTargetIds[1], 26.15);
  const context = createRenderableMesh({
    Pass: 'M5A-Z2D-R1090',
    G2IdCandidate: 'G2_DRAIN_WELL_SOK1_001',
    representationKind: 'wellDiameterPresentationWork',
  });
  const root = new THREE.Group();
  root.add(sok2);
  root.add(sok3);
  root.add(context);

  const presentation = prepareM5AR1115PlannedRaiseReviewPresentation(root);
  const sok2Material = sok2.material as any;
  const sok3Material = sok3.material as any;
  const contextMaterial = context.material as any;

  expect(presentation.ready).toBe(true);
  expect(presentation.sceneIndex).toBe(64);
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.expectedTargetRenderableCount).toBe(2);
  expect(presentation.foundTargetIds).toEqual([...m5aR1115ReviewTargetIds]);
  expect(presentation.missingTargetIds).toEqual([]);
  expect(presentation.duplicateTargetIds).toEqual([]);
  expect(presentation.semanticViolationTargetIds).toEqual([]);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.createdProxyCount).toBe(0);
  expect(presentation.usesPersistedSourceTargets).toBe(true);
  expect(presentation.targetBounds).not.toBeNull();
  expect(presentation.humanReview).toBe('NOT_RUN');

  for (const target of [sok2, sok3]) {
    expect(target.visible).toBe(true);
    expect(target.frustumCulled).toBe(false);
    expect(target.renderOrder).toBeGreaterThanOrEqual(2200);
    expect(target.scale.x).toBeCloseTo(m5aR1115ViewerMarkerScale);
    expect(target.scale.y).toBeCloseTo(m5aR1115ViewerMarkerScale);
    expect(target.scale.z).toBeCloseTo(m5aR1115ViewerMarkerScale);
    expect(target.userData).toMatchObject({
      viewerDerived: true,
      m5aR1115ReviewPresentation: true,
      m5aR1115ReviewRole: 'R1115_PLANNED_RAISE_TARGET_80',
      m5aR1115ViewerScaleApplied: true,
      m5aR1115ViewerScale: 2.5,
      m5aR1115ViewerScalePhysicalClaim: false,
    });
  }

  expect(sok2Material.opacity).toBe(m5aR1115ReviewTargetOpacity);
  expect(sok2Material.depthTest).toBe(false);
  expect(sok2Material.depthWrite).toBe(false);
  expect(sok3Material.opacity).toBe(m5aR1115ReviewTargetOpacity);
  expect(sok3Material.depthTest).toBe(false);
  expect(contextMaterial.opacity).toBe(m5aR1115ReviewContextOpacity);
  expect(contextMaterial.depthWrite).toBe(false);

  const runtime = createM5AR1115ReviewRuntimeState(presentation);
  expect(runtime.standardViewPreset).toBe('drainage');
  expect(runtime.targetBounds).toBe(presentation.targetBounds);
  expect(runtime.dataset).toMatchObject({
    workTestReviewMode: 'm5a-r1115-sok23-planned-raise-presence-review',
    m5aR1115CandidateId: 'm5a-r1115-sok23-planned-raise-presence',
    m5aR1115ReviewVariant: 'PLANNED_WELL_RAISE_PRESENCE',
    m5aR1115SceneIndex: '64',
    m5aR1115TargetRenderableCount: '2',
    m5aR1115ViewerMarkerScale: '2.50',
    m5aR1115ViewerScalePhysicalClaim: 'false',
    m5aR1115Planned: 'true',
    m5aR1115Ordered: 'false',
    m5aR1115Implemented: 'false',
    m5aR1115PlannedRaiseHeightKnown: 'false',
    m5aR1115PhysicalRaiseHeightClaim: 'false',
    m5aR1115CurrentGeometryClaim: 'false',
    m5aR1115AsBuiltClaim: 'false',
    m5aR1115Canonical: 'false',
    m5aR1115PublishToCurrent: 'false',
    m5aR1115HumanReview: 'NOT_RUN',
    m5aR1115ReviewCameraMode: 'PERSPECTIVE_FREE_ORBIT_TARGET_BOUNDS',
    standardViewPreset: 'drainage',
  });
});

test('M5A R1115 presentation and runtime fail closed on missing or promoted source markers', () => {
  const missingRoot = new THREE.Group();
  missingRoot.add(makeR1115Target(m5aR1115ReviewTargetIds[0], -0.75));
  const missingPresentation = prepareM5AR1115PlannedRaiseReviewPresentation(missingRoot);
  expect(missingPresentation.ready).toBe(false);
  expect(missingPresentation.missingTargetIds).toEqual([m5aR1115ReviewTargetIds[1]]);
  expect(() => createM5AR1115ReviewRuntimeState(missingPresentation)).toThrow(
    /source contract not ready/,
  );

  const promotedRoot = new THREE.Group();
  promotedRoot.add(makeR1115Target(m5aR1115ReviewTargetIds[0], -0.75));
  const promoted = makeR1115Target(m5aR1115ReviewTargetIds[1], 26.15);
  promoted.userData.implemented = true;
  promotedRoot.add(promoted);
  const promotedPresentation = prepareM5AR1115PlannedRaiseReviewPresentation(promotedRoot);
  expect(promotedPresentation.ready).toBe(false);
  expect(promotedPresentation.semanticViolationTargetIds).toEqual([m5aR1115ReviewTargetIds[1]]);
  expect(() => createM5AR1115ReviewRuntimeState(promotedPresentation)).toThrow(
    /source contract not ready/,
  );
});
