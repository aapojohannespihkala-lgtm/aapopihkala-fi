import { expect, test } from '@playwright/test';

test('Rosa Pupu introduces herself on click and on rotation, then hides the bubble', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/pupu/');
  await expect(page.locator('meta[name="pupu-viewer-version"]')).toHaveAttribute('content', 'rosa-speech-r6-20261102');
  const canvas = page.locator('#pupu-canvas-frame canvas');
  const speech = page.locator('#pupu-speech');
  await expect(canvas).toBeVisible();
  await expect(speech).toBeHidden();
  await expect(page.locator('footer, button')).toHaveCount(0);

  // The click action can outlast a transient bubble on a busy CI GPU.
  // Assert visibility while the click is happening, not after it resolves.
  await Promise.all([
    canvas.click(),
    expect(speech).toBeVisible({ timeout: 15_000 }),
  ]);
  await expect(speech).toHaveText('Minä olen Rosa Pupu');
  await expect(speech).toBeHidden({ timeout: 6_000 });

  const rect = await canvas.boundingBox();
  expect(rect).not.toBeNull();
  const x = rect!.x + rect!.width / 2;
  const y = rect!.y + rect!.height / 2;
  await page.mouse.move(x, y);
  await Promise.all([
    (async () => {
      await page.mouse.down();
      await page.mouse.move(x + 65, y + 20, { steps: 5 });
      await page.mouse.up();
    })(),
    expect(speech).toBeVisible({ timeout: 15_000 }),
  ]);
  await expect(speech).toBeHidden({ timeout: 6_000 });
});

test('Touching Rosa also opens her bubble on a mobile touchscreen', async ({ browser }) => {
  test.setTimeout(45_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto('/pupu/');
    const canvas = page.locator('#pupu-canvas-frame canvas');
    await expect(canvas).toBeVisible();
    const rect = await canvas.boundingBox();
    expect(rect).not.toBeNull();
    await page.touchscreen.tap(Math.round(rect!.x + rect!.width / 2), Math.round(rect!.y + rect!.height / 2));
    const speech = page.locator('#pupu-speech');
    await expect(speech).toHaveText('Minä olen Rosa Pupu');
    await expect(speech).toBeVisible();
  } finally {
    await context.close();
  }
});
