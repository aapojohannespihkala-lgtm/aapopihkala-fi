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
  await expect(page.locator('[data-area-overlay]')).toHaveAttribute(
    'data-area-polish',
    'true'
  );
  await expect(page.locator('[data-area-raster-surface]')).toHaveCount(1);

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

test('homepage hero keeps the intended desktop line breaks in both languages', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);

  for (const [path, expectedWord] of [
    ['/', 'luonnon'],
    ['/en/', 'cities,'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const secondary = page.locator('.hero-secondary');
    await expect(secondary).toHaveClass(/hero-concepts-ready/, { timeout: 10_000 });

    const lineBreak = secondary.locator('br.hero-concept-line-break');
    await expect(lineBreak).toHaveCount(1);

    const breakState = await lineBreak.evaluate((element) => ({
      previousText: element.previousSibling?.textContent?.trim() ?? '',
      display: window.getComputedStyle(element).display,
    }));

    expect(breakState.previousText).toBe(expectedWord);
    expect(breakState.display).not.toBe('none');
  }

  expect(browserErrors).toEqual([]);
});

test('homepage section navigator shows a back-to-top label at the page end', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const button = page.locator('[data-homepage-section-nav]');
  await expect(button).toHaveAttribute('data-label-top', 'Takaisin sivun alkuun');

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

  await expect(button).toHaveClass(/is-up/, { timeout: 10_000 });

  const pseudo = await button.evaluate((element) => {
    const style = window.getComputedStyle(element, '::after');
    return {
      content: style.content,
      opacity: Number(style.opacity),
    };
  });

  expect(pseudo.content).toContain('Takaisin sivun alkuun');
  expect(pseudo.opacity).toBeGreaterThan(0);

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

test('legacy shortcuts keep blocked keys and the Lab shortcut', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const readout = page.locator('[data-a-readout]');
  const grid = page.locator('[data-site-grid]');

  await expect(readout).toHaveAttribute(
    'data-site-shortcuts-initialized',
    'true',
    { timeout: 10_000 }
  );
  await expect(readout).toHaveAttribute('data-mode', '');
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('g');
  await expect(readout).toHaveAttribute('data-mode', '');
  await expect(grid).not.toHaveClass(/is-visible/);

  await page.keyboard.press('l');
  await expect(page).toHaveURL(/\/lab\/$/);

  expect(browserErrors).toEqual([]);
});

test('article date format toggle preserves click and keyboard behavior', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/artikkelit/luontoviisas-piha/', {
    waitUntil: 'domcontentloaded',
  });

  const date = page.locator('time.post-date').first();

  await expect(date).toHaveAttribute(
    'data-date-easter-egg',
    'true',
    { timeout: 10_000 }
  );
  await expect(date).toHaveAttribute('role', 'button');
  await expect(date).toHaveAttribute('title', 'Toggle date format');

  const originalDate = await date.textContent();
  const datetime = await date.getAttribute('datetime');
  expect(originalDate).not.toBeNull();
  expect(datetime).not.toBeNull();
  const isoDate = datetime!.slice(0, 10);

  await date.click();
  await expect(date).toHaveText(isoDate);

  await date.press('Enter');
  await expect(date).toHaveText(originalDate!);

  await date.press('Space');
  await expect(date).toHaveText(isoDate);

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
  await expect(grid).not.toHaveClass(/is-visible/);

  expect(browserErrors).toEqual([]);
});

test('A coordinate runtime preserves mode order and returns to the default cursor', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const readout = page.locator('[data-a-readout]');
  const label = page.locator('[data-a-readout-label]');
  const axis = page.locator('[data-a-axis]');
  const areaOverlay = page.locator('[data-area-overlay]');
  const rectOverlay = page.locator('[data-rect-area]');
  const body = page.locator('body');

  await expect(readout).toHaveAttribute(
    'data-a-coordinate-interaction-initialized',
    'true',
    { timeout: 10_000 }
  );
  await expect(readout).toHaveAttribute('data-mode', '');
  await expect(body).not.toHaveClass(/site-a-mode/);

  await page.mouse.move(400, 450);

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'cross');
  await expect(readout).toHaveClass(/is-visible/);
  await expect(axis).not.toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'elev');
  await expect(axis).toHaveClass(/is-visible/);
  await expect(label).toHaveText('X 0400 / Y 0450 / ELEV +15.0');

  await page.mouse.move(246, 321);
  await expect(label).toHaveText('X 0246 / Y 0321 / ELEV +19.3');

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'grid');
  await expect(axis).toHaveClass(/is-visible/);
  await expect(label).toHaveText('X 0246 / Y 0321 / ELEV +19.3');

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'area');
  await expect(axis).not.toHaveClass(/is-visible/);
  await expect(areaOverlay).toHaveClass(/is-visible/);

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'rect');
  await expect(readout).toHaveClass(/is-visible/);
  await expect(areaOverlay).not.toHaveClass(/is-visible/);
  await expect(rectOverlay).toHaveClass(/is-visible/);
  await expect(body).toHaveClass(/site-a-mode/);

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', '');
  await expect(readout).not.toHaveClass(/is-visible/);
  await expect(rectOverlay).not.toHaveClass(/is-visible/);
  await expect(areaOverlay).not.toHaveClass(/is-visible/);
  await expect(body).not.toHaveClass(/site-a-mode/);

  const cursor = await body.evaluate((element) => window.getComputedStyle(element).cursor);
  expect(cursor).not.toBe('none');

  await page.keyboard.press('a');
  await expect(readout).toHaveAttribute('data-mode', 'cross');

  expect(browserErrors).toEqual([]);
});

