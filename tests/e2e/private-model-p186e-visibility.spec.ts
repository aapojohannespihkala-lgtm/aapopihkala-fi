import { expect, test } from '@playwright/test';

import {
  p186eExpectedCounts,
  p186eGroupAnchorListSha256,
  p186ePositionSourcePdfDriveId,
  p186eSchedulePdfDriveId,
  p186eSpecialAnchorListSha256,
} from '../../src/scripts/privateModelP186EReviewPresentation';

const candidateId = 'p186e-x1-d2015-electrical-source-label-anchors-p28-corrected';
const reviewId = `${candidateId}-review`;
const candidatePath =
  '/private-model/work-test/p186e-x1-d2015-electrical-source-label-anchors-p28-corrected.glb';

const targetPositions = [
  0, 0, 0,
  0.22, 0, 0,
  0, 0, -0.22,
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
      { name: 'P186E-X1 WHOLE BUILDING SURVIVOR TEST', nodes: defaultNodeIndices },
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
        min: [0, 0, -0.22],
        max: [0.22, 0, 0],
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

const noPromotion = {
  ModelStage: 'WORK_TEST_PRESENTATION',
  Canonical: false,
  canonical: false,
  presentationLayer: 'MEP_ELECTRICAL',
  coordinateSystem: 'YLIS-G1-LOCAL',
  sourcePdfDriveId: p186ePositionSourcePdfDriveId,
  presentationOnly: true,
  sourceDerived: true,
  sourceLabelAnchor: true,
  deviceGeometryClaim: false,
  socketGeometryClaim: false,
  switchOrFixtureClaim: false,
  physicalCableRouteClaim: false,
  connectionTopologyClaim: false,
  exactCurrentXYClaim: false,
  exactZClaim: false,
  currentGeometryClaim: false,
  current: false,
  asBuilt: false,
  publishToCURRENT: false,
  HUMAN_REVIEW: 'NOT_RUN',
};

const makeGroupTarget = (
  floor: 'D_1F' | 'D_2F',
  ordinal: number,
  translation: [number, number, number],
) => ({
  name: `P186E_X1_${floor}_GROUP_LABEL_${String(ordinal).padStart(2, '0')}`,
  mesh: 0,
  translation,
  scale: [1.5, 1, 1.5],
  extras: {
    Pass: 'P186E-X1',
    ...noPromotion,
    hostStorey: floor,
    representationKind: 'electricalGroupSourceLabelAnchor',
    schedulePdfDriveId: p186eSchedulePdfDriveId,
    sourceAnchorListSha256: p186eGroupAnchorListSha256,
    sourceBindingClass: 'SOURCE_DIRECT_GROUP_LABEL_PLUS_EXACT_GROUP_KEY_SCHEDULE_JOIN',
    annotationStableKey: `${floor}_GROUP_${ordinal}`,
    sourceGroupKey: `${1 + (ordinal % 16)}.1`,
    sourceScheduleName: `Source group ${ordinal}`,
  },
});

const specialSemantic = [
  'LOW_VOLTAGE_CABLING_NOTE',
  'EXHAUST_MACHINE_LABEL',
  'HEAT_PUMP_RESERVATION_LABEL',
  'MIRROR_LIGHT_LABEL',
  'SKYLIGHT_LED_STRIP_LABEL',
] as const;

const makeSpecialTarget = (
  floor: 'D_1F' | 'D_2F',
  ordinal: number,
  translation: [number, number, number],
) => ({
  name: `P186E_X1_${floor}_SPECIAL_LABEL_${String(ordinal).padStart(2, '0')}`,
  mesh: 0,
  translation,
  scale: [1.6, 1, 1.6],
  extras: {
    Pass: 'P186E-X1',
    ...noPromotion,
    hostStorey: floor,
    representationKind: 'electricalSpecialSourceLabelAnchor',
    sourceBindingListSha256: p186eSpecialAnchorListSha256,
    sourceLabelId: `${floor}_SPECIAL_${ordinal}`,
    sourceText: `Special source label ${ordinal}`,
    sourceSemantic: specialSemantic[(ordinal - 1) % specialSemantic.length],
  },
});

const buildFloorTargets = (
  floor: 'D_1F' | 'D_2F',
  groupCount: number,
  specialCount: number,
  yOffset: number,
) => {
  const nodes: Record<string, unknown>[] = [];
  for (let index = 0; index < groupCount; index += 1) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    nodes.push(
      makeGroupTarget(floor, index + 1, [
        0.7 + column * 1.05,
        yOffset,
        -(0.6 + row * 1.15),
      ]),
    );
  }
  for (let index = 0; index < specialCount; index += 1) {
    nodes.push(
      makeSpecialTarget(floor, index + 1, [
        0.9 + index * 1.15,
        yOffset,
        -4.5,
      ]),
    );
  }
  return nodes;
};

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

