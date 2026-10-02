import { isObjectVisibilityRenderable } from './privateModelSelectionIdentity';

export type ObjectVisibilityNode = {
  name?: unknown;
  visible: boolean;
  parent?: ObjectVisibilityNode | null;
  traverse(callback: (object: ObjectVisibilityNode) => void): void;
  isMesh?: boolean;
  isLine?: boolean;
  isLineSegments?: boolean;
};

type VisibilityMaterial = {
  opacity?: number;
};

export const isEffectivelyVisible = (
  object: ObjectVisibilityNode | null | undefined,
  modelRoot: ObjectVisibilityNode,
) => {
  let current = object;
  while (current && current !== modelRoot.parent) {
    if (!current.visible) return false;
    if (current === modelRoot) return true;
    current = current.parent;
  }
  return false;
};

export const hasVisibleMaterial = (
  object:
    | { material?: VisibilityMaterial | VisibilityMaterial[] | null }
    | null
    | undefined,
) => {
  const materials = Array.isArray(object?.material) ? object.material : [object?.material];
  return materials.some(
    (material) => !material || material.opacity === undefined || material.opacity > 0.01,
  );
};

export const createObjectVisibilityFilter = () => {
  const baseline = new Map<ObjectVisibilityNode, boolean>();
  let active = false;

  const reset = () => {
    baseline.clear();
    active = false;
  };

  const capture = (root: ObjectVisibilityNode) => {
    if (active) return false;
    baseline.clear();
    root.traverse((object) => {
      if (isObjectVisibilityRenderable(object)) baseline.set(object, object.visible);
    });
    active = true;
    return true;
  };

  const isolate = (root: ObjectVisibilityNode, target: ObjectVisibilityNode) => {
    capture(root);
    const keepVisible = new Set<ObjectVisibilityNode>();
    let current: ObjectVisibilityNode | null | undefined = target;
    while (current && current !== root) {
      keepVisible.add(current);
      current = current.parent;
    }
    target.traverse((object) => keepVisible.add(object));

    root.traverse((object) => {
      if (!isObjectVisibilityRenderable(object)) return;
      const baselineVisible = baseline.get(object) ?? object.visible;
      object.visible = baselineVisible && keepVisible.has(object);
    });
  };

  const hide = (root: ObjectVisibilityNode, target: ObjectVisibilityNode) => {
    capture(root);
    target.visible = false;
  };

  const restore = () => {
    if (!active) return false;
    for (const [object, visible] of baseline.entries()) object.visible = visible;
    reset();
    return true;
  };

  return { capture, hide, isolate, reset, restore };
};
