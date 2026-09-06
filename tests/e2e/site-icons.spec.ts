import { expect, test } from '@playwright/test';

test('site exposes separate browser and installable app icons', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('head link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg'
  );
  await expect(page.locator('head link[rel="icon"][type="image/png"][sizes="32x32"]')).toHaveAttribute(
    'href',
    '/icons/favicon-32x32.png'
  );
  await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/icons/apple-touch-icon.png'
  );
  await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/site.webmanifest'
  );

  const manifestResponse = await request.get('/site.webmanifest');
  expect(manifestResponse.ok()).toBe(true);

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: 'Aapo Pihkala',
    short_name: 'Aapo',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#1D2A35',
    theme_color: '#1D2A35',
  });
  expect(manifest.icons).toEqual([
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ]);

  for (const path of [
    '/favicon.svg',
    '/icons/favicon-32x32.png',
    '/icons/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-512.png',
  ]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should be available`).toBe(true);
  }
});
