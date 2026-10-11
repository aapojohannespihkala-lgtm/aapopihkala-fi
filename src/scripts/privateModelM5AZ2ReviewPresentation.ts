import { THREE } from './threeRuntime';

export const m5aZ2ReviewTargetOpacity = 0.8;
export const m5aZ2ReviewContextOpacity = 0.2;
export const m5aZ2AbsoluteZBasis = 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE';
export const m5aZ2AbsoluteZContract = 'G2_R896';

export const m5aR1115SceneIndex = 64;
export const m5aR1115ReviewTargetOpacity = 0.8;
export const m5aR1115ReviewContextOpacity = 0.2;
export const m5aR1115ViewerMarkerScale = 2.5;
export const m5aR1115SourceContract = 'G2_R1115';
export const m5aR1115SourceQuoteDriveId = '1g127d10q590Y8ADSZv5u4wwk9W_P5px1';
export const m5aR1115ReviewTargetIds = [
  'G2_DRAIN_WELL_SOK2_PLANNED_RAISE_ANNOTATION_WORK',
  'G2_DRAIN_WELL_SOK3_PLANNED_RAISE_ANNOTATION_WORK',
] as const;
export const m5aR1115ReviewQuestionScope =
  'Katselussa arvioidaan vain kahden persisted WORK_TEST -korotusmerkinnän ymmärrettävyyttä SOK2- ja SOK3-kaivojen yhteydessä. Merkinnät kuvaavat tarjous-/suunnitteluvaiheen korotustarvetta, eivät tilattua tai toteutettua korotusta, korotuskorkeutta, fyysistä kaivomittaa, exact XY/Z-, CURRENT-, canonical- tai as-built-geometriaa.';

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
const targetPasses = new Set(['M5A-Z2', 'M5A-Z2D-R1036', 'M5A-Z2D-R1090']);
const targetKinds = new Set([
  'wellMarkerWork',
  'wellDiameterPresentationWork',
  'referenceRouteWork',
  'pipeDiameterPresentationWork',
  'unresolvedBoundaryMarker',
]);

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const getTargetKey = (object: any) => {
  const data = object?.userData ?? {};
  const id = String(data.G2IdCandidate ?? '');
  if (id) return id;
  if (String(data.representationKind ?? '') === 'unresolvedBoundaryMarker') {
    return 'boundary:' + String(data.boundaryRole ?? '');
  }
  return '';
};

const isSupersededR1090ReferenceRoute = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'M5A-Z2D-R1090' &&
    String(data.representationKind ?? '') === 'referenceRouteWork'
  );
};

