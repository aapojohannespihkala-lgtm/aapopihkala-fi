import { expect, test } from '@playwright/test';

import {
  m5aZ2AbsoluteZBasis,
  m5aZ2AbsoluteZContract,
  m5aZ2ExpectedTargetKeys,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const reviewId = `${candidateId}-review`;
const candidatePath = '/private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb';

const targetPositions = [
  0, 0, 0,
  0.28, 0, 0,
  0.04, 0, -0.24,
];

const contextPositions = [
  0, 0, 0,
  10, 0, 0,
  0, 0, -6,
  10, 0, 0,
  10, 0, -6,
  0, 0, -6,
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
        name: 'YLISRINNE M5A-Z2 R1090 REVIEW - BABYLON Y-UP',
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
        emissiveFactor: [1, 0.18, 0.02],
        pbrMetallicRoughness: {
          baseColorFactor: [1, 0.22, 0.03, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        emissiveFactor: [0.02, 0.08, 1],
        pbrMetallicRoughness: {
          baseColorFactor: [0.03, 0.12, 1, 1],
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
        min: [0, 0, -0.24],
        max: [0.28, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 6,
        type: 'VEC3',
        min: [0, 0, -6],
        max: [10, 0, 0],
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

const commonTarget = {
  Pass: 'M5A-Z2',
  Canonical: false,
  presentationOnly: true,
  workAssumption: true,
  sourceDerivedTopology: true,
  exactXYClaim: false,
  exactZClaim: false,
  physicalElevationClaim: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  publishToCURRENT: false,
  absoluteZContract: m5aZ2AbsoluteZContract,
};

const targetLocations: [number, number, number][] = [
  [1.0, 0.06, -1.0],
  [8.3, 0.06, -1.0],
  [8.3, 0.06, -5.0],
  [1.0, 0.06, -5.0],
  [2.0, 0.06, -4.8],
  [6.8, 0.06, -4.8],
  [4.3, 0.06, -1.0],
  [8.7, 0.06, -3.7],
  [8.7, 0.06, -2.3],
  [0.6, 0.06, -3.8],
  [0.6, 0.06, -2.2],
  [0.25, 0.06, -4.8],
  [9.15, 0.06, -4.8],
];

const makeTargetNode = (key: string, index: number) => {
  const boundary = key.startsWith('boundary:');
  const well = key.startsWith('G2_DRAIN_WELL_');

  const extras = boundary
    ? {
        ...commonTarget,
        representationKind: 'unresolvedBoundaryMarker',
        boundaryStatus: 'UNRESOLVED_BOUNDARY',
        boundaryRole: key.slice('boundary:'.length),
        physicalRouteClaim: false,
        externalNetworkConnectionClaim: false,
      }
    : {
        ...commonTarget,
        G2IdCandidate: key,
        representationKind: well ? 'wellMarkerWork' : 'referenceRouteWork',
        physicalWellGeometryClaim: well ? false : undefined,
        physicalRouteClaim: well ? undefined : false,
        exactSlopeClaim: well ? undefined : false,
        absoluteZBasis: m5aZ2AbsoluteZBasis,
      };

  return {
    name: `M5A_Z2_R1090_REVIEW_TARGET_${String(index + 1).padStart(2, '0')}`,
    mesh: 0,
    translation: targetLocations[index],
    scale: [1.8, 1, 1.8],
    extras,
  };
};

test('M5A-Z2 R1090 review autoloads 13 targets with visible 80/20 render hierarchy', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const currentModel = makeVisibilityGlb([]);
  const candidateModel = makeVisibilityGlb([
    ...m5aZ2ExpectedTargetKeys.map(makeTargetNode),
    {
      name: 'M5A_Z2_R1090_BUILDING_DRAINAGE_CONTEXT',
      mesh: 1,
      extras: {
        presentationLayer: 'CURRENT_BUILDING',
        representationKind: 'buildingContext',
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
            label: 'M5A-Z2 R1090 well-top ground-surface - WORK_TEST',
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
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute('data-m5a-review-target-renderable-count', '13');
  await expect(canvas).toHaveAttribute('data-m5a-review-expected-target-renderable-count', '13');
  await expect(canvas).toHaveAttribute('data-m5a-review-well-marker-count', '4');
  await expect(canvas).toHaveAttribute('data-m5a-review-route-count', '7');
  await expect(canvas).toHaveAttribute('data-m5a-review-unresolved-boundary-count', '2');
  await expect(canvas).toHaveAttribute('data-m5a-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-m5a-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-m5a-z2-absolute-z-basis', m5aZ2AbsoluteZBasis);
  await expect(canvas).toHaveAttribute('data-m5a-z2-absolute-z-contract', m5aZ2AbsoluteZContract);
  await expect(canvas).toHaveAttribute('data-m5a-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-m5a-review-camera-mode', 'PERSPECTIVE_FREE_ORBIT_TARGET_BOUNDS');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');

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
    if (!context) return { warmTargetPixels: 0, blueContextPixels: 0 };

    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let warmTargetPixels = 0;
    let blueContextPixels = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;

      if (red > 105 && red > green * 1.25 && red > blue * 1.35) {
        warmTargetPixels += 1;
      }

      if (blue > 90 && blue > red * 1.08 && blue > green * 1.04) {
        blueContextPixels += 1;
      }
    }

    return { warmTargetPixels, blueContextPixels };
  }, dataUrl);

  expect(visibilityPixels.warmTargetPixels).toBeGreaterThan(80);
  expect(visibilityPixels.blueContextPixels).toBeGreaterThan(250);
});
