import type { Object3D } from 'three';
import type { TechnicalSourceNode } from './privateModelTechnicalSystemsLayers';
import { nameMatches } from './privateModelSourceNodeAssociations.mjs';
import {
  createViewerScopedLayerPresentation,
  type ViewerScopedLayerFrame,
  type ViewerScopedLayerRoot,
} from './privateModelLayerScopedPresentationBridge';
import {
  viewerLayerNodeCapabilities,
  type ViewerLayerNodeId,
  type ViewerLayerVisibilityMode,
} from './privateModelLayerHierarchyState';
import type { ViewerInteractionState } from './privateModelViewerState';

/** Convert only actual loader/source associations, including indexed parents. */
export const collectViewerLayerSourceNodes = (
  source: any, root: Object3D, sceneIndex: number, sourceSha256: string,
): TechnicalSourceNode[] => {
  const associations = source?.parser?.associations;
  const json = source?.parser?.json;
  const nodes: TechnicalSourceNode[] = [];
  if (source?.scenes?.[sceneIndex] !== root) return nodes;
  root.traverse(object => {
    if (object === root) return;
    const nodeIndex = associations?.get(object)?.nodes;
    const definition = json?.nodes?.[nodeIndex];
    if (!Number.isInteger(nodeIndex) || !definition || !nameMatches(object, definition)) return;
    const parentNodeIndex = object.parent === root ? null : associations?.get(object.parent)?.nodes;
    if (object.parent !== root && !Number.isInteger(parentNodeIndex)) return;
    nodes.push({ object, sceneIndex, nodeIndex, parentNodeIndex,
      nodeName: object.name, glbSha256: sourceSha256, meshIndex: definition.mesh });
  });
  return nodes;
};

/** Ancestors are controls, never additional overlapping render roots. */
export const availableViewerLayerIds = (bindings: readonly ViewerScopedLayerRoot[]) => {
  const ids = new Set<ViewerLayerNodeId>();
  for (const binding of bindings) {
    let id: ViewerLayerNodeId | null = binding.id;
    while (id) {
      ids.add(id);
      id = viewerLayerNodeCapabilities[id]?.parent ?? null;
    }
  }
  return [...ids];
};

/**
 * Owns only verified non-overlapping meshes in one original glTF scene.
 * The existing loader, source-card resolver, scope, scene and camera owners
 * remain authoritative. Dispose BEFORE mounting/releasing another scene.
 */
export const createViewerLayersRuntime = (args: {
  sceneRoot: Object3D;
  sourceSha256: string;
  bindings: readonly ViewerScopedLayerRoot[];
}) => {
  if (!/^[a-f0-9]{64}$/.test(args.sourceSha256)) throw Error('Layers source digest missing');
  const bridge = createViewerScopedLayerPresentation(args.sceneRoot, args.bindings);
  const availableNodeIds = availableViewerLayerIds(args.bindings);
  let disposed = false;
  let modes: ReadonlyArray<{ id: ViewerLayerNodeId; mode: ViewerLayerVisibilityMode }> = [];

  const apply = (state: ViewerInteractionState, frame: ViewerScopedLayerFrame) => {
    modes = bridge.apply(state, { ...frame, availableNodeIds });
    return modes;
  };

  // Runs AFTER the existing scope/floor pass. Only narrows visibility. It
  // never re-shows a mesh that a scope or object-isolation filter has hidden,
  // and never allocates ghost materials in the animation loop.
  const enforce = (activeSceneRoot: Object3D | null, sourceSha256: string | null) => {
    if (disposed) return;
    const active = activeSceneRoot === args.sceneRoot && sourceSha256 === args.sourceSha256;
    args.bindings.forEach(({ root }, index) => {
      if (!active || modes[index]?.mode === 'hidden') root.visible = false;
    });
  };

  const dispose = () => {
    if (disposed) return;
    bridge.dispose();
    disposed = true;
    modes = [];
  };

  return { apply, enforce, dispose, availableNodeIds };
};

export type ViewerLayersRuntime = ReturnType<typeof createViewerLayersRuntime>;
