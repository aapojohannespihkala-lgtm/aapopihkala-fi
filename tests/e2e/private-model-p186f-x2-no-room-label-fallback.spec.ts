import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  p186fExpectedRoomContextCount,
  p186fExpectedRooms,
  p186fExpectedTargetCount,
  p186fReviewContextOpacity,
  p186fReviewTargetOpacity,
  p186fX2PlacementBasis,
  prepareP186fReviewPresentation,
} from '../../src/scripts/privateModelP186FReviewPresentation';

// This reproduces the exact P186F-X2 raw-source boundary observed on 2026-10-09:
// three Themo room targets are present, but the inherited architectural wall
// solids do not carry source-level roomContext metadata. Wall names alone must
// not promote them to sourced Bedroom/Lobby/Bathroom architecture evidence.
const theMoTargets = [
  { room: 'Bedroom', xy: [3.56, 3.02] },
  { room: 'Lobby', xy: [2.39, 3.42] },
  { room: 'Bathroom', xy: [4.05, 3.02] },
] as const;

const diagnosticRooms = [
  'SAUNA',
  'PESUHUONE',
  'WC',
  'VH_WEST',
  'VH_NORTH',
  'HUONE2',
  'VARASTO',
] as const;

const makeMesh = (name: string) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.15),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  mesh.name = name;
  return mesh;
};

test('P186F-X2 preserves seven room references when inherited wall solids have no source room labels', () => {
  const scene = new THREE.Group();
  const anchors: ReturnType<typeof makeMesh>[] = [];

  for (const { room, xy } of theMoTargets) {
    const source = p186fExpectedRooms[room];
    const anchor = makeMesh(`P186F_X2_THEMO_${room.toUpperCase()}_ROOM_ADJACENT_ANCHOR`);
    anchor.position.set(xy[0], 0.055, -xy[1]);
    anchor.userData = {
      Pass: 'P186F-X2',
      presentationLayer: 'MEP_ELECTRICAL',
      representationKind: 'thermostatRoomPresentationAnchor',
      roomAssignment: room,
      logicalDeviceId: source.logicalDeviceId,
      roomAssignmentEvidence: 'USER_CONFIRMED',
      currentDeviceRoomAssignmentEvidence: 'USER_CONFIRMED_2026-10-08',
      currentInstallationEvidence: 'USER_CONFIRMED_2026-10-07',
      historicalGroupContext: {
        sourceGroupKey: source.historicalGroupKey,
        sourceGroupName: source.historicalGroupName,
        sourceYear: 2015,
        bindingAuthority: 'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
      },
      placementBasis: p186fX2PlacementBasis,
      placementXYM: [...xy],
      roomLevelPlacement: true,
      presentationOnly: true,
      workAssumption: true,
      physicalThermostatGeometryClaim: false,
      physicalThermostatXYClaim: false,
      exactXYClaim: false,
      exactZClaim: false,
      sensorSuiteClaim: false,
      currentCircuitAsBuilt: false,
      physicalCableRouteClaim: false,
      currentGeometryClaim: false,
      current: false,
      Canonical: false,
      asBuilt: false,
      publishToCURRENT: false,
      HUMAN_REVIEW: 'NOT_RUN',
    };
    anchors.push(anchor);
    scene.add(anchor);
  }

  const footprints = diagnosticRooms.map((room, index) => {
    const footprint = makeMesh(`P117D_REVIEW_G2_D15_SPACE_${room}_1F_SRC`);
    footprint.position.set(index * 0.2, 0, index * 0.1);
    footprint.userData = {
      G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
      p186dReviewRoomContextBridge: true,
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    };
    scene.add(footprint);
    return footprint;
  });

  const architecture = new THREE.Group();
  architecture.name = 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP';
  const unlabelledWalls = theMoTargets.map(({ room }, index) => {
    const wall = makeMesh(`P173D_D1F_${room.toUpperCase()}_WALL_WORK_ENVELOPE`);
    wall.position.set(index * 0.3, 0, 0);
    wall.scale.set(15, 20, 3);
    wall.userData = {
      Pass: 'P173D',
      representationKind: 'd1fRoomWallWorkEnvelope',
      // Intentionally no roomContext: naming a room is not source evidence.
    };
    architecture.add(wall);
    return wall;
  });
  scene.add(architecture);

  const result = prepareP186fReviewPresentation(scene, {
    preferRealArchitectureContext: true,
  });

  expect(result.targetRenderableCount).toBe(p186fExpectedTargetCount);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.missingTargetRooms).toEqual([]);
  expect(result.unexpectedTargetRooms).toEqual([]);
  expect(result.realArchitectureContextRequired).toBe(true);
  expect(result.realArchitectureContextReady).toBe(false);
  expect(result.realArchitectureContextRenderableCount).toBe(0);
  expect(result.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
  expect(result.expectedContextRenderableCount).toBe(p186fExpectedRoomContextCount);
  expect(result.hiddenNonQuestionRenderableCount).toBe(unlabelledWalls.length);

  for (const target of anchors) {
    expect(target.visible).toBe(true);
    expect(target.userData.p186fReviewRole).toBe('QUESTION_TARGET_80');
    expect(target.material.opacity).toBe(
      p186fReviewTargetOpacity,
    );
  }
  for (const footprint of footprints) {
    expect(footprint.visible).toBe(true);
    expect(footprint.userData.p186fReviewRole).toBe('D_1F_ROOM_CONTEXT_20');
    expect(footprint.material.opacity).toBe(
      p186fReviewContextOpacity,
    );
  }
  for (const wall of unlabelledWalls) {
    expect(wall.visible).toBe(false);
    expect(wall.userData.p186fReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
  }
});
