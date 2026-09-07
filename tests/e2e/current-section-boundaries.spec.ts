import { expect, test, type Page } from '@playwright/test';

type SectionGeometry = {
  viewportHeight: number;
  topbar: { top: number; bottom: number; height: number };
  sections: Record<string, { top: number; bottom: number }>;
};

const readSectionGeometry = async (page: Page) =>
  page.evaluate<SectionGeometry>(() => {
    const sections: Record<string, { top: number; bottom: number }> = {};

    document.querySelectorAll<HTMLElement>('[data-current-section]').forEach((section) => {
      const name = section.dataset.currentSection;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = { top: rect.top, bottom: rect.bottom };
    });

    const topbar = document.querySelector<HTMLElement>('.topbar');
    const topbarRect = topbar?.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
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

test.describe('Current section viewport boundaries', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
  ]) {
    test(`masks divider lines with the sticky header at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      // Production market data makes the document tall enough to align every section at
      // the intended entry point. CI deliberately does not depend on third-party market
      // responses, so add inert scroll range after Current without changing section geometry.
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

      await expect.poll(async () => {
        const geometry = await readSectionGeometry(page);
        return geometry.sections.electricity?.top - geometry.viewportHeight;
      }).toBeGreaterThanOrEqual(2);

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'electricity');

      await expect.poll(async () => {
        const geometry = await readSectionGeometry(page);
        return geometry.sections.markets?.top - geometry.viewportHeight;
      }).toBeGreaterThanOrEqual(2);

      const electricityView = await readSectionGeometry(page);
      expect(electricityView.sections.weather.bottom).toBeLessThan(electricityView.topbar.bottom);
      expect(electricityView.sections.weather.bottom).toBeGreaterThanOrEqual(electricityView.topbar.top);

      await nav.click();
      await expectSectionDividerMaskedByHeader(page, 'markets');

      const marketsView = await readSectionGeometry(page);
      expect(marketsView.sections.electricity.bottom).toBeLessThan(marketsView.topbar.bottom);
      expect(marketsView.sections.electricity.bottom).toBeGreaterThanOrEqual(marketsView.topbar.top);
    });
  }
});
