import { THREE } from './threeRuntime';

export const m5bCurrentSceneIndex = 60;
export const m5bPlannedSok2ComparisonSceneIndex = 61;
export const m5bPlannedSok2ComparisonSceneName = 'PLANNED_SOK2_COMPARISON_Z2R';

export const m5bCurrentRouteStubContextIds = [
  'G2_STORM_CURRENT_ROUTE_SOK1_001',
  'G2_STORM_CURRENT_ROUTE_SOK2_001',
] as const;

export const m5bCurrentVerticalDownspoutTargetIds = [
  'M5B_DOWNSPOUT_VERTICAL_WEST_SOUTH_WORK_TEST_PROXY',
  'M5B_DOWNSPOUT_VERTICAL_WEST_NORTH_WORK_TEST_PROXY',
  'M5B_DOWNSPOUT_VERTICAL_EAST_NORTH_WORK_TEST_PROXY',
  'M5B_DOWNSPOUT_VERTICAL_EAST_SOUTH_WORK_TEST_PROXY',
  'M5B_DOWNSPOUT_VERTICAL_SOUTH_CB_WORK_TEST_PROXY',
] as const;

export const m5bCurrentTargetIds = m5bCurrentVerticalDownspoutTargetIds;

export const m5bPlannedSok2TargetIds = [
  'G2_STORM_PLANNED_GULLY_SOK2_001',
  'G2_STORM_PLANNED_ROUTE_SOK2_001',
] as const;

export const m5bReviewTargetOpacity = 0.8;
export const m5bReviewContextOpacity = 0.2;

export const m5bCurrentDownspoutContext =
  'Käyttäjän 2026-10-08 vahvistama nykyhavainto: 5 syöksyränniä yhteensä; neljä rakennuksen nurkilla ja yksi eteläjulkisivulla C- ja B-rakennusten välissä.';

export const m5bCurrentReviewQuestionScope =
  'Katselussa arvioidaan vain viiden syöksyrännin pystysuuntaisten WORK_TEST-sijaintiviivojen likimääräistä paikkaa. Katon/räystään liitos, maanalainen purkureitti, exact XY/Z, as-built, CURRENT ja canonical eivät kuulu tähän kysymykseen.';

export const m5bPlannedSok2ReviewQuestionScope =
  'Katselussa arvioidaan vain suunnitelmapohjaisen SOK2-vertailuesityksen ymmärrettävyyttä suhteessa nykyisen M5B-kattosadevesikontekstin rajattuun WORK_TEST-esitykseen. Tämä ei ole tilaus-, toteuma-, CURRENT- tai as-built-väite.';

export const m5bCurrentTargetMeaningById: Record<(typeof m5bCurrentTargetIds)[number], string> = {
  M5B_DOWNSPOUT_VERTICAL_WEST_SOUTH_WORK_TEST_PROXY:
    'Pystysuora WORK_TEST-sijaintiviiva: rakennuksen länsi-eteläkulman syöksyrännin pystysuoran osuuden kommentointipaikka, ei kattoräystäsliitos eikä purkureitti.',
  M5B_DOWNSPOUT_VERTICAL_WEST_NORTH_WORK_TEST_PROXY:
    'Pystysuora WORK_TEST-sijaintiviiva: rakennuksen länsi-pohjoiskulman syöksyrännin pystysuoran osuuden kommentointipaikka, ei kattoräystäsliitos eikä purkureitti.',
  M5B_DOWNSPOUT_VERTICAL_EAST_NORTH_WORK_TEST_PROXY:
    'Pystysuora WORK_TEST-sijaintiviiva: rakennuksen itä-pohjoiskulman syöksyrännin pystysuoran osuuden kommentointipaikka, ei kattoräystäsliitos eikä purkureitti.',
  M5B_DOWNSPOUT_VERTICAL_EAST_SOUTH_WORK_TEST_PROXY:
    'Pystysuora WORK_TEST-sijaintiviiva: rakennuksen itä-eteläkulman syöksyrännin pystysuoran osuuden kommentointipaikka, ei kattoräystäsliitos eikä purkureitti.',
  M5B_DOWNSPOUT_VERTICAL_SOUTH_CB_WORK_TEST_PROXY:
    'Pystysuora WORK_TEST-sijaintiviiva: eteläjulkisivulla C- ja B-rakennusten välissä olevan viidennen syöksyrännin pystysuoran osuuden kommentointipaikka, ei kattoräystäsliitos eikä purkureitti.',
};