test('AREA runtime preserves polygon topography and drag rotation', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const readout = page.locator('[data-a-readout]');
  const overlay = page.locator('[data-area-overlay]');
  const areaPath = page.locator('[data-area-path]');
  const label = page.locator('[data-area-label]');
  const hint = page.locator('[data-area-hint]');
  const points = page.locator('[data-area-points] .site-area-point');
  const contours = page.locator('[data-area-contours]');
  const centroid = page.locator('[data-area-centroid-symbol]');
  const rasterSurface = page.locator('[data-area-raster-surface]');
  const rasterPlane = page.locator('[data-area-raster-plane]');
  const rasterImage = page.locator('[data-area-raster-image]');

  await expect(overlay).toHaveAttribute(
    'data-area-interaction-initialized',
    'true',
    { timeout: 10_000 }
  );

  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press('a');
  }

  await expect(readout).toHaveAttribute('data-mode', 'area');
  await expect(overlay).toHaveClass(/is-visible/);

  await page.mouse.move(420, 260);
  await page.mouse.down();
  for (const [x, y] of [
    [500, 270],
    [560, 330],
    [550, 410],
    [490, 470],
    [400, 475],
    [335, 420],
    [325, 340],
    [370, 285],
    [420, 260],
  ] as const) {
    await page.mouse.move(x, y);
  }
  await page.mouse.up();

  await expect(areaPath).toHaveAttribute('d', / Z$/);
  await expect(label).toHaveText(/^AREA \/ \d+ px²$/);
  await expect(hint).toHaveText('AREA / HOLD + DRAW NEW');
  await expect(centroid).toHaveClass(/is-visible/);
  await expect.poll(() => points.count()).toBeGreaterThan(20);
  await expect(contours).not.toHaveAttribute('d', '');
  await expect(rasterSurface).toHaveClass(/is-visible/, { timeout: 20_000 });
  await expect(rasterImage).toHaveAttribute('src', /^data:image\/png;base64,/, {
    timeout: 20_000,
  });

  const pathBeforeRotation = await areaPath.getAttribute('d');
  expect(pathBeforeRotation).not.toBeNull();
  const rasterTransformBeforeRotation = await rasterPlane.evaluate(
    (element) => (element as HTMLElement).style.transform
  );

  await page.mouse.move(440, 365);
  await expect(overlay).toHaveClass(/is-hovering-area/);
  await expect(hint).toHaveText('AREA / DRAG TO ROTATE RASTER SURFACE');
  await page.mouse.down();
  await expect(overlay).toHaveClass(/is-rotating-area/);
  await page.mouse.move(500, 330);
  await expect(hint).toHaveText(/^AREA \/ X -?\d+\.\d° \/ Y -?\d+\.\d°$/);
  await expect
    .poll(() => areaPath.getAttribute('d'))
    .not.toBe(pathBeforeRotation);
  await expect
    .poll(() =>
      rasterPlane.evaluate(
        (element) => (element as HTMLElement).style.transform
      )
    )
    .not.toBe(rasterTransformBeforeRotation);
  await page.mouse.up();
  await expect(overlay).not.toHaveClass(/is-rotating-area/);
  await expect(hint).toHaveText('AREA / DRAG TO ROTATE RASTER SURFACE');

  expect(browserErrors).toEqual([]);
});

test('about portrait loads, pauses offscreen and preserves its main frame geometry', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);
  await setDayMode(page);
  await page.goto('/about/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-area-overlay]')).toHaveAttribute(
    'data-area-polish',
    'false'
  );
  await expect(page.locator('[data-area-raster-surface]')).toHaveCount(0);

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

  await expect(page.locator('[data-area-overlay]')).toHaveAttribute(
    'data-area-polish',
    'true'
  );
  await expect(page.locator('[data-area-raster-surface]')).toHaveCount(1);

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
