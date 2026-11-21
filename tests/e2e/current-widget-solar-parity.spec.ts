import { expect, test, type Page } from '@playwright/test';

// Sunrise, sunset and day length are deliberately controlled here. This tests
// the web presentation against the existing Android SolarDetailVisual contract.
const mockWidget = async (page: Page, sunrise: string, sunset: string, daylight: string) => {
  const payload = {
    schemaVersion: 2,
    minEngineVersion: 2,
    channel: 'prod',
    generatedAt: new Date('2026-11-21T10:00:00.000Z').toISOString(),
    theme: {
      background: '#1D2A35', foreground: '#EEF2F4', muted: '#AAB4BC',
      line: '#64717B', accent: '#DCE4E8', positive: '#15967F', negative: '#C45F6C',
    },
    layouts: {
      compact: ['weather', 'electricity', 'markets', 'rates'],
      medium: ['weather', 'electricity', 'markets', 'rates'],
      large: ['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga'],
    },
    sections: [
      { id: 'weather', index: '01', label: 'WEATHER', primary: '1.5°C',
        secondary: 'OLARI / ESPOO', detail: `Overcast / 1° / 3°\n↑${sunrise} ↓${sunset} ☀${daylight}` },
      { id: 'electricity', index: '02', label: 'ELECTRICITY', primary: '3 c/kWh', bars: [0.5, 0.7] },
      { id: 'markets', index: '03', label: 'MARKETS', primary: '-1.02%' },
      { id: 'hsl', index: '04', label: 'HSL', primary: '6 MIN' },
      { id: 'rates', index: '05', label: 'RATES', primary: '2.85%' },
      { id: 'liiga', index: '06', label: 'LIIGA', primary: '2/17' },
    ],
  };
  await page.route('**/api/current/widget-v2?channel=prod', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) }));
};

const diskValues = (page: Page) => page.locator('.android-solar-disk').evaluate((node) => {
  const style = (node as HTMLElement).style;
  const percent = (name: string) => Number.parseFloat(style.getPropertyValue(name));
  return {
    x: percent('--sun-x'),
    y: percent('--sun-y'),
    horizon: percent('--horizon-y'),
    fill: style.getPropertyValue('--sun-fill'),
    background: getComputedStyle(node).backgroundImage,
  };
});

for (const { sunrise, sunset, duration, expectedHorizon } of [
  { sunrise: '08:34', sunset: '15:38', duration: '7H04M', expectedHorizon: 50 - 50 * Math.cos(Math.PI * 424 / 1440) },
  { sunrise: '06:00', sunset: '18:00', duration: '12H00M', expectedHorizon: 50 },
  { sunrise: '03:00', sunset: '21:00', duration: '18H00M', expectedHorizon: 50 - 50 * Math.cos(Math.PI * 1080 / 1440) },
]) {
  test(`standalone solar disk matches Android moving horizon for ${duration}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-21T10:00:00.000Z'));
    await mockWidget(page, sunrise, sunset, duration);
    await page.goto('/current/widget/');
    await expect(page.locator('.android-solar strong')).toHaveText(duration);
    const disk = await diskValues(page);
    expect(disk.horizon).toBeCloseTo(expectedHorizon, 1);
    expect(disk.background).toContain(`${disk.horizon}%`);
  });
}

for (const { time, state, atHorizon, side } of [
  { time: '2026-11-21T06:34:00.000Z', state: 'day', atHorizon: true, side: 'left' },
  { time: '2026-11-21T10:06:00.000Z', state: 'day', atHorizon: false, side: 'center' },
  { time: '2026-11-21T13:38:00.000Z', state: 'day', atHorizon: true, side: 'right' },
  { time: '2026-11-21T13:39:00.000Z', state: 'night', atHorizon: false, side: 'right' },
  { time: '2026-11-21T22:06:00.000Z', state: 'night', atHorizon: false, side: 'center' },
]) {
  test(`24h marker at ${time} is ${state} and ${side}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(time));
    await mockWidget(page, '08:34', '15:38', '7H04M');
    await page.goto('/current/widget/');
    const disk = await diskValues(page);
    expect(disk.fill).toBe(state === 'day' ? 'var(--foreground)' : 'transparent');
    if (atHorizon) expect(disk.y).toBeCloseTo(disk.horizon, 1);
    if (side === 'left') expect(disk.x).toBeLessThan(50);
    if (side === 'right') expect(disk.x).toBeGreaterThan(50);
    if (side === 'center') expect(disk.x).toBeCloseTo(50, 0);
  });
}

test('sun position advances on the existing live clock without refetching', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-21T10:00:00.000Z') });
  let calls = 0;
  await mockWidget(page, '08:34', '15:38', '7H04M');
  page.on('request', (request) => {
    if (request.url().includes('/api/current/widget-v2?')) calls++;
  });
  await page.goto('/current/widget/');
  const before = await diskValues(page);
  await page.clock.fastForward(2 * 60 * 1000);
  await expect.poll(async () => (await diskValues(page)).x).not.toBe(before.x);
  const after = await diskValues(page);
  expect(after.horizon).toBeCloseTo(before.horizon, 2);
  expect(calls).toBe(1);
});

test('sun marker follows the visible ring and has no redundant grey horizon stroke', async ({ page }) => {
  await mockWidget(page, '08:34', '15:38', '7H04M');

  // Verify both a filled daytime sun and a hollow nighttime sun on the same rim.
  for (const at of ['2026-11-21T10:06:00.000Z', '2026-11-21T20:54:00.000Z']) {
    await page.clock.setFixedTime(new Date(at));
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/current/widget/');
    await expect(page.locator('.android-solar-disk')).toBeVisible();

    const measured = await page.locator('.android-solar-disk').evaluate((element) => {
      const disk = element as HTMLElement;
      const dot = disk.querySelector('b') as HTMLElement;
      const diskBox = disk.getBoundingClientRect();
      const dotBox = dot.getBoundingClientRect();
      const diskStyle = getComputedStyle(disk);
      const centerX = diskBox.left + diskBox.width / 2;
      const centerY = diskBox.top + diskBox.height / 2;
      const dotCenterX = dotBox.left + dotBox.width / 2;
      const dotCenterY = dotBox.top + dotBox.height / 2;
      const markerDistance = Math.hypot(dotCenterX - centerX, dotCenterY - centerY);
      const scale = diskBox.width / parseFloat(diskStyle.width);
      const ringCenterRadius = diskBox.width / 2 - (parseFloat(diskStyle.borderLeftWidth) * scale) / 2;
      return {
        markerDistance,
        ringCenterRadius,
        redundantHorizonContent: getComputedStyle(disk, '::after').content,
      };
    });

    expect(Math.abs(measured.markerDistance - measured.ringCenterRadius)).toBeLessThan(1.2);
    expect(measured.redundantHorizonContent).toBe('none');
    }
  }
});
