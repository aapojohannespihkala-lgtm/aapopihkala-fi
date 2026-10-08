import { THREE } from './threeRuntime';

export const m5bCurrentSceneIndex = 60;
export const m5bPlannedSok2ComparisonSceneIndex = 61;
export const m5bPlannedSok2ComparisonSceneName = 'PLANNED_SOK2_COMPARISON_Z2R';

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

export const m5bCurrentDownspoutContext =
  'Käyttäjän 2026-10-08 vahvistama nykyhavainto: 5 syöksyränniä yhteensä; neljä rakennuksen nurkilla ja yksi eteläjulkisivulla C- ja B-rakennusten välissä.';

export const m5bCurrentReviewQuestionScope =
  'Katselussa arvioidaan vain sinisten kattosadevesi-/sadevesireitin WORK_TEST-stubien ymmärrettävyyttä ja rajattua suhdetta viiden syöksyrännin nykyhavaintoon. Tämä ei ole exact XY/Z-, fyysinen purkupiste-, reitti-, as-built-, CURRENT- tai canonical-väite.';

export const m5bPlannedSok2ReviewQuestionScope =
  'Katselussa arvioidaan vain suunnitelmapohjaisen SOK2-vertailuesityksen ymmärrettävyyttä suhteessa nykyisen M5B-kattosadevesikontekstin rajattuun WORK_TEST-esitykseen. Tämä ei ole tilaus-, toteuma-, CURRENT- tai as-built-väite.';

export const m5bCurrentTargetMeaningById: Record<(typeof m5bCurrentTargetIds)[number], string> = {
  G2_STORM_CURRENT_ROUTE_SOK1_001:
    'Sininen lyhyt stubi: nykyhavaintoon sidottu WORK_TEST-stubi SOK1-puolen kattosadevesi-/sadevesireitin suunnasta, ei todistettu koko putkilinja.',
  G2_STORM_CURRENT_ROUTE_SOK2_001:
    'Sininen lyhyt stubi: nykyhavaintoon sidottu WORK_TEST-stubi SOK2-puolen kattosadevesi-/sadevesireitin suunnasta, ei todistettu koko putkilinja.',
};

export const m5bPlannedSok2TargetMeaningById: Record<(typeof m5bPlannedSok2TargetIds)[number], string> = {
  G2_STORM_PLANNED_GULLY_SOK2_001:
    'Suunnitelma-/vertailukohde: SOK2-puolen suunniteltu rännikaivovertailu, ei nykytilan toteumaväite.',
  G2_STORM_PLANNED_ROUTE_SOK2_001:
    'Suunnitelma-/vertailukohde: SOK2-puolen suunniteltu sadevesireittivertailu, ei nykytilan toteumaväite.',
};

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

const getQuestionScope = (variant: M5BReviewVariant) =>
  variant === 'CURRENT'
    ? m5bCurrentReviewQuestionScope
    : m5bPlannedSok2ReviewQuestionScope;

const getDownspoutContext = (variant: M5BReviewVariant) =>
  variant === 'CURRENT'
    ? m5bCurrentDownspoutContext
    : `${m5bCurrentDownspoutContext} PLANNED_SOK2_COMPARISON on erillinen suunnitelma-/vertailuesitys.`;

const getTargetMeaning = (variant: M5BReviewVariant, g2Id: string) => {
  if (variant === 'CURRENT') {
    return m5bCurrentTargetMeaningById[g2Id as (typeof m5bCurrentTargetIds)[number]] ?? '';
  }
  return m5bPlannedSok2TargetMeaningById[g2Id as (typeof m5bPlannedSok2TargetIds)[number]] ?? '';
};

export const getM5BReviewSceneIndex = (variant: M5BReviewVariant) =>
  variant === 'CURRENT' ? m5bCurrentSceneIndex : m5bPlannedSok2ComparisonSceneIndex;

export const prepareM5BReviewPresentation = (sceneRoot: any, variant: M5BReviewVariant) => {
  const targets = variant === 'CURRENT' ? m5bCurrentTargetIds : m5bPlannedSok2TargetIds;
  const targetIds = new Set<string>(targets);
  const found = new Set<string>();
  const targetMeanings: string[] = [];
  const questionScope = getQuestionScope(variant);
  const downspoutContext = getDownspoutContext(variant);
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let suppressedCrossVariantCount = 0;
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    const g2Id = String(object?.userData?.G2Id ?? object?.userData?.G2IdCandidate ?? '').trim();

    if (targetIds.has(g2Id)) {
      const targetMeaning = getTargetMeaning(variant, g2Id);
      object.visible = true;
      cloneMaterials(object, m5bReviewTargetOpacity, 'QUESTION_TARGET_80', variant);
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: variant,
        m5bReviewRole: 'QUESTION_TARGET_80',
        m5bReviewMeaning: targetMeaning,
        m5bReviewQuestionScope: questionScope,
        m5bDownspoutContext: downspoutContext,
        m5bReviewContentStatus: 'CLARITY_CORRECTION_PRESENTATION_ONLY',
      };
      found.add(g2Id);
      if (targetMeaning) targetMeanings.push(targetMeaning);
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
        m5bReviewQuestionScope: questionScope,
        m5bDownspoutContext: downspoutContext,
      };
      suppressedCrossVariantCount += 1;
      return;
    }

    if (object.visible === false) return;
    // The rebuilt Z2R scene61 stores the SOK1 context as source-bound comparison
    // geometry, not as a second G2Id/G2IdCandidate target.
    const isSok1ComparisonContext =
      variant === 'PLANNED_SOK2_COMPARISON' &&
      (g2Id === 'G2_STORM_CURRENT_ROUTE_SOK1_001' ||
        (object?.userData?.presentationRole === 'CURRENT_SOK1_COMPARISON_CONTEXT' &&
          object?.userData?.sourceG2IdCandidate === 'G2_STORM_CURRENT_ROUTE_SOK1_001' &&
          object?.userData?.presentationOnlyComparison === true));
    const role = isSok1ComparisonContext
      ? 'CURRENT_SOK1_COMPARISON_CONTEXT_20'
      : 'BUILDING_CONTEXT_20';
    cloneMaterials(object, m5bReviewContextOpacity, role, variant);
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5bReviewPresentation: true,
      m5bReviewVariant: variant,
      m5bReviewRole: role,
      m5bReviewQuestionScope: questionScope,
      m5bDownspoutContext: downspoutContext,
      m5bReviewContentStatus: 'CLARITY_CONTEXT_20',
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
    questionScope,
    downspoutContext,
    targetMeanings,
  };
};
