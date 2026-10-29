import { expect, test } from '@playwright/test';
import {
  createViewerLayerControlsState,
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  getViewerLayerParentMode,
  resolveScopedViewerLayerMode,
  viewerArchitecturalWallChildNodeIds,
  type ViewerLayerModeMap,
  type ViewerLayerVisibilityMode,
} from '../../src/scripts/privateModelLayerHierarchyState';

test('Layers fail closed if persisted node mode is absent or malformed', () => {
  const defaults = createViewerLayerModeMap(createViewerLayerControlsState());
  expect(getViewerLayerEffectiveMode(defaults, 'architecture-doors')).toBe('visible');

  const missingChild = { ...defaults } as Partial<ViewerLayerModeMap>;
  delete missingChild['architecture-doors'];
  expect(
    getViewerLayerEffectiveMode(missingChild as ViewerLayerModeMap, 'architecture-doors'),
  ).toBe('hidden');

  const invalidChild = {
    ...defaults,
    'architecture-walls-party': 'opaque',
  } as unknown as ViewerLayerModeMap;
  expect(getViewerLayerEffectiveMode(invalidChild, 'architecture-walls-party')).toBe('hidden');
  expect(
    getViewerLayerParentMode(
      invalidChild,
      'architecture-walls',
      viewerArchitecturalWallChildNodeIds,
    ),
  ).toBe('mixed');

  const missingParent = { ...defaults } as Partial<ViewerLayerModeMap>;
  delete missingParent['architecture-walls'];
  expect(
    getViewerLayerEffectiveMode(missingParent as ViewerLayerModeMap, 'architecture-walls-exterior'),
  ).toBe('hidden');
  expect(
    getViewerLayerParentMode(
      missingParent as ViewerLayerModeMap,
      'architecture-walls',
      viewerArchitecturalWallChildNodeIds,
    ),
  ).toBe('hidden');

  const invalidRoot = { ...defaults, architecture: 'unknown' } as unknown as ViewerLayerModeMap;
  expect(getViewerLayerEffectiveMode(invalidRoot, 'architecture-windows')).toBe('hidden');
  expect(getViewerLayerEffectiveMode(invalidRoot, 'architecture')).toBe('hidden');
});

test('Layers preserve valid visible/ghost modes and reject invalid scoped mode', () => {
  const modes = createViewerLayerModeMap(createViewerLayerControlsState());
  const ghost = { ...modes, 'architecture-walls': 'ghost' } as ViewerLayerModeMap;
  expect(getViewerLayerEffectiveMode(ghost, 'architecture-walls-exterior')).toBe('ghost');
  expect(getViewerLayerEffectiveMode(modes, 'roof')).toBe('visible');
  expect(resolveScopedViewerLayerMode('ghost', true, true)).toBe('ghost');
  expect(resolveScopedViewerLayerMode('visible', true, true)).toBe('visible');
  expect(
    resolveScopedViewerLayerMode('opaque' as ViewerLayerVisibilityMode, true, true),
  ).toBe('hidden');
});
