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

const enableReducedMotion = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setDayMode(page);
};

test('reduced motion applies the current global CSS contract', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await enableReducedMotion(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    )
    .toBe(true);

  const globalMotionState = await page.evaluate(() => {
    const html = window.getComputedStyle(document.documentElement);
    const languageSwitch = document.querySelector('.language-switch');
    const heroLinkedIn = document.querySelector('.hero-linkedin');

    return {
      scrollBehavior: html.scrollBehavior,
      languageTransitionDuration: languageSwitch
        ? window.getComputedStyle(languageSwitch).transitionDuration
        : null,
      heroLinkedInTransitionDuration: heroLinkedIn
        ? window.getComputedStyle(heroLinkedIn).transitionDuration
        : null,
    };
  });

  expect(globalMotionState.scrollBehavior).toBe('auto');
  expect(globalMotionState.languageTransitionDuration).toBe('0s');
  expect(globalMotionState.heroLinkedInTransitionDuration).toBe('0s');

  await page.goto('/artikkelit/luontoviisas-piha/', {
    waitUntil: 'domcontentloaded',
  });

  const articleLinkTransition = await page
    .locator('.post-news-link')
    .evaluate((element) => window.getComputedStyle(element).transitionDuration);
  expect(articleLinkTransition).toBe('0s');

  expect(browserErrors).toEqual([]);
});

test('reduced motion freezes MorphingTopography idle motion but keeps manual orbit', async ({ page }) => {
  test.setTimeout(90_000);

  const browserErrors = watchBrowserErrors(page);
  await enableReducedMotion(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const root = page.locator('[data-morphing-topography]');
  const canvas = page.locator('[data-morphing-topography-canvas]');

  await expect(root).toHaveAttribute('data-auto-rotate', 'true');
  await expect(root).toHaveAttribute('data-morph', 'true');
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

  await page.waitForTimeout(300);
  const frameBeforeIdle = await canvas.screenshot();
  await page.waitForTimeout(900);
  const frameAfterIdle = await canvas.screenshot();
  expect(frameAfterIdle.equals(frameBeforeIdle)).toBe(true);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 70, centerY - 30, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(150);

  const frameAfterDrag = await canvas.screenshot();
  expect(frameAfterDrag.equals(frameAfterIdle)).toBe(false);

  expect(browserErrors).toEqual([]);
});

test('reduced motion freezes portrait idle sway but keeps manual orbit', async ({ page }) => {
  test.setTimeout(90_000);

  const browserErrors = watchBrowserErrors(page);
  await enableReducedMotion(page);
  await page.goto('/about/', { waitUntil: 'domcontentloaded' });

  const frame = page.locator('[data-about-portrait-frame]');
  const root = page.locator('[data-meshy-point-surface]');
  const canvas = page.locator('[data-meshy-point-surface-canvas]');
  const status = page.locator('[data-meshy-point-surface-status]');
  const probe = page.locator('[data-meshy-surface-probe]');
  const probePrimary = page.locator('[data-meshy-surface-probe-primary]');
  const probeSecondary = page.locator('[data-meshy-surface-probe-secondary]');

  await frame.scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute('data-enable-idle-motion', 'true');
  await expect(status).toBeHidden({ timeout: 45_000 });
  await expect(root).toHaveAttribute(
    'data-meshy-point-surface-load-state',
    'ready',
    { timeout: 45_000 }
  );
  await expect(root).toHaveAttribute(
    'data-meshy-point-surface-render-state',
    'active',
    { timeout: 10_000 }
  );
  await expect(canvas).toBeVisible();

  await expect
    .poll(() =>
      probe.evaluate((element) =>
        window.getComputedStyle(element).transitionDuration
      )
    )
    .toBe('0s');

  await page.waitForTimeout(300);
  const frameBeforeIdle = await canvas.screenshot();
  await page.waitForTimeout(1200);
  const frameAfterIdle = await canvas.screenshot();
  expect(frameAfterIdle.equals(frameBeforeIdle)).toBe(true);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box!.x + box!.width * 0.5;
  const centerY = box!.y + box!.height * 0.5;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 70, centerY - 35, { steps: 6 });

  await expect(probePrimary).toHaveText('ORBIT / MANUAL');
  await expect(probeSecondary).toHaveText(/^H [+-]\d+\.\d° \/ V [+-]\d+\.\d°$/);

  await page.mouse.up();
  await page.waitForTimeout(150);
  const frameAfterDrag = await canvas.screenshot();
  expect(frameAfterDrag.equals(frameAfterIdle)).toBe(false);

  expect(browserErrors).toEqual([]);
});
