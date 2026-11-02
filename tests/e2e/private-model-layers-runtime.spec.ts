import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from 'three';
import { createViewerLayersRuntime } from '../../src/scripts/privateModelLayersRuntime';
import { applyViewerLayerPreset, createViewerInteractionState, setViewerInteractionLayerMode } from '../../src/scripts/privateModelViewerState';

const sha = 'cff2dbead53b7836747e10ef359637114ff723690ec380e313cec817e4f71d31';
const candidateId = 'auto-ylisrinne-d-c80r2-v26-stair-rail-landing-end-plywood-work-test-host-hold-20261102-1jglt7no';
const modelPath = '/private-model/work-test/' + candidateId + '.glb';

test('Layers frame narrows the scope mask and restores source materials and raycasts', () => {
  const scene = new Scene();
  const material = new MeshBasicMaterial();
  const wall = new Mesh(new BoxGeometry(), material);
  const outside = new Mesh(new BoxGeometry(), material);
  scene.add(wall, outside);
  const originalRaycast = wall.raycast;
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [{ id: 'architecture-walls', root: wall }] });
  let state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  state = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  const gates = new Map([[wall, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }]]);
  runtime.apply(state, { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds, gates });
  expect(wall.material).not.toBe(material);
  expect(material.opacity).toBe(1);
  expect(wall.raycast).not.toBe(originalRaycast);
  expect(outside.material).toBe(material);
  wall.visible = false; // existing floor/object filter is authoritative
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  state = setViewerInteractionLayerMode(state, 'architecture-walls', 'hidden');
  runtime.apply(state, { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds, gates });
  wall.visible = true; // legacy controller must not override a hidden layer
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  runtime.dispose();
  expect(wall.visible).toBe(true);
  expect(wall.material).toBe(material);
  expect(wall.raycast).toBe(originalRaycast);
});

test('Layers frame rejects a replaced scene or source without changing siblings', () => {
  const scene = new Scene();
  const wall = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const sibling = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  scene.add(wall, sibling);
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [{ id: 'architecture-walls', root: wall }] });
  runtime.enforce(scene, '0'.repeat(64));
  expect(wall.visible).toBe(false);
  expect(sibling.visible).toBe(true);
  runtime.dispose();
  expect(wall.visible).toBe(true);
});

test('exact V26 viewer: D upstairs, ghost walls, supported IV, reset, floor changes and mobile', async ({ page }, info) => {
  const sourcePath = process.env.YLIS_LAYERS_GLB;
  const production = process.env.YLIS_LAYERS_PRODUCTION === '1';
  if (production) expect(sourcePath, 'Protected full-source SHA readback is required').toBeTruthy();
  test.skip(!sourcePath, 'Actual private V26 bytes are supplied only locally or on trusted main.');
  test.setTimeout(540_000);
  const source = readFileSync(sourcePath!);
  expect(source.length).toBe(24205548);
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
      candidates: [{ id: candidateId, label: 'V26 WORK_TEST', path: modelPath }],
    } }));
    await page.route('**' + modelPath, route => { sourceVerified = true;
      return route.fulfill({ contentType: 'model/gltf-binary', body: source }); });
  }
  const canvas = page.locator('#private-model-canvas');
  const reviewUrl = origin + '/private-model/?review=' + candidateId + '-review';
  // A newly merged viewer can be ahead of its normal Cloudflare deployment.
  // Reload only the same authenticated viewer, never an alternate auth route.
  for (let attempt = 0; attempt < (production ? 12 : 1); attempt++) {
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true', { timeout: 120_000 });
    if (await canvas.getAttribute('data-layers-runtime') === 'active') break;
    if (production && attempt < 11) await page.waitForTimeout(10_000);
  }
  expect(sourceVerified).toBe(true);
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', sha);
  await expect(canvas).toHaveAttribute('data-layers-runtime', 'active');
  await page.locator('#layers-button').click();
  const preset = page.getByRole('combobox', { name: 'Näkymän esiasetus', exact: true });
  await expect(preset).toBeVisible();
  await preset.selectOption('d-2f');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(canvas).toHaveAttribute('data-layers-source-scene-index', '162');
  const walls = page.locator('[data-layer-node="architecture-walls"] select');
  const ventilation = page.locator('[data-layer-node="technical-ventilation"] select');
  const pose = await canvas.getAttribute('data-layers-camera-pose');
  await walls.selectOption('ghost');
  await ventilation.selectOption('hidden');
  await ventilation.selectOption('visible');
  await expect(page.locator('[data-layer-preset-customized]')).toContainText('Mukautettu');
  await expect(canvas).toHaveAttribute('data-layers-camera-pose', pose!);
  await expect(page.locator('[data-layer-node="architecture-ceilings"] select')).toHaveValue('hidden');
  await expect(page.locator('[data-layer-node="roof"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('layers-v26-2f-walls-ghost-iv-visible-desktop.png') });
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  await expect(walls).toHaveValue('visible');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(page.locator('[data-layer-preset-customized]')).not.toContainText('Mukautettu');
  await expect(canvas).toHaveAttribute('data-layers-camera-pose', pose!);
  for (const [value, floor, index] of [['d-1f', '1F', '174'], ['d-apartment', 'BOTH', '175'], ['d-2f', '2F', '162']]) {
    await preset.selectOption(value);
    await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', index);
    await expect(canvas).toHaveAttribute('data-main-view-source-sha256', sha);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await walls.selectOption('ghost');
  await ventilation.selectOption('visible');
  const bounds = await preset.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath('layers-v26-2f-walls-ghost-mobile.png') });
  await page.getByRole('button', { name: 'Palauta presetin asetukset' }).click();
  await expect(walls).toHaveValue('visible');
  await page.screenshot({ path: info.outputPath('layers-v26-2f-restored-mobile.png') });
  const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
  });
  expect(webgl).toEqual({ available: true, lost: false, error: 0 });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ source: sha, scene: 162, stages: ['ghost', 'IV-visible', 'reset', '1F', 'BOTH', '2F', 'mobile'], webgl, humanReview: 'NOT_RUN', production }));
});
