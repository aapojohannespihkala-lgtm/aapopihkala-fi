import { expect, test } from '@playwright/test';

import {
  p186fExpectedRoomContextCount,
  p186fExpectedTargetCount,
  p186fFloorHeatingSourcePdfDriveId,
  p186fMaintenanceDocumentId,
  p186fSchedulePdfDriveId,
} from '../../src/scripts/privateModelP186FReviewPresentation';

const candidateId = 'p186f-x1-d-themo-room-presentation';
const reviewId = `${candidateId}-review`;
const candidatePath = '/private-model/work-test/p186f-x1-d-themo-room-presentation.glb';

const targetPositions = [
  0, 0, 0,
  0.18, 0, 0,
  0, 0, -0.18,
];

const contextPositions = [
  0, 0, 0,
  1, 0, 0,
  1, 0, -1,
  0, 0, 0,
  1, 0, -1,
  0, 0, -1,
];

const makeVisibilityGlb = (
  defaultNodes: Record<string, unknown>[],
  dInteriorNodes: Record<string, unknown>[] = [],
) => {
  const targetBytes = Buffer.alloc(targetPositions.length * 4);
  targetPositions.forEach((value, index) => targetBytes.writeFloatLE(value, index * 4));
  const contextBytes = Buffer.alloc(contextPositions.length * 4);
  contextPositions.forEach((value, index) => contextBytes.writeFloatLE(value, index * 4));
  const binPayload = Buffer.concat([targetBytes, contextBytes]);

  const nodes = [...defaultNodes, ...dInteriorNodes];
  const defaultNodeIndices = defaultNodes.map((_, index) => index);
  const dInteriorNodeIndices = dInteriorNodes.map((_, index) => defaultNodes.length + index);

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P186F-X1 D THEMO ROOM PRESENTATION TEST', nodes: defaultNodeIndices },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: dInteriorNodeIndices },
    ],
    nodes,
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 1 }, material: 1 }] },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.15, 0.15, 0.18, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, -0.18],
        max: [0.18, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 6,
        type: 'VEC3',
        min: [0, 0, -1],
        max: [1, 0, 0],
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: targetBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: targetBytes.length,
        byteLength: contextBytes.length,
        target: 34962,
      },
    ],
    buffers: [{ byteLength: binPayload.length }],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([
    jsonBuffer,
    Buffer.alloc((4 - (jsonBuffer.length % 4)) % 4, 0x20),
  ]);
  const binChunk = Buffer.concat([
    binPayload,
    Buffer.alloc((4 - (binPayload.length % 4)) % 4),
  ]);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const roomContracts = [
  {
    room: 'Bedroom',
    logicalDeviceId: 'D_THEMO_BEDROOM_CURRENT_01',
    groupKey: '10.3',
    groupName: 'makuuhuone',
    placementXYM: [2.063001, 2.73217],
    translation: [2.063001, 0.055, -2.73217],
  },
  {
    room: 'Lobby',
    logicalDeviceId: 'D_THEMO_LOBBY_CURRENT_01',
    groupKey: '10.1',
    groupName: 'eteinen',
    placementXYM: [3.315185, 7.34618],
    translation: [3.315185, 0.055, -7.34618],
  },
  {
    room: 'Bathroom',
    logicalDeviceId: 'D_THEMO_BATHROOM_CURRENT_01',
    groupKey: '10.2',
    groupName: 'pesuhuone/sauna',
    placementXYM: [5.077339, 2.798499],
    translation: [5.077339, 0.055, -2.798499],
  },
] as const;

const makeTargetNodes = () =>
  roomContracts.map((contract, index) => ({
    name: `P186F_X1_THEMO_${contract.room.toUpperCase()}_ROOM_PRESENTATION_ANCHOR`,
    mesh: 0,
    translation: contract.translation,
    scale: [2.2, 1, 2.2],
    extras: {
      Pass: 'P186F-X1',
      Canonical: false,
      HUMAN_REVIEW: 'NOT_RUN',
      asBuilt: false,
      current: false,
      currentCircuitAsBuilt: false,
      currentDeviceRoomAssignmentEvidence: 'USER_CONFIRMED_2026-10-08',
      currentGeometryClaim: false,
      currentInstallationEvidence: 'USER_CONFIRMED_2026-10-07',
      displayZM: 0.055,
      displayZRole: 'PRESENTATION_STYLE_WORK_ASSUMPTION',
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
      placementBasis:
        'CENTROID_OF_INHERITED_2015_FLOOR_HEATING_WORK_ROUTE_PROXY_FOR_ROOM_LEVEL_PRESENTATION_ONLY',
      placementSourceNodeIndex: 1067 + index,
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
    },
  }));

