import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { width: 1536, height: 768 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];

async function stubViewerData(page: Page) {
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

test('private viewer dark shell stays inside desktop and narrow viewports', async ({ page }) => {
  await stubViewerData(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/private-model/');
    await expect(page.getByText('Ylisrinne 3D', { exact: true })).toBeVisible();

    await page.locator('#model-source-badge').evaluate((element) => {
      element.textContent =
        'WORK_TEST: exceptionally long review candidate label used to guard narrow-toolbar overflow';
    });

    const noPageOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 &&
      document.body.scrollWidth <= document.documentElement.clientWidth + 1
    );
    expect(noPageOverflow).toBe(true);

    await page.locator('#view-menu > summary').click();
    const menuInsideViewport = await page.locator('#view-menu .toolbar-menu-panel').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1;
    });
    expect(menuInsideViewport).toBe(true);
    await page.locator('#view-menu').evaluate((element) => {
      (element as HTMLDetailsElement).open = false;
    });

    await page.locator('#layers-button').click();
    await expect(page.locator('#layers-panel')).toBeVisible();
    const layersInsideViewport = await page.locator('#layers-panel').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1;
    });
    expect(layersInsideViewport).toBe(true);
    await page.locator('#layers-button').click();
  }
});

test('private viewer exposes keyboard focus and honors reduced motion', async ({ page }) => {
  await stubViewerData(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/private-model/');

  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => {
    const expected = document.querySelector('#preset-menu > summary');
    const active = document.activeElement;
    return {
      correct: active === expected,
      outlineWidth: expected ? getComputedStyle(expected).outlineWidth : '',
    };
  });
  expect(firstFocus.correct).toBe(true);
  expect(firstFocus.outlineWidth).toBe('3px');

  await page.keyboard.press('Tab');
  await expect(page.locator('#view-menu > summary')).toBeFocused();
  const viewMenuOutline = await page.locator('#view-menu > summary').evaluate(
    (element) => getComputedStyle(element).outlineWidth,
  );
  expect(viewMenuOutline).toBe('3px');

  await page.keyboard.press('Tab');
  await expect(page.locator('#layers-button')).toBeFocused();
  const buttonOutline = await page.locator('#layers-button').evaluate(
    (element) => getComputedStyle(element).outlineWidth,
  );
  expect(buttonOutline).toBe('3px');

  const reducedMotionDuration = await page.locator('#layers-button').evaluate((element) => {
    (element as HTMLElement).style.transitionDuration = '10s';
    return getComputedStyle(element).transitionDuration;
  });
  expect(reducedMotionDuration).not.toBe('10s');
});


test('toolbar menus dismiss with Escape and outside pointer interaction', async ({ page }) => {
  await stubViewerData(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/private-model/');

  const viewMenu = page.locator('#view-menu');
  const viewSummary = page.locator('#view-menu > summary');
  await viewSummary.click();
  await expect(viewMenu).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(viewMenu).not.toHaveAttribute('open', '');
  await expect(viewSummary).toBeFocused();

  const presetMenu = page.locator('#preset-menu');
  await page.locator('#preset-menu > summary').click();
  await expect(presetMenu).toHaveAttribute('open', '');
  await page.locator('.title').click();
  await expect(presetMenu).not.toHaveAttribute('open', '');
});
