import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  p185cCandidateId,
  p185cReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p185ReviewContextOpacity,
  p185ReviewTargetOpacity,
  p185TargetRepresentationKinds,
  prepareP185ReviewPresentation,
} from '../../src/scripts/privateModelP185ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeTarget = (
  representationKind: 'sourceVectorPlanOverlay' | 'electricalPanelSourceLabelAnchorMarker',
) => {
  const sourceMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const object = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 1), sourceMaterial);
  object.userData = {
    Pass: 'P185C',
    ModelStage: 'WORK_TEST_PRESENTATION',
    Canonical: false,
    representationKind,
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    exactXYClaim: false,
    exactZClaim: false,
    physicalCableRouteClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
    ...(representationKind === 'sourceVectorPlanOverlay'
      ? {
          sourcePdfDriveId: '1vAyvAHdClqkXIVNgKKUyOjMja-tzrok',
          sourceFragmentCount: 366,
          floorHeatingCableGeometryClaim: false,
          closedHeatingZoneClaim: false,
        }
      : {
          sourcePdfDriveId: '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
          sourceText: 'RYHMäKESKUS RK',
          electricalPanelGeometryClaim: false,
        }),
  };
  return { object, sourceMaterial };
};

test('P185C question presentation keeps exact electrical targets at 80 and D 1F architecture context at 20', () => {
  const scene = new THREE.Group();
  const overlay = makeTarget('sourceVectorPlanOverlay');
  const rk = makeTarget('electricalPanelSourceLabelAnchorMarker');
  overlay.object.position.set(2, 0, 3);
  rk.object.position.set(5.654, 0, 8.497);

  const d1fContextMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const d1fContext = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), d1fContextMaterial);
  d1fContext.name = 'P134B_ARCH_BASE_CLONE__G2_WALL_D_1F_001';
  d1fContext.userData = {
    G2Id: 'G2_WALL_D_1F_001',
    presentationLayer: 'CURRENT_D',
  };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 2),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.name = 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001';
  unrelated.userData = {
    G2Id: 'G2_WALL_D_2F_001',
    presentationLayer: 'CURRENT_D',
  };

  scene.add(overlay.object, rk.object, d1fContext, unrelated);
  const presentation = prepareP185ReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.contextRenderableCount).toBe(1);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(1);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetRepresentationKinds).toEqual([]);
  expect(new Set(presentation.foundTargetRepresentationKinds)).toEqual(
    new Set(p185TargetRepresentationKinds),
  );
  expect(presentation.targetBounds).not.toBeNull();

  expect(overlay.object.visible).toBe(true);
  expect(rk.object.visible).toBe(true);
  expect(unrelated.visible).toBe(false);
  expect(d1fContext.visible).toBe(true);

  const overlayMaterial = overlay.object.material as any;
  const rkMaterial = rk.object.material as any;
  const contextMaterial = d1fContext.material as any;
  expect(overlayMaterial).not.toBe(overlay.sourceMaterial);
  expect(rkMaterial).not.toBe(rk.sourceMaterial);
  expect(overlayMaterial.opacity).toBe(p185ReviewTargetOpacity);
  expect(rkMaterial.opacity).toBe(p185ReviewTargetOpacity);
  expect(contextMaterial).not.toBe(d1fContextMaterial);
  expect(contextMaterial.opacity).toBe(p185ReviewContextOpacity);
  expect(overlay.object.userData.p185ReviewRole).toBe('QUESTION_TARGET_80');
  expect(rk.object.userData.p185ReviewRole).toBe('QUESTION_TARGET_80');
  expect(d1fContext.userData.p185ReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
});

test('P185C presentation reports no-promotion semantic violations instead of silently promoting source graphics', () => {
  const scene = new THREE.Group();
  const overlay = makeTarget('sourceVectorPlanOverlay');
  const rk = makeTarget('electricalPanelSourceLabelAnchorMarker');
  overlay.object.userData.exactXYClaim = true;
  scene.add(overlay.object, rk.object);

  const presentation = prepareP185ReviewPresentation(scene);
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.semanticViolationCount).toBe(1);
});

