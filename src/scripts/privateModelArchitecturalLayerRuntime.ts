import {
  isViewerLayerNodeEffectivelyVisible,
  type ViewerArchitecturalLayerNodeId,
  type ViewerArchitecturalParentNodeId,
  type ViewerLayerControlsState,
  type ViewerLayerParentVisibilityState,
} from './privateModelLayerHierarchyState';
import type { ArchitecturalSemanticDescriptor } from './privateModelSceneSemantics';

export type ArchitecturalLayerRuntimeRenderable = {
  visible: boolean;
  traverse?(callback: (object: ArchitecturalLayerRuntimeRenderable) => void): void;
  isMesh?: boolean;
  isLine?: boolean;
  isLineSegments?: boolean;
  isPoints?: boolean;
};

export type ArchitecturalLayerMembership = {
  parentNodeId:
    | 'architecture-walls'
    | 'architecture-doors'
    | 'architecture-windows'
    | 'architecture-review-helpers'
    | 'architecture-other';
  wallChildNodeId:
    | 'architecture-walls-exterior'
    | 'architecture-walls-party'
    | 'architecture-walls-interior'
    | null;
};

export type ArchitecturalLayerRegistryEntry<T extends ArchitecturalLayerRuntimeRenderable> = {
  object: T;
  descriptor: ArchitecturalSemanticDescriptor;
  membership: ArchitecturalLayerMembership;
  sourcePresentationVisible: boolean;
};

export type ArchitecturalLayerRegistry<T extends ArchitecturalLayerRuntimeRenderable> = {
  entries: ArchitecturalLayerRegistryEntry<T>[];
  counts: Record<ViewerArchitecturalLayerNodeId, number>;
};

export const isArchitecturalLayerRenderable = (
  object: ArchitecturalLayerRuntimeRenderable | null | undefined,
) =>
  object?.isMesh === true ||
  object?.isLine === true ||
  object?.isLineSegments === true ||
  object?.isPoints === true;

export const architecturalLayerMembership = (
  descriptor: ArchitecturalSemanticDescriptor,
): ArchitecturalLayerMembership => {
  if (descriptor.representationRole === 'REVIEW_HELPER') {
    return {
      parentNodeId: 'architecture-review-helpers',
      wallChildNodeId: null,
    };
  }

  if (descriptor.buildingPartFamily === 'WALL') {
    const wallChildNodeId =
      descriptor.semanticWallFamily === 'EXTERIOR'
        ? 'architecture-walls-exterior'
        : descriptor.semanticWallFamily === 'PARTY'
          ? 'architecture-walls-party'
          : descriptor.semanticWallFamily === 'INTERIOR'
            ? 'architecture-walls-interior'
            : null;

    return {
      parentNodeId: 'architecture-walls',
      wallChildNodeId,
    };
  }

  if (descriptor.buildingPartFamily === 'DOOR') {
    return {
      parentNodeId: 'architecture-doors',
      wallChildNodeId: null,
    };
  }

  if (descriptor.buildingPartFamily === 'WINDOW') {
    return {
      parentNodeId: 'architecture-windows',
      wallChildNodeId: null,
    };
  }

  return {
    parentNodeId: 'architecture-other',
    wallChildNodeId: null,
  };
};

const emptyArchitecturalCounts = (): Record<ViewerArchitecturalLayerNodeId, number> => ({
  architecture: 0,
  'architecture-walls': 0,
  'architecture-walls-exterior': 0,
  'architecture-walls-party': 0,
  'architecture-walls-interior': 0,
  'architecture-doors': 0,
  'architecture-windows': 0,
  'architecture-review-helpers': 0,
  'architecture-other': 0,
});

export const createArchitecturalLayerRegistry = <
  T extends ArchitecturalLayerRuntimeRenderable,
>(
  root: { traverse(callback: (object: T) => void): void } | null | undefined,
  resolveDescriptor: (object: T) => ArchitecturalSemanticDescriptor,
  options: {
    exclude?: (object: T) => boolean;
  } = {},
): ArchitecturalLayerRegistry<T> => {
  const entries: ArchitecturalLayerRegistryEntry<T>[] = [];
  const counts = emptyArchitecturalCounts();

  root?.traverse((object: T) => {
    if (!isArchitecturalLayerRenderable(object) || options.exclude?.(object)) return;

    const descriptor = resolveDescriptor(object);
    const membership = architecturalLayerMembership(descriptor);
    entries.push({
      object,
      descriptor,
      membership,
      sourcePresentationVisible: object.visible,
    });

    counts.architecture += 1;
    counts[membership.parentNodeId] += 1;
    if (membership.wallChildNodeId) counts[membership.wallChildNodeId] += 1;
  });

  return { entries, counts };
};

export const isArchitecturalMembershipVisible = (
  layers: ViewerLayerControlsState,
  membership: ArchitecturalLayerMembership,
) => {
  if (!isViewerLayerNodeEffectivelyVisible(layers, 'architecture')) return false;
  if (!isViewerLayerNodeEffectivelyVisible(layers, membership.parentNodeId)) return false;
  if (
    membership.wallChildNodeId &&
    !isViewerLayerNodeEffectivelyVisible(layers, membership.wallChildNodeId)
  ) {
    return false;
  }
  return true;
};

export const architecturalEntryBaseVisibility = (
  layers: ViewerLayerControlsState,
  entry: ArchitecturalLayerRegistryEntry<ArchitecturalLayerRuntimeRenderable>,
) =>
  entry.sourcePresentationVisible &&
  isArchitecturalMembershipVisible(layers, entry.membership);

const entriesForParent = <T extends ArchitecturalLayerRuntimeRenderable>(
  registry: ArchitecturalLayerRegistry<T>,
  parentNodeId: ViewerArchitecturalParentNodeId,
) =>
  parentNodeId === 'architecture'
    ? registry.entries
    : registry.entries.filter(
        (entry) => entry.membership.parentNodeId === 'architecture-walls',
      );

export const architecturalRuntimeParentVisibilityState = <
  T extends ArchitecturalLayerRuntimeRenderable,
>(
  registry: ArchitecturalLayerRegistry<T>,
  layers: ViewerLayerControlsState,
  parentNodeId: ViewerArchitecturalParentNodeId,
): ViewerLayerParentVisibilityState => {
  if (!isViewerLayerNodeEffectivelyVisible(layers, parentNodeId)) return 'off';

  const entries = entriesForParent(registry, parentNodeId);
  if (entries.length === 0) return 'all';

  const visibleCount = entries.filter(
    (entry) =>
      entry.sourcePresentationVisible &&
      isArchitecturalMembershipVisible(layers, entry.membership),
  ).length;

  if (visibleCount === 0) return 'none';
  if (visibleCount === entries.length) return 'all';
  return 'mixed';
};

export const updateArchitecturalPresentationBaseline = <
  T extends ArchitecturalLayerRuntimeRenderable,
>(
  registry: ArchitecturalLayerRegistry<T>,
  resolveVisibility: (entry: ArchitecturalLayerRegistryEntry<T>) => boolean,
) => {
  for (const entry of registry.entries) {
    entry.sourcePresentationVisible = resolveVisibility(entry);
  }
};
