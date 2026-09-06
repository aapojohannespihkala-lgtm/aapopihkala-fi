import { expect, test, type Locator, type Page } from '@playwright/test';

const preparePage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('aapopihkala-night-mode', 'day');
      window.localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  });
};

const expectMinimumTargetSize = async (target: Locator) => {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();

  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(24);
  expect(box!.height).toBeGreaterThanOrEqual(24);
};

test('skip navigation moves keyboard focus to the main landmark', async ({ page }) => {
  await preparePage(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const skipLink = page.getByRole('link', { name: 'Siirry pääsisältöön' });
  const main = page.locator('main#main-content');

  await expect(main).toHaveCount(1);
  await expect(main).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(main).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/);
});

test('header controls keep accessible names and explicit 24px targets', async ({ page }) => {
  await preparePage(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const skipLink = page.getByRole('link', { name: 'Siirry pääsisältöön' });
  const navigation = page.getByRole('navigation', { name: 'Päänavigaatio' });
  const home = page.getByRole('link', { name: 'Aapo Pihkalan etusivu' });
  const nightMode = page.getByRole('button', { name: 'Yötila' });
  const language = page.getByRole('link', { name: 'English' });
  const linkedin = page.getByRole('link', { name: 'Aapo Pihkala LinkedInissä' });

  await expect(navigation).toBeVisible();
  await expect(page.locator('.topbar-actions [data-night-mode-toggle]')).toHaveCount(1);

  for (const target of [home, nightMode, language, linkedin]) {
    await expectMinimumTargetSize(target);
  }

  await expect(nightMode).toHaveAttribute('aria-pressed', 'false');

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nightMode).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(language).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(linkedin).toBeFocused();
});

test('About and article pages expose the shared main content target', async ({ page }) => {
  await preparePage(page);

  for (const path of ['/about/', '/artikkelit/luontoviisas-piha/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const main = page.locator('main#main-content');
    await expect(main).toHaveCount(1);
    await expect(main).toHaveAttribute('tabindex', '-1');
  }
});

test('analytics consent controls keep explicit 24px targets', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('aapopihkala-night-mode', 'day');
      window.localStorage.removeItem('aapopihkala-analytics-consent-v1');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const consent = page.getByRole('region', { name: 'Analytiikan suostumus' });
  const accept = page.getByRole('button', { name: 'Hyväksy analytiikka' });
  const reject = page.getByRole('button', { name: 'Vain välttämättömät' });

  await expect(consent).toBeVisible();
  await expectMinimumTargetSize(accept);
  await expectMinimumTargetSize(reject);

  await reject.click();

  const settings = page.getByRole('button', { name: 'Analytiikka-asetukset' });
  await expectMinimumTargetSize(settings);

  await settings.click();
  await expect(consent).toBeVisible();
});

test('English header keeps localized navigation names', async ({ page }) => {
  await preparePage(page);
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aapo Pihkala homepage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Night mode' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Suomeksi' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aapo Pihkala on LinkedIn' })).toBeVisible();
});
