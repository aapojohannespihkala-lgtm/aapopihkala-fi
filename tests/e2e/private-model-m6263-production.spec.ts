import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';

// This spec never mocks a private model or injects a scene/selection handle.
// Only the existing trusted-main job supplies the readback and Access identities.
const SHA = '8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5';
const ID = 'c80-tate-mj62-mj63-integrated-20261113';
const ORIGIN = 'https://aapopihkala.fi';
const MODEL_PATH = '/private-model/work-test/' + ID + '.glb';
const P02_SHA = 'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a';
const STATES = [
  { floor: '1F', preset: 'd-1f', scene: 353, glazing: null },
  { floor: '2F', preset: 'd-2f', scene: 354, glazing: 'Suljettu' },
  { floor: '2F', preset: 'd-2f', scene: 356, glazing: 'Yksi lasi auki' },
  { floor: '2F', preset: 'd-2f', scene: 358, glazing: 'Lasit pinossa' },
  { floor: 'BOTH', preset: 'd-apartment', scene: 355, glazing: 'Suljettu' },
  { floor: 'BOTH', preset: 'd-apartment', scene: 357, glazing: 'Yksi lasi auki' },
  { floor: 'BOTH', preset: 'd-apartment', scene: 359, glazing: 'Lasit pinossa' },
] as const;

