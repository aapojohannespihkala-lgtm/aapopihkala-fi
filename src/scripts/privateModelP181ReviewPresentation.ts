import { THREE } from './threeRuntime';

export const p181GroundContactReviewTargetOpacity = 0.8;
export const p181GroundContactReviewContextOpacity = 0.2;
export const p181GroundContactReviewTargetKind = 'acStorageSubstructurePositiveVolumeWorkEnvelope';
export const p181GroundContactReviewTerrainKind =
  'presentationNearBuildingTerrainWithACStorageContactCuts';

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

export const prepareP181GroundContactReviewPresentation = (sceneRoot: any) => {
  const targetObjects: any[] = [];
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let terrainContextRenderableCount = 0;

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;

    const data = object.userData ?? {};
    const pass = String(data.Pass ?? '');
    const representationKind = String(data.representationKind ?? '');
    const isTarget =
      pass === 'P181B-R1' && representationKind === p181GroundContactReviewTargetKind;
    const isTerrainContext =
      pass === 'P181B-R1' && representationKind === p181GroundContactReviewTerrainKind;
    const opacity = isTarget
      ? p181GroundContactReviewTargetOpacity
      : p181GroundContactReviewContextOpacity;

    cloneObjectMaterials(object, (material) => {
      material.opacity = opacity;
      material.transparent = true;
      material.depthWrite = isTarget;
      material.userData = {
        ...(material.userData ?? {}),
        p181GroundContactReviewPresentation: true,
        p181PresentationRole: isTarget ? 'QUESTION_TARGET_80' : 'QUESTION_CONTEXT_20',
      };
      material.needsUpdate = true;
    });

    object.renderOrder = isTarget ? 20 : 0;
    object.userData = {
      ...data,
      viewerDerived: true,
      p181GroundContactReviewPresentation: true,
      p181ReviewRole: isTarget ? 'QUESTION_TARGET_80' : 'QUESTION_CONTEXT_20',
    };

    if (isTarget) {
      targetObjects.push(object);
      targetRenderableCount += 1;
    } else {
      contextRenderableCount += 1;
      if (isTerrainContext) terrainContextRenderableCount += 1;
    }
  });

  sceneRoot?.updateMatrixWorld?.(true);
  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  for (const object of targetObjects) {
    const objectBounds = new THREE.Box3().setFromObject(object);
    if (objectBounds.isEmpty()) continue;
    if (!hasTargetBounds) {
      targetBounds.copy(objectBounds);
      hasTargetBounds = true;
    } else {
      targetBounds.union(objectBounds);
    }
  }

  return {
    targetRenderableCount,
    contextRenderableCount,
    terrainContextRenderableCount,
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
