import { expect, test, type Page } from '@playwright/test';

const nextFixture = {
  generatedAt: '2026-09-09T12:00:00.000Z',
  ilvesStanding: { rank: 6, games: 9, points: 6, totalTeams: 17 },
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

const liveFixture = {
  ...nextFixture,
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

const prepareSnapshot = async (page: Page, liigaFixture: unknown) => {
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
          prices: [{
            price: 6.42,
            startDate: '2026-09-09T12:00:00.000Z',
            endDate: '2026-09-09T12:15:00.000Z',
          }],
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

const geometry = async (page: Page) => page.evaluate(() => {
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

  const lr = liiga.getBoundingClientRect();
  const pr = position.getBoundingClientRect();
  const cr = comparison.getBoundingClientRect();
  const mr = match.getBoundingClientRect();
  const hnr = homeName.getBoundingClientRect();
  const anr = awayName.getBoundingClientRect();
  const hmr = homeMark.getBoundingClientRect();
  const amr = awayMark.getBoundingClientRect();
  const sr = source.getBoundingClientRect();
  const live = getComputedStyle(center, '::after');

  return {
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    liigaTop: lr.top,
    liigaBottom: lr.bottom,
    positionRight: pr.right,
    positionBottom: pr.bottom,
    comparisonTop: cr.top,
    matchLeft: mr.left,
    matchTop: mr.top,
    matchBottom: mr.bottom,
    sourceTop: sr.top,
    homeNameBottom: hnr.bottom,
    awayNameBottom: anr.bottom,
    homeMarkTop: hmr.top,
    awayMarkTop: amr.top,
    homeMarkWidth: hmr.width,
    awayMarkWidth: amr.width,
    liveContent: live.content.replaceAll('"', ''),
    liveDisplay: live.display,
  };
});

for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`next Liiga match has a collision-free mobile composition at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, nextFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('WED 16 SEPT');

    const g = await geometry(page);
    expect(g.pageWidth).toBeLessThanOrEqual(g.viewportWidth + 1);
    expect(g.matchTop).toBeGreaterThanOrEqual(g.liigaTop - 1);
    expect(g.matchBottom).toBeLessThanOrEqual(g.liigaBottom + 1);
    expect(g.positionRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.comparisonTop).toBeGreaterThanOrEqual(Math.max(g.positionBottom, g.matchBottom) - 1);
    expect(g.matchBottom).toBeLessThan(g.sourceTop);
    expect(g.homeNameBottom).toBeLessThanOrEqual(g.homeMarkTop + 1);
    expect(g.awayNameBottom).toBeLessThanOrEqual(g.awayMarkTop + 1);
    expect(g.homeMarkWidth).toBeGreaterThanOrEqual(viewport.width <= 380 ? 30 : 32);
    expect(g.awayMarkWidth).toBeGreaterThanOrEqual(viewport.width <= 380 ? 30 : 32);
    expect(g.liveContent).not.toBe('LIVE');
  });

  test(`live Liiga match shows score, LIVE and clock without overlap at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, liveFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toHaveClass(/is-live/);
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('1-2');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('43:17');

    const g = await geometry(page);
    expect(g.matchTop).toBeGreaterThanOrEqual(g.liigaTop - 1);
    expect(g.matchBottom).toBeLessThanOrEqual(g.liigaBottom + 1);
    expect(g.positionRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.comparisonTop).toBeGreaterThanOrEqual(Math.max(g.positionBottom, g.matchBottom) - 1);
    expect(g.matchBottom).toBeLessThan(g.sourceTop);
    expect(g.homeNameBottom).toBeLessThanOrEqual(g.homeMarkTop + 1);
    expect(g.awayNameBottom).toBeLessThanOrEqual(g.awayMarkTop + 1);
    expect(g.liveContent).toBe('LIVE');
    expect(g.liveDisplay).not.toBe('none');
  });
}
