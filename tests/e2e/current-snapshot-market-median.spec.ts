import { expect, test } from '@playwright/test';

// Product intent: the Snapshot headline and supporting medians represent all portfolio rows from
// the Markets page, even though Snapshot displays only a selected subset as individual rows.
test('calculates Snapshot medians from all Markets portfolio items', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
    } catch {
      // Storage may be unavailable before the page origin is established.
    }
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/current/markets' && url.searchParams.get('portfolio') === '1') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'ishares-world', changes: { today: 0.4, month1: 2, year1: 10 } },
            { id: 'handelsbanken-usa', changes: { today: 0.7, month1: 4, year1: 20 } },
            { id: 'nordnet-finland', changes: { today: -0.2, month1: -1, year1: -5 } },
            { id: 'btc', changes: { today: 1.8, month1: 5, year1: 40 } },
            { id: 'remedy', changes: { today: -0.6, month1: -3, year1: -10 } },
            { id: 'not-displayed', changes: { today: -10, month1: -20, year1: -50 } },
          ],
        }),
      });
      return;
    }

    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  const headline = page.locator('[data-snapshot-market-median]');
  const details = page.locator('[data-snapshot-market-median-details]');
  const month = page.locator('[data-snapshot-market-median-month]');
  const year = page.locator('[data-snapshot-market-median-year]');
  const referenceRow = page.locator('.snapshot-panel--rates .snapshot-rates__change');
  const referenceValue = page.locator('[data-snapshot-euribor-change]');

  await expect(headline).toHaveText('+0.10%');
  await expect(month).toHaveText('+0.50%');
  await expect(year).toHaveText('+2.50%');
  await expect(page.locator('[data-snapshot-market="ishares-world"]')).toHaveText('+0.40%');
  await expect(page.locator('[data-snapshot-market="remedy"]')).toHaveText('-0.60%');

  const [
    headlineSize,
    headlineColor,
    detailsSize,
    detailsColor,
    referenceSize,
    referenceColor,
    monthSize,
    monthWeight,
    monthColor,
    yearSize,
    yearWeight,
    yearColor,
    referenceValueSize,
    referenceValueWeight,
  ] = await Promise.all([
    headline.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    headline.evaluate((element) => getComputedStyle(element).color),
    details.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    details.evaluate((element) => getComputedStyle(element).color),
    referenceRow.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    referenceRow.evaluate((element) => getComputedStyle(element).color),
    month.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    month.evaluate((element) => getComputedStyle(element).fontWeight),
    month.evaluate((element) => getComputedStyle(element).color),
    year.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    year.evaluate((element) => getComputedStyle(element).fontWeight),
    year.evaluate((element) => getComputedStyle(element).color),
    referenceValue.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    referenceValue.evaluate((element) => getComputedStyle(element).fontWeight),
  ]);

  expect(detailsSize).toBe(referenceSize);
  expect(detailsColor).toBe(referenceColor);
  expect(monthSize).toBe(referenceValueSize);
  expect(yearSize).toBe(referenceValueSize);
  expect(monthWeight).toBe(referenceValueWeight);
  expect(yearWeight).toBe(referenceValueWeight);
  expect(monthColor).toBe(headlineColor);
  expect(yearColor).toBe(headlineColor);
  expect(monthSize).toBeLessThan(headlineSize * 0.5);
  expect(yearSize).toBeLessThan(headlineSize * 0.5);
});
