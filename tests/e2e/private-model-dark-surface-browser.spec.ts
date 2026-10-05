import { expect, test } from '@playwright/test';

const makeMinimalGlb = () => {
  const jsonBuffer = Buffer.from(
    JSON.stringify({
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
      nodes: [],
    }),
    'utf8',
  );
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

test('private viewer renders the VUX-C dark WebGL surface instead of only declaring dark CSS', async ({
  page,
}) => {
  const model = makeMinimalGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
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

  const readCanvasPixels = () =>
    canvas.evaluate((node) => {
      const source = node as HTMLCanvasElement;
      if (source.width < 8 || source.height < 8) return null;

      const probe = document.createElement('canvas');
      probe.width = source.width;
      probe.height = source.height;
      const context = probe.getContext('2d', { willReadFrequently: true });
      if (!context) return null;

      context.drawImage(source, 0, 0);
      const points = [
        [0.18, 0.2],
        [0.5, 0.2],
        [0.82, 0.2],
        [0.18, 0.8],
        [0.5, 0.8],
        [0.82, 0.8],
      ];

      return points.map(([xRatio, yRatio]) => {
        const x = Math.min(
          source.width - 1,
          Math.max(0, Math.floor(source.width * xRatio)),
        );
        const y = Math.min(
          source.height - 1,
          Math.max(0, Math.floor(source.height * yRatio)),
        );
        return Array.from(context.getImageData(x, y, 1, 1).data);
      });
    });

  await expect
    .poll(
      async () => {
        const pixels = await readCanvasPixels();
        return (
          pixels !== null &&
          pixels.every(
            ([red, green, blue, alpha]) =>
              red >= 31 &&
              red <= 33 &&
              green >= 41 &&
              green <= 43 &&
              blue >= 51 &&
              blue <= 53 &&
              alpha === 255,
          )
        );
      },
      { timeout: 5_000 },
    )
    .toBe(true);

  const pixels = await readCanvasPixels();
  expect(pixels).not.toBeNull();
  for (const [red, green, blue, alpha] of pixels ?? []) {
    expect(red).toBeGreaterThanOrEqual(31);
    expect(red).toBeLessThanOrEqual(33);
    expect(green).toBeGreaterThanOrEqual(41);
    expect(green).toBeLessThanOrEqual(43);
    expect(blue).toBeGreaterThanOrEqual(51);
    expect(blue).toBeLessThanOrEqual(53);
    expect(alpha).toBe(255);
  }
});
