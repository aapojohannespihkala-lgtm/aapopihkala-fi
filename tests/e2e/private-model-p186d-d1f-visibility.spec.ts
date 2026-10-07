import { expect, test } from '@playwright/test';

import {
  p186dPositionSourcePdfDriveId,
  p186dSchedulePdfDriveId,
} from '../../src/scripts/privateModelP186DReviewPresentation';

const candidateId = 'p186d-x1-d2015-lighting-source-markers-p28-corrected';
const reviewId = `${candidateId}-review`;
const candidatePath =
  '/private-model/work-test/p186d-x1-d2015-lighting-source-markers-p28-corrected.glb';

const targetPositions = [
  0, 0, 0,
  0.18, 0, 0,
  0, 0, -0.18,
];

const contextPositions = [
  0, 0, 0,
  1, 0, 0,
  0, 0, -1,
  1, 0, 0,
  1, 0, -1,
  0, 0, -1,
];

const makeVisibilityGlb = (nodes: Record<string, unknown>[]) => {
  const targetBytes = Buffer.alloc(targetPositions.length * 4);
  targetPositions.forEach((value, index) => targetBytes.writeFloatLE(value, index * 4));

  const contextBytes = Buffer.alloc(contextPositions.length * 4);
  contextPositions.forEach((value, index) => contextBytes.writeFloatLE(value, index * 4));

  const targetOffset = 0;
  const contextOffset = targetBytes.length;
  const binPayload = Buffer.concat([targetBytes, contextBytes]);

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'D CURRENT INTERIOR - BABYLON Y-UP',
        nodes: nodes.map((_, index) => index),
      },
    ],
    nodes,
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0 },
            material: 0,
          },
        ],
      },
      {
        primitives: [
          {
            attributes: { POSITION: 1 },
            material: 1,
          },
        ],
      },
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
          baseColorFactor: [0.12, 0.12, 0.14, 1],
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
        min: [0, 0, -4.8],
        max: [5.5, 0, 0],
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: targetOffset,
        byteLength: targetBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: contextOffset,
        byteLength: contextBytes.length,
        target: 34962,
      },
    ],
    buffers: [{ byteLength: binPayload.length }],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binPayload.length % 4)) % 4;
  const binChunk = Buffer.concat([binPayload, Buffer.alloc(binPadding)]);

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

const scheduleByPos = {
  1: {
    sourceScheduleSnro: '4142068',
    sourceScheduleType: 'Lilja 6W',
    sourceSchedulePlannedQty: 13,
  },
  2: {
    sourceScheduleSnro: '4141926',
    sourceScheduleType: 'Helmi Lasikuutio 8W',
    sourceSchedulePlannedQty: 7,
  },
  4: {
    sourceScheduleSnro: '4159104',
    sourceScheduleType: 'ELIFE LED LIMPPU IP44 TUTKA',
    sourceSchedulePlannedQty: 3,
  },
} as const;

const makeTargetNode = (
  sourcePos: 1 | 2 | 4,
  ordinal: number,
  translation: [number, number, number],
) => {
  const schedule = scheduleByPos[sourcePos];
  return {
    name: `P186D_X1_D2015_LIGHTING_D_1F_POS${sourcePos}_${String(ordinal).padStart(2, '0')}_SOURCE_ANCHOR`,
    mesh: 0,
    translation,
    extras: {
      Pass: 'P186D-X1',
      ModelStage: 'WORK_TEST_PRESENTATION',
      Canonical: false,
      canonical: false,
      representationKind: 'luminaireSourceSymbolAnchorMarker',
      presentationLayer: 'MEP_ELECTRICAL',
      coordinateSystem: 'YLIS-G1-LOCAL',
      hostStorey: 'D_1F',
      sourcePos,
      sourcePosOrdinal: ordinal,
      ...schedule,
      sourcePdfDriveId: p186dPositionSourcePdfDriveId,
      schedulePdfDriveId: p186dSchedulePdfDriveId,
      sourcePositionBindingSha256:
        'a77b274fb3abab21e7ae3af9fbbba41839d55fa295106916ab4ac713c4cedc16',
      sourceSymbolCenter: true,
      sourceCoordinateClass: 'R_VECTOR_PAGE_CALIBRATED',
      positionTypeBinding: 'HIGH_CONFIDENCE_DERIVED',
      presentationOnly: true,
      physicalLuminaireGeometryClaim: false,
      exactCurrentXYClaim: false,
      exactZClaim: false,
      currentGeometryClaim: false,
      current: false,
      asBuilt: false,
      publishToCURRENT: false,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  };
};

const makeTargets = () => {
  const nodes: Record<string, unknown>[] = [];
  let globalOrdinal = 0;

  for (const [pos, count] of [
    [1, 13],
    [2, 6],
    [4, 3],
  ] as const) {
    for (let ordinal = 1; ordinal <= count; ordinal += 1) {
      const column = globalOrdinal % 6;
      const row = Math.floor(globalOrdinal / 6);
      nodes.push(
        makeTargetNode(pos, ordinal, [
          0.7 + column * 0.9,
          0.035,
          -(0.7 + row * 1.05),
        ]),
      );
      globalOrdinal += 1;
    }
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

test('P186D-X1 D1F review visibly separates 22 lighting targets from architecture context at wide viewport', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const currentModel = makeVisibilityGlb([]);
  const candidateModel = makeVisibilityGlb([
    ...makeTargets(),
    ...makeD1fRoomContextNodes(),
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_VISIBILITY_CONTEXT',
      mesh: 1,
      translation: [2.7, 0, -5.2],
      scale: [0.8, 1, 0.8],
      extras: {
        G2Id: 'G2_WALL_D_1F_VISIBILITY_CONTEXT',
        presentationLayer: 'CURRENT_D',
      },
    },
  ]);

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: candidateId,
            label: 'P186D-X1 D2015 lighting source markers p28-corrected - WORK_TEST',
            path: candidatePath,
          },
        ],
      }),
    });
  });

  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto(`/private-model/?review=${reviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-p186d-review-target-renderable-count', '22');
  await expect(canvas).toHaveAttribute('data-p186d-review-context-renderable-count', '8');
  await expect(canvas).toHaveAttribute('data-p186d-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186d-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');

  await page.waitForTimeout(300);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

  const visibilityPixels = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();

    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { amberTargetPixels: 0, lightContextPixels: 0 };

    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;

    let amberTargetPixels = 0;
    let lightContextPixels = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;

      if (
        red > 95 &&
        red > blue + 35 &&
        green > blue + 18 &&
        red > green * 1.05
      ) {
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

  expect(visibilityPixels.amberTargetPixels).toBeGreaterThan(100);
  expect(visibilityPixels.lightContextPixels).toBeGreaterThan(500);
});
