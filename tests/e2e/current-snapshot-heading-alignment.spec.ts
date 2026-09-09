import { expect, test } from '@playwright/test';

test('mobile Snapshot headings share sizes and left-edge alignment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/current/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#snapshot-liiga-label')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const ids = [
      '#snapshot-weather-label',
      '#snapshot-electricity-label',
      '#snapshot-markets-label',
      '#snapshot-rates-label',
      '#snapshot-liiga-label',
    ];

    const sectionSizes = ids.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector)!;
      return Number.parseFloat(getComputedStyle(element).fontSize);
    });

    const metricSelectors = [
      '.snapshot-markets__median > span',
      '.snapshot-rates__label',
      '.snapshot-liiga__name',
    ];
    const metricSizes = metricSelectors.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector)!;
      return Number.parseFloat(getComputedStyle(element).fontSize);
    });

    const liigaHeading = document.querySelector<HTMLElement>('#snapshot-liiga-label')!;
    const liigaName = document.querySelector<HTMLElement>('.snapshot-liiga__name')!;
    const headingStyle = getComputedStyle(liigaHeading);
    const headingTextLeft = liigaHeading.getBoundingClientRect().left + Number.parseFloat(headingStyle.paddingLeft);
    const liigaNameLeft = liigaName.getBoundingClientRect().left;

    return {
      sectionSizes,
      metricSizes,
      liigaLeftDelta: Math.abs(liigaNameLeft - headingTextLeft),
      sectionTextAlign: ids.map((selector) => getComputedStyle(document.querySelector<HTMLElement>(selector)!).textAlign),
    };
  });

  expect(Math.max(...geometry.sectionSizes) - Math.min(...geometry.sectionSizes)).toBeLessThanOrEqual(0.1);
  expect(Math.max(...geometry.metricSizes) - Math.min(...geometry.metricSizes)).toBeLessThanOrEqual(0.1);
  expect(geometry.liigaLeftDelta).toBeLessThanOrEqual(2);
  expect(geometry.sectionTextAlign.every((value) => value === 'left' || value === 'start')).toBe(true);
});