const makeD1fRoomContextNodes = () => {
  const rooms = [
    ['SAUNA', [4.0, 0.0, -0.5], [2.2, 1, 1.6]],
    ['PESUHUONE', [4.0, 0.0, -2.4], [2.2, 1, 1.5]],
    ['WC', [4.4, 0.0, -4.2], [1.7, 1, 0.8]],
    ['VH_WEST', [0.4, 0.0, -3.2], [2.0, 1, 1.5]],
    ['VH_NORTH', [0.4, 0.0, -7.1], [1.8, 1, 1.3]],
    ['HUONE2', [0.4, 0.0, -0.5], [3.2, 1, 2.5]],
    ['VARASTO', [0.4, 0.0, -8.8], [1.8, 1, 1.4]],
  ] as const;

  return rooms.map(([room, translation, scale]) => ({
    name: `P117D_REVIEW_P87_VIEW_G2_D15_SPACE_${room}_1F_SRC`,
    mesh: 1,
    translation,
    scale,
    extras: {
      G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    },
  }));
};

const makeCandidateModel = () =>
  makeVisibilityGlb(makeTargetNodes(), makeD1fRoomContextNodes());

const installRoutes = async (page: any) => {
  const currentModel = makeVisibilityGlb([]);
  const candidateModel = makeCandidateModel();

  await page.route('**/private-model/model.glb', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: candidateId,
            label: 'P186F-X1 D Themo room presentation - WORK_TEST',
            path: candidatePath,
          },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });
};

const expectVisiblePixels = async (page: any) => {
  const canvas = page.locator('#private-model-canvas');
  await page.waitForTimeout(300);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
  const pixels = await page.evaluate(async (url: string) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { cyanTargetPixels: 0, lightContextPixels: 0 };
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let cyanTargetPixels = 0;
    let lightContextPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      if (green > 90 && blue > 100 && green > red + 35 && blue > red + 35) {
        cyanTargetPixels += 1;
      }
      if (
        red > 35 &&
        green > 40 &&
        blue > 45 &&
        Math.abs(red - green) < 35 &&
        Math.abs(green - blue) < 35
      ) {
        lightContextPixels += 1;
      }
    }
    return { cyanTargetPixels, lightContextPixels };
  }, dataUrl);
  expect(pixels.cyanTargetPixels).toBeGreaterThan(80);
  expect(pixels.lightContextPixels).toBeGreaterThan(250);
};

test('P186F-X1 Themo review renders 3 room-level anchors at 80 percent against D1F context at 20 percent', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  await installRoutes(page);
  await page.goto(`/private-model/?review=${reviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute(
    'data-p186f-review-target-renderable-count',
    String(p186fExpectedTargetCount),
  );
  await expect(canvas).toHaveAttribute(
    'data-p186f-review-context-renderable-count',
    String(p186fExpectedRoomContextCount),
  );
  await expect(canvas).toHaveAttribute(
    'data-p186f-review-room-context-bridge-count',
    String(p186fExpectedRoomContextCount),
  );
  await expect(canvas).toHaveAttribute('data-p186f-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186f-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p186f-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute(
    'data-p186f-maintenance-document-id',
    p186fMaintenanceDocumentId,
  );
  await expect(canvas).toHaveAttribute(
    'data-p186f-floor-heating-source-pdf-drive-id',
    p186fFloorHeatingSourcePdfDriveId,
  );
  await expect(canvas).toHaveAttribute(
    'data-p186f-schedule-pdf-drive-id',
    p186fSchedulePdfDriveId,
  );
  await expect(canvas).toHaveAttribute('data-p186f-physical-thermostat-geometry-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p186f-sensor-suite-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p186f-current-circuit-as-built', 'false');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');
  await expectVisiblePixels(page);
});
