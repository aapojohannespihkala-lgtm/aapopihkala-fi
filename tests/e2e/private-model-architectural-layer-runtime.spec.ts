import { expect, test } from '@playwright/test';

import {
  architecturalLayerMembership,
  architecturalRuntimeParentVisibilityState,
  createArchitecturalLayerRegistry,
  isArchitecturalMembershipVisible,
} from '../../src/scripts/privateModelArchitecturalLayerRuntime';
import {
  createViewerLayerControlsState,
  setViewerLayerNodeVisible,
} from '../../src/scripts/privateModelLayerHierarchyState';
import type {
  ArchitecturalSemanticDescriptor,
  ArchitecturalBuildingPartFamily,
  ArchitecturalRepresentationRole,
  ArchitecturalWallFamily,
} from '../../src/scripts/privateModelSceneSemantics';

const descriptor = (
  buildingPartFamily: ArchitecturalBuildingPartFamily,
  semanticWallFamily: ArchitecturalWallFamily = 'UNCLASSIFIED',
  representationRole: ArchitecturalRepresentationRole = 'PHYSICAL',
): ArchitecturalSemanticDescriptor => ({
  buildingPartFamily,
  semanticWallFamily,
  representationRole,
  physicalClaimStatus: representationRole === 'PHYSICAL' ? 'YES' : 'NO',
  labelFi: 'test',
  classLabelFi: 'test',
  representationLabelFi: 'test',
  statusLabelFi: 'test',
  physicalClaimLabelFi: 'test',
  storey: '-',
});

test('V4A maps only V3 descriptor semantics into architectural Layerit groups', () => {
  expect(architecturalLayerMembership(descriptor('WALL', 'EXTERIOR'))).toEqual({
    parentNodeId: 'architecture-walls',
    wallChildNodeId: 'architecture-walls-exterior',
  });
  expect(architecturalLayerMembership(descriptor('WALL', 'PARTY', 'REFERENCE'))).toEqual({
    parentNodeId: 'architecture-walls',
    wallChildNodeId: 'architecture-walls-party',
  });
  expect(architecturalLayerMembership(descriptor('WALL', 'INTERIOR'))).toEqual({
    parentNodeId: 'architecture-walls',
    wallChildNodeId: 'architecture-walls-interior',
  });
  expect(
    architecturalLayerMembership(
      descriptor('WALL', 'UNRESOLVED_SEMANTIC_CONFLICT'),
    ),
  ).toEqual({
    parentNodeId: 'architecture-walls',
    wallChildNodeId: null,
  });
  expect(architecturalLayerMembership(descriptor('DOOR'))).toEqual({
    parentNodeId: 'architecture-doors',
    wallChildNodeId: null,
  });
  expect(architecturalLayerMembership(descriptor('WINDOW'))).toEqual({
    parentNodeId: 'architecture-windows',
    wallChildNodeId: null,
  });
  expect(
    architecturalLayerMembership(descriptor('WALL', 'EXTERIOR', 'REVIEW_HELPER')),
  ).toEqual({
    parentNodeId: 'architecture-review-helpers',
    wallChildNodeId: null,
  });
  expect(architecturalLayerMembership(descriptor('OTHER'))).toEqual({
    parentNodeId: 'architecture-other',
    wallChildNodeId: null,
  });
});

test('V4A registry counts renderables only and permits explicit system exclusion', () => {
  const objects = [
    { visible: true, isMesh: true, semantic: descriptor('WALL', 'EXTERIOR') },
    { visible: true, isLine: true, semantic: descriptor('DOOR') },
    { visible: true, isPoints: true, semantic: descriptor('WINDOW') },
    {
      visible: true,
      isLineSegments: true,
      semantic: descriptor('WALL', 'PARTY', 'REVIEW_HELPER'),
    },
    { visible: true, isMesh: false, semantic: descriptor('OTHER') },
    { visible: true, isMesh: true, excluded: true, semantic: descriptor('OTHER') },
  ];
  const root = {
    traverse(callback: (object: (typeof objects)[number]) => void) {
      for (const object of objects) callback(object);
    },
  };

  const registry = createArchitecturalLayerRegistry(
    root,
    (object) => object.semantic,
    { exclude: (object) => object.excluded === true },
  );

  expect(registry.entries).toHaveLength(4);
  expect(registry.counts).toMatchObject({
    architecture: 4,
    'architecture-walls': 1,
    'architecture-walls-exterior': 1,
    'architecture-walls-party': 0,
    'architecture-walls-interior': 0,
    'architecture-doors': 1,
    'architecture-windows': 1,
    'architecture-review-helpers': 1,
    'architecture-other': 0,
  });
});

test('V4A residual unresolved walls keep Walls parent MIXED when resolved children are off', () => {
  const exterior = {
    visible: true,
    isMesh: true,
    semantic: descriptor('WALL', 'EXTERIOR'),
  };
  const unresolved = {
    visible: true,
    isMesh: true,
    semantic: descriptor('WALL', 'UNRESOLVED_SEMANTIC_CONFLICT'),
  };
  const root = {
    traverse(callback: (object: typeof exterior | typeof unresolved) => void) {
      callback(exterior);
      callback(unresolved);
    },
  };
  const registry = createArchitecturalLayerRegistry(root, (object) => object.semantic);

  let layers = createViewerLayerControlsState();
  layers = setViewerLayerNodeVisible(layers, 'architecture-walls-exterior', false);
  layers = setViewerLayerNodeVisible(layers, 'architecture-walls-party', false);
  layers = setViewerLayerNodeVisible(layers, 'architecture-walls-interior', false);

  expect(
    isArchitecturalMembershipVisible(layers, registry.entries[0].membership),
  ).toBe(false);
  expect(
    isArchitecturalMembershipVisible(layers, registry.entries[1].membership),
  ).toBe(true);
  expect(
    architecturalRuntimeParentVisibilityState(
      registry,
      layers,
      'architecture-walls',
    ),
  ).toBe('mixed');

  layers = setViewerLayerNodeVisible(layers, 'architecture-walls', false);
  expect(
    architecturalRuntimeParentVisibilityState(
      registry,
      layers,
      'architecture-walls',
    ),
  ).toBe('off');
});

test('V4A source presentation visibility participates in runtime parent state', () => {
  const hiddenDoor = {
    visible: false,
    isMesh: true,
    semantic: descriptor('DOOR'),
  };
  const visibleWindow = {
    visible: true,
    isMesh: true,
    semantic: descriptor('WINDOW'),
  };
  const root = {
    traverse(callback: (object: typeof hiddenDoor | typeof visibleWindow) => void) {
      callback(hiddenDoor);
      callback(visibleWindow);
    },
  };
  const registry = createArchitecturalLayerRegistry(root, (object) => object.semantic);
  const layers = createViewerLayerControlsState();

  expect(
    architecturalRuntimeParentVisibilityState(registry, layers, 'architecture'),
  ).toBe('mixed');
});
