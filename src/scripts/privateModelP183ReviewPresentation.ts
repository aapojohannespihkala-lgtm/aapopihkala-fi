import { THREE } from './threeRuntime';

export const p183P160ClosureTargetOpacity = 0.8;
export const p183P160ClosureContextOpacity = 0.2;
export const p183ContextRenderOrderBase = 100_000;
export const p183TargetSupportRenderOrderBase = 1_000_000;
export const p183TargetPrimaryRenderOrderBase = 2_000_000;
export const p183PhysicalWallRenderOrder = 0;

export const p183P178bIntegrationRootName =
  'P178B_D_PRECISE_STAIR_CONTEXT_WITH_GUARD_LOWWALL_CLOSURE_WORK_TEST';
export const p183LegacyIntegrationRootName =
  'P167F_D_PRECISE_STAIR_REBASE_INTEGRATION_ROOT_WORK_TEST';

export const resolveP183P160ClosureIntegrationRoot = (fullSceneSource: any) =>
  fullSceneSource?.getObjectByName?.(p183P178bIntegrationRootName) ??
  fullSceneSource?.getObjectByName?.(p183LegacyIntegrationRootName) ??
  null;

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const isP183AuxiliaryFloorSurface = (object: any) => {
  if (!object?.isMesh) return false;
  const representationKind = String(object?.userData?.representationKind ?? '');
  return representationKind === 'referenceFootprint' || representationKind === 'stairHostFootprint';
};

const isP183AuxiliaryReviewLine = (object: any) => {
  if (!(object?.isLine || object?.isLineSegments)) return false;
  const metadata = object?.userData ?? {};
  const isFootprintOutline =
    metadata.presentationOnly === true &&
    metadata.presentationLayer === 'CURRENT_D_OUTLINE' &&
    metadata.physicalWallClaim === false;
  const isFloorReferenceMarker =
    metadata.PresentationOnly === true &&
    metadata.markerType === 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR' &&
    metadata.physicalDoorVoid === false;
  return isFootprintOutline || isFloorReferenceMarker;
};

export type P183WallSemanticClass = 'EXTERIOR' | 'PARTY' | 'INTERIOR';

const p183WallSemanticClassFromG2Identity = (
  value: unknown,
): P183WallSemanticClass | null => {
  const identity = String(value ?? '').trim().toUpperCase();
  if (identity.startsWith('G2_WALL_EXT_')) return 'EXTERIOR';
  if (identity.startsWith('G2_WALL_PART_')) return 'PARTY';
  if (identity.startsWith('G2_WALL_INT_')) return 'INTERIOR';
  return null;
};

export const resolveP183WallSemanticClass = (
  object: any,
): P183WallSemanticClass | null =>
  p183WallSemanticClassFromG2Identity(object?.userData?.G2Id);

const p183WallOcclusionRepresentationKinds = new Set([
  'wallThicknessSolid',
  'wallThicknessSolidLowerExtension',
  'throughWallSeparatorWorkSolid',
  'localAsymmetricWallHostWorkEnvelope',
  'storageNorthWallCorrectedWorkEnvelope',
  'storageEastDoorLintelReemitWorkEnvelope',
  'storageEastWallNorthContinuationWorkEnvelope',
]);

export const isP183WallOcclusionSurface = (object: any) => {
  if (!object?.isMesh) return false;
  const metadata = object?.userData ?? {};
  if (resolveP183WallSemanticClass(object)) return true;
  if (typeof metadata.wallClass === 'string' && metadata.wallClass.trim()) return true;
  if (typeof metadata.wallHostAuthority === 'string' && metadata.wallHostAuthority.trim()) return true;
  if (Array.isArray(metadata.coveringHostIds) && metadata.coveringHostIds.length > 0) return true;
  if (metadata.physicalWallClaim === true) return true;
  if (metadata.physicalThicknessClaim === true) return true;
  if (metadata.physicalWallThicknessClaim === true) return true;
  const representationKind = String(metadata.representationKind ?? '');
  if (p183WallOcclusionRepresentationKinds.has(representationKind)) return true;
  const pass = String(metadata.Pass ?? metadata.pass ?? '');
  return pass === '123C' &&
    (Number.isInteger(metadata.sourceP122BNode) || Number.isInteger(metadata.sourceP123BNode));
};

const cloneObjectMaterials = (object: any, update: (material: any) => void) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    update(clone);
    return clone;
  };

  if (Array.isArray(object.material)) object.material = object.material.map(cloneOne);
  else if (object.material) object.material = cloneOne(object.material);
};

const renderableIdentity = (object: any) => {
  const name = String(object?.name ?? '').trim();
  return name || null;
};

const topLevelChildUnder = (object: any, root: any) => {
  let current = object;
  while (current?.parent && current.parent !== root) current = current.parent;
  return current?.parent === root ? current : null;
};

