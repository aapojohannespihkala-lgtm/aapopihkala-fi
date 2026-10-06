import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  p184hApplianceOnP185cReviewId,
  p185cCandidateId,
  p185cReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p184hApplianceAidRoles,
  p184hApplianceReviewContextOpacity,
  p184hApplianceReviewTargetOpacity,
  p185ReviewContextOpacity,
  p185ReviewTargetOpacity,
  p185TargetRepresentationKinds,
  prepareP184hApplianceAidReviewPresentation,
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


const makeP184hAid = (semanticRole: 'oven' | 'cooktop') => {
  const sourceMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const object = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), sourceMaterial);
  object.userData = {
    Pass: 'P184H',
    ModelStage: 'WORK_TEST_PRESENTATION',
    Canonical: false,
    representationKind: 'appliancePlacementPresentationAid',
    hostG2Id: 'G2_FURN_D_2F_KITCHEN_ISLAND_001',
    hostStorey: 'D_2F',
    presentationLayer: 'D_ARCH_FURNITURE_AIDS',
    sourcePlanDriveId: '1G04Dye0etHSTAMgqabstPOfrEFnuFjWl',
    presentationAidId:
      semanticRole === 'oven'
        ? 'P184H_APPLIANCE_AID_OVEN_001'
        : 'P184H_APPLIANCE_AID_COOKTOP_001',
    semanticRole,
    applianceGeometryClaim: false,
    physicalApplianceFootprintClaim: false,
    exactXYClaim: false,
    exactZClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  };
  return { object, sourceMaterial };
};

test('P184H appliance review keeps oven and cooktop at 80 with island and D 2F context at 20', () => {
  const scene = new THREE.Group();
  const oven = makeP184hAid('oven');
  const cooktop = makeP184hAid('cooktop');
  oven.object.position.set(4.2, 0, 3.2);
  cooktop.object.position.set(4.2, 0, 3.9);

  const islandMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const island = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 1.85), islandMaterial);
  island.userData = {
    Pass: 'P184G',
    G2Id: 'G2_FURN_D_2F_KITCHEN_ISLAND_001',
    representationKind: 'fixedFurnitureWorkSolid',
    hostStorey: 'D_2F',
    presentationLayer: 'D_ARCH_FURNITURE',
  };

  const d2fMaterial = new THREE.MeshBasicMaterial({ opacity: 1 });
  const d2fContext = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), d2fMaterial);
  d2fContext.name = 'P134B_ARCH_BASE_CLONE__G2_WALL_D_2F_001';
  d2fContext.userData = {
    G2Id: 'G2_WALL_D_2F_001',
    presentationLayer: 'CURRENT_D',
  };

  const unrelated = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 2),
    new THREE.MeshBasicMaterial({ opacity: 1 }),
  );
  unrelated.name = 'G2_WALL_D_1F_001';
  unrelated.userData = {
    G2Id: 'G2_WALL_D_1F_001',
    presentationLayer: 'CURRENT_D',
  };

  scene.add(oven.object, cooktop.object, island, d2fContext, unrelated);
  const presentation = prepareP184hApplianceAidReviewPresentation(scene);

  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.contextRenderableCount).toBe(2);
  expect(presentation.islandContextRenderableCount).toBe(1);
  expect(presentation.hiddenNonQuestionRenderableCount).toBe(1);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetSemanticRoles).toEqual([]);
  expect(new Set(presentation.foundTargetSemanticRoles)).toEqual(new Set(p184hApplianceAidRoles));
  expect(presentation.targetBounds).not.toBeNull();

  expect((oven.object.material as any).opacity).toBe(p184hApplianceReviewTargetOpacity);
  expect((cooktop.object.material as any).opacity).toBe(p184hApplianceReviewTargetOpacity);
  expect((island.material as any).opacity).toBe(p184hApplianceReviewContextOpacity);
  expect((d2fContext.material as any).opacity).toBe(p184hApplianceReviewContextOpacity);
  expect(unrelated.visible).toBe(false);
  expect(oven.object.userData.p184hApplianceReviewRole).toBe('P184H_APPLIANCE_TARGET_80');
  expect(island.userData.p184hApplianceReviewRole).toBe('D_2F_KITCHEN_CONTEXT_20');
});

