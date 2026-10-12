import { expect, test } from '@playwright/test';
// @ts-ignore -- standalone Node-only original GLB source inspector
import {
  inspectP137EFocusedSurvivorSource,
  authenticateP137EFocusedSurvivorBytes,
  P137E_FOCUSED_SOURCE,
} from '../../src/scripts/privateModelP137EFocusedSurvivorIdentity.mjs';

// Synthetic glTF data proves strict source-contract behavior ONLY.
// This is never an authenticated Drive GLB, a deployed model or rendered pixels.
const noPromotion = () => ({
  Canonical: false,
  asBuilt: false,
  publishToCURRENT: false,
  HUMAN_REVIEW: 'NOT_RUN',
});
const deviceDefinitions = [
  { node: 1091, room: 'LOBBY', side: 'NORTH', y: 5.112, xy: [3.73, 5.12] },
  { node: 1096, room: 'BEDROOM', side: 'SOUTH', y: 5.032, xy: [3.69, 5.03] },
  { node: 1101, room: 'BATHROOM', side: 'SOUTH', y: 5.032, xy: [4.88, 5.03] },
] as const;

function fixture(): any {
  const nodes: any[] = Array.from({ length: 1108 }, () => ({}));
  nodes[798] = { mesh: 406 };
  nodes[1106] = {
    name: 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE',
    mesh: 406,
    extras: {
      sourceNodeIndex: 798,
      sourceMeshIndex: 406,
      originalSourceGeometryUnmodified: true,
      presentationOnly: true,
    },
  };
  nodes[1107] = {
    name: 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP',
    children: [1106, 1091, 1096, 1101],
    extras: {
      Pass: 'P137E',
      sourceSceneIndex: 66,
      sourceWallSceneIndex: 5,
      sourceOriginalWallNode: 798,
      sourceOriginalWallMesh: 406,
      WORK_TEST_ONLY: true,
      oldMarkersSuppressedInNewSceneOnly: true,
      current: false,
      ...noPromotion(),
    },
  };
  for (const { node, room, side, y, xy } of deviceDefinitions) {
    nodes[node] = {
      name: `P137E_THEMO_${room}_WALL_CONTACT_WORK_TEST`,
      extras: {
        logicalDeviceId: `D_THEMO_CURRENT_${room}_01`,
        roomAssignment: room,
        representationKind: 'photoReferencedThermostatWallMountWorkTest',
        sourceFaceNodeIndex: 798,
        sourceFaceMeshIndex: 406,
        sourceFaceSide: side,
        sourceFaceYM: y,
        frontFacesTowardYSign: side === 'NORTH' ? 1 : -1,
        backplateContactYM: y,
        wallBackplateAirGapM: 0,
        sourceUserPinXYM: [...xy],
        fitOriginalPresentationSourceWallPlanePassed: true,
        fitExactPhysicalWallHostVerified: false,
        physicalDeviceDimensionsVerified: false,
        currentGeometryClaim: false,
        exactXYClaim: false,
        exactZClaim: false,
        wallHostPhysicalAsBuiltClaim: false,
        presentationOnly: true,
        ...noPromotion(),
      },
    };
  }
  const scenes = Array.from({ length: 68 }, () => ({}));
  scenes[67] = {
    name: P137E_FOCUSED_SOURCE.sceneName,
    nodes: [1107],
    extras: {
      sourceSceneIndex: 66,
      sourceOriginalWallMeshIndex: 406,
      targetLogicalDeviceCount: 3,
      workTestOnly: true,
      noCurrentPromotion: true,
      focusedSourceOriginalWallAndThreeThemos: true,
      HUMAN_REVIEW: 'NOT_RUN',
      viewerAutoloadProof: 'NOT_RUN',
      productionRenderProof: 'NOT_RUN',
    },
  };
  return { scene: 67, scenes, nodes, meshes: Array.from({ length: 407 }, () => ({})) };
}

