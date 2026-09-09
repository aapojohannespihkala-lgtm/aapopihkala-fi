import { expect, test, type Page } from '@playwright/test';

const prepareDesktopSnapshot = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: '2026-09-09T12:00:00.000Z',
          ilvesStanding: {
            id: 'ilves',
            rank: 6,
            games: 9,
            wins: 2,
            ties: 0,
            losses: 7,
            bonusPoints: 0,
            points: 6,
            goalDifference: -3,
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
          nextHomeIlvesGame: null,
          liveIlvesGame: null,
          standings: [
            { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', rank: 1, points: 9 },
            { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 },
          ],
          season: 2027,
        }),
      });
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
          items: [{ id: 'euribor-3m', value: 2.63 }],
          series: [{ id: 'euribor-3m', change1y: 0.601, points: [] }],
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
};

test('desktop Snapshot uses one alignment grid for Markets, Rates and Liiga', async ({ page }) => {
  await prepareDesktopSnapshot(page);
  await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-snapshot-liiga]')).toBeVisible();
  await expect(page.locator('[data-snapshot-liiga-home-team]')).toHaveText('Kärpät');
  await expect(page.locator('[data-snapshot-liiga-away-team]')).toHaveText('Ilves');
  await expect(page.locator('.snapshot-liiga__source')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    const medianLabel = rect('.snapshot-markets__median > span');
    const world = rect('.snapshot-market-row:first-child > span');
    const ratesLabel = rect('.snapshot-rates__label');
    const ratesValue = rect('.snapshot-rates__value');
    const ratesChange = rect('.snapshot-rates__change');
    const ratesSource = rect('.snapshot-panel--rates > .snapshot-panel__body > .snapshot-source');
    const liigaHeadingElement = document.querySelector<HTMLElement>('#snapshot-liiga-label');
    const liigaHeading = liigaHeadingElement?.getBoundingClientRect();
    const liigaName = rect('.snapshot-liiga__name');
    const liigaValue = rect('.snapshot-liiga__position');
    const liigaComparison = rect('.snapshot-liiga__comparison');
    const liigaSource = rect('.snapshot-liiga__source');
    const homeTeam = document.querySelector<HTMLElement>('[data-snapshot-liiga-home-team]');
    const awayTeam = document.querySelector<HTMLElement>('[data-snapshot-liiga-away-team]');

    const centerY = (value?: DOMRect) => value ? value.top + value.height / 2 : Number.POSITIVE_INFINITY;
    const headingTextLeft = liigaHeading && liigaHeadingElement
      ? liigaHeading.left + Number.parseFloat(getComputedStyle(liigaHeadingElement).paddingLeft)
      : Number.POSITIVE_INFINITY;

    return {
      marketLabelDelta: Math.abs(centerY(medianLabel) - centerY(world)),
      labelTopDelta: Math.abs((liigaName?.top ?? 0) - (ratesLabel?.top ?? 0)),
      valueTopDelta: Math.abs((liigaValue?.top ?? 0) - (ratesValue?.top ?? 0)),
      supportTopDelta: Math.abs((liigaComparison?.top ?? 0) - (ratesChange?.top ?? 0)),
      sourceTopDelta: Math.abs((liigaSource?.top ?? 0) - (ratesSource?.top ?? 0)),
      copyLeftDelta: Math.abs((liigaName?.left ?? 0) - headingTextLeft),
      homeFits: homeTeam ? homeTeam.scrollWidth <= homeTeam.clientWidth + 1 : false,
      awayFits: awayTeam ? awayTeam.scrollWidth <= awayTeam.clientWidth + 1 : false,
      homeOverflow: homeTeam ? getComputedStyle(homeTeam).textOverflow : '',
      awayOverflow: awayTeam ? getComputedStyle(awayTeam).textOverflow : '',
    };
  });

  expect(geometry.marketLabelDelta).toBeLessThanOrEqual(6);
  expect(geometry.labelTopDelta).toBeLessThanOrEqual(12);
  expect(geometry.valueTopDelta).toBeLessThanOrEqual(12);
  expect(geometry.supportTopDelta).toBeLessThanOrEqual(14);
  expect(geometry.sourceTopDelta).toBeLessThanOrEqual(4);
  expect(geometry.copyLeftDelta).toBeLessThanOrEqual(4);
  expect(geometry.homeFits).toBe(true);
  expect(geometry.awayFits).toBe(true);
  expect(geometry.homeOverflow).toBe('clip');
  expect(geometry.awayOverflow).toBe('clip');
});
