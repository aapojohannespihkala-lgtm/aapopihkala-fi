import { expect, test } from '@playwright/test';

const teamIds = [
  'hifk',
  'hpk',
  'ilves',
  'jokerit',
  'jukurit',
  'jyp',
  'kalpa',
  'k-espoo',
  'kookoo',
  'karpat',
  'lukko',
  'pelicans',
  'saipa',
  'sport',
  'tappara',
  'tps',
  'assat',
];

const standings = teamIds.map((id, index) => ({
  id,
  rank: index + 1,
  games: 3,
  wins: index === 0 ? 3 : index === 2 ? 2 : 1,
  ties: 0,
  losses: index === 0 ? 0 : 2,
  bonusPoints: 0,
  points: index === 0 ? 9 : index === 2 ? 6 : Math.max(0, 4 - index),
  goalsFor: 8 - Math.min(index, 6),
  goalsAgainst: 3 + Math.min(index, 6),
  goalDifference: 5 - index,
}));

const fixture = {
  season: 2027,
  generatedAt: '2026-09-09T10:30:00Z',
  source: 'Liiga',
  standings,
  ilvesStanding: {
    ...standings[2],
    totalTeams: 17,
  },
  lastIlvesGame: {
    id: 2701291,
    start: '2026-09-08T15:30:00Z',
    homeTeamId: 'hpk',
    homeTeam: 'HPK',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: 0,
    awayGoals: 4,
    gameTime: 3600,
    spectators: 3532,
    ilvesResult: 'W',
    finish: 'REGULATION',
  },
  nextIlvesGame: {
    id: 2701370,
    start: '2026-09-16T15:30:00Z',
    homeTeamId: 'karpat',
    homeTeam: 'Kärpät',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
    spectators: null,
  },
  nextHomeIlvesGame: {
    id: 2701406,
    start: '2026-09-25T15:30:00Z',
    homeTeamId: 'ilves',
    homeTeam: 'Ilves',
    awayTeamId: 'kookoo',
    awayTeam: 'KooKoo',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
    spectators: null,
  },
  liveIlvesGame: null,
};

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`renders Ilves match boards and Liiga standings on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.route('**/api/current/liiga*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture),
      });
    });

    await page.goto('/current/liiga/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Liiga', level: 1 })).toBeVisible();
    await expect(page.locator('[data-liiga-season]')).toHaveText('2026-27');

    await expect(page.locator('[data-liiga-last-matchup]')).toHaveText('HPK / Ilves');
    await expect(page.locator('[data-liiga-last-home-team]')).toHaveText('HPK');
    await expect(page.locator('[data-liiga-last-away-team]')).toHaveText('Ilves');
    await expect(page.locator('[data-liiga-last-home-mark]')).toHaveAttribute('href', '#liiga-match-mark-hpk');
    await expect(page.locator('[data-liiga-last-away-mark]')).toHaveAttribute('href', '#liiga-match-mark-ilves');
    await expect(page.locator('[data-liiga-last-score]')).toHaveText('0 - 4');
    await expect(page.locator('[data-liiga-last-audience]')).toHaveText('ATTENDANCE 3532');
    await expect(page.locator('[data-liiga-last-result]')).toHaveText('WIN / REG');

    await expect(page.locator('[data-liiga-next-matchup]')).toHaveText('Kärpät / Ilves');
    await expect(page.locator('[data-liiga-next-home-team]')).toHaveText('Kärpät');
    await expect(page.locator('[data-liiga-next-away-team]')).toHaveText('Ilves');
    await expect(page.locator('[data-liiga-next-home-mark]')).toHaveAttribute('href', '#liiga-match-mark-karpat');
    await expect(page.locator('[data-liiga-next-away-mark]')).toHaveAttribute('href', '#liiga-match-mark-ilves');
    await expect(page.locator('[data-liiga-next-date]')).toHaveText('WED 16 SEP / 18:30');
    await expect(page.locator('[data-liiga-next-venue]')).toHaveText('AWAY / NEXT');
    await expect(page.locator('[data-liiga-next-home]')).toBeVisible();
    await expect(page.locator('[data-liiga-next-home-opponent]')).toHaveText('KooKoo');
    await expect(page.locator('[data-liiga-next-home-date]')).toHaveText('FRI 25 SEP / 18:30');

    await expect(page.locator('[data-liiga-position]')).toHaveText('3 / 17');
    await expect(page.locator('[data-liiga-position-meta]')).toHaveText('6 P / 3 GP');
    await expect(page.locator('[data-liiga-live-card]')).toBeHidden();

    await expect(page.locator('[data-liiga-row]')).toHaveCount(17);
    await expect(page.locator('[data-liiga-club-mark]')).toHaveCount(17);
    await expect(page.locator('[data-liiga-row="ilves"] [data-liiga-points]')).toHaveText('6');
    await expect(page.locator('[data-liiga-club-mark] svg text')).toHaveCount(0);

    const hpkShape = page.locator('[data-liiga-club-mark="hpk"] path').first();
    const hpkPaint = await hpkShape.evaluate((path) => {
      const styles = getComputedStyle(path);
      return { fill: styles.fill, stroke: styles.stroke };
    });
    expect(hpkPaint.fill).not.toBe('none');
    expect(hpkPaint.stroke).toBe('none');

    const ilvesShape = page.locator('[data-liiga-club-mark="ilves"] path').first();
    const ilvesPaint = await ilvesShape.evaluate((path) => {
      const styles = getComputedStyle(path);
      return { fill: styles.fill, stroke: styles.stroke };
    });
    expect(ilvesPaint.fill).toBe('none');
    expect(ilvesPaint.stroke).not.toBe('none');

    await expect(page.locator('#liiga-match-mark-hpk .liiga-team-mark__fill')).toHaveCount(3);
    await expect(page.locator('#liiga-match-mark-hpk .liiga-team-mark__shape')).toHaveCount(0);
    await expect(page.locator('#liiga-match-mark-ilves .liiga-team-mark__shape').first()).toBeAttached();

    const markSignatures = await page.locator('[data-liiga-club-mark] svg').evaluateAll((marks) =>
      marks.map((mark) =>
        Array.from(mark.querySelectorAll('path'))
          .map((path) => path.getAttribute('d'))
          .join('|')
      )
    );
    expect(markSignatures).toHaveLength(17);
    expect(new Set(markSignatures).size).toBe(17);
    expect(markSignatures.every((signature) => signature.includes('|'))).toBe(true);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
}

test('promotes a live Ilves score with team glyphs and game clock', async ({ page }) => {
  const liveFixture = {
    ...fixture,
    liveIlvesGame: {
      id: 2701322,
      start: '2026-09-09T15:30:00Z',
      homeTeamId: 'ilves',
      homeTeam: 'Ilves',
      awayTeamId: 'tappara',
      awayTeam: 'Tappara',
      homeGoals: 2,
      awayGoals: 1,
      gameTime: 2120,
      spectators: null,
    },
  };

  await page.route('**/api/current/liiga*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(liveFixture),
    });
  });

  await page.goto('/current/liiga/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-liiga-live-card]')).toBeVisible();
  await expect(page.locator('[data-liiga-live-matchup]')).toHaveText('Ilves / Tappara');
  await expect(page.locator('[data-liiga-live-home-team]')).toHaveText('Ilves');
  await expect(page.locator('[data-liiga-live-away-team]')).toHaveText('Tappara');
  await expect(page.locator('[data-liiga-live-home-mark]')).toHaveAttribute('href', '#liiga-match-mark-ilves');
  await expect(page.locator('[data-liiga-live-away-mark]')).toHaveAttribute('href', '#liiga-match-mark-tappara');
  await expect(page.locator('[data-liiga-live-score]')).toHaveText('2 - 1');
  await expect(page.locator('[data-liiga-live-clock]')).toHaveText('35:20');
  await expect(page.locator('[data-liiga-status]')).toHaveText('LIVE / ILVES');
});
