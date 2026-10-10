import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  p186fExpectedRoomContextCount,
  p186fExpectedTargetCount,
  p186fX2PlacementBasis,
  p186fX3PreservedPass,
  p186fX4ControllerPlanPdfDriveId,
  p186fX4PlacementBasis,
  p186fX4ReviewPass,
  p186fX4ReviewSceneIndex,
  p186fX4ReviewSceneName,
  prepareP186fReviewPresentation,
} from '../../src/scripts/privateModelP186FReviewPresentation';

const runtimeFile = resolve(process.cwd(), 'src/pages/private-model/index.astro');
const candidateId = 'p186f-x4-d-themo-door-plan-clear-work-assumption';

const roomContracts = [
  {
    room: 'Bedroom',
    logicalDeviceId: 'D_THEMO_BEDROOM_CURRENT_01',
    groupKey: '10.3',
    groupName: 'makuuhuone',
    pass: p186fX3PreservedPass,
    placementBasis: p186fX2PlacementBasis,
    placementXYM: [3.56, 3.02],
  },
  {
    room: 'Lobby',
    logicalDeviceId: 'D_THEMO_LOBBY_CURRENT_01',
    groupKey: '10.1',
    groupName: 'eteinen',
    pass: p186fX4ReviewPass,
    placementBasis: p186fX4PlacementBasis,
    placementXYM: [2.8215166666666684, 4.565316666666669],
  },
  {
    room: 'Bathroom',
    logicalDeviceId: 'D_THEMO_BATHROOM_CURRENT_01',
    groupKey: '10.2',
    groupName: 'pesuhuone/sauna',
    pass: p186fX3PreservedPass,
    placementBasis: p186fX2PlacementBasis,
    placementXYM: [4.05, 3.02],
  },
] as const;

const makeMesh = (name: string) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  mesh.name = name;
  return mesh;
};

const makeTarget = (contract: (typeof roomContracts)[number]) => {
  const mesh = makeMesh(`P186F_X4_${contract.room.toUpperCase()}_ANCHOR`);
  mesh.userData = {
    Pass: contract.pass,
    Canonical: false,
    HUMAN_REVIEW: 'NOT_RUN',
    asBuilt: false,
    current: false,
    currentCircuitAsBuilt: false,
    currentDeviceRoomAssignmentEvidence: 'USER_CONFIRMED_2026-10-08',
    currentGeometryClaim: false,
    currentInstallationEvidence: 'USER_CONFIRMED_2026-10-07',
    exactXYClaim: false,
    exactZClaim: false,
    historicalGroupContext: {
      bindingAuthority: 'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
      sourceGroupKey: contract.groupKey,
      sourceGroupName: contract.groupName,
      sourceYear: 2015,
    },
    logicalDeviceId: contract.logicalDeviceId,
    physicalCableRouteClaim: false,
    physicalThermostatGeometryClaim: false,
    physicalThermostatXYClaim: false,
    placementBasis: contract.placementBasis,
    placementXYM: contract.placementXYM,
    presentationLayer: 'MEP_ELECTRICAL',
    presentationOnly: true,
    publishToCURRENT: false,
    representationKind: 'thermostatRoomPresentationAnchor',
    roomAssignment: contract.room,
    roomAssignmentEvidence: 'USER_CONFIRMED',
    roomLevelPlacement: true,
    sensorSuiteClaim: false,
    workAssumption: true,
  };
  return mesh;
};

const makeContext = (room: string) => {
  const mesh = makeMesh(`P117D_REVIEW_G2_D15_SPACE_${room}_1F_SRC`);
  mesh.userData = {
    G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
    p186dReviewRoomContextBridge: true,
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  };
  return mesh;
};

test('P186F-X4 scene66 mixed X3/X4 targets satisfy no-promotion presentation semantics', () => {
  const scene = new THREE.Group();
  roomContracts.map(makeTarget).forEach((target) => scene.add(target));
  ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO']
    .map(makeContext)
    .forEach((context) => scene.add(context));

  const presentation = prepareP186fReviewPresentation(scene, {
    preferRealArchitectureContext: true,
  });

  expect(p186fX4ReviewSceneIndex).toBe(66);
  expect(p186fX4ReviewSceneName).toBe(
    'P186F-X4 R1117 D THEMO DOOR-PLAN-CLEAR WORK_TEST BABYLON Y-UP',
  );
  expect(presentation.targetRenderableCount).toBe(p186fExpectedTargetCount);
  expect(presentation.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetRooms).toEqual([]);
  expect(presentation.unexpectedTargetRooms).toEqual([]);
  expect(presentation.realArchitectureContextRequired).toBe(true);
  expect(presentation.realArchitectureContextReady).toBe(false);
  expect(presentation.targetBounds).not.toBeNull();
});

test('P186F-X4 runtime fails closed on exact scene66 identity before applying the X4 review state', () => {
  const runtime = readFileSync(runtimeFile, 'utf8');

  expect(runtime).toContain(`const p186fX4CandidateId = '${candidateId}';`);
  expect(runtime).toContain('candidate.id === p186fX4CandidateId && isP186fX4ThemoRoomReviewRequested()');
  expect(runtime).toContain('const reviewScene = gltf.scenes?.[p186fX4ReviewSceneIndex];');
  expect(runtime).toContain("String(sourceScene?.name ?? '') !== p186fX4ReviewSceneName");
  expect(runtime).toContain("String(reviewScene.userData?.Pass ?? '') !== p186fX4ReviewPass");
  expect(runtime).toContain('Number(reviewScene.userData?.workTestSceneIndex) !== p186fX4ReviewSceneIndex');
  expect(runtime).toContain("throw new Error('P186F-X4 scene66 identity mismatch')");
  expect(runtime).toContain('gltf.scene = reviewScene;');
  expect(runtime).toContain("applyP186fReviewState('X4')");
  expect(runtime).toContain("p186fHumanReview: 'NOT_RUN'");
  expect(p186fX4ControllerPlanPdfDriveId).toBe('1cbo8g7mcs9zAWgUE9w2EOm_t9R1vIl1X');
  expect(runtime).toContain('p186fX4ControllerPlanPdfDriveId = p186fX4ControllerPlanPdfDriveId');
  expect(runtime).toContain("p186fCanonical: 'false'");
  expect(runtime).toContain("p186fPublishToCurrent: 'false'");
});
