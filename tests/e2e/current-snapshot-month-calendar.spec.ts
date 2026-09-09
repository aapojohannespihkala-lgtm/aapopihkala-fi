import { expect, test } from '@playwright/test';

test('Snapshot highlights only the current weekday and ISO week', async ({ page }) => {
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

  const weekdayStyle = await page.locator('[data-snapshot-calendar-weekday]').evaluate((element) => ({
    fontWeight: Number(getComputedStyle(element).fontWeight),
    color: getComputedStyle(element).color,
  }));
  expect(weekdayStyle.fontWeight).toBeGreaterThanOrEqual(700);

  const weekNumbers = calendar.locator('[data-snapshot-month-week]');
  await expect(weekNumbers).toHaveCount(5);
  expect(await weekNumbers.allTextContents()).toEqual(['36', '37', '38', '39', '40']);

  const currentWeek = calendar.locator('[data-snapshot-month-week].is-current-week');
  await expect(currentWeek).toHaveCount(1);
  await expect(currentWeek).toHaveText('37');
  await expect(calendar.locator('.snapshot-calendar__month-day.is-current-week')).toHaveCount(7);

  const [weekStyle, dayStyle, greyStyle, currentWeekBox, firstDayBox] = await Promise.all([
    currentWeek.evaluate((element) => ({
      fontFamily: getComputedStyle(element).fontFamily,
      fontSize: getComputedStyle(element).fontSize,
      color: getComputedStyle(element).color,
    })),
    today.evaluate((element) => ({
      fontFamily: getComputedStyle(element).fontFamily,
      fontSize: getComputedStyle(element).fontSize,
      color: getComputedStyle(element).color,
    })),
    calendar.locator('[data-snapshot-month-calendar-day="1"]').evaluate((element) => ({
      color: getComputedStyle(element).color,
    })),
    currentWeek.boundingBox(),
    calendar.locator('[data-snapshot-month-calendar-day="1"]').boundingBox(),
  ]);

  expect(weekStyle.fontFamily).toBe(dayStyle.fontFamily);
  expect(weekStyle.fontSize).toBe(dayStyle.fontSize);
  expect(weekStyle.color).not.toBe(greyStyle.color);
  expect(dayStyle.color).not.toBe(greyStyle.color);
  expect((currentWeekBox?.x ?? Number.POSITIVE_INFINITY) + (currentWeekBox?.width ?? 0)).toBeLessThanOrEqual(
    (firstDayBox?.x ?? Number.NEGATIVE_INFINITY) - 2,
  );

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
