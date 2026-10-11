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
