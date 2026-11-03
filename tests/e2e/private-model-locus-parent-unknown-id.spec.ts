import { expect, test } from '@playwright/test';
import {
  createViewerLayerControlsState,
  viewerLocusParentVisibilityState,
  type ViewerLocusChildNodeId,
} from '../../src/scripts/privateModelLayerHierarchyState';

// An external source or a persisted list can contain IDs outside the TS union.
// Only verified Locus children may contribute to the parent visibility summary.
const externalIds = (ids: string[]) => ids as ViewerLocusChildNodeId[];

test('unknown Locus child cannot inherit a visible 1974 IV section', () => {
  const state = createViewerLayerControlsState({
    locusVisible: true,
    locusWaterVisible: false,
    locusWastewaterVisible: false,
    p161KvvVisible: false,
    p161IvPlanVisible: false,
    p161IvSectionVisible: true,
  });
  for (const invalid of ['unregistered-locus-layer', '__proto__', 'constructor', 'technical']) {
    expect(viewerLocusParentVisibilityState(state, externalIds([invalid]))).toBe('none');
  }
  expect(viewerLocusParentVisibilityState(state, externalIds([
    'p161-iv-1974-section', 'unregistered-locus-layer',
  ]))).toBe('mixed');
});

test('known Locus children and parent off-state retain their semantics', () => {
  const state = createViewerLayerControlsState({
    locusVisible: true,
    locusWaterVisible: true,
    p161IvSectionVisible: true,
  });
  expect(viewerLocusParentVisibilityState(state, ['locus-water'])).toBe('all');
  expect(viewerLocusParentVisibilityState(state, ['locus-water', 'p161-iv-1974-section'])).toBe('all');
  expect(viewerLocusParentVisibilityState(state, [])).toBe('all');
  expect(viewerLocusParentVisibilityState({
    ...state, locusVisible: false,
  }, externalIds(['unregistered-locus-layer']))).toBe('off');
});
