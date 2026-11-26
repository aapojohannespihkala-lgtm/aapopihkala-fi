import { expect, test } from '@playwright/test';

/**
 * VIEWER-QA-8: keyboard and touch control checks without a private GLB.
 * The regular PR check runs Chromium. For an actual WebKit replay, install
 * Playwright's matching WebKit browser and run:
 *   QA8_BROWSER=webkit npx playwright test private-model-qa8-webkit-toolbar.spec.ts
 * A green Chromium job must never be reported as a Safari/WebKit pass.
 */
test.use({ browserName: process.env.QA8_BROWSER === 'webkit' ? 'webkit' : 'chromium' });

async function openViewer(page: import('@playwright/test').Page) {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [] } }));
  await page.goto('/private-model/?c70=1');
  await expect(page.locator('.desk-toolbar')).toBeVisible();
}

test.describe('wide keyboard and visible selection', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('preset and camera details return keyboard focus; cube retains white icon', async ({ page, browser }) => {
    await openViewer(page);
    test.info().annotations.push({ type: 'engine', description: browser.browserType().name() + '/' + browser.version() });
    const preset = page.locator('#preset-menu');
    const presetSummary = preset.locator(':scope > summary');
    const view = page.locator('#view-menu');
    const viewSummary = view.locator(':scope > summary');

    await presetSummary.focus();
    await presetSummary.press('Enter');
    await expect(preset).toHaveAttribute('open', '');
    await expect(presetSummary).toBeFocused();
    await presetSummary.press('Enter');
    await expect(preset).not.toHaveAttribute('open', '');
    await expect(presetSummary).toBeFocused();

    await viewSummary.focus();
    await viewSummary.press('Enter');
    await expect(view).toHaveAttribute('open', '');
    await expect(viewSummary).toBeFocused();
    await viewSummary.press('Enter');
    await expect(view).not.toHaveAttribute('open', '');
    await expect(viewSummary).toBeFocused();

    const cube = page.getByRole('button', { name: 'Suuntailmaisin' });
    await expect(cube).toHaveAttribute('aria-expanded', 'true');
    await expect(cube.locator('svg path').first()).toHaveCSS('stroke', 'rgb(241, 244, 245)');
    await cube.click();
    await expect(cube).toHaveAttribute('aria-expanded', 'false');
    await expect(cube).toBeFocused();
    await cube.press('Enter');
    await expect(cube).toHaveAttribute('aria-expanded', 'true');
    await expect(cube.locator('svg path').first()).toHaveCSS('stroke', 'rgb(241, 244, 245)');
  });
});

test.describe('narrow touch controls', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });

  test('touch opens preset and camera choices, then restores active tool and layers', async ({ page, browser }) => {
    await openViewer(page);
    test.info().annotations.push({ type: 'engine', description: browser.browserType().name() + '/' + browser.version() });
    const preset = page.locator('#preset-menu');
    const presetSummary = preset.locator(':scope > summary');
    const camera = page.locator('#view-menu');
    const cameraSummary = camera.locator(':scope > summary');

    await presetSummary.tap();
    await expect(preset).toHaveAttribute('open', '');
    await expect(preset.locator('button').first()).toBeVisible();
    await presetSummary.tap();
    await expect(preset).not.toHaveAttribute('open', '');

    await cameraSummary.tap();
    await expect(camera).toHaveAttribute('open', '');
    await expect(camera.locator('#elev-pos-x-button')).toBeVisible();
    await cameraSummary.tap();
    await expect(camera).not.toHaveAttribute('open', '');

    const tool = page.locator('#point-pick-tool-button');
    await tool.tap();
    await expect(tool).toHaveAttribute('aria-pressed', 'true');
    // Touch browsers differ in whether a tapped button keeps :hover; both
    // colors belong to the approved selected frame, never the neutral frame.
    await expect(tool).toHaveCSS('background-color', /rgb\((65, 74, 83|78, 86, 94)\)/);
    const navigate = page.locator('#navigate-tool-button');
    await navigate.tap();
    await expect(tool).toHaveAttribute('aria-pressed', 'false');
    await expect(navigate).toHaveAttribute('aria-pressed', 'true');
    // Selection is sticky across touch focus/hover changes.
    await expect(navigate).toHaveCSS('background-color', /rgb\((65, 74, 83|78, 86, 94)\)/);

    const layers = page.getByRole('button', { name: 'Layerit', exact: true });
    await layers.tap();
    await expect(layers).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#layers-panel')).toBeVisible();
    await layers.tap();
    await expect(layers).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#layers-panel')).toBeHidden();
    // Opening a side panel must not silently reset the active viewport tool.
    await expect(navigate).toHaveAttribute('aria-pressed', 'true');
    await expect(tool).toHaveAttribute('aria-pressed', 'false');
  });
});
