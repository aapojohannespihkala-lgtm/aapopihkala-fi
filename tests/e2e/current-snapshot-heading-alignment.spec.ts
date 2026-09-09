import { expect, test, type Page } from '@playwright/test';

const prepareMobileSnapshot = async (page: Page) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
};

test('mobile Snapshot headings share one size and the key columns share baselines', async ({ page }) => {
  await prepareMobileSnapshot(page);
  await page.route('**/api/current/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#snapshot-liiga-label')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const titleSelectors = [
      '#snapshot-weather-label',
      '#snapshot-electricity-label',
      '#snapshot-markets-label',
      '#snapshot-rates-label',
      '#snapshot-liiga-label',
      '.snapshot-panel--electricity .snapshot-kicker',
      '.snapshot-panel--markets .snapshot-kicker',
      '.snapshot-panel--rates .snapshot-kicker',
      '.snapshot-markets__median > span',
      '.snapshot-rates__label',
      '.snapshot-liiga__name',
    ];

    const titleSizes = titleSelectors.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector)!;
      return Number.parseFloat(getComputedStyle(element).fontSize);
    });

    const titleAlignments = titleSelectors.map((selector) =>
      getComputedStyle(document.querySelector<HTMLElement>(selector)!).textAlign
    );

    const liigaHeading = document.querySelector<HTMLElement>('#snapshot-liiga-label')!;
    const liigaName = document.querySelector<HTMLElement>('.snapshot-liiga__name')!;
    const headingStyle = getComputedStyle(liigaHeading);
    const headingTextLeft = liigaHeading.getBoundingClientRect().left + Number.parseFloat(headingStyle.paddingLeft);
    const liigaNameLeft = liigaName.getBoundingClientRect().left;

    const marketsLabel = document.querySelector<HTMLElement>('.snapshot-markets__median > span')!;
    const worldLabel = document.querySelector<HTMLElement>('.snapshot-market-row:first-child > span')!;
    const marketsLabelRect = marketsLabel.getBoundingClientRect();
    const worldLabelRect = worldLabel.getBoundingClientRect();

    const ratesLabel = document.querySelector<HTMLElement>('.snapshot-rates__label')!;
    const ratesValue = document.querySelector<HTMLElement>('.snapshot-rates__value')!;
    const ratesSource = document.querySelector<HTMLElement>('.snapshot-panel--rates > .snapshot-panel__body > .snapshot-source')!;
    const liigaPosition = document.querySelector<HTMLElement>('.snapshot-liiga__position')!;
    const liigaSource = document.querySelector<HTMLElement>('.snapshot-liiga__source')!;
    const panelBody = document.querySelector<HTMLElement>('.snapshot-panel--rates > .snapshot-panel__body')!;

    const ratesLabelRect = ratesLabel.getBoundingClientRect();
    const liigaNameRect = liigaName.getBoundingClientRect();
    const ratesValueRect = ratesValue.getBoundingClientRect();
    const liigaPositionRect = liigaPosition.getBoundingClientRect();
    const ratesSourceRect = ratesSource.getBoundingClientRect();
    const liigaSourceRect = liigaSource.getBoundingClientRect();
    const panelBodyRect = panelBody.getBoundingClientRect();

    return {
      titleSizes,
      titleAlignments,
      liigaLeftDelta: Math.abs(liigaNameLeft - headingTextLeft),
      marketsRowDelta: Math.abs(
        marketsLabelRect.top + marketsLabelRect.height / 2 - (worldLabelRect.top + worldLabelRect.height / 2)
      ),
      metricLabelTopDelta: Math.abs(ratesLabelRect.top - liigaNameRect.top),
      headlineTopDelta: Math.abs(ratesValueRect.top - liigaPositionRect.top),
      sourceTopDelta: Math.abs(ratesSourceRect.top - liigaSourceRect.top),
      liigaSourceInsideBody: liigaSourceRect.bottom <= panelBodyRect.bottom + 1,
    };
  });

  expect(Math.max(...geometry.titleSizes) - Math.min(...geometry.titleSizes)).toBeLessThanOrEqual(0.1);
  expect(geometry.titleAlignments.every((value) => value === 'left' || value === 'start')).toBe(true);
  expect(geometry.liigaLeftDelta).toBeLessThanOrEqual(2);
  expect(geometry.marketsRowDelta).toBeLessThanOrEqual(2);
  expect(geometry.metricLabelTopDelta).toBeLessThanOrEqual(2);
  expect(geometry.headlineTopDelta).toBeLessThanOrEqual(3);
  expect(geometry.sourceTopDelta).toBeLessThanOrEqual(3);
  expect(geometry.liigaSourceInsideBody).toBe(true);
});

test('mobile Liiga keeps full team names and the match inside its column', async ({ page }) => {
  await prepareMobileSnapshot(page);

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

  const liiga = page.locator('[data-snapshot-liiga]');
  await expect(liiga).toBeVisible();
  await expect(liiga.locator('[data-snapshot-liiga-position]')).toHaveText('6/17');
  await expect(liiga.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
  await expect(liiga.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
  await expect(liiga.locator('[data-snapshot-liiga-score]')).toHaveText('18:30');
  await expect(liiga.locator('.snapshot-liiga__source')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const liiga = document.querySelector<HTMLElement>('[data-snapshot-liiga]')!;
    const panelBody = document.querySelector<HTMLElement>('.snapshot-panel--rates > .snapshot-panel__body')!;
    const name = liiga.querySelector<HTMLElement>('.snapshot-liiga__name')!;
    const position = liiga.querySelector<HTMLElement>('.snapshot-liiga__position')!;
    const match = liiga.querySelector<HTMLElement>('.snapshot-liiga__match')!;
    const source = liiga.querySelector<HTMLElement>('.snapshot-liiga__source')!;
    const homeTeam = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]')!;
    const awayTeam = liiga.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]')!;

    const liigaRect = liiga.getBoundingClientRect();
    const panelBodyRect = panelBody.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    const positionRect = position.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const homeRect = homeTeam.getBoundingClientRect();
    const awayRect = awayTeam.getBoundingClientRect();

    return {
      headerStacked: nameRect.bottom <= positionRect.top + 1,
      matchInsideColumn:
        matchRect.left >= liigaRect.left - 1 &&
        matchRect.right <= liigaRect.right + 1 &&
        matchRect.top >= liigaRect.top - 1 &&
        matchRect.bottom <= liigaRect.bottom + 1,
      sourceInsidePanel: sourceRect.bottom <= panelBodyRect.bottom + 1,
      homeInsideColumn: homeRect.left >= liigaRect.left - 1 && homeRect.right <= liigaRect.right + 1,
      awayInsideColumn: awayRect.left >= liigaRect.left - 1 && awayRect.right <= liigaRect.right + 1,
      homeTextOverflow: getComputedStyle(homeTeam).textOverflow,
      awayTextOverflow: getComputedStyle(awayTeam).textOverflow,
    };
  });

  expect(geometry.headerStacked).toBe(true);
  expect(geometry.matchInsideColumn).toBe(true);
  expect(geometry.sourceInsidePanel).toBe(true);
  expect(geometry.homeInsideColumn).toBe(true);
  expect(geometry.awayInsideColumn).toBe(true);
  expect(geometry.homeTextOverflow).toBe('clip');
  expect(geometry.awayTextOverflow).toBe('clip');
});
