import { expect, test } from '@playwright/test';

import {
  p185cX2CandidateId,
  p185cX2ReviewId,
} from '../../src/scripts/privateModelWorkTest';

const pad4 = (buffer: Buffer, fill = 0) => {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(padding, fill)]);
};

const packGlb = (json: Record<string, unknown>, binary?: Buffer) => {
  const jsonChunk = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const binaryChunk = binary ? pad4(binary) : null;
  const totalLength =
    12 + 8 + jsonChunk.length + (binaryChunk ? 8 + binaryChunk.length : 0);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const parts = [header, jsonHeader, jsonChunk];
  if (binaryChunk) {
    const binaryHeader = Buffer.alloc(8);
    binaryHeader.writeUInt32LE(binaryChunk.length, 0);
    binaryHeader.writeUInt32LE(0x004e4942, 4);
    parts.push(binaryHeader, binaryChunk);
  }
  return Buffer.concat(parts);
};

const makeEmptyGlb = () =>
  packGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
  });

const makeP185X2ThinOverlayGlb = () => {
  const overlayPositions: number[] = [];
  const overlayIndices: number[] = [];
  const stripWidth = 0.002;
  const stripLength = 0.18;

  for (let index = 0; index < 366; index += 1) {
    const column = index % 18;
    const row = Math.floor(index / 18);
    const x = 0.45 + column * 0.31;
    const z = 0.40 + row * 0.40;
    const vertexBase = overlayPositions.length / 3;
    overlayPositions.push(
      x - stripWidth / 2, 0.018, z,
      x + stripWidth / 2, 0.018, z,
      x + stripWidth / 2, 0.018, z + stripLength,
      x - stripWidth / 2, 0.018, z + stripLength,
    );
    overlayIndices.push(
      vertexBase,
      vertexBase + 1,
      vertexBase + 2,
      vertexBase,
      vertexBase + 2,
      vertexBase + 3,
    );
  }

  const rkPositions = [
    0.24, 0.026, 8.55,
    0.46, 0.026, 8.55,
    0.46, 0.026, 8.77,
    0.24, 0.026, 8.77,
  ];
  const rkIndices = [0, 1, 2, 0, 2, 3];

  const contextPositions = [
    0.0, 0.0, 0.0,
    6.0, 0.0, 0.0,
    6.0, 0.0, 9.0,
    0.0, 0.0, 9.0,
  ];
  const contextIndices = [0, 1, 2, 0, 2, 3];

  const bufferViews: Array<Record<string, number>> = [];
  const accessors: Array<Record<string, unknown>> = [];
  const binaryParts: Buffer[] = [];
  let binaryOffset = 0;

  const appendPrimitive = (positions: number[], indices: number[]) => {
    const positionBuffer = Buffer.from(new Float32Array(positions).buffer);
    const positionView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: binaryOffset,
      byteLength: positionBuffer.length,
      target: 34962,
    });
    binaryParts.push(positionBuffer);
    binaryOffset += positionBuffer.length;

    const positionAccessor = accessors.length;
    accessors.push({
      bufferView: positionView,
      componentType: 5126,
      count: positions.length / 3,
      type: 'VEC3',
    });

    const indexPadding = (4 - (binaryOffset % 4)) % 4;
    if (indexPadding) {
      binaryParts.push(Buffer.alloc(indexPadding));
      binaryOffset += indexPadding;
    }
    const indexBuffer = Buffer.from(new Uint16Array(indices).buffer);
    const indexView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: binaryOffset,
      byteLength: indexBuffer.length,
      target: 34963,
    });
    binaryParts.push(indexBuffer);
    binaryOffset += indexBuffer.length;

    const indexAccessor = accessors.length;
    accessors.push({
      bufferView: indexView,
      componentType: 5123,
      count: indices.length,
      type: 'SCALAR',
    });

    const tailPadding = (4 - (binaryOffset % 4)) % 4;
    if (tailPadding) {
      binaryParts.push(Buffer.alloc(tailPadding));
      binaryOffset += tailPadding;
    }

    return { positionAccessor, indexAccessor };
  };

  const overlay = appendPrimitive(overlayPositions, overlayIndices);
  const rk = appendPrimitive(rkPositions, rkIndices);
  const context = appendPrimitive(contextPositions, contextIndices);
  const binary = Buffer.concat(binaryParts);

  return packGlb(
    {
      asset: { version: '2.0' },
      extensionsUsed: ['KHR_materials_unlit'],
      scene: 0,
      scenes: [
        { nodes: [0, 1, 2] },
        { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [3] },
      ],
      nodes: [
        {
          name: 'P185C_X2_D2015_SOURCE_VECTOR_OVERLAY_SCREENLINE_TEST',
          mesh: 0,
          extras: {
            Pass: 'P185C-X2',
            ModelStage: 'WORK_TEST_PRESENTATION',
            Canonical: false,
            representationKind: 'sourceVectorPlanOverlay',
            hostStorey: 'D_1F',
            presentationLayer: 'MEP_ELECTRICAL',
            sourcePdfDriveId: '1vAyvAHdClqkXKIVNgKKUyOjMja-tzrok',
            sourceFragmentCount: 366,
            floorHeatingCableGeometryClaim: false,
            closedHeatingZoneClaim: false,
            exactXYClaim: false,
            exactZClaim: false,
            physicalCableRouteClaim: false,
            current: false,
            asBuilt: false,
            publishToCURRENT: false,
            HUMAN_REVIEW: 'NOT_RUN',
          },
        },
        {
          name: 'P185C_X2_D2015_RK_SCREENLINE_TEST',
          mesh: 1,
          extras: {
            Pass: 'P185C-X2',
            ModelStage: 'WORK_TEST_PRESENTATION',
            Canonical: false,
            representationKind: 'electricalPanelSourceLabelAnchorMarker',
            hostStorey: 'D_1F',
            presentationLayer: 'MEP_ELECTRICAL',
            sourcePdfDriveId: '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
            sourceText: 'RYHMäKESKUS RK',
            electricalPanelGeometryClaim: false,
            exactXYClaim: false,
            exactZClaim: false,
            physicalCableRouteClaim: false,
            current: false,
            asBuilt: false,
            publishToCURRENT: false,
            HUMAN_REVIEW: 'NOT_RUN',
          },
        },
        {
          name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001',
          mesh: 2,
          extras: {
            G2Id: 'G2_WALL_D_1F_001',
            presentationLayer: 'CURRENT_D',
          },
        },
        {
          name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001__INTERIOR_SCENE',
          mesh: 2,
          extras: {
            G2Id: 'G2_WALL_D_1F_001',
            presentationLayer: 'CURRENT_D',
          },
        },
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: overlay.positionAccessor },
              indices: overlay.indexAccessor,
              material: 0,
            },
          ],
        },
        {
          primitives: [
            {
              attributes: { POSITION: rk.positionAccessor },
              indices: rk.indexAccessor,
              material: 1,
            },
          ],
        },
        {
          primitives: [
            {
              attributes: { POSITION: context.positionAccessor },
              indices: context.indexAccessor,
              material: 2,
            },
          ],
        },
      ],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.94, 0.36, 0.10, 0.78],
            metallicFactor: 0,
            roughnessFactor: 1,
          },
          alphaMode: 'BLEND',
          doubleSided: true,
          extensions: { KHR_materials_unlit: {} },
        },
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.12, 0.36, 0.96, 0.90],
            metallicFactor: 0,
            roughnessFactor: 1,
          },
          alphaMode: 'BLEND',
          doubleSided: true,
          extensions: { KHR_materials_unlit: {} },
        },
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.65, 0.68, 0.70, 1],
            metallicFactor: 0,
            roughnessFactor: 1,
          },
          doubleSided: true,
          extensions: { KHR_materials_unlit: {} },
        },
      ],
      accessors,
      bufferViews,
      buffers: [{ byteLength: binary.length }],
    },
    binary,
  );
};

