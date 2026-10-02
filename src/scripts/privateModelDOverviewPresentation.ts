export const p172bDOverviewFloorOpacity = 0.45;
export const p172bDOverviewNeutralWallHex = 0xaeb4b8;

const hasOwn = (value: unknown, key: string) =>
  Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

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

const isRedundantOverviewContext = (object: any) => {
  const data = object?.userData ?? {};
  const representationKind = String(data.representationKind ?? '');
  return (
    representationKind === 'referenceFootprint' ||
    representationKind === 'stairHostFootprint' ||
    hasOwn(data, 'sourceLowWallNode')
  );
};

const isNeutralOverviewWallHelper = (object: any) => {
  if (!object?.isMesh) return false;
  const data = object.userData ?? {};
  const presentationOnly = data.PresentationOnly === true || data.presentationOnly === true;
  return (
    presentationOnly &&
    String(data.Pass ?? '') === '123C' &&
    !hasOwn(data, 'sourceLowWallNode') &&
    (hasOwn(data, 'sourceP122BNode') || hasOwn(data, 'sourceP123BNode'))
  );
};

const isFloorWorkShell = (object: any) =>
  object?.isMesh &&
  String(object?.userData?.representationKind ?? '') ===
    'presentationFloorWorkShellWithPreciseStairClearance';

export const prepareP172bDOverviewPresentation = (interiorSource: any, workShellSource: any) => {
  const interiorClone = interiorSource.clone(true);
  const workShellClone = workShellSource.clone(true);
  let hiddenContextHelperCount = 0;
  let neutralWallMeshCount = 0;
  let floorMeshCount = 0;

  interiorClone.traverse((object: any) => {
    if (isRedundantOverviewContext(object)) {
      object.visible = false;
      hiddenContextHelperCount += 1;
      return;
    }
    if (!isNeutralOverviewWallHelper(object)) return;

    cloneObjectMaterials(object, (material) => {
      material.color?.setHex?.(p172bDOverviewNeutralWallHex);
      material.opacity = 1;
      material.transparent = false;
      material.depthWrite = true;
      material.userData = {
        ...(material.userData ?? {}),
        p172bViewerPresentation: true,
        p172bPresentationRole: 'NEUTRAL_WALL',
      };
      material.needsUpdate = true;
    });
    neutralWallMeshCount += 1;
  });

  workShellClone.traverse((object: any) => {
    if (!isFloorWorkShell(object)) return;
    cloneObjectMaterials(object, (material) => {
      material.opacity = p172bDOverviewFloorOpacity;
      material.transparent = true;
      material.depthWrite = true;
      material.userData = {
        ...(material.userData ?? {}),
        p172bViewerPresentation: true,
        p172bPresentationRole: 'REFINABLE_VIEWER_PRESENTATION',
      };
      material.needsUpdate = true;
    });
    floorMeshCount += 1;
  });

  return {
    interiorClone,
    workShellClone,
    hiddenContextHelperCount,
    neutralWallMeshCount,
    floorMeshCount,
  };
};
