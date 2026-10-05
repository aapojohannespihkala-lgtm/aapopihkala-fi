import { THREE } from './threeRuntime';

export const p185ReviewTargetOpacity = 0.8;
export const p185ReviewContextOpacity = 0.2;

export const p185TargetRepresentationKinds = [
  'sourceVectorPlanOverlay',
  'electricalPanelSourceLabelAnchorMarker',
] as const;

const targetKindSet = new Set<string>(p185TargetRepresentationKinds);

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
      p185ReviewPresentation: true,
      p185PresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isP185Target = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'P185C' &&
    String(data.hostStorey ?? '') === 'D_1F' &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    targetKindSet.has(String(data.representationKind ?? ''))
  );
};

const isD1FArchitectureContext = (object: any) => {
  if (isP185Target(object)) return false;

  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');
  return (
    (presentationLayer === 'CURRENT_D' && (g2Id.includes('_D_1F_') || name.includes('_D_1F_'))) ||
    (apartment === 'D' && storey === '1F') ||
    g2Id.includes('_D_1F_')
  );
};

const hasNoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const kind = String(data.representationKind ?? '');

  if (
    data.Canonical !== false ||
    data.exactXYClaim !== false ||
    data.exactZClaim !== false ||
    data.physicalCableRouteClaim !== false ||
    data.current !== false ||
    data.asBuilt !== false ||
    data.publishToCURRENT !== false ||
    String(data.HUMAN_REVIEW ?? '') !== 'NOT_RUN'
  ) {
    return false;
  }

  if (kind === 'sourceVectorPlanOverlay') {
    return (
      String(data.sourcePdfDriveId ?? '') === '1vAyvAHdClqkXIVNgKKUyOjMja-tzrok' &&
      data.floorHeatingCableGeometryClaim === false &&
      data.closedHeatingZoneClaim === false &&
      Number(data.sourceFragmentCount) === 366
    );
  }

  if (kind === 'electricalPanelSourceLabelAnchorMarker') {
    return (
      String(data.sourcePdfDriveId ?? '') === '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg' &&
      data.electricalPanelGeometryClaim === false &&
      String(data.sourceText ?? '') === 'RYHMäKESKUS RK'
    );
  }

  return false;
};

export const prepareP185ReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundKinds = new Set<string>();
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP185Target(object)) return;
    targets.push(object);
    foundKinds.add(String(object.userData?.representationKind ?? ''));
    if (!hasNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p185ReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 20;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p185ReviewPresentation: true,
      p185ReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;

    sceneRoot?.updateMatrixWorld?.(true);
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

  for (const object of renderables) {
    if (isP185Target(object)) continue;

    if (isD1FArchitectureContext(object)) {
      object.visible = true;
      cloneObjectMaterials(object, p185ReviewContextOpacity, 'D_1F_ARCH_CONTEXT_20');
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p185ReviewPresentation: true,
        p185ReviewRole: 'D_1F_ARCH_CONTEXT_20',
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p185ReviewPresentation: true,
      p185ReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  return {
    targetRenderableCount,
    contextRenderableCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    foundTargetRepresentationKinds: [...foundKinds],
    missingTargetRepresentationKinds: p185TargetRepresentationKinds.filter(
      (kind) => !foundKinds.has(kind),
    ),
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
