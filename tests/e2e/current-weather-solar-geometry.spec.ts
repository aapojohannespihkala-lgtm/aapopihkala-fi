import { expect, test } from '@playwright/test';
import {
  getSolarOrbitGeometry,
  getSolarPosition,
} from '../../src/features/current/weather';

const weatherFixture = {
  current: {
    time: '2026-09-08T03:00',
    temperature_2m: 15.4,
    weather_code: 3,
    is_day: 0,
  },
  hourly: {
    time: Array.from(
      { length: 12 },
      (_, index) => `2026-09-08T${String(index + 4).padStart(2, '0')}:00`
    ),
    temperature_2m: Array.from({ length: 12 }, (_, index) => 14 + index * 0.2),
    precipitation_probability: Array.from({ length: 12 }, () => 20),
    weather_code: Array.from({ length: 12 }, () => 3),
    is_day: Array.from({ length: 12 }, (_, index) => (index >= 3 ? 1 : 0)),
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
    weather_code: [3, 3, 3, 3, 3, 3],
    temperature_2m_min: [10, 10, 10, 10, 10, 10],
    temperature_2m_max: [17, 17, 17, 17, 17, 17],
    precipitation_probability_max: [20, 20, 20, 20, 20, 20],
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

test('solar orbit geometry moves above and below the horizon with the seasons', () => {
  const spring = getSolarOrbitGeometry('2026-03-20');
  const summer = getSolarOrbitGeometry('2026-06-21');
  const winter = getSolarOrbitGeometry('2026-12-21');

  expect(spring).not.toBeNull();
  expect(summer).not.toBeNull();
  expect(winter).not.toBeNull();

  if (!spring || !summer || !winter) return;

  expect(Math.abs(spring.cy - spring.horizonY)).toBeLessThan(0.5);
  expect(summer.cy).toBeLessThan(spring.cy - 5);
  expect(winter.cy).toBeGreaterThan(spring.cy + 5);

  for (const geometry of [spring, summer, winter]) {
    expect(geometry.cy - geometry.ry).toBeGreaterThan(0);
    expect(geometry.cy + geometry.ry).toBeLessThan(44);
    expect(geometry.rx).toBeGreaterThan(47);
    expect(geometry.rx).toBeLessThanOrEqual(52);
  }
});

test('solar position continues around the same orbit below the horizon at night', () => {
  const midday = getSolarPosition(
    '2026-03-20',
    '2026-03-20T12:00',
    '2026-03-20T06:00',
    '2026-03-20T18:00'
  );
  const midnight = getSolarPosition(
    '2026-03-20',
    '2026-03-20T00:00',
    '2026-03-20T06:00',
    '2026-03-20T18:00'
  );

  expect(midday).not.toBeNull();
  expect(midnight).not.toBeNull();

  if (!midday || !midnight) return;

  expect(midday.aboveHorizon).toBe(true);
  expect(midday.y).toBeLessThan(22);
  expect(midnight.aboveHorizon).toBe(false);
  expect(midnight.y).toBeGreaterThan(22);
  expect(midday.x).toBeCloseTo(midnight.x, 6);
});

test('standalone Weather renders one continuous orbit split only by the horizon', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherFixture),
    });
  });

  await page.goto('/current/weather/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-weather-temperature]')).toHaveText('15.4');

  const visibleOrbit = page.locator('[data-weather-solar-orbit-visible]');
  const hiddenOrbit = page.locator('[data-weather-solar-orbit-hidden]');
  const horizon = page.locator('[data-weather-solar-horizon]');
  const marker = page.locator('[data-weather-sun-position]');

  await expect(visibleOrbit).toHaveCount(1);
  await expect(hiddenOrbit).toHaveCount(1);
  await expect(horizon).toHaveCount(1);
  await expect(marker).toHaveAttribute('data-weather-sun-above-horizon', 'false');
  await expect(marker).toHaveAttribute('opacity', '0.72');

  const orbitGeometry = await page.evaluate(() => {
    const visible = document.querySelector<SVGEllipseElement>(
      '[data-weather-solar-orbit-visible]'
    );
    const hidden = document.querySelector<SVGEllipseElement>(
      '[data-weather-solar-orbit-hidden]'
    );
    const markerElement = document.querySelector<SVGCircleElement>(
      '[data-weather-sun-position]'
    );
    const solarSvg = document.querySelector<SVGSVGElement>('[data-weather-solar-arc]');

    const readEllipse = (ellipse: SVGEllipseElement | null) =>
      ellipse
        ? ['cx', 'cy', 'rx', 'ry'].map((name) => ellipse.getAttribute(name))
        : [];

    return {
      visible: readEllipse(visible),
      hidden: readEllipse(hidden),
      markerY: Number(markerElement?.getAttribute('cy')),
      centerY: Number(solarSvg?.getAttribute('data-weather-solar-center-y')),
    };
  });

  expect(orbitGeometry.visible).toEqual(orbitGeometry.hidden);
  expect(orbitGeometry.markerY).toBeGreaterThan(22);
  expect(orbitGeometry.centerY).toBeLessThan(22);
});
