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

  const hit = raycaster
    .intersectObjects(modelRoot.children, true)
    .find(
      (candidate) =>
        (candidate.object?.isMesh ||
          candidate.object?.isLine ||
          candidate.object?.isLineSegments) &&
        isEffectivelyVisible(candidate.object, modelRoot) &&
        hasVisibleMaterial(candidate.object),
    );

  return hit?.object ?? null;
};
