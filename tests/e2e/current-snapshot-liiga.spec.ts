import { expect, test, type Page } from '@playwright/test';

const normalLiigaFixture = {
  generatedAt: '2026-09-09T12:00:00.000Z',
  ilvesStanding: {
    id: 'ilves',
    rank: 4,
    games: 16,
    wins: 10,
    ties: 0,
    losses: 6,
    bonusPoints: 0,
    points: 28,
    goalDifference: 12,
    totalTeams: 17,
  },
  lastIlvesGame: {
    id: 100,
    start: '2026-09-07T14:00:00.000Z',
    homeTeamId: 'ilves',
    homeTeam: 'Ilves',
    awayTeamId: 'hifk',
    awayTeam: 'HIFK',
    homeGoals: 3,
    awayGoals: 2,
    gameTime: null,
    ilvesResult: 'W',
    finish: 'REGULATION',
  },
  nextIlvesGame: {
    id: 101,
    start: '2026-09-11T15:30:00.000Z',
    homeTeamId: 'ilves',
    homeTeam: 'Ilves',
    awayTeamId: 'tps',
    awayTeam: 'TPS',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
  },
  nextHomeIlvesGame: null,
  liveIlvesGame: null,
  standings: [],
  season: 2027,
};

const liveLiigaFixture = {
  ...normalLiigaFixture,
  liveIlvesGame: {
    id: 102,
    start: '2026-09-09T15:00:00.000Z',
    homeTeamId: 'tappara',
    homeTeam: 'Tappara',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: 1,
    awayGoals: 2,
    gameTime: 2597,
  },
};

const prepareSnapshot = async (page: Page, liigaFixture: typeof normalLiigaFixture | typeof liveLiigaFixture) => {
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: { temperature_2m: 15.4, weather_code: 3 },
        daily: { temperature_2m_min: [12], temperature_2m_max: [18] },
        hourly: {
          time: ['2026-09-09T16:00', '2026-09-09T18:00', '2026-09-09T20:00', '2026-09-09T22:00'],
          temperature_2m: [15, 14, 13, 12],
          weather_code: [3, 61, 2, 0],
          precipitation_probability: [10, 65, 20, 5],
        },
      }),
    });
  });

  await page.route('**/api/current/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/current/liiga') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(liigaFixture) });
      return;
    }

    if (url.pathname === '/api/current/electricity-month') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ average: 7.84, kind: 'month-to-date', month: '2026-09', through: '2026-09-08' }),
      });
      return;
    }

    if (url.pathname === '/api/current/electricity') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ prices: [] }) });
      return;
    }

    if (url.pathname === '/api/current/markets' && url.searchParams.get('portfolio') === '1') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
      return;
    }

    if (url.pathname === '/api/current/markets') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ id: 'euribor-3m', value: 2.679 }],
          series: [{ id: 'euribor-3m', change1y: 0.652, points: [] }],
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
};

test.describe('Current Snapshot Liiga summary', () => {
  test('shows compact Ilves position, next game and last result inside the rates panel', async ({ page }) => {
    await prepareSnapshot(page, normalLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toBeVisible();
    await expect(page.locator('#snapshot-rates-label')).toHaveText('RATES + ILVES / 04');
    await expect(liiga.locator('[data-snapshot-liiga-position]')).toHaveText('#4 / 17');
    await expect(liiga.locator('[data-snapshot-liiga-meta]')).toHaveText('28 P / 16 GP');
    await expect(liiga.locator('[data-snapshot-liiga-state]')).toHaveText('NEXT / HOME');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('ILV');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('TPS');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('VS');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('FRI 11 SEPT / 18:30');
    await expect(liiga.locator('[data-snapshot-liiga-last]')).toHaveText('LAST / 3-2 W');
    await expect(liiga.locator('a[href="/current/liiga/"]')).toHaveCount(1);
    await expect(liiga.locator('.snapshot-liiga__mark')).toHaveCount(2);

    const geometry = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-panel__body');
      return {
        pageWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        panelScrollWidth: panel?.scrollWidth ?? Number.POSITIVE_INFINITY,
        panelClientWidth: panel?.clientWidth ?? 0,
        panelScrollHeight: panel?.scrollHeight ?? Number.POSITIVE_INFINITY,
        panelClientHeight: panel?.clientHeight ?? 0,
      };
    });

    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.pageHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.panelScrollWidth).toBeLessThanOrEqual(geometry.panelClientWidth + 1);
    expect(geometry.panelScrollHeight).toBeLessThanOrEqual(geometry.panelClientHeight + 1);
  });

  test('promotes an active Ilves game to live score and clock', async ({ page }) => {
    await prepareSnapshot(page, liveLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toHaveClass(/is-live/);
    await expect(liiga.locator('[data-snapshot-liiga-state]')).toHaveText('LIVE');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('43:17');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('TAP');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('ILV');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('1-2');
    await expect(liiga.locator('[data-snapshot-liiga-last]')).toBeHidden();
  });
});
