import { THREE } from './threeRuntime';

export const m5aZ2CandidateId = 'm5a-z2d-r1090-well-top-ground-surface';
export const m5aZ2ReviewId = `${m5aZ2CandidateId}-review`;

export const isM5aZ2SystemReviewRequested = (search = window.location.search) =>
  new URLSearchParams(search).get('review') === m5aZ2ReviewId;

const m5aZ2ReviewGlobals = globalThis as typeof globalThis & {
  m5aZ2CandidateId?: string;
  m5aZ2ReviewId?: string;
  isM5aZ2SystemReviewRequested?: () => boolean;
};

m5aZ2ReviewGlobals.m5aZ2CandidateId = m5aZ2CandidateId;
m5aZ2ReviewGlobals.m5aZ2ReviewId = m5aZ2ReviewId;
m5aZ2ReviewGlobals.isM5aZ2SystemReviewRequested = () =>
  isM5aZ2SystemReviewRequested(window.location.search);

export const m5aZ2ReviewTargetOpacity = 0.8;
export const m5aZ2ReviewContextOpacity = 0.2;
export const m5aZ2AbsoluteZBasis = 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE';
export const m5aZ2AbsoluteZContract = 'G2_R896';

export const m5aZ2ReviewQuestionText =
  'Näkyvätkö salaojien 4 kaivoa, 7 reittiä ja 2 ratkaisemattoman rajan markkeria rakennuksen ympärillä kokonaisuutena uskottavasti sijoitettuina ja toisiinsa liittyvinä, kun työ-Z perustuu HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE -oletukseen eikä ole exact-Z- tai as-built-väite?';

export const m5aZ2ReviewCamera = {
  coordinateFrame: 'YLIS-G1-LOCAL',
  projection: 'PERSPECTIVE',
  controls: 'FREE_ORBIT',
  framing: 'TARGET_BOUNDS',
} as const;

export const m5aZ2ExpectedTargetKeys = [
  'G2_DRAIN_WELL_SOK1_001',
  'G2_DRAIN_WELL_SOK2_001',
  'G2_DRAIN_WELL_SOK3_001',
  'G2_DRAIN_WELL_PVK_001',
  'G2_DRAIN_LINK_PVK_SOK1_001',
  'G2_DRAIN_LINK_PVK_SOK3_001',
  'G2_DRAIN_LINK_SOK1_SOK2_001',
  'G2_DRAIN_LINK_SOK3_BUILDING_END_001',
  'G2_DRAIN_LINK_SOK2_BUILDING_END_001',
  'G2_DRAIN_LINK_PVK_DISCHARGE_001',
  'G2_DRAIN_LINK_PVK_PARKING_001',
  'boundary:PVK_DISCHARGE',
  'boundary:PVK_PARKING',
] as const;

const targetKeySet = new Set<string>(m5aZ2ExpectedTargetKeys);
const targetKinds = new Set(['wellMarkerWork', 'referenceRouteWork', 'unresolvedBoundaryMarker']);
const requiredPass = 'M5A-Z2';

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const reviewDataKeys = new Set([
  'Pass',
  'G2IdCandidate',
  'Canonical',
  'presentationOnly',
  'workAssumption',
  'sourceDerivedTopology',
  'exactXYClaim',
  'exactZClaim',
  'physicalElevationClaim',
  'currentGeometryClaim',
  'asBuiltClaim',
  'publishToCURRENT',
  'absoluteZContract',
  'representationKind',
  'physicalWellGeometryClaim',
  'physicalRouteClaim',
  'exactSlopeClaim',
  'absoluteZBasis',
  'boundaryStatus',
  'boundaryRole',
  'externalNetworkConnectionClaim',
]);

const getReviewData = (object: any) => {
  const lineage: any[] = [];
  let cursor = object;
  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.parent;
  }

  const data: Record<string, unknown> = {};
  for (const node of lineage) {
    const nodeData = node?.userData ?? {};
    for (const key of reviewDataKeys) {
      if (Object.prototype.hasOwnProperty.call(nodeData, key)) {
        data[key] = nodeData[key];
      }
    }
  }
  return data;
};

const getTargetKey = (object: any) => {
  const data = getReviewData(object);
  const id = String(data.G2IdCandidate ?? '');
  if (id) return id;
  if (String(data.representationKind ?? '') === 'unresolvedBoundaryMarker') {
    return 'boundary:' + String(data.boundaryRole ?? '');
  }
  return '';
};

