import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from 'three';
import { collectViewerLayerSourceNodes, createViewerLayersRuntime } from '../../src/scripts/privateModelLayersRuntime';
import { buildViewerLayerPanelModel } from '../../src/scripts/privateModelLayersPresetControls';
import { applyViewerLayerPreset, createViewerInteractionState, setViewerInteractionLayerMode } from '../../src/scripts/privateModelViewerState';

const sha = 'cff2dbead53b7836747e10ef359637114ff723690ec380e313cec817e4f71d31';

test('fixture visibility describes source-bound parts rather than complete cabinets', () => {
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'd-2f');
  const panel = buildViewerLayerPanelModel(state, ['architecture-fixtures'],
    { boundNodeIds: ['architecture-fixtures'] });
  const furniture = panel.roots.find(node => node.id === 'furniture');
  const fixtures = furniture?.children.find(node => node.layerId === 'architecture-fixtures');
  expect(fixtures?.label).toBe('Kiintokalusteiden tunnistetut osat');
  expect(fixtures?.commandIds).toEqual(['architecture-fixtures']);
  const source = readFileSync('src/scripts/privateModelLayersPresetControls.ts', 'utf8');
  expect(source).toContain('Kalusteen etupintojen piilotus ei välttämättä piilota runkoa.');
});

test('source node collection requires original glTF scene and parent membership', () => {
  const scene = new Scene();
  const walls = new Group(); walls.name = 'Walls';
  const room = new Group(); room.name = 'Room';
  const roof = new Group(); roof.name = 'Roof';
  const unlisted = new Group(); unlisted.name = 'Unlisted';
  walls.add(room);
  scene.add(walls, roof, unlisted);
  const source = {
    scenes: [scene],
    parser: {
      associations: new Map([
        [walls, { nodes: 0 }], [room, { nodes: 1 }],
        [roof, { nodes: 2 }], [unlisted, { nodes: 3 }],
      ]),
      json: {
        scenes: [{ nodes: [0, 2] }],
        nodes: [
          { name: 'Walls', children: [1] },
          { name: 'Room' }, { name: 'Roof' }, { name: 'Unlisted' },
        ],
      },
    },
  };
  const collected = () => collectViewerLayerSourceNodes(source, scene, 0, sha)
    .map(({ nodeIndex, parentNodeIndex }) => [nodeIndex, parentNodeIndex]);
  expect(collected()).toEqual([[0, null], [1, 0], [2, null]]);
  roof.add(room); // Loader association now disagrees with source JSON parent.
  expect(collected()).toEqual([[0, null], [2, null]]);
  walls.add(room);
  expect(collected()).toEqual([[0, null], [1, 0], [2, null]]);
});

test('Layers reset uses visibility refresh rather than reapplying the same camera preset', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const handler = source.match(/onReset: \(\) => \{([\s\S]*?)\n        \},/)?.[1];
  expect(handler, 'The current Layers reset callback must be present').toBeDefined();
  expect(handler).toContain('resetViewerLayerPresetToDefaults(layersState)');
  expect(handler).toContain('refreshLayers()');
  expect(handler).not.toContain('commitLayerPreset(');
  expect(handler).not.toContain('applyStandardViewPreset(');
});

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

test('failed Layers frame cannot be re-exposed by legacy state', () => {
  const scene = new Scene();
  const wall = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  scene.add(wall);
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [{ id: 'architecture-walls', root: wall }] });
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const frame = { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds,
    gates: new Map([[wall, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }]]) };
  runtime.apply(state, frame);
  const ghost = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  expect(() => runtime.apply(ghost, { ...frame,
    isSelected: () => { throw Error('selection failure'); } })).toThrow('selection failure');
  wall.visible = true;
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  runtime.apply(state, frame);
  expect(wall.visible).toBe(true);
  runtime.dispose();
});