export const m5bCurrentRouteStubMeaningById: Record<(typeof m5bCurrentRouteStubContextIds)[number], string> = {
  G2_STORM_CURRENT_ROUTE_SOK1_001:
    'Taustaksi jätetty aiempi sininen WORK_TEST-stubi SOK1-puolen kattosadevesi-/sadevesireitin suunnasta; ei tämän katselukysymyksen varsinainen target.',
  G2_STORM_CURRENT_ROUTE_SOK2_001:
    'Taustaksi jätetty aiempi sininen WORK_TEST-stubi SOK2-puolen kattosadevesi-/sadevesireitin suunnasta; ei tämän katselukysymyksen varsinainen target.',
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

const getRouteStubMeaning = (g2Id: string) =>
  m5bCurrentRouteStubMeaningById[g2Id as (typeof m5bCurrentRouteStubContextIds)[number]] ?? '';

const removeDerivedDownspoutMarkers = (sceneRoot: any) => {
  const children = Array.isArray(sceneRoot?.children) ? [...sceneRoot.children] : [];
  children.forEach((child: any) => {
    if (child?.userData?.m5bVerticalDownspoutMarkerDerived === true) {
      sceneRoot.remove?.(child);
    }
  });
};

const calculateRenderableBounds = (sceneRoot: any) => {
  const box = new THREE.Box3();
  let found = false;
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object) || object?.userData?.m5bVerticalDownspoutMarkerDerived === true) return;
    const objectBox = new THREE.Box3().setFromObject(object);
    if (objectBox.isEmpty()) return;
    box.union(objectBox);
    found = true;
  });
  return found ? box : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const makeVerticalDownspoutLine = (
  id: (typeof m5bCurrentTargetIds)[number],
  x: number,
  z: number,
  y0: number,
  y1: number,
) => {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, y0, z),
    new THREE.Vector3(x, y1, z),
  ]);
  const material = new THREE.LineBasicMaterial({
    color: 0x1d74d8,
    opacity: m5bReviewTargetOpacity,
    transparent: true,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.name = id;
  line.userData = {
    G2Id: id,
    viewerDerived: true,
    presentationOnly: true,
    workAssumption: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalRouteClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    Canonical: false,
    publishToCURRENT: false,
    m5bVerticalDownspoutMarkerDerived: true,
    sourceBasis: 'USER_R1054_FIVE_DOWNSPOUT_OBSERVATION_AND_BUILDING_BOUNDS_WORK_ASSUMPTION',
    reviewLimit: 'VERTICAL_RUN_LOCATION_ONLY_NO_ROOF_EAVE_OR_DISCHARGE_CONNECTION_CLAIM',
  };
  return line;
};

const addCurrentVerticalDownspoutMarkers = (sceneRoot: any) => {
  removeDerivedDownspoutMarkers(sceneRoot);
  const bounds = calculateRenderableBounds(sceneRoot);
  if (!bounds) return 0;

  const y0 = bounds.min.y;
  const y1 = Math.max(bounds.min.y + 2.76, Math.min(bounds.max.y, bounds.min.y + 6.5));
  const westX = bounds.min.x;
  const eastX = bounds.max.x;
  const northZ = bounds.min.z;
  const southZ = bounds.max.z;
  const cbX = clamp(12.7, westX, eastX);

  const markers: Array<[(typeof m5bCurrentTargetIds)[number], number, number]> = [
    ['M5B_DOWNSPOUT_VERTICAL_WEST_SOUTH_WORK_TEST_PROXY', westX, southZ],
    ['M5B_DOWNSPOUT_VERTICAL_WEST_NORTH_WORK_TEST_PROXY', westX, northZ],
    ['M5B_DOWNSPOUT_VERTICAL_EAST_NORTH_WORK_TEST_PROXY', eastX, northZ],
    ['M5B_DOWNSPOUT_VERTICAL_EAST_SOUTH_WORK_TEST_PROXY', eastX, southZ],
    ['M5B_DOWNSPOUT_VERTICAL_SOUTH_CB_WORK_TEST_PROXY', cbX, southZ],
  ];

  markers.forEach(([id, x, z]) => {
    sceneRoot.add?.(makeVerticalDownspoutLine(id, x, z, y0, y1));
  });
  return markers.length;
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

  if (variant === 'CURRENT') {
    addCurrentVerticalDownspoutMarkers(sceneRoot);
  } else {
    removeDerivedDownspoutMarkers(sceneRoot);
  }

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
        m5bReviewContentStatus: 'VERTICAL_DOWNSPOUT_LOCATION_REVIEW_ONLY',
      };
      found.add(g2Id);
      if (targetMeaning) targetMeanings.push(targetMeaning);
      targetRenderableCount += 1;
      if (!hasNoPromotionSemantics(object, variant)) semanticViolationCount += 1;
      return;
    }

    if (variant === 'CURRENT' && m5bCurrentRouteStubContextIds.includes(g2Id as any)) {
      object.visible = true;
      cloneMaterials(object, m5bReviewContextOpacity, 'CURRENT_ROUTE_STUB_CONTEXT_20', variant);
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: variant,
        m5bReviewRole: 'CURRENT_ROUTE_STUB_CONTEXT_20',
        m5bReviewMeaning: getRouteStubMeaning(g2Id),
        m5bReviewQuestionScope: questionScope,
        m5bDownspoutContext: downspoutContext,
        m5bReviewContentStatus: 'OLD_ROUTE_STUB_CONTEXT_NOT_REVIEW_TARGET',
      };
      contextRenderableCount += 1;
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
