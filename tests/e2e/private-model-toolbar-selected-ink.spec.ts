import { expect, test } from '@playwright/test';

// Owner-approved toolbar palette: the active frame changes, but the icon must stay light.
// This checks the actual rendered SVG after interaction, not only its markup.
test('selected interaction tools retain light SVG ink over the grey frame and hover state', async ({ page }) => {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.goto('/private-model/?c70=1');

  const tools = page.locator('.toolbar > .interaction-tools');
  await expect(tools.locator('button.desk-icon[aria-pressed]')).toHaveCount(4);

  const toolIds = [
    'navigate-tool-button',
    'selection-tool-button',
    'point-pick-tool-button',
    'point-measure-tool-button',
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of toolIds) {
      const tool = tools.locator(`#${id}`);
      const icon = tool.locator('svg');
      const ink = 'rgb(241, 244, 245)';

      await tool.click();
      await page.mouse.move(0, 0);
      await expect(tool).toHaveAttribute('aria-pressed', 'true');
      await expect(tool).toHaveCSS('background-color', 'rgb(65, 74, 83)');
      await expect(tool).toHaveCSS('border-color', 'rgb(100, 114, 124)');
      await expect(tool).toHaveCSS('border-width', '1px');
      await expect(tool).not.toHaveCSS('box-shadow', 'none');
      await expect(icon).toHaveCSS('width', '22px');
      await expect(icon).toHaveCSS('height', '22px');
      await expect(tools.locator('button.desk-icon[aria-pressed="true"]')).toHaveCount(1);
      for (const otherId of toolIds) {
        if (otherId === id) continue;
        const other = tools.locator(`#${otherId}`);
        await expect(other).toHaveAttribute('aria-pressed', 'false');
        await expect(other).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(other).toHaveCSS('box-shadow', 'none');
      }
      await expect(tool).toHaveCSS('color', ink);
      await expect(icon).toHaveAttribute('stroke', 'currentColor');
      await expect(icon.locator('path').first()).toHaveCSS('stroke', ink);

      await tool.hover();
      await expect(tool).toHaveCSS('background-color', 'rgb(78, 86, 94)');
      await expect(icon.locator('path').first()).toHaveCSS('stroke', ink);
      const ratio = await tool.evaluate(node => {
        const css = getComputedStyle(node);
        const luminance = (rgb: string) => {
          const channels = rgb.match(/\d+/g)!.slice(0, 3).map(n => {
            const c = Number(n) / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        return (luminance(css.color) + 0.05) / (luminance(css.backgroundColor) + 0.05);
      });
      expect(ratio).toBeGreaterThan(4.5);
    }
  }
});

test('keyboard-driven toolbar selection retains one active grey frame and light SVG ink', async ({ page }) => {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.goto('/private-model/?c70=1');

  const tools = page.locator('.toolbar > .interaction-tools');
  const cases = [
    ['selection-tool-button', 'Enter'],
    ['point-pick-tool-button', 'Space'],
    ['point-measure-tool-button', 'Enter'],
    ['navigate-tool-button', 'Space'],
  ] as const;

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.mouse.move(0, 0);
    for (const [id, key] of cases) {
      const tool = tools.locator('#' + id);
      await tool.focus();
      await expect(tool).toBeFocused();
      await tool.press(key);

      await expect(tool).toHaveAttribute('aria-pressed', 'true');
      await expect(tool).toBeFocused();
      await expect(tools.locator('button.desk-icon[aria-pressed="true"]')).toHaveCount(1);
      await expect(tool).toHaveCSS('background-color', 'rgb(65, 74, 83)');
      await expect(tool).toHaveCSS('border-color', 'rgb(100, 114, 124)');
      await expect(tool.locator('svg path').first()).toHaveCSS('stroke', 'rgb(241, 244, 245)');
      for (const [otherId] of cases) {
        if (otherId !== id) {
          await expect(tools.locator('#' + otherId)).toHaveAttribute('aria-pressed', 'false');
        }
      }
    }
  }
});
