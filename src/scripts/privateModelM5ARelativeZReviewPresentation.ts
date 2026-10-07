import { THREE } from './threeRuntime';

export const m5aRelativeZReviewTargetOpacity = 0.8;
export const m5aRelativeZReviewContextOpacity = 0.2;
export const m5aSok1Sok2ExpectedVerticalDeltaM = 1.14;
export const m5aSok1Sok2VerticalDeltaToleranceM = 0.005;

export const m5aSok1Sok2ReviewQuestionText =
  'Näkyykö SOK1:n ja SOK2:n välinen noin 1,14 m HIGH_CONFIDENCE_DERIVED-korkoero tässä sivunäkymässä uskottavana suhteena ilman että sitä tulkitaan exact-Z-, survey- tai as-built-mitaksi?';

export const m5aSok1Sok2ReviewCamera = {
  standardViewPreset: 'elev-pos-y',
  coordinateFrame: 'YLIS-G1-LOCAL',
  horizontalAxis: '+X',
  verticalAxis: '+Z',
  viewAxis: '+Y',
  projection: 'ORTHOGRAPHIC',
} as const;

export const m5aSok1Sok2TargetIds = [
  'G2_DRAIN_WELL_SOK1_001',
  'G2_DRAIN_WELL_SOK2_001',
  'G2_DRAIN_LINK_SOK1_SOK2_001',
] as const;

const targetIds = new Set<string>(m5aSok1Sok2TargetIds);
const requiredPass = 'M5A-R3-Z1C';

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
      m5aRelativeZReviewPresentation: true,
      m5aRelativeZPresentationRole: role,
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
  return (
    String(data.Pass ?? '') === requiredPass &&
    targetIds.has(String(data.G2IdCandidate ?? ''))
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

  if (kind === 'wellMarkerWork') return data.physicalWellGeometryClaim === false;
  if (kind === 'referenceRouteWork') {
    return (
      data.physicalRouteClaim === false &&
      data.relativeZRole ===
        'HIGH_CONFIDENCE_DERIVED_SOURCE_LOCAL_DATUM_BRIDGE_PRESENTATION_PROFILE' &&
      data.sourceRelativeZPlusSplitLevelDeltaM === m5aSok1Sok2ExpectedVerticalDeltaM &&
      data.sourceLocalDatumBridgeM === 1
    );
  }
  return false;
};

export const prepareM5ASok1Sok2RelativeZReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const targetsById = new Map<string, any>();
  let semanticViolationCount = 0;

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isTarget(object)) return;
    targets.push(object);
    targetsById.set(String(object.userData?.G2IdCandidate ?? ''), object);
    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const missingTargetIds = m5aSok1Sok2TargetIds.filter((id) => !targetsById.has(id));
  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;

  for (const object of targets) {
    object.visible = true;
    cloneMaterials(object, m5aRelativeZReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aRelativeZReviewPresentation: true,
      m5aRelativeZReviewRole: 'QUESTION_TARGET_80',
    };

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

  let contextRenderableCount = 0;
  for (const object of renderables) {
    if (isTarget(object) || object.visible === false) continue;
    cloneMaterials(object, m5aRelativeZReviewContextOpacity, 'BUILDING_DRAINAGE_CONTEXT_20');
    object.renderOrder = 5;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5aRelativeZReviewPresentation: true,
      m5aRelativeZReviewRole: 'BUILDING_DRAINAGE_CONTEXT_20',
    };
    contextRenderableCount += 1;
  }

  sceneRoot?.updateMatrixWorld?.(true);
  const sok1 = targetsById.get('G2_DRAIN_WELL_SOK1_001');
  const sok2 = targetsById.get('G2_DRAIN_WELL_SOK2_001');
  const route = targetsById.get('G2_DRAIN_LINK_SOK1_SOK2_001');
  const sok1World = sok1?.getWorldPosition?.(new THREE.Vector3()) ?? null;
  const sok2World = sok2?.getWorldPosition?.(new THREE.Vector3()) ?? null;
  const worldVerticalDeltaM =
    sok1World && sok2World ? Math.abs(sok2World.y - sok1World.y) : null;
  const routeMetadataDeltaM = Number(
    route?.userData?.sourceRelativeZPlusSplitLevelDeltaM,
  );
  const verticalDeltaErrorM =
    worldVerticalDeltaM === null
      ? null
      : Math.abs(worldVerticalDeltaM - m5aSok1Sok2ExpectedVerticalDeltaM);
  const verticalDeltaParity =
    verticalDeltaErrorM !== null &&
    verticalDeltaErrorM <= m5aSok1Sok2VerticalDeltaToleranceM &&
    Math.abs(routeMetadataDeltaM - m5aSok1Sok2ExpectedVerticalDeltaM) <=
      Number.EPSILON * 16;

  return {
    targetRenderableCount: targets.length,
    expectedTargetRenderableCount: m5aSok1Sok2TargetIds.length,
    missingTargetIds,
    semanticViolationCount,
    contextRenderableCount,
    targetBounds: hasTargetBounds ? targetBounds : null,
    sok1World,
    sok2World,
    worldVerticalDeltaM,
    routeMetadataDeltaM,
    verticalDeltaErrorM,
    verticalDeltaParity,
    reviewCamera: m5aSok1Sok2ReviewCamera,
    reviewQuestionText: m5aSok1Sok2ReviewQuestionText,
    sourceClassification:
      'HIGH_CONFIDENCE_DERIVED / SOURCE_LOCAL_DATUM_BRIDGE / NOT_EXACT_Z',
  };
};
