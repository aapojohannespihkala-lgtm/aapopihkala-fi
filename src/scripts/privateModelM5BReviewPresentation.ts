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

export const m5bR1109SceneIndex = 63;
export const m5bR1109PersistedTargetIds = [
  'G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_01_001',
  'G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_02_001',
  'G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_03_001',
  'G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_04_001',
  'G2_STORM_DOWNSPOUT_PRESENCE_SOUTH_CB_ZONE_001',
] as const;

export type M5BR1109PersistedTargetId = (typeof m5bR1109PersistedTargetIds)[number];

export const m5bR1109ReviewQuestionScope =
  'Katselussa arvioidaan vain viiden lähteellä vahvistetun syöksytorven source-presence-vyöhykkeen ymmärrettävyyttä: neljä rakennuksen nurkkavyöhykettä ja yksi eteläjulkisivun C-B-vyöhyke. Markkerit ovat WORK_TEST-esityksiä, eivät fyysisiä putki-, halkaisija-, exact XY/Z-, reitti-, CURRENT-, canonical- tai as-built-väitteitä.';

export const m5bR1109TargetMeaningById: Record<M5BR1109PersistedTargetId, string> = {
  G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_01_001:
    'Source-presence WORK_TEST -vyöhyke rakennuksen nurkassa 1/4.',
  G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_02_001:
    'Source-presence WORK_TEST -vyöhyke rakennuksen nurkassa 2/4.',
  G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_03_001:
    'Source-presence WORK_TEST -vyöhyke rakennuksen nurkassa 3/4.',
  G2_STORM_DOWNSPOUT_PRESENCE_CORNER_ZONE_04_001:
    'Source-presence WORK_TEST -vyöhyke rakennuksen nurkassa 4/4.',
  G2_STORM_DOWNSPOUT_PRESENCE_SOUTH_CB_ZONE_001:
    'Source-presence WORK_TEST -vyöhyke eteläjulkisivulla C- ja B-rakennusten välissä.',
};

export const m5bReviewTargetOpacity = 0.8;
export const m5bReviewContextOpacity = 0.2;
export const m5bVerticalDownspoutProxyRadius = 0.08;
export const m5bVerticalDownspoutProxyWallOffset = 0.45;
export const m5bVerticalDownspoutWallAttachmentOffset = 0;
export const m5bVerticalDownspoutWallSkinInsetMinM = m5bVerticalDownspoutProxyRadius * 1.5;
export const m5bVerticalDownspoutShortFacadeLateralInsetRatio = 0.18;
export const m5bVerticalDownspoutShortFacadeLateralFix = 'R1081_SHORT_FACADE_LATERAL_INSET';
export const m5bVerticalDownspoutWallAttachmentFix = 'R1094_TRUE_SHORT_FACADE_EAVE_WALL_ANCHOR';
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
type M5BPresentationVariant = M5BReviewVariant | 'R1109_PERSISTED_ZONES';

type BoundsReadiness = {
  ids: string[];
  meanings: string[];
  semanticViolations: number;
  shortFacadeLateralInsetM: number;
  wallSkinInsetM: number;
  wallTopY: number;
  wallAttachedCount: number;
};

const isRenderable = (object: any) =>
  Boolean(object?.material && (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints));

