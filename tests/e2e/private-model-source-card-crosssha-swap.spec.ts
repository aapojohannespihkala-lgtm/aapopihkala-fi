import { expect, test } from '@playwright/test';

/**
 * Browser regression for a real canvas click and source-links panel during
 * two different synthetic GLB loads that reuse glTF nodeIndex 0.
 * The fixture is NOT a source-verified ROOM3 or C80-437 original and does
 * not establish protected WebGL, sourceLinks output-SHA or HUMAN_REVIEW.
 */
const syntheticGlb = (name: string, source: string): Buffer => {
  const triangle = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0]
    .forEach((v, i) => triangle.writeFloatLE(v, i * 4));
  const json = {
    asset: { version: '2.0', extras: { ModelStage: 'WORK_TEST' } },
    scene: 0,
    scenes: [{ name: 'SYNTHETIC CROSS SHA SOURCE ONLY', nodes: [0] }],
    nodes: [{ name, mesh: 0, extras: {
      sourceLinks: [{ link: source, role: 'SYNTHETIC_SOURCE_ONLY', supports: 'Test fixture' }],
      ModelStage: 'WORK_TEST', current: false, asBuilt: false,
    } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: {
      baseColorFactor: [0.7, 0.7, 0.7, 1],
    } }],
    buffers: [{ byteLength: triangle.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: triangle.length, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3,
      type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] }],
  };
  const encoded = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([
    encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 0x20),
  ]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + triangle.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(triangle.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, triangle]);
};

test('switching synthetic GLB SHA with reused node index clears stale browser source links', async ({ page }) => {
  const urlA = 'https://drive.google.com/file/d/SYNTHETIC_ROOM3_SOURCE_A/view';
  const urlB = 'https://drive.google.com/file/d/SYNTHETIC_WALL_SOURCE_B/view';
  let active = syntheticGlb('ROOM3_DOOR_NODE0', urlA);
  const next = syntheticGlb('C80_V84_WALL_NODE0', urlB);
  expect(active.equals(next)).toBe(false);

  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: active }));

  await page.goto('/private-model/');
  await expect(page.getByRole('status').first()).toContainText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  await page.locator('#selection-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'select');
  const dimensions = await canvas.boundingBox();
  expect(dimensions).not.toBeNull();
  if (!dimensions) throw new Error('The WebGL canvas was not laid out');
  const clickMiddle = () => canvas.click({ position: {
    x: dimensions.width / 2, y: dimensions.height / 2,
  } });
  await clickMiddle();
  await expect(page.locator('#selection-panel')).toBeVisible();
  const links = page.locator('#selection-source-links-list a');
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute('href', urlA);
  await expect(canvas).toHaveAttribute('data-selection-source-link-count', '1');

  active = next;
  // Use the real viewer model-reload control and its asynchronous loader.
  await page.locator('#current-model-button').evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByRole('status').first()).toContainText('Malli ladattu');
  await expect(page.locator('#selection-panel')).toBeHidden();
  await expect(links).toHaveCount(0);
  await expect(canvas).not.toHaveAttribute('data-selection-source-link-count', /./);

  if (await canvas.getAttribute('data-interaction-mode') !== 'select') {
    await page.locator('#selection-tool-button').click();
  }
  await clickMiddle();
  await expect(page.locator('#selection-panel')).toBeVisible();
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute('href', urlB);
  await expect(page.locator('#selection-source-links-list')).not.toContainText('ROOM3');
  await expect(canvas).toHaveAttribute('data-selection-source-link-count', '1');
  expect(errors).toEqual([]);
});
