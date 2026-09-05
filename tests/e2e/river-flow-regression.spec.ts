import { expect, test } from '@playwright/test';

test('RiverFlow preserves its animated Lab presentation', async ({ page }) => {
  const riverErrors: string[] = [];

  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('RiverFlow failed to initialize')
    ) {
      riverErrors.push(message.text());
    }
  });

  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-river-flow]');
  const canvas = page.locator('[data-river-flow-canvas]');

  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-auto-rotate', 'true');
  await expect(root).toHaveAttribute('data-animate', 'true');
  await expect(root).toHaveAttribute('data-show-contours', 'true');
  await expect(root).toHaveAttribute('data-enable-zoom', 'true');
  await expect(root).toHaveAttribute('data-scale', '1');
  await expect(root).toHaveAttribute(
    'data-river-flow-initialized',
    'true',
    { timeout: 10_000 }
  );

  await expect(canvas).toBeVisible();
  await expect
    .poll(
      () => canvas.evaluate((element) => (element as HTMLCanvasElement).height),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(250);

  await page.waitForTimeout(250);
  const before = await canvas.screenshot();
  await page.waitForTimeout(450);
  const after = await canvas.screenshot();

  expect(Buffer.compare(before, after)).not.toBe(0);
  expect(riverErrors).toEqual([]);
});
