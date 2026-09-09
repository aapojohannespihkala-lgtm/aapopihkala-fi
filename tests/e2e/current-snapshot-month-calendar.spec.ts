import { expect, test } from '@playwright/test';

test('Snapshot shows a compact month grid with today and ISO weeks marked', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:08:00.000Z'));

  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('https://api.open-meteo.com/**', async (route) => route.abort());
  await page.route('**/api/current/electricity*', async (route) => route.abort());
  await page.route('**/api/current/markets*', async (route) => route.abort());

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  const calendar = page.locator('[data-snapshot-month-calendar]');
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('[data-snapshot-month-calendar-day]')).toHaveCount(30);
  await expect(calendar.locator('.is-outside')).toHaveCount(5);
  await expect(calendar.locator('.snapshot-calendar__month-day').first()).toHaveText('·');
  await expect(calendar.locator('.snapshot-calendar__month-day')).toHaveCount(35);
  await expect(calendar.locator('.snapshot-calendar__month-day').last()).toBeVisible();
  await expect(calendar.locator('.snapshot-calendar__month-day').last()).toHaveText('·');

  const today = calendar.locator('[data-snapshot-month-calendar-today]');
  await expect(today).toHaveText('8');
  const todayStyle = await today.evaluate((element) => ({
    fontWeight: Number(getComputedStyle(element).fontWeight),
    markerContent: getComputedStyle(element, '::after').content,
  }));
  expect(todayStyle.fontWeight).toBeGreaterThanOrEqual(700);
  expect(todayStyle.markerContent).toBe('none');

  const weekNumbers = calendar.locator('[data-snapshot-month-week]');
  await expect(weekNumbers).toHaveCount(5);
  expect(await weekNumbers.allTextContents()).toEqual(['36', '37', '38', '39', '40']);

  const standaloneWeek = page.locator('[data-snapshot-calendar-week]');
  await expect(standaloneWeek).toHaveText('WEEK 37');
  const standaloneWeekBox = await standaloneWeek.boundingBox();
  expect(standaloneWeekBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(1);
  expect(standaloneWeekBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(1);

  for (const desktopViewport of [
    { width: 1536, height: 960 },
    { width: 1536, height: 650 },
  ]) {
    await page.setViewportSize(desktopViewport);
    const titleblockBox = await page.locator('.snapshot-titleblock').boundingBox();
    const desktopCalendarBox = await calendar.boundingBox();

    expect(titleblockBox).not.toBeNull();
    expect(desktopCalendarBox).not.toBeNull();
    expect((desktopCalendarBox?.y ?? Number.NEGATIVE_INFINITY)).toBeGreaterThanOrEqual(
      (titleblockBox?.y ?? Number.POSITIVE_INFINITY) + 4
    );
    expect(
      (desktopCalendarBox?.y ?? Number.POSITIVE_INFINITY) +
        (desktopCalendarBox?.height ?? Number.POSITIVE_INFINITY)
    ).toBeLessThanOrEqual(
      (titleblockBox?.y ?? Number.NEGATIVE_INFINITY) +
        (titleblockBox?.height ?? Number.NEGATIVE_INFINITY) -
        4
    );
  }
});
