import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { prepareP186FX4FloorPlanGuide } from '../../src/scripts/privateModelP186FX4PlanContext';

test('source D1F P123C wall is reused and seven P117D footprints hidden', () => {
  const interior = new THREE.Group();
  // Mirrors the sanitized display name GLTFLoader can assign to the actual
  // D CURRENT INTERIOR source scene; exact P123C mesh identity is still checked.
  interior.name = 'D_CURRENT_INTERIOR_-_BABYLON_Y-UP';
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(
    Array.from({ length: 528 }, (_value, i) => i % 3 === 0 ? 6 : i % 3 === 1 ? 1 : 10), 3,
  ));
  const material = new THREE.MeshBasicMaterial({ color: 0x23aa55 });
  material.name = 'P123C_D_REVIEW_WALL_TRANSPARENT';
  const original = new THREE.Mesh(geometry, material);
  original.name = 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';
  original.userData = { Pass: '123C', sourceP123BNode: 434,
    windowOpeningCount: 3, doorCutoutCount: 0 };
  interior.add(original);
  const review = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const footprint = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1));
    footprint.userData = { p186fReviewRole: 'D_1F_ROOM_CONTEXT_20',
      p186dReviewRoomContextBridge: true, representationKind: 'referenceFootprint' };
    review.add(footprint);
  }
  const targets = new THREE.Box3(
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 2, 2),
  );
  const out = prepareP186FX4FloorPlanGuide(review, interior, targets);
  expect(out.originalGreenWallCount).toBe(1);
  expect(out.roomFootprintCount).toBe(0);
  expect(out.suppressedRoomFootprintCount).toBe(7);
  expect(out.physicalDevicePlacementConfirmed).toBe(false);
  expect(review.children.slice(0, 7).every(x => !x.visible)).toBe(true);
  const bridge = review.children.at(-1) as THREE.Mesh;
  expect(bridge.geometry).toBe(original.geometry);
  expect(bridge.material).toBe(original.material);
  expect(bridge.userData.sourceNodeIndex).toBe(798);
  expect(prepareP186FX4FloorPlanGuide(review, interior, targets).originalGreenWallCount).toBe(1);
  expect(review.children).toHaveLength(8);
});

test('missing source wall never falls back to room areas', () => {
  const interior = new THREE.Group();
  interior.name = 'D CURRENT INTERIOR - BABYLON Y-UP';
  const review = new THREE.Group();
  const targets = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
  expect(() => prepareP186FX4FloorPlanGuide(review, interior, targets))
    .toThrow('original D1F wall missing/duplicated');
});

test('wrong source scene fails closed even if its display name contains D1F', () => {
  const interior = new THREE.Group();
  interior.name = 'D_2F_CURRENT_INTERIOR_-_BABYLON_Y-UP';
  const review = new THREE.Group();
  const targets = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
  expect(() => prepareP186FX4FloorPlanGuide(review, interior, targets))
    .toThrow('exact D1F green-wall source unavailable');
});

test('original P123C D1F wall preserves its exact world transform in the X4 plan', () => {
  // A distinct source and review parent transform must not shift the real wall.
  const interior = new THREE.Group();
  interior.name = 'D CURRENT INTERIOR - BABYLON Y-UP';
  interior.position.set(2.3, 1.2, -4.1);
  interior.rotation.x = -Math.PI / 2;

  const wallParent = new THREE.Group();
  wallParent.position.set(0.42, -0.18, 0.71);
  wallParent.rotation.z = 0.13;
  interior.add(wallParent);

  const geometry = new THREE.BufferGeometry();
  const positions = Array.from({ length: 176 }, (_unused, i) => [
    (i % 11) * 0.42,
    Math.floor(i / 11) * 0.11,
    (i % 5) * 0.27,
  ]).flat();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.MeshBasicMaterial({ color: 0x23aa55 });
  material.name = 'P123C_D_REVIEW_WALL_TRANSPARENT';
  const source = new THREE.Mesh(geometry, material);
  source.name = 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';
  source.position.set(0.6, 0.3, 0.9);
  source.userData = {
    Pass: '123C', sourceP123BNode: 434, windowOpeningCount: 3, doorCutoutCount: 0,
  };
  wallParent.add(source);

  const reviewParent = new THREE.Group();
  reviewParent.position.set(-1.4, 2.2, 0.7);
  reviewParent.rotation.y = -0.2;
  const review = new THREE.Group();
  review.position.set(0.34, -0.2, 0.15);
  reviewParent.add(review);
  for (let i = 0; i < 7; i++) {
    const footprint = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1));
    footprint.userData = {
      p186fReviewRole: 'D_1F_ROOM_CONTEXT_20',
      p186dReviewRoomContextBridge: true,
      representationKind: 'referenceFootprint',
    };
    review.add(footprint);
  }
  interior.updateWorldMatrix(true, true);
  reviewParent.updateWorldMatrix(true, true);
  source.updateWorldMatrix(true, false);
  const sourceWorldBefore = source.matrixWorld.clone();
  const sourceBounds = new THREE.Box3().setFromObject(source);
  const sourcePositionBefore = source.position.clone();

  const targets = new THREE.Box3(
    new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1),
  );
  const result = prepareP186FX4FloorPlanGuide(review, interior, targets);
  expect(result.originalGreenWallCount).toBe(1);
  expect(result.suppressedRoomFootprintCount).toBe(7);
  expect(result.roomFootprintCount).toBe(0);
  const bridge = review.children.find(x => x.userData.p186fX4OriginalGreenWallBridge) as THREE.Mesh;
  expect(bridge).toBeTruthy();
  expect(bridge.geometry).toBe(source.geometry);
  expect(bridge.material).toBe(source.material);
  expect(bridge.userData.sourceNodeIndex).toBe(798);
  reviewParent.updateWorldMatrix(true, true);
  source.updateWorldMatrix(true, false);
  bridge.updateWorldMatrix(true, false);
  for (let i = 0; i < 16; i++) {
    expect(bridge.matrixWorld.elements[i]).toBeCloseTo(sourceWorldBefore.elements[i], 6);
    expect(source.matrixWorld.elements[i]).toBeCloseTo(sourceWorldBefore.elements[i], 6);
  }
  const bridgeBounds = new THREE.Box3().setFromObject(bridge);
  for (const axis of ['x', 'y', 'z'] as const) {
    expect(bridgeBounds.min[axis]).toBeCloseTo(sourceBounds.min[axis], 5);
    expect(bridgeBounds.max[axis]).toBeCloseTo(sourceBounds.max[axis], 5);
  }
  expect(source.position.equals(sourcePositionBefore)).toBe(true);
  expect(review.children.filter(x => x.userData.p186fX4OriginalGreenWallBridge)).toHaveLength(1);
  expect(review.children.slice(0, 7).every(x => !x.visible)).toBe(true);
  expect(prepareP186FX4FloorPlanGuide(review, interior, targets).originalGreenWallCount).toBe(1);
  expect(review.children.filter(x => x.userData.p186fX4OriginalGreenWallBridge)).toHaveLength(1);
});
