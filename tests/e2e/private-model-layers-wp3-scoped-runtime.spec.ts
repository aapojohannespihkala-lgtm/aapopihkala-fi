import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from 'three';
import {
  createViewerScopedLayerPresentation,
  type ViewerScopedLayerGate,
  type ViewerScopedLayerFrame,
} from '../../src/scripts/privateModelLayerScopedPresentationBridge';
import {
  applyViewerLayerPreset,
  createViewerInteractionState,
  setViewerCameraView,
  setViewerInteractionLayerMode,
} from '../../src/scripts/privateModelViewerState';

const makeRoot = (scene: Scene, material = new MeshBasicMaterial()) => {
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
  root.add(mesh);
  scene.add(root);
  return { root, mesh, material };
};

const allow = (): ViewerScopedLayerGate =>
  ({ scopeAllowed: true, floorAllowed: true, sourceAllowed: true });

const frameFor = (
  scene: Scene,
  gates: Map<Group, ViewerScopedLayerGate>,
  availableNodeIds: string[],
): ViewerScopedLayerFrame => ({
  activeSceneRoot: scene,
  gates,
  availableNodeIds,
});

test('WP3 bridge makes D 2F roof a reversible ghost without changing camera or legacy source material', () => {
  const scene = new Scene();
  const roof = makeRoot(scene);
  const bridge = createViewerScopedLayerPresentation(scene, [{ id: 'roof', root: roof.root }]);
  const old = setViewerCameraView(createViewerInteractionState(), 'elev-neg-y');
  const upstairs = applyViewerLayerPreset(old, 'd-2f');
  expect(upstairs.layers.roofVisible).toBe(false); // old viewer safety fallback unchanged
  expect(upstairs.cameraView).toBe('elev-neg-y');
  expect(bridge.apply(upstairs, frameFor(scene, new Map([[roof.root, allow()]]), ['roof']))).toEqual([
    { id: 'roof', mode: 'ghost' },
  ]);
  expect(roof.root.visible).toBe(true);
  expect(roof.mesh.material).not.toBe(roof.material);
  expect((roof.mesh.material as MeshBasicMaterial).opacity).toBeCloseTo(0.18);
  expect((roof.mesh.material as MeshBasicMaterial).depthWrite).toBe(false);
  expect(roof.material.opacity).toBe(1);
  bridge.reset();
  expect(roof.mesh.material).toBe(roof.material);
  expect(roof.root.visible).toBe(true);
  expect(upstairs.cameraView).toBe('elev-neg-y');
  bridge.dispose();
});

test('WP3 per-root floor and D-area permissions prevent whole-building electrical leakage', () => {
  const scene = new Scene();
  const d2f = makeRoot(scene);
  const otherApartment = makeRoot(scene);
  const firstFloor = makeRoot(scene);
  const bridge = createViewerScopedLayerPresentation(scene, [
    { id: 'locus-water', root: d2f.root },
    { id: 'locus-water', root: otherApartment.root },
    { id: 'locus-water', root: firstFloor.root },
  ]);
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  state = setViewerInteractionLayerMode(state, 'locus', 'visible');
  state = setViewerInteractionLayerMode(state, 'locus-water', 'visible');
  const gates = new Map([
    [d2f.root, allow()],
    [otherApartment.root, { ...allow(), scopeAllowed: false }],
    [firstFloor.root, { ...allow(), floorAllowed: false }],
  ]);
  expect(bridge.apply(state, frameFor(scene, gates, ['locus-water']))).toEqual([
    { id: 'locus-water', mode: 'visible' },
    { id: 'locus-water', mode: 'hidden' },
    { id: 'locus-water', mode: 'hidden' },
  ]);
  expect([d2f.root.visible, otherApartment.root.visible, firstFloor.root.visible]).toEqual([
    true, false, false,
  ]);
  // Changing the selected layer never overrides the stronger per-object gates.
  state = setViewerInteractionLayerMode(state, 'locus-water', 'ghost');
  bridge.apply(state, frameFor(scene, gates, ['locus-water']));
  expect(d2f.mesh.material).not.toBe(d2f.material);
  expect(otherApartment.root.visible).toBe(false);
  expect(firstFloor.root.visible).toBe(false);
  bridge.dispose();
  expect(d2f.mesh.material).toBe(d2f.material);
  expect(otherApartment.root.visible).toBe(true);
  expect(firstFloor.root.visible).toBe(true);
});