export const prepareP183P160ClosureReviewPresentation = (
  fullSceneSource: any,
  dArchitectureSource: any,
) => {
  const targetScene = dArchitectureSource?.clone?.(true) ?? null;
  const contextScene = fullSceneSource?.clone?.(true) ?? null;
  if (!targetScene || !contextScene) {
    return {
      composite: null,
      targetRenderableCount: 0,
      contextRenderableCount: 0,
      suppressedDuplicateContextCount: 0,
      hiddenAuxiliaryTargetCount: 0,
      hiddenAuxiliaryReviewLineCount: 0,
      targetBounds: null,
    };
  }

  const targetIdentities = new Set<string>();
  const structuredTargetChildren = targetScene.children.filter((child: any) => !isRenderable(child));
  const primaryTargetRoot = structuredTargetChildren[0] ?? targetScene;
  let targetPrimaryRenderOrderIndex = 0;
  let targetSupportRenderOrderIndex = 0;
  let targetRenderableCount = 0;
  let hiddenAuxiliaryTargetCount = 0;
  let hiddenAuxiliaryReviewLineCount = 0;
  targetScene.traverse((object: any) => {
    if (!isRenderable(object)) return;
    const identity = renderableIdentity(object);
    if (identity) targetIdentities.add(identity);
    if (isP183AuxiliaryFloorSurface(object)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p183P160ClosurePresentation: true,
        p183ReviewRole: 'AUXILIARY_FLOOR_SURFACE_SUPPRESSED',
        p183AuxiliaryFloorSurfaceHidden: true,
      };
      hiddenAuxiliaryTargetCount += 1;
      return;
    }
    if (isP183AuxiliaryReviewLine(object)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p183P160ClosurePresentation: true,
        p183ReviewRole: 'AUXILIARY_REVIEW_LINE_SUPPRESSED',
        p183AuxiliaryReviewLineHidden: true,
      };
      hiddenAuxiliaryReviewLineCount += 1;
      return;
    }
    cloneObjectMaterials(object, (material) => {
      material.opacity = p183P160ClosureTargetOpacity;
      material.transparent = true;
      material.depthTest = true;
      material.depthWrite = false;
      if ('side' in material) material.side = THREE.DoubleSide;
      material.userData = {
        ...(material.userData ?? {}),
        p183P160ClosurePresentation: true,
        p183PresentationRole: 'D_ARCHITECTURE_TARGET_80',
      };
      material.needsUpdate = true;
    });
    const topLevelTargetChild = topLevelChildUnder(object, targetScene);
    const isPrimaryDInterior =
      primaryTargetRoot === targetScene || topLevelTargetChild === primaryTargetRoot;
    const wallSemanticClass = resolveP183WallSemanticClass(object);
    const wallOcclusionSurface = isP183WallOcclusionSurface(object);
    const stableRenderOrder = wallOcclusionSurface
      ? p183PhysicalWallRenderOrder
      : isPrimaryDInterior
        ? p183TargetPrimaryRenderOrderBase + targetPrimaryRenderOrderIndex++
        : p183TargetSupportRenderOrderBase + targetSupportRenderOrderIndex++;
    object.renderOrder = stableRenderOrder;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p183P160ClosurePresentation: true,
      p183ReviewRole: 'D_ARCHITECTURE_TARGET_80',
      p183RenderBand: isPrimaryDInterior ? 'D_INTERIOR_PRIMARY' : 'TARGET_SUPPORT',
      p183StableRenderOrder: stableRenderOrder,
      ...(wallSemanticClass ? { p183WallSemanticClass: wallSemanticClass } : {}),
      ...(wallOcclusionSurface ? { p183PhysicalOcclusionSort: true } : {}),
    };
    targetRenderableCount += 1;
  });

  let contextRenderableCount = 0;
  let contextRenderOrderIndex = 0;
  let suppressedDuplicateContextCount = 0;
  contextScene.traverse((object: any) => {
    if (!isRenderable(object)) return;
    const identity = renderableIdentity(object);
    if (identity && targetIdentities.has(identity)) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p183P160ClosurePresentation: true,
        p183ReviewRole: 'DUPLICATE_TARGET_SUPPRESSED',
      };
      suppressedDuplicateContextCount += 1;
      return;
    }

    cloneObjectMaterials(object, (material) => {
      material.opacity = p183P160ClosureContextOpacity;
      material.transparent = true;
      material.depthWrite = false;
      material.userData = {
        ...(material.userData ?? {}),
        p183P160ClosurePresentation: true,
        p183PresentationRole: 'BUILDING_TERRAIN_CONTEXT_20',
      };
      material.needsUpdate = true;
    });
    const wallSemanticClass = resolveP183WallSemanticClass(object);
    const wallOcclusionSurface = isP183WallOcclusionSurface(object);
    const stableRenderOrder = wallOcclusionSurface
      ? p183PhysicalWallRenderOrder
      : p183ContextRenderOrderBase + contextRenderOrderIndex++;
    object.renderOrder = stableRenderOrder;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p183P160ClosurePresentation: true,
      p183ReviewRole: 'BUILDING_TERRAIN_CONTEXT_20',
      p183RenderBand: 'BUILDING_TERRAIN_CONTEXT',
      p183StableRenderOrder: stableRenderOrder,
      ...(wallSemanticClass ? { p183WallSemanticClass: wallSemanticClass } : {}),
      ...(wallOcclusionSurface ? { p183PhysicalOcclusionSort: true } : {}),
    };
    contextRenderableCount += 1;
  });

  targetScene.updateMatrixWorld?.(true);
  const targetBounds = new THREE.Box3().setFromObject(targetScene);
  const hasTargetBounds = !targetBounds.isEmpty();

  const composite = new THREE.Group();
  composite.name = 'P183_P160_BASELINE_CLOSURE_REVIEW_COMPOSITE_VIEWER_ONLY';
  composite.userData = {
    PresentationOnly: true,
    Canonical: false,
    viewerDerived: true,
    p183P160ClosurePresentation: true,
    sourceContract: 'P178B_EXACT_GEOMETRY_P160_HR7_CLOSURE_PRESENTATION',
    currentClaim: false,
    asBuiltClaim: false,
  };
  composite.add(contextScene, targetScene);

  return {
    composite,
    targetRenderableCount,
    contextRenderableCount,
    suppressedDuplicateContextCount,
    hiddenAuxiliaryTargetCount,
    hiddenAuxiliaryReviewLineCount,
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
