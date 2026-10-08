import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  p186fBedroomWalkInContextNote,
  p186fExpectedRoomContextCount,
  p186fExpectedTargetCount,
  p186fFloorHeatingSourcePdfDriveId,
  p186fMaintenanceDocumentId,
  p186fReviewContextOpacity,
  p186fReviewQuestionText,
  p186fReviewSourceContexts,
  p186fReviewSourceLimit,
  p186fReviewTargetOpacity,
  p186fSchedulePdfDriveId,
  p186fX2PlacementBasis,
  prepareP186fReviewPresentation,
} from '../../src/scripts/privateModelP186FReviewPresentation';

const targetRooms = [
  {
    room: 'Bedroom',
    logicalDeviceId: 'D_THEMO_BEDROOM_CURRENT_01',
    groupKey: '10.3',
    groupName: 'makuuhuone',
    placementXYM: [3.56, 3.02],
  },
  {
    room: 'Lobby',
    logicalDeviceId: 'D_THEMO_LOBBY_CURRENT_01',
    groupKey: '10.1',
    groupName: 'eteinen',
    placementXYM: [2.39, 3.42],
  },
  {
    room: 'Bathroom',
    logicalDeviceId: 'D_THEMO_BATHROOM_CURRENT_01',
    groupKey: '10.2',
    groupName: 'pesuhuone/sauna',
    placementXYM: [4.05, 3.02],
  },
] as const;

test('P186F-X2 review question preserves user-confirmed source context and no-promotion limits', () => {
  expect(p186fReviewQuestionText).toContain('Bathroom');
  expect(p186fReviewQuestionText).toContain('Bedroom/vaatehuone');
  expect(p186fReviewQuestionText).toContain('Lobby');
  expect(p186fReviewQuestionText).toContain('room/wall-adjacent WORK_TEST');
  expect(p186fReviewQuestionText).toContain('eivät markerit ole fyysisten termostaattien exact-sijainteja');

  expect(p186fBedroomWalkInContextNote).toContain('Themo ohjaa makuuhuoneen lattialämmitystä');
  expect(p186fBedroomWalkInContextNote).toContain('vaatehuoneen ja kulkumaisen tilarakenteen kautta');

  expect(p186fReviewSourceContexts).toEqual([
    {
      sourceLabel: 'Ylisrinne - huollon ja ylläpidon seuranta',
      sourceHref: `https://docs.google.com/document/d/${p186fMaintenanceDocumentId}/edit`,
      sourceRole: 'CURRENT_USER_CONFIRMED_INSTALLATION_AND_ROOM_ASSIGNMENT',
    },
    {
      sourceLabel: 'Lattialämmitys.me_design.pdf',
      sourceHref: `https://drive.google.com/file/d/${p186fFloorHeatingSourcePdfDriveId}/view`,
      sourceRole: 'HISTORICAL_2015_ROOM_LEVEL_PLACEMENT_CONTEXT_SUPERSEDED_FOR_XY',
    },
    {
      sourceLabel: 'Keskuskaavio.pdf',
      sourceHref: `https://drive.google.com/file/d/${p186fSchedulePdfDriveId}/view`,
      sourceRole: 'HISTORICAL_2015_GROUP_CONTEXT_ONLY',
    },
  ]);

  expect(p186fReviewSourceLimit).toContain(p186fBedroomWalkInContextNote);
  expect(p186fReviewSourceLimit).toContain('käyttäjän vahvistamaa nykytilaevidenssiä');
  expect(p186fReviewSourceLimit).toContain('room/wall-adjacent WORK_ASSUMPTION');
  expect(p186fReviewSourceLimit).toContain('eivät nykyinen as-built-syöttökytkentä');
  expect(p186fReviewSourceLimit).toContain('sensor suite -väite');
});

const makeRenderableMesh = (name: string) => {
  const geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
};

