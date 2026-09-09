import { expect, test } from '@playwright/test';
import { isLiigaScheduleGameLive } from '../../functions/api/current/liiga-schedule';

test('does not expose future scheduled games as live even if upstream marks them started', () => {
  const now = new Date('2026-09-09T15:13:00Z');
  const fixture = {
    id: 1,
    start: '2026-09-09T15:30:00Z',
    homeTeam: { teamId: 'pelicans', goals: 0 },
    awayTeam: { teamId: 'kalpa', goals: 0 },
    started: true,
    ended: false,
    gameTime: 0,
  };

  expect(isLiigaScheduleGameLive(fixture, now)).toBe(false);
  expect(isLiigaScheduleGameLive({ ...fixture, start: '2026-09-09T15:00:00Z', gameTime: 780 }, now)).toBe(true);
  expect(isLiigaScheduleGameLive({ ...fixture, start: '2026-09-09T15:00:00Z', started: false }, now)).toBe(false);
});

test('renders league-wide live and upcoming games with Current glyphs', async ({ page }) => {
  await page.route('**/api/current/liiga*', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/current/liiga-schedule')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: '2026-09-09T15:35:00Z',
          liveGames: [
            {
              id: 1,
              start: '2026-09-09T15:30:00Z',
              homeTeamId: 'sport',
              homeTeam: 'Sport',
              awayTeamId: 'tps',
              awayTeam: 'TPS',
              homeGoals: 2,
              awayGoals: 1,
              gameTime: 2120,
            },
          ],
          upcomingGames: [
            {
              id: 2,
              start: '2026-09-09T16:30:00Z',
              homeTeamId: 'pelicans',
              homeTeam: 'Pelicans',
              awayTeamId: 'kalpa',
              awayTeam: 'KalPa',
              homeGoals: null,
              awayGoals: null,
              gameTime: null,
            },
            {
              id: 3,
              start: '2026-09-10T15:30:00Z',
              homeTeamId: 'ilves',
              homeTeam: 'Ilves',
              awayTeamId: 'tappara',
              awayTeam: 'Tappara',
              homeGoals: null,
              awayGoals: null,
              gameTime: null,
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        season: 2027,
        generatedAt: '2026-09-09T15:35:00Z',
        standings: [],
        ilvesStanding: null,
        lastIlvesGame: null,
        nextIlvesGame: null,
        nextHomeIlvesGame: null,
        liveIlvesGame: null,
      }),
    });
  });

  await page.goto('/current/liiga/', { waitUntil: 'domcontentloaded' });

  const schedule = page.locator('[data-liiga-schedule]');
  await expect(schedule).toBeVisible();
  await expect(schedule.locator('[data-liiga-schedule-game]')).toHaveCount(3);
  await expect(schedule.locator('[data-liiga-schedule-live]')).toHaveCount(1);
  await expect(schedule).toContainText('SPORT');
  await expect(schedule).toContainText('TPS');
  await expect(schedule).toContainText('2 - 1');
  await expect(schedule).toContainText('LIVE / 35:20');
  await expect(schedule).toContainText('PELICANS');
  await expect(schedule).toContainText('KALPA');
  await expect(schedule).toContainText('19:30');
  await expect(schedule).toContainText('ILVES');
  await expect(schedule).toContainText('TAPPARA');

  await expect(schedule.locator('.liiga-match-team__mark use[href="#liiga-match-mark-pelicans"]')).toHaveCount(1);
  await expect(schedule.locator('.liiga-match-team__mark use[href="#liiga-match-mark-ilves"]')).toHaveCount(1);
  await expect(schedule.locator('[data-liiga-schedule-team-id="pelicans"]')).toHaveCount(1);
  await expect(schedule.locator('[data-liiga-schedule-team-id="ilves"]')).toHaveCount(1);

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
});