const makeD2fContextNodes = () => [
  {
    name: 'P123C_CONTEXT_G2_D15_SPACE_UPPER_HALL_2F_SRC',
    mesh: 1,
    translation: [2.8, 2.76, -2.3],
    scale: [4.8, 1, 3.5],
    extras: {
      G2Id: 'G2_D15_SPACE_UPPER_HALL_2F_SRC',
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    },
  },
];

const makeCandidateModel = () =>
  makeVisibilityGlb(
    [
      ...buildFloorTargets('D_1F', p186eExpectedCounts.D1F.group, p186eExpectedCounts.D1F.special, 0.055),
      ...buildFloorTargets('D_2F', p186eExpectedCounts.D2F.group, p186eExpectedCounts.D2F.special, 2.815),
      ...makeD2fContextNodes(),
    ],
    makeD1fRoomContextNodes(),
  );

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
            label: 'P186E-X1 D2015 electrical source labels p28-corrected - WORK_TEST',
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
    if (!context) return { amberTargetPixels: 0, lightContextPixels: 0 };
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let amberTargetPixels = 0;
    let lightContextPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      if (red > 95 && red > blue + 35 && green > blue + 18 && red > green * 1.05) {
        amberTargetPixels += 1;
      }
      if (
        red > 35 &&
        green > 40 &&
        blue > 45 &&
        blue >= red &&
        Math.abs(red - green) < 32 &&
        Math.abs(green - blue) < 32
      ) {
        lightContextPixels += 1;
      }
    }
    return { amberTargetPixels, lightContextPixels };
  }, dataUrl);
  expect(pixels.amberTargetPixels).toBeGreaterThan(100);
  expect(pixels.lightContextPixels).toBeGreaterThan(300);
};

test('P186E-X1 D1F review renders 14 group + 4 special source-label anchors against D1F context', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  await installRoutes(page);
  await page.goto(`/private-model/?review=${reviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-p186e-review-variant', 'D1F');
  await expect(canvas).toHaveAttribute('data-p186e-review-target-renderable-count', '18');
  await expect(canvas).toHaveAttribute('data-p186e-review-group-target-count', '14');
  await expect(canvas).toHaveAttribute('data-p186e-review-special-target-count', '4');
  await expect(canvas).toHaveAttribute('data-p186e-review-room-context-bridge-count', '7');
  await expect(canvas).toHaveAttribute('data-p186e-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p186e-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');
  await expectVisiblePixels(page);
});

test('P186E-X1 D2F review renders 15 group + 1 special source-label anchors against D2F context', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  await installRoutes(page);
  await page.goto(`/private-model/?review=${reviewId}&floor=d2f`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-p186e-review-variant', 'D2F');
  await expect(canvas).toHaveAttribute('data-p186e-review-target-renderable-count', '16');
  await expect(canvas).toHaveAttribute('data-p186e-review-group-target-count', '15');
  await expect(canvas).toHaveAttribute('data-p186e-review-special-target-count', '1');
  await expect(canvas).toHaveAttribute('data-p186e-review-room-context-bridge-count', '0');
  await expect(canvas).toHaveAttribute('data-p186e-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p186e-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-2f');
  await expectVisiblePixels(page);
});
