import { expect, test } from '@playwright/test';

const hslSection = {
  id: 'hsl',
  index: '04',
  label: 'HSL',
  primary: '5 MIN',
  secondary: '121 / CENTRAL',
  detail: '12:35 / LIVE',
  tone: 'accent',
  span: 'full',
  layout: 'split',
  rows: [
    { label: '121', value: '12:35 / 5 MIN', tone: 'accent' },
    { label: '125', value: '12:42 / 12 MIN', tone: 'neutral' },
  ],
};

const payload = (channel: 'prod' | 'dev') => ({
  schemaVersion: 2,
  minEngineVersion: 2,
  channel,
  generatedAt: '2026-09-14T09:30:00.000Z',
  title: 'CURRENT / SNAPSHOT',
  pageUrl: '/current/snapshot/',
  theme: {
    background: '#1D2A35',
    panel: '#22323E',
    foreground: '#EEF2F4',
    muted: '#AAB4BC',
    line: '#64717B',
    accent: '#DCE4E8',
    positive: '#15967F',
    negative: '#C45F6C',
  },
  layouts: {
    compact: ['weather', 'electricity', 'markets', 'rates'],
    medium: ['weather', 'electricity', 'markets', 'rates'],
    large: ['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga'],
  },
  sections: [
    {
      id: 'weather',
      index: '01',
      label: 'WEATHER',
      primary: '16.2°C',
      secondary: 'OLARI / ESPOO',
      detail: 'Light drizzle / 13° / 17°',
      span: 'full',
      layout: 'split',
      columns: [
        { label: '16:00', value: '16°' },
        { label: '18:00', value: '15°' },
      ],
    },
    {
      id: 'electricity',
      index: '02',
      label: 'ELECTRICITY',
      primary: '1.83 c/kWh',
      secondary: 'DAY AVG / TODAY',
      detail: 'NOW 2.54  LOW 0.39  HIGH 5.03',
      span: 'full',
      layout: 'split',
      bars: [0, 1, 0.5, 0.8],
    },
    {
      id: 'markets',
      index: '03',
      label: 'MARKETS',
      primary: '+0.08%',
      secondary: '1D / MEDIAN',
      span: 'full',
      layout: 'split',
      rows: [
        { label: 'WORLD', value: '+0.94%', tone: 'positive' },
        { label: 'FINLAND', value: '-1.09%', tone: 'negative' },
      ],
    },
    hslSection,
    {
      id: 'rates',
      index: '05',
      label: 'RATES',
      primary: '2.65%',
      secondary: '3M EURIBOR',
      span: 'half',
      layout: 'stack',
    },
    {
      id: 'liiga',
      index: '06',
      label: 'LIIGA',
      primary: '6/17',
      secondary: 'KÄRPÄT - ILVES',
      span: 'half',
      layout: 'stack',
    },
  ],
});

test('widget preview uses the v2 production presentation and Android-style header', async ({ page }) => {
  let v2Requests = 0;
  let legacyV2Requests = 0;

  await page.route(/\/api\/current\/widget-v2\?channel=prod$/, async (route) => {
    v2Requests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload('prod')),
    });
  });
  await page.route(/\/api\/current\/widget\?v=2&channel=prod$/, async (route) => {
    legacyV2Requests += 1;
    await route.abort();
  });

  await page.goto('/current/widget-preview/?size=large&channel=prod');

  await expect(page.locator('[data-status]')).toHaveText('SCHEMA 2 / PROD / LARGE');
  await expect(page.locator('.widget-header strong')).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator('.widget-header span').first()).toHaveText(
    /^[A-Z]{3} \d{2} [A-Z]{3} \d{4} \/ W\d{2}$/,
  );
  await expect(page.locator('.widget-header')).toContainText('UPDATED 12:30');
  await expect(page.locator('.widget-header')).not.toContainText('CURRENT / SNAPSHOT');

  const weather = page.locator('[data-section="weather"]');
  await expect(weather).toContainText('16.2°C');
  await expect(weather).toHaveAttribute('data-span', 'full');
  await expect(weather).toHaveAttribute('data-layout', 'split');
  await expect(weather.locator('.metric-support')).toContainText('16:00');

  const electricity = page.locator('[data-section="electricity"]');
  await expect(electricity).toHaveAttribute('data-layout', 'split');
  await expect(electricity.locator('.metric-support .metric-bars')).toBeVisible();

  const markets = page.locator('[data-section="markets"]');
  await expect(markets).toHaveAttribute('data-layout', 'split');
  await expect(markets.locator('.metric-support')).toContainText('WORLD');
  await expect(markets.locator('.metric-support')).toContainText('FINLAND');

  const hsl = page.locator('[data-section="hsl"]');
  await expect(hsl).toHaveAttribute('data-span', 'full');
  await expect(hsl).toHaveAttribute('data-layout', 'split');
  await expect(hsl.locator('.metric-main')).toContainText('5 MIN');
  await expect(hsl.locator('.metric-support')).toContainText('121');
  await expect(hsl.locator('.metric-support')).toContainText('125');

  await expect(page.locator('[data-section="rates"]')).toHaveAttribute('data-span', 'half');
  await expect(page.locator('[data-section="liiga"]')).toHaveAttribute('data-span', 'half');

  expect(v2Requests).toBe(1);
  expect(legacyV2Requests).toBe(0);
});

test('widget preview keeps HSL when switching between prod and dev channels', async ({ page }) => {
  await page.route(/\/api\/current\/widget-v2\?channel=prod$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload('prod')),
    });
  });
  await page.route(/\/api\/current\/widget-v2\?channel=dev$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload('dev')),
    });
  });

  await page.goto('/current/widget-preview/?size=large&channel=prod');
  await expect(page.locator('[data-status]')).toHaveText('SCHEMA 2 / PROD / LARGE');
  await expect(page.locator('[data-section="hsl"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'DEV' }).click();
  await expect(page.locator('[data-status]')).toHaveText('SCHEMA 2 / DEV / LARGE');
  await expect(page).toHaveURL(/channel=dev/);
  await expect(page.locator('[data-section="hsl"]')).toHaveCount(1);
});
