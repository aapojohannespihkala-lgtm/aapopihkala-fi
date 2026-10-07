import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  p186dExpectedD1fPosCounts,
  p186dExpectedD1fTargetCount,
  p186dExpectedD2fPosCounts,
  p186dExpectedD2fTargetCount,
  p186dPositionSourcePdfDriveId,
  p186dReviewContextColorHex,
  p186dReviewContextOpacity,
  p186dReviewSourceContexts,
  p186dReviewSourceLimit,
  p186dReviewTargetOpacity,
  p186dSchedulePdfDriveId,
} from '../../src/scripts/privateModelP186DReviewPresentation';

const candidateId = 'p186d-x1-d2015-lighting-source-markers-p28-corrected';
const reviewId = `${candidateId}-review`;
const candidatePath =
  '/private-model/work-test/p186d-x1-d2015-lighting-source-markers-p28-corrected.glb';

test('P186D-X1 D1F review route is bounded to 22 lighting source anchors with 80/20 presentation', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(viewerSource).toContain('prepareP186DReviewPresentation');
  expect(viewerSource).toContain(candidateId);
  expect(viewerSource).toContain(
    "p186dReviewQuestion: 'D_1F_D2015_LIGHTING_SOURCE_MARKER_POSITION_TYPE_RELATION'",
  );
  expect(viewerSource).toContain("applyStandardViewPreset('d-1f')");
  expect(viewerSource).toContain('setP186dSourceContextVisible(true)');
  expect(viewerSource).toContain('p186dReviewSourceContexts');
  expect(p186dExpectedD1fTargetCount).toBe(22);
  expect(p186dReviewContextColorHex).toBe(0xe2e8f0);
  expect(p186dExpectedD1fPosCounts).toEqual({ 1: 13, 2: 6, 4: 3 });
  expect(p186dExpectedD2fTargetCount).toBe(12);
  expect(p186dExpectedD2fPosCounts).toEqual({ 2: 1, 3: 10, 5: 1 });
  expect(viewerSource).toContain("get('floor') === 'd2f'");
  expect(viewerSource).toContain("'D_2F_D2015_LIGHTING_SOURCE_MARKER_POSITION_TYPE_RELATION'");
  expect(p186dReviewSourceContexts).toHaveLength(2);
  expect(p186dReviewSourceContexts[0].sourceHref).toContain(p186dPositionSourcePdfDriveId);
  expect(p186dReviewSourceContexts[1].sourceHref).toContain(p186dSchedulePdfDriveId);
  expect(p186dReviewSourceLimit).toContain('Ei fyysinen nykyvalaisimen sijainti');
  expect(p186dReviewSourceLimit).toContain('as-built');
});

const makeGlbWithSharedTriangle = (nodes: Record<string, unknown>[]) => {
  const positions = Buffer.alloc(36);
  const values = [
    0, 0, 0,
    0.12, 0, 0,
    0, 0, 0.12,
  ];
  values.forEach((value, index) => positions.writeFloatLE(value, index * 4));

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P186D-X1 D1F REVIEW TEST', nodes: nodes.map((_, index) => index) }],
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
          baseColorFactor: [0.95, 0.65, 0.12, 1],
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
        max: [0.12, 0, 0.12],
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
  3: {
    sourceScheduleSnro: '4142045',
    sourceScheduleType: 'Iiris 8W',
    sourceSchedulePlannedQty: 10,
  },
  4: {
    sourceScheduleSnro: '4159104',
    sourceScheduleType: 'ELIFE LED LIMPPU IP44 TUTKA',
    sourceSchedulePlannedQty: 3,
  },
  5: {
    sourceScheduleSnro: '4141966',
    sourceScheduleType: 'Lilja 16W',
    sourceSchedulePlannedQty: 1,
  },
} as const;

