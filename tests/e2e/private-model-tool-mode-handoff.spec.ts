import { expect, test } from '@playwright/test';

// VIEWER-QA-5: source-independent toolbar transitions. Real R34 surface picking,
// measurement accuracy and authenticated WebGL are separately gated.
for (const width of [1440, 390]) {
  test(`tool handoff preserves one active mode and restores viewport panels at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
    await page.goto('/private-model/?c70=1');

    const canvas = page.locator('#private-model-canvas');
    const tools = page.locator('.toolbar > .interaction-tools');
    const navigate = tools.locator('#navigate-tool-button');
    const select = tools.locator('#selection-tool-button');
    const point = tools.locator('#point-pick-tool-button');
    const measure = tools.locator('#point-measure-tool-button');
    const pointPanel = page.locator('#point-pick-panel');
    const measurePanel = page.locator('#point-measure-panel');
    const cube = page.locator('#orientation-gizmo');
    const cubeButton = page.locator('#navigation-cube-button');
    const buttons = [navigate, select, point, measure];

    const checkMode = async (mode: 'navigate' | 'select' | 'point-pick' | 'point-measure') => {
      await expect(canvas).toHaveAttribute('data-interaction-mode', mode);
      const pressed = await Promise.all(buttons.map(button => button.getAttribute('aria-pressed')));
      expect(pressed).toEqual(buttons.map((_, i) => String(
        ['navigate', 'select', 'point-pick', 'point-measure'][i] === mode,
      )));
      await expect(pointPanel).toBeVisible({ visible: mode === 'point-pick' });
      await expect(measurePanel).toBeVisible({ visible: mode === 'point-measure' });
    };

    await navigate.click();
    await checkMode('navigate');
    await select.click();
    await checkMode('select');

    // Selecting a point never retains the previous measured segment or selection.
    await point.click();
    await checkMode('point-pick');
    await expect(page.locator('#point-pick-copy')).toBeDisabled();
    await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');

    await measure.click();
    await checkMode('point-measure');
    await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
    await expect(canvas).toHaveAttribute('data-point-measure-state', 'empty');
    await expect(page.locator('#point-measure-main')).toContainText('ensimmäinen piste');

    // Minimize and restore measurement from its owning toolbar button.
    await measurePanel.getByRole('button', { name: 'Pienennä: Mittaa 3D' }).click();
    await expect(measurePanel).toBeHidden();
    await expect(canvas).toHaveAttribute('data-interaction-mode', 'point-measure');
    await measure.press('Enter');
    await checkMode('point-measure');

    // Cube visibility must be independent from the active measurement tool.
    await expect(cube).toBeVisible();
    await cubeButton.click();
    await expect(cube).toBeHidden();
    await expect(cubeButton).toHaveAttribute('aria-expanded', 'false');
    await checkMode('point-measure');

    await point.click();
    await checkMode('point-pick');
    await expect(canvas).toHaveAttribute('data-point-measure-state', 'empty');
    await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
    await pointPanel.getByRole('button', { name: 'Pienennä: Piste mallissa' }).click();
    await expect(pointPanel).toBeHidden();
    await point.press('Enter');
    await checkMode('point-pick');

    await select.click();
    await checkMode('select');
    await expect(canvas).toHaveAttribute('data-point-pick-state', 'empty');
    await expect(canvas).toHaveAttribute('data-point-measure-state', 'empty');
    await navigate.click();
    await checkMode('navigate');
    await expect(cube).toBeHidden();
    await cubeButton.press('Enter');
    await expect(cube).toBeVisible();
    await expect(cubeButton).toHaveAttribute('aria-expanded', 'true');
    await checkMode('navigate');
  });
}
