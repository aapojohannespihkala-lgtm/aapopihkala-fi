type SelectionPickingRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SelectionPickingCanvas = {
  getBoundingClientRect: () => SelectionPickingRect;
  dataset?: DOMStringMap;
};

type SelectionPickingPointer = {
  x: number;
  y: number;
};

type SelectionPickingIntersection = {
  object?: any;
  face?: { materialIndex?: number } | null;
  /** Three.js raycasts clipped surfaces too; intersection points are world-space. */
  point?: { x: number; y: number; z: number };
};

type SelectionPickingRaycaster = {
  setFromCamera: (pointer: any, camera: any) => void;
  intersectObjects: (objects: any[], recursive: boolean) => SelectionPickingIntersection[];
};

type PickSelectableObjectOptions = {
  canvas: SelectionPickingCanvas;
  camera: any;
  modelRoot: { children: any[] };
  raycaster: SelectionPickingRaycaster;
  pointer: SelectionPickingPointer;
  clientX: number;
  clientY: number;
  isEffectivelyVisible: (object: any, modelRoot: any) => boolean;
  hasVisibleMaterial: (object: any) => boolean;
};

export const pickSelectableObjectAtClientPoint = ({
  canvas,
  camera,
  modelRoot,
  raycaster,
  pointer,
  clientX,
  clientY,
  isEffectivelyVisible,
  hasVisibleMaterial,
}: PickSelectableObjectOptions) => {
  if (canvas.dataset?.interactionMode !== 'select') return null;

  const rect = canvas.getBoundingClientRect();
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  // Reject invalid or out-of-canvas input before mutating the pointer or raycasting.
  if (![clientX, clientY, rect.left, rect.top, rect.width, rect.height, right, bottom]
      .every(Number.isFinite) ||
      rect.width <= 0 || rect.height <= 0 ||
      clientX < rect.left || clientX > right ||
      clientY < rect.top || clientY > bottom) return null;

  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // A visible material group must not make a different, invisible face selectable.
  // Keep legacy object-level picking for single-material and non-face hits (e.g. lines).
  const isHitMaterialVisible = (candidate: SelectionPickingIntersection) => {
    const materials = candidate.object?.material;
    const materialIndex = candidate.face?.materialIndex;
    if (!Array.isArray(materials) || materialIndex === undefined) {
      return hasVisibleMaterial(candidate.object);
    }
    if (!Number.isInteger(materialIndex) || materialIndex < 0 || materialIndex >= materials.length) {
      return false;
    }
    return hasVisibleMaterial({ material: materials[materialIndex] });
  };

  // WebGL clipping happens after raycasting. Skip surfaces removed by the
  // current horizontal cut, or by the hit face's own material clipping planes.
  const isHitWithinRenderedClip = (candidate: SelectionPickingIntersection) => {
    const point = candidate.point;
    if (canvas.dataset?.horizontalClip === 'active') {
      const rawHeight = canvas.dataset.horizontalClipHeightM;
      const height = rawHeight === undefined ? Number.NaN : Number(rawHeight);
      // The existing controller clips world Y above this height. It exposes
      // the UI value to 3 decimals, hence a 0.51 mm rounding tolerance.
      if (canvas.dataset.horizontalClipSide !== 'above' ||
          !Number.isFinite(height) ||
          !point || !Number.isFinite(point.y) ||
          point.y > height + 0.00051) return false;
    }

    const materials = candidate.object?.material;
    const materialIndex = candidate.face?.materialIndex;
    // Non-face hits (e.g. lines) preserve legacy material handling, while
    // a mesh face with a material array uses only its own material.
    const material = Array.isArray(materials)
      ? (Number.isInteger(materialIndex) && materialIndex! >= 0 &&
          materialIndex! < materials.length ? materials[materialIndex!] : null)
      : materials;
    const planes = material?.clippingPlanes;
    if (!Array.isArray(planes) || planes.length === 0) return true;
    if (!point || ![point.x, point.y, point.z].every(Number.isFinite)) return false;

    let outside = 0;
    for (const plane of planes) {
      if (typeof plane?.distanceToPoint !== 'function') return false;
      const distance = plane.distanceToPoint(point);
      if (!Number.isFinite(distance)) return false;
      if (distance < -1e-7) outside++;
    }
    // Match Three.js material.clipIntersection rather than clipping every hit
    // as soon as any one plane rejects it.
    return material.clipIntersection ? outside < planes.length : outside === 0;
  };

  const hit = raycaster
    .intersectObjects(modelRoot.children, true)
    .find(
      (candidate) =>
        (candidate.object?.isMesh ||
          candidate.object?.isLine ||
          candidate.object?.isLineSegments) &&
        isEffectivelyVisible(candidate.object, modelRoot) &&
        isHitMaterialVisible(candidate) &&
        isHitWithinRenderedClip(candidate),
    );

  return hit?.object ?? null;
};
