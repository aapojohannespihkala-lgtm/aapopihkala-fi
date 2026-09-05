import { expect, test, type Page } from '@playwright/test';

const setDayMode = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('aapopihkala-night-mode', 'day');
  });
};

const watchBrowserErrors = (page: Page) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  return errors;
};

test('homepage MorphingTopography preserves its contract, motion and orbit', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-morphing-topography]');
  const canvas = page.locator('[data-morphing-topography-canvas]');

  await expect(root).toHaveAttribute('data-auto-rotate', 'true');
  await expect(root).toHaveAttribute('data-morph', 'true');
  await expect(root).toHaveAttribute('data-show-contours', 'true');
  await expect(root).toHaveAttribute('data-enable-zoom', 'false');
  await expect(root).toHaveAttribute('data-topography-initialized', 'true', {
    timeout: 10_000,
  });

  await expect(canvas).toBeVisible();
  await expect
    .poll(
      () => canvas.evaluate((element) => (element as HTMLCanvasElement).height),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(200);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(300);
  expect(box!.width).toBeLessThan(340);
  expect(box!.height).toBeGreaterThan(280);
  expect(box!.height).toBeLessThan(320);

  const frameBeforeMotion = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL()
  );
  await page.waitForTimeout(700);
  const frameAfterMotion = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL()
  );
  expect(frameAfterMotion).not.toBe(frameBeforeMotion);

  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;
  const frameBeforeDrag = frameAfterMotion;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 70, centerY - 30, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const frameAfterDrag = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL()
  );
  expect(frameAfterDrag).not.toBe(frameBeforeDrag);

  expect(browserErrors).toEqual([]);
});
