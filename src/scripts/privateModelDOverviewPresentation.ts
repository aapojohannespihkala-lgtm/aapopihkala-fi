import { THREE } from './threeRuntime';

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

type P171Q1Axis = 'x' | 'y' | 'z';

const p171Q1Axes: P171Q1Axis[] = ['x', 'y', 'z'];

const axisValue = (vector: any, axis: P171Q1Axis) =>
  axis === 'x' ? vector.x : axis === 'y' ? vector.y : vector.z;

const setAxisValue = (vector: any, axis: P171Q1Axis, value: number) => {
  if (axis === 'x') vector.x = value;
  else if (axis === 'y') vector.y = value;
  else vector.z = value;
};

const rootLocalBounds = (object: any, root: any) => {
  object.geometry?.computeBoundingBox?.();
  const bounds = object.geometry?.boundingBox;
  if (!bounds) return null;

  root.updateMatrixWorld?.(true);
  object.updateMatrixWorld?.(true);
  const rootInverse = root.matrixWorld.clone().invert();
  const objectToRoot = new THREE.Matrix4().multiplyMatrices(rootInverse, object.matrixWorld);
  const points: any[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        points.push(new THREE.Vector3(x, y, z).applyMatrix4(objectToRoot));
      }
    }
  }
  return new THREE.Box3().setFromPoints(points);
};

const makeP171Q1TopSurfaceMaterial = (sourceMaterial: any) => {
  const source = Array.isArray(sourceMaterial) ? sourceMaterial[0] : sourceMaterial;
  const opacity = Number.isFinite(source?.opacity) ? source.opacity : 1;
  const material = new THREE.MeshBasicMaterial({
    color: source?.color?.clone?.() ?? new THREE.Color(0x949ea8),
    transparent: opacity < 0.999,
    opacity,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.userData = {
    ...(source?.userData ?? {}),
    p171Q1ViewerPresentation: true,
    p171Q1PresentationRole: 'TOP_SURFACE_ONLY',
  };
  return material;
};

const buildP171Q1TopSurface = (floorMeshes: any[], workShellClone: any) => {
  const bounds = floorMeshes
    .map((object) => rootLocalBounds(object, workShellClone))
    .filter(Boolean) as any[];
  if (bounds.length === 0) return null;

  const maxExtentByAxis = new Map<P171Q1Axis, number>();
  for (const axis of p171Q1Axes) {
    maxExtentByAxis.set(
      axis,
      Math.max(...bounds.map((box) => axisValue(box.max, axis) - axisValue(box.min, axis))),
    );
  }
  const thinAxis = p171Q1Axes.reduce((current, axis) =>
    (maxExtentByAxis.get(axis) ?? Infinity) < (maxExtentByAxis.get(current) ?? Infinity)
      ? axis
      : current,
  );
  const planAxes = p171Q1Axes.filter((axis) => axis !== thinAxis);
  const [axisA, axisB] = planAxes;
  if (!axisA || !axisB) return null;

  const positions: number[] = [];
  const indices: number[] = [];
  for (const box of bounds) {
    const top = axisValue(box.max, thinAxis);
    const minA = axisValue(box.min, axisA);
    const maxA = axisValue(box.max, axisA);
    const minB = axisValue(box.min, axisB);
    const maxB = axisValue(box.max, axisB);
    const corners = [
      [minA, minB],
      [maxA, minB],
      [maxA, maxB],
      [minA, maxB],
    ];
    const baseIndex = positions.length / 3;
    for (const [a, b] of corners) {
      const point = new THREE.Vector3();
      setAxisValue(point, thinAxis, top);
      setAxisValue(point, axisA, a);
      setAxisValue(point, axisB, b);
      positions.push(point.x, point.y, point.z);
    }
    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex,
      baseIndex + 2,
      baseIndex + 3,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const surface = new THREE.Mesh(
    geometry,
    makeP171Q1TopSurfaceMaterial(floorMeshes[0]?.material),
  );
  surface.name = 'P171_Q1_FLOOR_SHELL_TOP_SURFACE_VIEWER_ONLY';
  surface.renderOrder = 20;
  surface.userData = {
    PresentationOnly: true,
    Canonical: false,
    viewerDerived: true,
    viewerSuppressEdgeOverlay: true,
    p171Q1InternalSeamSuppression: true,
    representationKind: 'presentationFloorWorkShellTopSurfaceReview',
    reviewScope: 'P171_Q1_FLOOR_SHELL',
    sourceContract: 'P167F_PRESENTATION_WORKSHELL_CLEARANCE_TOP_SURFACE_ONLY',
    sourcePartCount: floorMeshes.length,
    physicalOpeningClaim: false,
    physicalFloorShellCutApplied: false,
    physicalSlabThicknessClaim: false,
    physicalFloorBuildUpClaim: false,
    sourcePrimitiveMutation: false,
    asBuiltClaim: false,
  };
  return surface;
};

export const prepareP171Q1WorkShellPresentation = (workShellSource: any) => {
  const workShellClone = workShellSource.clone(true);
  const floorMeshes: any[] = [];

  workShellClone.traverse((object: any) => {
    if (isFloorWorkShell(object)) floorMeshes.push(object);
  });

  const floorSurface = buildP171Q1TopSurface(floorMeshes, workShellClone);
  let hiddenFloorVolumeMeshCount = 0;
  if (floorSurface) {
    for (const object of floorMeshes) {
      object.visible = false;
      object.userData = {
        ...(object.userData ?? {}),
        viewerSuppressEdgeOverlay: true,
        p171Q1InternalSeamSuppression: true,
        p171Q1ReplacedByTopSurfaceOnly: true,
      };
      hiddenFloorVolumeMeshCount += 1;
    }
    workShellClone.add(floorSurface);
  } else {
    for (const object of floorMeshes) {
      object.userData = {
        ...(object.userData ?? {}),
        viewerSuppressEdgeOverlay: true,
        p171Q1InternalSeamSuppression: true,
      };
    }
  }

  return {
    workShellClone,
    suppressedFloorMeshCount: floorMeshes.length,
    hiddenFloorVolumeMeshCount,
    floorSurfaceMeshCount: floorSurface ? 1 : 0,
    floorSurface,
  };
};
