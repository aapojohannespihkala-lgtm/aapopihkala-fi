import { expect, test, type Page } from '@playwright/test';

async function stubViewerData(page: Page) {
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

test('explicit reset restores the active research preset after view and layer changes', async ({ page }) => {
  await stubViewerData(page);
  await page.goto('/private-model/');

  const canvas = page.locator('#private-model-canvas');
  const clickHiddenButton = async (selector: string) => {
    await page.locator(selector).evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
  };

  await clickHiddenButton('#d2-plan-button');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-2f');

  await clickHiddenButton('#elev-pos-y-button');
  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'elev-pos-y');

  await page.locator('#roof-layer-visible').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#locus-layer-visible').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#edge-mode-select').evaluate((element) => {
    const select = element as HTMLSelectElement;
    select.value = 'none';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const architectureDoors = page.locator('#architecture-doors-visible');
  await expect(architectureDoors).toHaveCount(1);
  await architectureDoors.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');
  await expect(canvas).toHaveAttribute('data-architecture-doors-visible', 'false');

  await clickHiddenButton('#reset-view-defaults-button');

  await expect(canvas).toHaveAttribute('data-research-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-2f');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'reset:d-2f');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'visible');
  await expect(canvas).toHaveAttribute('data-architecture-doors-visible', 'true');

  await expect(page.locator('#roof-layer-visible')).not.toBeChecked();
  await expect(page.locator('#edge-mode-select')).toHaveValue('visible');
  await expect(architectureDoors).toBeChecked();
});
