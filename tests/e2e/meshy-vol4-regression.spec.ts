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

test('homepage portrait keeps its Vol 4 camera, motion and orbit contract', async ({ page }) => {
  test.setTimeout(90_000);

  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/about/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-meshy-point-surface]');
  const canvas = page.locator('[data-meshy-point-surface-canvas]');
  const status = page.locator('[data-meshy-point-surface-status]');
  const probePrimary = page.locator('[data-meshy-surface-probe-primary]');
  const probeSecondary = page.locator('[data-meshy-surface-probe-secondary]');

  await expect(root).toHaveAttribute('data-enable-zoom', 'false');
  await expect(root).toHaveAttribute('data-enable-pan', 'false');
  await expect(root).toHaveAttribute('data-enable-idle-motion', 'true');
  await expect(root).toHaveAttribute('data-enable-surface-probe', 'true');
  await expect(root).toHaveAttribute('data-camera-x', '0');
  await expect(root).toHaveAttribute('data-camera-distance', '3.8');
  await expect(root).toHaveAttribute('data-camera-height', '0');
  await expect(root).toHaveAttribute('data-camera-fov', '38');
  await expect(root).toHaveAttribute('data-target-y', '0');
  await expect(root).toHaveAttribute('data-idle-yaw-range', '10');
  await expect(root).toHaveAttribute('data-idle-pitch-range', '4');

  await expect(status).toBeHidden({ timeout: 45_000 });
  await expect(root).toHaveAttribute('data-meshy-point-surface-load-state', 'ready', {
    timeout: 45_000,
  });
  await expect(root).toHaveAttribute('data-meshy-point-surface-render-state', 'active', {
    timeout: 10_000,
  });
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(250);
  expect(box!.height).toBeGreaterThan(300);

  const centerX = box!.x + box!.width * 0.5;
  const centerY = box!.y + box!.height * 0.5;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 70, centerY - 35, { steps: 6 });

  await expect(probePrimary).toHaveText('ORBIT / MANUAL');
  await expect(probeSecondary).toHaveText(/^H [+-]\d+\.\d° \/ V [+-]\d+\.\d°$/);

  await page.mouse.up();
  expect(browserErrors).toEqual([]);
});
