import { expect, test } from '@playwright/test';
import {
  createViewerLayerControlsState,
  viewerArchitecturalParentVisibilityState,
  viewerArchitecturalRootChildNodeIds,
  viewerArchitecturalWallChildNodeIds,
  type ViewerArchitecturalLayerChildNodeId,
} from '../../src/scripts/privateModelLayerHierarchyState';

const externalChildren = (ids: string[]) => ids as ViewerArchitecturalLayerChildNodeId[];

test('architectural wall summary excludes known IDs belonging to other branches', () => {
  const state = createViewerLayerControlsState({
    architectureVisible: true,
    architectureWallsVisible: true,
    architectureExteriorWallsVisible: true,
    architecturePartyWallsVisible: false,
    architectureInteriorWallsVisible: false,
    architectureDoorsVisible: true,
  });

  expect(viewerArchitecturalParentVisibilityState(
    state, 'architecture-walls', externalChildren(['architecture-doors']),
  )).toBe('none');
  expect(viewerArchitecturalParentVisibilityState(
    state, 'architecture-walls', externalChildren(['architecture-walls-exterior', 'architecture-doors']),
  )).toBe('mixed');
  expect(viewerArchitecturalParentVisibilityState(
    state, 'architecture-walls', viewerArchitecturalWallChildNodeIds,
  )).toBe('mixed');

  for (const invalid of ['unknown-source-node', '__proto__', 'constructor']) {
    expect(viewerArchitecturalParentVisibilityState(
      state, 'architecture-walls', externalChildren([invalid]),
    )).toBe('none');
  }
});

test('architectural root summary preserves the curated legacy root children', () => {
  const allVisible = createViewerLayerControlsState({
    architectureCeilingsVisible: true,
  });
  expect(viewerArchitecturalParentVisibilityState(
    allVisible, 'architecture', viewerArchitecturalRootChildNodeIds,
  )).toBe('all');
  // These legitimate legacy children intentionally have no R1 capability parent.
  for (const id of ['architecture-review-helpers', 'architecture-fixtures', 'architecture-other']) {
    expect(viewerArchitecturalParentVisibilityState(
      allVisible, 'architecture', externalChildren([id]),
    )).toBe('all');
  }
  expect(viewerArchitecturalParentVisibilityState(
    allVisible, 'architecture', externalChildren(['architecture-walls-exterior']),
  )).toBe('none');
  expect(viewerArchitecturalParentVisibilityState(
    allVisible, 'architecture', externalChildren(['architecture-walls', 'architecture-walls-exterior']),
  )).toBe('mixed');

  expect(viewerArchitecturalParentVisibilityState(
    createViewerLayerControlsState({ architectureVisible: false }),
    'architecture', viewerArchitecturalRootChildNodeIds,
  )).toBe('off');
  expect(viewerArchitecturalParentVisibilityState(
    createViewerLayerControlsState({ architectureWallsVisible: false }),
    'architecture-walls', viewerArchitecturalWallChildNodeIds,
  )).toBe('off');
  expect(viewerArchitecturalParentVisibilityState(
    allVisible, 'architecture', [],
  )).toBe('all');
});