test('a reparented GLB root stays hidden until its original source path returns', () => {
  const scene = new Scene();
  const wall = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const sibling = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const sourceParent = new Group();
  const otherParent = new Group();
  sourceParent.add(wall);
  scene.add(sourceParent, otherParent, sibling);
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [{ id: 'architecture-walls', root: wall }] });
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const frame = { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds,
    gates: new Map([[wall, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }]]) };
  runtime.apply(state, frame);
  expect(wall.visible).toBe(true);
  otherParent.add(wall); // Same scene and SHA, but wrong original node-parent path.
  wall.visible = true; // A legacy rendering pass cannot authorize this relocation.
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  expect(sibling.visible).toBe(true);
  sourceParent.add(wall);
  runtime.apply(state, frame);
  expect(wall.visible).toBe(true);
  otherParent.add(sourceParent); // A moved ancestor also invalidates the path.
  wall.visible = true;
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  scene.add(sourceParent);
  runtime.apply(state, frame);
  expect(wall.visible).toBe(true);
  runtime.dispose();
});

test('apply fails closed on displaced GLB paths before enforce without mutating gates', () => {
  const scene = new Scene();
  const parent = new Group();
  const alternateParent = new Group();
  const wall = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const sibling = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  parent.add(wall);
  scene.add(parent, alternateParent, sibling);
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [
      { id: 'architecture-walls', root: wall },
      { id: 'architecture-doors', root: sibling },
    ] });
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const gates = new Map([
    [wall, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }],
    [sibling, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }],
  ]);
  const frame = { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds, gates };
  const apply = () => runtime.apply(state, frame);

  expect(apply().map(({ mode }) => mode)).toEqual(['visible', 'visible']);
  alternateParent.add(wall); // Still within scene, no longer on its original GLB path.
  wall.visible = false;
  const displaced = apply(); // No intervening enforce() call.
  expect(displaced.map(({ mode }) => mode)).toEqual(['hidden', 'visible']);
  expect(wall.visible).toBe(false);
  expect(sibling.visible).toBe(true);
  expect(gates.get(wall)).toEqual({
    sourceAllowed: true, scopeAllowed: true, floorAllowed: true,
  });

  parent.add(wall);
  expect(apply().map(({ mode }) => mode)).toEqual(['visible', 'visible']);
  expect(wall.visible).toBe(true);

  alternateParent.add(parent); // The bound root's ancestor can move as well.
  wall.visible = false;
  expect(apply().map(({ mode }) => mode)).toEqual(['hidden', 'visible']);
  expect(wall.visible).toBe(false);
  expect(sibling.visible).toBe(true);

  scene.add(parent);
  expect(apply().map(({ mode }) => mode)).toEqual(['visible', 'visible']);
  expect(wall.visible).toBe(true);
  runtime.dispose();
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

