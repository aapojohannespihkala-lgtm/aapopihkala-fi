import { expect, test } from '@playwright/test';

/**
 * Synthetic GLB regression for the actual Chromium canvas -> selection panel
 * path. This is NOT the protected 428-scene original, sourceLinks binding,
 * production WebGL acceptance or a physical/as-built observation.
 */
const makeSelectionTriangleGlb = (extras: Record<string, unknown>) => {
  const vertices = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((v, i) => vertices.writeFloatLE(v, i * 4));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'KP011 SYNTHETIC 1F - WORK_TEST HOST_HOLD', nodes: [0] }],
    nodes: [{ name: 'D_1F_PRESENTATION_WALL_HELPER', mesh: 0, extras }],
    meshes: [{ name: 'VISIBLE_HELPER_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: vertices.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: vertices.length, target: 34962 }],
    accessors: [{
      bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
      min: [-1, -1, 0], max: [1, 1, 0],
    }],
  };
  const bytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + vertices.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(vertices.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, vertices]);
};

const clickSourceSurface = async (page: import('@playwright/test').Page, extras: Record<string, unknown>) => {
  const glb = makeSelectionTriangleGlb(extras);
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status').first()).toHaveText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  await page.locator('#selection-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'select');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('3D canvas has no visible drawing area');
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
};

test('real WebGL object click keeps presentation helper nonphysical and its source card unbound', async ({ page }) => {
  await clickSourceSurface(page, {
    representationKind: 'WALL_HELPER',
    sourceRole: 'REVIEW_HELPER',
    presentationOnly: true,
    physicalThicknessClaim: false,
    physicalWallClaim: false,
    physicalHost: 'HOST_HOLD',
    ModelStage: 'WORK_TEST_HOST_HOLD',
  });
  await expect(page.locator('#selection-scene')).toHaveText('Review-apugeometria');
  await expect(page.locator('#selection-physical-claim')).toHaveText('Ei');
  await expect(page.locator('#selection-metadata-list')).toContainText('Presentation Only');
  await expect(page.locator('#selection-metadata-list')).toContainText('true');
  await expect(page.locator('#selection-source-links')).toBeHidden();
  await page.locator('#clear-selection-button').click();
  await expect(page.locator('#selection-panel')).toBeHidden();
});

test('actual selection UI distinguishes explicit physical geometry from presentation helper', async ({ page }) => {
  await clickSourceSurface(page, {
    representationKind: 'WALL',
    physicalWallClaim: true,
    physicalThicknessClaim: true,
    ModelStage: 'SOURCE_EXACT_TEST_ONLY',
  });
  await expect(page.locator('#selection-scene')).toHaveText('Fyysinen');
  await expect(page.locator('#selection-physical-claim')).toHaveText('Kyllä');
  // Even an explicit physical flag does not conjure an independent source card.
  await expect(page.locator('#selection-source-links')).toBeHidden();
});