test('WP3 missing metadata/source permissions fail closed and explicit restoration works', () => {
  const scene = new Scene();
  const part = makeRoot(scene);
  const bridge = createViewerScopedLayerPresentation(scene, [{ id: 'roof', root: part.root }]);
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  expect(bridge.apply(state, frameFor(scene, new Map(), ['roof']))[0].mode).toBe('hidden');
  expect(part.root.visible).toBe(false);
  expect(bridge.apply(state, frameFor(scene, new Map([[part.root, allow()]]), []))[0].mode).toBe('hidden');
  expect(part.root.visible).toBe(false);
  expect(bridge.apply(state, frameFor(
    scene,
    new Map([[part.root, { ...allow(), sourceAllowed: false }]]),
    ['roof'],
  ))[0].mode).toBe('hidden');
  expect(bridge.apply(state, frameFor(scene, new Map([[part.root, allow()]]), ['roof']))[0].mode).toBe('visible');
  expect(part.root.visible).toBe(true);
  bridge.dispose();
});

test('WP3 stale active scene or reparented root cannot expose geometry', () => {
  const scene = new Scene();
  const secondScene = new Scene();
  const part = makeRoot(scene);
  const bridge = createViewerScopedLayerPresentation(scene, [{ id: 'roof', root: part.root }]);
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const f = frameFor(scene, new Map([[part.root, allow()]]), ['roof']);
  bridge.apply(state, f);
  expect(part.root.visible).toBe(true);
  expect(bridge.apply(state, { ...f, activeSceneRoot: secondScene })[0].mode).toBe('hidden');
  expect(part.root.visible).toBe(false);
  secondScene.add(part.root); // simulates accidental root migration to a new scene
  expect(bridge.apply(state, f)[0].mode).toBe('hidden');
  expect(part.root.visible).toBe(false);
  bridge.dispose();
});

test('WP3 rejects whole-scene, foreign-scene, duplicate and ancestor-overlapping layer roots', () => {
  const scene = new Scene();
  const elsewhere = new Scene();
  const parent = makeRoot(scene);
  const child = new Group();
  parent.root.add(child);
  expect(() => createViewerScopedLayerPresentation(scene, [{ id: 'roof', root: scene }])).toThrow();
  expect(() => createViewerScopedLayerPresentation(scene, [{ id: 'roof', root: elsewhere }])).toThrow();
  expect(() => createViewerScopedLayerPresentation(scene, [
    { id: 'roof', root: parent.root },
    { id: 'architecture-walls', root: child },
  ])).toThrow(/Overlapping/);
  expect(() => createViewerScopedLayerPresentation(scene, [
    { id: 'roof', root: parent.root },
    { id: 'roof', root: parent.root },
  ])).toThrow(/Overlapping/);
  expect(() => createViewerScopedLayerPresentation(scene, [
    { id: 'unverified-technical-inventory' as never, root: parent.root },
  ])).toThrow(/Unknown layer/);
});

test('WP3 ghost keeps selection intact and applies parent ghost mode only inside allowed scene', () => {
  const scene = new Scene();
  const foreignScene = new Scene();
  const wall = makeRoot(scene);
  const foreign = makeRoot(foreignScene);
  const selected = wall.mesh;
  const unselected = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  wall.root.add(unselected);
  const bridge = createViewerScopedLayerPresentation(scene, [
    { id: 'architecture-walls-party', root: wall.root },
  ]);
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  state = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  const f = {
    ...frameFor(scene, new Map([[wall.root, allow()]]), ['architecture-walls-party']),
    isSelected: (mesh: Mesh) => mesh === selected,
  };
  expect(bridge.apply(state, f)[0].mode).toBe('ghost');
  expect(selected.material).toBe(wall.material);
  expect(unselected.material).not.toBe(foreign.material);
  expect((unselected.material as MeshBasicMaterial).transparent).toBe(true);
  expect(foreign.mesh.material).toBe(foreign.material);
  bridge.dispose();
  expect(selected.material).toBe(wall.material);
  expect((unselected.material as MeshBasicMaterial).transparent).toBe(false);
  expect(foreign.root.visible).toBe(true);
  expect(() => bridge.apply(state, f)).toThrow(/disposed/);
});