test('P184H appliance presentation reports no-promotion semantic violations', () => {
  const scene = new THREE.Group();
  const oven = makeP184hAid('oven');
  const cooktop = makeP184hAid('cooktop');
  oven.object.userData.exactXYClaim = true;
  scene.add(oven.object, cooktop.object);

  const presentation = prepareP184hApplianceAidReviewPresentation(scene);
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.semanticViolationCount).toBe(1);
});

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
  expect(p184hApplianceOnP185cReviewId).toBe('p184h-appliance-aids-on-p185c-review');
  expect(viewerSource).toContain('prepareP184hApplianceAidReviewPresentation');
  expect(viewerSource).toContain('isP184hApplianceOnP185cReviewRequested');
  expect(viewerSource).toContain('applyP184hApplianceOnP185cReviewState');
  expect(viewerSource).toContain("p184hReviewQuestion: 'D_2F_KITCHEN_ISLAND_APPLIANCE_AID_RELATION'");
  expect(viewerSource).toContain("p184hHumanReview: 'NOT_RUN'");
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

  const p185StateStart = viewerSource.indexOf('const applyP185cReviewState');
  const p185StateEnd = viewerSource.indexOf(
    'const applyP181bR1ReviewState',
    p185StateStart,
  );
  expect(p185StateStart).toBeGreaterThanOrEqual(0);
  expect(p185StateEnd).toBeGreaterThan(p185StateStart);
  const p185StateSource = viewerSource.slice(p185StateStart, p185StateEnd);
  expect(p185StateSource).toContain("applyStandardViewPreset('d-1f')");
  expect(p185StateSource).toContain('setModelScene(fullModelScene)');
  expect(p185StateSource).toContain('deactivateDCoordinateReview()');
  expect(p185StateSource).toContain('setD1KnownDoorReviewLabelsVisible(false)');
  expect(p185StateSource).toContain('for (const doorMarker of dReviewDoorMarkerLines)');
  expect(p185StateSource.indexOf("applyStandardViewPreset('d-1f')")).toBeLessThan(
    p185StateSource.indexOf('prepareP185ReviewPresentation(fullModelScene)'),
  );
});


