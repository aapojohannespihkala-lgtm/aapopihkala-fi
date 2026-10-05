import { THREE } from './threeRuntime';

export const m5aReviewTargetOpacity = 0.8;
export const m5aReviewContextOpacity = 0.2;

export const m5aExpectedTargetCounts = {
  wellMarkerWork: 4,
  referenceRouteWork: 7,
  unresolvedBoundaryMarker: 4,
} as const;

export const m5aExpectedTargetRenderableCount = Object.values(m5aExpectedTargetCounts).reduce(
  (sum, count) => sum + count,
  0,
);

export const m5aReviewQuestionText =
  'Näyttävätkö salaojajärjestelmän suhteellinen topologia ja kaivojen yleinen sijoittuminen rakennuksen ympärille uskottavilta suhteessa viereiseen Drainman-lähdepiirrokseen?';

export const m5aReviewSourceContext = {
  sourceLabel: 'Salaojapiirros Drainman.pdf',
  sourceDrawingDriveId: '1KZhDDXnI5MsO4wNWzRwYCaGNQuOo0TCC',
  sourceDrawingByteSize: 1132069,
  sourcePreviewUrl: 'https://drive.google.com/file/d/1KZhDDXnI5MsO4wNWzRwYCaGNQuOo0TCC/preview',
  technicalSourceLabel: 'Drainman 21.7.2026 salaojien seurantatarkastus',
  sourceClass: 'SOURCE_REFERENCE_PLUS_DERIVED_QUALITATIVE',
  namedWells: ['SOK1', 'SOK2', 'SOK3', 'PVK'],
  supportedLinkCount: 7,
  drawingLowerMapping: '+X / itäpääty / WORK_ASSUMPTION',
  drawingUpperMapping: '-X / länsipääty / WORK_ASSUMPTION',
  drawingLeftMapping: 'Y-min / WORK_ASSUMPTION',
  exactXYClaim: false,
  exactZClaim: false,
  physicalRouteClaim: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  canonical: false,
} as const;

const targetKinds = new Set<string>(Object.keys(m5aExpectedTargetCounts));

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const cloneMaterials = (object: any, opacity: number, role: string) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = role === 'QUESTION_TARGET_80';
    clone.userData = {
      ...(clone.userData ?? {}),
      m5aReviewPresentation: true,
      m5aPresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isM5ATarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'M5A' &&
    targetKinds.has(String(data.representationKind ?? '')) &&
    data.presentationOnly === true &&
    data.workAssumption === true &&
    data.sourceDerivedTopology === true
  );
};

const hasNoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const kind = String(data.representationKind ?? '');

  if (
    data.Canonical !== false ||
    data.presentationOnly !== true ||
    data.workAssumption !== true ||
    data.sourceDerivedTopology !== true ||
    data.exactXYClaim !== false ||
    data.exactZClaim !== false ||
    data.physicalElevationClaim !== false ||
    data.currentGeometryClaim !== false ||
    data.asBuiltClaim !== false ||
    data.publishToCURRENT !== false
  ) {
    return false;
  }

  if (kind === 'wellMarkerWork') {
    return data.physicalWellGeometryClaim === false;
  }

  if (kind === 'referenceRouteWork') {
    return data.physicalRouteClaim === false;
  }

  if (kind === 'unresolvedBoundaryMarker') {
    return (
      data.physicalRouteClaim === false &&
      String(data.boundaryStatus ?? '') === 'UNRESOLVED_BOUNDARY'
    );
  }

  return false;
};

export const prepareM5AReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const targetCounts: Record<string, number> = {
    wellMarkerWork: 0,
    referenceRouteWork: 0,
    unresolvedBoundaryMarker: 0,
  };
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isM5ATarget(object)) return;

    targets.push(object);
    const kind = String(object.userData?.representationKind ?? '');
    targetCounts[kind] = (targetCounts[kind] ?? 0) + 1;
    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneMaterials(object, m5aReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 20;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aReviewPresentation: true,
      m5aReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;

    sceneRoot?.updateMatrixWorld?.(true);
    const objectBounds = new THREE.Box3().setFromObject(object);
    if (!objectBounds.isEmpty()) {
      if (!hasTargetBounds) {
        targetBounds.copy(objectBounds);
        hasTargetBounds = true;
      } else {
        targetBounds.union(objectBounds);
      }
    }
  }

  for (const object of renderables) {
    if (isM5ATarget(object) || object.visible === false) continue;
    cloneMaterials(object, m5aReviewContextOpacity, 'BUILDING_SITE_CONTEXT_20');
    object.renderOrder = 5;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aReviewPresentation: true,
      m5aReviewRole: 'BUILDING_SITE_CONTEXT_20',
    };
    contextRenderableCount += 1;
  }

  const missingTargetKinds = Object.entries(m5aExpectedTargetCounts)
    .filter(([kind, expected]) => (targetCounts[kind] ?? 0) !== expected)
    .map(([kind]) => kind);

  return {
    targetRenderableCount,
    contextRenderableCount,
    semanticViolationCount,
    targetCounts,
    missingTargetKinds,
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
