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
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  return errors;
};

test('homepage keeps its key visual anchors and interactions', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Aapo Pihkala' })
  ).toBeVisible();

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

  const topographyBox = await topographyCanvas.boundingBox();
  expect(topographyBox).not.toBeNull();
  expect(topographyBox!.width).toBeGreaterThan(300);
  expect(topographyBox!.width).toBeLessThan(340);
  expect(topographyBox!.height).toBeGreaterThan(240);
  expect(topographyBox!.height).toBeLessThan(300);

  await expect(page.locator('.language-switch')).toHaveAttribute('href', '/en/');

  const nightModeToggle = page.locator('[data-night-mode-toggle]');
  await expect(nightModeToggle).toBeVisible();
  await nightModeToggle.click();
  await expect(page.locator('html')).toHaveClass(/site-night-mode/);
  await nightModeToggle.click();
  await expect(page.locator('html')).not.toHaveClass(/site-night-mode/);

  const aboutEmbed = page.locator('[data-homepage-about-embed]');
  await expect(aboutEmbed).toHaveCount(1);
  await expect
    .poll(() =>
      aboutEmbed.evaluate(
        (element) => element.parentElement?.classList.contains('main-container') ?? false
      )
    )
    .toBe(true);

  expect(browserErrors).toEqual([]);
});

test('about portrait loads and preserves its main frame geometry', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/about/', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByRole('heading', { level: 1, name: 'Tietoa minusta' })
  ).toBeVisible();

  const frame = page.locator('[data-about-portrait-frame]');
  await expect(frame).toBeVisible();

  const frameBox = await frame.boundingBox();
  expect(frameBox).not.toBeNull();
  expect(frameBox!.width).toBeGreaterThan(290);
  expect(frameBox!.width).toBeLessThan(390);
  expect(frameBox!.height).toBeGreaterThan(350);
  expect(frameBox!.height).toBeLessThan(510);

  const status = page.locator('[data-meshy-point-surface-status]');
  await expect(status).toBeHidden({ timeout: 45_000 });

  const portraitCanvas = page.locator('[data-meshy-point-surface-canvas]');
  await expect(portraitCanvas).toBeVisible();
  await expect
    .poll(
      () =>
        portraitCanvas.evaluate(
          (canvas) => (canvas as HTMLCanvasElement).height
        ),
      { timeout: 45_000 }
    )
    .toBeGreaterThan(300);

  expect(browserErrors).toEqual([]);
});

test('published article route renders its interactive graphic and language link', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/artikkelit/luontoviisas-piha/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('.post-title')).toBeVisible();
  await expect(page.locator('.post-news')).toBeVisible();

  const graphic = page.locator('.post-interactive-graphic');
  await expect(graphic).toBeVisible();
  const graphicBox = await graphic.boundingBox();
  expect(graphicBox).not.toBeNull();
  expect(graphicBox!.height).toBeGreaterThan(100);
  expect(graphicBox!.height).toBeLessThan(160);

  await expect(page.locator('.post-interactive-graphic canvas')).toBeVisible();
  await expect(page.locator('.language-switch')).toHaveAttribute(
    'href',
    '/en/articles/luontoviisas-piha/'
  );

  expect(browserErrors).toEqual([]);
});
