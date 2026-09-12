import { expect, test } from '@playwright/test';

const weatherFixture = {
  current: { temperature_2m: 15.4, weather_code: 3 },
  daily: { temperature_2m_min: [12], temperature_2m_max: [18] },
};

const electricityFixture = {
  prices: Array.from({ length: 96 }, (_, index) => {
    const start = new Date(Date.UTC(2026, 8, 7, 21, 0) + index * 15 * 60 * 1000);
    return {
      price: 4 + index / 100,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 15 * 60 * 1000 - 1000).toISOString(),
    };
  }),
};

const portfolioFixture = {
  items: [
    { id: 'ishares-world', changes: { today: 0.42 } },
    { id: 'handelsbanken-usa', changes: { today: 0.71 } },
    { id: 'nordnet-finland', changes: { today: -0.23 } },
    { id: 'btc', changes: { today: 1.84 } },
    { id: 'remedy', changes: { today: -0.61 } },
  ],
};

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679 }],
  series: [{ id: 'euribor-3m', change1y: 0.652, points: [] }],
};

const liigaFixture = {
  generatedAt: '2026-09-08T12:08:00.000Z',
  standings: [{ id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 }],
  ilvesStanding: { rank: 6, games: 9, points: 6, totalTeams: 17 },
  lastIlvesGame: null,
  nextIlvesGame: null,
  liveIlvesGame: null,
};

test('degraded Snapshot feeds automatically recover without waiting for the normal refresh interval', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:08:00.000Z'));

  let portfolioRequests = 0;
  let liigaRequests = 0;

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherFixture),
    });
  });

  await page.route('**/api/current/electricity*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(electricityFixture),
    });
  });

  await page.route('**/api/current/markets*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('portfolio') === '1') {
      portfolioRequests += 1;
      if (portfolioRequests <= 3) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(portfolioFixture),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(macroFixture),
    });
  });

  await page.route('**/api/current/liiga*', async (route) => {
    liigaRequests += 1;
    if (liigaRequests === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(liigaFixture),
    });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-snapshot-status]')).toHaveText('LIVE DATA / 3 OF 5 SOURCES');
  await expect(page.locator('[data-snapshot-market-median]')).toHaveText('--');
  await expect(page.locator('[data-snapshot-liiga]')).toHaveClass(/is-unavailable/);

  await page.clock.runFor(30_100);

  await expect(page.locator('[data-snapshot-status]')).toHaveText('LIVE DATA / OK');
  await expect(page.locator('[data-snapshot-market-median]')).toHaveText('+0.42%');
  await expect(page.locator('[data-snapshot-liiga]')).not.toHaveClass(/is-unavailable/);
  expect(portfolioRequests).toBeGreaterThan(3);
  expect(liigaRequests).toBeGreaterThan(1);
});