const cloneMaterials = (object: any, opacity: number, role: string, variant: M5BPresentationVariant) => {
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
  const values: string[] = [];
  let current = object;
  let depth = 0;
  while (current && depth < 8) {
    const userData = current?.userData ?? {};
    values.push(
      current?.name,
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
    );
    current = current.parent;
    depth += 1;
  }
  return values.filter(Boolean).join(' ').toLowerCase();
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

const m5bWallEnvelopeIncludeFingerprint =
  /wall|seinä|facade|julkisivu|envelope|storage|varasto|sokkel|foundation|perustus|building|rakenn|architecture|arkkitehtuuri|structure|rakenne/;

const m5bWallEnvelopeExcludeFingerprint =
  /terrain|maasto|contour|käyr|ground|storm|sadeves|route|gully|stub|downspout|ränni|kaivo|pipe|putki|drain|footprint|helper|reference|locus|source-label|label-anchor|grid|axis|camera|roof|katto|eave|räyst/;

const m5bBuildingBoundsExcludeFingerprint =
  /terrain|maasto|contour|käyr|ground|storm|sadeves|route|gully|stub|downspout|ränni|kaivo|pipe|putki|drain|footprint|helper|reference|locus|source-label|label-anchor|grid|axis|camera/;

const m5bBuildingBoundsMaxHorizontalExtentM = 45;

const canContributeToBounds = (
  object: any,
  g2Id: string,
  targetIds: Set<string>,
  includePattern: RegExp,
  excludePattern: RegExp,
) => {
  if (object.visible === false || targetIds.has(g2Id)) return false;
  const fingerprint = getObjectFingerprint(object);
  if (!fingerprint) return false;
  if (excludePattern.test(fingerprint)) return false;
  if (!includePattern.test(fingerprint)) return false;
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
  wallSkinInsetM: number,
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
    m5bReviewWallAttachmentFix: m5bVerticalDownspoutWallAttachmentFix,
    m5bReviewTrueWallAnchorFix: m5bVerticalDownspoutWallAttachmentFix,
    m5bVerticalProxyRadiusM: m5bVerticalDownspoutProxyRadius,
    m5bVerticalProxyWallOffsetM: m5bVerticalDownspoutProxyWallOffset,
    m5bVerticalProxyWallAttachmentOffsetM: m5bVerticalDownspoutWallAttachmentOffset,
    m5bVerticalProxyWallSkinInsetM: wallSkinInsetM,
    m5bVerticalProxyShortFacadeLateralInsetM: shortFacadeLateralInsetM,
    m5bVerticalProxyWallAttached: true,
    m5bVerticalProxyEaveUnderRoof: true,
    m5bProxyPlacementBasis:
      'viewer-derived wall-skin/eave-under-roof anchor: four short-facade proxies are moved inward into the wall skin from the facade plane and stop below the roof/eave; presentation proxy only',
  };
  return mesh;
};

const getShortFacadeLateralInset = (size: any) =>
  Math.min(size.x, size.z) * m5bVerticalDownspoutShortFacadeLateralInsetRatio;

const getWallSkinInset = (size: any) =>
  Math.max(
    m5bVerticalDownspoutWallSkinInsetMinM,
    Math.min(size.x, size.z) * 0.015,
  );

const getEaveUnderRoofTopY = (bounds: any, size: any) =>
  bounds.max.y - Math.min(0.65, Math.max(0.25, size.y * 0.1));

const emptyProxyResult = (): BoundsReadiness => ({
  ids: [],
  meanings: [],
  semanticViolations: 0,
  shortFacadeLateralInsetM: 0,
  wallSkinInsetM: 0,
  wallTopY: 0,
  wallAttachedCount: 0,
});

