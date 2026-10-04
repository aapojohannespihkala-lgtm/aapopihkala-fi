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

type VisibilitySnapshot = {
  hidden: Set<ObjectVisibilityNode>;
  isolateKeepVisible: Set<ObjectVisibilityNode> | null;
  isolateReturnHidden: Set<ObjectVisibilityNode> | null;
};

const VISIBILITY_HISTORY_LIMIT = 32;

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
  const history: VisibilitySnapshot[] = [];
  let active = false;
  let capturedRoot: ObjectVisibilityNode | null = null;
  let hidden = new Set<ObjectVisibilityNode>();
  let isolateKeepVisible: Set<ObjectVisibilityNode> | null = null;
  let isolateReturnHidden: Set<ObjectVisibilityNode> | null = null;

  const snapshot = (): VisibilitySnapshot => ({
    hidden: new Set(hidden),
    isolateKeepVisible: isolateKeepVisible ? new Set(isolateKeepVisible) : null,
    isolateReturnHidden: isolateReturnHidden ? new Set(isolateReturnHidden) : null,
  });

  const dispatchState = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('ylis-object-visibility-filter', {
        detail: {
          active,
          hiddenCount: hidden.size,
          isolating: isolateKeepVisible !== null,
          canUndo: history.length > 0,
        },
      }),
    );
  };

  const pushHistory = () => {
    history.push(snapshot());
    if (history.length > VISIBILITY_HISTORY_LIMIT) history.shift();
  };

  const overlayAllows = (object: ObjectVisibilityNode) => {
    if (hidden.has(object)) return false;
    if (isolateKeepVisible) return isolateKeepVisible.has(object);
    return true;
  };

  const reapply = (root: ObjectVisibilityNode = capturedRoot as ObjectVisibilityNode) => {
    if (!active || !root) return false;
    root.traverse((object) => {
      if (!isObjectVisibilityRenderable(object)) return;
      const baseVisible = baseline.get(object) ?? object.visible;
      object.visible = baseVisible && overlayAllows(object);
    });
    return true;
  };

  const capture = (root: ObjectVisibilityNode) => {
    if (active) return false;
    baseline.clear();
    root.traverse((object) => {
      if (isObjectVisibilityRenderable(object)) baseline.set(object, object.visible);
    });
    active = true;
    capturedRoot = root;
    dispatchState();
    return true;
  };

  const reset = () => {
    const wasActive = active;
    baseline.clear();
    history.length = 0;
    hidden.clear();
    isolateKeepVisible = null;
    isolateReturnHidden = null;
    capturedRoot = null;
    active = false;
    if (wasActive) dispatchState();
  };

  const setBaselineVisibility = (
    object: ObjectVisibilityNode,
    visible: boolean,
  ) => {
    if (!active || !baseline.has(object)) return false;
    baseline.set(object, visible);
    if (capturedRoot) reapply(capturedRoot);
    return true;
  };

  const hide = (root: ObjectVisibilityNode, nextTarget: ObjectVisibilityNode) => {
    capture(root);
    if (hidden.has(nextTarget)) return false;
    pushHistory();
    hidden.add(nextTarget);
    reapply(root);
    dispatchState();
    return true;
  };

  const show = (root: ObjectVisibilityNode, nextTarget: ObjectVisibilityNode) => {
    if (!active || !hidden.has(nextTarget)) return false;
    pushHistory();
    hidden.delete(nextTarget);
    reapply(root);
    dispatchState();
    return true;
  };

  const isolate = (root: ObjectVisibilityNode, nextTarget: ObjectVisibilityNode) => {
    capture(root);
    pushHistory();
    isolateReturnHidden = new Set(hidden);
    isolateKeepVisible = new Set<ObjectVisibilityNode>();

    let current: ObjectVisibilityNode | null | undefined = nextTarget;
    while (current && current !== root) {
      isolateKeepVisible.add(current);
      current = current.parent;
    }
    nextTarget.traverse((object) => isolateKeepVisible?.add(object));
    reapply(root);
    dispatchState();
    return true;
  };

  const endIsolate = (root: ObjectVisibilityNode = capturedRoot as ObjectVisibilityNode) => {
    if (!active || !root || !isolateKeepVisible) return false;
    pushHistory();
    hidden = new Set(isolateReturnHidden ?? hidden);
    isolateKeepVisible = null;
    isolateReturnHidden = null;
    reapply(root);
    dispatchState();
    return true;
  };

  const showAll = (root: ObjectVisibilityNode = capturedRoot as ObjectVisibilityNode) => {
    if (!active || !root || (hidden.size === 0 && !isolateKeepVisible)) return false;
    pushHistory();
    hidden.clear();
    isolateKeepVisible = null;
    isolateReturnHidden = null;
    reapply(root);
    dispatchState();
    return true;
  };

  const undo = (root: ObjectVisibilityNode = capturedRoot as ObjectVisibilityNode) => {
    if (!active || !root || history.length === 0) return false;
    const previous = history.pop();
    if (!previous) return false;
    hidden = new Set(previous.hidden);
    isolateKeepVisible = previous.isolateKeepVisible
      ? new Set(previous.isolateKeepVisible)
      : null;
    isolateReturnHidden = previous.isolateReturnHidden
      ? new Set(previous.isolateReturnHidden)
      : null;
    reapply(root);
    dispatchState();
    return true;
  };

  const restore = () => showAll();

  return {
    capture,
    canUndo: () => history.length > 0,
    endIsolate,
    getHiddenCount: () => hidden.size,
    getHiddenObjects: () => [...hidden],
    hide,
    isolate,
    isActive: () => active,
    isIsolating: () => isolateKeepVisible !== null,
    reapply,
    reset,
    restore,
    setBaselineVisibility,
    show,
    showAll,
    undo,
  };
};
