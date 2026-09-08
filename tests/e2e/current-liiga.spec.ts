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
  generatedAt: '2026-09-08T19:16:00Z',
  source: 'Liiga',
  standings,
  lastIlvesGame: {
    id: 2701291,
    start: '2026-09-08T15:30:00Z',
    homeTeamId: 'hpk',
    homeTeam: 'HPK',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: 0,
    awayGoals: 4,
    ilvesResult: 'W',
    finish: 'REGULATION',
  },
};

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`renders Liiga standings and latest Ilves result on ${viewport.name}`, async ({ page }) => {
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
    await expect(page.locator('[data-liiga-last-home-name]')).toHaveText('HPK');
    await expect(page.locator('[data-liiga-last-away-name]')).toHaveText('Ilves');
    await expect(page.locator('[data-liiga-last-home-score]')).toHaveText('0');
    await expect(page.locator('[data-liiga-last-away-score]')).toHaveText('4');
    await expect(page.locator('[data-liiga-last-result]')).toHaveText('ILVES WIN');

    await expect(page.locator('[data-liiga-row]')).toHaveCount(17);
    await expect(page.locator('[data-liiga-club-mark]')).toHaveCount(17);
    await expect(page.locator('[data-liiga-row="ilves"] [data-liiga-points]')).toHaveText('6');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
}