const addCurrentVerticalDownspoutProxies = (
  sceneRoot: any,
  wallEnvelopeBounds: any,
  questionScope: string,
  downspoutContext: string,
): BoundsReadiness => {
  if (!wallEnvelopeBounds || wallEnvelopeBounds.isEmpty?.()) return emptyProxyResult();
  const size = wallEnvelopeBounds.getSize(new THREE.Vector3());
  if (size.x <= 0.001 || size.y <= 0.001 || size.z <= 0.001) return emptyProxyResult();

  const offset = m5bVerticalDownspoutProxyWallOffset;
  const shortFacadeInset = getShortFacadeLateralInset(size);
  const wallSkinInset = getWallSkinInset(size);
  const xMin = wallEnvelopeBounds.min.x;
  const xMax = wallEnvelopeBounds.max.x;
  const zMin = wallEnvelopeBounds.min.z;
  const zMax = wallEnvelopeBounds.max.z;
  const yBottom = wallEnvelopeBounds.min.y;
  const yTop = Math.max(yBottom + 0.5, getEaveUnderRoofTopY(wallEnvelopeBounds, size));
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
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1', x: xMin + wallSkinInset, z: zMin + shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2', x: xMax - wallSkinInset, z: zMin + shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3', x: xMax - wallSkinInset, z: zMax - shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4', x: xMin + wallSkinInset, z: zMax - shortFacadeInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B', x: xMid, z: zMin - offset, shortFacadeLateralInsetM: 0 },
      ]
    : [
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1', x: xMin + shortFacadeInset, z: zMin + wallSkinInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2', x: xMax - shortFacadeInset, z: zMin + wallSkinInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3', x: xMax - shortFacadeInset, z: zMax - wallSkinInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4', x: xMin + shortFacadeInset, z: zMax - wallSkinInset, shortFacadeLateralInsetM: shortFacadeInset },
        { id: 'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B', x: xMin - offset, z: zMid, shortFacadeLateralInsetM: 0 },
      ];

  const created: string[] = [];
  const meanings: string[] = [];
  let semanticViolations = 0;
  let wallAttachedCount = 0;
  for (const proxy of proxyPositions) {
    const line = createCurrentVerticalDownspoutProxy(
      proxy.id,
      { x: proxy.x, z: proxy.z },
      yBottom,
      yTop,
      questionScope,
      downspoutContext,
      proxy.shortFacadeLateralInsetM,
      proxy.id.includes('_CORNER_') ? wallSkinInset : 0,
    );
    sceneRoot?.add?.(line);
    created.push(proxy.id);
    meanings.push(m5bCurrentVerticalDownspoutProxyMeaningById[proxy.id]);
    if (proxy.id.includes('_CORNER_')) wallAttachedCount += 1;
    if (!hasNoPromotionSemantics(line, 'CURRENT')) semanticViolations += 1;
  }
  return {
    ids: created,
    meanings,
    semanticViolations,
    shortFacadeLateralInsetM: shortFacadeInset,
    wallSkinInsetM: wallSkinInset,
    wallTopY: yTop,
    wallAttachedCount,
  };
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
  const wallEnvelopeBounds = new THREE.Box3();
  let buildingBoundsContributorCount = 0;
  let wallEnvelopeContributorCount = 0;

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
    const worldBox = getRenderableWorldBox(object);
    if (worldBox && canContributeToBounds(
      object,
      g2Id,
      targetIds,
      m5bBuildingBoundsIncludeFingerprint,
      m5bBuildingBoundsExcludeFingerprint,
    )) {
      buildingBounds.union(worldBox.box);
      buildingBoundsContributorCount += 1;
    }
    if (worldBox && canContributeToBounds(
      object,
      g2Id,
      targetIds,
      m5bWallEnvelopeIncludeFingerprint,
      m5bWallEnvelopeExcludeFingerprint,
    )) {
      wallEnvelopeBounds.union(worldBox.box);
      wallEnvelopeContributorCount += 1;
    }

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

  const placementBounds = !wallEnvelopeBounds.isEmpty?.()
    ? wallEnvelopeBounds
    : buildingBounds;

  let verticalDownspoutProxyIds: string[] = [];
  let verticalDownspoutProxyMeanings: string[] = [];
  let shortFacadeLateralInsetM = 0;
  let wallSkinInsetM = 0;
  let wallTopY = 0;
  let wallAttachedCount = 0;
  if (variant === 'CURRENT') {
    const proxyResult = addCurrentVerticalDownspoutProxies(
      sceneRoot,
      placementBounds,
      questionScope,
      downspoutContext,
    );
    verticalDownspoutProxyIds = proxyResult.ids;
    verticalDownspoutProxyMeanings = proxyResult.meanings;
    shortFacadeLateralInsetM = proxyResult.shortFacadeLateralInsetM;
    wallSkinInsetM = proxyResult.wallSkinInsetM;
    wallTopY = proxyResult.wallTopY;
    wallAttachedCount = proxyResult.wallAttachedCount;
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
    wallEnvelopeContributorCount,
    buildingBoundsPlacementBasis:
      variant === 'CURRENT'
        ? 'WALL_SKIN_OR_FALLBACK_BUILDING_CONTEXT_BOUNDS_WITH_SHORT_FACADE_LATERAL_INSET_AND_EAVE_UNDER_ROOF_ANCHOR'
        : '',
    buildingBoundsMaxHorizontalExtentM: m5bBuildingBoundsMaxHorizontalExtentM,
    shortFacadeLateralInsetM,
    wallSkinInsetM,
    wallTopY,
    wallAttachedCount,
    shortFacadeLateralFix: variant === 'CURRENT' ? m5bVerticalDownspoutShortFacadeLateralFix : '',
    wallAttachmentFix: variant === 'CURRENT' ? m5bVerticalDownspoutWallAttachmentFix : '',
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

const hasR1109PersistedZoneSemantics = (object: any) => {
  const data = object?.userData ?? {};
  return (
    data.representationKind === 'downspoutPresenceZoneWork' &&
    data.sourcePresenceConfirmed === true &&
    data.presentationOnly === true &&
    data.workAssumption === true &&
    data.reviewTarget === true &&
    data.proxyDimensionsStatus === 'WORK_ASSUMPTION_NOT_SOURCE_DIMENSION' &&
    data.physicalDownspoutHostClaim === false &&
    data.exactXYClaim === false &&
    data.exactZClaim === false &&
    data.physicalRouteClaim === false &&
    data.physicalDiameterClaim === false &&
    data.physicalElevationClaim === false &&
    data.currentGeometryClaim === false &&
    data.asBuiltClaim === false &&
    data.Canonical === false &&
    data.canonical === false &&
    data.publishToCURRENT === false &&
    data.hydraulicConnectionToM5A === false &&
    data.downspoutPresenceToCurrentRouteLinkCount === 0 &&
    data.sourceBoundaryContract === 'G2_R1108' &&
    data.HUMAN_REVIEW === 'NOT_RUN'
  );
};

const makeR1109TargetReviewVisible = (object: any, id: M5BR1109PersistedTargetId) => {
  object.visible = true;
  object.renderOrder = Math.max(Number(object.renderOrder ?? 0), 2000);
  object.frustumCulled = false;
  cloneMaterials(object, m5bReviewTargetOpacity, 'R1109_DOWNSPOUT_PRESENCE_ZONE_80', 'R1109_PERSISTED_ZONES');
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) {
    if (!material) continue;
    material.depthTest = false;
    material.depthWrite = false;
    material.needsUpdate = true;
  }
  object.userData = {
    ...(object.userData ?? {}),
    viewerDerived: true,
    m5bReviewPresentation: true,
    m5bReviewVariant: 'R1109_PERSISTED_ZONES',
    m5bReviewRole: 'R1109_DOWNSPOUT_PRESENCE_ZONE_80',
    m5bReviewMeaning: m5bR1109TargetMeaningById[id],
    m5bReviewQuestionScope: m5bR1109ReviewQuestionScope,
    m5bDownspoutContext: m5bCurrentDownspoutContext,
    m5bReviewContentStatus: 'PERSISTED_SOURCE_PRESENCE_ZONE_WORK_TEST',
    m5bReviewRenderableForm: 'PERSISTED_RECTANGULAR_ZONE_BAR_NOT_PIPE',
    m5bReviewSourceSceneIndex: m5bR1109SceneIndex,
  };
};

