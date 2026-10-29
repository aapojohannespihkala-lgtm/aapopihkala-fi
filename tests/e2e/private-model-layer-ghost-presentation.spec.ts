import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createViewerLayerGhostPresentation } from '../../src/scripts/privateModelLayerGhostPresentation';

const makeMesh = (material = new MeshBasicMaterial()) =>
  new Mesh(new BoxGeometry(1, 1, 1), material);

test('opaque ghost is copy-on-write and restores exact source material, raycast and order', () => {
  const source = new MeshBasicMaterial({ color: 0x334455 });
  const mesh = makeMesh(source);
  const root = new Group();
  root.add(mesh);
  mesh.renderOrder = 7;
  const originalRaycast = mesh.raycast;
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('ghost', { opacity: 0.17 })).toBe('ghost');
  expect(mesh.material).not.toBe(source);
  const ghost = mesh.material as MeshBasicMaterial;
  expect(ghost.transparent).toBe(true);
  expect(ghost.opacity).toBeCloseTo(0.17);
  expect(ghost.depthWrite).toBe(false);
  expect(ghost.polygonOffset).toBe(true);
  expect(mesh.renderOrder).toBe(8);
  expect(source.transparent).toBe(false);
  expect(source.opacity).toBe(1);
  expect(mesh.raycast).not.toBe(originalRaycast);

  expect(adapter.apply('visible')).toBe('visible');
  expect(mesh.material).toBe(source);
  expect(mesh.renderOrder).toBe(7);
  expect(mesh.raycast).toBe(originalRaycast);
  expect(root.visible).toBe(true);
  adapter.dispose();
});

test('transparent source materials use non-pickable edges, not stacked alpha faces', () => {
  const original = new MeshBasicMaterial({ transparent: true, opacity: 0.3 });
  const mesh = makeMesh(original);
  const root = new Group();
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);
  adapter.apply('ghost');

  expect((mesh.material as MeshBasicMaterial).visible).toBe(false);
  expect(mesh.children).toHaveLength(1);
  expect(mesh.children[0].name).toBe('__VIEWER_GHOST_EDGES_PRESENTATION_ONLY__');
  expect(original.visible).toBe(true);

  const picks = [] as Array<{ distance: number }>;
  mesh.raycast(new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1)), picks as never);
  expect(picks).toHaveLength(0);
  adapter.apply('ghost');
  expect(mesh.children).toHaveLength(1);
  adapter.reset();
  expect(mesh.children).toHaveLength(0);
  expect(mesh.material).toBe(original);
  adapter.dispose();
});

test('scope and hidden take priority; original hidden descendants stay hidden', () => {
  const root = new Group();
  const shown = makeMesh();
  const previouslyHidden = makeMesh();
  previouslyHidden.visible = false;
  root.add(shown, previouslyHidden);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('visible', { scopeAllowed: false })).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('ghost', { scopeAllowed: false })).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('hidden')).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('visible', { scopeAllowed: true })).toBe('visible');
  expect(root.visible).toBe(true);
  expect(previouslyHidden.visible).toBe(false);
  const hiddenMaterial = previouslyHidden.material;
  adapter.apply('ghost');
  expect(previouslyHidden.material).toBe(hiddenMaterial);
  adapter.dispose();
});

test('one scene root never mutates another scene even with shared source material', () => {
  const source = new MeshBasicMaterial({ color: 0x556677 });
  const scene1 = new Group();
  const scene2 = new Group();
  const first = makeMesh(source);
  const second = makeMesh(source);
  scene1.add(first);
  scene2.add(second);
  const adapter = createViewerLayerGhostPresentation(scene1);

  adapter.apply('ghost', { preferEdges: true });
  expect(first.material).not.toBe(source);
  expect(second.material).toBe(source);
  expect(second.visible).toBe(true);
  expect(second.children).toHaveLength(0);
  adapter.apply('hidden');
  expect(scene1.visible).toBe(false);
  expect(scene2.visible).toBe(true);
  adapter.dispose();
  expect(first.material).toBe(source);
});

test('selected material and picking are preserved, while other meshes ghost', () => {
  const root = new Group();
  const selected = makeMesh();
  const other = makeMesh();
  root.add(selected, other);
  const selectedRaycast = selected.raycast;
  const selectedMaterial = selected.material;
  const adapter = createViewerLayerGhostPresentation(root);

  adapter.apply('ghost', { isSelected: (mesh) => mesh === selected });
  expect(selected.material).toBe(selectedMaterial);
  expect(selected.raycast).toBe(selectedRaycast);
  expect(other.material).not.toBe(selectedMaterial);
  adapter.dispose();
});

test('multi-material mesh is restored exactly and repeat reset/dispose is harmless', () => {
  const originals = [new MeshBasicMaterial(), new MeshBasicMaterial()];
  const root = new Group();
  const mesh = makeMesh();
  mesh.material = originals;
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);

  adapter.apply('ghost');
  const clones = mesh.material as MeshBasicMaterial[];
  expect(clones).toHaveLength(2);
  expect(clones[0]).not.toBe(originals[0]);
  expect(clones[1]).not.toBe(originals[1]);
  adapter.reset();
  expect(mesh.material).toBe(originals);
  adapter.dispose();
  adapter.dispose();
  expect(mesh.material).toBe(originals);
  expect(() => adapter.apply('visible')).toThrow(/disposed/);
});

test('originally hidden root is never shown by a preset', () => {
  const root = new Group();
  root.visible = false;
  root.add(makeMesh());
  const adapter = createViewerLayerGhostPresentation(root);
  expect(adapter.apply('visible')).toBe('visible');
  expect(root.visible).toBe(false);
  adapter.apply('ghost');
  expect(root.visible).toBe(false);
  adapter.reset();
  expect(root.visible).toBe(false);
});
