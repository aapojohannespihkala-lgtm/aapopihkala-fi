import { expect, test } from '@playwright/test';

import {
  m5aRelativeZReviewContextOpacity,
  m5aRelativeZReviewTargetOpacity,
  m5aSok1Sok2ExpectedVerticalDeltaM,
} from '../../src/scripts/privateModelM5ARelativeZReviewPresentation';
import {
  m5aR3Z1cCandidateId,
  m5aR3Z1cSok1Sok2RelativeZReviewId,
} from '../../src/scripts/privateModelWorkTest';

const candidatePath = `/private-model/work-test/${m5aR3Z1cCandidateId}.glb`;

const noPromotion = {
  Pass: 'M5A-R3-Z1C',
  ModelStage: 'WORK_TEST_VIEW',
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
};

const targetNodes = [
  {
    name: 'M5A_R3_Z1C_SOK1_WELL_MARKER_WORK',
    translation: [0, 0, -0.45],
    extras: {
      ...noPromotion,
      G2IdCandidate: 'G2_DRAIN_WELL_SOK1_001',
      representationKind: 'wellMarkerWork',
      physicalWellGeometryClaim: false,
    },
  },
  {
    name: 'M5A_R3_Z1C_SOK2_WELL_MARKER_WORK',
    translation: [8, 1.14, -0.45],
    extras: {
      ...noPromotion,
      G2IdCandidate: 'G2_DRAIN_WELL_SOK2_001',
      representationKind: 'wellMarkerWork',
      physicalWellGeometryClaim: false,
    },
  },
  {
    name: 'M5A_R3_Z1C_SOK1_SOK2_REFERENCE_ROUTE_WORK',
    translation: [0.2, 0.46, -0.35],
    scale: [6.5, 0.18, 1],
    extras: {
      ...noPromotion,
      G2IdCandidate: 'G2_DRAIN_LINK_SOK1_SOK2_001',
      representationKind: 'referenceRouteWork',
      physicalRouteClaim: false,
      relativeZRole:
        'HIGH_CONFIDENCE_DERIVED_SOURCE_LOCAL_DATUM_BRIDGE_PRESENTATION_PROFILE',
      sourceLocalRelativeZ: true,
      sourceRelativeZPlusSplitLevelDeltaM: 1.14,
      sourceLocalDatumBridgeM: 1,
      exactSlopeClaim: false,
    },
  },
];

const contextNode = {
  name: 'BUILDING_DRAINAGE_RELATIVE_Z_CONTEXT',
  translation: [-1.2, -1.0, 0.4],
  scale: [9, 3, 1],
  extras: {
    G2Id: 'G2_BUILDING_DRAINAGE_RELATIVE_Z_CONTEXT',
    presentationLayer: 'CURRENT_BUILDING',
  },
};