// Keep the proven predecessor and the current main-chain source independently
// pinned. A trusted production job supplies only its matching immutable bytes.
for (const model of [
  { version: 'V26', sourceEnv: 'YLIS_LAYERS_GLB', productionEnv: 'YLIS_LAYERS_PRODUCTION',
    candidateId: 'auto-ylisrinne-d-c80r2-v26-stair-rail-landing-end-plywood-work-test-host-hold-20261102-1jglt7no',
    sha, bytes: 24205548, firstFloor: '174', secondFloor: '162', bothFloors: '175', upstairsRoof: false },
  { version: 'V29', sourceEnv: 'YLIS_LAYERS_V29_GLB', productionEnv: 'YLIS_LAYERS_V29_PRODUCTION',
    candidateId: 'auto-ylisrinne-d-c80r2-v29-west-full-facade-plinth-work-test-host-hold-20261102-1vfk15ke',
    sha: '5325da8472055379f30be59e22be3b6237093e59e6a21999471a2c2b28c784f6',
    bytes: 26840880, firstFloor: '180', secondFloor: '162', bothFloors: '181', upstairsRoof: false },
  { version: 'V35', sourceEnv: 'YLIS_LAYERS_V35_GLB', productionEnv: 'YLIS_LAYERS_V35_PRODUCTION',
    candidateId: 'auto-ylisrinne-d-c80r2-v35-2f-wc-yellow-tiles-photo-work-test-host-hold-20261102-11iiyoiu',
    sha: 'f81e0915711b798ec4a02472202a3372a4a77057cd8a150cc17f89bef3cd4789',
    bytes: 30023592, firstFloor: '194', secondFloor: '197', bothFloors: '198', upstairsRoof: true },
] as const) {
test(`exact ${model.version} viewer: D upstairs, ghost walls, supported IV, reset, floor changes and mobile`, async ({ page }, info) => {
  const { sha, candidateId } = model;
  const modelPath = '/private-model/work-test/' + candidateId + '.glb';
  const evidencePrefix = 'layers-' + model.version.toLowerCase();
  const sourcePath = process.env[model.sourceEnv];
  const production = process.env[model.productionEnv] === '1';
  if (production) expect(sourcePath, 'Protected full-source SHA readback is required').toBeTruthy();
  test.skip(!sourcePath, `Actual private ${model.version} bytes are supplied only locally or on trusted main.`);
  test.setTimeout(540_000);
  const source = readFileSync(sourcePath!);
  expect(source.length).toBe(model.bytes);
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
      candidates: [{ id: candidateId, label: model.version + ' WORK_TEST', path: modelPath }],
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
        await page.locator('#layers-button').innerText() === 'Sisältö' &&
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
  await expect(canvas).toHaveAttribute('data-layers-source-scene-index', model.secondFloor);
  // An explicit camera action frames the selected floor before testing that
  // Layers edits themselves preserve it. Do not inherit the site's wide fit.
  await page.locator('#layers-button').click();
  await page.locator('#more-menu > summary').click();
  await page.locator('#fit-button').click();
  await page.locator('#layers-button').click();
  await expect(page.locator('[data-technical-layer-availability] [data-technical-layer="technical-ventilation"]')).toHaveAttribute('data-available', 'true');
  const walls = page.locator('[data-layer-node="architecture-walls"]');
  const ventilation = page.locator('[data-layer-node="technical-ventilation"]');
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
  await walls.locator('[data-layer-mode="ghost"]').click();
  await ventilation.locator('[data-layer-mode="hidden"]').click();
  await ventilation.locator('[data-layer-mode="visible"]').click();
  await expect(page.locator('[data-layer-preset-customized]')).toContainText('Mukautettu');
  await expectPreservedCamera();
  await expect(page.locator('[data-layer-node="architecture-ceilings"] [data-layer-mode="hidden"]')).toHaveAttribute('aria-pressed', 'true');
  const roof = page.locator('[data-layer-node="roof"]');
  await expect(roof).toHaveCount(model.upstairsRoof ? 1 : 0);
  if (model.upstairsRoof) {
    // V35 includes source-bound NE eave closure9259 in 2F197. The older
    // 2F sources have no roof binding. Roof edits must leave inner ceilings off.
    await expect(roof.locator('[data-layer-mode="ghost"]')).toHaveAttribute('aria-pressed', 'true');
    for (const mode of ['hidden', 'visible', 'ghost']) {
      await roof.locator(`[data-layer-mode="${mode}"]`).click();
      await expect(roof.locator(`[data-layer-mode="${mode}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-layer-node="architecture-ceilings"] [data-layer-mode="hidden"]')).toHaveAttribute('aria-pressed', 'true');
      await expectPreservedCamera();
    }
  }
  await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-walls-ghost-iv-visible-desktop.png') });
  await page.getByRole('button', { name: 'Palauta näkyvyys' }).click();
  await expect(walls.locator('[data-layer-mode="visible"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(page.locator('[data-layer-preset-customized]')).not.toContainText('Mukautettu');
  await expectPreservedCamera();
  for (const [value, floor, index] of [['d-1f', '1F', model.firstFloor], ['d-apartment', 'BOTH', model.bothFloors], ['d-2f', '2F', model.secondFloor]]) {
    await preset.selectOption(value);
    await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', index);
    await expect(canvas).toHaveAttribute('data-main-view-source-sha256', sha);
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
  await walls.locator('[data-layer-mode="ghost"]').click();
  await ventilation.locator('[data-layer-mode="visible"]').click();
  const bounds = await preset.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  // Keep the actual model visible in the two mobile evidence frames. The
  // controls and their state have already been exercised at this viewport.
  await page.locator('#layers-button').click();
  await expectMobileCamera();
  await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-walls-ghost-mobile.png') });
  await page.locator('#layers-button').click();
  await page.getByRole('button', { name: 'Palauta näkyvyys' }).click();
  await expect(walls.locator('[data-layer-mode="visible"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#layers-button').click();
  await expectMobileCamera();
  await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-restored-mobile.png') });
  const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
  });
  expect(webgl).toEqual({ available: true, lost: false, error: 0 });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ source: sha, scene: +model.secondFloor, reviewUrl: page.url(), stages: ['ghost', 'IV-visible', 'reset', '1F', 'BOTH', '2F', 'mobile'], webgl, humanReview: 'NOT_RUN', production }));
});
}