const cloneMaterials = (object: any, opacity: number, role: string, r1125Overlay = false) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = r1125Overlay ? false : role === 'QUESTION_TARGET_80';
    // R1125-only WORK_TEST review overlays source targets over translucent terrain;
    // this changes neither source geometry nor normal/other-review depth semantics.
    if (r1125Overlay) clone.depthTest = false;
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
  const data = object?.userData ?? {};
  const key = getTargetKey(object);
  return (
    !isSupersededR1090ReferenceRoute(object) &&
    targetPasses.has(String(data.Pass ?? '')) &&
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
  const data = object?.userData ?? {};
  const kind = String(data.representationKind ?? '');

  if (!hasCommonNoPromotionSemantics(data)) return false;
  if (String(data.absoluteZContract ?? '') !== m5aZ2AbsoluteZContract) return false;

  if (kind === 'wellMarkerWork' || kind === 'wellDiameterPresentationWork') {
    return (
      data.physicalWellGeometryClaim === false &&
      String(data.absoluteZBasis ?? '') === m5aZ2AbsoluteZBasis
    );
  }

  if (kind === 'referenceRouteWork' || kind === 'pipeDiameterPresentationWork') {
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

// Viewer-only, source-derived tube accents for the two unresolved R1125 glTF LINES.
// Do not alter the GLB primitive, infer an outlet connection, or claim pipe diameter.
const r1125BoundaryTraceFlag = 'm5aR1125UnresolvedBoundaryViewerTrace';

const clearR1125BoundaryTraces = (root: any) => {
  const old: any[] = [];
  root?.traverse?.((o: any) => {
    if (o?.userData?.[r1125BoundaryTraceFlag] === true) old.push(o);
  });
  for (const o of old) {
    o.parent?.remove(o);
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  }
};

const createR1125BoundaryTraces = (root: any, boundaries: any[]): number => {
  if (boundaries.length !== 2 || boundaries.some((o) => !o?.isLineSegments)) return 0;
  root?.updateMatrixWorld?.(true);
  const segments: Array<{ start: any; end: any; key: string }> = [];
  for (const object of boundaries) {
    const position = object.geometry?.getAttribute?.('position');
    const indices = object.geometry?.getIndex?.();
    const count = indices ? indices.count : position?.count;
    if (!position || !Number.isInteger(count) || count < 2 || count % 2 !== 0 || count > 128) return 0;
    const key = getTargetKey(object);
    if (key !== 'boundary:PVK_DISCHARGE' && key !== 'boundary:PVK_PARKING') return 0;
    for (let i = 0; i < count; i += 2) {
      const at = (j: number) => {
        const n = indices ? indices.getX(j) : j;
        return new THREE.Vector3(position.getX(n), position.getY(n), position.getZ(n))
          .applyMatrix4(object.matrixWorld);
      };
      const start = root.worldToLocal(at(i));
      const end = root.worldToLocal(at(i + 1));
      const length = start.distanceTo(end);
      if (![start.x, start.y, start.z, end.x, end.y, end.z, length].every(Number.isFinite) ||
          length <= 0.00001) return 0;
      segments.push({ start, end, key });
    }
  }
  if (segments.length < 2) return 0;
  for (const { start, end, key } of segments) {
    const offset = new THREE.Vector3().subVectors(end, start);
    const cue = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, offset.length(), 8),
      new THREE.MeshBasicMaterial({
        color: 0xffd84a, opacity: 0.98, transparent: true,
        depthTest: false, depthWrite: false,
      }),
    );
    cue.name = 'M5A_R1125_VIEWER_ONLY_UNRESOLVED_TRACE_' + key;
    cue.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
    cue.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), offset.normalize());
    cue.renderOrder = 2300;
    cue.frustumCulled = false;
    cue.userData = {
      [r1125BoundaryTraceFlag]: true, viewerDerived: true,
      presentationOnly: true, workAssumption: true,
      sourceBoundaryTargetKey: key, m5aZ2ReviewRole: 'R1125_VIEWER_ONLY_UNRESOLVED_TRACE',
      exactXYClaim: false, exactZClaim: false, physicalRouteClaim: false,
      physicalDiameterClaim: false, currentGeometryClaim: false,
      asBuiltClaim: false, Canonical: false, publishToCURRENT: false,
      HUMAN_REVIEW: 'NOT_RUN',
    };
    root.add(cue);
  }
  return segments.length;
};

