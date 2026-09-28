import { expect, test } from '@playwright/test';

import {
  handlePrivateModelRequest,
  isPrivateModelPath,
  type PrivateModelEnv,
} from '../../worker/privateModel';

const makeMinimalGlb = (json: Record<string, unknown>) => {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonChunk.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);

  return Buffer.concat([header, chunkHeader, jsonChunk]);
};


const makeTriangleGlb = (nodeExtras: Record<string, unknown> = {}) => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'D_1F_TEST_GROUP', mesh: 0, extras: nodeExtras }],
    meshes: [{ name: 'TEST_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
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

test('private model route matching is bounded to its own prefix', () => {
  expect(isPrivateModelPath('/private-model')).toBe(true);
  expect(isPrivateModelPath('/private-model/')).toBe(true);
  expect(isPrivateModelPath('/private-model/model.glb')).toBe(true);
  expect(isPrivateModelPath('/private-modelish')).toBe(false);
  expect(isPrivateModelPath('/current/private-model')).toBe(false);
});

test('private model handler fails closed before static assets without Access configuration', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/', { method: 'GET' }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(assetFetches).toBe(0);
});

test('private model handler rejects unsupported methods before auth or assets', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/model.glb', { method: 'POST' }),
    env,
  );

  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD');
  expect(assetFetches).toBe(0);
});

test('private viewer resolves the source D scene even when Three runtime names are sanitized', async ({
  page,
}) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');

  await expect(page.getByRole('button', { name: 'D 1F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 2F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit / Reset' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
});



test('private viewer selects a visible mesh, shows bounded identity, and ignores orbit drags', async ({ page }) => {
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  await expect(panel).toBeHidden();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).not.toHaveText('-');
  await expect(page.locator('#selection-floor')).toHaveText('1F');
  await expect(page.locator('#selection-scene')).toHaveText('P133D REVIEW ROOT - BABYLON Y-UP');

  await page.getByRole('button', { name: 'Tyhjennä' }).click();
  await expect(panel).toBeHidden();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40);
  await page.mouse.up();
  await expect(panel).toBeHidden();
});

test('private viewer fits inside the browser viewport without document scrolling', async ({ page }) => {
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/octet-stream',
      body: '',
    });
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 700, height: 520 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/private-model/');

    const metrics = await page.evaluate(() => {
      const viewportElement = document.querySelector<HTMLElement>('.viewport');
      const rect = viewportElement?.getBoundingClientRect();
      return {
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportTop: rect?.top ?? -1,
        viewportBottom: rect?.bottom ?? -1,
        innerHeight: window.innerHeight,
      };
    });

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.bodyClientHeight + 1);
    expect(metrics.viewportTop).toBeGreaterThanOrEqual(0);
    expect(metrics.viewportBottom).toBeLessThanOrEqual(metrics.innerHeight + 1);
  }
});


test('private viewer roof test layer toggles explicit roof metadata and exposes opacity control', async ({
  page,
}) => {
  const model = makeTriangleGlb({ presentationLayer: 'REFERENCE_ROOF' });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const layerPanel = page.locator('#layers-panel');
  const roofToggle = page.locator('#roof-layer-visible');
  const opacity = page.locator('#roof-layer-opacity');

  await expect(layerPanel).toBeVisible();
  await expect(page.getByText('Katto (testi)')).toBeVisible();
  await expect(page.locator('#roof-layer-count')).toHaveText('1 kohdetta');
  await expect(roofToggle).toBeChecked();
  await expect(opacity).toHaveValue('100');

  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(page.locator('#roof-layer-opacity-value')).toHaveText('40 %');

  const canvas = page.locator('#private-model-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await roofToggle.uncheck();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeHidden();

  await roofToggle.check();
  await opacity.fill('100');
  await opacity.dispatchEvent('input');
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();

  await page.getByRole('button', { name: 'Sulje' }).click();
  await expect(layerPanel).toBeHidden();
});
