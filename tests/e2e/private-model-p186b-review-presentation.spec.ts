import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  p186bExpectedSourceLineItemCount,
  p186bReviewContextOpacity,
  p186bReviewSourceContext,
  p186bReviewTargetOpacity,
  p186bSourcePdfDriveId,
} from '../../src/scripts/privateModelP186BReviewPresentation';

const candidateId = 'p186b-d2015-d2f-wiring-mainmass-source-overlay';
const reviewId = `${candidateId}-review`;
const candidatePath =
  '/private-model/work-test/p186b-d2015-d2f-wiring-mainmass-source-overlay.glb';

test('P186B final review wiring applies D 2F preset before the 80/20 presentation state', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(viewerSource).toContain('prepareP186BReviewPresentation');
  expect(viewerSource).toContain(candidateId);
  expect(viewerSource).toContain("p186bReviewQuestion: 'D_2F_D2015_WIRING_MAINMASS_SOURCE_OVERLAY_RELATION'");
  expect(viewerSource).toContain('setP186bSourceContextVisible(true)');
  expect(viewerSource).toContain('p186bReviewSourceContext.sourceHref');
  expect(p186bReviewSourceContext.sourceHref).toContain(p186bSourcePdfDriveId);
  expect(p186bReviewSourceContext.limit).toContain('Ei fyysinen kaapelireitti');
  expect(p186bReviewSourceContext.limit).toContain('as-built');

  const stateStart = viewerSource.indexOf('const applyP186bReviewState');
  const stateEnd = viewerSource.indexOf('const applyP181bR1ReviewState', stateStart);
  expect(stateStart).toBeGreaterThanOrEqual(0);
  expect(stateEnd).toBeGreaterThan(stateStart);

  const stateSource = viewerSource.slice(stateStart, stateEnd);
  expect(stateSource).toContain("applyStandardViewPreset('d-2f')");
  expect(stateSource).toContain('setModelScene(fullModelScene)');
  expect(stateSource).toContain('deactivateDCoordinateReview()');
  expect(stateSource).toContain('setD1KnownDoorReviewLabelsVisible(false)');
  expect(stateSource).toContain('prepareP186BReviewPresentation(fullModelScene)');
  expect(stateSource.indexOf("applyStandardViewPreset('d-2f')")).toBeLessThan(
    stateSource.indexOf('prepareP186BReviewPresentation(fullModelScene)'),
  );
});

const makeGlbWithSharedTriangle = (nodes: Record<string, unknown>[]) => {
  const positions = Buffer.alloc(36);
  const values = [
    0, 0, 0,
    1.2, 0, 0,
    0, 0, 1.2,
  ];
  values.forEach((value, index) => positions.writeFloatLE(value, index * 4));

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P186B REVIEW TEST', nodes: nodes.map((_, index) => index) }],
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
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.1, 0.55, 0.95, 1],
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
        min: [0, 0, 0],
        max: [1.2, 0, 1.2],
      },
    ],
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

const makeP186BTargetNode = (
  sourceSelector: 'BLACK_LINE_PATH_STROKE_WIDTH_0.84PT' | 'BLACK_LINE_PATH_STROKE_WIDTH_1.08PT',
  sourceLineItemCount: number,
  translation: [number, number, number],
) => ({
  name: `P186B_D2F_${sourceSelector}_SOURCE_OVERLAY`,
  mesh: 0,
  translation,
  extras: {
    Pass: 'P186B',
    ModelStage: 'WORK_TEST_PRESENTATION',
    Canonical: false,
    canonical: false,
    hostStorey: 'D_2F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'sourceVectorPlanLineOverlay',
    sourcePdfDriveId: '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
    sourceSelector,
    sourceLineItemCount,
    sourceGraphicOnly: true,
    presentationOnly: true,
    physicalCableRouteClaim: false,
    deviceGeometryClaim: false,
    symbolSemanticClaim: false,
    exactZClaim: false,
    currentGeometryClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  },
});

