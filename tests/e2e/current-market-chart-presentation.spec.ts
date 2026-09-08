import { expect, test } from '@playwright/test';

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-07' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-07',
      change1y: 0.635,
      points: [
        { observedAt: '2025-09-08', value: 2.0 },
        { observedAt: '2026-03-08', value: 2.35 },
        { observedAt: '2026-09-07', value: 2.679 },
      ],
    },
    {
      id: 'world',
      value: 180,
      observedAt: '2026-09-04',
      change1y: 18.93,
      points: [
        { observedAt: '2025-09-05', value: 150 },
        { observedAt: '2026-03-04', value: 162 },
        { observedAt: '2026-09-04', value: 180 },
      ],
    },
  ],
};

test('Current market charts keep runtime SVG paths unfilled and inspection markers circular', async ({ page }) => {
  await page.route('**/api/current/markets*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(macroFixture),
    });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });

  const svg = page.locator('[data-current-section="rates"] [data-market-sparkline="euribor-3m"]');
  const path = svg.locator('[data-market-line]');

  await expect(svg).toBeVisible();
  await expect(path).toHaveAttribute('d', /^M/);

  const geometry = await svg.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const viewBox = node.viewBox.baseVal;
    const pathNode = node.querySelector<SVGPathElement>('[data-market-line]');
    return {
      renderedWidth: rect.width,
      viewBoxWidth: viewBox.width,
      fill: pathNode ? getComputedStyle(pathNode).fill : '',
      stroke: pathNode ? getComputedStyle(pathNode).stroke : '',
    };
  });

  expect(Math.abs(geometry.renderedWidth - geometry.viewBoxWidth)).toBeLessThanOrEqual(1.5);
  expect(geometry.fill).toBe('none');
  expect(geometry.stroke).not.toBe('none');

  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await svg.dispatchEvent('pointerdown', {
      pointerType: 'mouse',
      pointerId: 1,
      isPrimary: true,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
    });
  }

  await expect(svg.locator('[data-market-annotation]')).toHaveAttribute('opacity', '1');
  await expect(svg.locator('[data-market-inspection-point]')).toHaveAttribute('opacity', '1');

  const markerBox = await svg.locator('[data-market-inspection-point]').boundingBox();
  expect(markerBox).not.toBeNull();
  if (markerBox) {
    expect(Math.abs(markerBox.width - markerBox.height)).toBeLessThanOrEqual(0.75);
  }
});
