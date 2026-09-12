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
  const main = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-rates__main')!;
  const euribor = main.firstElementChild as HTMLElement;
  const liiga = main.querySelector<HTMLElement>('[data-snapshot-liiga]')!;
  const heading = document.querySelector<HTMLElement>('#snapshot-liiga-label')!;
  const position = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-position]')!;
  const comparison = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-comparison]')!;
  const match = liiga.querySelector<HTMLElement>('.snapshot-liiga__match')!;
  const center = liiga.querySelector<HTMLElement>('.snapshot-liiga__match-center')!;
  const homeTeam = liiga.querySelector<HTMLElement>('.snapshot-liiga__team:not(.snapshot-liiga__team--away)')!;
  const awayTeam = liiga.querySelector<HTMLElement>('.snapshot-liiga__team--away')!;
  const homeName = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]')!;
  const awayName = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]')!;
  const homeMark = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]')!;
  const awayMark = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]')!;
  const source = liiga.querySelector<HTMLElement>('.snapshot-liiga__source')!;

  const mainRect = main.getBoundingClientRect();
  const euriborRect = euribor.getBoundingClientRect();
  const liigaRect = liiga.getBoundingClientRect();
  const headingRect = heading.getBoundingClientRect();
  const positionRect = position.getBoundingClientRect();
  const comparisonRect = comparison.getBoundingClientRect();
  const matchRect = match.getBoundingClientRect();
  const centerRect = center.getBoundingClientRect();
  const homeTeamRect = homeTeam.getBoundingClientRect();
  const awayTeamRect = awayTeam.getBoundingClientRect();
  const homeNameRect = homeName.getBoundingClientRect();
  const awayNameRect = awayName.getBoundingClientRect();
  const homeMarkRect = homeMark.getBoundingClientRect();
  const awayMarkRect = awayMark.getBoundingClientRect();
  const sourceRect = source.getBoundingClientRect();
  const live = getComputedStyle(center, '::after');

  return {
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    mainLeft: mainRect.left,
    mainRight: mainRect.right,
    euriborLeft: euriborRect.left,
    euriborRight: euriborRect.right,
    euriborWidth: euriborRect.width,
    liigaLeft: liigaRect.left,
    liigaRight: liigaRect.right,
    liigaWidth: liigaRect.width,
    headingLeft: headingRect.left,
    positionTop: positionRect.top,
    positionRight: positionRect.right,
    positionBottom: positionRect.bottom,
    comparisonTop: comparisonRect.top,
    comparisonRight: comparisonRect.right,
    comparisonBottom: comparisonRect.bottom,
    matchLeft: matchRect.left,
    matchRight: matchRect.right,
    matchTop: matchRect.top,
    matchBottom: matchRect.bottom,
    sourceTop: sourceRect.top,
    homeTeamLeft: homeTeamRect.left,
    homeTeamRight: homeTeamRect.right,
    awayTeamLeft: awayTeamRect.left,
    awayTeamRight: awayTeamRect.right,
    homeNameLeft: homeNameRect.left,
    homeNameRight: homeNameRect.right,
    awayNameLeft: awayNameRect.left,
    awayNameRight: awayNameRect.right,
    homeNameBottom: homeNameRect.bottom,
    awayNameBottom: awayNameRect.bottom,
    homeNameClientWidth: homeName.clientWidth,
    homeNameScrollWidth: homeName.scrollWidth,
    awayNameClientWidth: awayName.clientWidth,
    awayNameScrollWidth: awayName.scrollWidth,
    homeMarkLeft: homeMarkRect.left,
    homeMarkRight: homeMarkRect.right,
    awayMarkLeft: awayMarkRect.left,
    awayMarkRight: awayMarkRect.right,
    homeMarkTop: homeMarkRect.top,
    awayMarkTop: awayMarkRect.top,
    homeMarkWidth: homeMarkRect.width,
    awayMarkWidth: awayMarkRect.width,
    homeMarkToCenter: centerRect.left - homeMarkRect.right,
    awayMarkToCenter: awayMarkRect.left - centerRect.right,
    liveContent: live.content.replaceAll('"', ''),
    liveDisplay: live.display,
  };
});

