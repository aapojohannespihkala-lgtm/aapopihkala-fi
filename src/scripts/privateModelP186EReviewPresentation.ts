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

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

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
      clone.color?.setHex?.(p186eReviewContextColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186eReviewContextColorHex);
        clone.emissiveIntensity = 0.45;
      }
      clone.toneMapped = false;
      clone.userData = {
        ...(clone.userData ?? {}),
        p186eReviewContextHighlight: 'HIGH_CONTRAST_LIGHT',
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
    apartmentStorey: '1F',
    sourceFloorToken: '_1F_SRC',
    preferredRoomContextPrefix: 'P117D_REVIEW_',
    contextRole: 'D_1F_ARCH_CONTEXT_20',
  },
  D2F: {
    hostStorey: 'D_2F',
    floorToken: '_D_2F_',
    apartmentStorey: '2F',
    sourceFloorToken: '_2F_SRC',
    preferredRoomContextPrefix: 'P123C_CONTEXT_',
    contextRole: 'D_2F_ARCH_CONTEXT_20',
  },
} as const;

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

const isDArchitectureContext = (object: any, variant: P186EReviewVariant) => {
  if (isP186ETarget(object, variant)) return false;

  const contract = storeyContract[variant];
  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');
  const representationKind = String(data.representationKind ?? '');

  const isPreferredReviewRoomFootprint =
    presentationLayer === 'CURRENT_D' &&
    representationKind === 'referenceFootprint' &&
    g2Id.startsWith('G2_D15_SPACE_') &&
    g2Id.includes(contract.sourceFloorToken) &&
    name.startsWith(contract.preferredRoomContextPrefix);

  return (
    isPreferredReviewRoomFootprint ||
    (presentationLayer === 'CURRENT_D' &&
      (g2Id.includes(contract.floorToken) || name.includes(contract.floorToken))) ||
    (apartment === 'D' && storey === contract.apartmentStorey) ||
    g2Id.includes(contract.floorToken)
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

    if (isDArchitectureContext(object, variant)) {
      object.visible = true;
      cloneObjectMaterials(object, p186eReviewContextOpacity, contextRole);
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186eReviewPresentation: true,
        p186eReviewVariant: variant,
        p186eReviewRole: contextRole,
      };
      contextRenderableCount += 1;
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
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
  };
};
