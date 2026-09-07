import { expect, test } from '@playwright/test';

type SectionGeometry = {
  viewportHeight: number;
  sections: Record<string, { top: number; bottom: number }>;
};

const readSectionGeometry = async (page: Parameters<typeof test>[0]['page']) =>
  page.evaluate<SectionGeometry>(() => {
    const sections: Record<string, { top: number; bottom: number }> = {};

    document.querySelectorAll<HTMLElement>('[data-current-section]').forEach((section) => {
      const name = section.dataset.currentSection;
      if (!name) return;
      const rect = section.getBoundingClientRect();
      sections[name] = { top: rect.top, bottom: rect.bottom };
    });

    return {
      viewportHeight: window.innerHeight,
      sections,
    };
  });

const expectSectionEntryHidden = async (
  page: Parameters<typeof test>[0]['page'],
  sectionName: string
) => {
  await expect
    .poll(async () => (await readSectionGeometry(page)).sections[sectionName]?.top)
    .toBeLessThanOrEqual(0);

  const geometry = await readSectionGeometry(page);
  const top = geometry.sections[sectionName]?.top;
  expect(top).toBeDefined();
  expect(top).toBeGreaterThanOrEqual(-4);
};

test.describe('Current section viewport boundaries', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
  ]) {
    test(`keeps section divider lines outside ${viewport.width}x${viewport.height} desktop views`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/current/', { waitUntil: 'domcontentloaded' });

      const nav = page.locator('[data-current-section-nav]');
      await expect(nav).toBeVisible();

      await expect.poll(async () => {
        const geometry = await readSectionGeometry(page);
        return geometry.sections.electricity?.top - geometry.viewportHeight;
      }).toBeGreaterThanOrEqual(12);

      await nav.click();
      await expectSectionEntryHidden(page, 'electricity');

      await expect.poll(async () => {
        const geometry = await readSectionGeometry(page);
        return geometry.sections.markets?.top - geometry.viewportHeight;
      }).toBeGreaterThanOrEqual(12);

      const electricityView = await readSectionGeometry(page);
      expect(electricityView.sections.weather.bottom).toBeLessThanOrEqual(0);

      await nav.click();
      await expectSectionEntryHidden(page, 'markets');

      const marketsView = await readSectionGeometry(page);
      expect(marketsView.sections.electricity.bottom).toBeLessThanOrEqual(0);
    });
  }
});
