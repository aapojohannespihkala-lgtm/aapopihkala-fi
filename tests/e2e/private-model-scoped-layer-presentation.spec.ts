import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import {
  createViewerLayerControlsState,
  createViewerLayerModeMap,
  setViewerLayerMode,
  type ViewerLayerNodeId,
} from '../../src/scripts/privateModelLayerHierarchyState';
import {
  createViewerScopedLayerPresentation,
  type ViewerScopedLayerMesh,
} from '../../src/scripts/privateModelScopedLayerPresentation';

const mesh = (material = new MeshBasicMaterial()) =>
  new Mesh(new BoxGeometry(1, 1, 1), material);

const binding = (
  target: Mesh,
  layerId: ViewerLayerNodeId = 'roof',
): ViewerScopedLayerMesh => ({
  mesh: target,
  layerId,
  metadataLayerId: layerId,
  sourceBindingVerified: true,
  sceneAllowed: true,
  scopeAllowed: true,
  storeyAllowed: true,
});

const modes = () => createViewerLayerModeMap(createViewerLayerControlsState());

test('source-scoped ghost is mesh-local; siblings and shared GLB material never change', () => {
  const shared = new MeshBasicMaterial({ color: 0x334455 });
  const root = new Group();
  const roof = mesh(shared);
  const otherApartment = mesh(shared);
  root.add(roof, otherApartment);
  const controller = createViewerScopedLayerPresentation([binding(roof)]);
  const result = controller.apply(setViewerLayerMode(modes(), 'roof', 'ghost'));
  expect(result.get(roof)).toBe('ghost');
  expect(roof.material).not.toBe(shared);
  expect(otherApartment.material).toBe(shared);
  expect(otherApartment.visible).toBe(true);
  expect(root.visible).toBe(true);
  expect(shared.opacity).toBe(1);
  controller.reset();
  expect(roof.material).toBe(shared);
  expect(roof.visible).toBe(true);
  controller.dispose();
});

test('missing, mismatched or unverified metadata fails closed without creating a layer', () => {
  const inputs = [
    { metadataLayerId: 'electricity' },
    { metadataLayerId: null },
    { sourceBindingVerified: false },
    { sceneAllowed: false },
    { scopeAllowed: false },
    { storeyAllowed: false },
  ];
  for (const override of inputs) {
    const target = mesh();
    const controller = createViewerScopedLayerPresentation([
      { ...binding(target), ...override },
    ]);
    expect(controller.apply(modes()).get(target)).toBe('hidden');
    expect(target.visible).toBe(false);
    controller.dispose();
    expect(target.visible).toBe(true);
  }
});

test('a D 2F control never reveals A-C or the D 1F electrical analog', () => {
  // An electrical label is NOT present in this source-backed hierarchy:
  // this test uses a supported technical-layer ID and requires separate
  // scope AND floor gates for every mesh, even with the parent enabled.
  const d2 = mesh();
  const d1 = mesh();
  const ac = mesh();
  const id: ViewerLayerNodeId = 'p161-kvv-2017';
  const controller = createViewerScopedLayerPresentation([
    binding(d2, id),
    { ...binding(d1, id), storeyAllowed: false },
    { ...binding(ac, id), scopeAllowed: false },
  ]);
  let state = setViewerLayerMode(modes(), 'locus', 'visible');
  state = setViewerLayerMode(state, id, 'visible');
  const actual = controller.apply(state);
  expect(actual.get(d2)).toBe('visible');
  expect(actual.get(d1)).toBe('hidden');
  expect(actual.get(ac)).toBe('hidden');
  expect(d2.visible).toBe(true);
  expect(d1.visible).toBe(false);
  expect(ac.visible).toBe(false);
  controller.dispose();
  expect(d1.visible).toBe(true);
  expect(ac.visible).toBe(true);
});

test('parent ghost propagates and parent hidden wins; source-hidden roots never turn visible', () => {
  const wall = mesh();
  const sourceHidden = mesh();
  sourceHidden.visible = false;
  const controller = createViewerScopedLayerPresentation([
    binding(wall, 'architecture-walls-party'),
    binding(sourceHidden, 'architecture-walls-party'),
  ]);
  const originalMaterial = wall.material;
  const state = setViewerLayerMode(modes(), 'architecture', 'ghost');
  let actual = controller.apply(state);
  expect(actual.get(wall)).toBe('ghost');
  expect(wall.material).not.toBe(originalMaterial);
  expect(sourceHidden.visible).toBe(false);
  actual = controller.apply(setViewerLayerMode(state, 'architecture', 'hidden'));
  expect(actual.get(wall)).toBe('hidden');
  expect(wall.visible).toBe(false);
  controller.reset();
  expect(wall.visible).toBe(true);
  expect(wall.material).toBe(originalMaterial);
  expect(sourceHidden.visible).toBe(false);
  controller.dispose();
});

test('selected meshes retain original picking and material; non-selected ghost restores', () => {
  const picked = mesh();
  const unpicked = mesh();
  const pickedMaterial = picked.material;
  const unpickedMaterial = unpicked.material;
  const pickedRaycast = picked.raycast;
  const controller = createViewerScopedLayerPresentation([
    binding(picked),
    binding(unpicked),
  ]);
  controller.apply(setViewerLayerMode(modes(), 'roof', 'ghost'), {
    isSelected: (object) => object === picked,
  });
  expect(picked.material).toBe(pickedMaterial);
  expect(picked.raycast).toBe(pickedRaycast);
  expect(unpicked.material).not.toBe(unpickedMaterial);
  controller.dispose();
  expect(unpicked.material).toBe(unpickedMaterial);
  expect(unpicked.raycast).toBe(pickedRaycast);
});

test('rejects duplicate/parent-bearing meshes before any mutation', () => {
  const a = mesh();
  const child = mesh();
  a.add(child);
  expect(() => createViewerScopedLayerPresentation([binding(a)]))
    .toThrow('leaf Mesh');
  expect(a.visible).toBe(true);
  a.remove(child);
  expect(() => createViewerScopedLayerPresentation([binding(a), binding(a)]))
    .toThrow('more than one layer');
  expect(a.material).toBeInstanceOf(MeshBasicMaterial);
});

test('atomic reset on callback error and dispose guard', () => {
  const first = mesh();
  const second = mesh();
  const firstMaterial = first.material;
  const adapter = createViewerScopedLayerPresentation([binding(first), binding(second)]);
  let index = 0;
  expect(() => adapter.apply(setViewerLayerMode(modes(), 'roof', 'ghost'), {
    isSelected: () => {
      index += 1;
      if (index === 2) throw new Error('selection callback failed');
      return false;
    },
  })).toThrow('selection callback failed');
  expect(first.material).toBe(firstMaterial);
  expect(first.visible).toBe(true);
  adapter.dispose();
  expect(() => adapter.apply(modes())).toThrow('already disposed');
});
