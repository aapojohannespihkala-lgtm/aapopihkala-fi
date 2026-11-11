import { expect, test } from '@playwright/test';

// Real viewer-page event-path regression using a tiny synthetic GLB.
// This does not authenticate the original Ylisrinne GLB, measured geometry,
// production deployment or HUMAN_REVIEW. It never persists screenshot point coordinates.
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

test('D1F browser point marker exposes model-surface XYZ for screenshots', async ({ page }) => {
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [] }) }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await page.locator('#preset-menu > summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  const tool = page.locator('#point-pick-tool-button');
  await expect(tool).toBeEnabled();
  await tool.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-pick');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.click(box.x + box.width * 0.47, box.y + box.height * 0.45);
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  await expect(page.locator('#point-pick-main')).toHaveText(/^X .+ m · Y .+ m · Z .+ m$/);
  await expect(page.locator('#point-pick-main')).toContainText('Z 0,080 m');
  await expect(page.locator('#point-pick-source')).toContainText('YLIS-G1-LOCAL');
  await expect(page.locator('#point-pick-copy')).toBeEnabled();
  const first = await page.locator('#point-pick-main').textContent();

  await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.45);
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  const second = await page.locator('#point-pick-main').textContent();
  expect(second).not.toEqual(first);
  await page.locator('#point-pick-clear').click();
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
  await expect(page.locator('#point-pick-copy')).toBeDisabled();
});

test('point picker is available outside D plan and clears the marker on tool change', async ({ page }) => {
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  const tool = page.locator('#point-pick-tool-button');
  await expect(tool).toBeEnabled();
  await tool.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-pick');
  await expect(page.locator('#point-pick-panel')).toBeVisible();
  await page.locator('#navigate-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'navigate');
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
  await expect(page.locator('#point-pick-panel')).toBeHidden();
  await expect(page.locator('#point-measure-tool-button')).toHaveText('Mittaa 3D');
});

test('D1F P137E target-specific crosshairs coexist with screenshot point tool and never claim G2 persistence', async ({ page }) => {
  const candidateId = 'p137e-d1f-three-wall-mounted-themos';
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [{
        id: candidateId,
        label: 'P137E synthetic test fixture',
        path: '/private-model/work-test/' + candidateId + '.glb',
      }] }),
    }));
  await page.route('**/private-model/work-test/*.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  const place = page.locator('#p137e-place-tool-button');
  const pointTool = page.locator('#point-pick-tool-button');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(place).toBeDisabled();
  await expect(page.locator('#work-test-select')).toBeEnabled();
  await page.locator('#model-menu summary').click();
  await page.locator('#work-test-select').selectOption(candidateId);
  await page.locator('#work-test-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await page.locator('#preset-menu > summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(canvas).toHaveAttribute('data-content-floor', '1F');
  await expect(place).toBeEnabled();
  await place.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'place');
  await expect(page.locator('#p137e-place-panel')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '0');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const click = async (u: number, v: number) =>
    page.mouse.click(box!.x + box!.width * u, box!.y + box!.height * v);
  await page.locator('#p137e-place-target').selectOption('D_THEMO_CURRENT_BATHROOM_01');
  await click(0.47, 0.45);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '1');
  await expect(page.locator('#p137e-place-list')).toContainText('Kylpyhuone: X ');
  await expect(page.locator('#p137e-place-status')).toContainText('ei tallennettu G2:een');
  await page.locator('#p137e-place-target').selectOption('D_THEMO_CURRENT_BEDROOM_01');
  await click(0.51, 0.47);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '2');
  await expect(page.locator('#p137e-place-list')).toContainText('Makuuhuone: X ');
  await page.locator('#p137e-place-target').selectOption('D_THEMO_CURRENT_LOBBY_01');
  await click(0.54, 0.47);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await expect(page.locator('#p137e-place-list')).toContainText('Aula: X ');
  await pointTool.click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-pick');
  await expect(page.locator('#p137e-place-panel')).toBeHidden();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await click(0.48, 0.45);
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'picked');
  await expect(page.locator('#point-pick-main')).toContainText('Z ');
  await place.click();
  await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await page.locator('#p137e-place-clear').click();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '0');
  await expect(page.locator('#p137e-place-list')).toContainText('Kylpyhuone: ei rastia');
  await page.locator('#preset-menu > summary').click();
  await page.locator('#d2-plan-button').click();
  await expect(place).toBeDisabled();
  await expect(page.locator('#p137e-place-panel')).toBeHidden();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '0');
});


test('P137E placement never trusts the selected option instead of the loaded candidate', async ({ page }) => {
  const selectedId = 'p137e-d1f-three-wall-mounted-themos';
  const otherId = 'p136b-d-current-wall-corrected';
  const glb = buildSyntheticD1FCurrentGlb();
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [selectedId, otherId].map((id) => ({
        id, label: id, path: '/private-model/work-test/' + id + '.glb',
      })) }),
    }));
  await page.route('**/private-model/work-test/*.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  const place = page.locator('#p137e-place-tool-button');
  const option = page.locator('#work-test-select');
  await expect(option).toBeEnabled();
  const choose = async (id: string) => {
    if (!(await option.isVisible())) await page.locator('#model-menu summary').click();
    await option.selectOption(id);
  };
  await choose(otherId);
  await page.locator('#work-test-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-loaded-candidate-id', otherId);
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await page.locator('#preset-menu > summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(place).toBeDisabled();
  await choose(selectedId);
  await expect(place).toBeDisabled();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '0');
  await page.locator('#work-test-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-loaded-candidate-id', selectedId);
  await page.locator('#preset-menu > summary').click();
  await page.locator('#d1-plan-button').click();
  await expect(place).toBeEnabled();
  await choose(otherId);
  await expect(place).toBeEnabled();
  await page.locator('#current-model-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).not.toHaveAttribute('data-p137e-loaded-candidate-id');
  await expect(place).toBeDisabled();
});
