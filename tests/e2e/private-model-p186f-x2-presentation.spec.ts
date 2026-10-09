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

test('P186F-X2 shows sourced room-wall solids for all three Themo rooms before hiding the footprint helpers', () => {
  const scene = new THREE.Group();
  for (const target of targetRooms.map(makeP186fX2Target)) scene.add(target);
  const footprints = ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO']
    .map((room, index) => makeRoomContext(room, index));
  footprints.forEach((node) => scene.add(node));

  const wallRoot = new THREE.Group();
  wallRoot.name = 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP';
  const walls = targetRooms.map(({ room }, index) => {
    const wall = makeRenderableMesh(`P173D_D1F_${room.toUpperCase()}_WALL_WORK_ENVELOPE`);
    wall.position.set(index * 0.2, 0, 0);
    wall.scale.set(16, 24, 3);
    wall.userData = {
      Pass: 'P173D',
      representationKind: 'd1fRoomWallWorkEnvelope',
      roomContext: room,
    };
    wallRoot.add(wall);
    return wall;
  });
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
  expect(presentation.realArchitectureContextRenderableCount).toBe(3);
  expect(presentation.contextRenderableCount).toBe(3);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(8);

  for (const wall of walls) {
    expect(wall.visible).toBe(true);
    expect(wall.userData.p186fReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
    expect((wall.material as any).opacity).toBe(0.2);
    expect((wall.material as any).depthTest).toBe(false);
    expect((wall.material as any).polygonOffset).toBe(true);
  }
  for (const footprint of footprints) {
    expect(footprint.visible).toBe(false);
    expect(footprint.userData.p186fReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
  }
  expect(unrelatedSiteWall.visible).toBe(false);
});

test('P186F-X2 does not accept doors, windows, line references, storage walls or one room alone as three-room wall proof', () => {
  const kinds = [
    'referenceOpening',
    'referenceLine',
    'storageNorthWallCorrectedWorkEnvelope',
    'd1fRoomWallWorkEnvelope',
  ] as const;
  for (const kind of kinds) {
    const scene = new THREE.Group();
    for (const target of targetRooms.map(makeP186fX2Target)) scene.add(target);
    const footprints = ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO']
      .map((room, index) => makeRoomContext(room, index));
    footprints.forEach((node) => scene.add(node));

    const wallRoot = new THREE.Group();
    wallRoot.name = 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP';
    const suspect = makeRenderableMesh('P173D_D1F_BEDROOM_DOOR_WINDOW_STORAGE_WALL_SOURCE');
    suspect.userData = {
      Pass: 'P173D',
      roomContext: 'Bedroom',
      representationKind: kind,
    };
    wallRoot.add(suspect);
    scene.add(wallRoot);

    const presentation = prepareP186fReviewPresentation(scene, {
      preferRealArchitectureContext: true,
    });
    expect(presentation.realArchitectureContextRequired).toBe(true);
    expect(presentation.realArchitectureContextReady).toBe(false);
    expect(presentation.realArchitectureContextRenderableCount).toBe(0);
    expect(presentation.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
    expect(suspect.visible).toBe(false);
    for (const footprint of footprints) expect(footprint.visible).toBe(true);
  }
});

test('P186F-X2 refuses upper-floor, empty, non-drawn, and non-finite D-wall meshes as real D1F context', () => {
  for (const meshName of ['D_WALL_2F_SRC', 'EMPTY_D1F_WALL', 'NO_DRAW_RANGE_D1F_WALL', 'NON_FINITE_D1F_WALL']) {
    const scene = new THREE.Group();
    for (const target of targetRooms.map(makeP186fX2Target)) scene.add(target);
    for (const [i, room] of ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO'].entries()) {
      scene.add(makeRoomContext(room, i));
    }
    const wallRoot = new THREE.Group();
    wallRoot.name = 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP';
    const wall = makeRenderableMesh(meshName);
    if (meshName === 'EMPTY_D1F_WALL') wall.geometry.deleteAttribute('position');
    if (meshName === 'NO_DRAW_RANGE_D1F_WALL') wall.geometry.setDrawRange(0, 0);
    if (meshName === 'NON_FINITE_D1F_WALL') wall.position.set(Number.NaN, 0, 0);
    wallRoot.add(wall);
    scene.add(wallRoot);
    const result = prepareP186fReviewPresentation(scene, { preferRealArchitectureContext: true });
    expect(result.realArchitectureContextReady).toBe(false);
    expect(result.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
    expect(wall.visible).toBe(false);
  }
});
