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

const makeMeasureGlb = (vertices: number[], doubleSided = false) => {
  const positions = Buffer.alloc(vertices.length * 4);
  vertices.forEach((value, index) => positions.writeFloatLE(value, index * 4));
  const bounds = [0, 1, 2].map(axis => vertices.filter((_value, index) => index % 3 === axis));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'D_1F_TEST_GROUP', mesh: 0 }],
    meshes: [{ name: 'TEST_SURFACE', primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0, componentType: 5126, count: vertices.length / 3, type: 'VEC3',
        min: bounds.map(axis => Math.min(...axis)), max: bounds.map(axis => Math.max(...axis)),
      },
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
const makeTriangleGlb = () => makeMeasureGlb([-1, -1, 0, 1, -1, 0, 0, 1, 0]);

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

  // A miss must invalidate old source XYZ and disable stale clipboard output.
  // PR1993's fail-closed no-hit contract supersedes the older persistence check.
  const before = await page.locator('#point-pick-main').textContent();
  await canvas.click({ position: { x: box.width - 6, y: box.height / 2 } });
  await expect(page.locator('#point-pick-main')).toHaveText('Klikkaa näkyvää mallipintaa.');
  await expect(page.locator('#point-pick-source')).toHaveText('YLIS-G1-LOCAL, koordinaatit metreinä');
  await expect(page.locator('#point-pick-surface')).toHaveText('Osumapinta: ei valittu');
  await expect(page.locator('#point-pick-feedback')).toContainText('Edellinen piste tyhjennetty.');
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
  await expect(page.locator('#point-pick-copy')).toBeDisabled();

  // A new genuine surface hit restores source coordinates and clipboard copy.
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  await expect(page.locator('#point-pick-main')).toHaveText(before ?? '');
  await expect(page.locator('#point-pick-copy')).toBeEnabled();

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

test('3D measurement survives camera changes and clears when a preset remounts the scene', async ({ page }) => {
  const model = makeTriangleGlb();
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const tool = page.locator('#point-measure-tool-button');
  const distance = 'data-point-measure-distance';
  const readout = page.locator('#point-measure-main');
  const detail = page.locator('#point-measure-detail');
  const camera = (id: string) => page.locator(`[data-desk-kind="angle"][data-desk-id="${id}"]`);
  const preset = (id: string) => page.locator(`[data-desk-kind="preset"][data-desk-id="${id}"]`);
  const pick = async (offsetY = 0) => {
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Measurement canvas is not visible');
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + offsetY } });
  };
  const expectClearedMeasurement = async () => {
    await expect(tool).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-measure');
    await expect(canvas).toHaveAttribute('data-point-measure-state', 'empty');
    await expect(canvas).not.toHaveAttribute(distance, /.+/);
    await expect(readout).toHaveText('Klikkaa ensimmäinen piste mallin pinnalta.');
    await expect(detail).toBeEmpty();
  };

  await tool.click();
  await page.locator('#point-measure-snap').uncheck();

  await pick();
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');
  await camera('iso').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');
  await expect(canvas).not.toHaveAttribute(distance, /.+/);

  await preset('d-roof').click();
  await expect(preset('d-roof')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expectClearedMeasurement();

  await pick();
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');
  await pick(12);
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  const savedDistance = await canvas.getAttribute(distance);
  expect(Number(savedDistance)).toBeGreaterThan(0);
  await expect(readout).toHaveText(/^\d+,\d{3} m$/);

  for (const [id, view] of [['orbit', 'orbit'], ['elev-pos-y', 'elevation']]) {
    await camera(id).click();
    await expect(canvas).toHaveAttribute('data-view-preset', view);
    await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
    await expect(canvas).toHaveAttribute(distance, savedDistance ?? '');
  }
  await page.setViewportSize({ width: 1186, height: 822 });
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  await expect(canvas).toHaveAttribute(distance, savedDistance ?? '');

  await preset('d-1f').click();
  await expect(preset('d-1f')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expectClearedMeasurement();
});

