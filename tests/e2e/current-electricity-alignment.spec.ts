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
  const lowLabel = page.locator('[data-electricity-low-label]');
  await expect(lowLabel).toBeVisible();
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

  const inspectionLabel = page.locator('[data-electricity-inspection-label]');
  const inspectionLine = page.locator('[data-electricity-inspection-line]');
  const inspectionRange = page.locator('[data-electricity-inspection-range]');
  await expect(inspectionLabel).toHaveAttribute('opacity', '1');

  await expect.poll(async () =>
    page.evaluate(() => {
      const selectors = [
        '[data-electricity-low-label]',
        '[data-electricity-inspection-label]',
        '[data-electricity-high-label]',
      ];

      return selectors.every((selector) => {
        const group = document.querySelector<SVGGElement>(selector);
        const value = group?.querySelector<SVGTextElement>('text:first-of-type');
        const ranges = group?.querySelectorAll<SVGTextElement>('.electricity-chart__window-range');
        const separators = [
          value?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
          ranges?.[0]?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
          ranges?.[1]?.querySelector<SVGTSpanElement>('[data-alignment-role="separator"]'),
        ];
        const baselines = [
          Number(value?.getAttribute('y')),
          Number(ranges?.[0]?.getAttribute('y')),
          Number(ranges?.[1]?.getAttribute('y')),
        ];

        return (
          separators.every((node) => node?.getAttribute('x') === '0') &&
          baselines[0] === 11 &&
          baselines[1] === 21 &&
          baselines[2] === 31
        );
      });
    })
  ).toBe(true);

  const initialInspectionRange = await inspectionRange.getAttribute('data-full-clock-range');
  expect(initialInspectionRange).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);

  const chartMetrics = await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>('[data-electricity-chart]');
    const lowBand = svg?.querySelector<SVGRectElement>('[data-electricity-low-band]');
    const endLabel = [...(svg?.querySelectorAll<SVGTextElement>('.electricity-chart__axis-label') ?? [])]
      .find((node) => node.textContent?.trim() === '24');

    return {
      width: svg?.viewBox.baseVal.width ?? 0,
      lowX: Number(lowBand?.getAttribute('x')),
      lowWidth: Number(lowBand?.getAttribute('width')),
      plotRight: Number(endLabel?.getAttribute('x')),
    };
  });

  const moveInspectionToSvgX = async (svgX: number) => {
    const box = await chart.boundingBox();
    expect(box).not.toBeNull();
    if (!box || chartMetrics.width <= 0) return;

    await chart.dispatchEvent('pointermove', {
      pointerType: 'mouse',
      clientX: box.x + (svgX / chartMetrics.width) * box.width,
      clientY: box.y + box.height * 0.5,
    });
  };

  const expectInspectionCentered = async () => {
    await expect.poll(async () => {
      const lineX = Number(await inspectionLine.getAttribute('x1'));
      const transform = await inspectionLabel.getAttribute('transform');
      const labelX = Number(transform?.match(/translate\(([-\d.]+)/)?.[1]);
      return Math.abs(lineX - labelX);
    }).toBeLessThan(0.02);
  };

  const quarterWidth = chartMetrics.lowWidth / 8;
  expect(quarterWidth).toBeGreaterThan(0);

  await moveInspectionToSvgX(chartMetrics.lowX + quarterWidth / 2);
  await expectInspectionCentered();
  await expect(lowLabel).toHaveAttribute('opacity', '0');
  await expect.poll(async () => inspectionRange.getAttribute('data-full-clock-range')).not.toBe(initialInspectionRange);
  const lowInspectionRange = await inspectionRange.getAttribute('data-full-clock-range');

  await moveInspectionToSvgX(chartMetrics.lowX + chartMetrics.lowWidth + quarterWidth / 2);
  await expectInspectionCentered();
  await expect(lowLabel).toHaveAttribute('opacity', '1');
  await expect.poll(async () => inspectionRange.getAttribute('data-full-clock-range')).not.toBe(lowInspectionRange);

  await moveInspectionToSvgX(chartMetrics.plotRight - quarterWidth / 2);
  await expectInspectionCentered();

  const monthSummary = page.locator('[data-electricity-month-average]');
  await expect(monthSummary.locator(':scope > span')).toHaveCount(3);
  await expect(monthSummary.locator('.electricity-month-average__label')).toHaveText('SEP AVG');
  await expect(monthSummary.locator('.electricity-month-average__value')).toContainText('c/kWh');
  await expect(monthSummary.locator('.electricity-month-average__detail')).toHaveText('MONTH TO DATE');
});
