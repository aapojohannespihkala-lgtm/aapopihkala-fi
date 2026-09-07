import { expect, test } from '@playwright/test';

test('Pixelated Poise loads its Lab render and accepts orbit interaction', async ({ page }) => {
  test.setTimeout(90_000);

  const modelErrors: string[] = [];

  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().toLowerCase().includes('pixelated poise')
    ) {
      modelErrors.push(message.text());
    }
  });

  await page.route('**/*.glb', async (route) => {
    if (route.request().url().endsWith('/lab/meshy-pixelated-poise.glb')) {
      await route.continue();
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
  await expect(status).toBeHidden({ timeout: 45_000 });
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
  await page.mouse.move(startX + 70, startY + 20, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  await expect(status).toBeHidden();
  expect(modelErrors).toEqual([]);
});