const makeP186DTargetNode = (
  sourcePos: 1 | 2 | 3 | 4 | 5,
  ordinal: number,
  translation: [number, number, number],
  hostStorey: 'D_1F' | 'D_2F' = 'D_1F',
) => {
  const schedule = scheduleByPos[sourcePos];
  return {
    name: `P186D_X1_D2015_LIGHTING_${hostStorey}_POS${sourcePos}_${String(ordinal).padStart(2, '0')}_SOURCE_ANCHOR`,
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
      hostStorey,
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

const makeP186DTargets = () => {
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
        makeP186DTargetNode(pos, ordinal, [
          0.8 + column * 0.9,
          0.035,
          -(0.8 + row * 1.1),
        ]),
      );
      globalOrdinal += 1;
    }
  }
  return nodes;
};

const makeP186DD2fTargets = () => {
  const nodes: Record<string, unknown>[] = [];
  let globalOrdinal = 0;
  for (const [pos, count] of [
    [2, 1],
    [3, 10],
    [5, 1],
  ] as const) {
    for (let ordinal = 1; ordinal <= count; ordinal += 1) {
      const column = globalOrdinal % 6;
      const row = Math.floor(globalOrdinal / 6);
      nodes.push(
        makeP186DTargetNode(
          pos,
          ordinal,
          [0.8 + column * 0.9, 2.795, -(0.8 + row * 1.1)],
          'D_2F',
        ),
      );
      globalOrdinal += 1;
    }
  }
  return nodes;
};

const makeP186DD1fRoomContexts = () => {
  const rooms = [
    ['SAUNA', [4.0, 0.0, -0.5]],
    ['PESUHUONE', [4.0, 0.0, -2.5]],
    ['WC', [4.4, 0.0, -4.4]],
    ['VH_WEST', [0.4, 0.0, -3.4]],
    ['VH_NORTH', [0.4, 0.0, -7.4]],
    ['HUONE2', [0.4, 0.0, -0.7]],
    ['VARASTO', [0.4, 0.0, -9.0]],
  ] as const;

  return rooms.map(([room, translation]) => ({
    name: `P117D_REVIEW_P87_VIEW_G2_D15_SPACE_${room}_1F_SRC`,
    mesh: 0,
    translation,
    extras: {
      G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    },
  }));
};