test('P184H appliance review applies the D apartment preset before presentation and restores fullModelScene', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );
  const stateStart = viewerSource.indexOf('const applyP184hApplianceOnP185cReviewState');
  const stateEnd = viewerSource.indexOf('const applyP185cReviewState', stateStart);
  expect(stateStart).toBeGreaterThanOrEqual(0);
  expect(stateEnd).toBeGreaterThan(stateStart);
  const stateSource = viewerSource.slice(stateStart, stateEnd);
  expect(stateSource).toContain("applyStandardViewPreset('d-apartment')");
  expect(stateSource).toContain('setModelScene(fullModelScene)');
  expect(stateSource).toContain('prepareP184hApplianceAidReviewPresentation(fullModelScene)');
  expect(stateSource.indexOf("applyStandardViewPreset('d-apartment')")).toBeLessThan(
    stateSource.indexOf('setModelScene(fullModelScene)'),
  );
  expect(stateSource.indexOf('setModelScene(fullModelScene)')).toBeLessThan(
    stateSource.indexOf('prepareP184hApplianceAidReviewPresentation(fullModelScene)'),
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

test('P185C orientation-invalid position review alias does not autoload the persisted overlay', async ({ page }) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidatePath = '/private-model/work-test/p185c-d2015-electrical-source-overlay.glb';
  let candidateRequested = false;

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
            id: p185cCandidateId,
            label: 'P185C D2015 electrical source overlay - WORK_TEST',
            path: candidatePath,
          },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    candidateRequested = true;
    await route.abort();
  });

  await page.goto(`/private-model/?review=${p185cReviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).not.toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).not.toHaveAttribute('data-work-test-review-mode', p185cReviewId);
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  expect(candidateRequested).toBe(false);
});

test('P184H appliance review autoloads the P185C survivor and renders the bounded 80/20 question state', async ({ page }) => {
  test.setTimeout(20_000);

  const currentModel = makeGlbWithSharedTriangle([]);
  const candidateId = p185cCandidateId;
  const candidatePath = '/private-model/work-test/p185c-d2015-electrical-source-overlay.glb';
  const candidateModel = makeGlbWithSharedTriangle([
    {
      name: 'P184H_OVEN_PLACEMENT_AID_PRESENTATION_ONLY',
      mesh: 0,
      translation: [0, 0, 0],
      extras: {
        Pass: 'P184H',
        ModelStage: 'WORK_TEST_PRESENTATION',
        Canonical: false,
        representationKind: 'appliancePlacementPresentationAid',
        hostG2Id: 'G2_FURN_D_2F_KITCHEN_ISLAND_001',
        hostStorey: 'D_2F',
        presentationLayer: 'D_ARCH_FURNITURE_AIDS',
        sourcePlanDriveId: '1G04Dye0etHSTAMgqabstPOfrEFnuFjWl',
        presentationAidId: 'P184H_APPLIANCE_AID_OVEN_001',
        semanticRole: 'oven',
        applianceGeometryClaim: false,
        physicalApplianceFootprintClaim: false,
        exactXYClaim: false,
        exactZClaim: false,
        current: false,
        asBuilt: false,
        publishToCURRENT: false,
        HUMAN_REVIEW: 'NOT_RUN',
      },
    },
    {
      name: 'P184H_COOKTOP_PLACEMENT_AID_PRESENTATION_ONLY',
      mesh: 0,
      translation: [1.0, 0, 0],
      extras: {
        Pass: 'P184H',
        ModelStage: 'WORK_TEST_PRESENTATION',
        Canonical: false,
        representationKind: 'appliancePlacementPresentationAid',
        hostG2Id: 'G2_FURN_D_2F_KITCHEN_ISLAND_001',
        hostStorey: 'D_2F',
        presentationLayer: 'D_ARCH_FURNITURE_AIDS',
        sourcePlanDriveId: '1G04Dye0etHSTAMgqabstPOfrEFnuFjWl',
        presentationAidId: 'P184H_APPLIANCE_AID_COOKTOP_001',
        semanticRole: 'cooktop',
        applianceGeometryClaim: false,
        physicalApplianceFootprintClaim: false,
        exactXYClaim: false,
        exactZClaim: false,
        current: false,
        asBuilt: false,
        publishToCURRENT: false,
        HUMAN_REVIEW: 'NOT_RUN',
      },
    },
    {
      name: 'P184G_G2_FURN_D_2F_KITCHEN_ISLAND_001_AXIS_SELFCONSISTENT_WORKTEST',
      mesh: 0,
      translation: [0.5, 0, 0.5],
      extras: {
        Pass: 'P184G',
        G2Id: 'G2_FURN_D_2F_KITCHEN_ISLAND_001',
        representationKind: 'fixedFurnitureWorkSolid',
        hostStorey: 'D_2F',
        presentationLayer: 'D_ARCH_FURNITURE',
      },
    },
    {
      name: 'G2_WALL_D_2F_001',
      mesh: 0,
      translation: [2, 0, 2],
      extras: {
        G2Id: 'G2_WALL_D_2F_001',
        presentationLayer: 'CURRENT_D',
      },
    },
    {
      name: 'G2_WALL_D_1F_001',
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

  await page.goto(`/private-model/?review=${p184hApplianceOnP185cReviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', p184hApplianceOnP185cReviewId);
  await expect(canvas).toHaveAttribute(
    'data-p184h-review-question',
    'D_2F_KITCHEN_ISLAND_APPLIANCE_AID_RELATION',
  );
  await expect(canvas).toHaveAttribute('data-p184h-target-opacity', '0.80');
  await expect(canvas).toHaveAttribute('data-p184h-context-opacity', '0.20');
  await expect(canvas).toHaveAttribute('data-p184h-review-target-renderable-count', '2');
  await expect(canvas).toHaveAttribute('data-p184h-review-context-renderable-count', '2');
  await expect(canvas).toHaveAttribute('data-p184h-review-island-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p184h-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-p184h-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(page.locator('#viewer-status')).toContainText(
    'oven + cooktop 80 % / island + D 2F context 20 %',
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

