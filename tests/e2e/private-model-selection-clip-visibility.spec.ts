import {expect, test} from '@playwright/test';
import * as THREE from 'three';
import {pickSelectableObjectAtClientPoint} from '../../src/scripts/privateModelSelectionPicking';
import {hasVisibleMaterial, isEffectivelyVisible} from '../../src/scripts/privateModelObjectVisibility';

const setup = () => {
  const root = new THREE.Group();
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({side: THREE.DoubleSide}),
  );
  front.name = 'CLIPPED_FRONT';
  front.position.set(0, 2, 2);
  const rear = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({side: THREE.DoubleSide}),
  );
  rear.name = 'VISIBLE_REAR';
  rear.position.set(0, -2, -2);
  root.add(front, rear);
  root.updateMatrixWorld(true);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 6, 6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const dataset = {
    interactionMode: 'select',
    horizontalClip: 'inactive',
  } as unknown as DOMStringMap;
  const canvas = {
    dataset,
    getBoundingClientRect: () => ({left: 0, top: 0, width: 200, height: 200}),
  };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pick = () => pickSelectableObjectAtClientPoint({
    canvas, camera, modelRoot: root, raycaster, pointer,
    clientX: 100, clientY: 100, isEffectivelyVisible, hasVisibleMaterial,
  });
  return {root, front, rear, camera, dataset, pick};
};

test('selection ignores a globally clipped front object and selects the visible rear', () => {
  const s = setup();
  expect(s.pick()).toBe(s.front);
  s.dataset.horizontalClip = 'active';
  s.dataset.horizontalClipHeightM = '0.000';
  s.dataset.horizontalClipSide = 'above';
  expect(s.pick()).toBe(s.rear);
  s.dataset.horizontalClip = 'inactive';
  expect(s.pick()).toBe(s.front);
});

test('selection returns null when all raycast surfaces are horizontally clipped', () => {
  const s = setup();
  s.dataset.horizontalClip = 'active';
  s.dataset.horizontalClipHeightM = '-10.000';
  s.dataset.horizontalClipSide = 'above';
  expect(s.pick()).toBeNull();
});

test('invalid or unsupported active clip metadata fails closed', () => {
  const s = setup();
  s.dataset.horizontalClip = 'active';
  s.dataset.horizontalClipSide = 'above';
  expect(s.pick()).toBeNull();
  s.dataset.horizontalClipHeightM = '0.000';
  s.dataset.horizontalClipSide = 'below';
  expect(s.pick()).toBeNull();
});

test('material-local clipping skips an invisible front mesh, without global cut', () => {
  const s = setup();
  (s.front.material as THREE.MeshBasicMaterial).clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
  ];
  expect(s.pick()).toBe(s.rear);
});

test('multi-material clipping inspects the hit face, not other visible groups', () => {
  const s = setup();
  s.camera.position.set(0, 0, 8);
  s.camera.lookAt(0, 0, 0);
  s.camera.updateMatrixWorld(true);
  s.front.position.set(0, 0, 2);
  s.rear.position.set(0, 0, -2);
  s.root.updateMatrixWorld(true);
  const materials = Array.from({length: 6}, () =>
    new THREE.MeshBasicMaterial({side: THREE.DoubleSide}),
  );
  // Camera ray hits BoxGeometry's +Z and -Z groups (4 and 5).
  // Four other visible groups must not make the clipped faces selectable.
  materials[4].clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
  materials[5].clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
  s.front.material = materials;
  expect(s.pick()).toBe(s.rear);
});

test('material clipIntersection follows the Three.js union of allowed halves', () => {
  const s = setup();
  const material = s.front.material as THREE.MeshBasicMaterial;
  material.clipIntersection = true;
  material.clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 10),
  ];
  expect(s.pick()).toBe(s.front);
});

test('selection stays inert outside select interaction mode', () => {
  const s = setup();
  s.dataset.interactionMode = 'navigate';
  expect(s.pick()).toBeNull();
});
