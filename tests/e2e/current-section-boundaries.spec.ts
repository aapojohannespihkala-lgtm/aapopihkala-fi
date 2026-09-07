import { expect, test, type Page } from '@playwright/test';

type SectionGeometry = {
  viewportHeight: number;
  viewportWidth: number;
  documentWidth: number;
  topbar: { top: number; bottom: number; height: number };
  sections: Record<
    string,
    { top: number; bottom: number; inlineMinHeight: string; computedMinHeight: string }
  >;
};

const readSectionGeometry = async (page: Page) =>
  page.evaluate<SectionGeometry>(() => {
    const sections: Record<
      string,
      { top: number; bottom: number; inlineMinHeight: string; computedMinHeight: string }
    > = {};

    document.querySelectorAll<HTMLElement>('[data-current-section]').forEach((section) => {
      const name = section.dataset.currentSection;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = {
        top: rect.top,
        bottom: rect.bottom,
        inlineMinHeight: section.style.minHeight,
        computedMinHeight: getComputedStyle(section).minHeight,
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

const expectSectionDividerMaskedByHeader = async (page: Page, sectionName: string) => {
  await expect
    .poll(async () => {
      const geometry = await readSectionGeometry(page);
      const top = geometry.sections[sectionName]?.top;
      if (top === undefined) return Number.POSITIVE_INFINITY;
      return top - geometry.topbar.bottom;
    })
    .toBeLessThanOrEqual(-1);

  const geometry = await readSectionGeometry(page);
  const top = geometry.sections[sectionName]?.top;
  expect(top).toBeDefined();
  expect(geometry.topbar.height).toBeGreaterThan(0);
  expect(top).toBeGreaterThanOrEqual(geometry.topbar.top);
  expect(top).toBeLessThan(geometry.topbar.bottom);

  const coveredByTopbar = await page.evaluate((name) => {
    const section = document.querySelector<HTMLElement>(`[data-current-section="${name}"]`);
    const topbar = document.querySelector<HTMLElement>('.topbar');
    if (!section || !topbar) return false;

    const sectionRect = section.getBoundingClientRect();
    const topbarRect = topbar.getBoundingClientRect();
    const x = window.innerWidth / 2;
    const y = Math.min(
      topbarRect.bottom - 1,
      Math.max(topbarRect.top + 1, sectionRect.top + 0.5)
    );
    const coveringElement = document.elementFromPoint(x, y);
    return coveringElement instanceof Element && coveringElement.closest('.topbar') === topbar;
  }, sectionName);

  expect(coveredByTopbar).toBe(true);
};

test.describe('Current content-driven section navigation', () => {
  for (const viewport of [
    { width: 1638, height: 675, label: '67-percent-like' },
    { width: 1092, height: 450, label: '100-percent-like' },
    { width: 874, height: 360, label: '125-percent-like' },
    { width: 728, height: 300, label: '150-percent-like' },
  ]) {
    test(`keeps natural section heights and masked dividers at ${viewport.label}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('aapopihkala-analytics-consent-v1', 'denied');
        } catch {
          // Storage may be unavailable before the page origin is established.
        }
      });

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      // Third-party market data is intentionally not required in CI. Add inert scroll range
      // so the last section can still be aligned under the sticky header without changing
      // the geometry of the Current sections themselves.
      await page.evaluate(() => {
        const spacer = document.createElement('div');
        spacer.setAttribute('data-current-boundary-test-spacer', '');
        spacer.style.height = `${window.innerHeight * 2}px`;
        spacer.style.pointerEvents = 'none';
        spacer.setAttribute('aria-hidden', 'true');
        document.body.append(spacer);
      });

      const nav = page.locator('[data-current-section-nav]');
      const topbar = page.locator('.topbar');
      await expect(nav).toBeVisible();
      await expect(topbar).toHaveCSS('position', 'sticky');

      const initial = await readSectionGeometry(page);
      expect(initial.documentWidth).toBeLessThanOrEqual(initial.viewportWidth + 1);

      for (const name of ['weather', 'electricity', 'markets']) {
        expect(initial.sections[name]?.inlineMinHeight).toBe('');
        expect(initial.sections[name]?.computedMinHeight).toBe('0px');
      }

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'electricity');
      await expect.poll(async () => nav.getAttribute('aria-label')).toContain('markets');

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'markets');
      await expect.poll(async () => nav.getAttribute('aria-label')).toContain('Back to Current top');
    });
  }
});
