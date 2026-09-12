import { expect, test } from '@playwright/test';

const liigaFixture = {
  generatedAt: '2026-09-08T12:08:00.000Z',
  ilvesStanding: { rank: 6, games: 9, points: 6, totalTeams: 17 },
  standings: [
    { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', rank: 1, points: 9 },
    { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', rank: 6, points: 6 },
  ],
  lastIlvesGame: null,
  nextIlvesGame: {
    id: 301,
    start: '2026-09-08T15:30:00.000Z',
    homeTeamId: 'karpat',
    homeTeam: 'Kärpät',
    awayTeamId: 'ilves',
    awayTeam: 'Ilves',
    homeGoals: null,
    awayGoals: null,
    gameTime: null,
  },
  liveIlvesGame: null,
};

const macroFixture = {
  items: [{ id: 'euribor-3m', value: 2.679, observedAt: '2026-09-04' }],
  series: [
    {
      id: 'euribor-3m',
      value: 2.679,
      observedAt: '2026-09-04',
      change1y: 0.652,
      points: [
        { value: 3.331, observedAt: '2025-09-04' },
        { value: 2.679, observedAt: '2026-09-04' },
      ],
    },
  ],
};

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  test(`keeps Rates and Liiga clear of the footer at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-08T12:08:00.000Z'));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.addInitScript(() => {
      try {
        localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
      } catch {
        // Storage may be unavailable before the page origin is established.
      }
    });

    await page.route('https://api.open-meteo.com/**', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/current/**', async (route) => {
      const url = new URL(route.request().url());

      if (url.pathname === '/api/current/liiga') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(liigaFixture),
        });
        return;
      }

      if (url.pathname === '/api/current/markets') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(url.searchParams.get('portfolio') === '1' ? { items: [] } : macroFixture),
        });
        return;
      }

      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/current/snapshot/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-snapshot-liiga]')).toBeVisible();
    await expect(page.locator('.snapshot-liiga__position')).toContainText('6');
    await expect(page.locator('[data-snapshot-euribor]')).toHaveText('2.68');

    const geometry = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-panel__body');
      const ratesValue = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-rates__value');
      const ratesSource = document.querySelector<HTMLElement>('.snapshot-panel--rates .snapshot-rates > .snapshot-source');
      const liigaPosition = document.querySelector<HTMLElement>('.snapshot-liiga__position');
      const liigaSource = document.querySelector<HTMLElement>('.snapshot-liiga__source');
      const footer = document.querySelector<HTMLElement>('.snapshot-footer');

      const bodyRect = body?.getBoundingClientRect();
      const ratesValueRect = ratesValue?.getBoundingClientRect();
      const ratesSourceRect = ratesSource?.getBoundingClientRect();
      const liigaPositionRect = liigaPosition?.getBoundingClientRect();
      const liigaSourceRect = liigaSource?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();

      return {
        bodyBottom: bodyRect?.bottom ?? Number.NEGATIVE_INFINITY,
        ratesValueBottom: ratesValueRect?.bottom ?? Number.POSITIVE_INFINITY,
        ratesSourceBottom: ratesSourceRect?.bottom ?? Number.POSITIVE_INFINITY,
        liigaPositionBottom: liigaPositionRect?.bottom ?? Number.POSITIVE_INFINITY,
        liigaSourceBottom: liigaSourceRect?.bottom ?? Number.POSITIVE_INFINITY,
        footerTop: footerRect?.top ?? Number.NEGATIVE_INFINITY,
      };
    });

    expect(geometry.ratesValueBottom).toBeLessThanOrEqual(geometry.bodyBottom + 1);
    expect(geometry.liigaPositionBottom).toBeLessThanOrEqual(geometry.bodyBottom + 1);
    expect(geometry.ratesSourceBottom).toBeLessThanOrEqual(geometry.bodyBottom + 1);
    expect(geometry.liigaSourceBottom).toBeLessThanOrEqual(geometry.bodyBottom + 1);
    expect(geometry.bodyBottom).toBeLessThanOrEqual(geometry.footerTop + 1);
  });
}
