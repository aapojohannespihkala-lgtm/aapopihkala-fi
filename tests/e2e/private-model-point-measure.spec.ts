import { expect, test } from '@playwright/test';

import { formatPointMeasureFi, measureBetweenPoints } from '../../src/scripts/privateModelPointMeasure';

test('free 3D measure computes distance, horizontal span and signed deltas in YLIS metres', () => {
  const result = measureBetweenPoints(
    { xM: 1, yM: 2, sourceHeightYUpM: 0.5 },
    { xM: 4, yM: 6, sourceHeightYUpM: 0.2 },
  );
  expect(result.horizontalM).toBeCloseTo(5, 9);
  expect(result.distanceM).toBeCloseTo(Math.hypot(5, 0.3), 9);
  expect(formatPointMeasureFi(result)).toEqual({
    main: '5,009 m',
    detail: 'vaaka 5,000 m · ΔZ −0,300 m · ΔX +3,000 · ΔY +4,000',
  });
  expect(formatPointMeasureFi(measureBetweenPoints(
    { xM: 1, yM: 1, sourceHeightYUpM: 1 },
    { xM: 1, yM: 1, sourceHeightYUpM: 1 },
  )).main).toBe('0,000 m');
});

const makeTriangleGlb = () => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => positions.writeFloatLE(value, index * 4));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'D_1F_TEST_GROUP', mesh: 0 }],
    meshes: [{ name: 'TEST_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] },
    ],
  };
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc((4 - (jsonBuffer.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + positions.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(positions.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, positions]);
};

test('private viewer free 3D measure picks two visible model points and resets', async ({ page }) => {
  const model = makeTriangleGlb();
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const tool = page.locator('#point-measure-tool-button');
  const panel = page.locator('#point-measure-panel');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await tool.click();
  await expect(tool).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-measure');
  await expect(panel).toBeVisible();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + 8 } });
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  const distance = Number(await canvas.getAttribute('data-point-measure-distance'));
  expect(Number.isFinite(distance)).toBe(true);
  expect(distance).toBeGreaterThanOrEqual(0);
  await expect(page.locator('#point-measure-main')).toHaveText(/^\d+,\d{3} m$/);

  // A miss never invents a point and keeps the finished measurement.
  await canvas.click({ position: { x: box.width - 6, y: box.height / 2 } });
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  await expect(page.locator('#point-measure-main')).toHaveText('Ei osumaa näkyvään mallipintaan. Klikkaa mallia.');

  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'empty');

  await tool.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'navigate');
  await expect(panel).toBeHidden();
});

test('point in model shows XYZ and a persistent screenshot marker without changing 3D measurement', async ({ page, context }) => {
  const model = makeTriangleGlb();
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status').first()).toHaveText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  const tool = page.locator('#point-pick-tool-button');
  const panel = page.locator('#point-pick-panel');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await expect(tool).toBeEnabled();
  await tool.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-pick');
  await expect(panel).toBeVisible();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  await expect(page.locator('#point-pick-main')).toHaveText(/^X .+ m · Y .+ m · Z .+ m$/);
  await expect(page.locator('#point-pick-source')).toContainText('YLIS-G1-LOCAL');
  await expect(page.locator('#point-pick-surface')).toContainText('Osumapinta: D_1F_TEST_GROUP');
  await expect(page.locator('#point-pick-surface')).toContainText('Nx ');
  await expect(page.locator('#point-pick-copy')).toBeEnabled();

  // A click on empty background must not overwrite the last valid placement.
  const before = await page.locator('#point-pick-main').textContent();
  await canvas.click({ position: { x: box.width - 6, y: box.height / 2 } });
  await expect(page.locator('#point-pick-main')).toHaveText(before ?? '');
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#point-pick-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('YLIS-G1-LOCAL');
  expect(copied).toMatch(/X=.+ Y=.+ Z=.+/);
  expect(copied).toContain('GLB_SHA256:');
  expect(copied).toContain('Osumamesh (nimi mallista): D_1F_TEST_GROUP');
  expect(copied).toMatch(/Katselupuolen pintanormaali YLIS-G1-LOCAL: Nx=/);

  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
  await tool.click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#point-measure-tool-button')).toHaveText('Mittaa 3D');
});

/** Screenshot pixel proof: real WebGL marker, not just the DOM picked state.
 * Synthetic geometry cannot establish production-source or as-built accuracy.
 */
test('point in model screenshot pixel proof: real WebGL pin and readable XYZ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const model = makeTriangleGlb();
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status').first()).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  await page.locator('#point-pick-tool-button').click();
  await expect(page.locator('#point-pick-panel')).toBeVisible();
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  const cx = Math.round(bounds.x + bounds.width / 2);
  const cy = Math.round(bounds.y + bounds.height / 2);
  const before = await page.screenshot({ animations: 'disabled', scale: 'css' });
  await canvas.click({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  await expect(page.locator('#point-pick-main')).toHaveText(/^X .+ m · Y .+ m · Z .+ m$/);
  // Allow Three.js to render the overlay before reading actual screenshot pixels.
  await page.evaluate(() => new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const after = await page.screenshot({ animations: 'disabled', scale: 'css' });

  const pixels = await page.evaluate(async ({ before64, after64, cx, cy }) => {
    const countPin = async (source: string) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + source;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D screenshot decoder unavailable');
      ctx.drawImage(img, 0, 0);
      const x = Math.max(0, cx - 12);
      const y = Math.max(0, cy - 12);
      const w = Math.min(25, canvas.width - x);
      const h = Math.min(25, canvas.height - y);
      const data = ctx.getImageData(x, y, w, h).data;
      let yellow = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 220 && data[i + 1] > 140 &&
            data[i + 1] < 238 && data[i + 2] < 150 && data[i + 3] > 200) yellow++;
      }
      return yellow;
    };
    return { before: await countPin(before64), after: await countPin(after64) };
  }, {
    before64: before.toString('base64'),
    after64: after.toString('base64'),
    cx, cy,
  });
  // The screenshot, not a canvas dataset flag, must contain the marker.
  expect(pixels.after).toBeGreaterThanOrEqual(3);
  expect(pixels.after).toBeGreaterThan(pixels.before);
  await test.info().attach('point-pick-synthetic-webgl-screenshot.png',
    { body: after, contentType: 'image/png' });
});
