import { THREE } from './threeRuntime';

export const m5bCurrentSceneIndex = 56;
export const m5bPlannedSok2ComparisonSceneIndex = 57;
export const m5bPlannedSok2ComparisonSceneName = 'PLANNED_SOK2_COMPARISON';

export const m5bCurrentTargetIds = [
  'G2_STORM_CURRENT_ROUTE_SOK1_001',
  'G2_STORM_CURRENT_ROUTE_SOK2_001',
] as const;

export const m5bPlannedSok2TargetIds = [
  'G2_STORM_PLANNED_GULLY_SOK2_001',
  'G2_STORM_PLANNED_ROUTE_SOK2_001',
] as const;

export const m5bReviewTargetOpacity = 0.8;
export const m5bReviewContextOpacity = 0.2;

export type M5BReviewVariant = 'CURRENT' | 'PLANNED_SOK2_COMPARISON';

const isRenderable = (object: any) =>
  Boolean(object?.material && (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints));

const cloneMaterials = (object: any, opacity: number, role: string, variant: M5BReviewVariant) => {
  const update = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;
    clone.userData = {
      ...(clone.userData ?? {}),
      m5bReviewPresentation: true,
      m5bReviewVariant: variant,
      m5bPresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };
  object.material = Array.isArray(object.material)
    ? object.material.map(update)
    : update(object.material);
};

const commonNoPromotionFlags = [
  'exactXYClaim',
  'exactZClaim',
  'physicalRouteClaim',
  'currentGeometryClaim',
  'asBuiltClaim',
  'Canonical',
  'publishToCURRENT',
] as const;

const hasNoPromotionSemantics = (object: any, variant: M5BReviewVariant) => {
  const data = object?.userData ?? {};
  if (data.presentationOnly !== true || data.workAssumption !== true) return false;
  if (commonNoPromotionFlags.some((key) => data[key] !== false)) return false;
  if (variant === 'PLANNED_SOK2_COMPARISON') {
    return data.planned === true &&
      data.ordered === false &&
      data.implemented === false &&
      data.current === false &&
      data.presentationOnlyComparison === true;
  }
  return true;
};

export const getM5BReviewSceneIndex = (variant: M5BReviewVariant) =>
  variant === 'CURRENT' ? m5bCurrentSceneIndex : m5bPlannedSok2ComparisonSceneIndex;

export const prepareM5BReviewPresentation = (sceneRoot: any, variant: M5BReviewVariant) => {
  const targets = variant === 'CURRENT' ? m5bCurrentTargetIds : m5bPlannedSok2TargetIds;
  const targetIds = new Set<string>(targets);
  const found = new Set<string>();
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let suppressedCrossVariantCount = 0;
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    const g2Id = String(object?.userData?.G2Id ?? '').trim();

    if (targetIds.has(g2Id)) {
      object.visible = true;
      cloneMaterials(object, m5bReviewTargetOpacity, 'QUESTION_TARGET_80', variant);
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: variant,
        m5bReviewRole: 'QUESTION_TARGET_80',
      };
      found.add(g2Id);
      targetRenderableCount += 1;
      if (!hasNoPromotionSemantics(object, variant)) semanticViolationCount += 1;
      return;
    }

    const suppress =
      (variant === 'CURRENT' && m5bPlannedSok2TargetIds.includes(g2Id as any)) ||
      (variant === 'PLANNED_SOK2_COMPARISON' && g2Id === 'G2_STORM_CURRENT_ROUTE_SOK2_001');

    if (suppress) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: variant,
        m5bReviewRole: 'CROSS_VARIANT_SUPPRESSED',
      };
      suppressedCrossVariantCount += 1;
      return;
    }

    if (object.visible === false) return;
    const role =
      variant === 'PLANNED_SOK2_COMPARISON' && g2Id === 'G2_STORM_CURRENT_ROUTE_SOK1_001'
        ? 'CURRENT_SOK1_COMPARISON_CONTEXT_20'
        : 'BUILDING_CONTEXT_20';
    cloneMaterials(object, m5bReviewContextOpacity, role, variant);
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5bReviewPresentation: true,
      m5bReviewVariant: variant,
      m5bReviewRole: role,
    };
    contextRenderableCount += 1;
  });

  return {
    variant,
    sceneIndex: getM5BReviewSceneIndex(variant),
    targetRenderableCount,
    contextRenderableCount,
    suppressedCrossVariantCount,
    semanticViolationCount,
    foundTargetIds: [...found],
    missingTargetIds: targets.filter((id) => !found.has(id)),
  };
};
