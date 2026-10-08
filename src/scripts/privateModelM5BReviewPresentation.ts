import { THREE } from './threeRuntime';

export const m5bCurrentSceneIndex = 60;
export const m5bPlannedSok2ComparisonSceneIndex = 61;
export const m5bPlannedSok2ComparisonSceneName = 'PLANNED_SOK2_COMPARISON_Z2R';

export const m5bCurrentRouteStubIds = [
  'G2_STORM_CURRENT_ROUTE_SOK1_001',
  'G2_STORM_CURRENT_ROUTE_SOK2_001',
] as const;

export const m5bCurrentVerticalDownspoutProxyIds = [
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B',
] as const;

export const m5bCurrentTargetIds = m5bCurrentVerticalDownspoutProxyIds;

export const m5bPlannedSok2TargetIds = [
  'G2_STORM_PLANNED_GULLY_SOK2_001',
  'G2_STORM_PLANNED_ROUTE_SOK2_001',
] as const;

export const m5bReviewTargetOpacity = 0.8;
export const m5bReviewContextOpacity = 0.2;
export const m5bVerticalDownspoutProxyRadius = 0.08;
export const m5bVerticalDownspoutProxyWallOffset = 0.45;
export const m5bVerticalDownspoutShortFacadeLateralInsetRatio = 0.18;
export const m5bVerticalDownspoutShortFacadeLateralFix = 'R1081_SHORT_FACADE_LATERAL_INSET';
export const m5bVerticalDownspoutProxyRenderableForm = 'THICK_VISIBLE_TUBE_PROXY';

export type M5BVerticalDownspoutProxyId = (typeof m5bCurrentVerticalDownspoutProxyIds)[number];

export const m5bCurrentDownspoutContext =
  'Käyttäjän 2026-10-08 vahvistama nykyhavainto: 5 syöksyränniä yhteensä; neljä rakennuksen nurkilla ja yksi eteläjulkisivulla C- ja B-rakennusten välissä.';

export const m5bCurrentVerticalDownspoutReviewScope =
  'Katselussa arvioidaan vain viiden syöksyrännin pystysuuntaisten osuuksien sijaintia rakennuksen seinillä. Tämä esitys ei vielä ratkaise räystäskouru-, kattoreuna-, alapää-, purkupiste- tai koko putkilinjaliitoksia eikä ole exact XY/Z-, as-built-, CURRENT- tai canonical-väite.';

export const m5bCurrentReviewQuestionScope = m5bCurrentVerticalDownspoutReviewScope;

export const m5bPlannedSok2ReviewQuestionScope =
  'Katselussa arvioidaan vain suunnitelmapohjaisen SOK2-vertailuesityksen ymmärrettävyyttä suhteessa nykyisen M5B-kattosadevesikontekstin rajattuun WORK_TEST-esitykseen. Tämä ei ole tilaus-, toteuma-, CURRENT- tai as-built-väite.';

