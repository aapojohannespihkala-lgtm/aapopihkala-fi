import { expect, test } from '@playwright/test';

/**
 * H-B / #2177: browser regression for D focus with scope-less D structure.
 * This deliberately synthetic GLB is not Ylisrinne geometry or an as-built QA.
 */
function syntheticBuildingGlb() {
  const vertices = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
  ];
  const triangles = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7,
    1, 5, 6, 1, 6, 2, 0, 3, 7, 0, 7, 4,
  ];
  const bin = Buffer.alloc(168);
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  vertices.flat().forEach((value, index) => data.setFloat32(index * 4, value, true));
  triangles.forEach((index, i) => data.setUint16(96 + i * 2, index, true));
  const node = (name: string, translation: number[], scale: number[], extras?: object) =>
    ({ name, mesh: 0, translation, scale, ...(extras ? { extras } : {}) });
  const json = {
    asset: { version: '2.0', generator: 'H-B synthetic D focus fixture' },
    scene: 0,
    scenes: [{ name: 'Synthetic viewer D/WHOLE focus', nodes: [0, 1, 2, 3, 4, 5] }],
    nodes: [
      node('D_MARKED_FOOTPRINT', [2, 0, -2], [6, 0.15, 12], {
        ylisViewScope: { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' },
      }),
      node('D_WALL_WITHOUT_SCOPE', [1, 1, -2], [0.2, 2, 4]),
      node('D_WINDOW_WITHOUT_SCOPE', [2, 1.7, -2], [1, 1, 0.2]),
      node('ROOF_CROSSING_D_BOUNDARY', [5, 3, -2], [12, 0.25, 8]),
      node('GROUND_CROSSING_D_BOUNDARY', [5, -0.3, -2], [14, 0.1, 18]),
      node('OUTSIDE_D_FOOTPRINT', [12, 1, -2], [1, 2, 2]),
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ name: 'WORK_TEST_NEUTRAL', pbrMetallicRoughness: { baseColorFactor: [0.65, 0.72, 0.78, 1], metallicFactor: 0, roughnessFactor: 1 } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 96 }, { buffer: 0, byteOffset: 96, byteLength: 72 }],
    buffers: [{ byteLength: bin.byteLength }],
  };
  const rawJson = Buffer.from(JSON.stringify(json));
  const jsonPad = (4 - rawJson.length % 4) % 4;
  const paddedJson = Buffer.concat([rawJson, Buffer.alloc(jsonPad, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(bin.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, bin]);
}

test('D roof and roof-hidden presets retain unscoped D walls, split shared meshes and restore whole building', async ({ page }) => {
  test.setTimeout(90_000);
  const glb = syntheticBuildingGlb();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  const canvas = page.locator('#private-model-canvas');
  const toolbar = page.getByRole('toolbar', { name: 'Näkymät ja kuvakulmat' });
  const preset = (id: string) => toolbar.locator(`[data-desk-kind="preset"][data-desk-id="${id}"]`);
  await expect(preset('d-roof')).toBeVisible();

  await preset('d-roof').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', /^d-roof\|in:\d+\|out:\d+\|split:\d+$/);
  const roof = await canvas.getAttribute('data-d-focus-ghost');
  const [, inside, outside, split] = roof!.match(/in:(\d+)\|out:(\d+)\|split:(\d+)/)!.map(Number);
  expect(inside).toBeGreaterThanOrEqual(3);
  expect(outside).toBeGreaterThanOrEqual(1);
  expect(split).toBeGreaterThanOrEqual(2);
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'true');
  await expect(canvas).toHaveAttribute('data-d-focus-footprint', /-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+/);

  await preset('d-apartment').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', `d-apartment|in:${inside}|out:${outside}|split:${split}`);
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');

  await preset('whole-building').click();
  await expect(canvas).not.toHaveAttribute('data-d-focus-ghost', /.+/);
  await expect(canvas).not.toHaveAttribute('data-d-focus-footprint', /.+/);

  await preset('d-roof').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', roof!);
  await expect(preset('d-roof')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
