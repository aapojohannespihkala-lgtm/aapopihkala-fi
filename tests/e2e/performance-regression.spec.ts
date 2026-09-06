import { expect, test } from '@playwright/test';

test('homepage initial topography load defers model-only runtime and GLB assets', async ({ page }) => {
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

  await page.waitForTimeout(500);

  expect(requestedUrls.some((url) => url.includes('GLTFLoader'))).toBe(false);
  expect(
    requestedUrls.some((url) => url.includes('/lab/meshy-pixelated-poise.glb'))
  ).toBe(false);
});