export const m5bCurrentVerticalDownspoutProxyMeaningById: Record<M5BVerticalDownspoutProxyId, string> = {
  M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1:
    'Pystysuuntainen syöksyränni-proxy rakennuksen nurkassa 1/4. Arvioi vain pystysuoran seinäosuuden sijaintia.',
  M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2:
    'Pystysuuntainen syöksyränni-proxy rakennuksen nurkassa 2/4. Arvioi vain pystysuoran seinäosuuden sijaintia.',
  M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3:
    'Pystysuuntainen syöksyränni-proxy rakennuksen nurkassa 3/4. Arvioi vain pystysuoran seinäosuuden sijaintia.',
  M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4:
    'Pystysuuntainen syöksyränni-proxy rakennuksen nurkassa 4/4. Arvioi vain pystysuoran seinäosuuden sijaintia.',
  M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B:
    'Pystysuuntainen syöksyränni-proxy eteläjulkisivulla C- ja B-rakennusten välissä. Arvioi vain pystysuoran seinäosuuden sijaintia.',
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

const getTargetMeaning = (variant: M5BReviewVariant, targetId: string) => {
  if (variant === 'CURRENT') {
    return m5bCurrentVerticalDownspoutProxyMeaningById[targetId as M5BVerticalDownspoutProxyId] ?? '';
  }
  return m5bPlannedSok2TargetMeaningById[targetId as (typeof m5bPlannedSok2TargetIds)[number]] ?? '';
};

export const getM5BReviewSceneIndex = (variant: M5BReviewVariant) =>
  variant === 'CURRENT' ? m5bCurrentSceneIndex : m5bPlannedSok2ComparisonSceneIndex;

const getObjectFingerprint = (object: any) => {
  const userData = object?.userData ?? {};
  return [
    object?.name,
    userData.G2Id,
    userData.G2IdCandidate,
    userData.sourceG2IdCandidate,
    userData.presentationRole,
    userData.layer,
    userData.system,
    userData.kind,
    userData.role,
    userData.objectRole,
    userData.semanticRole,
    userData.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const getRenderableWorldBox = (object: any) => {
  try {
    const box = new THREE.Box3().setFromObject(object);
    if (
      !Number.isFinite(box.min.x) ||
      !Number.isFinite(box.min.y) ||
      !Number.isFinite(box.min.z) ||
      !Number.isFinite(box.max.x) ||
      !Number.isFinite(box.max.y) ||
      !Number.isFinite(box.max.z)
    ) {
      return null;
    }
    const size = box.getSize(new THREE.Vector3());
    if (size.x <= 0.001 && size.y <= 0.001 && size.z <= 0.001) return null;
    return { box, size };
  } catch {
    return null;
  }
};

const m5bBuildingBoundsIncludeFingerprint =
  /building|rakenn|wall|seinä|facade|julkisivu|envelope|storage|varasto|sokkel|foundation|perustus|roof|katto|architecture|arkkitehtuuri|structure|rakenne/;

const m5bBuildingBoundsExcludeFingerprint =
  /terrain|maasto|contour|käyr|ground|storm|sadeves|route|gully|stub|downspout|ränni|kaivo|pipe|putki|drain|footprint|helper|reference|locus|source-label|label-anchor|grid|axis|camera/;

const m5bBuildingBoundsMaxHorizontalExtentM = 45;

const canContributeToBuildingBounds = (object: any, g2Id: string, targetIds: Set<string>) => {
  if (object.visible === false || targetIds.has(g2Id)) return false;
  const fingerprint = getObjectFingerprint(object);
  if (!fingerprint) return false;
  if (m5bBuildingBoundsExcludeFingerprint.test(fingerprint)) return false;
  if (!m5bBuildingBoundsIncludeFingerprint.test(fingerprint)) return false;
  const worldBox = getRenderableWorldBox(object);
  if (!worldBox) return false;
  const { size } = worldBox;
  const maxHorizontalExtent = Math.max(size.x, size.z);
  if (size.y < 1 || maxHorizontalExtent > m5bBuildingBoundsMaxHorizontalExtentM) return false;
  return true;
};

const createCurrentVerticalDownspoutProxy = (
  id: M5BVerticalDownspoutProxyId,
  position: { x: number; z: number },
  yBottom: number,
  yTop: number,
  questionScope: string,
  downspoutContext: string,
  shortFacadeLateralInsetM: number,
) => {
  const height = Math.max(0.5, Math.abs(yTop - yBottom));
  const yCenter = (yBottom + yTop) / 2;
  const material = new THREE.MeshBasicMaterial({
    color: 0x2fa8ff,
    opacity: m5bReviewTargetOpacity,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  material.userData = {
    ...(material.userData ?? {}),
    m5bReviewPresentation: true,
    m5bReviewVariant: 'CURRENT',
    m5bPresentationRole: 'VERTICAL_DOWNSPOUT_PROXY_80',
    m5bReviewRenderableForm: m5bVerticalDownspoutProxyRenderableForm,
  };
  const geometry = new THREE.CylinderGeometry(
    m5bVerticalDownspoutProxyRadius,
    m5bVerticalDownspoutProxyRadius,
    height,
    16,
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = id;
  mesh.position.set(position.x, yCenter, position.z);
  mesh.renderOrder = 2000;
  mesh.frustumCulled = false;
  mesh.userData = {
    G2Id: id,
    presentationOnly: true,
    workAssumption: true,
    viewerDerived: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalRouteClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    Canonical: false,
    publishToCURRENT: false,
    m5bReviewPresentation: true,
    m5bReviewVariant: 'CURRENT',
    m5bReviewRole: 'VERTICAL_DOWNSPOUT_PROXY_80',
    m5bReviewMeaning: m5bCurrentVerticalDownspoutProxyMeaningById[id],
    m5bReviewQuestionScope: questionScope,
    m5bVerticalDownspoutReviewScope: m5bCurrentVerticalDownspoutReviewScope,
    m5bDownspoutContext: downspoutContext,
    m5bReviewContentStatus: 'VERTICAL_DOWNSPOUT_LOCATION_PROXY_ONLY',
    m5bReviewRenderableForm: m5bVerticalDownspoutProxyRenderableForm,
    m5bReviewVisibilityFix: 'R1074_DEPTH_TEST_OFF_THICK_MESH_PROXY',
    m5bReviewWallBoundsFix: 'R1077_FILTERED_BUILDING_WALL_BOUNDS',
    m5bReviewShortFacadeLateralFix: m5bVerticalDownspoutShortFacadeLateralFix,
    m5bVerticalProxyRadiusM: m5bVerticalDownspoutProxyRadius,
    m5bVerticalProxyWallOffsetM: m5bVerticalDownspoutProxyWallOffset,
    m5bVerticalProxyShortFacadeLateralInsetM: shortFacadeLateralInsetM,
    m5bProxyPlacementBasis:
      'viewer-derived filtered wall/building/roof bounds with qualitative short-facade lateral inset from user-marked review feedback; presentation proxy only',
  };
  return mesh;
};

const getShortFacadeLateralInset = (size: any) =>
  Math.min(size.x, size.z) * m5bVerticalDownspoutShortFacadeLateralInsetRatio;

const addCurrentVerticalDownspoutProxies = (
  sceneRoot: any,
  buildingBounds: any,
  questionScope: string,
  downspoutContext: string,
) => {
  if (!buildingBounds || buildingBounds.isEmpty?.()) {
    return {
      ids: [] as string[],
      meanings: [] as string[],
      semanticViolations: 0,
      shortFacadeLateralInsetM: 0,
    };
  }
  const size = buildingBounds.getSize(new THREE.Vector3());
  if (size.x <= 0.001 || size.y <= 0.001 || size.z <= 0.001) {
    return {
      ids: [] as string[],
      meanings: [] as string[],
      semanticViolations: 0,
      shortFacadeLateralInsetM: 0,
    };
  }

  const offset = m5bVerticalDownspoutProxyWallOffset;
  const shortFacadeInset = getShortFacadeLateralInset(size);
  const xMin = buildingBounds.min.x;
  const xMax = buildingBounds.max.x;
  const zMin = buildingBounds.min.z;
  const zMax = buildingBounds.max.z;
  const yBottom = buildingBounds.min.y;
  const yTop = buildingBounds.max.y;
  const xMid = (xMin + xMax) / 2;
  const zMid = (zMin + zMax) / 2;
  const longAxis = size.x >= size.z ? 'X' : 'Z';

  const proxyPositions: Array<{
    id: M5BVerticalDownspoutProxyId;
    x: number;
    z: number;
    shortFacadeLateralInsetM: number;
  }> = longAxis === 'X'
    ? [
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1', x: xMin - offset, z: zMin + shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2', x: xMax + offset, z: zMin + shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3', x: xMax + offset, z: zMax - shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4', x: xMin - offset, z: zMax - shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B', x: xMid, z: zMin - offset, shortFacadeLateralInsetM: 0 },
      ]
    : [
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1', x: xMin + shortFacadeInset, z: zMin - offset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2', x: xMax - shortFacadeInset, z: zMin - offset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3', x: xMax - shortFacadeInset, z: zMax + offset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4', x: xMin + shortFacadeInset, z: zMax + offset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B', x: xMin + shortFacadeInset, z: zMid, shortFacadeLateralInsetM: 0 },
      ];

  const created: string[] = [];
  const meanings: string[] = [];
  let semanticViolations = 0;
  for (const proxy of proxyPositions) {
    const line = createCurrentVerticalDownspoutProxy(
      proxy.id,
      { x: proxy.x, z: proxy.z },
      yBottom,
      yTop,
      questionScope,
      downspoutContext,
      proxy.shortFacadeLateralInsetM,
    );
    sceneRoot?.add?.(line);
    created.push(proxy.id);
    meanings.push(m5bCurrentVerticalDownspoutProxyMeaningById[proxy.id]);
    if (!hasNoPromotionSemantics(line, 'CURRENT')) semanticViolations += 1;
  }
  return { ids: created, meanings, semanticViolations, shortFacadeLateralInsetM: shortFacadeInset };
};

export const prepareM5BReviewPresentation = (sceneRoot: any, variant: M5BReviewVariant) => {
  const targets = variant === 'CURRENT' ? m5bCurrentTargetIds : m5bPlannedSok2TargetIds;
  const targetIds = new Set<string>(targets);
  const currentRouteStubIds = new Set<string>(m5bCurrentRouteStubIds);
  const found = new Set<string>();
  const targetMeanings: string[] = [];
  const questionScope = getQuestionScope(variant);
  const downspoutContext = getDownspoutContext(variant);
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let suppressedCrossVariantCount = 0;
  let suppressedNonQuestionRouteCount = 0;
  let semanticViolationCount = 0;
  const buildingBounds = new THREE.Box3();
  let buildingBoundsContributorCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    const g2Id = String(object?.userData?.G2Id ?? object?.userData?.G2IdCandidate ?? '').trim();

    if (variant === 'CURRENT' && currentRouteStubIds.has(g2Id)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: variant,
        m5bReviewRole: 'OLD_ROUTE_STUB_SUPPRESSED_FOR_VERTICAL_DOWNSPOUT_REVIEW',
        m5bReviewQuestionScope: questionScope,
        m5bDownspoutContext: downspoutContext,
        m5bReviewContentStatus: 'SUPPRESSED_NOT_CURRENT_QUESTION_TARGET',
      };
      suppressedNonQuestionRouteCount += 1;
      return;
    }

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
      (variant === 'PLANNED_SOK2_COMPARISON' && g2Id === m5bCurrentRouteStubIds[1]);

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
    if (canContributeToBuildingBounds(object, g2Id, targetIds)) {
      const worldBox = getRenderableWorldBox(object);
      if (worldBox) {
        buildingBounds.union(worldBox.box);
        buildingBoundsContributorCount += 1;
      }
    }
    // The rebuilt Z2R scene61 stores the SOK1 context as source-bound comparison
    // geometry, not as a second G2Id/G2IdCandidate target.
    const isSok1ComparisonContext =
      variant === 'PLANNED_SOK2_COMPARISON' &&
      (g2Id === m5bCurrentRouteStubIds[0] ||
        (object?.userData?.presentationRole === 'CURRENT_SOK1_COMPARISON_CONTEXT' &&
          object?.userData?.sourceG2IdCandidate === m5bCurrentRouteStubIds[0] &&
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

  let verticalDownspoutProxyIds: string[] = [];
  let verticalDownspoutProxyMeanings: string[] = [];
  let shortFacadeLateralInsetM = 0;
  if (variant === 'CURRENT') {
    const proxyResult = addCurrentVerticalDownspoutProxies(
      sceneRoot,
      buildingBounds,
      questionScope,
      downspoutContext,
    );
    verticalDownspoutProxyIds = proxyResult.ids;
    verticalDownspoutProxyMeanings = proxyResult.meanings;
    shortFacadeLateralInsetM = proxyResult.shortFacadeLateralInsetM;
    semanticViolationCount += proxyResult.semanticViolations;
    targetRenderableCount = verticalDownspoutProxyIds.length;
    found.clear();
    for (const id of verticalDownspoutProxyIds) found.add(id);
    targetMeanings.splice(0, targetMeanings.length, ...verticalDownspoutProxyMeanings);
  }

  return {
    variant,
    sceneIndex: getM5BReviewSceneIndex(variant),
    targetRenderableCount,
    contextRenderableCount,
    suppressedCrossVariantCount,
    suppressedNonQuestionRouteCount,
    semanticViolationCount,
    buildingBoundsContributorCount,
    buildingBoundsPlacementBasis:
      variant === 'CURRENT' ? 'FILTERED_WALL_BUILDING_ROOF_CONTEXT_BOUNDS_WITH_SHORT_FACADE_LATERAL_INSET' : '',
    buildingBoundsMaxHorizontalExtentM: m5bBuildingBoundsMaxHorizontalExtentM,
    shortFacadeLateralInsetM,
    shortFacadeLateralFix: variant === 'CURRENT' ? m5bVerticalDownspoutShortFacadeLateralFix : '',
    foundTargetIds: [...found],
    missingTargetIds: targets.filter((id) => !found.has(id)),
    questionScope,
    downspoutContext,
    targetMeanings,
    verticalDownspoutProxyCount: verticalDownspoutProxyIds.length,
    verticalDownspoutProxyIds,
    verticalDownspoutReviewScope:
      variant === 'CURRENT' ? m5bCurrentVerticalDownspoutReviewScope : '',
    sourceRouteStubIds: variant === 'CURRENT' ? [...m5bCurrentRouteStubIds] : [],
  };
};
