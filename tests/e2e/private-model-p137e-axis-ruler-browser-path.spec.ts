import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

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
  const measureButton = page.locator('#axis-measure-tool-button');
  await expect(measureButton).toBeDisabled();
  await page.locator('#preset-menu summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await expect(measureButton).toBeEnabled();
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
  // Canvas interactions may close the preset <details>; open it as a user would.
  const wholeBuildingButton = page.locator('#whole-building-preset-button');
  if (!(await wholeBuildingButton.isVisible())) {
    await page.locator('#preset-menu summary').click();
  }
  await expect(wholeBuildingButton).toBeVisible();
  await wholeBuildingButton.click();
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'navigate');
  await expect(measureButton).toBeDisabled();
  await expect(measureButton).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).not.toHaveAttribute('data-axis-measure-mm', /\d/);
});


test('actual D1F browser ruler measures along Y and never invents a diagonal', async ({ page }) => {
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
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await page.locator('#preset-menu summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await page.locator('#axis-measure-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'measure');

  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const point = (u: number, v: number) => ({
    x: bounds!.x + bounds!.width * u,
    y: bounds!.y + bounds!.height * v,
  });

  const first = point(0.48, 0.43);
  const second = point(0.48, 0.52);
  await page.mouse.click(first.x, first.y);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'FIRST');
  await page.mouse.click(second.x, second.y);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'DYNAMIC');
  await expect(canvas).toHaveAttribute('data-axis-measure-axis', 'Y');
  const initialMm = Number(await canvas.getAttribute('data-axis-measure-mm'));
  expect(initialMm).toBeGreaterThan(0);

  // A small horizontal pointer offset must not become a diagonal length.
  const pointer = point(0.49, 0.60);
  await page.mouse.move(pointer.x, pointer.y, { steps: 6 });
  await expect(canvas).toHaveAttribute('data-axis-measure-axis', 'Y');
  const movedMm = Number(await canvas.getAttribute('data-axis-measure-mm'));
  expect(movedMm).toBeGreaterThan(initialMm);
  await expect(page.locator('#axis-measure-output')).toContainText('Y');

  await page.mouse.click(pointer.x, pointer.y);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'LOCKED');
  const lockedMm = await canvas.getAttribute('data-axis-measure-mm');
  const outside = point(0.62, 0.39);
  await page.mouse.move(outside.x, outside.y, { steps: 5 });
  await expect(canvas).toHaveAttribute('data-axis-measure-axis', 'Y');
  await expect(canvas).toHaveAttribute('data-axis-measure-mm', lockedMm!);
  await page.mouse.click(outside.x, outside.y);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).not.toHaveAttribute('data-axis-measure-mm', /\d/);
});


test('focused scene67 keeps temporary D1F ruler without physical placement promotion', () => {
  // Source contract only. The existing synthetic viewer test covers the
  // four-click ruler event path; real scene67 production pixels remain gated.
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const begin = source.indexOf('const applyP137EScene67ReviewState = () => {');
  const end = source.indexOf('const applyP186fReviewState =', begin);
  expect(begin).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(begin);
  const focused = source.slice(begin, end);
  expect(focused).toContain('fullModelScene.children.length !== 4');
  expect(focused).toContain("activateDCoordinateReview('1F')");
  expect(focused).toContain('dCoordinateGridGroup.visible = false');
  expect(focused).not.toContain('deactivateDCoordinateReview()');
  expect(focused).toContain("p137eOriginalSourceWallNode: '798'");
  expect(focused).toContain("p137eOriginalSourceWallMesh: '406'");
  expect(focused).toContain("p137eWallMountedThemoCount: '3'");
  expect(focused).toContain("p137eExactXYClaim: 'false'");
  expect(focused).toContain("p137eCurrentClaim: 'false'");
  expect(focused).toContain("p137eHumanReview: 'NOT_RUN'");
});