test('snap previews and commits the width across a gap with one on/off control', async ({ page }) => {
  // Simulate jamb edges split every 25 mm by the exporter's triangulation.
  const rectangle = (left: number, right: number) => Array.from({ length: 60 }, (_, i) => {
    const bottom = -0.75 + i * 0.025;
    const top = -0.75 + (i + 1) * 0.025;
    return [left, bottom, 0, right, bottom, 0, right, top, 0,
      left, bottom, 0, right, top, 0, left, top, 0];
  }).flat();
  const model = makeMeasureGlb([...rectangle(-1.5, -0.5), ...rectangle(0.5, 1.5)], true);
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  await page.locator('[data-desk-kind="angle"][data-desk-id="elev-pos-y"]').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await page.locator('#point-measure-tool-button').click();
  const snap = page.locator('#point-measure-snap');
  const hint = page.locator('#point-measure-snap-info');
  const readout = page.locator('#point-measure-main');
  await expect(page.locator('#point-measure-panel select')).toHaveCount(0);
  await expect(snap).toBeChecked();
  await snap.uncheck();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Measurement viewport is not visible');
  const center = Math.floor(box.width / 2);
  const y = Math.floor(box.height / 2);
  const click = (x: number, offsetY = 0) => canvas.click({ position: { x, y: y + offsetY } });
  const move = (x: number, offsetY = 0) => page.mouse.move(box.x + x, box.y + y + offsetY);
  const hits = async (x: number) => {
    await click(x);
    return !(await readout.textContent())?.startsWith('Ei osumaa');
  };

  // Locate the rendered inner boundaries using actual ray hits so the
  // offsets remain stable if viewer fit or viewport margins change.
  const boundary = async (inside: number) => {
    expect(await hits(inside)).toBe(true);
    let outside = center;
    while (Math.abs(inside - outside) > 1) {
      const mid = Math.floor((inside + outside) / 2);
      if (await hits(mid)) inside = mid;
      else outside = mid;
    }
    return inside;
  };
  expect(await hits(center)).toBe(false);
  const left = await boundary(Math.floor(center / 2));
  const right = await boundary(Math.floor(center * 1.5));
  const clear = () => page.locator('#point-measure-clear').click();
  await clear();
  await snap.check();

  await move(left + 3);
  await expect(canvas).toHaveAttribute('data-point-measure-preview', 'edge');
  await click(left + 3);
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'edge');
  await move(right + 4, 14);
  await expect(canvas).toHaveAttribute('data-point-measure-preview', 'perpendicular');
  await expect(page.locator('#point-measure-preview-angle')).toBeVisible();
  await click(right + 4, 14);
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'perpendicular');
  await expect(canvas).toHaveAttribute('data-point-measure-distance', '1.000');
  await expect(hint).toContainText('Kohtisuora');

  await click(center);
  await expect(canvas).not.toHaveAttribute('data-point-measure-snap', /.+/);
  await expect(hint).not.toContainText('Kohtisuora');

  await clear();
  await snap.uncheck();
  await move(left - 4);
  await expect(canvas).not.toHaveAttribute('data-point-measure-preview', /.+/);
  await click(left - 4);
  await click(right + 4, 14);
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'complete');
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'free');
  expect(Number(await canvas.getAttribute('data-point-measure-distance'))).toBeGreaterThan(1);
});
/**
 * WORK_TEST synthetic WebGL: sections of a genuine wall edge are joined while
 * small details and their corners are ignored at normal zoom.
 * This exercises the same user-facing canvas snap path, not just the helper.
 */
test('smart snap prioritizes a major visible edge over tiny coplanar detail corners', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const rectangle = (left: number, right: number, bottom: number, top: number) => [
    left, bottom, 0, right, bottom, 0, right, top, 0,
    left, bottom, 0, right, top, 0, left, top, 0,
  ];
  const perimeter = [
    ...Array.from({ length: 120 }, (_, i) => [-1.5 + i * 0.025, -0.75, 0]),
    ...Array.from({ length: 60 }, (_, i) => [1.5, -0.75 + i * 0.025, 0]),
    ...Array.from({ length: 120 }, (_, i) => [1.5 - i * 0.025, 0.75, 0]),
    ...Array.from({ length: 60 }, (_, i) => [-1.5, 0.75 - i * 0.025, 0]),
  ];
  const wall = perimeter.flatMap((vertex, i) => [0, 0, 0, ...vertex, ...perimeter[(i + 1) % perimeter.length]]);
  const model = makeMeasureGlb([
    ...wall,
    ...rectangle(-1.5, -1.46, -0.02, 0.02),
    ...rectangle(-0.02, 0.02, -0.02, 0.02),
  ], true);
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  await page.locator('[data-desk-kind="angle"][data-desk-id="elev-pos-y"]').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await page.locator('#point-measure-tool-button').click();
  const snap = page.locator('#point-measure-snap');
  await expect(snap).toBeChecked();
  await snap.uncheck();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Measurement viewport is not visible');
  const center = Math.floor(box.width / 2);
  const y = Math.floor(box.height / 2);
  const pick = (x: number, atY = y) => canvas.click({ position: { x, y: atY } });
  const move = (x: number, atY = y) => page.mouse.move(box.x + x, box.y + atY);
  const hits = async (x: number, atY = y) => {
    await pick(x, atY);
    return !(await page.locator('#point-measure-main').textContent())?.startsWith('Ei osumaa');
  };
  // Identify the actual wall silhouette by ray hits, not hard-coded pixels.
  expect(await hits(center)).toBe(true);
  expect(await hits(6)).toBe(false);
  let inside = center;
  let outside = 6;
  while (inside - outside > 1) {
    const mid = Math.floor((inside + outside) / 2);
    if (await hits(mid)) inside = mid;
    else outside = mid;
  }
  let bottom = y;
  let below = Math.floor(box.height) - 6;
  expect(await hits(center, below)).toBe(false);
  while (below - bottom > 1) {
    const mid = Math.floor((bottom + below) / 2);
    if (await hits(center, mid)) bottom = mid;
    else below = mid;
  }
  // On this viewport the small 4 cm detail is under the 18px salience limit.
  expect((center - inside) * (0.04 / 1.5)).toBeLessThan(18);
  await page.locator('#point-measure-clear').click();
  await snap.check();

  await move(inside + 2);
  await expect(canvas).toHaveAttribute('data-point-measure-preview', 'edge');
  await pick(inside + 2);
  await expect(canvas).toHaveAttribute('data-point-measure-state', 'first');
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'edge');

  await page.locator('#point-measure-clear').click();
  await move(inside + 2, bottom - 2);
  await expect(canvas).toHaveAttribute('data-point-measure-preview', 'corner');
  await pick(inside + 2, bottom - 2);
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'corner');

  await page.locator('#point-measure-clear').click();
  await move(center);
  await expect(canvas).toHaveAttribute('data-point-measure-preview', 'free');
  await pick(center);
  await expect(canvas).toHaveAttribute('data-point-measure-snap', 'free');

  await snap.uncheck();
  await page.mouse.move(box.x + inside + 3, box.y + y);
  await expect(canvas).not.toHaveAttribute('data-point-measure-preview', /.+/);
});
