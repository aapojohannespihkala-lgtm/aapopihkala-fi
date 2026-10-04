import { isObjectVisibilityRenderable } from './privateModelSelectionIdentity';

export type ObjectVisibilityNode = {
  name?: unknown;
  visible: boolean;
  parent?: ObjectVisibilityNode | null;
  traverse(callback: (object: ObjectVisibilityNode) => void): void;
  isMesh?: boolean;
  isLine?: boolean;
  isLineSegments?: boolean;
  isPoints?: boolean;
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
  let mode: 'none' | 'isolate' | 'hide' = 'none';
  let target: ObjectVisibilityNode | null = null;
  let isolateKeepVisible = new Set<ObjectVisibilityNode>();

  const reset = () => {
    baseline.clear();
    active = false;
    mode = 'none';
    target = null;
    isolateKeepVisible = new Set<ObjectVisibilityNode>();
  };

  const capture = (root: ObjectVisibilityNode) => {
    if (active) return false;
    baseline.clear();
    root.traverse((object) => {
      if (isObjectVisibilityRenderable(object)) baseline.set(object, object.visible);
    });
    active = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ylis-object-visibility-filter', { detail: { active: true } }),
      );
    }
    return true;
  };

  const overlayAllows = (object: ObjectVisibilityNode) => {
    if (mode === 'isolate') return isolateKeepVisible.has(object);
    if (mode === 'hide') return object !== target;
    return true;
  };

  const reapply = (root: ObjectVisibilityNode) => {
    if (!active) return false;
    root.traverse((object) => {
      if (!isObjectVisibilityRenderable(object)) return;
      const baseVisible = baseline.get(object) ?? object.visible;
      object.visible = baseVisible && overlayAllows(object);
    });
    return true;
  };

  const setBaselineVisibility = (
    object: ObjectVisibilityNode,
    visible: boolean,
  ) => {
    if (!active || !baseline.has(object)) return false;
    baseline.set(object, visible);
    return true;
  };

  const isolate = (root: ObjectVisibilityNode, nextTarget: ObjectVisibilityNode) => {
    capture(root);
    mode = 'isolate';
    target = nextTarget;
    isolateKeepVisible = new Set<ObjectVisibilityNode>();

    let current: ObjectVisibilityNode | null | undefined = nextTarget;
    while (current && current !== root) {
      isolateKeepVisible.add(current);
      current = current.parent;
    }
    nextTarget.traverse((object) => isolateKeepVisible.add(object));
    reapply(root);
  };

  const hide = (root: ObjectVisibilityNode, nextTarget: ObjectVisibilityNode) => {
    capture(root);
    mode = 'hide';
    target = nextTarget;
    reapply(root);
  };

  const restore = () => {
    if (!active) return false;
    for (const [object, visible] of baseline.entries()) object.visible = visible;
    reset();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ylis-object-visibility-filter', { detail: { active: false } }),
      );
    }
    return true;
  };

  return {
    capture,
    hide,
    isolate,
    isActive: () => active,
    reapply,
    reset,
    restore,
    setBaselineVisibility,
  };
};
