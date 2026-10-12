import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import {
  deriveP137ETwoFaceSourceCameras,
  deriveP137ETwoFaceSourcePixelRegions,
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


test('actual THREE orthographic projections yield three distinct source-housing pixel ROIs', () => {
  const proof = deriveP137ETwoFaceSourcePixelRegions(
    focusedScene67Fixture(), 1536, 900,
  );
  expect(proof.sourceSceneIndex).toBe(67);
  expect(proof.originalWallMesh).toBe(406);
  expect(proof.expectedHousingCount).toBe(3);
  expect(proof.north.side).toBe('NORTH');
  expect(proof.south.side).toBe('SOUTH');
  expect(proof.north.cameraKey).not.toBe(proof.south.cameraKey);
  expect(proof.north.projectedTargets.map(x => x.logicalDeviceId))
    .toEqual(['D_THEMO_CURRENT_LOBBY_01']);
  expect(proof.south.projectedTargets.map(x => x.logicalDeviceId))
    .toEqual(['D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01']);
  expect(proof.north.projectedTargets).toHaveLength(1);
  expect(proof.south.projectedTargets).toHaveLength(2);
  const south = proof.south.projectedTargets;
  const a = south[0]!, b = south[1]!;
  expect((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
    .toBeGreaterThan((a.radius + b.radius) ** 2);
  for (const side of [proof.north, proof.south]) {
    for (const roi of side.projectedTargets) {
      expect(Number.isSafeInteger(roi.x)).toBe(true);
      expect(Number.isSafeInteger(roi.y)).toBe(true);
      expect(Number.isSafeInteger(roi.radius)).toBe(true);
      expect(roi.radius).toBeGreaterThanOrEqual(4);
      expect(roi.radius).toBeLessThanOrEqual(96);
      expect(roi.x - roi.radius).toBeGreaterThanOrEqual(0);
      expect(roi.y - roi.radius).toBeGreaterThanOrEqual(0);
      expect(roi.x + roi.radius).toBeLessThan(side.width);
      expect(roi.y + roi.radius).toBeLessThan(side.height);
    }
    expect(side.sourceOnly).toBe(true);
    expect(side.individualRenderedPixelsVerified).toBe(false);
  }
  expect(proof.actualProductionScreenshotVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('same-side original housing projection collision fails before screenshot acceptance', () => {
  const root = focusedScene67Fixture();
  root.children[3].position.copy(root.children[2].position);
  expect(() => deriveP137ETwoFaceSourcePixelRegions(root, 1536, 900))
    .toThrow(/same-side source housing ROIs overlap/);
});

test('pixel projection cannot forge clipped, zero-size or absurd screenshot viewport', () => {
  for (const [width, height] of [
    [0, 900], [1536, 0], [255, 900], [1536, 255],
    [4097, 900], [1536, 4097], [NaN, 900], [1536.5, 900],
  ]) {
    expect(() => deriveP137ETwoFaceSourcePixelRegions(
      focusedScene67Fixture(), width, height,
    )).toThrow(/bounded screenshot viewport/);
  }
});

test('ROI generation inherits original wall and no-promotion source identity', () => {
  const wrong = focusedScene67Fixture();
  wrong.children[1].userData.current = true;
  expect(() => deriveP137ETwoFaceSourcePixelRegions(wrong, 1536, 900))
    .toThrow(/surface and no-promotion/);
  const wrongWall = focusedScene67Fixture();
  wrongWall.children[0].userData.sourceMeshIndex = 405;
  expect(() => deriveP137ETwoFaceSourcePixelRegions(wrongWall, 1536, 900))
    .toThrow(/single original P123C source wall/);
});

test('portrait original P123C source face keeps all three 94-mm housings in individual bounded ROIs', () => {
  const portraitAspect = 900 / 1600;
  const original = focusedScene67Fixture();
  const desktop = deriveP137ETwoFaceSourceCameras(original, 1536 / 900);
  const portrait = deriveP137ETwoFaceSourceCameras(original, portraitAspect);
  // Desktop must retain its exact source-bound camera framing; the portrait
  // camera grows its frustum instead of enlarging the original housing mesh.
  expect(desktop.north.orthoHalfHeight).toBeCloseTo(0.36, 6);
  expect(portrait.north.orthoHalfHeight).toBeGreaterThanOrEqual(0.64);
  expect(portrait.north.orthoHalfHeight).toBeGreaterThan(
    desktop.north.orthoHalfHeight);
  expect(portrait.north.sourceIds).toEqual(['D_THEMO_CURRENT_LOBBY_01']);
  expect(portrait.south.sourceIds).toEqual([
    'D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01',
  ]);
  const rois = deriveP137ETwoFaceSourcePixelRegions(original, 900, 1600);
  expect(rois.expectedHousingCount).toBe(3);
  expect(rois.north.projectedTargets).toHaveLength(1);
  expect(rois.south.projectedTargets).toHaveLength(2);
  for (const face of [rois.north, rois.south]) {
    expect(face.width).toBe(900);
    expect(face.height).toBe(1600);
    expect(face.sourceOnly).toBe(true);
    expect(face.individualRenderedPixelsVerified).toBe(false);
    for (const roi of face.projectedTargets) {
      expect(roi.radius).toBeGreaterThanOrEqual(4);
      expect(roi.radius).toBeLessThanOrEqual(96);
      expect(roi.x - roi.radius).toBeGreaterThanOrEqual(0);
      expect(roi.x + roi.radius).toBeLessThan(900);
      expect(roi.y - roi.radius).toBeGreaterThanOrEqual(0);
      expect(roi.y + roi.radius).toBeLessThan(1600);
    }
  }
  const a = rois.south.projectedTargets[0]!;
  const b = rois.south.projectedTargets[1]!;
  expect((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
    .toBeGreaterThan((a.radius + b.radius) ** 2);
  expect(rois.actualProductionScreenshotVerified).toBe(false);
  expect(rois.humanReview).toBe('NOT_RUN');
});
