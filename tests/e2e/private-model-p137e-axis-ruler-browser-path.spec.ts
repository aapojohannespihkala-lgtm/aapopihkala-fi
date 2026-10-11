import { expect, test } from '@playwright/test';

// Real viewer-page event-path regression using a tiny synthetic GLB.
// This does not authenticate the original Ylisrinne GLB, measured geometry,
// production deployment or HUMAN_REVIEW. It never persists ruler coordinates.
const buildSyntheticD1FCurrentGlb = (): Buffer => {
  // Plan floor spans the project's 0..6.375 X, 0..10.81 local Y
  // envelope (world Z is negative local Y). No source dimensions claimed.
  const positions = [
    0, 0.08, 0, 6.375, 0.08, 0, 6.375, 0.08, -10.81,
    0, 0.08, 0, 6.375, 0.08, -10.81, 0, 0.08, -10.81,
  ];
  const bin = Buffer.alloc(positions.length * 4);
  positions.forEach((value, i) => bin.writeFloatLE(value, i * 4));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{
      name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [0],
    }],
    nodes: [{
      name: 'D1F_SYNTHETIC_RULER_TEST_FLOOR_1F_SRC', mesh: 0,
      extras: { storey: '1F', representationKind: 'syntheticPlanSurface' },
    }],
    meshes: [{
      primitives: [{ attributes: { POSITION: 0 }, material: 0, mode: 4 }],
    }],
    materials: [{
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [0.7, 0.75, 0.8, 1],
        metallicFactor: 0, roughnessFactor: 1,
      },
    }],
    accessors: [{
      bufferView: 0, componentType: 5126, count: 6, type: 'VEC3',
      min: [0, 0.08, -10.81], max: [6.375, 0.08, 0],
    }],
    bufferViews: [{
      buffer: 0, byteOffset: 0, byteLength: bin.length, target: 34962,
    }],
    buffers: [{ byteLength: bin.length }],
  };
  const rawJson = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadded = Buffer.concat([
    rawJson, Buffer.alloc((4 - rawJson.length % 4) % 4, 0x20),
  ]);
  const binPadded = Buffer.concat([
    bin, Buffer.alloc((4 - bin.length % 4) % 4),
  ]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binPadded.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binPadded.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([
    header, jsonHeader, jsonPadded, binHeader, binPadded,
  ]);
};

test('actual viewer D1F ruler: first anchor, live X mm, lock, clear', async ({ page }) => {
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-model-source', /current/i);
  await page.locator('#preset-menu summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await expect(canvas).toHaveAttribute('data-content-floor', '1F');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', /[1-9]/);

  await page.locator('#axis-measure-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'measure');
  await expect(page.locator('#axis-measure-tool-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const p = (u: number, v: number) => ({
    x: box!.x + box!.width * u,
    y: box!.y + box!.height * v,
  });
  const click = async (u: number, v: number) => {
    const { x, y } = p(u, v);
    await page.mouse.click(x, y);
  };
  await click(0.47, 0.45);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'FIRST');
  await expect(canvas).not.toHaveAttribute('data-axis-measure-mm', /\d/);

  await click(0.52, 0.45);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'DYNAMIC');
  await expect(canvas).toHaveAttribute('data-axis-measure-axis', 'X');
  const initialMm = Number(await canvas.getAttribute('data-axis-measure-mm'));
  expect(initialMm).toBeGreaterThan(0);
  const output = page.locator('#axis-measure-output');
  await expect(output).toContainText('mm (mallista)');

  const moved = p(0.58, 0.45);
  await page.mouse.move(moved.x, moved.y, { steps: 5 });
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'DYNAMIC');
  const movedMm = Number(await canvas.getAttribute('data-axis-measure-mm'));
  expect(movedMm).toBeGreaterThan(initialMm);

  await click(0.57, 0.45);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'LOCKED');
  const lockedMm = await canvas.getAttribute('data-axis-measure-mm');
  await expect(output).toContainText('lukittu');
  const hover = p(0.41, 0.6);
  await page.mouse.move(hover.x, hover.y, { steps: 5 });
  await expect(canvas).toHaveAttribute('data-axis-measure-mm', lockedMm!);

  await click(0.49, 0.46);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).not.toHaveAttribute('data-axis-measure-mm', /\d/);
  await expect(page.locator('#axis-measure-label')).toBeHidden();
  await expect(canvas).toHaveAttribute('data-model-source', /current/i);
});

test('actual viewer ruler stays temporary on leaving D plan and changing tools', async ({ page }) => {
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await page.locator('#preset-menu summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await page.locator('#axis-measure-tool-button').click();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * 0.47, box!.y + box!.height * 0.45);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'FIRST');
  await page.locator('#navigate-tool-button').click();
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'navigate');

  await page.locator('#axis-measure-tool-button').click();
  await page.mouse.click(box!.x + box!.width * 0.47, box!.y + box!.height * 0.45);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'FIRST');
  // The preset details menu is still open after the D1F button click.
  await page.locator('#whole-building-preset-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).not.toHaveAttribute('data-axis-measure-mm', /\d/);
});
