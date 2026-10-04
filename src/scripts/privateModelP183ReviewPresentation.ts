import { THREE } from './threeRuntime';

export const p183P160ClosureTargetOpacity = 0.8;
export const p183P160ClosureContextOpacity = 0.2;

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
      targetBounds: null,
    };
  }

  const targetIdentities = new Set<string>();
  let targetRenderableCount = 0;
  targetScene.traverse((object: any) => {
    if (!isRenderable(object)) return;
    const identity = renderableIdentity(object);
    if (identity) targetIdentities.add(identity);
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
    object.renderOrder = Math.max(Number(object.renderOrder) || 0, 20);
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p183P160ClosurePresentation: true,
      p183ReviewRole: 'D_ARCHITECTURE_TARGET_80',
    };
    targetRenderableCount += 1;
  });

  let contextRenderableCount = 0;
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
    object.renderOrder = 0;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p183P160ClosurePresentation: true,
      p183ReviewRole: 'BUILDING_TERRAIN_CONTEXT_20',
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
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
