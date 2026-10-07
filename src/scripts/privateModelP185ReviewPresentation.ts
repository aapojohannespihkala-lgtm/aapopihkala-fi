import { THREE } from './threeRuntime';

export const p185ReviewTargetOpacity = 0.8;
export const p185ReviewContextOpacity = 0.2;
export const p185ReviewSourceOverlayColorHex = 0x7dd3fc;
export const p185ReviewPanelMarkerColorHex = 0xfacc15;

export const p185TargetRepresentationKinds = [
  'sourceVectorPlanOverlay',
  'electricalPanelSourceLabelAnchorMarker',
] as const;

const targetKindSet = new Set<string>(p185TargetRepresentationKinds);

type P185ReviewTargetContract = {
  pass: 'P185C' | 'P185C-X2';
  floorHeatingSourcePdfDriveId: string;
};

const legacyP185ReviewTargetContract: P185ReviewTargetContract = {
  pass: 'P185C',
  floorHeatingSourcePdfDriveId: '1vAyvAHdClqkXIVNgKKUyOjMja-tzrok',
};

const p185X2ReviewTargetContract: P185ReviewTargetContract = {
  pass: 'P185C-X2',
  floorHeatingSourcePdfDriveId: '1vAyvAHdClqkXKIVNgKKUyOjMja-tzrok',
};

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const cloneObjectMaterials = (
  object: any,
  opacity: number,
  role: string,
  representationKind = '',
) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;
    if (role === 'QUESTION_TARGET_80') {
      const colorHex =
        representationKind === 'electricalPanelSourceLabelAnchorMarker'
          ? p185ReviewPanelMarkerColorHex
          : p185ReviewSourceOverlayColorHex;
      clone.color?.setHex?.(colorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(colorHex);
        clone.emissiveIntensity = 1;
      }
      clone.depthTest = false;
      clone.toneMapped = false;
    }
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

const isP185Target = (
  object: any,
  contract: P185ReviewTargetContract = legacyP185ReviewTargetContract,
) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === contract.pass &&
    String(data.hostStorey ?? '') === 'D_1F' &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    targetKindSet.has(String(data.representationKind ?? ''))
  );
};

const isD1FArchitectureContext = (
  object: any,
  contract: P185ReviewTargetContract = legacyP185ReviewTargetContract,
) => {
  if (isP185Target(object, contract)) return false;

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

const hasNoPromotionSemantics = (
  object: any,
  contract: P185ReviewTargetContract = legacyP185ReviewTargetContract,
) => {
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
      String(data.sourcePdfDriveId ?? '') === contract.floorHeatingSourcePdfDriveId &&
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

const prepareP185ReviewPresentationForContract = (
  sceneRoot: any,
  contract: P185ReviewTargetContract,
) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundKinds = new Set<string>();
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP185Target(object, contract)) return;
    targets.push(object);
    foundKinds.add(String(object.userData?.representationKind ?? ''));
    if (!hasNoPromotionSemantics(object, contract)) semanticViolationCount += 1;
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(
      object,
      p185ReviewTargetOpacity,
      'QUESTION_TARGET_80',
      String(object.userData?.representationKind ?? ''),
    );
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
    if (isP185Target(object, contract)) continue;

    if (isD1FArchitectureContext(object, contract)) {
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

export const prepareP185ReviewPresentation = (sceneRoot: any) =>
  prepareP185ReviewPresentationForContract(sceneRoot, legacyP185ReviewTargetContract);

export const prepareP185X2ReviewPresentation = (sceneRoot: any) =>
  prepareP185ReviewPresentationForContract(sceneRoot, p185X2ReviewTargetContract);

export const p184hApplianceReviewTargetOpacity = 0.8;
export const p184hApplianceReviewContextOpacity = 0.2;

export const p184hApplianceAidRoles = ['oven', 'cooktop'] as const;

const p184hApplianceAidRoleSet = new Set<string>(p184hApplianceAidRoles);
const p184hIslandG2Id = 'G2_FURN_D_2F_KITCHEN_ISLAND_001';
const p184hSourcePlanDriveId = '1G04Dye0etHSTAMgqabstPOfrEFnuFjWl';

const isP184hApplianceTarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'P184H' &&
    String(data.representationKind ?? '') === 'appliancePlacementPresentationAid' &&
    String(data.hostG2Id ?? '') === p184hIslandG2Id &&
    String(data.hostStorey ?? '') === 'D_2F' &&
    String(data.presentationLayer ?? '') === 'D_ARCH_FURNITURE_AIDS' &&
    p184hApplianceAidRoleSet.has(String(data.semanticRole ?? ''))
  );
};

