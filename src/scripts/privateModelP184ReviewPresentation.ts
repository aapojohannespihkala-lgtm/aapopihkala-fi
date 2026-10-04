import { THREE } from './threeRuntime';

export const p184DReviewTargetOpacity = 0.8;
export const p184DReviewContextOpacity = 0.2;
export const p184DTargetG2Id = 'G2_FURN_D_2F_KITCHEN_ISLAND_001';
export const p184DTargetRepresentationKind = 'fixedFurnitureWorkSolid';
export const p184DCabinetFrontReferenceKind = 'SOURCE_CHAIN_CABINET_FRONT_X_REFERENCE';

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

const isP184DIslandTarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'P184D' &&
    String(data.G2Id ?? '') === p184DTargetG2Id &&
    String(data.representationKind ?? '') === p184DTargetRepresentationKind
  );
};

const isP184DImmediateD2FContext = (object: any) => {
  const data = object?.userData ?? {};
  const g2Id = String(data.G2Id ?? '');
  const name = String(object?.name ?? '');
  const presentationLayer = String(data.presentationLayer ?? '');
  const representationKind = String(data.representationKind ?? '');
  const apartment = String(data.apartment ?? '');
  const storey = String(data.storey ?? '');

  const currentD2FReference =
    presentationLayer === 'CURRENT_D' && (g2Id.includes('_2F_') || name.includes('_D_2F_'));
  const explicitD2FArchitecture = g2Id.includes('_D_2F_');
  const explicitApartmentStorey = apartment === 'D' && storey === '2F';
  const d2fFloorShell =
    representationKind === 'presentationFloorWorkShellWithPreciseStairClearance' &&
    name.includes('CD_2F_WORKSHELL');

  return (
    currentD2FReference ||
    explicitD2FArchitecture ||
    explicitApartmentStorey ||
    d2fFloorShell
  );
};

export const prepareP184DReviewPresentation = (sceneRoot: any) => {
  const renderableObjects: any[] = [];
  const targetObjects: any[] = [];

  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderableObjects.push(object);
    if (isP184DIslandTarget(object)) targetObjects.push(object);
  });

  let targetRenderableCount = 0;
  for (const object of targetObjects) {
    cloneObjectMaterials(object, (material) => {
      material.opacity = p184DReviewTargetOpacity;
      material.transparent = true;
      material.depthWrite = true;
      material.userData = {
        ...(material.userData ?? {}),
        p184DReviewPresentation: true,
        p184DPresentationRole: 'ISLAND_TARGET_80',
      };
      material.needsUpdate = true;
    });

    object.visible = true;
    object.renderOrder = 20;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p184DReviewPresentation: true,
      p184DReviewRole: 'ISLAND_TARGET_80',
    };
    targetRenderableCount += 1;
  }

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

  let contextRenderableCount = 0;
  let hiddenNonTargetRenderableCount = 0;

  for (const object of renderableObjects) {
    if (isP184DIslandTarget(object)) continue;

    if (isP184DImmediateD2FContext(object)) {
      object.visible = true;
      cloneObjectMaterials(object, (material) => {
        material.opacity = p184DReviewContextOpacity;
        material.transparent = true;
        material.depthWrite = false;
        material.userData = {
          ...(material.userData ?? {}),
          p184DReviewPresentation: true,
          p184DPresentationRole: 'D_2F_ARCH_CONTEXT_20',
        };
        material.needsUpdate = true;
      });
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p184DReviewPresentation: true,
        p184DReviewRole: 'D_2F_ARCH_CONTEXT_20',
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p184DReviewPresentation: true,
      p184DReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonTargetRenderableCount += 1;
  }

  let cabinetFrontReferenceRenderableCount = 0;
  let cabinetFrontWorldX: number | null = null;
  let sourceChainCabinetFrontXM: number | null = null;

  const target = targetObjects[0] ?? null;
  if (target && hasTargetBounds) {
    const cabinetFrontX = Number(target.userData?.sourceChainCabinetFrontXM);
    const targetLocalX = Number(target.position?.x);

    if (Number.isFinite(cabinetFrontX) && Number.isFinite(targetLocalX)) {
      const targetCenter = targetBounds.getCenter(new THREE.Vector3());
      const targetSize = targetBounds.getSize(new THREE.Vector3());
      cabinetFrontWorldX = targetCenter.x + (cabinetFrontX - targetLocalX);
      sourceChainCabinetFrontXM = cabinetFrontX;

      const geometry = new THREE.PlaneGeometry(
        Math.max(targetSize.z, 1e-6),
        Math.max(targetSize.y, 1e-6),
      );
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: p184DReviewContextOpacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      material.userData = {
        p184DReviewPresentation: true,
        p184DPresentationRole: 'SOURCE_CHAIN_CABINET_FRONT_REFERENCE_20',
        physicalCabinetGeometryClaim: false,
      };

      const reference = new THREE.Mesh(geometry, material);
      reference.name = 'P184D_SOURCE_CHAIN_CABINET_FRONT_X_REFERENCE_VIEWER_ONLY';
      reference.rotation.y = Math.PI / 2;
      reference.position.set(cabinetFrontWorldX, targetCenter.y, targetCenter.z);
      reference.renderOrder = 10;
      reference.userData = {
        PresentationOnly: true,
        viewerDerived: true,
        p184DReviewPresentation: true,
        p184DReviewRole: 'SOURCE_CHAIN_CABINET_FRONT_REFERENCE_20',
        representationKind: p184DCabinetFrontReferenceKind,
        sourceChainCabinetFrontXM: cabinetFrontX,
        extentBasis: 'P184D_TARGET_BOUNDS_ONLY',
        physicalCabinetGeometryClaim: false,
        physicalCabinetFrontClaim: false,
        exactXYClaim: false,
        currentClaim: false,
        asBuiltClaim: false,
        Canonical: false,
        publishToCURRENT: false,
      };
      sceneRoot.add(reference);
      cabinetFrontReferenceRenderableCount = 1;
    }
  }

  return {
    targetRenderableCount,
    contextRenderableCount,
    hiddenNonTargetRenderableCount,
    cabinetFrontReferenceRenderableCount,
    sourceChainCabinetFrontXM,
    cabinetFrontWorldX,
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};
