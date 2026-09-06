import { expect, test, type Page } from '@playwright/test';

const siteUrl = 'https://aapopihkala.fi';
const metaImageUrl = `${siteUrl}/graphics/metakuva1.png`;

const expectMetaContent = async (
  page: Page,
  selector: string,
  expected: string
) => {
  const meta = page.locator(`head ${selector}`);
  await expect(meta).toHaveCount(1);
  await expect(meta).toHaveAttribute('content', expected);
};

test('home and About routes expose localized website social metadata', async ({ page }) => {
  for (const route of [
    {
      path: '/',
      title: 'Aapo Pihkala - Maisema-arkkitehti Espoo',
      description:
        'Aapo Pihkala on Espoossa toimiva maisema-arkkitehti. Maisema-arkkitehtuuria kaupunkien, ihmisten ja luonnon rajapinnassa.',
      canonical: `${siteUrl}/`,
      locale: 'fi_FI',
      alternateLocale: 'en_GB',
    },
    {
      path: '/en/',
      title: 'Aapo Pihkala - Landscape Architect, Espoo',
      description:
        'Aapo Pihkala is a landscape architect based in Espoo, Finland. Landscape architecture at the intersection of cities, people and nature.',
      canonical: `${siteUrl}/en/`,
      locale: 'en_GB',
      alternateLocale: 'fi_FI',
    },
    {
      path: '/about/',
      title: 'Tietoa minusta - Aapo Pihkala',
      description:
        'Tietoa maisema-arkkitehti Aapo Pihkalasta, työskentelystä ja suunnittelun näkökulmista.',
      canonical: `${siteUrl}/about/`,
      locale: 'fi_FI',
      alternateLocale: 'en_GB',
    },
    {
      path: '/en/about/',
      title: 'About - Aapo Pihkala',
      description:
        'About landscape architect Aapo Pihkala, his work and approach to landscape architecture.',
      canonical: `${siteUrl}/en/about/`,
      locale: 'en_GB',
      alternateLocale: 'fi_FI',
    },
  ] as const) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    await expectMetaContent(page, 'meta[property="og:type"]', 'website');
    await expectMetaContent(page, 'meta[property="og:site_name"]', 'Aapo Pihkala');
    await expectMetaContent(page, 'meta[property="og:locale"]', route.locale);
    await expectMetaContent(
      page,
      'meta[property="og:locale:alternate"]',
      route.alternateLocale
    );
    await expectMetaContent(page, 'meta[property="og:title"]', route.title);
    await expectMetaContent(
      page,
      'meta[property="og:description"]',
      route.description
    );
    await expectMetaContent(page, 'meta[property="og:url"]', route.canonical);
    await expectMetaContent(page, 'meta[property="og:image"]', metaImageUrl);
    await expectMetaContent(
      page,
      'meta[name="twitter:card"]',
      'summary_large_image'
    );
    await expectMetaContent(page, 'meta[name="twitter:title"]', route.title);
    await expectMetaContent(
      page,
      'meta[name="twitter:description"]',
      route.description
    );
    await expectMetaContent(page, 'meta[name="twitter:image"]', metaImageUrl);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      route.canonical
    );
  }
});

test('article routes keep one article-specific social metadata set', async ({ page }) => {
  await page.goto('/artikkelit/luontoviisas-piha/', {
    waitUntil: 'domcontentloaded',
  });

  await expectMetaContent(page, 'meta[property="og:type"]', 'article');
  await expect(page.locator('head meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('head meta[property="og:description"]')).toHaveCount(1);
  await expect(page.locator('head meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('head meta[name="twitter:card"]')).toHaveCount(1);
  await expect(page.locator('head meta[name="twitter:title"]')).toHaveCount(1);
  await expect(page.locator('head meta[name="twitter:description"]')).toHaveCount(1);
  await expect(page.locator('head meta[name="twitter:image"]')).toHaveCount(1);
});
