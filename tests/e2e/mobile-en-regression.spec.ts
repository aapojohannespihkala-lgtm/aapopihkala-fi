import { expect, test, type Locator, type Page } from '@playwright/test';

const mobileViewport = {
  width: 390,
  height: 844,
};

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

const expectContainedInMobileViewport = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(mobileViewport.width + 1);
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await setDayMode(page);
});

test('mobile homepage keeps the intended FI and EN layout contracts', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);

  for (const route of [
    {
      path: '/',
      lang: 'fi',
      primary: 'Maisema-arkkitehti.',
      languageHref: '/en/',
      backToTop: 'Takaisin sivun alkuun',
    },
    {
      path: '/en/',
      lang: 'en',
      primary: 'Landscape architect.',
      languageHref: '/',
      backToTop: 'Back to top',
    },
  ] as const) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Aapo Pihkala' })
    ).toBeVisible();
    await expect(page.locator('.hero-primary')).toContainText(route.primary);
    await expect(page.locator('.language-switch')).toHaveAttribute(
      'href',
      route.languageHref
    );

    const heroContent = page.locator('.hero-content');
    await expect(heroContent).toBeVisible();
    await expectContainedInMobileViewport(heroContent);

    await expect(page.locator('.hero-art')).toBeHidden();

    const forcedBreak = page.locator('.hero-secondary br.hero-concept-line-break');
    await expect(forcedBreak).toHaveCount(1);
    await expect
      .poll(() =>
        forcedBreak.evaluate((element) => window.getComputedStyle(element).display)
      )
      .toBe('none');

    await expect(page.locator('[data-homepage-section-nav]')).toHaveAttribute(
      'data-label-top',
      route.backToTop
    );
  }

  expect(browserErrors).toEqual([]);
});

test('mobile About routes keep the portrait frame contained and localized', async ({ page }) => {
  test.setTimeout(90_000);
  const browserErrors = watchBrowserErrors(page);

  for (const route of [
    {
      path: '/about/',
      lang: 'fi',
      title: 'Tietoa minusta',
      languageHref: '/en/about/',
    },
    {
      path: '/en/about/',
      lang: 'en',
      title: 'About me',
      languageHref: '/about/',
    },
  ] as const) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(
      page.getByRole('heading', { level: 1, name: route.title })
    ).toBeVisible();
    await expect(page.locator('.language-switch')).toHaveAttribute(
      'href',
      route.languageHref
    );

    const frame = page.locator('[data-about-portrait-frame]');
    await frame.scrollIntoViewIfNeeded();
    await expect(frame).toBeVisible();
    await expectContainedInMobileViewport(frame);

    const frameBox = await frame.boundingBox();
    expect(frameBox).not.toBeNull();
    expect(frameBox!.width).toBeGreaterThan(300);
    expect(frameBox!.height).toBeGreaterThanOrEqual(360);
  }

  expect(browserErrors).toEqual([]);
});

test('mobile English article route keeps localized navigation and content anchors', async ({ page }) => {
  const browserErrors = watchBrowserErrors(page);

  await page.goto('/en/articles/luontoviisas-piha/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.language-switch')).toHaveAttribute(
    'href',
    '/artikkelit/luontoviisas-piha/'
  );
  await expect(page.locator('.post-title')).toBeVisible();
  await expect(page.locator('.post-news')).toBeVisible();
  await expect(page.locator('.post-interactive-graphic')).toBeVisible();

  await expectContainedInMobileViewport(page.locator('.main-container'));

  expect(browserErrors).toEqual([]);
});
