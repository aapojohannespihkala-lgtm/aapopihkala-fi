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
  standings: [
    { id: 'tps', name: 'TPS', abbreviation: 'TPS', rank: 1, points: 31 },
    { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 4, points: 28 },
  ],
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

const todayLiigaFixture = {
  ...normalLiigaFixture,
  generatedAt: '2026-09-11T08:00:00.000Z',
};

const prepareSnapshot = async (
  page: Page,
  liigaFixture: typeof normalLiigaFixture | typeof liveLiigaFixture,
) => {
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
  test('shows the point gap, dominant next-game time and team-aware last result', async ({ page }) => {
    await prepareSnapshot(page, normalLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const panel = page.locator('.snapshot-panel--rates');
    const heading = panel.locator('.snapshot-panel__heading');
    const liiga = page.locator('[data-snapshot-liiga]');

    await expect(liiga).toBeVisible();
    await expect(page.locator('#snapshot-rates-label')).toHaveText('RATES / 04');
    await expect(page.locator('#snapshot-liiga-label')).toHaveText('LIIGA / 04');
    await expect(heading.locator('a[href="/current/rates/"]')).toHaveCount(1);
    await expect(heading.locator('a[href="/current/rates/"]')).toHaveText('+');
    await expect(heading.locator('a[href="/current/liiga/"]')).toHaveCount(1);
    await expect(heading.locator('a[href="/current/liiga/"]')).toHaveText('+');

    await expect(liiga.locator('[data-snapshot-liiga-position]')).toHaveText('#4 / 17');
    await expect(liiga.locator('[data-snapshot-liiga-comparison]')).toHaveText(
      'ILV 28 P · TPS 31 P · GAP -3 P',
    );
    await expect(liiga).not.toContainText('GP');
    await expect(liiga.locator('[data-snapshot-liiga-state]')).toHaveText('NEXT / HOME');
    await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('ILV');
    await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('TPS');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('FRI 11 SEPT');
    await expect(liiga.locator('[data-snapshot-liiga-last]')).toHaveText('LAST / ILV 3-2 IFK');
    await expect(liiga.locator('.snapshot-liiga__mark')).toHaveCount(2);

    const geometry = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('.snapshot-panel--rates');
      const panelBody = panel?.querySelector<HTMLElement>('.snapshot-panel__body');
      const liigaHeading = panel?.querySelector<HTMLElement>('#snapshot-liiga-label');
      const liigaBody = panel?.querySelector<HTMLElement>('[data-snapshot-liiga]');
      const matchCenter = liigaBody?.querySelector<HTMLElement>('.snapshot-liiga__match-center');
      const homeMark = liigaBody?.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]');
      const awayMark = liigaBody?.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]');
      const homeTeam = liigaBody?.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]');
      const awayTeam = liigaBody?.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]');
      const panelRect = panel?.getBoundingClientRect();
      const centerRect = matchCenter?.getBoundingClientRect();
      const homeMarkRect = homeMark?.getBoundingClientRect();
      const awayMarkRect = awayMark?.getBoundingClientRect();
      const homeTeamRect = homeTeam?.getBoundingClientRect();
      const awayTeamRect = awayTeam?.getBoundingClientRect();
      const panelMidpoint = panelRect ? panelRect.left + panelRect.width / 2 : Number.POSITIVE_INFINITY;
      const homeMarkStyle = homeMark ? getComputedStyle(homeMark) : null;
      const awayMarkStyle = awayMark ? getComputedStyle(awayMark) : null;
      const homeMarkSvg = homeMark?.querySelector<SVGElement>('.snapshot-liiga__mark');

      return {
        pageWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        panelScrollWidth: panelBody?.scrollWidth ?? Number.POSITIVE_INFINITY,
        panelClientWidth: panelBody?.clientWidth ?? 0,
        panelScrollHeight: panelBody?.scrollHeight ?? Number.POSITIVE_INFINITY,
        panelClientHeight: panelBody?.clientHeight ?? 0,
        headerDivider: liigaHeading?.getBoundingClientRect().left ?? Number.POSITIVE_INFINITY,
        bodyDivider: liigaBody?.getBoundingClientRect().left ?? Number.POSITIVE_INFINITY,
        panelMidpoint,
        homeMarkWidth: homeMarkRect?.width ?? 0,
        awayMarkWidth: awayMarkRect?.width ?? 0,
        homeMarkToCenter: centerRect && homeMarkRect ? centerRect.left - homeMarkRect.right : Number.POSITIVE_INFINITY,
        awayMarkToCenter: centerRect && awayMarkRect ? awayMarkRect.left - centerRect.right : Number.POSITIVE_INFINITY,
        homeTeamToCenter: centerRect && homeTeamRect ? centerRect.left - homeTeamRect.right : Number.POSITIVE_INFINITY,
        awayTeamToCenter: centerRect && awayTeamRect ? awayTeamRect.left - centerRect.right : Number.POSITIVE_INFINITY,
        homeMarkId: homeMark?.dataset.liigaMarkId ?? '',
        awayMarkId: awayMark?.dataset.liigaMarkId ?? '',
        homeMarkScale: Number.parseFloat(homeMarkStyle?.getPropertyValue('--liiga-mark-scale') ?? ''),
        awayMarkScale: Number.parseFloat(awayMarkStyle?.getPropertyValue('--liiga-mark-scale') ?? ''),
        homeMaskImage: homeMarkStyle?.maskImage ?? '',
        homeMarkSvgOpacity: homeMarkSvg ? getComputedStyle(homeMarkSvg).opacity : '',
      };
    });

    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.pageHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.panelScrollWidth).toBeLessThanOrEqual(geometry.panelClientWidth + 1);
    expect(geometry.panelScrollHeight).toBeLessThanOrEqual(geometry.panelClientHeight + 1);
    expect(Math.abs(geometry.headerDivider - geometry.panelMidpoint)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.bodyDivider - geometry.panelMidpoint)).toBeLessThanOrEqual(2);
    expect(geometry.homeMarkWidth).toBeGreaterThanOrEqual(32);
    expect(geometry.awayMarkWidth).toBeGreaterThanOrEqual(32);
    expect(geometry.homeMarkToCenter).toBeLessThanOrEqual(6);
    expect(geometry.awayMarkToCenter).toBeLessThanOrEqual(6);
    expect(geometry.homeMarkToCenter).toBeLessThan(geometry.homeTeamToCenter);
    expect(geometry.awayMarkToCenter).toBeLessThan(geometry.awayTeamToCenter);
    expect(geometry.homeMarkId).toBe('ilves');
    expect(geometry.awayMarkId).toBe('tps');
    expect(geometry.homeMarkScale).toBeCloseTo(0.95, 5);
    expect(geometry.awayMarkScale).toBeCloseTo(1, 5);
    expect(geometry.homeMaskImage).toContain('current-ilves-mascot-emblem.svg');
    expect(geometry.homeMarkSvgOpacity).toBe('0');
  });

  test('labels the next game as today when the Helsinki dates match', async ({ page }) => {
    await prepareSnapshot(page, todayLiigaFixture);
    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    const liiga = page.locator('[data-snapshot-liiga]');
    await expect(liiga).toHaveClass(/is-today/);
    await expect(liiga.locator('[data-snapshot-liiga-state]')).toHaveText('TODAY / HOME');
    await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
    await expect(liiga.locator('[data-snapshot-liiga-schedule]')).toHaveText('FRI 11 SEPT');
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
    await expect(liiga.locator('[data-snapshot-liiga-comparison]')).toHaveText(
      'ILV 28 P · TPS 31 P · GAP -3 P',
    );
    await expect(liiga.locator('[data-snapshot-liiga-last]')).toBeHidden();
  });
});