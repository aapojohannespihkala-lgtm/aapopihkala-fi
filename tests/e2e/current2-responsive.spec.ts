import { expect, test, type Page } from '@playwright/test';

type Geometry = {
  viewportHeight: number;
  viewportWidth: number;
  documentWidth: number;
  topbar: { top: number; bottom: number; height: number };
  sections: Record<string, { top: number; bottom: number; inlineMinHeight: string }>;
};

const readGeometry = async (page: Page) =>
  page.evaluate<Geometry>(() => {
    const sections: Record<string, { top: number; bottom: number; inlineMinHeight: string }> = {};

    document.querySelectorAll<HTMLElement>('[data-current2-section]').forEach((section) => {
      const name = section.dataset.current2Section;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = {
        top: rect.top,
        bottom: rect.bottom,
        inlineMinHeight: section.style.minHeight,
      };
    });

    const topbar = document.querySelector<HTMLElement>('.topbar');
    const topbarRect = topbar?.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      topbar: topbarRect
        ? { top: topbarRect.top, bottom: topbarRect.bottom, height: topbarRect.height }
        : { top: 0, bottom: 0, height: 0 },
      sections,
    };
  });

const expectMaskedByHeader = async (page: Page, sectionName: string) => {
  await expect
    .poll(async () => {
      const geometry = await readGeometry(page);
      const top = geometry.sections[sectionName]?.top;
      if (top === undefined) return Number.POSITIVE_INFINITY;
      return top - geometry.topbar.bottom;
    })
    .toBeLessThanOrEqual(-1);

  const geometry = await readGeometry(page);
  const top = geometry.sections[sectionName]?.top;
  expect(top).toBeDefined();
  expect(geometry.topbar.height).toBeGreaterThan(0);
  expect(top).toBeGreaterThanOrEqual(geometry.topbar.top);
  expect(top).toBeLessThan(geometry.topbar.bottom);
};

test.describe('Current2 responsive comparison', () => {
  for (const viewport of [
    { width: 1638, height: 675, label: '67-percent-like' },
    { width: 1092, height: 450, label: '100-percent-like' },
    { width: 874, height: 360, label: '125-percent-like' },
    { width: 728, height: 300, label: '150-percent-like' },
  ]) {
    test(`keeps content-driven sections and navigation at ${viewport.label}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
        } catch {
          // Storage may be unavailable before the page origin is established.
        }
      });

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current2/', { waitUntil: 'domcontentloaded' });

      await page.evaluate(() => {
        const spacer = document.createElement('div');
        spacer.style.height = `${window.innerHeight * 2}px`;
        spacer.style.pointerEvents = 'none';
        spacer.setAttribute('aria-hidden', 'true');
        document.body.append(spacer);
      });

      const nav = page.locator('[data-current2-section-nav]');
      await expect(nav).toBeVisible();
      await expect(page.locator('.topbar')).toHaveCSS('position', 'sticky');

      const initial = await readGeometry(page);
      expect(initial.documentWidth).toBeLessThanOrEqual(initial.viewportWidth + 1);
      expect(initial.sections.weather.inlineMinHeight).toBe('');
      expect(initial.sections.electricity.inlineMinHeight).toBe('');
      expect(initial.sections.markets.inlineMinHeight).toBe('');

      await expect(page.locator('tv-market-data')).toHaveCount(0);
      await expect(page.locator('[data-current-market-performance]')).toHaveCount(1);
      await expect(page.locator('[data-market-performance-row]')).toHaveCount(12);
      await expect(page.getByText('Handelsbanken Usa Indeksi', { exact: true })).toBeVisible();
      await expect(page.getByText('Nordnet Suomi Indeksi', { exact: true })).toBeVisible();
      await expect(page.getByText('Marimekko', { exact: true })).toBeVisible();
      await expect(page.getByText('Remedy', { exact: true })).toBeVisible();
      await expect(page.locator('[data-market-performance-row="world"]')).toHaveCount(0);

      await nav.click();
      await expectMaskedByHeader(page, 'electricity');

      await expect
        .poll(async () => nav.getAttribute('aria-label'))
        .toContain('markets');

      await nav.click();
      await expectMaskedByHeader(page, 'markets');

      if (viewport.width <= 820) {
        await expect(page.locator('.markets-custom-row--header .period-week1')).toBeHidden();
        await expect(page.locator('.markets-custom-row--header .period-month6')).toBeHidden();
      } else {
        await expect(page.locator('.markets-custom-row--header .period-week1')).toBeVisible();
        await expect(page.locator('.markets-custom-row--header .period-month6')).toBeVisible();
      }

      await expect
        .poll(async () => nav.getAttribute('aria-label'))
        .toContain('Back to Current2 top');
    });
  }
});