test('M6263 exact production: seven scenes, real source card, mobile and model restoration', async ({ page }, info) => {
  const production = process.env.YLIS_M6263_PRODUCTION === '1';
  test.skip(!production, 'Private production proof runs only on authenticated trusted main.');
  test.setTimeout(24 * 60_000);
  const sourcePath = process.env.YLIS_M6263_GLB;
  expect(sourcePath, 'Exact protected readback must be supplied').toBeTruthy();
  const source = readFileSync(sourcePath!);
  expect(source.length).toBe(53943060);
  expect(createHash('sha256').update(source).digest('hex')).toBe(SHA);
  expect(source.subarray(0, 4).toString()).toBe('glTF');
  expect(source.readUInt32LE(4)).toBe(2);
  expect(source.readUInt32LE(8)).toBe(source.length);
  const json = JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8'));
  expect(json.scene).toBe(292);
  expect(json.scenes).toHaveLength(360);
  expect(json.nodes).toHaveLength(12097);
  const credentials = {
    id: process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID,
    secret: process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET,
  };
  expect(credentials.id && credentials.secret, 'Existing read-only viewer identity is required').toBeTruthy();
  let sourceReadbacks = 0, p02Verified = false;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(ORIGIN + '/private-model/**', async route => {
    const response = await route.fetch({ maxRedirects: 0, headers: {
      ...route.request().headers(),
      'cf-access-client-id': credentials.id!,
      'cf-access-client-secret': credentials.secret!,
    } });
    expect(response.status(), 'Protected request must remain authenticated').toBeLessThan(300);
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === MODEL_PATH) {
      const bytes = await response.body();
      expect(bytes.length).toBe(source.length);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(SHA);
      sourceReadbacks++;
    } else if (pathname === '/private-model/work-test/c80-p02-water-integrated-20261111.glb') {
      const bytes = await response.body();
      expect(bytes.length).toBe(52535692);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(P02_SHA);
      p02Verified = true;
    }
    await route.fulfill({ response });
  });
  const canvas = page.locator('#private-model-canvas');
  const layersButton = page.locator('#layers-button');
  const setLayersOpen = async (open: boolean) => {
    if ((await layersButton.getAttribute('aria-expanded') === 'true') !== open) await layersButton.click();
  };
  const preset = page.getByRole('combobox', { name: 'Näkymän esiasetus', exact: true });
  const glazing = page.getByRole('combobox', { name: 'Parvekelasien asento', exact: true });
  const initialViewport = page.viewportSize()!;
  const receipts: unknown[] = [];
  const save = () => writeFileSync(info.outputPath('m6263-production-proof.json'), JSON.stringify({
    sourceSHA256: SHA, testedCommit: process.env.D_VIEW_TESTED_COMMIT,
    production: true, sourceReadbacks, p02Verified, receipts,
    pageErrors: errors, humanReview: 'NOT_RUN',
  }, null, 2));
  // Wait only for deployment of this same source, never an alternate endpoint.
  for (let attempt = 0; attempt < 12; attempt++) {
    await page.goto(ORIGIN + '/private-model/?review=' + ID + '-review', { waitUntil: 'domcontentloaded' });
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true', { timeout: 120_000 });
    if (await canvas.getAttribute('data-layers-source-sha256') === SHA &&
        await canvas.getAttribute('data-layers-runtime') === 'active') break;
    if (attempt < 11) await page.waitForTimeout(10_000);
  }
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', SHA);
  await expect(canvas).toHaveAttribute('data-layers-runtime', 'active');
  expect(sourceReadbacks).toBeGreaterThan(0);
  for (const state of STATES) {
    await setLayersOpen(true);
    await preset.selectOption(state.preset);
    if (state.glazing) await glazing.selectOption({ label: state.glazing });
    await expect(canvas).toHaveAttribute('data-main-view-floor', state.floor);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', String(state.scene));
    await expect(canvas).toHaveAttribute('data-layers-source-sha256', SHA);
    await setLayersOpen(false);
    await page.screenshot({ path: info.outputPath('m6263-scene-' + state.scene + '.png') });
    receipts.push({ scene: state.scene, floor: state.floor, glazing: state.glazing, sourceVerified: true });
    save();
  }
  // A real raycast on the corrected duct must resolve its new source card.
  await setLayersOpen(true);
  await preset.selectOption('d-1f');
  for (const id of ['architecture-walls', 'architecture-ceilings'])
    await page.locator('[data-layer-node="' + id + '"] [data-layer-mode="hidden"]').click();
  await page.locator('#edge-mode-select').selectOption('none');
  await setLayersOpen(false);
  await page.locator('#more-menu > summary').click();
  await page.locator('#fit-button').click();
  await page.locator('#selection-tool-button').click();
  const node = json.nodes[12096];
  expect(json.scenes[353].nodes).toContain(12096);
  expect(node.name).toBe('MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST');
  const accessor = json.accessors[json.meshes[node.mesh].primitives[0].attributes.POSITION];
  const point = new Vector3().fromArray(accessor.min).add(new Vector3().fromArray(accessor.max)).multiplyScalar(.5);
  const transform = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4();
  expect(node.translation ?? node.rotation ?? node.scale).toBeUndefined();
  point.applyMatrix4(transform);
  await canvas.evaluate(() => new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const pose = JSON.parse((await page.locator('#ai-navigator-readout').getAttribute('data-world-pose'))!);
  expect(pose.frame).toBe('THREE_WORLD_Y_UP');
  expect(pose.projection).toBe('perspective');
  const box = (await canvas.boundingBox())!;
  const camera = new PerspectiveCamera(38, box.width / box.height, .01, 5000);
  camera.position.fromArray(pose.position);
  camera.lookAt(new Vector3().fromArray(pose.target));
  camera.updateMatrixWorld(true);
  point.project(camera);
  expect(Math.abs(point.x)).toBeLessThan(1);
  expect(Math.abs(point.y)).toBeLessThan(1);
  const selection = page.locator('#selection-panel');
  const evidence = page.locator('#selection-source-evidence');
  const x = box.width * (point.x + 1) / 2, y = box.height * (1 - point.y) / 2;
  for (const [dx, dy] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]]) {
    if (await selection.isVisible()) await page.locator('#clear-selection-button').click();
    await canvas.click({ position: { x: x + dx, y: y + dy } });
    if (await selection.isVisible() && await evidence.getAttribute('data-state') === 'matched' &&
        await evidence.locator('a[href*="1v8tyPG99W-jglBnHO7VHnxEUj7Sz8S2i"]').count()) break;
  }
  await expect(selection).toBeVisible();
  await expect(evidence).toHaveAttribute('data-state', 'matched');
  await expect(evidence.locator('a[href*="1v8tyPG99W-jglBnHO7VHnxEUj7Sz8S2i"]').first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('m6263-real-duct-source-card.png') });
  receipts.push({ sourceCard: 'MJ63R2-restored-donor', scene: 353, realRaycast: true });
  await page.locator('#clear-selection-button').click();
  await setLayersOpen(true);
  await preset.selectOption('d-2f');
  await glazing.selectOption({ label: 'Lasit pinossa' });
  await setLayersOpen(false);
  for (const viewport of [{ width: 390, height: 844 }, initialViewport]) {
    await page.setViewportSize(viewport);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', '358');
    const bounds = (await canvas.boundingBox())!;
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: info.outputPath('m6263-stacked-' + viewport.width + '.png') });
  }
  const openModelMenu = async () => {
    await setLayersOpen(false);
    if (await page.locator('#model-menu').getAttribute('open') === null)
      await page.locator('#model-menu > summary').click();
  };
  await openModelMenu();
  await page.locator('#work-test-select').selectOption('c80-p02-water-integrated-20261111');
  await page.locator('#work-test-button').click();
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', P02_SHA, { timeout: 120_000 });
  expect(p02Verified).toBe(true);
  await openModelMenu();
  await page.locator('#current-model-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'current', { timeout: 120_000 });
  await openModelMenu();
  await page.locator('#work-test-select').selectOption(ID);
  await page.locator('#work-test-button').click();
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', SHA, { timeout: 120_000 });
  await setLayersOpen(true);
  await preset.selectOption('d-2f');
  await glazing.selectOption({ label: 'Suljettu' });
  await expect(canvas).toHaveAttribute('data-layers-source-scene-index', '354');
  await setLayersOpen(false);
  const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
  });
  expect(webgl).toEqual({ available: true, lost: false, error: 0 });
  expect(errors).toEqual([]);
  receipts.push({ modelSwitch: ['M6263', 'P02', 'CURRENT', 'M6263'], webgl });
  save();
  console.log(JSON.stringify({ production: true, sourceSHA256: SHA, scenes: STATES.map(s => s.scene),
    sourceReadbacks, p02Verified, webgl, pageErrors: errors, humanReview: 'NOT_RUN' }));
});