test('scene67 source-bound wall and three devices pass structural only, never production proof', () => {
  const proof = inspectP137EFocusedSurvivorSource(fixture());
  expect(proof.sourceScene).toBe(67);
  expect(proof.originalWallNode).toBe(798);
  expect(proof.originalWallMesh).toBe(406);
  expect(proof.focusedRootCount).toBe(1);
  expect(proof.targetIdentities).toEqual([
    { sourceNode: 1091, logicalDeviceId: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH' },
    { sourceNode: 1096, logicalDeviceId: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH' },
    { sourceNode: 1101, logicalDeviceId: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH' },
  ]);
  expect(proof.originalGlbDigestAuthenticated).toBe(false);
  expect(proof.productionAutoloadVerified).toBe(false);
  expect(proof.productionRenderVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('rejects wrong default scene, scene count and legacy or promoted review metadata', () => {
  const wrongScene = fixture();
  wrongScene.scene = 64;
  expect(() => inspectP137EFocusedSurvivorSource(wrongScene)).toThrow('scene67 identity');

  const wrongCount = fixture();
  wrongCount.scenes.pop();
  expect(() => inspectP137EFocusedSurvivorSource(wrongCount)).toThrow('scene67 identity');

  const promoted = fixture();
  promoted.scenes[67].extras.productionRenderProof = 'PASS';
  expect(() => inspectP137EFocusedSurvivorSource(promoted)).toThrow('scene67 identity');
});

test('rejects inherited carrier roots, swapped devices and missing target', () => {
  const inheritedRoot = fixture();
  inheritedRoot.scenes[67].nodes.push(1021);
  expect(() => inspectP137EFocusedSurvivorSource(inheritedRoot)).toThrow('scene67 identity');

  const swapped = fixture();
  swapped.nodes[1107].children = [1106, 1096, 1091, 1101];
  expect(() => inspectP137EFocusedSurvivorSource(swapped)).toThrow('three-device root');

  const missing = fixture();
  missing.nodes[1107].children.pop();
  expect(() => inspectP137EFocusedSurvivorSource(missing)).toThrow('three-device root');
});

test('rejects reconstructed wall mesh or mismatched original source identity', () => {
  const wrongMesh = fixture();
  wrongMesh.nodes[798].mesh = 407;
  expect(() => inspectP137EFocusedSurvivorSource(wrongMesh)).toThrow('source wall');

  const inventedWall = fixture();
  inventedWall.nodes[1106].extras.originalSourceGeometryUnmodified = false;
  expect(() => inspectP137EFocusedSurvivorSource(inventedWall)).toThrow('source wall');
});

test('rejects swapped Themo room IDs, wrong wall side and incorrect physical contact', () => {
  const alias = fixture();
  alias.nodes[1091].extras.logicalDeviceId = 'D_THEMO_R1009_LOBBY_01';
  expect(() => inspectP137EFocusedSurvivorSource(alias)).toThrow('invalid Themo identity');

  const wrongSide = fixture();
  wrongSide.nodes[1096].extras.sourceFaceSide = 'NORTH';
  expect(() => inspectP137EFocusedSurvivorSource(wrongSide)).toThrow('invalid Themo identity');

  const gap = fixture();
  gap.nodes[1101].extras.wallBackplateAirGapM = 0.02;
  expect(() => inspectP137EFocusedSurvivorSource(gap)).toThrow('invalid Themo identity');
});

test('rejects current, exact-as-built and premature HUMAN_REVIEW promotion', () => {
  const promotedRoot = fixture();
  promotedRoot.nodes[1107].extras.publishToCURRENT = true;
  expect(() => inspectP137EFocusedSurvivorSource(promotedRoot)).toThrow('three-device root');

  const promotedDevice = fixture();
  promotedDevice.nodes[1101].extras.currentGeometryClaim = true;
  expect(() => inspectP137EFocusedSurvivorSource(promotedDevice)).toThrow('invalid Themo identity');

  const claimedReview = fixture();
  claimedReview.nodes[1091].extras.HUMAN_REVIEW = 'PASS';
  expect(() => inspectP137EFocusedSurvivorSource(claimedReview)).toThrow('invalid Themo identity');
});

test('raw byte authenticator rejects missing or wrong-length source without false PASS', () => {
  expect(() => authenticateP137EFocusedSurvivorBytes(new Uint8Array(8))).toThrow('byte length');
  expect(() => authenticateP137EFocusedSurvivorBytes(null)).toThrow('byte length');
  expect(() => authenticateP137EFocusedSurvivorBytes(new Uint8Array(P137E_FOCUSED_SOURCE.bytes + 1)))
    .toThrow('byte length');
});

test('raw byte authenticator rejects exact-length wrong digest before trusting GLB header', () => {
  const altered = new Uint8Array(P137E_FOCUSED_SOURCE.bytes);
  altered.set([0x67, 0x6c, 0x54, 0x46], 0);
  expect(() => authenticateP137EFocusedSurvivorBytes(altered)).toThrow('SHA-256 original digest');
  altered[altered.length - 1] ^= 1;
  expect(() => authenticateP137EFocusedSurvivorBytes(altered)).toThrow('SHA-256 original digest');
});
