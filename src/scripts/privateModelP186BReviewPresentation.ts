export const p186bReviewTargetOpacity = 0.8;
export const p186bReviewContextOpacity = 0.2;

export const p186bTargetRepresentationKind = 'sourceVectorPlanLineOverlay' as const;
export const p186bSourcePdfDriveId = '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';

export const p186bTargetSelectors = [
  {
    sourceSelector: 'BLACK_LINE_PATH_STROKE_WIDTH_0.84PT',
    sourceLineItemCount: 5701,
  },
  {
    sourceSelector: 'BLACK_LINE_PATH_STROKE_WIDTH_1.08PT',
    sourceLineItemCount: 1622,
  },
] as const;

export const p186bExpectedSourceLineItemCount = p186bTargetSelectors.reduce(
  (sum, target) => sum + target.sourceLineItemCount,
  0,
);

const selectorContract = new Map<string, number>(
  p186bTargetSelectors.map((target) => [
    target.sourceSelector,
    target.sourceLineItemCount,
  ]),
);

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
    clone.depthWrite = role === 'QUESTION_TARGET_80';
    clone.userData = {
      ...(clone.userData ?? {}),
      p186bReviewPresentation: true,
      p186bPresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isP186BTarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'P186B' &&
    String(data.hostStorey ?? '') === 'D_2F' &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    String(data.representationKind ?? '') === p186bTargetRepresentationKind
  );
};

const isD2FArchitectureContext = (object: any) => {
  if (isP186BTarget(object)) return false;

  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');

  return (
    (presentationLayer === 'CURRENT_D' &&
      (g2Id.includes('_D_2F_') || name.includes('_D_2F_'))) ||
    (apartment === 'D' && storey === '2F') ||
    g2Id.includes('_D_2F_')
  );
};

const hasNoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const sourceSelector = String(data.sourceSelector ?? '');
  const expectedLineCount = selectorContract.get(sourceSelector);

  return (
    data.Canonical === false &&
    data.canonical === false &&
    data.sourceGraphicOnly === true &&
    data.presentationOnly === true &&
    data.physicalCableRouteClaim === false &&
    data.deviceGeometryClaim === false &&
    data.symbolSemanticClaim === false &&
    data.exactZClaim === false &&
    data.currentGeometryClaim === false &&
    data.current === false &&
    data.asBuilt === false &&
    data.publishToCURRENT === false &&
    String(data.HUMAN_REVIEW ?? '') === 'NOT_RUN' &&
    String(data.sourcePdfDriveId ?? '') === p186bSourcePdfDriveId &&
    expectedLineCount !== undefined &&
    Number(data.sourceLineItemCount) === expectedLineCount
  );
};

export const prepareP186BReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundSelectors = new Set<string>();
  let semanticViolationCount = 0;
  let sourceLineItemCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP186BTarget(object)) return;

    targets.push(object);
    const sourceSelector = String(object.userData?.sourceSelector ?? '');
    foundSelectors.add(sourceSelector);
    sourceLineItemCount += Number(object.userData?.sourceLineItemCount ?? 0);
    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p186bReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 20;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186bReviewPresentation: true,
      p186bReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;
  }

  for (const object of renderables) {
    if (isP186BTarget(object)) continue;

    if (isD2FArchitectureContext(object)) {
      object.visible = true;
      cloneObjectMaterials(object, p186bReviewContextOpacity, 'D_2F_ARCH_CONTEXT_20');
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186bReviewPresentation: true,
        p186bReviewRole: 'D_2F_ARCH_CONTEXT_20',
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186bReviewPresentation: true,
      p186bReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  return {
    targetRenderableCount,
    contextRenderableCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    sourceLineItemCount,
    foundTargetSelectors: [...foundSelectors],
    missingTargetSelectors: p186bTargetSelectors
      .map((target) => target.sourceSelector)
      .filter((selector) => !foundSelectors.has(selector)),
  };
};