export const prepareM5AZ2SystemReviewPresentation = (
  sceneRoot: any,
  options: { r1125TerrainResistantOverlay?: boolean } = {},
) => {
  const r1125Overlay = options.r1125TerrainResistantOverlay === true;
  clearR1125BoundaryTraces(sceneRoot);
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

    const kind = String(object.userData?.representationKind ?? '');
    const countedKind = kind === 'pipeDiameterPresentationWork'
      ? 'referenceRouteWork'
      : kind === 'wellDiameterPresentationWork'
        ? 'wellMarkerWork'
        : kind;
    if (countedKind in kindCounts) {
      kindCounts[countedKind as keyof typeof kindCounts] += 1;
    }

    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const missingTargetKeys = m5aZ2ExpectedTargetKeys.filter((key) => !targetKeys.has(key));
  if (r1125Overlay) {
    const source = sceneRoot?.userData ?? {};
    const contextCount = renderables.filter((object) => !isTarget(object) && object.visible !== false).length;
    if (
      source.sourceDiameterCorrectionContract !== 'G2_R1125' ||
      source.sourceDiameterClassBreakdown !==
        '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN' ||
      source.currentGeometryClaim !== false ||
      source.asBuiltClaim !== false ||
      source.publishToCURRENT !== false ||
      targets.length !== m5aZ2ExpectedTargetKeys.length ||
      missingTargetKeys.length !== 0 ||
      duplicateTargetKeys.length !== 0 ||
      semanticViolationCount !== 0 ||
      kindCounts.wellMarkerWork !== 4 ||
      kindCounts.referenceRouteWork !== 7 ||
      kindCounts.unresolvedBoundaryMarker !== 2 ||
      contextCount < 1
    ) {
      throw new Error('M5A R1125 depth overlay requires exact scene63 13/13 source-only review');
    }
  }
  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;

  for (const object of targets) {
    object.visible = true;
    cloneMaterials(object, m5aZ2ReviewTargetOpacity, 'QUESTION_TARGET_80', r1125Overlay);
    object.renderOrder = r1125Overlay ? 2200 : 30;
    object.userData = {
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

  // Only exact source-backed 13/13 can create viewer-only yellow accents.
  const r1125BoundaryTraceCount = r1125Overlay
    ? createR1125BoundaryTraces(sceneRoot,
        targets.filter((o) => String(o.userData?.representationKind ?? '') === 'unresolvedBoundaryMarker'))
    : 0;
  if (r1125Overlay && r1125BoundaryTraceCount < 2) {
    clearR1125BoundaryTraces(sceneRoot);
    throw new Error('M5A R1125 unresolved boundary line geometry is not drawable');
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
    r1125TerrainResistantOverlayApplied: r1125Overlay,
    r1125BoundaryTraceCount,
  };
};

const cloneR1115Materials = (object: any, opacity: number, role: string) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;
    if (role === 'R1115_PLANNED_RAISE_TARGET_80') clone.depthTest = false;
    clone.userData = {
      ...(clone.userData ?? {}),
      m5aR1115ReviewPresentation: true,
      m5aR1115PresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const hasR1115NoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'M5A-R1115-P1' &&
    String(data.representationKind ?? '') === 'plannedWellRaisePresenceAnnotationWork' &&
    String(data.sourceContract ?? '') === m5aR1115SourceContract &&
    String(data.sourceQuoteDriveId ?? '') === m5aR1115SourceQuoteDriveId &&
    String(data.phase ?? '') === 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED' &&
    String(data.sourceWellBindingClass ?? '') === 'YLISRINNE_PROJECT_SCOPE_DERIVED' &&
    String(data.quoteWellNames ?? '') === 'NOT_SPECIFIED' &&
    data.planned === true &&
    data.ordered === false &&
    data.implemented === false &&
    data.plannedRaiseHeightM == null &&
    data.physicalWellDiameterClaim === false &&
    data.physicalWellHeightClaim === false &&
    data.physicalRaiseHeightClaim === false &&
    data.currentGeometryClaim === false &&
    data.physicalRouteClaim === false &&
    data.exactXYClaim === false &&
    data.exactZClaim === false &&
    data.asBuiltClaim === false &&
    data.Canonical === false &&
    data.canonical === false &&
    data.publishToCURRENT === false &&
    data.presentationOnly === true &&
    data.workAssumption === true &&
    data.HUMAN_REVIEW === 'NOT_RUN'
  );
};

export const prepareM5AR1115PlannedRaiseReviewPresentation = (sceneRoot: any) => {
  const targetSet = new Set<string>(m5aR1115ReviewTargetIds);
  const foundById = new Map<string, any[]>(
    m5aR1115ReviewTargetIds.map((id) => [id, []]),
  );
  const renderables: any[] = [];

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    const id = String(object?.userData?.G2IdCandidate ?? '').trim();
    if (targetSet.has(id)) foundById.get(id)?.push(object);
  });

  const missingTargetIds = m5aR1115ReviewTargetIds.filter(
    (id) => (foundById.get(id)?.length ?? 0) === 0,
  );
  const duplicateTargetIds = m5aR1115ReviewTargetIds.filter(
    (id) => (foundById.get(id)?.length ?? 0) > 1,
  );
  const semanticViolationTargetIds = m5aR1115ReviewTargetIds.filter((id) => {
    const matches = foundById.get(id) ?? [];
    return matches.length === 1 && !hasR1115NoPromotionSemantics(matches[0]);
  });
  const targets = m5aR1115ReviewTargetIds.flatMap((id) => foundById.get(id) ?? []);

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  for (const object of targets) {
    const id = String(object?.userData?.G2IdCandidate ?? '').trim();
    object.visible = true;
    object.frustumCulled = false;
    object.renderOrder = Math.max(Number(object.renderOrder ?? 0), 2200);
    if (object.userData?.m5aR1115ViewerScaleApplied !== true) {
      object.scale?.multiplyScalar?.(m5aR1115ViewerMarkerScale);
    }
    cloneR1115Materials(object, m5aR1115ReviewTargetOpacity, 'R1115_PLANNED_RAISE_TARGET_80');
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aR1115ReviewPresentation: true,
      m5aR1115ReviewRole: 'R1115_PLANNED_RAISE_TARGET_80',
      m5aR1115ReviewQuestionScope,
      m5aR1115ViewerScaleApplied: true,
      m5aR1115ViewerScale: m5aR1115ViewerMarkerScale,
      m5aR1115ViewerScalePhysicalClaim: false,
      m5aR1115TargetId: id,
    };
  }

  sceneRoot?.updateMatrixWorld?.(true);
  for (const object of targets) {
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) continue;
    if (!hasTargetBounds) {
      targetBounds.copy(bounds);
      hasTargetBounds = true;
    } else {
      targetBounds.union(bounds);
    }
  }

  let contextRenderableCount = 0;
  for (const object of renderables) {
    const id = String(object?.userData?.G2IdCandidate ?? '').trim();
    if (targetSet.has(id) || object.visible === false) continue;
    cloneR1115Materials(object, m5aR1115ReviewContextOpacity, 'R1115_DRAINAGE_CONTEXT_20');
    object.renderOrder = Math.min(Number(object.renderOrder ?? 0), 20);
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aR1115ReviewPresentation: true,
      m5aR1115ReviewRole: 'R1115_DRAINAGE_CONTEXT_20',
      m5aR1115ReviewQuestionScope,
    };
    contextRenderableCount += 1;
  }

  const ready =
    missingTargetIds.length === 0 &&
    duplicateTargetIds.length === 0 &&
    semanticViolationTargetIds.length === 0 &&
    targets.length === m5aR1115ReviewTargetIds.length &&
    hasTargetBounds;

  return {
    ready,
    sceneIndex: m5aR1115SceneIndex,
    foundTargetIds: m5aR1115ReviewTargetIds.filter(
      (id) => (foundById.get(id)?.length ?? 0) === 1,
    ),
    targetRenderableCount: targets.length,
    expectedTargetRenderableCount: m5aR1115ReviewTargetIds.length,
    missingTargetIds,
    duplicateTargetIds,
    semanticViolationTargetIds,
    semanticViolationCount: semanticViolationTargetIds.length,
    contextRenderableCount,
    targetBounds: hasTargetBounds ? targetBounds : null,
    targetOpacity: m5aR1115ReviewTargetOpacity,
    contextOpacity: m5aR1115ReviewContextOpacity,
    viewerMarkerScale: m5aR1115ViewerMarkerScale,
    createdProxyCount: 0,
    usesPersistedSourceTargets: true,
    reviewQuestionScope: m5aR1115ReviewQuestionScope,
    sourceClassification:
      'QUOTE_ONLY_NOT_ORDERED / PROJECT_SCOPE_DERIVED_SOK2_SOK3_BINDING / WORK_TEST / NO_PHYSICAL_RAISE_HEIGHT',
    humanReview: 'NOT_RUN' as const,
  };
};

