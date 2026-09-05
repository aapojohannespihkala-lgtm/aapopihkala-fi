import { expect, test } from '@playwright/test';

test('Photogrammetry model preserves its Lab render and free orbit interaction', async ({ page }) => {
  test.setTimeout(90_000);

  const modelErrors: string[] = [];

  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().toLowerCase().includes('photogrammetry')
    ) {
      modelErrors.push(message.text());
    }
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*.glb', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/lab/photogrammetry-2026-09-04.glb') {
      await route.continue();
      return;
    }
    await route.abort();
  });

  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-photogrammetry-model]');
  const canvas = page.locator('[data-photogrammetry-model-canvas]');
  const status = page.locator('[data-photogrammetry-model-status]');

  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-photogrammetry-initialized', 'true');
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

  const before = await canvas.screenshot();
  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 70, startY + 20, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  const after = await canvas.screenshot();
  expect(Buffer.compare(before, after)).not.toBe(0);
  expect(modelErrors).toEqual([]);
});
