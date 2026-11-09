import { expect, test } from '@playwright/test';

// Unlike source-only assertions, read the actual WebGL pixels to detect a
// model that is cut off at the edge of a full-width transparent canvas.
test('Pupu is visible, centered and unclipped on desktop and mobile', async ({ page }) => {
  test.setTimeout(90_000);
  for (const [width, height] of [[1654, 928], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/pupu/');
    await expect(page.locator('meta[name="pupu-viewer-version"]')).toHaveAttribute('content', 'rosa-speech-r6-20261102');
    await expect(page.locator('#pupu-canvas-frame')).toHaveCSS('transform', 'none');
    const canvas = page.locator('#pupu-canvas-frame canvas');
    await expect(canvas).toBeVisible();
    const rect = await canvas.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.width).toBeLessThanOrEqual(801);
    expect(Math.abs(rect!.x + rect!.width / 2 - width / 2)).toBeLessThan(3);

    const pixelProbe = async () => canvas.evaluate((element: HTMLCanvasElement) =>
      new Promise<{ count: number; centerX: number; minX: number; maxX: number; width: number }>(resolve => {
        requestAnimationFrame(() => {
          const gl = element.getContext('webgl2');
          if (!gl) return resolve({ count: 0, centerX: -1, minX: -1, maxX: -1, width: 0 });
          const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
          const pixels = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const bg = [pixels[0], pixels[1], pixels[2]];
          let count = 0, sumX = 0, minX = w, maxX = 0;
          for (let y = 2; y < h - 2; y += 4) for (let x = 2; x < w - 2; x += 4) {
            const offset = (y * w + x) * 4;
            const delta = Math.abs(pixels[offset] - bg[0]) +
              Math.abs(pixels[offset + 1] - bg[1]) + Math.abs(pixels[offset + 2] - bg[2]);
            if (delta > 48) { count++; sumX += x; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
          }
          resolve({ count, centerX: count ? sumX / count : -1, minX, maxX, width: w });
        });
      })
    );
    await expect.poll(async () => (await pixelProbe()).count, { timeout: 20_000 }).toBeGreaterThan(250);
    const pixels = await pixelProbe();
    expect(Math.abs(pixels.centerX - pixels.width / 2)).toBeLessThan(pixels.width * .20);
    expect(pixels.minX).toBeGreaterThan(pixels.width * .03);
    expect(pixels.maxX).toBeLessThan(pixels.width * .97);
    await expect(page.locator('#pupu-front, #pupu-back, #pupu-side, #pupu-spin, #pupu-download')).toHaveCount(0);
    await canvas.click({ position: { x: rect!.width / 2, y: rect!.height / 2 } });
    await expect(page.locator('#pupu-speech')).toBeVisible();
    const again = await pixelProbe();
    expect(again.count).toBeGreaterThan(250);
    expect(Math.abs(again.centerX - again.width / 2)).toBeLessThan(again.width * .20);
  }
});