const cloneMaterials = (object: any, opacity: number, role: string) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = role === 'QUESTION_TARGET_80';
    clone.userData = {
      ...(clone.userData ?? {}),
      m5aZ2ReviewPresentation: true,
      m5aZ2PresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isTarget = (object: any) => {
  const data = getReviewData(object);
  const key = getTargetKey(object);
  return (
    String(data.Pass ?? '') === requiredPass &&
    targetKinds.has(String(data.representationKind ?? '')) &&
    targetKeySet.has(key)
  );
};

const hasCommonNoPromotionSemantics = (data: any) =>
  data.Canonical === false &&
  data.presentationOnly === true &&
  data.workAssumption === true &&
  data.sourceDerivedTopology === true &&
  data.exactXYClaim === false &&
  data.exactZClaim === false &&
  data.physicalElevationClaim === false &&
  data.currentGeometryClaim === false &&
  data.asBuiltClaim === false &&
  data.publishToCURRENT === false;

const hasNoPromotionSemantics = (object: any) => {
  const data = getReviewData(object);
  const kind = String(data.representationKind ?? '');

  if (!hasCommonNoPromotionSemantics(data)) return false;
  if (String(data.absoluteZContract ?? '') !== m5aZ2AbsoluteZContract) return false;

  if (kind === 'wellMarkerWork') {
    return (
      data.physicalWellGeometryClaim === false &&
      String(data.absoluteZBasis ?? '') === m5aZ2AbsoluteZBasis
    );
  }

  if (kind === 'referenceRouteWork') {
    return (
      data.physicalRouteClaim === false &&
      data.exactSlopeClaim === false &&
      String(data.absoluteZBasis ?? '') === m5aZ2AbsoluteZBasis
    );
  }

  if (kind === 'unresolvedBoundaryMarker') {
    return (
      data.boundaryStatus === 'UNRESOLVED_BOUNDARY' &&
      data.physicalRouteClaim === false &&
      data.externalNetworkConnectionClaim === false
    );
  }

  return false;
};

export const prepareM5AZ2SystemReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const targetKeys = new Map<string, any>();
  const duplicateTargetKeys: string[] = [];
  let semanticViolationCount = 0;

  const kindCounts = {
    wellMarkerWork: 0,
    referenceRouteWork: 0,
    unresolvedBoundaryMarker: 0,
  };

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isTarget(object)) return;

    const key = getTargetKey(object);
    if (targetKeys.has(key)) duplicateTargetKeys.push(key);
    targetKeys.set(key, object);
    targets.push(object);

    const data = getReviewData(object);
    const kind = String(data.representationKind ?? '');
    if (kind in kindCounts) {
      kindCounts[kind as keyof typeof kindCounts] += 1;
    }

    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const missingTargetKeys = m5aZ2ExpectedTargetKeys.filter((key) => !targetKeys.has(key));
  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;

  for (const object of targets) {
    object.visible = true;
    cloneMaterials(object, m5aZ2ReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...getReviewData(object),
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aZ2ReviewPresentation: true,
      m5aZ2ReviewRole: 'QUESTION_TARGET_80',
    };

    const bounds = new THREE.Box3().setFromObject(object);
    if (!bounds.isEmpty()) {
      if (!hasTargetBounds) {
        targetBounds.copy(bounds);
        hasTargetBounds = true;
      } else {
        targetBounds.union(bounds);
      }
    }
  }

  let contextRenderableCount = 0;
  for (const object of renderables) {
    if (isTarget(object) || object.visible === false) continue;
    cloneMaterials(object, m5aZ2ReviewContextOpacity, 'BUILDING_DRAINAGE_CONTEXT_20');
    object.renderOrder = 5;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aZ2ReviewPresentation: true,
      m5aZ2ReviewRole: 'BUILDING_DRAINAGE_CONTEXT_20',
    };
    contextRenderableCount += 1;
  }

  return {
    targetRenderableCount: targets.length,
    expectedTargetRenderableCount: m5aZ2ExpectedTargetKeys.length,
    missingTargetKeys,
    duplicateTargetKeys,
    semanticViolationCount,
    kindCounts,
    contextRenderableCount,
    targetBounds: hasTargetBounds ? targetBounds : null,
    reviewCamera: m5aZ2ReviewCamera,
    reviewQuestionText: m5aZ2ReviewQuestionText,
    sourceClassification: m5aZ2AbsoluteZBasis + ' / WORK_TEST / NOT_EXACT_Z / NOT_AS_BUILT',
  };
};