export const prepareM5BR1109PersistedZonePresentation = (sceneRoot: any) => {
  const targetSet = new Set<string>(m5bR1109PersistedTargetIds);
  const suppressSet = new Set<string>([
    ...m5bCurrentRouteStubIds,
    ...m5bPlannedSok2TargetIds,
  ]);
  const foundById = new Map<string, any[]>(
    m5bR1109PersistedTargetIds.map((id) => [id, []]),
  );
  const targetRenderables: any[] = [];
  let contextRenderableCount = 0;
  let suppressedLegacyStormwaterCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    const g2Id = String(object?.userData?.G2Id ?? object?.userData?.G2IdCandidate ?? '').trim();

    if (targetSet.has(g2Id)) {
      foundById.get(g2Id)?.push(object);
      targetRenderables.push(object);
      return;
    }

    if (suppressSet.has(g2Id)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: 'R1109_PERSISTED_ZONES',
        m5bReviewRole: 'R1109_NON_QUESTION_STORMWATER_SUPPRESSED',
        m5bReviewQuestionScope: m5bR1109ReviewQuestionScope,
      };
      suppressedLegacyStormwaterCount += 1;
      return;
    }

    if (object.visible === false) return;
    cloneMaterials(object, m5bReviewContextOpacity, 'R1109_BUILDING_CONTEXT_20', 'R1109_PERSISTED_ZONES');
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      m5bReviewPresentation: true,
      m5bReviewVariant: 'R1109_PERSISTED_ZONES',
      m5bReviewRole: 'R1109_BUILDING_CONTEXT_20',
      m5bReviewQuestionScope: m5bR1109ReviewQuestionScope,
      m5bDownspoutContext: m5bCurrentDownspoutContext,
      m5bReviewContentStatus: 'CLARITY_CONTEXT_20',
    };
    contextRenderableCount += 1;
  });

  const foundTargetIds: M5BR1109PersistedTargetId[] = [];
  const missingTargetIds: M5BR1109PersistedTargetId[] = [];
  const duplicateTargetIds: M5BR1109PersistedTargetId[] = [];
  const semanticViolationTargetIds: M5BR1109PersistedTargetId[] = [];

  for (const id of m5bR1109PersistedTargetIds) {
    const objects = foundById.get(id) ?? [];
    if (objects.length === 0) {
      missingTargetIds.push(id);
      continue;
    }
    foundTargetIds.push(id);
    if (objects.length > 1) duplicateTargetIds.push(id);
    if (objects.some((object) => !hasR1109PersistedZoneSemantics(object))) {
      semanticViolationTargetIds.push(id);
    }
  }

  const ready =
    foundTargetIds.length === m5bR1109PersistedTargetIds.length &&
    missingTargetIds.length === 0 &&
    duplicateTargetIds.length === 0 &&
    semanticViolationTargetIds.length === 0;

  if (ready) {
    for (const id of m5bR1109PersistedTargetIds) {
      const object = (foundById.get(id) ?? [])[0];
      if (object) makeR1109TargetReviewVisible(object, id);
    }
  } else {
    for (const object of targetRenderables) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        m5bReviewPresentation: true,
        m5bReviewVariant: 'R1109_PERSISTED_ZONES',
        m5bReviewRole: 'R1109_TARGET_FAIL_CLOSED',
        m5bReviewQuestionScope: m5bR1109ReviewQuestionScope,
        m5bReviewContentStatus: 'FAIL_CLOSED_SOURCE_CONTRACT_MISMATCH',
      };
    }
  }

  return {
    variant: 'R1109_PERSISTED_ZONES' as const,
    sceneIndex: m5bR1109SceneIndex,
    ready,
    targetRenderableCount: ready ? targetRenderables.length : 0,
    sourceTargetRenderableCount: targetRenderables.length,
    contextRenderableCount,
    suppressedLegacyStormwaterCount,
    foundTargetIds,
    missingTargetIds,
    duplicateTargetIds,
    semanticViolationTargetIds,
    semanticViolationCount: semanticViolationTargetIds.length,
    targetMeanings: foundTargetIds.map((id) => m5bR1109TargetMeaningById[id]),
    questionScope: m5bR1109ReviewQuestionScope,
    downspoutContext: m5bCurrentDownspoutContext,
    createdProxyCount: 0,
    usesPersistedSourceTargets: true,
  };
};

