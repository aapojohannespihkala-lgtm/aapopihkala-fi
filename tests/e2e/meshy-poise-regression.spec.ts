import { stat } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const modelFixtureBase64 =
  'Z2xURgIAAABYAgAAEAIAAEpTT057ImFzc2V0Ijp7InZlcnNpb24iOiIyLjAifSwic2NlbmUiOjAsInNjZW5lcyI6W3sibm9kZXMiOlswXX1dLCJub2RlcyI6W3sibWVzaCI6MH1dLCJtZXNoZXMiOlt7InByaW1pdGl2ZXMiOlt7ImF0dHJpYnV0ZXMiOnsiUE9TSVRJT04iOjB9LCJpbmRpY2VzIjoxfV19XSwiYnVmZmVycyI6W3siYnl0ZUxlbmd0aCI6NDJ9XSwiYnVmZmVyVmlld3MiOlt7ImJ1ZmZlciI6MCwiYnl0ZU9mZnNldCI6MCwiYnl0ZUxlbmd0aCI6MzYsInRhcmdldCI6MzQ5NjJ9LHsiYnVmZmVyIjowLCJieXRlT2Zmc2V0IjozNiwiYnl0ZUxlbmd0aCI6NiwidGFyZ2V0IjozNDk2M31dLCJhY2Nlc3NvcnMiOlt7ImJ1ZmZlclZpZXciOjAsImJ5dGVPZmZzZXQiOjAsImNvbXBvbmVudFR5cGUiOjUxMjYsImNvdW50IjozLCJ0eXBlIjoiVkVDMyIsIm1pbiI6Wy0wLjUsLTAuNSwwXSwibWF4IjpbMC41LDAuNSwwXX0seyJidWZmZXJWaWV3IjoxLCJieXRlT2Zmc2V0IjowLCJjb21wb25lbnRUeXBlIjo1MTIzLCJjb3VudCI6MywidHlwZSI6IlNDQUxBUiJ9XX0gICAsAAAAQklOAAAAAL8AAAC/AAAAAAAAAD8AAAC/AAAAAAAAAAAAAAA/AAAAAAAAAQACAAAA';

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
        contentType: 'model/gltf-binary',
        body: Buffer.from(modelFixtureBase64, 'base64'),
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