const isP184hApplianceContext = (object: any) => {
  if (isP184hApplianceTarget(object)) return false;

  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');
  const hostStorey = String(data.hostStorey ?? '');

  if (g2Id === p184hIslandG2Id) return true;

  return (
    (presentationLayer === 'CURRENT_D' && (g2Id.includes('_D_2F_') || name.includes('_D_2F_'))) ||
    (apartment === 'D' && storey === '2F') ||
    (hostStorey === 'D_2F' && String(data.representationKind ?? '') !== 'appliancePlacementPresentationAid') ||
    g2Id.includes('_D_2F_')
  );
};

const hasP184hNoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const semanticRole = String(data.semanticRole ?? '');
  const presentationAidId = String(data.presentationAidId ?? '');

  if (
    String(data.Pass ?? '') !== 'P184H' ||
    String(data.representationKind ?? '') !== 'appliancePlacementPresentationAid' ||
    String(data.hostG2Id ?? '') !== p184hIslandG2Id ||
    String(data.sourcePlanDriveId ?? '') !== p184hSourcePlanDriveId ||
    data.Canonical !== false ||
    data.applianceGeometryClaim !== false ||
    data.physicalApplianceFootprintClaim !== false ||
    data.exactXYClaim !== false ||
    data.exactZClaim !== false ||
    data.current !== false ||
    data.asBuilt !== false ||
    data.publishToCURRENT !== false ||
    String(data.HUMAN_REVIEW ?? '') !== 'NOT_RUN'
  ) {
    return false;
  }

  if (semanticRole === 'oven') {
    return presentationAidId === 'P184H_APPLIANCE_AID_OVEN_001';
  }
  if (semanticRole === 'cooktop') {
    return presentationAidId === 'P184H_APPLIANCE_AID_COOKTOP_001';
  }
  return false;
};

const cloneP184hObjectMaterials = (object: any, opacity: number, role: string) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = role === 'P184H_APPLIANCE_TARGET_80';
    clone.userData = {
      ...(clone.userData ?? {}),
      p184hApplianceReviewPresentation: true,
      p184hAppliancePresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

export const prepareP184hApplianceAidReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundRoles = new Set<string>();
  let semanticViolationCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP184hApplianceTarget(object)) return;
    targets.push(object);
    foundRoles.add(String(object.userData?.semanticRole ?? ''));
    if (!hasP184hNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let islandContextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneP184hObjectMaterials(object, p184hApplianceReviewTargetOpacity, 'P184H_APPLIANCE_TARGET_80');
    object.renderOrder = 20;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p184hApplianceReviewPresentation: true,
      p184hApplianceReviewRole: 'P184H_APPLIANCE_TARGET_80',
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
    if (isP184hApplianceTarget(object)) continue;

    if (isP184hApplianceContext(object)) {
      object.visible = true;
      cloneP184hObjectMaterials(object, p184hApplianceReviewContextOpacity, 'D_2F_KITCHEN_CONTEXT_20');
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p184hApplianceReviewPresentation: true,
        p184hApplianceReviewRole: 'D_2F_KITCHEN_CONTEXT_20',
      };
      contextRenderableCount += 1;
      if (String(object.userData?.G2Id ?? '') === p184hIslandG2Id) {
        islandContextRenderableCount += 1;
      }
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p184hApplianceReviewPresentation: true,
      p184hApplianceReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  return {
    targetRenderableCount,
    contextRenderableCount,
    islandContextRenderableCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    foundTargetSemanticRoles: [...foundRoles],
    missingTargetSemanticRoles: p184hApplianceAidRoles.filter((role) => !foundRoles.has(role)),
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};

