import { expect, test, type Page } from '@playwright/test';

const baseLiigaFixture = {
  generatedAt: '2026-09-09T12:00:00.000Z',
  ilvesStanding: {
    rank: 6,
    games: 9,
    points: 6,
    totalTeams: 17,
  },
  lastIlvesGame: null,
  nextIlvesGame: {
    id: 101,
    start: '2026-09-16T15:30:00.000Z',
    homeTeamId: 'karpat',
    homeTeam: 'Kärpät',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
  },
  liveIlvesGame: null,
  standings: [
    { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', rank: 1, points: 9 },
    { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 },
  ],
};

const liveLiigaFixture = {
  ...baseLiigaFixture,
  nextIlvesGame: null,
  liveIlvesGame: {
    id: 102,
    start: '2026-09-09T12:00:00.000Z',
    homeTeamId: 'tappara',
    homeTeam: 'Tappara',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: 1,
    awayGoals: 2,
    gameTime: 2597,
  },
};

const prepareSnapshot = async (page: Page, liigaFixture: typeof baseLiigaFixture) => {
  await page.clock.setFixedTime(new Date('2026-09-09T12:00:00.000Z'));
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

    if (url.pathname === '/api/current/electricity') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prices: [
            {
              price: 6.42,
              startDate: '2026-09-09T12:00:00.000Z',
              endDate: '2026-09-09T12:15:00.000Z',
            },
          ],
        }),
      });
      return;
    }

    if (url.pathname === '/api/current/electricity-month') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ average: 5.46 }) });
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
          items: [{ id: 'euribor-3m', value: 2.63 }],
          series: [{ id: 'euribor-3m', change1y: 0.601, points: [] }],
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
};

const readMatchGeometry = async (page: Page) =>
  page.evaluate(() => {
    const liiga = document.querySelector<HTMLElement>('[data-snapshot-liiga]')!;
    const position = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-position]')!;
    const comparison = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-comparison]')!;
    const match = liiga.querySelector<HTMLElement>('.snapshot-liiga__match')!;
    const center = liiga.querySelector<HTMLElement>('.snapshot-liiga__match-center')!;
    const homeName = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]')!;
    const awayName = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]')!;
    const homeMark = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]')!;
    const awayMark = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]')!;
    const source = liiga.querySelector<HTMLElement>('.snapshot-liiga__source')!;

    const liigaRect = liiga.getBoundingClientRect();
    const positionRect = position.getBoundingClientRect();
    const comparisonRect = comparison.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    const homeNameRect = homeName.getBoundingClientRect();
    const awayNameRect = awayName.getBoundingClientRect();
    const homeMarkRect = homeMark.getBoundingClientRect();
    const awayMarkRect = awayMark.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const liveStyle = getComputedStyle(center, '::after');

    return {
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      liigaTop: liigaRect.top,
      liigaBottom: liigaRect.bottom,
      positionRight: positionRect.right,
      positionBottom: positionRect.bottom,
      comparisonTop: comparisonRect.top,
      matchLeft: matchRect.left,
      matchTop: matchRect.top,
      matchBottom: matchRect.bottom,
      sourceTop: sourceRect.top,
      homeNameBottom: homeNameRect.bottom,
      awayNameBottom: awayNameRect.bottom,
      homeMarkTop: homeMarkRect.top,
      awayMarkTop: awayMarkRect.top,
      homeMarkWidth: homeMarkRect.width,
      awayMarkWidth: awayMarkRect.width,
      liveContent: liveStyle.content,
      liveDisplay: liveStyle.display,
    };
  });

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  test(`next Liiga match stays in its own mobile composition at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, baseLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('WED 16 SEPT');

    const geometry = await readMatchGeometry(page);
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.matchTop).toBeGreaterThanOrEqual(geometry.liigaTop - 1);
    expect(geometry.matchBottom).toBeLessThanOrEqual(geometry.liigaBottom + 1);
    expect(geometry.positionRight).toBeLessThanOrEqual(geometry.matchLeft + 1);
    expect(geometry.comparisonTop).toBeGreaterThanOrEqual(Math.max(geometry.positionBottom, geometry.matchBottom) - 1);
    expect(geometry.matchBottom).toBeLessThan(geometry.sourceTop);
    expect(geometry.homeNameBottom).toBeLessThanOrEqual(geometry.homeMarkTop + 1);
    expect(geometry.awayNameBottom).toBeLessThanOrEqual(geometry.awayMarkTop + 1);
    expect(geometry.homeMarkWidth).toBeGreaterThanOrEqual(viewport.width <= 380 ? 30 : 32);
    expect(geometry.awayMarkWidth).toBeGreaterThanOrEqual(viewport.width <= 380 ? 30 : 32);
    expect(geometry.liveContent).not.toContain('LIVE');
  });

  test(`live Liiga match exposes score, LIVE and clock without overlap at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, liveLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toHaveClass(/is-live/);
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Tappara');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('1-2');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('43:17');

    const geometry = await readMatchGeometry(page);
    expect(geometry.matchTop).toBeGreaterThanOrEqual(geometry.liigaTop - 1);
    expect(geometry.matchBottom).toBeLessThanOrEqual(geometry.liigaBottom + 1);
    expect(geometry.positionRight).toBeLessThanOrEqual(geometry.matchLeft + 1);
    expect(geometry.comparisonTop).toBeGreaterThanOrEqual(Math.max(geometry.positionBottom, geometry.matchBottom) - 1);
    expect(geometry.matchBottom).toBeLessThan(geometry.sourceTop);
    expect(geometry.homeNameBottom).toBeLessThanOrEqual(geometry.homeMarkTop + 1);
    expect(geometry.awayNameBottom).toBeLessThanOrEqual(geometry.awayMarkTop + 1);
    expect(geometry.liveContent.replaceAll('"', '')).toBe('LIVE');
    expect(geometry.liveDisplay).not.toBe('none');
  });
}
