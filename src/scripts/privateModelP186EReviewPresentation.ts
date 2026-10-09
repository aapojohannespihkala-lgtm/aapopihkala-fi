import { THREE } from './threeRuntime';

export const p186eReviewTargetOpacity = 0.8;
export const p186eReviewContextOpacity = 0.2;
export const p186eReviewContextColorHex = 0xe2e8f0;

export const p186eGroupRepresentationKind = 'electricalGroupSourceLabelAnchor' as const;
export const p186eSpecialRepresentationKind = 'electricalSpecialSourceLabelAnchor' as const;
export const p186ePositionSourcePdfDriveId = '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';
export const p186eSchedulePdfDriveId = '1-dioYKOAol67GyH0rl5cQ-omRcoeWAkP';
export const p186eGroupAnchorListSha256 =
  '3ed8dc953a37318e833a86f4ca84d10049930970bab56c6d7137cf1456c839df';
export const p186eSpecialAnchorListSha256 =
  '20c1b09e574bdfc3ecd53248603c7123a12a260379b2130515bac03a37fe680c';

export const p186eExpectedCounts = {
  D1F: { total: 18, group: 14, special: 4 },
  D2F: { total: 16, group: 15, special: 1 },
} as const;

export type P186EReviewVariant = keyof typeof p186eExpectedCounts;

export const p186eReviewSourceContexts = [
  {
    sourceLabel: 'Johdotus.me_design.pdf',
    sourceHref: `https://drive.google.com/file/d/${p186ePositionSourcePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_SOURCE_GRAPHIC_LABEL_POSITION',
  },
  {
    sourceLabel: 'D2015 sähköryhmäluettelo / keskuskaavio',
    sourceHref: `https://drive.google.com/file/d/${p186eSchedulePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_SOURCE_GROUP_SCHEDULE',
  },
] as const;

export const p186eReviewSourceLimit =
  'Vuoden 2015 suunnitelmasta johdetut ryhmänumero- ja erikoistekstien source-label-ankkurit. Auttaa lähdepaikannuksessa; ei fyysisen laitteen, pistorasian, kytkimen tai kaapelireitin sijainti, eikä exact-, current-, as-built- tai canonical-väite.';

export const p186eReviewSuppressedContextFragments = [
  'referencefootprint',
  'roomfootprint',
  'room-footprint',
  'stairhostfootprint',
  'helper',
  'p117d_review_',
  'p123c_context_',
] as const;

export const p186eReviewRealContextFragments = [
  'wall',
  'building',
  'architect',
  'door',
  'window',
  'opening',
  'stair',
  'floor',
  'slab',
  'partition',
] as const;

export const p186eReviewKnownDArchitectureRootFragments = [
  'p173d_d_wall',
  'p177b_whole_building',
  'p154c',
] as const;

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

// A recognizable wall/root name alone is not evidence of a drawable solid.
// Keep review walls restricted to actual triangle meshes with finite bounds;
// line, point and empty proxy objects must not satisfy wall readiness.
const hasDrawableSolidWall = (object: any) => {
  if (object?.isMesh !== true || !object?.geometry) return false;
  const geometry = object.geometry;
  const positionCount = Number(geometry.attributes?.position?.count ?? 0);
  const indexCount = geometry.index ? Number(geometry.index.count ?? 0) : positionCount;
  const drawRangeCount = Number(geometry.drawRange?.count ?? Infinity);
  if (!Number.isFinite(positionCount) || positionCount < 3) return false;
  if (!Number.isFinite(indexCount) || indexCount < 3) return false;
  if (drawRangeCount <= 0 || (Number.isFinite(drawRangeCount) && drawRangeCount < 3)) return false;

  const bounds = new THREE.Box3().setFromObject(object);
  return !bounds.isEmpty() && [
    bounds.min.x, bounds.min.y, bounds.min.z,
    bounds.max.x, bounds.max.y, bounds.max.z,
  ].every(Number.isFinite);
};

