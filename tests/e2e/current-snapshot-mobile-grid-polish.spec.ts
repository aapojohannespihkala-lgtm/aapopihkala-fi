import { expect, test } from '@playwright/test';

test('Snapshot mobile aligns Markets to the Rates-Liiga split and stacks team labels above marks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/current/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/current/liiga') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: '2026-09-16T10:00:00.000Z',
          ilvesStanding: { rank: 6, games: 9, points: 6, totalTeams: 17 },
          standings: [
            { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', rank: 1, points: 9 },
            { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 },
          ],
          lastIlvesGame: null,
          nextIlvesGame: {
            id: 301,
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
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-snapshot-liiga-position]')).toHaveText('6/17');
  await expect(page.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
  await expect(page.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');

  const geometry = await page.evaluate(() => {
    const marketList = document.querySelector<HTMLElement>('.snapshot-market-list')!;
    const liigaHeading = document.querySelector<HTMLElement>('#snapshot-liiga-label')!;
    const ratesIndex = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-panel__index')!;
    const homeName = document.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]')!;
    const awayName = document.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]')!;
    const homeMark = document.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]')!;
    const awayMark = document.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]')!;

    const marketRect = marketList.getBoundingClientRect();
    const headingRect = liigaHeading.getBoundingClientRect();
    const indexRect = ratesIndex.getBoundingClientRect();
    const homeNameRect = homeName.getBoundingClientRect();
    const awayNameRect = awayName.getBoundingClientRect();
    const homeMarkRect = homeMark.getBoundingClientRect();
    const awayMarkRect = awayMark.getBoundingClientRect();
    const indexStyle = getComputedStyle(liigaHeading, '::before');
    const headingStyle = getComputedStyle(liigaHeading);

    return {
      marketAxisDelta: Math.abs(marketRect.left - headingRect.left),
      liigaIndexContent: indexStyle.content.replace(/["']/g, ''),
      liigaIndexWidthDelta: Math.abs(Number.parseFloat(indexStyle.width) - indexRect.width),
      liigaIndexBorderWidth: Number.parseFloat(indexStyle.borderRightWidth),
      liigaTitleClearsIndex:
        Number.parseFloat(headingStyle.paddingLeft) >= Number.parseFloat(indexStyle.width) + 8,
      homeNameAboveMark: homeNameRect.bottom <= homeMarkRect.top + 2,
      awayNameAboveMark: awayNameRect.bottom <= awayMarkRect.top + 2,
    };
  });

  expect(geometry.marketAxisDelta).toBeLessThanOrEqual(2);
  expect(geometry.liigaIndexContent).toBe('05');
  expect(geometry.liigaIndexWidthDelta).toBeLessThanOrEqual(0.5);
  expect(geometry.liigaIndexBorderWidth).toBeGreaterThanOrEqual(1);
  expect(geometry.liigaTitleClearsIndex).toBe(true);
  expect(geometry.homeNameAboveMark).toBe(true);
  expect(geometry.awayNameAboveMark).toBe(true);
});
