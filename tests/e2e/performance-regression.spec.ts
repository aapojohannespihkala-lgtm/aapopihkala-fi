import { expect, test } from '@playwright/test';

test('homepage initial view defers the portrait GLB until the About embed is visible', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('aapopihkala-night-mode', 'day');
      window.localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  });

  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const topographyCanvas = page.locator('[data-morphing-topography-canvas]');
  const portrait = page.locator('[data-homepage-about-embed] [data-meshy-point-surface]');

  await expect(topographyCanvas).toBeVisible();
  await expect
    .poll(
      () =>
        topographyCanvas.evaluate(
          (canvas) => (canvas as HTMLCanvasElement).height
        ),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(200);

  await expect(portrait).toHaveAttribute('data-meshy-point-surface-load-state', 'waiting');
  await page.waitForTimeout(500);

  expect(
    requestedUrls.some((url) => url.includes('/lab/meshy-pixelated-poise.glb'))
  ).toBe(false);
});