const cloneObjectMaterials = (object: any, opacity: number, role: string) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;
    if (role === 'QUESTION_TARGET_80') {
      clone.depthTest = false;
      clone.color?.setHex?.(0xffd34d);
      clone.emissive?.setHex?.(0x332400);
      clone.userData = {
        ...(clone.userData ?? {}),
        p186eReviewHighlight: 'HIGH_CONTRAST_AMBER',
      };
    }
    if (role.endsWith('_ARCH_CONTEXT_20')) {
      clone.depthTest = false;
      clone.depthWrite = false;
      clone.color?.setHex?.(p186eReviewContextColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186eReviewContextColorHex);
        clone.emissiveIntensity = Math.max(Number(clone.emissiveIntensity ?? 0), 0.85);
      }
      clone.toneMapped = false;
      clone.polygonOffset = true;
      clone.polygonOffsetFactor = -1;
      clone.polygonOffsetUnits = -1;
      clone.linewidth = Math.max(Number(clone.linewidth ?? 1), 2);
      clone.userData = {
        ...(clone.userData ?? {}),
        p186eReviewContextHighlight: 'HIGH_CONTRAST_LIGHT',
        p186eReviewContextVisibilityFix:
          'R1082_ANCESTOR_ROOT_AND_HIGH_CONTRAST_CONTEXT',
      };
    }
    clone.userData = {
      ...(clone.userData ?? {}),
      p186eReviewPresentation: true,
      p186ePresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const storeyContract = {
  D1F: {
    hostStorey: 'D_1F',
    floorToken: '_D_1F_',
    compactFloorToken: 'D1F',
    genericFloorToken: '1F',
    apartmentStorey: '1F',
    sourceFloorToken: '_1F_SRC',
    preferredRoomContextPrefix: 'P117D_REVIEW_',
    contextRole: 'D_1F_ARCH_CONTEXT_20',
  },
  D2F: {
    hostStorey: 'D_2F',
    floorToken: '_D_2F_',
    compactFloorToken: 'D2F',
    genericFloorToken: '2F',
    apartmentStorey: '2F',
    sourceFloorToken: '_2F_SRC',
    preferredRoomContextPrefix: 'P123C_CONTEXT_',
    contextRole: 'D_2F_ARCH_CONTEXT_20',
  },
} as const;

type StoreyContract = (typeof storeyContract)[P186EReviewVariant];

const targetKind = (object: any): 'group' | 'special' | null => {
  const kind = String(object?.userData?.representationKind ?? '');
  if (kind === p186eGroupRepresentationKind) return 'group';
  if (kind === p186eSpecialRepresentationKind) return 'special';
  return null;
};

const isP186ETarget = (object: any, variant: P186EReviewVariant) => {
  const data = object?.userData ?? {};
  const contract = storeyContract[variant];
  return (
    String(data.Pass ?? '') === 'P186E-X1' &&
    String(data.hostStorey ?? '') === contract.hostStorey &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    targetKind(object) !== null
  );
};

const p186eContextValues = (object: any) => {
  const data = object?.userData ?? {};
  return [
    object?.name,
    data.G2Id,
    data.G2IdCandidate,
    data.presentationLayer,
    data.representationKind,
    data.presentationRole,
    data.role,
    data.semanticRole,
    data.contextRole,
    data.sourceScene,
  ];
};

const p186eContextText = (object: any) => {
  const values: unknown[] = [];
  let current = object;
  let depth = 0;

  while (current && depth < 8) {
    values.push(...p186eContextValues(current));
    current = current.parent;
    depth += 1;
  }

  return values
    .map((value) => String(value ?? ''))
    .join(' ')
    .toLowerCase();
};

export const isP186ESuppressedReviewContext = (object: any) => {
  if (!isRenderable(object)) return false;
  const text = p186eContextText(object);
  return p186eReviewSuppressedContextFragments.some((fragment) => text.includes(fragment));
};

const isP186ERealWallContextCandidate = (object: any) => {
  if (!isRenderable(object)) return false;
  const text = p186eContextText(object);
  return p186eReviewRealContextFragments.some((fragment) => text.includes(fragment));
};

const isP186EKnownDArchitectureRoot = (object: any) => {
  if (!isRenderable(object)) return false;
  const text = p186eContextText(object);
  return p186eReviewKnownDArchitectureRootFragments.some((fragment) => text.includes(fragment));
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasSegmentToken = (value: string, token: string) => {
  if (!token) return false;
  return new RegExp(`(^|[^A-Z0-9])${escapeRegex(token)}([^A-Z0-9]|$)`, 'i').test(value);
};

const hasStoreySourceIdentity = (value: string, contract: StoreyContract) =>
  value.includes(contract.floorToken) ||
  value.includes(contract.sourceFloorToken) ||
  hasSegmentToken(value, contract.compactFloorToken) ||
  hasSegmentToken(value, contract.genericFloorToken);

const hasAnyStoreySourceIdentity = (contract: StoreyContract, values: string[]) =>
  values.some((value) => hasStoreySourceIdentity(value, contract));

const isP186EExplicitOppositeFloorContext = (
  object: any,
  variant: P186EReviewVariant,
) => {
  const oppositeContract = variant === 'D1F' ? storeyContract.D2F : storeyContract.D1F;
  const data = object?.userData ?? {};
  const hostStorey = String(data.hostStorey ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  const name = String(object?.name ?? '');
  const sourceScene = String(data.sourceScene ?? '');

  return (
    hostStorey === oppositeContract.hostStorey ||
    (apartment === 'D' && storey === oppositeContract.apartmentStorey) ||
    hasAnyStoreySourceIdentity(oppositeContract, [g2Id, name, sourceScene])
  );
};

const isDArchitectureContext = (object: any, variant: P186EReviewVariant) => {
  if (!hasDrawableSolidWall(object)) return false;
  if (isP186ETarget(object, variant)) return false;
  if (isP186ESuppressedReviewContext(object)) return false;
  if (isP186EExplicitOppositeFloorContext(object, variant)) return false;

  const knownDArchitectureRoot = isP186EKnownDArchitectureRoot(object);
  if (!knownDArchitectureRoot && !isP186ERealWallContextCandidate(object)) return false;

  const contract = storeyContract[variant];
  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  const name = String(object?.name ?? '');
  const sourceScene = String(data.sourceScene ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');

  return (
    knownDArchitectureRoot ||
    (presentationLayer === 'CURRENT_D' &&
      hasAnyStoreySourceIdentity(contract, [g2Id, name, sourceScene])) ||
    (apartment === 'D' && storey === contract.apartmentStorey) ||
    hasAnyStoreySourceIdentity(contract, [g2Id, name, sourceScene])
  );
};

const hasNoPromotionAndSourceSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const kind = targetKind(object);
  const commonPass =
    data.Canonical === false &&
    data.canonical === false &&
    String(data.sourcePdfDriveId ?? '') === p186ePositionSourcePdfDriveId &&
    data.presentationOnly === true &&
    data.sourceDerived === true &&
    data.sourceLabelAnchor === true &&
    data.deviceGeometryClaim === false &&
    data.socketGeometryClaim === false &&
    data.switchOrFixtureClaim === false &&
    data.physicalCableRouteClaim === false &&
    data.connectionTopologyClaim === false &&
    data.exactCurrentXYClaim === false &&
    data.exactZClaim === false &&
    data.currentGeometryClaim === false &&
    data.current === false &&
    data.asBuilt === false &&
    data.publishToCURRENT === false &&
    String(data.HUMAN_REVIEW ?? '') === 'NOT_RUN';

  if (!commonPass) return false;

  if (kind === 'group') {
    return (
      String(data.schedulePdfDriveId ?? '') === p186eSchedulePdfDriveId &&
      String(data.sourceAnchorListSha256 ?? '') === p186eGroupAnchorListSha256 &&
      String(data.sourceBindingClass ?? '') ===
        'SOURCE_DIRECT_GROUP_LABEL_PLUS_EXACT_GROUP_KEY_SCHEDULE_JOIN' &&
      String(data.annotationStableKey ?? '').length > 0 &&
      String(data.sourceGroupKey ?? '').length > 0 &&
      String(data.sourceScheduleName ?? '').length > 0
    );
  }

  if (kind === 'special') {
    return (
      String(data.sourceBindingListSha256 ?? '') === p186eSpecialAnchorListSha256 &&
      String(data.sourceLabelId ?? '').length > 0 &&
      String(data.sourceText ?? '').length > 0 &&
      String(data.sourceSemantic ?? '').length > 0
    );
  }

  return false;
};

export const prepareP186EReviewPresentation = (
  sceneRoot: any,
  variant: P186EReviewVariant = 'D1F',
) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  let semanticViolationCount = 0;
  let groupTargetCount = 0;
  let specialTargetCount = 0;

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP186ETarget(object, variant)) return;

    targets.push(object);
    const kind = targetKind(object);
    if (kind === 'group') groupTargetCount += 1;
    if (kind === 'special') specialTargetCount += 1;
    if (!hasNoPromotionAndSourceSemantics(object)) semanticViolationCount += 1;
  });

  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;
  let realWallContextRenderableCount = 0;
  let suppressedHelperContextCount = 0;
  const contextRole = storeyContract[variant].contextRole;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p186eReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186eReviewPresentation: true,
      p186eReviewVariant: variant,
      p186eReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;
  }

  for (const object of renderables) {
    if (isP186ETarget(object, variant)) continue;

    if (isP186ESuppressedReviewContext(object)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186eReviewPresentation: true,
        p186eReviewVariant: variant,
        p186eReviewRole: 'P186E_HELPER_CONTEXT_SUPPRESSED',
      };
      suppressedHelperContextCount += 1;
      hiddenNonQuestionRenderableCount += 1;
      continue;
    }

    if (isDArchitectureContext(object, variant)) {
      const knownDArchitectureRoot = isP186EKnownDArchitectureRoot(object);
      object.visible = true;
      cloneObjectMaterials(object, p186eReviewContextOpacity, contextRole);
      object.renderOrder = 20;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186eReviewPresentation: true,
        p186eReviewVariant: variant,
        p186eReviewRole: contextRole,
        p186eReviewContextSource: knownDArchitectureRoot
          ? 'KNOWN_D_ARCHITECTURE_ROOT'
          : 'EXPLICIT_D_STOREY_CONTEXT',
      };
      contextRenderableCount += 1;
      realWallContextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186eReviewPresentation: true,
      p186eReviewVariant: variant,
      p186eReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  return {
    variant,
    targetRenderableCount,
    groupTargetCount,
    specialTargetCount,
    contextRenderableCount,
    realWallContextRenderableCount,
    suppressedHelperContextCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
  };
};
