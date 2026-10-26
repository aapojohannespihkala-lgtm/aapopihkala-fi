import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Separate from the existing D runtime integration suite reserved by Sol.
// Real R4E bytes are required for a WebGL PASS, never a synthetic replacement.
const R4E_SHA = '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680';

test('actual R4E D/1F stays fitted when live viewport changes desktop -> portrait -> desktop', async ({ page }, info) => {
  const path = process.env.YLIS_R4E_GLB;
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(path, 'R4E source required for real-model QA').toBeTruthy();
  test.skip(!path, 'R4E source absent: responsive actual-model WebGL NOT_RUN, never PASS.');
  test.setTimeout(120_000);
  const bytes = readFileSync(path!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(R4E_SHA);

  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256', R4E_SHA);
  if (await page.locator('#preset-menu').getAttribute('open') === null) {
    await page.locator('#preset-menu > summary').click();
  }
  await page.locator('#main-view-area').selectOption('D');
  await page.locator('#main-view-floor').selectOption('1F');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  await expect(canvas).toHaveAttribute('data-main-view-t04-status', 'T04_CLIPPED_SOURCE');

  const pixels = async () => canvas.evaluate((element: HTMLCanvasElement) =>
    new Promise<{ colored: number; border: number; width: number }>(resolve => {
      requestAnimationFrame(() => {
        const gl = element.getContext('webgl2')!;
        const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
        const rgba = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
        let colored = 0, border = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const difference = Math.abs(rgba[offset] - rgba[0]) +
            Math.abs(rgba[offset + 1] - rgba[1]) + Math.abs(rgba[offset + 2] - rgba[2]);
          if (difference > 30) {
            colored++;
            if (x < 4 || x >= width - 4) border++;
          }
        }
        resolve({ colored, border, width });
      });
    }));
  const wideBefore = await pixels();
  expect(wideBefore.colored).toBeGreaterThan(100);

  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(async () => canvas.evaluate((c: HTMLCanvasElement) => c.clientWidth)).toBeLessThan(500);
  await expect.poll(async () => (await pixels()).border, {
    message: 'The actual R4E floor must not be cropped by either portrait horizontal border',
    timeout: 20_000,
  }).toBe(0);
  const portrait = await pixels();
  expect(portrait.colored).toBeGreaterThan(100);
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => canvas.evaluate((c: HTMLCanvasElement) => c.clientWidth)).toBeGreaterThan(700);
  const wideAfter = await pixels();
  expect(wideAfter.colored).toBeGreaterThan(100);
  // A pure resize must preserve the selected floor and its rendered geometry.
  // Allow minor GPU sampling differences without relaxing the portrait edge gate.
  expect(Math.abs(wideAfter.colored - wideBefore.colored))
    .toBeLessThan(Math.max(50, wideBefore.colored * 0.02));
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  expect(errors).toEqual([]);
  await info.attach('d-live-viewport-fit-report', {
    body: JSON.stringify({ sourceSha256: R4E_SHA, floor: '1F', wideBefore, portrait, wideAfter,
      production: 'NOT_RUN', sourceLevel: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD' }),
    contentType: 'application/json',
  });
});
