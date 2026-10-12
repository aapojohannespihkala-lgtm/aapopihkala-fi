import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import {
  deriveP137ETwoFaceSourceCameras,
  p137eTwoFaceTargets,
} from '../../src/scripts/privateModelP137ETwoSidedSourceCamera';

const noPromotion = {
  current: false, Canonical: false, asBuilt: false,
  publishToCURRENT: false, HUMAN_REVIEW: 'NOT_RUN',
};

function focusedScene67Fixture() {
  const root = new Group();
  root.name = 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP';
  root.rotation.x = -Math.PI / 2;
  root.userData = {
    ...noPromotion, Pass: 'P137E', WORK_TEST_ONLY: true,
    sourceOriginalWallNode: 798, sourceOriginalWallMesh: 406,
  };
  const originalWall = new Group();
  originalWall.name =
    'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE';
  originalWall.userData = {
    sourceNodeIndex: 798, sourceMeshIndex: 406,
    originalSourceGeometryUnmodified: true, presentationOnly: true,
  };
  root.add(originalWall);
  p137eTwoFaceTargets.forEach((record, index) => {
    const device = new Group();
    device.name = 'P137E_THEMO_' + index;
    device.position.set(index === 2 ? 4.88 : index === 1 ? 3.69 : 3.73,
      record.faceYM, 1.48);
    device.userData = {
      ...noPromotion,
      logicalDeviceId: record.id,
      representationKind: 'photoReferencedThermostatWallMountWorkTest',
      sourceFaceSide: record.side,
      frontFacesTowardYSign: record.frontSign,
      sourceFaceYM: record.faceYM, backplateContactYM: record.faceYM,
      wallBackplateAirGapM: 0, sourceFaceNodeIndex: 798,
      sourceFaceMeshIndex: 406, fitOriginalPresentationSourceWallPlanePassed: true,
      fitExactPhysicalWallHostVerified: false, presentationOnly: true,
      exactXYClaim: false, exactZClaim: false, currentGeometryClaim: false,
      wallHostPhysicalAsBuiltClaim: false,
    };
    device.add(new Mesh(new BoxGeometry(0.094, 0.018, 0.094),
      new MeshBasicMaterial()));
    root.add(device);
  });
  return root;
}

test('source-world camera views face the three exact wall-mounted Themos', () => {
  const cameras = deriveP137ETwoFaceSourceCameras(focusedScene67Fixture(), 16 / 9);
  expect(cameras.sourceSceneIndex).toBe(67);
  expect(cameras.sourceWallMesh).toBe(406);
  expect(cameras.north.sourceIds).toEqual(['D_THEMO_CURRENT_LOBBY_01']);
  expect(cameras.south.sourceIds).toEqual([
    'D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01',
  ]);
  // Babylon local +Y rotates to world -Z; opposite side from source wall.
  expect(cameras.north.eye[2]).toBeLessThan(cameras.north.target[2]);
  expect(cameras.south.eye[2]).toBeGreaterThan(cameras.south.target[2]);
  expect(cameras.north.up[1]).toBeCloseTo(1);
  expect(cameras.south.orthoHalfHeight).toBeGreaterThan(cameras.north.orthoHalfHeight);
  expect(cameras.humanReview).toBe('NOT_RUN');
  expect(cameras.productionRenderVerified).toBe(false);
  expect(cameras.north.productionRenderVerified).toBe(false);
});

test('rejects missing and duplicate source device identities', () => {
  const root = focusedScene67Fixture();
  root.children[3].userData.logicalDeviceId = 'D_THEMO_CURRENT_BEDROOM_01';
  expect(() => deriveP137ETwoFaceSourceCameras(root, 16 / 9))
    .toThrow(/device uniqueness/);
  const missing = focusedScene67Fixture();
  missing.remove(missing.children[3]);
  expect(() => deriveP137ETwoFaceSourceCameras(missing, 16 / 9))
    .toThrow(/source root/);
});

test('source face side, sign and actual contact must match', () => {
  for (const mutate of [
    (d: any) => { d.sourceFaceSide = 'NORTH'; },
    (d: any) => { d.frontFacesTowardYSign = 1; },
    (d: any) => { d.wallBackplateAirGapM = 0.02; },
    (d: any) => { d.sourceFaceMeshIndex = 999; },
  ]) {
    const root = focusedScene67Fixture();
    mutate(root.children[2].userData);
    expect(() => deriveP137ETwoFaceSourceCameras(root, 16 / 9))
      .toThrow(/surface and no-promotion/);
  }
});

test('never accepts a promoted/as-built or human-approved source', () => {
  for (const patch of [
    { Canonical: true },
    { current: true },
    { publishToCURRENT: true },
    { HUMAN_REVIEW: 'PASS' },
  ]) {
    const root = focusedScene67Fixture();
    Object.assign(root.children[1].userData, patch);
    expect(() => deriveP137ETwoFaceSourceCameras(root, 16 / 9))
      .toThrow(/surface and no-promotion/);
  }
  const root = focusedScene67Fixture();
  root.userData.Canonical = true;
  expect(() => deriveP137ETwoFaceSourceCameras(root, 16 / 9))
    .toThrow(/source root/);
});

test('rejects a substituted wall instance, or wrong Y-up orientation', () => {
  const wall = focusedScene67Fixture();
  wall.children[0].userData.sourceMeshIndex = 100;
  expect(() => deriveP137ETwoFaceSourceCameras(wall, 16 / 9))
    .toThrow(/original P123C/);
  const orientation = focusedScene67Fixture();
  orientation.rotation.set(0, 0, 0);
  expect(() => deriveP137ETwoFaceSourceCameras(orientation, 16 / 9))
    .toThrow(/orientation/);
});

test('the source camera cannot invent a missing housing mesh', () => {
  const root = focusedScene67Fixture();
  root.children[1].clear();
  expect(() => deriveP137ETwoFaceSourceCameras(root, 16 / 9))
    .toThrow(/actual Themo mesh bounds/);
});

test('camera rejects nonfinite or implausible screenshot aspect', () => {
  for (const aspect of [0, NaN, Infinity, 0.49, 4.01]) {
    expect(() => deriveP137ETwoFaceSourceCameras(focusedScene67Fixture(), aspect))
      .toThrow(/viewport aspect/);
  }
});

test('the two camera descriptors are source-only, not production review proof', () => {
  const state = deriveP137ETwoFaceSourceCameras(focusedScene67Fixture(), 1.3);
  expect(state.north.sourceOnly).toBe(true);
  expect(state.south.sourceOnly).toBe(true);
  expect(state.south.sourceIds).toHaveLength(2);
  expect(Object.isFrozen(state)).toBe(true);
  expect(Object.isFrozen(state.north.sourceIds)).toBe(true);
  expect(state.north.orthoHalfHeight).toBeGreaterThan(0);
  expect(state.south.orthoHalfHeight).toBeGreaterThan(0);
});

test('original GLB omits current on devices: absence is not approval', () => {
  const root = focusedScene67Fixture();
  for (const device of root.children.slice(1)) {
    delete device.userData.current;
  }
  const result = deriveP137ETwoFaceSourceCameras(root, 16 / 9);
  expect(result.north.sourceIds).toHaveLength(1);
  expect(result.south.sourceIds).toHaveLength(2);
  expect(result.humanReview).toBe('NOT_RUN');
});