for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`next Liiga match stays beside the standing at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, nextFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('WED 16');

    const g = await geometry(page);
    const euriborMinimum = viewport.width <= 380 ? 118 : 124;
    const markMinimum = viewport.width <= 380 ? 30 : 32;

    expect(g.pageWidth).toBeLessThanOrEqual(g.viewportWidth + 1);
    expect(g.euriborLeft).toBeGreaterThanOrEqual(g.mainLeft - 1);
    expect(g.euriborWidth).toBeGreaterThanOrEqual(euriborMinimum - 1);
    expect(g.liigaLeft).toBeGreaterThanOrEqual(g.euriborRight - 1);
    expect(g.liigaRight).toBeLessThanOrEqual(g.mainRight + 1);
    expect(Math.abs(g.headingLeft - g.liigaLeft)).toBeLessThanOrEqual(2);

    expect(g.comparisonTop).toBeGreaterThanOrEqual(g.positionBottom - 1);
    expect(g.positionRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.comparisonRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.matchTop).toBeLessThan(g.positionBottom);
    expect(g.matchBottom).toBeGreaterThan(g.positionTop);
    expect(Math.max(g.matchBottom, g.comparisonBottom)).toBeLessThan(g.sourceTop);

    expect(g.homeNameBottom).toBeLessThanOrEqual(g.homeMarkTop + 1);
    expect(g.awayNameBottom).toBeLessThanOrEqual(g.awayMarkTop + 1);
    expect(g.homeNameLeft).toBeGreaterThanOrEqual(g.homeTeamLeft - 1);
    expect(g.homeNameRight).toBeLessThanOrEqual(g.homeTeamRight + 1);
    expect(g.awayNameLeft).toBeGreaterThanOrEqual(g.awayTeamLeft - 1);
    expect(g.awayNameRight).toBeLessThanOrEqual(g.awayTeamRight + 1);
    expect(g.homeNameScrollWidth).toBeLessThanOrEqual(g.homeNameClientWidth + 1);
    expect(g.awayNameScrollWidth).toBeLessThanOrEqual(g.awayNameClientWidth + 1);
    expect(g.homeMarkWidth).toBeGreaterThanOrEqual(markMinimum);
    expect(g.awayMarkWidth).toBeGreaterThanOrEqual(markMinimum);
    expect(g.homeMarkLeft).toBeGreaterThanOrEqual(g.matchLeft - 1);
    expect(g.awayMarkRight).toBeLessThanOrEqual(g.matchRight + 1);
    expect(Math.abs(g.homeMarkToCenter)).toBeLessThanOrEqual(6);
    expect(Math.abs(g.awayMarkToCenter)).toBeLessThanOrEqual(6);
    expect(g.liveContent).not.toBe('LIVE');
  });

  test(`live Liiga match stays beside the standing and exposes LIVE at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareSnapshot(page, liveFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toHaveClass(/is-live/);
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Tappara');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('1-2');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('43:17');

    const g = await geometry(page);
    const euriborMinimum = viewport.width <= 380 ? 118 : 124;

    expect(g.pageWidth).toBeLessThanOrEqual(g.viewportWidth + 1);
    expect(g.euriborWidth).toBeGreaterThanOrEqual(euriborMinimum - 1);
    expect(g.liigaLeft).toBeGreaterThanOrEqual(g.euriborRight - 1);
    expect(g.positionRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.comparisonTop).toBeGreaterThanOrEqual(g.positionBottom - 1);
    expect(g.comparisonRight).toBeLessThanOrEqual(g.matchLeft + 1);
    expect(g.matchTop).toBeLessThan(g.positionBottom);
    expect(g.matchBottom).toBeGreaterThan(g.positionTop);
    expect(Math.max(g.matchBottom, g.comparisonBottom)).toBeLessThan(g.sourceTop);
    expect(g.homeNameScrollWidth).toBeLessThanOrEqual(g.homeNameClientWidth + 1);
    expect(g.awayNameScrollWidth).toBeLessThanOrEqual(g.awayNameClientWidth + 1);
    expect(g.liveContent).toBe('LIVE');
    expect(g.liveDisplay).not.toBe('none');
  });
}
