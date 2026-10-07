export const p186dReviewTargetOpacity = 0.8;
export const p186dReviewContextOpacity = 0.2;

export const p186dTargetRepresentationKind = 'luminaireSourceSymbolAnchorMarker' as const;
export const p186dPositionSourcePdfDriveId = '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';
export const p186dSchedulePdfDriveId = '1ECKFc86WM8gjz3LfrcZFKdpvSQjGmZ_9';
export const p186dSourcePositionBindingSha256 =
  'a77b274fb3abab21e7ae3af9fbbba41839d55fa295106916ab4ac713c4cedc16';

export const p186dExpectedD1fTargetCount = 22;
export const p186dExpectedD1fPosCounts = {
  1: 13,
  2: 6,
  4: 3,
} as const;

export const p186dExpectedD2fTargetCount = 12;
export const p186dExpectedD2fPosCounts = {
  2: 1,
  3: 10,
  5: 1,
} as const;

export type P186DReviewVariant = 'D1F' | 'D2F';

export const p186dReviewSourceContexts = [
  {
    sourceLabel: 'Johdotus.me_design.pdf',
    sourceHref: `https://drive.google.com/file/d/${p186dPositionSourcePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_SOURCE_GRAPHIC_POSITION',
  },
  {
    sourceLabel: 'valaisinluettelo.me_design.pdf',
    sourceHref: `https://drive.google.com/file/d/${p186dSchedulePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_SOURCE_SCHEDULE',
  },
] as const;

export const p186dReviewSourceLimit =
  'Vuoden 2015 suunnitelmasta johdetut sourceSymbolCenter-ankkurit ja valaisinluettelon Pos-tyypit. Ei fyysinen nykyvalaisimen sijainti tai geometria, exact XY/Z, current-, as-built- tai canonical-väite.';

const scheduleContract = new Map<number, {
  sourceScheduleSnro: string;
  sourceScheduleType: string;
  sourceSchedulePlannedQty: number;
}>([
  [1, { sourceScheduleSnro: '4142068', sourceScheduleType: 'Lilja 6W', sourceSchedulePlannedQty: 13 }],
  [2, { sourceScheduleSnro: '4141926', sourceScheduleType: 'Helmi Lasikuutio 8W', sourceSchedulePlannedQty: 7 }],
  [3, { sourceScheduleSnro: '4142045', sourceScheduleType: 'Iiris 8W', sourceSchedulePlannedQty: 10 }],
  [4, { sourceScheduleSnro: '4159104', sourceScheduleType: 'ELIFE LED LIMPPU IP44 TUTKA', sourceSchedulePlannedQty: 3 }],
  [5, { sourceScheduleSnro: '4141966', sourceScheduleType: 'Lilja 16W', sourceSchedulePlannedQty: 1 }],
]);

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
        p186dReviewHighlight: 'HIGH_CONTRAST_AMBER',
      };
    }
    clone.userData = {
      ...(clone.userData ?? {}),
      p186dReviewPresentation: true,
      p186dPresentationRole: role,
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
    contextRole: 'D_1F_ARCH_CONTEXT_20',
  },
  D2F: {
    hostStorey: 'D_2F',
    floorToken: '_D_2F_',
    apartmentStorey: '2F',
    contextRole: 'D_2F_ARCH_CONTEXT_20',
  },
} as const;

const isP186DTarget = (object: any, variant: P186DReviewVariant) => {
  const data = object?.userData ?? {};
  const contract = storeyContract[variant];
  return (
    String(data.Pass ?? '') === 'P186D-X1' &&
    String(data.hostStorey ?? '') === contract.hostStorey &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    String(data.representationKind ?? '') === p186dTargetRepresentationKind
  );
};

const isDArchitectureContext = (object: any, variant: P186DReviewVariant) => {
  if (isP186DTarget(object, variant)) return false;

  const contract = storeyContract[variant];
  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');

  return (
    (presentationLayer === 'CURRENT_D' &&
      (g2Id.includes(contract.floorToken) || name.includes(contract.floorToken))) ||
    (apartment === 'D' && storey === contract.apartmentStorey) ||
    g2Id.includes(contract.floorToken)
  );
};

const hasNoPromotionAndSourceSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const sourcePos = Number(data.sourcePos);
  const schedule = scheduleContract.get(sourcePos);

  return (
    data.Canonical === false &&
    data.canonical === false &&
    data.sourceSymbolCenter === true &&
    String(data.sourceCoordinateClass ?? '') === 'R_VECTOR_PAGE_CALIBRATED' &&
    String(data.positionTypeBinding ?? '') === 'HIGH_CONFIDENCE_DERIVED' &&
    String(data.sourcePdfDriveId ?? '') === p186dPositionSourcePdfDriveId &&
    String(data.schedulePdfDriveId ?? '') === p186dSchedulePdfDriveId &&
    String(data.sourcePositionBindingSha256 ?? '') === p186dSourcePositionBindingSha256 &&
    schedule !== undefined &&
    String(data.sourceScheduleSnro ?? '') === schedule.sourceScheduleSnro &&
    String(data.sourceScheduleType ?? '') === schedule.sourceScheduleType &&
    Number(data.sourceSchedulePlannedQty) === schedule.sourceSchedulePlannedQty &&
    data.presentationOnly === true &&
    data.physicalLuminaireGeometryClaim === false &&
    data.exactCurrentXYClaim === false &&
    data.exactZClaim === false &&
    data.currentGeometryClaim === false &&
    data.current === false &&
    data.asBuilt === false &&
    data.publishToCURRENT === false &&
    String(data.HUMAN_REVIEW ?? '') === 'NOT_RUN'
  );
};

export const prepareP186DReviewPresentation = (
  sceneRoot: any,
  variant: P186DReviewVariant = 'D1F',
) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundPosCounts = new Map<number, number>();
  let semanticViolationCount = 0;

  const expectedPosCounts =
    variant === 'D2F' ? p186dExpectedD2fPosCounts : p186dExpectedD1fPosCounts;
  const contextRole = storeyContract[variant].contextRole;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP186DTarget(object, variant)) return;

    targets.push(object);
    const sourcePos = Number(object.userData?.sourcePos);
    foundPosCounts.set(sourcePos, (foundPosCounts.get(sourcePos) ?? 0) + 1);
    if (!hasNoPromotionAndSourceSemantics(object)) semanticViolationCount += 1;
  });

  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p186dReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186dReviewPresentation: true,
      p186dReviewVariant: variant,
      p186dReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;
  }

  for (const object of renderables) {
    if (isP186DTarget(object, variant)) continue;

    if (isDArchitectureContext(object, variant)) {
      object.visible = true;
      cloneObjectMaterials(object, p186dReviewContextOpacity, contextRole);
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186dReviewPresentation: true,
        p186dReviewVariant: variant,
        p186dReviewRole: contextRole,
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186dReviewPresentation: true,
      p186dReviewVariant: variant,
      p186dReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  const missingTargetPos = Object.entries(expectedPosCounts)
    .filter(([pos, count]) => foundPosCounts.get(Number(pos)) !== count)
    .map(([pos]) => Number(pos));

  return {
    variant,
    targetRenderableCount,
    contextRenderableCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    foundTargetPosCounts: Object.fromEntries(
      [...foundPosCounts.entries()].sort(([a], [b]) => a - b),
    ) as Record<number, number>,
    missingTargetPos,
  };
};
