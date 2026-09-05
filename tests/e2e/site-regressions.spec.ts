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

  await expect(page.locator('[data-site-grid]')).toHaveCount(1);
  await expect(page.locator('header [data-site-grid]')).toHaveCount(0);

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
  expect(topographyBox!.height).toBeGreaterThan(280);
  expect(topographyBox!.height).toBeLessThan(320);

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

test('scroll readout follows scrolling and hides after idle', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const readout = page.locator('[data-scroll-readout]');
  const yLabel = page.locator('[data-scroll-y]');
  const percentLabel = page.locator('[data-scroll-percent]');

  await expect(readout).toHaveAttribute(
    'data-scroll-readout-initialized',
    'true',
    { timeout: 10_000 }
  );

  await page.evaluate(() => {
    const maximum = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    window.scrollTo(0, Math.min(600, maximum));
  });

  await expect(readout).toHaveClass(/is-visible/);
  await expect(yLabel).toHaveText(/^Y \d{4,}$/);
  await expect(percentLabel).toHaveText(/^\d+%$/);
  await expect(readout).not.toHaveClass(/is-visible/, { timeout: 2_500 });

  expect(browserErrors).toEqual([]);
});

test('grid overlay follows the A-mode cycle without changing other modes', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const grid = page.locator('[data-site-grid]');
  const aReadout = page.locator('[data-a-readout]');

  await expect(grid).toHaveAttribute(
    'data-grid-interaction-initialized',
    'true',
    { timeout: 10_000 }
  );
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(aReadout).toHaveAttribute('data-mode', 'cross');
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(aReadout).toHaveAttribute('data-mode', 'elev');
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(aReadout).toHaveAttribute('data-mode', 'grid');
  await expect(grid).toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(aReadout).toHaveAttribute('data-mode', 'area');
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('Escape');
  await expect(aReadout).toHaveAttribute('data-mode', '');
  await expect(grid).not.toHaveClass(/is-visible/);

  expect(browserErrors).toEqual([]);
});

test('about portrait loads, pauses offscreen and preserves its main frame geometry', async ({ page }) => {
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

  const portraitRoot = page.locator('[data-meshy-point-surface]');
  const status = page.locator('[data-meshy-point-surface-status]');
  await expect(status).toBeHidden({ timeout: 45_000 });
  await expect(portraitRoot).toHaveAttribute(
    'data-meshy-point-surface-load-state',
    'ready',
    { timeout: 45_000 }
  );
  await expect(portraitRoot).toHaveAttribute(
    'data-meshy-point-surface-render-state',
    'active',
    { timeout: 10_000 }
  );

  await portraitRoot.evaluate((element) => {
    (element as HTMLElement).style.display = 'none';
  });
  await expect(portraitRoot).toHaveAttribute(
    'data-meshy-point-surface-render-state',
    'paused',
    { timeout: 10_000 }
  );
  await portraitRoot.evaluate((element) => {
    (element as HTMLElement).style.removeProperty('display');
  });
  await expect(portraitRoot).toHaveAttribute(
    'data-meshy-point-surface-render-state',
    'active',
    { timeout: 10_000 }
  );

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