test('P185C-X2 wide review keeps thin source fragments visibly cyan at screen scale', async ({
  page,
}) => {
  test.setTimeout(25_000);
  await page.setViewportSize({ width: 1600, height: 900 });

  const currentModel = makeEmptyGlb();
  const candidateModel = makeP185X2ThinOverlayGlb();
  const candidatePath =
    '/private-model/work-test/p185c-x2-d2015-electrical-source-overlay-p28-corrected.glb';

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
            id: p185cX2CandidateId,
            label: 'P185C-X2 screen-line visibility test',
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

  await page.goto(`/private-model/?review=${p185cX2ReviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', p185cX2ReviewId);
  await expect(canvas).toHaveAttribute('data-p185-review-target-renderable-count', '2');
  await expect(canvas).toHaveAttribute('data-p185-review-semantic-violation-count', '0');

  await page.waitForTimeout(250);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
  const counts = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { cyan: 0, yellow: 0 };
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let cyan = 0;
    let yellow = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index] ?? 0;
      const g = pixels[index + 1] ?? 0;
      const b = pixels[index + 2] ?? 0;
      if (b > 170 && g > 130 && r < 150) cyan += 1;
      if (r > 170 && g > 135 && b < 100) yellow += 1;
    }
    return { cyan, yellow };
  }, dataUrl);

  expect(counts.cyan).toBeGreaterThan(1200);
  expect(counts.yellow).toBeGreaterThan(10);
});