const makeP186fX2Target = (contract: (typeof targetRooms)[number]) => {
  const mesh = makeRenderableMesh(`P186F_X2_THEMO_${contract.room.toUpperCase()}_ROOM_ADJACENT_ANCHOR`);
  mesh.position.set(contract.placementXYM[0], 0.055, -contract.placementXYM[1]);
  mesh.userData = {
    Pass: 'P186F-X2',
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
    placementBasis: p186fX2PlacementBasis,
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

const makeRoomContext = (room: string, index: number) => {
  const mesh = makeRenderableMesh(`P117D_REVIEW_G2_D15_SPACE_${room}_1F_SRC`);
  mesh.position.set(index * 0.15, 0, -index * 0.15);
  mesh.userData = {
    G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
    p186dReviewRoomContextBridge: true,
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  };
  return mesh;
};

test('P186F-X2 room-adjacent Themo anchors are accepted as review targets without promotion', () => {
  const scene = new THREE.Group();
  for (const target of targetRooms.map(makeP186fX2Target)) scene.add(target);
  ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO'].forEach(
    (room, index) => scene.add(makeRoomContext(room, index)),
  );
  scene.add(makeRenderableMesh('UNRELATED_RENDERABLE_SUPPRESSED'));

  const presentation = prepareP186fReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(p186fExpectedTargetCount);
  expect(presentation.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetRooms).toEqual([]);
  expect(presentation.unexpectedTargetRooms).toEqual([]);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(1);
  expect(presentation.realArchitectureContextRequired).toBe(true);
  expect(presentation.realArchitectureContextReady).toBe(false);
  expect(presentation.realArchitectureContextRenderableCount).toBe(0);
  expect(presentation.targetBounds).not.toBeNull();

  const targetMaterials = scene.children
    .filter((child) => child.userData.p186fReviewRole === 'QUESTION_TARGET_80')
    .map((child: any) => child.material);
  expect(targetMaterials).toHaveLength(p186fExpectedTargetCount);
  for (const material of targetMaterials) expect(material.opacity).toBe(p186fReviewTargetOpacity);

  const contextMaterials = scene.children
    .filter((child) => child.userData.p186fReviewRole === 'D_1F_ROOM_CONTEXT_20')
    .map((child: any) => child.material);
  expect(contextMaterials).toHaveLength(p186fExpectedRoomContextCount);
  for (const material of contextMaterials) expect(material.opacity).toBe(p186fReviewContextOpacity);
});

test('P186F-X2 shows real D1F wall meshes instead of diagnostic room footprints when available', () => {
  const scene = new THREE.Group();
  for (const target of targetRooms.map(makeP186fX2Target)) scene.add(target);
  const footprints = ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO']
    .map((room, index) => makeRoomContext(room, index));
  footprints.forEach((node) => scene.add(node));

  const wallRoot = new THREE.Group();
  wallRoot.name = 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP';
  const wallMesh = makeRenderableMesh('SOLID_ARCH_MESH_CHILD_WITHOUT_SOURCE_ID');
  wallMesh.scale.set(16, 24, 3);
  wallRoot.add(wallMesh);
  scene.add(wallRoot);
  const unrelatedSiteWall = makeRenderableMesh('SITE_WALL_NOT_D_ARCHITECTURE');
  unrelatedSiteWall.userData.presentationLayer = 'SITE_GROUND';
  scene.add(unrelatedSiteWall);

  const presentation = prepareP186fReviewPresentation(scene, {
    preferRealArchitectureContext: true,
  });

  expect(presentation.targetRenderableCount).toBe(3);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.realArchitectureContextRequired).toBe(true);
  expect(presentation.realArchitectureContextReady).toBe(true);
  expect(presentation.realArchitectureContextRenderableCount).toBe(1);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(8);

  expect(wallMesh.visible).toBe(true);
  expect(wallMesh.userData.p186fReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
  expect((wallMesh.material as any).opacity).toBe(0.2);
  expect((wallMesh.material as any).depthTest).toBe(false);
  expect((wallMesh.material as any).polygonOffset).toBe(true);
  for (const footprint of footprints) {
    expect(footprint.visible).toBe(false);
    expect(footprint.userData.p186fReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
  }
  expect(unrelatedSiteWall.visible).toBe(false);
});
