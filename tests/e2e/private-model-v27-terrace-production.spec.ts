import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const sha = '7dfc4842781e0c26ba85a46e38b322925830310b68a5054fa634baa5d2f7ce60';
const candidateId = 'c80r2-v27-d-terrace-165mm-20261102';
const modelPath = '/private-model/work-test/' + candidateId + '.glb';

test('exact V27 viewer: D upstairs, ghost walls, supported IV, reset, floor changes and mobile', async ({ page }, info) => {
  const sourcePath = process.env.YLIS_V27_TERRACE_GLB;
  const production = process.env.YLIS_V27_TERRACE_PRODUCTION === '1';
  if (production) expect(sourcePath, 'Protected full-source SHA readback is required').toBeTruthy();
  test.skip(!sourcePath, 'Actual private V27 bytes are supplied only locally or on trusted main.');
  test.setTimeout(540_000);
  const source = readFileSync(sourcePath!);
  expect(source.length).toBe(26768768);
  expect(createHash('sha256').update(source).digest('hex')).toBe(sha);
  const origin = production ? 'https://aapopihkala.fi' : 'http://127.0.0.1:4321';
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let sourceVerified = false;
  if (production) {
    const clientId = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const clientSecret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    expect(clientId && clientSecret, 'Existing read-only Access credentials are required').toBeTruthy();
    await page.route(origin + '/private-model/**', async route => {
      const response = await route.fetch({ maxRedirects: 0, headers: {
        ...route.request().headers(), 'cf-access-client-id': clientId!, 'cf-access-client-secret': clientSecret!,
      } });
      expect(response.status(), 'Protected request must stay authenticated').toBeLessThan(300);
      if (new URL(route.request().url()).pathname === modelPath) {
        const bytes = await response.body();
        expect(bytes.length).toBe(source.length);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha);
        sourceVerified = true;
      }
      await route.fulfill({ response });
    });
  } else {
    await page.route('**/private-model/model.glb', route => route.fulfill({ status: 404 }));
    await page.route('**/private-model/source-cards.json', route => route.fulfill({ status: 404 }));
    await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({ json: {
      candidates: [{ id: candidateId, label: 'V27 WORK_TEST', path: modelPath }],
    } }));
    await page.route('**' + modelPath, route => { sourceVerified = true;
      return route.fulfill({ contentType: 'model/gltf-binary', body: source }); });
  }
  const canvas = page.locator('#private-model-canvas');
  const reviewUrl = origin + '/private-model/?review=' + candidateId + '-review';
  const desktopViewport = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  // A newly merged viewer can be ahead of its normal Cloudflare deployment.
  // Reload only the same authenticated viewer, never an alternate auth route.
  for (let attempt = 0; attempt < (production ? 12 : 1); attempt++) {
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true', { timeout: 120_000 });
    if (await canvas.getAttribute('data-layers-runtime') === 'active' &&
        await page.locator('[data-technical-layer-availability]').count() === 1 &&
        await page.locator('#preset-context-status').evaluate(el =>
          getComputedStyle(el).textOverflow === 'ellipsis')) break;
    if (production && attempt < 11) await page.waitForTimeout(10_000);
  }
  expect(sourceVerified).toBe(true);
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', sha);
  await expect(canvas).toHaveAttribute('data-layers-runtime', 'active');
  await expect(page.locator('#preset-menu > summary')).toHaveCSS('width', '246px');
  await page.setViewportSize(desktopViewport);
  await page.locator('#layers-button').click();
  const preset = page.getByRole('combobox', { name: 'Näkymän esiasetus', exact: true });
  await expect(preset).toBeVisible();
  await preset.selectOption('d-2f');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(canvas).toHaveAttribute('data-layers-source-scene-index', '162');
  // An explicit camera action frames the selected floor before testing that
  // Layers edits themselves preserve it. Do not inherit the site's wide fit.
  await page.locator('#layers-button').click();
  await page.locator('#more-menu > summary').click();
  await page.locator('#fit-button').click();
  await page.locator('#layers-button').click();
  await expect(page.locator('[data-technical-layer-availability] [data-technical-layer="technical-ventilation"]')).toHaveAttribute('data-available', 'true');
  const walls = page.locator('[data-layer-node="architecture-walls"] select');
  const ventilation = page.locator('[data-layer-node="technical-ventilation"] select');
  const pose = await canvas.getAttribute('data-layers-camera-pose');
  const expectPreservedCamera = async () => {
    const before = JSON.parse(pose!);
    const after = JSON.parse((await canvas.getAttribute('data-layers-camera-pose'))!);
    // OrbitControls can round a target component by one floating-point bit
    // after an explicit fit. Keep a sub-nanometre tolerance, not string equality.
    for (const key of ['position', 'quaternion', 'target']) {
      expect(after[key]).toHaveLength(before[key].length);
      for (let i = 0; i < before[key].length; i++) {
        expect(after[key][i]).toBeCloseTo(before[key][i], 9);
      }
    }
    expect(after.zoom).toBeCloseTo(before.zoom, 9);
  };
  await walls.selectOption('ghost');
  await ventilation.selectOption('hidden');
  await ventilation.selectOption('visible');
  await expect(page.locator('[data-layer-preset-customized]')).toContainText('Mukautettu');
  await expectPreservedCamera();
  await expect(page.locator('[data-layer-node="architecture-ceilings"] select')).toHaveValue('hidden');
  await expect(page.locator('[data-layer-node="roof"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('v27-terrace-2f-walls-ghost-iv-visible-desktop.png') });
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  await expect(walls).toHaveValue('visible');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(page.locator('[data-layer-preset-customized]')).not.toContainText('Mukautettu');
  await expectPreservedCamera();
  for (const [value, floor, index] of [['d-1f', '1F', '176'], ['d-apartment', 'BOTH', '177'], ['d-2f', '2F', '162']]) {
    await preset.selectOption(value);
    await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', index);
    await expect(canvas).toHaveAttribute('data-main-view-source-sha256', sha);
    if (floor !== '2F') await page.screenshot({ path: info.outputPath('v27-terrace-' + floor + '-desktop.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#layers-button').click();
  await page.locator('#more-menu > summary').click();
  await page.locator('#fit-button').click();
  await page.locator('#layers-button').click();
  const readLiveCamera = async () => {
    // Read the existing render-frame HUD, not the Layers event snapshot.
    await canvas.evaluate(() => new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    return JSON.parse((await page.locator('#ai-navigator-readout').getAttribute('data-world-pose'))!);
  };
  const mobileCamera = await readLiveCamera();
  const mobileCanvas = await canvas.boundingBox();
  const expectMobileCamera = async () => {
    const after = await readLiveCamera();
    expect(after.projection).toBe(mobileCamera.projection);
    for (const key of ['position', 'target', 'direction']) {
      for (let i = 0; i < mobileCamera[key].length; i++) {
        expect(after[key][i]).toBeCloseTo(mobileCamera[key][i], 9);
      }
    }
    expect(await canvas.boundingBox()).toEqual(mobileCanvas);
  };
  await walls.selectOption('ghost');
  await ventilation.selectOption('visible');
  const bounds = await preset.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  // Keep the actual model visible in the two mobile evidence frames. The
  // controls and their state have already been exercised at this viewport.
  await page.locator('#layers-button').click();
  await expectMobileCamera();
  await page.screenshot({ path: info.outputPath('v27-terrace-2f-walls-ghost-mobile.png') });
  await page.locator('#layers-button').click();
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  await expect(walls).toHaveValue('visible');
  await page.locator('#layers-button').click();
  await expectMobileCamera();
  await page.screenshot({ path: info.outputPath('v27-terrace-2f-restored-mobile.png') });
  const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
  });
  expect(webgl).toEqual({ available: true, lost: false, error: 0 });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ source: sha, scene: 162, stages: ['ghost', 'IV-visible', 'reset', '1F', 'BOTH', '2F', 'mobile'], webgl, humanReview: 'NOT_RUN', production }));
});