test('private viewer wires P185C review alias to D 1F 80/20 presentation without HUMAN_REVIEW promotion', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(p185cCandidateId).toBe('p185c-d2015-electrical-source-overlay');
  expect(p185cReviewId).toBe('p185c-d2015-electrical-source-overlay-review');
  expect(viewerSource).toContain('prepareP185ReviewPresentation');
  expect(viewerSource).toContain('isP185cElectricalSourceReviewRequested');
  expect(viewerSource).toContain('applyP185cReviewState');
  expect(viewerSource).toContain('candidate.id === p185cCandidateId');
  expect(viewerSource).toContain("p185ReviewQuestion: 'D_1F_D2015_ELECTRICAL_SOURCE_OVERLAY_RELATION'");
  expect(viewerSource).toContain('p185ReviewTargetOpacity.toFixed(2)');
  expect(viewerSource).toContain('p185ReviewContextOpacity.toFixed(2)');
  expect(viewerSource).toContain("p185FloorHeatingCableGeometryClaim: 'false'");
  expect(viewerSource).toContain("p185ElectricalPanelGeometryClaim: 'false'");
  expect(viewerSource).toContain("p185PhysicalCableRouteClaim: 'false'");
  expect(viewerSource).toContain("p185HumanReview: 'NOT_RUN'");
  expect(viewerSource).toContain("standardViewPreset: 'd-1f'");
  expect(viewerSource).toContain("applyStandardViewPreset('d-1f')");
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
    scenes: [{ name: 'P185C REVIEW TEST', nodes: nodes.map((_, index) => index) }],
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
          baseColorFactor: [0.95, 0.45, 0.08, 1],
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

test('P185C review autoload renders the bounded 80/20 question state on canvas', async ({ page }) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidateId = p185cCandidateId;
  const candidatePath = '/private-model/work-test/p185c-d2015-electrical-source-overlay.glb';
  const candidateModel = makeGlbWithSharedTriangle([
    {
      name: 'P185C_D2015_FLOOR_HEATING_366_SOURCE_VECTOR_OVERLAY_PRESENTATION_ONLY',
      mesh: 0,
      translation: [0, 0, 0],
      extras: {
        Pass: 'P185C',
        ModelStage: 'WORK_TEST_PRESENTATION',
        Canonical: false,
        representationKind: 'sourceVectorPlanOverlay',
        hostStorey: 'D_1F',
        presentationLayer: 'MEP_ELECTRICAL',
        sourcePdfDriveId: '1vAyvAHdClqkXIVNgKKUyOjMja-tzrok',
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
      name: 'P185C_D2015_RK_SOURCE_LABEL_ANCHOR_PRESENTATION_ONLY',
      mesh: 0,
      translation: [3.2, 0, 3.2],
      extras: {
        Pass: 'P185C',
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
      name: 'G2_WALL_D_1F_001',
      mesh: 0,
      translation: [1.5, 0, 1.5],
      extras: {
        G2Id: 'G2_WALL_D_1F_001',
        presentationLayer: 'CURRENT_D',
      },
    },
    {
      name: 'G2_WALL_D_2F_001',
      mesh: 0,
      translation: [7, 0, 7],
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
            label: 'P185C D2015 electrical source overlay - WORK_TEST',
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

  await page.goto(`/private-model/?review=${p185cReviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', p185cReviewId);
  await expect(canvas).toHaveAttribute(
    'data-p185-review-question',
    'D_1F_D2015_ELECTRICAL_SOURCE_OVERLAY_RELATION',
  );
  await expect(canvas).toHaveAttribute('data-p185-target-opacity', '0.80');
  await expect(canvas).toHaveAttribute('data-p185-context-opacity', '0.20');
  await expect(canvas).toHaveAttribute('data-p185-review-target-renderable-count', '2');
  await expect(canvas).toHaveAttribute('data-p185-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p185-review-hidden-non-question-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p185-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p185-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-1f');
  await expect(page.locator('#viewer-status')).toContainText(
    'source overlay + RK 80 % / D 1F context 20 %',
  );

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
