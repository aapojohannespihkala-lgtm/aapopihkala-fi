import { expect, test } from '@playwright/test';
import { getSolarOrbitGeometry } from '../../src/features/current/weather';
import {
  projectSolarDisplayEllipse,
  projectSolarDisplayY,
  SOLAR_VERTICAL_EXAGGERATION,
} from '../../src/features/current/solarPresentation';

const weatherFixture = {
  current: {
    time: '2026-09-08T19:00',
    temperature_2m: 16.3,
    weather_code: 3,
    is_day: 1,
  },
  hourly: {
    time: [
      '2026-09-08T20:00',
      '2026-09-08T21:00',
      '2026-09-08T22:00',
      '2026-09-08T23:00',
      '2026-09-09T00:00',
      '2026-09-09T01:00',
    ],
    temperature_2m: [16, 17, 17, 16, 16, 16],
    precipitation_probability: [91, 88, 83, 76, 65, 45],
    weather_code: [61, 3, 3, 61, 61, 3],
    is_day: [1, 0, 0, 0, 0, 0],
  },
  daily: {
    time: [
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ],
    weather_code: [3, 61, 61, 61, 2, 61],
    temperature_2m_min: [15, 14, 13, 12, 12, 11],
    temperature_2m_max: [17, 17, 17, 16, 16, 16],
    precipitation_probability_max: [91, 94, 73, 59, 31, 40],
    sunrise: [
      '2026-09-08T06:32',
      '2026-09-09T06:35',
      '2026-09-10T06:38',
      '2026-09-11T06:41',
      '2026-09-12T06:44',
      '2026-09-13T06:47',
    ],
    sunset: [
      '2026-09-08T20:05',
      '2026-09-09T20:02',
      '2026-09-10T19:59',
      '2026-09-11T19:56',
      '2026-09-12T19:53',
      '2026-09-13T19:50',
    ],
  },
};

test('solar presentation exaggerates only the vertical display dimension', () => {
  expect(SOLAR_VERTICAL_EXAGGERATION).toBe(1.35);
  expect(projectSolarDisplayY(22)).toBe(30);
  expect(projectSolarDisplayY(12)).toBeCloseTo(16.5, 6);
  expect(projectSolarDisplayY(32)).toBeCloseTo(43.5, 6);

  const ellipse = projectSolarDisplayEllipse(18, 10);
  expect(ellipse.centerY).toBeCloseTo(24.6, 6);
  expect(ellipse.radiusY).toBeCloseTo(13.5, 6);
});

test('Current renders the taller solar orbit without distorting the sun marker', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherFixture),
    });
  });
  await page.route('**/api/current/electricity', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/current/markets*', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-weather-temperature]')).toHaveText('16.3');

  const geometry = getSolarOrbitGeometry('2026-09-08');
  expect(geometry).not.toBeNull();
  if (!geometry) return;

  const expected = projectSolarDisplayEllipse(geometry.cy, geometry.ry);
  const svg = page.locator('[data-weather-solar-arc]');
  const visibleOrbit = page.locator('[data-weather-solar-orbit-visible]');
  const hiddenOrbit = page.locator('[data-weather-solar-orbit-hidden]');
  const horizon = page.locator('[data-weather-solar-horizon]');
  const marker = page.locator('[data-weather-sun-position]');

  await expect(svg).toHaveAttribute('viewBox', '0 0 120 60');
  await expect(svg).toHaveAttribute('data-weather-solar-vertical-exaggeration', '1.35');
  await expect(horizon).toHaveAttribute('y1', '30');
  await expect(horizon).toHaveAttribute('y2', '30');
  await expect(marker).toHaveAttribute('r', '2.4');
  await expect(marker).not.toHaveAttribute('transform', /.+/);

  const presentation = await page.evaluate(() => {
    const visible = document.querySelector<SVGEllipseElement>(
      '[data-weather-solar-orbit-visible]'
    );
    const hidden = document.querySelector<SVGEllipseElement>(
      '[data-weather-solar-orbit-hidden]'
    );
    const solarSvg = document.querySelector<SVGSVGElement>('[data-weather-solar-arc]');

    return {
      visibleCy: Number(visible?.getAttribute('cy')),
      hiddenCy: Number(hidden?.getAttribute('cy')),
      visibleRy: Number(visible?.getAttribute('ry')),
      hiddenRy: Number(hidden?.getAttribute('ry')),
      cssHeight: solarSvg ? getComputedStyle(solarSvg).height : '',
    };
  });

  expect(presentation.visibleCy).toBeCloseTo(expected.centerY, 2);
  expect(presentation.hiddenCy).toBeCloseTo(expected.centerY, 2);
  expect(presentation.visibleRy).toBeCloseTo(expected.radiusY, 2);
  expect(presentation.hiddenRy).toBeCloseTo(expected.radiusY, 2);
  expect(presentation.cssHeight).toBe('32px');
});
