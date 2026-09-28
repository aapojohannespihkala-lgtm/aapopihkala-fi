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

