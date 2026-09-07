import { stat } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const modelFixture = {
  asset: { version: '2.0' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  buffers: [
    {
      byteLength: 42,
      uri: 'data:application/octet-stream;base64,AAAAvwAAAL8AAAAAAAAAPwAAAL8AAAAAAAAAAAAAAD8AAAAAAAABAAIA',
    },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
    { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
  ],
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [-0.5, -0.5, 0],
      max: [0.5, 0.5, 0],
    },
    { bufferView: 1, byteOffset: 0, componentType: 5123, count: 3, type: 'SCALAR' },
  ],
};

test('Pixelated Poise loads its Lab render and accepts orbit interaction', async ({ page }) => {
  test.setTimeout(90_000);

  const productionAsset = await stat('public/lab/meshy-pixelated-poise.glb');
  expect(productionAsset.size).toBeGreaterThan(1_000_000);

  const modelErrors: string[] = [];

  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().toLowerCase().includes('pixelated poise')
    ) {
      modelErrors.push(message.text());
    }
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*.glb', async (route) => {
    if (route.request().url().endsWith('/lab/meshy-pixelated-poise.glb')) {
      await route.fulfill({
        status: 200,
        contentType: 'model/gltf+json',
        body: JSON.stringify(modelFixture),
      });
      return;
    }

    await route.abort();
  });

  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-meshy-model]');
  const canvas = root.locator('[data-meshy-model-canvas]');
  const status = root.locator('[data-meshy-model-status]');

  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-meshy-model-initialized', 'true');
  await expect(status).toBeHidden({ timeout: 20_000 });
  await expect(canvas).toBeVisible();

  await expect
    .poll(
      () => canvas.evaluate((element) => (element as HTMLCanvasElement).height),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(400);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 70, startY + 20);
  await page.mouse.up();
  await page.waitForTimeout(250);

  await expect(status).toBeHidden();
  expect(modelErrors).toEqual([]);
});