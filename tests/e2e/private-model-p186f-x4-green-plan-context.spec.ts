import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { prepareP186FX4FloorPlanGuide } from '../../src/scripts/privateModelP186FX4PlanContext';

const makeContext = (role: string, width: number, height: number) => {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.15, height),
    new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.2 }),
  );
  object.userData = { p186fReviewRole: role, physicalWallHostClaim: false };
  return object;
};

test('X4 uses whole source D1F green plan without approving a physical wall', () => {
  const scene = new THREE.Group();
  const room = makeContext('D_1F_ROOM_CONTEXT_20', 6.4, 8.7);
  const sourceMaterial = room.material;
  scene.add(room);
  const suppressed = makeContext('NON_QUESTION_CONTEXT_SUPPRESSED', 200, 200);
  suppressed.visible = false;
  scene.add(suppressed);
  scene.updateMatrixWorld(true);
  const thermostatBounds = new THREE.Box3(
    new THREE.Vector3(-0.2, 0.5, -0.2),
    new THREE.Vector3(0.2, 0.8, 0.2),
  );

  const result = prepareP186FX4FloorPlanGuide(scene, thermostatBounds);

  expect(result.visualContextCount).toBe(1);
  expect(result.roomFootprintCount).toBe(1);
  expect(result.sourceWallGuideCount).toBe(0);
  expect(result.floorPlanBounds.min.x).toBeLessThan(-3);
  expect(result.floorPlanBounds.max.z).toBeGreaterThan(4);
  expect(result.placementWallHostApproved).toBe(false);
  expect(result.physicalDevicePlacementConfirmed).toBe(false);
  expect(room.userData.p186fX4GreenPlanGuide).toBe(true);
  expect(room.userData.physicalWallHostClaim).toBe(false);
  expect(room.material).not.toBe(sourceMaterial);
  expect((room.material as any).color.getHex()).toBe(0x16a34a);
  expect((sourceMaterial as any).color.getHex()).toBe(0xe2e8f0);
  expect(suppressed.visible).toBe(false);
});

test('X4 floor plan fails closed without visible source D1F room/wall geometry', () => {
  const scene = new THREE.Group();
  const unrelated = makeContext('NON_QUESTION_CONTEXT_SUPPRESSED', 5, 5);
  scene.add(unrelated);
  const bounds = new THREE.Box3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 1, 1),
  );
  expect(() => prepareP186FX4FloorPlanGuide(scene, bounds)).toThrow(
    'no source-derived D1F plan context',
  );
});

test('X4 one-link runtime uses full green D1F source plan focus but never claims wall-host approval', () => {
  const pageSource = readFileSync(
    resolve(process.cwd(), 'src/pages/private-model/index.astro'),
    'utf8',
  );
  expect(pageSource).toContain('prepareP186FX4FloorPlanGuide(fullModelScene, presentation.targetBounds)');
  expect(pageSource).toContain('ORTHOGRAPHIC_D_1F_FULL_GREEN_SOURCE_PLAN_FOCUS');
  expect(pageSource).toContain("p186fX4PlacementWallHostApproved: 'false'");
  expect(pageSource).toContain("p186fX4PhysicalPlacementConfirmed: 'false'");
  expect(pageSource).toContain('p186fRealWallContextReady: String(presentation.realArchitectureContextReady)');
});
