import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import contract from '../../src/scripts/privateModelC80Hi12Contract.json' with { type: 'json' };

// C80-041, DBOTH-WP3. A real, SHA-verified HI12 GLB is required for
// browser checks. Do not substitute a fake GLB or treat a skip as PASS.
test('HI12 whole-building FULL_CONTEXT and D BOTH use distinct exact scenes', async ({ page }) => {
  test.skip(!process.env.YLIS_HI12_GLB, 'Private HI12 source unavailable, WebGL NOT_RUN');
  const bytes = readFileSync(process.env.YLIS_HI12_GLB!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(contract.glbSha256);
  await page.route('**/private-model/work-test/ylisrinne-d-c80-hi12-work-test-20261029.glb',
    route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.route('**/private-model/source-cards.json',
    route => route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/?hi12=1');
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-c80-preview', 'ready', { timeout: 120_000 });
  await expect(canvas).toHaveAttribute('data-c80-source-sha256', contract.glbSha256);
  const variants = await page.locator('#c70-scene-variant option').evaluateAll(options =>
    options.map(option => ({ value: (option as HTMLOptionElement).value,
      label: option.textContent ?? '' })));
  expect(variants.map(option => option.value)).toEqual(['0', '1', '2']);
  expect(variants.map(option => option.label).join(' ')).not.toContain('K14 220 mm');

  const openPresets = async () => {
    if (await page.locator('#preset-menu').getAttribute('open') === null)
      await page.locator('#preset-menu > summary').click();
  };
  await openPresets();
  await page.locator('#whole-building-preset-button').click();
  await expect(canvas).toHaveAttribute('data-c80-scene-index', String(contract.viewerWholeScene));
  await expect(canvas).toHaveAttribute('data-c80-hi12-preset-scene', String(contract.viewerWholeScene));
  await expect(canvas).toHaveAttribute('data-c80-hi12-preset-role', 'FULL_CONTEXT_WORK_TEST');
  await expect(page.locator('#viewer-status')).toContainText('FULL_CONTEXT');

  await openPresets();
  await page.locator('#d-overview-preset-button').click();
  await expect(canvas).toHaveAttribute('data-c80-scene-index', '0');
  await expect(canvas).toHaveAttribute('data-c80-hi12-preset-scene', '0');
  await expect(canvas).toHaveAttribute('data-c80-hi12-preset-role', 'D_FLOOR_WORK_TEST');
  await expect(canvas).toHaveAttribute('data-c80-source-sha256', contract.glbSha256);
});
