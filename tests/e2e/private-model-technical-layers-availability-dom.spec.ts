import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import type { TechnicalSystemSummary } from '../../src/scripts/privateModelTechnicalSystemsLayers';

const fixture = (
  id: TechnicalSystemSummary['id'],
  reason: TechnicalSystemSummary['reason'],
  role: TechnicalSystemSummary['sourceRole'],
  labelFi: string,
  boundCount = 0,
): TechnicalSystemSummary => ({
  id, reason, sourceRole: role, labelFi, boundCount,
  availability: reason === 'AVAILABLE' ? 'available' : 'unavailable',
  sourceDescription: 'Lähteen esitysobjektit',
  matchedCount: boundCount, currentInstallationVerified: false,
});

test('real DOM: model switch clears stale technical sources and never invents current installations', async ({ page }) => {
  const out = await build({
    entryPoints: ['src/scripts/privateModelTechnicalLayersAvailabilityUi.ts'],
    absWorkingDir: process.cwd(), bundle: true, platform: 'browser', format: 'iife',
    globalName: 'YlisTechnicalAvailability', write: false,
  });
  await page.setViewportSize({ width: 375, height: 720 });
  await page.setContent(
    '<div id="panel" style="width:290px; height:500px; overflow-y:auto"><div id="host"></div></div>',
  );
  await page.addStyleTag({
    content: readFileSync('src/styles/privateModelTechnicalLayersAvailability.css', 'utf8'),
  });
  await page.addScriptTag({ content: out.outputFiles[0].text });
  const input: TechnicalSystemSummary[] = [
    fixture('technical-ventilation', 'AVAILABLE', 'WORK_TEST_SOURCE', 'IV-laitteet ja venttiilit', 4),
    fixture('p161-iv-1974-plan', 'OPT_IN_REQUIRED', 'HISTORICAL_PLAN', 'IV 1974, suunnitelma'),
    fixture('technical-electrical', 'NO_OBJECTS_IN_SCENE', 'WORK_TEST_SOURCE', 'Sähkölaitteet ja valaisimet'),
  ];
  await page.evaluate((data) => {
    const app = (window as any).YlisTechnicalAvailability;
    const host = document.getElementById('host')!;
    (window as any).technicalPanel = app.mountTechnicalLayerAvailability(host, data);
  }, input);

  const root = page.locator('[data-technical-layer-availability]');
  const summary = root.locator('summary');
  await expect(root).toHaveCount(1);
  await expect(root).toHaveAttribute('data-availability-state', 'source-inventory');
  await expect(summary).toContainText('1/3 ryhmää');
  await summary.focus();
  await expect(summary).toBeFocused();
  await summary.press('Enter');
  await expect(root).toHaveAttribute('open', '');
  await expect(root.locator('[data-technical-layer]')).toHaveCount(3);
  await expect(root.locator('[data-technical-layer="technical-ventilation"]')).toContainText('WORK_TEST-lähde-esitys');
  await expect(root.locator('[data-technical-layer="p161-iv-1974-plan"]')).toContainText('Historiallinen suunnitelma');
  await expect(root.locator('[data-technical-layer="p161-iv-1974-plan"]')).toContainText('erillistä tutkimusnäkymän valintaa');
  await expect(root.locator('[data-technical-layer="technical-electrical"]')).toHaveAttribute('data-available', 'false');
  expect(await root.evaluate((el) => el.querySelectorAll('input, select, button').length)).toBe(0);
  const targetHeight = await summary.evaluate((el) => el.getBoundingClientRect().height);
  expect(targetHeight).toBeGreaterThanOrEqual(44);
  const horizontalOverflow = await page.locator('#panel')
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(horizontalOverflow).toBe(false);

  const mismatch: TechnicalSystemSummary[] = [
    fixture('technical-ventilation', 'SOURCE_MISMATCH', 'WORK_TEST_SOURCE', 'IV-laitteet ja venttiilit'),
  ];
  await page.evaluate((next) => (window as any).technicalPanel.update(next), mismatch);
  await expect(summary).toContainText('0/1 ryhmää');
  await expect(root.locator('[data-technical-layer="technical-ventilation"]')).toContainText('SHA-256');
  await expect(root.locator('[data-technical-layer]')).toHaveCount(1);
  await expect(summary).toBeFocused();

  // Even with a valid-looking binding count, a future/unknown runtime source
  // role must not be presented as a verified, selectable technical layer.
  const unknownRole: TechnicalSystemSummary[] = [
    fixture('technical-ventilation', 'AVAILABLE',
      'UNVERIFIED_FUTURE_ROLE' as TechnicalSystemSummary['sourceRole'],
      'IV-laitteet ja venttiilit', 4),
  ];
  await page.evaluate((next) => (window as any).technicalPanel.update(next), unknownRole);
  const unknownRow = root.locator('[data-technical-layer="technical-ventilation"]');
  await expect(summary).toContainText('0/1 ryhmää');
  await expect(unknownRow).toHaveAttribute('data-available', 'false');
  await expect(unknownRow).toContainText('lähteen asemaa ei ole varmennettu');
  await expect(unknownRow).toContainText('Lähteen asema ei ole varmennettu');
  await expect(unknownRow).not.toContainText('Saatavilla: 4');
  await expect(summary).toBeFocused();

  // An invalid whole inventory must revoke the previous model's availability.
  await page.evaluate(() => (window as any).technicalPanel.update(null));
  await expect(root).toHaveAttribute('data-availability-state', 'unverified');
  await expect(root.locator('[data-technical-layer]')).toHaveCount(0);
  await expect(summary).toContainText('ei ole vielä varmennettu');
  // A later valid source must still restore the rows normally.
  await page.evaluate((next) => (window as any).technicalPanel.update(next), input);
  await expect(summary).toContainText('1/3 ryhmää');
  await page.evaluate(() => (window as any).technicalPanel.update(undefined));
  await expect(root.locator('[data-technical-layer]')).toHaveCount(0);
  await expect(summary).toContainText('ei ole vielä varmennettu');

  await page.evaluate(() => (window as any).technicalPanel.update([]));
  await expect(root).toHaveAttribute('data-availability-state', 'unverified');
  await expect(summary).toContainText('ei ole vielä varmennettu');
  await expect(summary).not.toContainText('0/0');
  await expect(root.locator('[data-technical-layer]')).toHaveCount(0);
  await expect(summary).toBeFocused();

  const hostile: TechnicalSystemSummary[] = [
    fixture('technical-electrical', 'NO_OBJECTS_IN_SCENE', 'WORK_TEST_SOURCE',
      '<img src=x onerror=alert(1)>'),
  ];
  await page.evaluate((next) => (window as any).technicalPanel.update(next), hostile);
  await expect(root.locator('[data-technical-layer="technical-electrical"] strong'))
    .toHaveText('<img src=x onerror=alert(1)>');
  expect(await root.evaluate((el) => el.querySelectorAll('img').length)).toBe(0);

  const duplicateBlocked = await page.evaluate(() => {
    try {
      (window as any).YlisTechnicalAvailability.mountTechnicalLayerAvailability(
        document.getElementById('host'), []);
      return false;
    } catch { return true; }
  });
  expect(duplicateBlocked).toBe(true);
  await page.evaluate(() => (window as any).technicalPanel.destroy());
  await expect(root).toHaveCount(0);
  const remount = await page.evaluate(() => {
    const panel = (window as any).YlisTechnicalAvailability.mountTechnicalLayerAvailability(
      document.getElementById('host'), []);
    const valid = panel.root.dataset.availabilityState === 'unverified';
    panel.destroy();
    return valid;
  });
  expect(remount).toBe(true);
});
