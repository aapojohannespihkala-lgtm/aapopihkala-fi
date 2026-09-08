import { expect, test } from '@playwright/test';

const electricityFixture = (() => {
  const localMidnightUtc = Date.UTC(2026, 7, 31, 21, 0, 0);
  return {
    prices: Array.from({ length: 96 }, (_, index) => {
      const start = new Date(localMidnightUtc + index * 15 * 60 * 1000);
      const end = new Date(start.getTime() + 15 * 60 * 1000 - 1000);
      const price = index < 8 ? 0.16 : index >= 75 && index < 83 ? 7.71 : 0.45 + index * 0.01;
      return {
        price,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }).reverse(),
  };
})();

test('aligns electricity decimal points and clock colons on one annotation axis', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-01T09:07:00.000Z'));
  await page.setViewportSize({ width: 390, height: 844 });

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

  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(electricityFixture),
    });
  });

  await page.route('**/api/current/markets*', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const chart = page.locator('[data-electricity-chart]');
  await expect(page.locator('[data-electricity-low-label]')).toBeVisible();
  await expect(page.locator('[data-electricity-high-label]')).toBeVisible();

  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();
  if (chartBox) {
    await chart.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 31,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.5,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
    await chart.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 31,
      isPrimary: true,
      clientX: chartBox.x + chartBox.width * 0.5,
      clientY: chartBox.y + chartBox.height * 0.5,
    });
  }

  await expect(page.locator('[data-electricity-inspection-label]')).toHaveAttribute('opacity', '1');

  const alignment = await page.evaluate(() => {
    const readGroup = (selector: string) => {
      const group = document.querySelector<SVGGElement>(selector);
      const value = group?.querySelector<SVGTextElement>('text:first-of-type');
      const ranges = group?.querySelectorAll<SVGTextElement>('.electricity-chart__window-range');
      const separators = [
        value?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
        ranges?.[0]?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
        ranges?.[1]?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
      ];

      return {
        separatorX: separators.map((node) => Number(node?.getAttribute('x'))),
        baselines: [
          Number(value?.getAttribute('y')),
          Number(ranges?.[0]?.getAttribute('y')),
          Number(ranges?.[1]?.getAttribute('y')),
        ],
      };
    };

    return {
      low: readGroup('[data-electricity-low-label]'),
      inspection: readGroup('[data-electricity-inspection-label]'),
      high: readGroup('[data-electricity-high-label]'),
    };
  });

  for (const group of [alignment.low, alignment.inspection, alignment.high]) {
    expect(group.separatorX).toEqual([0, 0, 0]);
    expect(group.baselines).toEqual([11, 21, 31]);
  }

  const monthSummary = page.locator('[data-electricity-month-average]');
  await expect(monthSummary.locator(':scope > span')).toHaveCount(3);
  await expect(monthSummary.locator('.electricity-month-average__label')).toHaveText('SEP AVG');
  await expect(monthSummary.locator('.electricity-month-average__value')).toContainText('c/kWh');
  await expect(monthSummary.locator('.electricity-month-average__detail')).toHaveText('MONTH TO DATE');
});
