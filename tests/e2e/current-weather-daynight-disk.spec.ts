import { expect, test, type Page } from '@playwright/test';
import { getDayNightDiskGeometry } from '../../src/features/current/dayNightDisk';

const fixture = (sunrise: string, sunset: string) => ({
  current: {
    time: '2026-11-21T12:06',
    temperature_2m: 1.5,
    weather_code: 3,
    is_day: 1,
  },
  hourly: {
    time: Array.from({ length: 6 }, (_, i) => `2026-11-21T${String(i + 12).padStart(2, '0')}:00`),
    temperature_2m: [1, 1, 1, 1, 0, 0],
    precipitation_probability: [0, 0, 0, 0, 0, 0],
    weather_code: [3, 3, 3, 3, 3, 3],
    is_day: [1, 1, 1, 1, 0, 0],
  },
  daily: {
    time: ['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'],
    temperature_2m_min: [0, 0, 0, 0, 0, 0],
    temperature_2m_max: [3, 3, 3, 3, 3, 3],
    precipitation_probability_max: [0, 0, 0, 0, 0, 0],
    weather_code: [3, 3, 3, 3, 3, 3],
    sunrise: Array.from({ length: 6 }, (_, i) => `2026-11-${String(i + 21).padStart(2, '0')}T${sunrise}`),
    sunset: Array.from({ length: 6 }, (_, i) => `2026-11-${String(i + 21).padStart(2, '0')}T${sunset}`),
  },
});

const mockWeather = async (page: Page, sunrise = '08:34', sunset = '15:38') => {
  await page.route('**/api/current/weather', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture(sunrise, sunset)) }));
  await page.route('**/api/current/electricity*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/current/markets*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
};

const getDisk = (page: Page) => page.locator('[data-weather-daynight-disk]').evaluate((element) => {
  const style = (element as HTMLElement).style;
  const pct = (name: string) => Number.parseFloat(style.getPropertyValue(name));
  return {
    x: pct('--sun-x'),
    y: pct('--sun-y'),
    horizon: pct('--horizon-y'),
    horizonLeft: pct('--horizon-left'),
    sunFill: style.getPropertyValue('--sun-fill'),
    above: (element as HTMLElement).dataset.sunAboveHorizon,
  };
});

for (const { sunrise, sunset, daylightMinutes } of [
  { sunrise: '08:34', sunset: '15:38', daylightMinutes: 424 },
  { sunrise: '06:00', sunset: '18:00', daylightMinutes: 720 },
  { sunrise: '03:00', sunset: '21:00', daylightMinutes: 1080 },
]) {
  test(`homepage daylight disk matches Android horizon at ${daylightMinutes} minutes`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-21T10:06:00.000Z'));
    await mockWeather(page, sunrise, sunset);
    await page.goto('/current/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-weather-temperature]')).toHaveText('1.5');
    await expect(page.locator('[data-weather-daynight-disk]')).toBeVisible();
    await expect(page.locator('[data-weather-solar-arc]')).toBeHidden();
    const disk = await getDisk(page);
    expect(disk.horizon).toBeCloseTo(50 - 43 * Math.cos(Math.PI * daylightMinutes / 1440), 1);
    expect(disk.horizonLeft).toBeGreaterThanOrEqual(0);
    expect(disk.horizonLeft).toBeLessThanOrEqual(50);
  });
}

test('daylight crossing, noon and nighttime positions follow uniform 24h orbit', () => {
  const rise = getDayNightDiskGeometry('08:34', '15:38', 8 * 60 + 34);
  const noon = getDayNightDiskGeometry('08:34', '15:38', 12 * 60 + 6);
  const set = getDayNightDiskGeometry('08:34', '15:38', 15 * 60 + 38);
  const night = getDayNightDiskGeometry('08:34', '15:38', 22 * 60 + 42);
  expect(rise).not.toBeNull();
  expect(noon).not.toBeNull();
  expect(set).not.toBeNull();
  expect(night).not.toBeNull();
  if (!rise || !noon || !set || !night) return;

  expect(rise.sunY).toBeCloseTo(rise.horizonY, 8);
  expect(set.sunY).toBeCloseTo(set.horizonY, 8);
  expect(rise.sunX).toBeLessThan(50);
  expect(set.sunX).toBeGreaterThan(50);
  expect(noon.sunX).toBeCloseTo(50, 8);
  expect(noon.sunY).toBeCloseTo(7, 8);
  expect(rise.aboveHorizon).toBe(true);
  expect(set.aboveHorizon).toBe(true);
  expect(night.aboveHorizon).toBe(false);
  expect(night.sunY).toBeGreaterThan(night.horizonY);
  expect(getDayNightDiskGeometry('invalid', '15:38', 600)).toBeNull();
});

test('homepage disk updates with clock without a new weather request', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-21T10:00:00.000Z') });
  let requests = 0;
  await mockWeather(page);
  page.on('request', (request) => {
    if (request.url().includes('/api/current/weather')) requests += 1;
  });
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-weather-daynight-disk]')).toBeVisible();
  const before = await getDisk(page);
  await page.clock.fastForward(2 * 60 * 1000);
  await expect.poll(async () => (await getDisk(page)).x).not.toBe(before.x);
  expect((await getDisk(page)).horizon).toBeCloseTo(before.horizon, 2);
  expect(requests).toBe(1);
});

test('mobile homepage gets same disk, separate Weather page keeps its astronomical orbit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.clock.setFixedTime(new Date('2026-11-21T10:06:00.000Z'));
  await mockWeather(page);
  await page.goto('/current/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-weather-daynight-disk]')).toBeVisible();
  await expect(page.locator('[data-weather-solar-arc]')).toBeHidden();

  await page.goto('/current/weather/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-weather-temperature]')).toHaveText('1.5');
  await expect(page.locator('[data-weather-solar-arc]')).toBeVisible();
  await expect(page.locator('[data-weather-daynight-disk]')).toBeHidden();
});
