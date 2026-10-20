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
