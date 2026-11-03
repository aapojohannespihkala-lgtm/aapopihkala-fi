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
  if (rect.width <= 0 || rect.height <= 0) return null;

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

  const hit = raycaster
    .intersectObjects(modelRoot.children, true)
    .find(
      (candidate) =>
        (candidate.object?.isMesh ||
          candidate.object?.isLine ||
          candidate.object?.isLineSegments) &&
        isEffectivelyVisible(candidate.object, modelRoot) &&
        isHitMaterialVisible(candidate),
    );

  return hit?.object ?? null;
};