const makeGlb = (nodes: Record<string, unknown>[]) => {
  const positions = Buffer.alloc(36);
  [0, 0, 0, 1.2, 0, 0, 0, 1.2, 0].forEach((value, index) =>
    positions.writeFloatLE(value, index * 4),
  );

  const materials = nodes.map((_, index) => {
    const target = index < 3;
    return {
      pbrMetallicRoughness: {
        baseColorFactor: target ? [1, 0.32, 0.04, 1] : [0.04, 0.42, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 1,
      },
      alphaMode: 'BLEND',
      doubleSided: true,
      extensions: { KHR_materials_unlit: {} },
    };
  });
  const meshes = materials.map((_, index) => ({
    primitives: [{ attributes: { POSITION: 0 }, material: index }],
  }));
  const jsonNodes = nodes.map((node, index) => ({ ...node, mesh: index }));
  const json = {
    asset: { version: '2.0' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0,
    scenes: [{ name: 'M5A R3 Z1C SOK1 SOK2 RELATIVE Z REVIEW TEST', nodes: nodes.map((_, i) => i) }],
    nodes: jsonNodes,
    meshes,
    materials,
    accessors: [{
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [1.2, 1.2, 0],
    }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    buffers: [{ byteLength: positions.length }],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (positions.length % 4)) % 4;
  const binChunk = Buffer.concat([positions, Buffer.alloc(binPadding)]);
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

test('SOK1-SOK2 dedicated relative-Z review autoloads 3-target 80/20 orthographic elevation with visible context', async ({
  page,
}) => {
  test.setTimeout(25_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const currentModel = makeGlb([]);
  const candidateModel = makeGlb([...targetNodes, contextNode]);

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
        candidates: [{
          id: m5aR3Z1cCandidateId,
          label: 'M5A-R3 Z1C relative-Z functional NW continuity - WORK_TEST',
          path: candidatePath,
        }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      headers: { 'cache-control': 'no-store' },
      body: candidateModel,
    });
  });
  await page.route('**/m5a-drainman.pdf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><html><body>Drainage source context</body></html>',
    });
  });

  await page.goto(
    `/private-model/?review=${m5aR3Z1cSok1Sok2RelativeZReviewId}`,
    { waitUntil: 'domcontentloaded' },
  );

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    m5aR3Z1cSok1Sok2RelativeZReviewId,
  );
  await expect(canvas).toHaveAttribute(
    'data-m5a-review-scope',
    'R3_Z1C_SOK1_SOK2_RELATIVE_Z',
  );
  await expect(canvas).toHaveAttribute(
    'data-m5a-review-question',
    'DRAINAGE_R3_Z1C_SOK1_SOK2_RELATIVE_Z_USABILITY',
  );
  await expect(canvas).toHaveAttribute('data-m5a-review-target-renderable-count', '3');
  await expect(canvas).toHaveAttribute('data-m5a-review-expected-target-renderable-count', '3');
  await expect(canvas).toHaveAttribute('data-m5a-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-m5a-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute(
    'data-m5a-target-opacity',
    m5aRelativeZReviewTargetOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute(
    'data-m5a-context-opacity',
    m5aRelativeZReviewContextOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute(
    'data-m5a-relative-z-expected-delta-m',
    m5aSok1Sok2ExpectedVerticalDeltaM.toFixed(3),
  );
  await expect(canvas).toHaveAttribute('data-m5a-relative-z-world-delta-m', '1.140');
  await expect(canvas).toHaveAttribute('data-m5a-relative-z-route-metadata-delta-m', '1.140');
  await expect(canvas).toHaveAttribute('data-m5a-relative-z-parity', 'true');
  await expect(canvas).toHaveAttribute('data-m5a-exact-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute(
    'data-m5a-review-camera-mode',
    'ORTHOGRAPHIC_ELEV_POS_Y_TARGET_BOUNDS',
  );
  await expect(canvas).toHaveAttribute('data-m5a-review-camera-focus-applied', 'true');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'elev-pos-y');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-camera-pitch', 'locked');
  await expect(canvas).toHaveAttribute('data-camera-roll', 'locked');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-y');
  await expect(page.locator('#height-scale')).toBeVisible();
  await expect(page.locator('#m5a-source-context')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-m5a-source-preview-load-state', 'loaded');
  await expect(page.locator('#viewer-status')).toContainText('SOK1-SOK2 korkoero');
  await expect(page.locator('#viewer-status')).toContainText('+1,140 m HIGH_CONFIDENCE_DERIVED');
  await expect(page.locator('#viewer-status')).toContainText('HUMAN_REVIEW NOT_RUN');

  await page.waitForTimeout(180);
  const screenshot = await canvas.screenshot();
  const pixelEvidence = await page.evaluate(async (dataUrl) => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { orangeTargetPixels: 0, blueContextPixels: 0 };
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let orangeTargetPixels = 0;
    let blueContextPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      if (red > 110 && red > green + 35 && green > blue + 8) {
        orangeTargetPixels += 1;
      }
      if (blue > 45 && blue > red + 12 && blue > green + 10) {
        blueContextPixels += 1;
      }
    }
    return { orangeTargetPixels, blueContextPixels };
  }, `data:image/png;base64,${screenshot.toString('base64')}`);

  expect(pixelEvidence.orangeTargetPixels).toBeGreaterThan(40);
  expect(pixelEvidence.blueContextPixels).toBeGreaterThan(120);
});
