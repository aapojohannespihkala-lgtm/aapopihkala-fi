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

  const readRenderedPixels = async () => {
    const screenshot = await canvas.screenshot();
    const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

    return page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();

      const probe = document.createElement('canvas');
      probe.width = image.naturalWidth;
      probe.height = image.naturalHeight;
      const context = probe.getContext('2d', { willReadFrequently: true });
      if (!context) return null;

      context.drawImage(image, 0, 0);
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
          probe.width - 1,
          Math.max(0, Math.floor(probe.width * xRatio)),
        );
        const y = Math.min(
          probe.height - 1,
          Math.max(0, Math.floor(probe.height * yRatio)),
        );
        return Array.from(context.getImageData(x, y, 1, 1).data);
      });
    }, dataUrl);
  };

  const isDarkSurface = (pixels: number[][] | null) =>
    pixels !== null &&
    pixels.every(
      ([red, green, blue, alpha]) =>
        red >= 30 &&
        red <= 34 &&
        green >= 40 &&
        green <= 44 &&
        blue >= 50 &&
        blue <= 54 &&
        alpha === 255,
    );

  await expect
    .poll(async () => isDarkSurface(await readRenderedPixels()), { timeout: 5_000 })
    .toBe(true);

  const pixels = await readRenderedPixels();
  expect(pixels).not.toBeNull();
  expect(isDarkSurface(pixels)).toBe(true);
});