test('P186B conventional review autoload renders exact 80/20 final state on canvas', async ({ page }) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidateModel = makeGlbWithSharedTriangle([
    makeP186BTargetNode('BLACK_LINE_PATH_STROKE_WIDTH_0.84PT', 5701, [0, 0, 0]),
    makeP186BTargetNode('BLACK_LINE_PATH_STROKE_WIDTH_1.08PT', 1622, [3.2, 0, 3.2]),
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001',
      mesh: 0,
      translation: [1.5, 0, 1.5],
      extras: {
        G2Id: 'G2_WALL_D_2F_001',
        presentationLayer: 'CURRENT_D',
      },
    },
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001',
      mesh: 0,
      translation: [7, 0, 7],
      extras: {
        G2Id: 'G2_WALL_D_1F_001',
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
            label: 'P186B D 2F wiring main-mass source overlay - WORK_TEST',
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
  await expect(canvas).toHaveAttribute(
    'data-p186b-review-question',
    'D_2F_D2015_WIRING_MAINMASS_SOURCE_OVERLAY_RELATION',
  );
  await expect(canvas).toHaveAttribute(
    'data-p186b-target-opacity',
    p186bReviewTargetOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute(
    'data-p186b-context-opacity',
    p186bReviewContextOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute('data-p186b-review-target-renderable-count', '2');
  await expect(canvas).toHaveAttribute('data-p186b-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute(
    'data-p186b-review-hidden-non-question-renderable-count',
    '1',
  );
  await expect(canvas).toHaveAttribute('data-p186b-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute(
    'data-p186b-source-line-item-count',
    String(p186bExpectedSourceLineItemCount),
  );
  await expect(canvas).toHaveAttribute('data-p186b-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-2f');
  await expect(canvas).toHaveAttribute(
    'data-p186b-review-scene',
    'FULL_MODEL_WITH_D_2F_PLAN_CAMERA',
  );
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '0');
  await expect(page.locator('#d1-known-door-label-layer')).toBeHidden();
  await expect(page.locator('#d1-known-door-legend')).toBeHidden();
  await expect(page.locator('#coordinate-panel')).toBeHidden();
  await expect(page.locator('#viewer-status')).toContainText(
    'source lines 80 % / D 2F context 20 %',
  );

  const sourceContext = page.locator('#p186b-source-context');
  await expect(sourceContext).toBeVisible();
  await expect(sourceContext.locator('#p186b-source-context-source')).toContainText(
    p186bReviewSourceContext.sourceLabel,
  );
  const sourceLink = sourceContext.locator('#p186b-source-links a');
  await expect(sourceLink).toHaveAttribute('href', p186bReviewSourceContext.sourceHref);
  await expect(sourceLink).toHaveAttribute('target', '_blank');
  await expect(sourceContext.locator('#p186b-source-context-limit')).toContainText(
    'Ei fyysinen kaapelireitti',
  );
  await expect(canvas).toHaveAttribute('data-p186b-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute('data-p186b-source-pdf-drive-id', p186bSourcePdfDriveId);
  await expect(canvas).toHaveAttribute(
    'data-p186b-source-role',
    p186bReviewSourceContext.sourceRole,
  );
  await expect(sourceContext.locator('iframe')).toHaveCount(0);

  await page.waitForTimeout(250);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
  const renderedPixelCount = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return 0;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const r0 = pixels[0] ?? 0;
    const g0 = pixels[1] ?? 0;
    const b0 = pixels[2] ?? 0;
    let count = 0;
    for (let y = 0; y < image.height; y += 4) {
      for (let x = 0; x < image.width; x += 4) {
        const index = (y * image.width + x) * 4;
        const delta =
          Math.abs((pixels[index] ?? 0) - r0) +
          Math.abs((pixels[index + 1] ?? 0) - g0) +
          Math.abs((pixels[index + 2] ?? 0) - b0);
        if (delta > 45) count += 1;
      }
    }
    return count;
  }, dataUrl);

  expect(renderedPixelCount).toBeGreaterThan(20);
});
