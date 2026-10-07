import { expect, test } from '@playwright/test';

import {
  p186cX2rContextG2Ids,
  p186cX2rExpectedComponents,
  p186cX2rExpectedSourceFragmentCount,
  p186cX2rFloorHeatingSourcePdfDriveId,
} from '../../src/scripts/privateModelP186CX2RReviewPresentation';

const candidateId = 'p186c-x2r-d2015-floor-heating-work-routes-p28-corrected';
const reviewId = `${candidateId}-review`;
const candidatePath = `/private-model/work-test/${candidateId}.glb`;

const targetPositions = [0, 0, 0, 1, 0, 0, 0, 0, -0.5];
const contextPositions = [0, 0, 0, 1, 0, 0, 1, 0, -1, 0, 0, -1];

const makeGlb = (nodes: Record<string, unknown>[]) => {
  const targetBytes = Buffer.alloc(targetPositions.length * 4);
  targetPositions.forEach((value, index) => targetBytes.writeFloatLE(value, index * 4));
  const contextBytes = Buffer.alloc(contextPositions.length * 4);
  contextPositions.forEach((value, index) => contextBytes.writeFloatLE(value, index * 4));
  const binPayload = Buffer.concat([targetBytes, contextBytes]);

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P186C-X2R WHOLE BUILDING SURVIVOR', nodes: nodes.map((_, index) => index) }],
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
        min: [0, 0, -0.5],
        max: [1, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 4,
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

const makeTarget = (
  partition: keyof typeof p186cX2rExpectedComponents,
  translation: [number, number, number],
  scale: [number, number, number],
) => {
  const expected = p186cX2rExpectedComponents[partition];
  return {
    name: `P186C_X2R_FLOOR_HEATING_${partition}_WORK_ROUTE_PROXY`,
    mesh: 0,
    translation,
    scale,
    extras: {
      Pass: 'P186C-X2R',
      ModelStage: 'WORK_TEST_GEOMETRY',
      Canonical: false,
      canonical: false,
      presentationOnly: true,
      workAssumption: true,
      coordinateSystem: 'YLIS-G1-LOCAL',
      hostStorey: 'D_1F',
      presentationLayer: 'MEP_ELECTRICAL',
      representationKind: 'floorHeatingCableWorkRouteProxy',
      sourcePdfDriveId: p186cX2rFloorHeatingSourcePdfDriveId,
      sourcePlanXYRole: 'HISTORICAL_2015_ROUTE_GUIDE',
      sourceFragmentPartition: partition,
      sourceFragmentCount: expected.sourceFragmentCount,
      finishedFloorZM: 0,
      workZRangeM: [-0.03, -0.02],
      workCenterDepthM: 0.025,
      proxyThicknessM: 0.01,
      sourceCableType: expected.sourceCableType,
      sourcePowerW: expected.sourcePowerW,
      sourceSstl: expected.sourceSstl,
      sourceInstallSpacingCm: expected.sourceInstallSpacingCm,
      derivedGroupKey: expected.derivedGroupKey,
      derivedGroupName: expected.derivedGroupName,
      derivedGroupBindingAuthority: 'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
      floorHeatingCableGeometryClaim: false,
      closedHeatingZoneClaim: false,
      physicalCableRouteClaim: false,
      continuousCableTopologyClaim: false,
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

const makeContext = (g2Id: string, index: number) => ({
  name: `P117D_REVIEW_${g2Id}`,
  mesh: 1,
  translation: [0.2 + (index % 3) * 2.0, -0.2, -(0.3 + Math.floor(index / 3) * 2.0)],
  scale: [1.7, 1, 1.4],
  extras: {
    G2Id: g2Id,
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  },
});

test('P186C-X2R review visibly separates A/B/C floor-heating work routes from six D1F source-room contexts', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const currentModel = makeGlb([]);
  const candidateModel = makeGlb([
    makeTarget('A', [0.3, 0.03, -0.4], [1.4, 1, 1.2]),
    makeTarget('B', [2.4, 0.03, -0.7], [1.5, 1, 1.2]),
    makeTarget('C', [4.4, 0.03, -0.5], [1.3, 1, 1.3]),
    ...p186cX2rContextG2Ids.map(makeContext),
    {
      name: 'UNRELATED_D2F_CONTEXT',
      mesh: 1,
      translation: [7, 0, -1],
      scale: [1.5, 1, 1.5],
      extras: {
        G2Id: 'G2_UNRELATED_D2F_CONTEXT',
        presentationLayer: 'CURRENT_D',
        representationKind: 'referenceFootprint',
      },
    },
  ]);

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: candidateId,
            label: 'P186C-X2R D2015 floor-heating work routes - WORK_TEST',
            path: candidatePath,
          },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto(`/private-model/?review=${reviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-p186c-x2r-review-target-renderable-count', '3');
  await expect(canvas).toHaveAttribute('data-p186c-x2r-review-context-renderable-count', '6');
  await expect(canvas).toHaveAttribute(
    'data-p186c-x2r-source-fragment-count',
    String(p186cX2rExpectedSourceFragmentCount),
  );
  await expect(canvas).toHaveAttribute('data-p186c-x2r-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186c-x2r-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');
  await expect(canvas).toHaveAttribute(
    'data-p186c-x2r-source-pdf-drive-id',
    p186cX2rFloorHeatingSourcePdfDriveId,
  );

  const sourcePanel = page.locator('#p186c-x2r-source-context');
  await expect(sourcePanel).toBeVisible();
  await expect(sourcePanel.locator('a')).toHaveAttribute(
    'href',
    new RegExp(p186cX2rFloorHeatingSourcePdfDriveId),
  );

  await page.waitForTimeout(300);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
  const pixels = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { blueTargetPixels: 0, lightContextPixels: 0 };
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let blueTargetPixels = 0;
    let lightContextPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      if (blue > 95 && green > 70 && blue > red + 55 && green > red + 25) {
        blueTargetPixels += 1;
      }
      if (
        red > 35 &&
        green > 40 &&
        blue > 45 &&
        Math.abs(red - green) < 32 &&
        Math.abs(green - blue) < 32
      ) {
        lightContextPixels += 1;
      }
    }
    return { blueTargetPixels, lightContextPixels };
  }, dataUrl);

  expect(pixels.blueTargetPixels).toBeGreaterThan(100);
  expect(pixels.lightContextPixels).toBeGreaterThan(500);
});
