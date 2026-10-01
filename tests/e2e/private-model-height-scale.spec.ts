import { expect, test } from '@playwright/test';

const makeReviewGlb = () => {
  const positions = Buffer.alloc(36);
  [-4, -2, 0, 4, -2, 0, 0, 5, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P139AI HEIGHT SCALE TEST - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'P139AI_TEST_GEOMETRY', mesh: 0 }],
    meshes: [
      {
        name: 'P139AI_TEST_TRIANGLE',
        primitives: [{ attributes: { POSITION: 0 } }],
      },
    ],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-4, -2, 0],
        max: [4, 5, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (positions.length % 4)) % 4;
  const binChunk = Buffer.concat([positions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

test('private viewer height scale places higher Z above lower Z and draws full-width guides', async ({ page }) => {
  const currentModel = makeReviewGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    });
  });

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');

  await page.locator('#view-menu > summary').click();
  await page.getByRole('button', { name: 'Julk +Y', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');

  const labels = page.locator('#height-scale .height-scale-label');
  const guides = page.locator('#height-scale .height-scale-guide');
  expect(await labels.count()).toBeGreaterThan(1);
  await expect(guides).toHaveCount(await labels.count());
  await expect(labels.first()).toHaveCSS('position', 'absolute');
  await expect(guides.first()).toHaveCSS('position', 'absolute');

  const lowestZ = Number(await labels.first().getAttribute('data-height-m'));
  const highestZ = Number(await labels.last().getAttribute('data-height-m'));
  expect(highestZ).toBeGreaterThan(lowestZ);

  const lowestBox = await labels.first().boundingBox();
  const highestBox = await labels.last().boundingBox();
  expect(lowestBox).not.toBeNull();
  expect(highestBox).not.toBeNull();
  expect(highestBox!.y).toBeLessThan(lowestBox!.y);

  const scaleBox = await page.locator('#height-scale').boundingBox();
  const guideBox = await guides.first().boundingBox();
  expect(scaleBox).not.toBeNull();
  expect(guideBox).not.toBeNull();
  expect(guideBox!.width).toBeGreaterThan(scaleBox!.width * 0.9);
});
