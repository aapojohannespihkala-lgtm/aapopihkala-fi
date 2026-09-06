import { expect, test } from '@playwright/test';

const PROFILE_KEY = 'current.news.profile.v1';
const DAILY_KEY = 'current.news.daily.v1';
const RESET_MARKER = 'current.news.test.storage-reset';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ profileKey, dailyKey, resetMarker }) => {
      if (window.sessionStorage.getItem(resetMarker) === 'true') return;
      window.localStorage.removeItem(profileKey);
      window.localStorage.removeItem(dailyKey);
      window.sessionStorage.setItem(resetMarker, 'true');
    },
    { profileKey: PROFILE_KEY, dailyKey: DAILY_KEY, resetMarker: RESET_MARKER }
  );
});

test('standalone Current News learns locally and replaces both positive and negative ratings', async ({
  page,
}) => {
  await page.goto('/current/news/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('News');
  await expect(page.locator('a.current-news-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.getByText('LOCAL PROTOTYPE / SEED POOL')).toHaveCount(1);
  await expect(page.locator('[data-news-slot]')).toHaveCount(3);
  await expect(page.locator('[data-news-debug-pool]')).toHaveText('18');
  await expect(page.locator('[data-news-debug-up]')).toHaveText('0');
  await expect(page.locator('[data-news-debug-down]')).toHaveText('0');

  const firstSlot = page.locator('[data-news-slot]').nth(0);
  const firstId = await firstSlot.getAttribute('data-news-item-id');
  const firstTitle = await firstSlot.locator('[data-news-title]').textContent();

  await firstSlot.locator('[data-news-feedback="up"]').click();

  await expect(firstSlot).not.toHaveAttribute('data-news-item-id', firstId ?? '');
  await expect(firstSlot.locator('[data-news-title]')).not.toHaveText(firstTitle ?? '');
  await expect(page.locator('[data-news-debug-up]')).toHaveText('1');
  await expect(page.locator('[data-news-debug-seen]')).toHaveText('1');

  const replacementId = await firstSlot.getAttribute('data-news-item-id');
  expect(replacementId).not.toBeNull();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-news-slot]').nth(0)).toHaveAttribute(
    'data-news-item-id',
    replacementId ?? ''
  );
  await expect(page.locator('[data-news-debug-up]')).toHaveText('1');

  const secondSlot = page.locator('[data-news-slot]').nth(1);
  const secondId = await secondSlot.getAttribute('data-news-item-id');
  await secondSlot.locator('[data-news-feedback="down"]').click();

  await expect(secondSlot).not.toHaveAttribute('data-news-item-id', secondId ?? '');
  await expect(page.locator('[data-news-debug-down]')).toHaveText('1');
  await expect(page.locator('[data-news-debug-seen]')).toHaveText('2');

  const stored = await page.evaluate(
    ({ profileKey, dailyKey }) => ({
      profile: window.localStorage.getItem(profileKey),
      daily: window.localStorage.getItem(dailyKey),
    }),
    { profileKey: PROFILE_KEY, dailyKey: DAILY_KEY }
  );
  expect(stored.profile).not.toBeNull();
  expect(stored.daily).not.toBeNull();

  await page.locator('.news-debug').evaluate((element) => {
    (element as HTMLDetailsElement).open = true;
  });
  await expect(page.locator('[data-news-debug-signal]')).not.toHaveCount(0);
});

test('Current News reset clears local learning and stays inside a 390 px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/news/', { waitUntil: 'domcontentloaded' });

  await page.locator('[data-news-slot]').first().locator('[data-news-feedback="up"]').click();
  await expect(page.locator('[data-news-debug-up]')).toHaveText('1');

  await page.locator('.news-debug').evaluate((element) => {
    (element as HTMLDetailsElement).open = true;
  });
  await page.locator('[data-news-reset]').click();

  await expect(page.locator('[data-news-debug-up]')).toHaveText('0');
  await expect(page.locator('[data-news-debug-down]')).toHaveText('0');
  await expect(page.locator('[data-news-debug-seen]')).toHaveText('0');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
