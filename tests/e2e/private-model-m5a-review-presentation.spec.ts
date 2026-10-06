import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  m5aExpectedTargetRenderableCount,
  m5aReviewContextOpacity,
  m5aReviewQuestionText,
  m5aReviewSourceContext,
  m5aReviewTargetOpacity,
} from '../../src/scripts/privateModelM5AReviewPresentation';

const candidateId = 'm5a-drain-topology';
const reviewId = `${candidateId}-review`;
const candidatePath = '/private-model/work-test/m5a-drain-topology.glb';

const makeGlb = (nodes: Record<string, unknown>[], highlightedTargetIndex = -1) => {
  const positions = Buffer.alloc(36);
  [0, 0, 0, 1.2, 0, 0, 0, 0, 1.2].forEach((value, index) =>
    positions.writeFloatLE(value, index * 4),
  );
  const materialCount = Math.max(nodes.length, 1);
  const materials = Array.from({ length: materialCount }, (_, index) => ({
    pbrMetallicRoughness: {
      baseColorFactor:
        index === highlightedTargetIndex ? [0.95, 0.08, 0.08, 1] : [0.12, 0.58, 0.92, 1],
      metallicFactor: 0,
      roughnessFactor: 1,
    },
    alphaMode: 'BLEND',
    doubleSided: true,
  }));
  const meshes = materials.map((_, index) => ({
    primitives: [{ attributes: { POSITION: 0 }, material: index }],
  }));
  const jsonNodes = nodes.map((node, index) => ({ ...node, mesh: index }));

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'M5A DRAIN REVIEW TEST', nodes: nodes.map((_, index) => index) }],
    nodes: jsonNodes,
    meshes,
    materials,
    accessors: [{
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [1.2, 0, 1.2],
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

const makeTarget = (
  representationKind: 'wellMarkerWork' | 'referenceRouteWork' | 'unresolvedBoundaryMarker',
  index: number,
) => ({
  name: `M5A_${representationKind}_${index}`,
  mesh: 0,
  translation: [(index % 5) * 2.2, 0, Math.floor(index / 5) * 2.2],
  extras: {
    Pass: 'M5A',
    Canonical: false,
    representationKind,
    presentationOnly: true,
    workAssumption: true,
    sourceDerivedTopology: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalElevationClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
    ...(representationKind === 'wellMarkerWork'
      ? { physicalWellGeometryClaim: false }
      : { physicalRouteClaim: false }),
    ...(representationKind === 'unresolvedBoundaryMarker'
      ? { boundaryStatus: 'UNRESOLVED_BOUNDARY' }
      : {}),
  },
});

test('M5A review wiring is scoped to conventional review id and no-promotion presentation', () => {
  const viewerSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );
  expect(viewerSource).toContain('prepareM5AReviewPresentation');
  expect(viewerSource).toContain(candidateId);
  expect(viewerSource).toContain(
    "m5aReviewQuestion: 'DRAINAGE_TOPOLOGY_VISUAL_PLACEMENT_AND_CONNECTIVITY'",
  );
  expect(viewerSource).toContain("applyStandardViewPreset('whole-building')");
  expect(viewerSource).toContain("m5aExactXYClaim: 'false'");
  expect(viewerSource).toContain("m5aExactZClaim: 'false'");
  expect(viewerSource).toContain("m5aHumanReview: 'NOT_RUN'");
  expect(viewerSource).toContain('m5a-source-context');
  expect(viewerSource).toContain('m5aReviewQuestionText');
  expect(viewerSource).toContain('m5aReviewSourceContext');
});

test('M5A conventional review autoload renders the exact 4+7+4 topology at 80/20', async ({ page }) => {
  test.setTimeout(20_000);

  const targets = [
    ...Array.from({ length: 4 }, (_, i) => makeTarget('wellMarkerWork', i)),
    ...Array.from({ length: 7 }, (_, i) => makeTarget('referenceRouteWork', i + 4)),
    ...Array.from({ length: 4 }, (_, i) => makeTarget('unresolvedBoundaryMarker', i + 11)),
  ];
  const candidateModel = makeGlb([
    ...targets,
    {
      name: 'BUILDING_SITE_CONTEXT',
      mesh: 0,
      translation: [4, 0, 3],
      extras: { G2Id: 'G2_BUILDING_CONTEXT_001' },
    },
  ]);
  const currentModel = makeGlb([]);

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: 'M5A drainage topology - WORK_TEST', path: candidatePath }],
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
  let releaseSourcePreview: (() => void) | undefined;
  const sourcePreviewGate = new Promise<void>((resolve) => {
    releaseSourcePreview = resolve;
  });
  await page.route('**/m5a-drainman.pdf', async (route) => {
    await sourcePreviewGate;
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><html><body><main>Drainman source reference visible</main></body></html>',
    });
  });

  await page.goto(`/private-model/?review=${reviewId}`, { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-m5a-source-preview-load-state', 'requesting');
  await expect(canvas).toHaveAttribute('data-m5a-source-context-ready', 'false');
  releaseSourcePreview?.();
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute(
    'data-m5a-review-question',
    'DRAINAGE_TOPOLOGY_VISUAL_PLACEMENT_AND_CONNECTIVITY',
  );
  await expect(canvas).toHaveAttribute('data-m5a-target-opacity', m5aReviewTargetOpacity.toFixed(2));
  await expect(canvas).toHaveAttribute('data-m5a-context-opacity', m5aReviewContextOpacity.toFixed(2));
  await expect(canvas).toHaveAttribute(
    'data-m5a-review-target-renderable-count',
    String(m5aExpectedTargetRenderableCount),
  );
  await expect(canvas).toHaveAttribute('data-m5a-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-m5a-review-well-marker-count', '4');
  await expect(canvas).toHaveAttribute('data-m5a-review-route-count', '7');
  await expect(canvas).toHaveAttribute('data-m5a-review-unresolved-boundary-count', '4');
  await expect(canvas).toHaveAttribute('data-m5a-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-m5a-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-m5a-review-camera-focus-applied', 'true');
  await expect(canvas).toHaveAttribute('data-m5a-review-framing-corner-count', '8');
  await expect(canvas).toHaveAttribute('data-m5a-review-framing-margin', '0.94');
  await expect(canvas).toHaveAttribute('data-m5a-review-framing-in-frame', 'true');
  const reviewFocusRadius = Number(await canvas.getAttribute('data-m5a-review-focus-radius'));
  expect(Number.isFinite(reviewFocusRadius)).toBe(true);
  expect(reviewFocusRadius).toBeGreaterThan(0);
  const framingMaxAbsNdc = Number(await canvas.getAttribute('data-m5a-review-framing-max-abs-ndc'));
  expect(Number.isFinite(framingMaxAbsNdc)).toBe(true);
  expect(framingMaxAbsNdc).toBeLessThanOrEqual(0.94);
  await expect(canvas).toHaveAttribute('data-m5a-source-context-ready', 'true');
  await expect(canvas).toHaveAttribute('data-m5a-source-preview-load-state', 'loaded');
  await expect(canvas).toHaveAttribute(
    'data-m5a-source-drawing-drive-id',
    m5aReviewSourceContext.sourceDrawingDriveId,
  );
  await expect(canvas).toHaveAttribute(
    'data-m5a-source-drawing-byte-size',
    String(m5aReviewSourceContext.sourceDrawingByteSize),
  );
  await expect(canvas).toHaveAttribute('data-m5a-review-question-text', m5aReviewQuestionText);
  await expect(canvas).toHaveAttribute(
    'data-m5a-source-context-class',
    m5aReviewSourceContext.sourceClass,
  );
  await expect(canvas).toHaveAttribute('data-m5a-source-named-well-count', '4');
  await expect(canvas).toHaveAttribute('data-m5a-source-supported-link-count', '7');

  const sourceContext = page.locator('#m5a-source-context');
  await expect(sourceContext).toBeVisible();
  await expect(sourceContext).toContainText(m5aReviewSourceContext.sourceLabel);
  await expect(sourceContext).toContainText('SOK1, SOK2, SOK3, PVK');
  await expect(sourceContext).toContainText('7 yhteyttä');
  await expect(sourceContext).toContainText(m5aReviewSourceContext.drawingLowerMapping);
  await expect(sourceContext).toContainText(m5aReviewSourceContext.drawingUpperMapping);
  await expect(sourceContext).toContainText('WORK_ASSUMPTION');
  await expect(sourceContext).toContainText(m5aReviewQuestionText);
  await expect(sourceContext).toContainText('ei exact XY/Z');
  await expect(page.locator('#m5a-source-preview')).toHaveAttribute(
    'src',
    m5aReviewSourceContext.sourcePreviewUrl,
  );
  await expect(page.frameLocator('#m5a-source-preview').locator('body')).toContainText(
    'Drainman source reference visible',
  );
  await expect(page.locator('#viewer-status')).toContainText(
    '4 kaivoa + 7 lähteistettyä yhteyttä',
  );
  await expect(page.locator('#viewer-status')).toContainText('lähdekonteksti mukana');

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

test('M5A review rasterizes every one of the 15 drainage targets individually', async ({ browser }) => {
  test.setTimeout(90_000);

  const targets = [
    ...Array.from({ length: 4 }, (_, i) => makeTarget('wellMarkerWork', i)),
    ...Array.from({ length: 7 }, (_, i) => makeTarget('referenceRouteWork', i + 4)),
    ...Array.from({ length: 4 }, (_, i) => makeTarget('unresolvedBoundaryMarker', i + 11)),
  ];
  const candidateNodes = [
    ...targets,
    {
      name: 'BUILDING_SITE_CONTEXT',
      mesh: 0,
      translation: [4, 0, 3],
      extras: { G2Id: 'G2_BUILDING_CONTEXT_001' },
    },
  ];
  const currentModel = makeGlb([]);

  const renderReview = async (highlightedTargetIndex: number) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route('**/private-model/model.glb', async (route) => {
      await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
    });
    await page.route('**/private-model/work-test/catalog.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            id: candidateId,
            label: 'M5A drainage topology - WORK_TEST',
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
        body: makeGlb(candidateNodes, highlightedTargetIndex),
      });
    });
    await page.route('**/m5a-drainman.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body><main>Drainman source reference visible</main></body></html>',
      });
    });

    await page.goto(`/private-model/?review=${reviewId}`, { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
    await expect(canvas).toHaveAttribute(
      'data-m5a-review-target-renderable-count',
      String(m5aExpectedTargetRenderableCount),
    );
    await expect(canvas).toHaveAttribute('data-m5a-review-semantic-violation-count', '0');
    await expect(canvas).toHaveAttribute('data-m5a-review-framing-in-frame', 'true');
    await expect(canvas).toHaveAttribute('data-m5a-source-preview-load-state', 'loaded');
    await page.waitForTimeout(120);

    const screenshot = await canvas.screenshot();
    await context.close();
    return screenshot;
  };

  const countChangedPixels = async (baseline: Buffer, highlighted: Buffer) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baselineUrl = `data:image/png;base64,${baseline.toString('base64')}`;
    const highlightedUrl = `data:image/png;base64,${highlighted.toString('base64')}`;
    const changed = await page.evaluate(async ({ baselineUrl, highlightedUrl }) => {
      const load = async (url: string) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const probe = document.createElement('canvas');
        probe.width = image.width;
        probe.height = image.height;
        const context2d = probe.getContext('2d');
        if (!context2d) throw new Error('2d context unavailable');
        context2d.drawImage(image, 0, 0);
        return {
          width: image.width,
          height: image.height,
          pixels: context2d.getImageData(0, 0, image.width, image.height).data,
        };
      };

      const base = await load(baselineUrl);
      const probe = await load(highlightedUrl);
      if (base.width !== probe.width || base.height !== probe.height) return -1;

      let count = 0;
      for (let y = 0; y < base.height; y += 2) {
        for (let x = 0; x < base.width; x += 2) {
          const index = (y * base.width + x) * 4;
          const delta =
            Math.abs((base.pixels[index] ?? 0) - (probe.pixels[index] ?? 0)) +
            Math.abs((base.pixels[index + 1] ?? 0) - (probe.pixels[index + 1] ?? 0)) +
            Math.abs((base.pixels[index + 2] ?? 0) - (probe.pixels[index + 2] ?? 0));
          if (delta > 120) count += 1;
        }
      }
      return count;
    }, { baselineUrl, highlightedUrl });
    await context.close();
    return changed;
  };

  const baseline = await renderReview(-1);
  const targetPixelEvidence: number[] = [];

  for (let targetIndex = 0; targetIndex < m5aExpectedTargetRenderableCount; targetIndex += 1) {
    const highlighted = await renderReview(targetIndex);
    const changedPixels = await countChangedPixels(baseline, highlighted);
    targetPixelEvidence.push(changedPixels);
    expect(
      changedPixels,
      `M5A target ${targetIndex + 1}/${m5aExpectedTargetRenderableCount} must contribute raster pixels`,
    ).toBeGreaterThan(8);
  }

  expect(targetPixelEvidence).toHaveLength(15);
  expect(targetPixelEvidence.every((count) => count > 8)).toBe(true);
});
