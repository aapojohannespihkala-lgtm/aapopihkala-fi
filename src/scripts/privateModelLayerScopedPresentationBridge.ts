import type { Mesh, Object3D } from 'three';
import {
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  resolveScopedViewerLayerMode,
  viewerLayerNodeCapabilities,
  type ViewerLayerNodeId,
  type ViewerLayerVisibilityMode,
} from './privateModelLayerHierarchyState';
import { createViewerLayerGhostPresentation } from './privateModelLayerGhostPresentation';
import type { ViewerInteractionState } from './privateModelViewerState';

/**
 * WP3 adapter for a single, already loaded scene. A binding MUST be a
 * separately classified, non-overlapping root from trusted GLB metadata;
 * an unfiltered whole-building root is never a valid technical layer.
 *
 * This opt-in module does not install UI, change camera, switch glTF scenes,
 * mutate source links or participate in source/version selection.
 */
export type ViewerScopedLayerRoot = {
  id: ViewerLayerNodeId;
  root: Object3D;
};

/** Recompute for every scope/floor/scene change. Missing gates fail closed. */
export type ViewerScopedLayerGate = {
  scopeAllowed: boolean;
  floorAllowed: boolean;
  sourceAllowed: boolean;
};

export type ViewerScopedLayerFrame = {
  /** Exact glTF scene root currently selected by the existing viewer. */
  activeSceneRoot: Object3D;
  /** Only layer IDs proven available by metadata of this exact loaded source. */
  availableNodeIds: readonly string[];
  /** Per-root permission, NOT a whole-layer or whole-building boolean. */
  gates: ReadonlyMap<Object3D, ViewerScopedLayerGate>;
  ghostOpacity?: number;
  preferEdges?: boolean;
  isSelected?: (mesh: Mesh) => boolean;
};

const isLayerNodeId = (id: string): id is ViewerLayerNodeId =>
  Object.prototype.hasOwnProperty.call(viewerLayerNodeCapabilities, id);

const isWithin = (root: Object3D, ancestor: Object3D) => {
  let cursor: Object3D | null = root;
  while (cursor) {
    if (cursor === ancestor) return true;
    cursor = cursor.parent;
  }
  return false;
};

/**
 * One bridge per scene. Call dispose() before disposing or replacing that
 * scene; never simultaneously give the same root to the legacy visibility
 * controller and this adapter. The old viewer remains the default until WP3
 * installs the bridge with source-verified bindings.
 */
export const createViewerScopedLayerPresentation = (
  sceneRoot: Object3D,
  bindings: readonly ViewerScopedLayerRoot[],
) => {
  const seen: Object3D[] = [];
  for (const { id, root } of bindings) {
    if (!isLayerNodeId(id)) throw new TypeError('Unknown layer metadata ID');
    if (root === sceneRoot || !isWithin(root, sceneRoot)) {
      throw new Error('Layer root must be a proper descendant of its source scene');
    }
    if (seen.some((previous) => isWithin(root, previous) || isWithin(previous, root))) {
      throw new Error('Overlapping layer roots cannot share presentation adapters');
    }
    seen.push(root);
  }

  const entries = bindings.map(({ id, root }) => ({
    id,
    root,
    adapter: createViewerLayerGhostPresentation(root),
  }));
  let disposed = false;

  const apply = (
    state: ViewerInteractionState,
    frame: ViewerScopedLayerFrame,
  ): ReadonlyArray<{ id: ViewerLayerNodeId; mode: ViewerLayerVisibilityMode }> => {
    if (disposed) throw new Error('Scoped layer presentation already disposed');
    const available = new Set(frame.availableNodeIds.filter(isLayerNodeId));
    const modes = state.layerPresetState?.modes ?? createViewerLayerModeMap(state.layers);
    // An error while presenting a later root must not leave earlier roots
    // exposed (or ghosted with temporary materials). In particular, a
    // selection callback may throw after a previous root has been updated.
    try {
      return entries.map(({ id, root, adapter }) => {
        const gate = frame.gates.get(root);
        // A scene switch, stale/reparented root, absent metadata, or an
        // unknown scope/floor/source permission must never reveal geometry.
      const allowed =
        frame.activeSceneRoot === sceneRoot &&
        isWithin(root, sceneRoot) &&
        available.has(id) &&
        gate?.sourceAllowed === true;
      const scopeAllowed = allowed && gate?.scopeAllowed === true;
      const floorAllowed = allowed && gate?.floorAllowed === true;
      const mode = resolveScopedViewerLayerMode(
        getViewerLayerEffectiveMode(modes, id),
        scopeAllowed,
        floorAllowed,
      );
      const effective = adapter.apply(mode, {
        scopeAllowed: scopeAllowed && floorAllowed,
        opacity: frame.ghostOpacity,
        preferEdges: frame.preferEdges,
        isSelected: frame.isSelected,
      });
        return { id, mode: effective };
      });
    } catch (error) {
      // Fail CLOSED across every bound root, including roots already handled
      // in this frame. Hidden mode does not invoke isSelected or build edges.
      for (const { root, adapter } of entries) {
        try {
          adapter.apply('hidden', { scopeAllowed: false });
        } catch {
          // Even if material restoration fails, do not display stale data.
        }
        root.visible = false;
      }
      throw error;
    }
  };

  const reset = () => {
    if (disposed) return;
    entries.forEach(({ adapter }) => adapter.reset());
  };
  const dispose = () => {
    if (disposed) return;
    entries.forEach(({ adapter }) => adapter.dispose());
    disposed = true;
  };
  return { apply, reset, dispose };
};
