import { Mesh } from 'three';
import {
  getViewerLayerEffectiveMode,
  resolveScopedViewerLayerMode,
  viewerLayerNodeCapabilities,
  type ViewerLayerModeMap,
  type ViewerLayerNodeId,
  type ViewerLayerVisibilityMode,
} from './privateModelLayerHierarchyState';
import {
  createViewerLayerGhostPresentation,
  type ViewerLayerGhostOptions,
} from './privateModelLayerGhostPresentation';

/**
 * An explicit binding for ONE leaf Mesh in the currently verified GLB scene.
 *
 * The caller, not this adapter, obtains metadataLayerId from actual model
 * metadata, checks the current GLB SHA/scene and computes scope/storey gates.
 * A label, object name, material, coordinate or presumed electrical group is
 * never proof of a layer identity.
 */
export type ViewerScopedLayerMesh = {
  mesh: Mesh;
  layerId: ViewerLayerNodeId;
  metadataLayerId: string | null;
  /** Caller has independently verified the source version and layer binding. */
  sourceBindingVerified: boolean;
  /** True only for an object in the current selected GLB scene. */
  sceneAllowed: boolean;
  /** Authoritative area / D-apartment membership gate. */
  scopeAllowed: boolean;
  /** Authoritative 1F/2F/other-floor gate. */
  storeyAllowed: boolean;
};

export type ViewerScopedLayerPresentationOptions = Pick<
  ViewerLayerGhostOptions,
  'opacity' | 'preferEdges' | 'isSelected'
>;

type RegisteredMesh = {
  binding: ViewerScopedLayerMesh;
  presentation: ReturnType<typeof createViewerLayerGhostPresentation>;
};

const sourceBindingIsValid = (target: ViewerScopedLayerMesh): boolean =>
  target.sourceBindingVerified === true &&
  target.metadataLayerId === target.layerId &&
  Object.prototype.hasOwnProperty.call(viewerLayerNodeCapabilities, target.layerId);

/**
 * A single scene's source-verified, explicitly classified leaf meshes.
 *
 * Never pass a Scene/Group, whole model root or object with children: Three.js
 * would traverse unrelated geometry and could leak A-C or another storey.
 * The authoritative scoped object set is maintained by the existing viewer.
 *
 * Construct a fresh controller after changing the source SHA, glTF scene or
 * model root; dispose the previous controller first to restore all materials.
 */
export const createViewerScopedLayerPresentation = (
  targets: readonly ViewerScopedLayerMesh[],
) => {
  const seen = new Set<Mesh>();
  const registered: RegisteredMesh[] = [];

  // Validate the entire batch before mutating or creating any presentation.
  for (const item of targets) {
    if (!(item.mesh instanceof Mesh)) {
      throw new TypeError('Scoped layer target must be a single Mesh');
    }
    if (item.mesh.children.length > 0) {
      throw new Error('Scoped layer target must be a leaf Mesh');
    }
    if (seen.has(item.mesh)) {
      throw new Error('Mesh cannot be registered for more than one layer');
    }
    seen.add(item.mesh);
  }
  for (const item of targets) {
    registered.push({
      binding: item,
      presentation: createViewerLayerGhostPresentation(item.mesh),
    });
  }

  let disposed = false;
  const reset = () => {
    if (disposed) return;
    for (const item of registered) item.presentation.reset();
  };

  /** Does not choose camera/scene, change sourceLinks or override hidden roots. */
  const apply = (
    modes: ViewerLayerModeMap,
    options: ViewerScopedLayerPresentationOptions = {},
  ): ReadonlyMap<Mesh, ViewerLayerVisibilityMode> => {
    if (disposed) throw new Error('Scoped layer presentation already disposed');
    const effective = new Map<Mesh, ViewerLayerVisibilityMode>();
    try {
      for (const { binding, presentation } of registered) {
        const requested = getViewerLayerEffectiveMode(modes, binding.layerId);
        const gated = resolveScopedViewerLayerMode(
          requested,
          sourceBindingIsValid(binding) &&
            binding.sceneAllowed === true &&
            binding.scopeAllowed === true,
          binding.storeyAllowed === true,
        );
        const actual = presentation.apply(gated, {
          ...options,
          scopeAllowed: gated !== 'hidden',
        });
        effective.set(binding.mesh, actual);
      }
    } catch (error) {
      reset();
      throw error;
    }
    return effective;
  };

  const dispose = () => {
    if (disposed) return;
    for (const item of registered) item.presentation.dispose();
    disposed = true;
  };

  return { apply, reset, dispose };
};