test('P186D-X1 conventional review autoload renders bounded D1F lighting state on canvas', async ({
  page,
}) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidateModel = makeGlbWithSharedTriangle([
    ...makeP186DTargets(),
    ...makeP186DD1fRoomContexts(),
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001',
      mesh: 0,
      translation: [3.1, 0, -3.2],
      extras: {
        G2Id: 'G2_WALL_D_1F_001',
        presentationLayer: 'CURRENT_D',
      },
    },
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001',
      mesh: 0,
      translation: [7, 2.76, -7],
      extras: {
        G2Id: 'G2_WALL_D_2F_001',
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
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute(
    'data-p186d-review-question',
    'D_1F_D2015_LIGHTING_SOURCE_MARKER_POSITION_TYPE_RELATION',
  );
  await expect(canvas).toHaveAttribute(
    'data-p186d-target-opacity',
    p186dReviewTargetOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute(
    'data-p186d-context-opacity',
    p186dReviewContextOpacity.toFixed(2),
  );
  await expect(canvas).toHaveAttribute('data-p186d-review-target-renderable-count', '22');
  await expect(canvas).toHaveAttribute('data-p186d-review-context-renderable-count', '8');
  await expect(canvas).toHaveAttribute('data-p186d-review-hidden-non-question-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p186d-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186d-d1f-pos-counts', '1:13,2:6,4:3');
  await expect(canvas).toHaveAttribute('data-p186d-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');
  await expect(canvas).toHaveAttribute(
    'data-p186d-review-scene',
    'FULL_MODEL_WITH_D_1F_PLAN_CAMERA',
  );
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '0');
  await expect(page.locator('#d1-known-door-label-layer')).toBeHidden();
  await expect(page.locator('#d1-known-door-legend')).toBeHidden();
  await expect(page.locator('#coordinate-panel')).toBeHidden();
  await expect(page.locator('#viewer-status')).toContainText(
    '22 source anchors 80 % / D 1F context 20 %',
  );

  const sourceContext = page.locator('#p186d-source-context');
  await expect(sourceContext).toBeVisible();
  await expect(sourceContext.locator('#p186d-source-context-source')).toContainText(
    'Alkuperäislähteet',
  );
  const sourceLinks = sourceContext.locator('#p186d-source-links a');
  await expect(sourceLinks).toHaveCount(2);
  await expect(sourceLinks.nth(0)).toHaveAttribute(
    'href',
    p186dReviewSourceContexts[0].sourceHref,
  );
  await expect(sourceLinks.nth(1)).toHaveAttribute(
    'href',
    p186dReviewSourceContexts[1].sourceHref,
  );
  await expect(sourceLinks.nth(0)).toHaveAttribute('target', '_blank');
  await expect(sourceLinks.nth(1)).toHaveAttribute('target', '_blank');
  await expect(sourceContext.locator('#p186d-source-context-limit')).toContainText(
    'Ei fyysinen nykyvalaisimen sijainti',
  );
  await expect(canvas).toHaveAttribute('data-p186d-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute(
    'data-p186d-position-source-pdf-drive-id',
    p186dPositionSourcePdfDriveId,
  );
  await expect(canvas).toHaveAttribute(
    'data-p186d-schedule-pdf-drive-id',
    p186dSchedulePdfDriveId,
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

test('P186D-X1 D2F floor parameter renders the separate 12-anchor bounded review contract', async ({
  page,
}) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidateModel = makeGlbWithSharedTriangle([
    ...makeP186DD2fTargets(),
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001',
      mesh: 0,
      translation: [3.1, 2.76, -3.2],
      extras: {
        G2Id: 'G2_WALL_D_2F_001',
        presentationLayer: 'CURRENT_D',
      },
    },
    {
      name: 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001',
      mesh: 0,
      translation: [7, 0, -7],
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

  await page.goto(`/private-model/?review=${reviewId}&floor=d2f`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute('data-p186d-review-variant', 'D2F');
  await expect(canvas).toHaveAttribute(
    'data-p186d-review-question',
    'D_2F_D2015_LIGHTING_SOURCE_MARKER_POSITION_TYPE_RELATION',
  );
  await expect(canvas).toHaveAttribute('data-p186d-review-target-renderable-count', '12');
  await expect(canvas).toHaveAttribute('data-p186d-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p186d-review-hidden-non-question-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p186d-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p186d-d2f-pos-counts', '2:1,3:10,5:1');
  await expect(canvas).toHaveAttribute('data-p186d-pos-counts', '2:1,3:10,5:1');
  await expect(canvas).toHaveAttribute('data-p186d-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-2f');
  await expect(canvas).toHaveAttribute(
    'data-p186d-review-scene',
    'FULL_MODEL_WITH_D_2F_PLAN_CAMERA',
  );
  await expect(canvas).toHaveAttribute('data-p186d-review-camera-mode', 'ORTHOGRAPHIC_D_2F_SUPPORT');
  await expect(page.locator('#d1-known-door-label-layer')).toBeHidden();
  await expect(page.locator('#d1-known-door-legend')).toBeHidden();
  await expect(page.locator('#coordinate-panel')).toBeHidden();
  await expect(page.locator('#viewer-status')).toContainText(
    '12 source anchors 80 % / D 2F context 20 %',
  );

  const sourceContext = page.locator('#p186d-source-context');
  await expect(sourceContext).toBeVisible();
  await expect(sourceContext.locator('#p186d-source-links a')).toHaveCount(2);
  await expect(sourceContext.locator('#p186d-source-context-limit')).toContainText(
    'Ei fyysinen nykyvalaisimen sijainti',
  );
  await expect(canvas).toHaveAttribute('data-p186d-source-context-ready', 'true');
});

