import { expect, test } from '@playwright/test';

/**
 * #2197 roof-presentation regression. Synthetic geometry, no Ylisrinne source
 * GLB, sourceLinks or actual building geometry is used or authenticated here.
 */
function fixtureGlb() {
  const corners = [
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
  corners.flat().forEach((value, index) => data.setFloat32(index * 4, value, true));
  triangles.forEach((index, i) => data.setUint16(96 + i * 2, index, true));
  const node = (name: string, translation: number[], scale: number[], extras?: object) =>
    ({ name, mesh: 0, translation, scale, ...(extras ? { extras } : {}) });
  const json = {
    asset: { version: '2.0', generator: 'R31 roof mode synthetic browser regression' },
    scene: 0,
    scenes: [{ name: 'Roof presentation regression fixture', nodes: [0, 1, 2, 3, 4] }],
    nodes: [
      node('D_MARKED_FOOTPRINT', [2, 0, -2], [6, 0.15, 12], {
        ylisViewScope: { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' },
      }),
      node('D_WALL_WITHOUT_SCOPE', [1, 1, -2], [0.2, 2, 4]),
      node('D_WINDOW_WITHOUT_SCOPE', [2, 1.7, -2], [1, 1, 0.2]),
      node('ROOF_CROSSING_D_BOUNDARY', [5, 3, -2], [12, 0.25, 8]),
      node('OUTSIDE_D_FOOTPRINT', [12, 1, -2], [1, 2, 2]),
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.65, 0.72, 0.78, 1] } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3',
        min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 96 },
      { buffer: 0, byteOffset: 96, byteLength: 72 }],
    buffers: [{ byteLength: bin.length }],
  };
  const source = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([source, Buffer.alloc((4 - source.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, bin]);
}

test('D roof ghost changes to hidden on both storeys and restores on return', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fixtureGlb() }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  const canvas = page.locator('#private-model-canvas');
  const toolbar = page.getByRole('toolbar', { name: 'Näkymät ja kuvakulmat' });
  const preset = (id: string) =>
    toolbar.locator('[data-desk-kind="preset"][data-desk-id="' + id + '"]');

  const cycle = async (id: string, roofMode: string, visible: string) => {
    await preset(id).click();
    await expect(canvas).toHaveAttribute('data-d-focus-ghost', new RegExp('^' + id + '\\|in:\\d+\\|out:\\d+\\|split:\\d+'));
    await expect(canvas).toHaveAttribute('data-desk-roof-mode', roofMode);
    await expect(canvas).toHaveAttribute('data-layer-roof-visible', visible);
    await expect(preset(id)).toHaveAttribute('aria-pressed', 'true');
  };

  await cycle('d-roof', 'visible', 'true');
  await cycle('d-apartment', 'ghost', 'true');
  await cycle('d-1f', 'hidden', 'false');
  await cycle('d-2f', 'hidden', 'false');
  await cycle('d-apartment', 'ghost', 'true');
  await cycle('d-roof', 'visible', 'true');
  await preset('whole-building').click();
  await expect(canvas).not.toHaveAttribute('data-d-focus-ghost', /.+/);
  await cycle('d-apartment', 'ghost', 'true');
  expect(errors).toEqual([]);
});
