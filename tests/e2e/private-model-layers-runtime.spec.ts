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

test('displaced Layers root with malformed gates revokes stale ghost and sibling presentation', () => {
  const scene = new Scene();
  const sourceParent = new Group();
  const alternateParent = new Group();
  const sourceMaterial = new MeshBasicMaterial();
  const wall = new Mesh(new BoxGeometry(), sourceMaterial);
  const door = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  sourceParent.add(wall);
  scene.add(sourceParent, alternateParent, door);
  const runtime = createViewerLayersRuntime({ sceneRoot: scene, sourceSha256: sha,
    bindings: [
      { id: 'architecture-walls', root: wall },
      { id: 'architecture-doors', root: door },
    ] });
  const state = applyViewerLayerPreset(createViewerInteractionState(), 'whole-building');
  const ghost = setViewerInteractionLayerMode(state, 'architecture-walls', 'ghost');
  const gates = new Map([
    [wall, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }],
    [door, { sourceAllowed: true, scopeAllowed: true, floorAllowed: true }],
  ]);
  const frame = { activeSceneRoot: scene, availableNodeIds: runtime.availableNodeIds, gates };

  expect(runtime.apply(ghost, frame).map(({ mode }) => mode)).toEqual(['ghost', 'visible']);
  expect(wall.visible).toBe(true);
  expect(wall.material).not.toBe(sourceMaterial);
  expect(door.visible).toBe(true);

  // The original GLB path has changed, and a malformed runtime gate object
  // must be denied BEFORE the bridge's visibility/material reconciliation.
  alternateParent.add(wall);
  const malformed = { ...frame, gates: {} as unknown as typeof gates };
  expect(runtime.apply(ghost, malformed).map(({ mode }) => mode)).toEqual(['hidden', 'hidden']);
  expect(wall.visible).toBe(false);
  expect(door.visible).toBe(false);
  expect(wall.material).toBe(sourceMaterial);
  runtime.enforce(scene, sha);
  expect(wall.visible).toBe(false);
  expect(door.visible).toBe(false);

  // Recovery needs both the original source path and independently valid gates.
  sourceParent.add(wall);
  expect(runtime.apply(state, frame).map(({ mode }) => mode)).toEqual(['visible', 'visible']);
  expect(wall.visible).toBe(true);
  expect(door.visible).toBe(true);
  expect(wall.material).toBe(sourceMaterial);
  expect(gates.size).toBe(2);
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
  { version: 'V68', sourceEnv: 'YLIS_LAYERS_V68_GLB', productionEnv: 'YLIS_LAYERS_V68_PRODUCTION',
    candidateId: 'auto-ylisrinne-c80r2-v68-integrated-v66-k17-v59p2-sink-hl1-wc-layers-work-test-host-hold-20261104-19aqqecn',
    sha: '48116fd649c1100dcc1054170d0b32e94408c0c040af32d5a4a37b6e75dd7d90',
    bytes: 31381740, firstFloor: '283', secondFloor: '284', bothFloors: '285', upstairsRoof: true },
  { version: 'V69', sourceEnv: 'YLIS_LAYERS_V69_GLB', productionEnv: 'YLIS_LAYERS_V69_PRODUCTION',
    candidateId: 'auto-ylisrinne-c80r2-v69-integrated-v68-h3-floor-h4-storage-layers-work-test-host-hold-20261104-1zropkz2',
    sha: '5b720c9b9f87358867463e725b1500c63bafd9de15d121cdf6c36a3e23ca36fd',
    bytes: 31397788, firstFloor: '290', secondFloor: '291', bothFloors: '292', upstairsRoof: true },
  { version: 'V69P12R1', sourceEnv: 'YLIS_LAYERS_V69P12R1_GLB', productionEnv: 'YLIS_LAYERS_V69P12R1_PRODUCTION',
    candidateId: 'ylisrinne-v69p12r1-sink-faucet-floor-metadata-20261105',
    sha: 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3',
    bytes: 32610084, firstFloor: '290', secondFloor: '293', bothFloors: '294', upstairsRoof: true },
  { version: 'K17_RAIL_HANDRAIL900', sourceEnv: 'YLIS_LAYERS_K17_RAIL900_GLB', productionEnv: 'YLIS_LAYERS_K17_RAIL900_PRODUCTION',
    candidateId: 'ylisrinne-k17-rail900-20261104',
    sha: '4b8deb415c75de9eee623d8ad84a8cfa24fa8baf2540c19b59c4ec9423c58d99',
    bytes: 31760668, firstFloor: '305', secondFloor: '306', bothFloors: '307', upstairsRoof: true },
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
  // The GLB SHA is unchanged by viewer-only classification. Require the new
  // profile in code actually delivered to this browser, not just the test checkout.
  let loadedScripts: Promise<string>[] = [];
  const rigMarker = 'C80R2_V69_P12_OPTIN__V59P12_HG14875000_LEFT_APK_PEG_CYLINDRICAL_ROUND_PHOTO_BOTH';
  if (model.version === 'V69P12R1') page.on('response', response => {
    if (response.request().resourceType() === 'script' && new URL(response.url()).origin === origin)
      loadedScripts.push(response.text().catch(() => ''));
  });
  const hasServedRigProfile = async () => {
    const scripts = await Promise.all(loadedScripts);
    return scripts.some(text => text.includes(rigMarker)) &&
      (process.env.YLIS_C008_DEPTH !== '1' || scripts.some(text => text.includes('c80-008-observe')));
  };
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
  const depthProbe = model.version === 'V69P12R1' && process.env.YLIS_C008_DEPTH === '1';
  const reviewUrl = origin + '/private-model/?review=' + candidateId + '-review' + (depthProbe ? '&c008Depth=1' : '');
  const desktopViewport = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  // A newly merged viewer can be ahead of its normal Cloudflare deployment.
  // Reload only the same authenticated viewer, never an alternate auth route.
  for (let attempt = 0; attempt < (production ? 12 : 1); attempt++) {
    loadedScripts = [];
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true', { timeout: 120_000 });
    if ((model.version !== 'V69P12R1' || await hasServedRigProfile()) &&
        await canvas.getAttribute('data-layers-runtime') === 'active' &&
        await page.locator('#layers-button').innerText() === 'Sisältö' &&
        await page.locator('[data-technical-layer-availability]').count() === 1 &&
        await page.locator('#preset-context-status').evaluate(el =>
          getComputedStyle(el).textOverflow === 'ellipsis') &&
        (model.version !== 'V69' ||
          (await canvas.getAttribute('data-v69-c035-lobby-source-ready') === 'true' &&
           await canvas.getAttribute('data-v69-c020-upper-glass-source-ready') === 'true'))) break;
    if (production && attempt < 11) await page.waitForTimeout(10_000);
  }
  expect(sourceVerified).toBe(true);
  if (model.version === 'V69P12R1') expect(await hasServedRigProfile(), 'Deployed viewer must include the exact P12 sink/faucet rig profile').toBe(true);
  await expect(canvas).toHaveAttribute('data-layers-source-sha256', sha);
  await expect(canvas).toHaveAttribute('data-layers-runtime', 'active');
  // Verify the exact-source material adapter in the actual authenticated V69
  // browser load, rather than only checking that Layers and the GLB loaded.
  // The attribute is set only after all 12 V69 C80-035 1F/BOTH objects pass
  // SHA/scene/node/mesh/material source guards and white clones are applied.
  if (model.version === 'V69') {
    await expect(canvas).toHaveAttribute('data-v69-c035-lobby-source-ready', 'true');
    await expect(canvas).toHaveAttribute('data-v69-c020-upper-glass-source-ready', 'true');
  } else {
    await expect(canvas).not.toHaveAttribute('data-v69-c035-lobby-source-ready', 'true');
    await expect(canvas).not.toHaveAttribute('data-v69-c020-upper-glass-source-ready', 'true');
  }
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
  if (model.version === 'V35' || model.version === 'V68' || model.version === 'V69' || model.version === 'K17_RAIL_HANDRAIL900' || model.version === 'V69P12R1') {
    // V35 exact source, 2F197: HL4 binds four Kvik/MANO tall-cabinet
    // carcasses and their verified front surfaces to architecture-fixtures.
    // Only this already source-verified version has that expected coverage.
    // Furniture starts collapsed. Follow its disclosure before using child controls,
    // just as a user does, and preserve that expansion across panel toggles.
    const furnitureDisclosure = page.locator('[data-layer-disclosure="furniture"]');
    if (await furnitureDisclosure.getAttribute('aria-expanded') !== 'true') {
      await furnitureDisclosure.click();
    }
    await expect(furnitureDisclosure).toHaveAttribute('aria-expanded', 'true');
    const fixtures = page.locator('[data-layer-node="architecture-fixtures"]');
    const fixtureVisible = fixtures.locator('[data-layer-mode="visible"]');
    const fixtureHidden = fixtures.locator('[data-layer-mode="hidden"]');
    await expect(fixtures).toHaveCount(1);
    await expect(fixtureVisible).toBeVisible();
    await expect(fixtureVisible).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toHaveAttribute('data-layers-source-sha256', sha);
    await expect(canvas).toHaveAttribute('data-layers-source-scene-index', model.secondFloor);

    // Keep the same viewport/camera and close only the UI panel in both
    // evidence frames, so the model rather than the overlay is compared.
    await page.locator('#layers-button').click();
    await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-fixtures-visible-desktop.png') });
    await page.locator('#layers-button').click();
    await fixtureHidden.click();
    await expect(fixtureHidden).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toHaveAttribute('data-layers-runtime', 'active');
    await expectPreservedCamera();
    await page.locator('#layers-button').click();
    await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-fixtures-hidden-desktop.png') });
    await page.locator('#layers-button').click();
    await fixtureVisible.click();
    await expect(fixtureVisible).toHaveAttribute('aria-pressed', 'true');
    await expectPreservedCamera();
    // Restore the verified source-bound state before the existing reset,
    // 1F/BOTH/2F and mobile regression exercises run.
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
    if (model.version === 'K17_RAIL_HANDRAIL900' || model.version === 'V69P12R1') {
      await page.locator('#layers-button').click();
      await page.screenshot({path:info.outputPath(evidencePrefix+'-'+floor.toLowerCase()+'-original-scene.png')});
      await page.locator('#layers-button').click();
    }
    // The material-only V69 lobby correction must survive each real source
    // scene switch, including returning to 2F where no jamb objects exist.
    if (model.version === 'V69') {
      await expect(canvas).toHaveAttribute('data-v69-c035-lobby-source-ready', 'true');
      await expect(canvas).toHaveAttribute('data-v69-c020-upper-glass-source-ready', 'true');
    }
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
  if (model.version === 'V68' || model.version === 'V69' || model.version === 'K17_RAIL_HANDRAIL900' || model.version === 'V69P12R1') {
    await page.setViewportSize(desktopViewport);
    await page.locator('#more-menu > summary').click();
    await page.locator('#fit-button').click();
    await page.locator('#selection-tool-button').click();
    const selection = page.locator('#selection-panel');
    const box = (await canvas.boundingBox())!;
    // Real raycast on the displayed model. No injected selection or scene handle.
    for (const [x,y] of [[.5,.5],[.4,.5],[.6,.5],[.5,.4],[.5,.6],[.35,.4],[.65,.6]]) {
      await canvas.click({position:{x:box.width*x,y:box.height*y}});
      if (await selection.isVisible()) break;
    }
    await expect(selection).toBeVisible();
    await expect(page.locator('#selection-mesh')).not.toHaveText('-');
    const technicalScene = page.locator('#selection-metadata-list dt').filter({hasText:'Tekninen scene'}).locator('xpath=following-sibling::dd[1]');
    const sourceSceneName = model.version === 'V69P12R1'
      ? JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8')).scenes[+model.secondFloor].name
      : model.version + '_2F';
    await expect(technicalScene).toContainText(sourceSceneName);
    await expect(canvas).toHaveAttribute('data-layers-source-sha256',sha);
    await page.screenshot({path:info.outputPath(evidencePrefix+'-actual-object-selection-desktop.png')});
    await page.locator('#clear-selection-button').click();
    await expect(selection).toBeHidden();
  }
  if (model.version === 'V69P12R1') {
    // Exercise an actual orbit gesture on the displayed source, with no
    // injected scene handles. Screenshots remain encrypted by the trusted job.
    const beforeOrbit = await readLiveCamera();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * .45, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .65, box.y + box.height * .55, { steps: 12 });
    await page.mouse.up();
    expect(await readLiveCamera()).not.toEqual(beforeOrbit);
    await page.screenshot({ path: info.outputPath(evidencePrefix + '-2f-after-real-orbit.png') });
  }
  if (depthProbe) {
    const reports: any[] = [];
    const visiblePixels = new Map([[8028, 0], [8030, 0]]);
    const openLayers = async () => {
      if (await page.locator('#layers-button').getAttribute('aria-expanded') !== 'true')
        await page.locator('#layers-button').click();
    };
    const closeLayers = async () => {
      if (await page.locator('#layers-button').getAttribute('aria-expanded') === 'true')
        await page.locator('#layers-button').click();
    };
    const observe = async () => {
      const previous = await canvas.getAttribute('data-c008-depth-observation');
      await canvas.dispatchEvent('c80-008-observe');
      await expect.poll(() => canvas.getAttribute('data-c008-depth-observation')).not.toBe(previous);
      const value = JSON.parse((await canvas.getAttribute('data-c008-depth-observation'))!);
      expect(value.observation, 'Served exact source must expose actual read-only door observations').toBeTruthy();
      return value.observation;
    };
    for (const floor of ['d-2f', 'd-apartment']) {
      await openLayers(); await preset.selectOption(floor); await closeLayers();
      if (await page.locator('#more-menu').getAttribute('open') === null)
        await page.locator('#more-menu > summary').click();
      await page.locator('#fit-button').click();
      for (let view = 0; view < 4; view++) {
        if (view) {
          await page.locator('#navigate-tool-button').click();
          const box = (await canvas.boundingBox())!;
          const before = await readLiveCamera();
          await page.mouse.move(box.x + box.width * .4, box.y + box.height * .45);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * .62, box.y + box.height * .45, { steps: 16 });
          await page.mouse.up();
          expect(await readLiveCamera()).not.toEqual(before);
        }
        // Let the real OrbitControls damping settle before a same-camera pair.
        await page.waitForTimeout(900);
        await openLayers();
        const context = page.locator('#c80-source-context-visible');
        const contextAvailable = await context.isVisible();
        for (const contextOn of contextAvailable ? [true, false] : [null]) {
          if (contextOn !== null) await context.setChecked(contextOn);
          await page.locator('[data-layer-node="architecture-doors"] [data-layer-mode="visible"]').click();
          await closeLayers();
          const observation = await observe();
          const before = await canvas.screenshot({ path: info.outputPath(`c008-${floor}-${view}-${contextOn}-visible.png`), scale: 'css' });
          await openLayers();
          await page.locator('[data-layer-node="architecture-doors"] [data-layer-mode="hidden"]').click();
          await closeLayers();
          const hiddenObservation = await observe();
          expect(hiddenObservation.camera).toEqual(observation.camera);
          expect(hiddenObservation.doors.every((door: any) => !door.visible)).toBe(true);
          const after = await canvas.screenshot({ path: info.outputPath(`c008-${floor}-${view}-${contextOn}-hidden.png`), scale: 'css' });
          // Decode independent browser screenshots, never a second renderer or
          // synthetic pixel fixture. Coordinates come from the actual live camera.
          const differences = await page.evaluate(async ({ before, after, doors }) => {
            const decode = async (base64: string) => {
              const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
              const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
              const target = new OffscreenCanvas(bitmap.width, bitmap.height);
              const ctx = target.getContext('2d')!; ctx.drawImage(bitmap, 0, 0); bitmap.close();
              return { width: target.width, height: target.height, data: ctx.getImageData(0, 0, target.width, target.height).data };
            };
            const a = await decode(before), b = await decode(after);
            if (a.width !== b.width || a.height !== b.height) throw Error('C008 screenshot viewport drift');
            return doors.map((door: any) => ({ node: door.node, samples: door.samples.map((sample: any) => {
              const x = Math.round(sample.x), y = Math.round(sample.y), offset = (y * a.width + x) * 4;
              const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(a.data[offset + channel] - b.data[offset + channel])));
              return { ...sample, delta };
            }) }));
          }, { before: before.toString('base64'), after: after.toString('base64'), doors: observation.doors });
          for (const door of observation.doors) {
            expect.soft(door.visible).toBe(true);
            expect.soft(door.material.every((m: any) => m.visible && m.depthTest && m.depthWrite && !m.transparent && m.opacity === 1)).toBe(true);
            const pixels = differences.find((item: any) => item.node === door.node).samples;
            visiblePixels.set(door.node, visiblePixels.get(door.node)! + pixels.filter((p: any) => p.frontNode === door.node && p.delta > 3).length);
            const opaqueLeaks = pixels.filter((p: any) => p.frontNode !== null && ![8028, 8030].includes(p.frontNode) &&
              p.frontDistance < p.targetDistance - .08 && p.delta > 3);
            expect.soft(opaqueLeaks, `Door ${door.node} must not paint through a nearer opaque source surface`).toEqual([]);
          }
          reports.push({ floor, view, sourceContext: contextOn, contextControlAvailable: contextAvailable,
            edgeMode: await canvas.getAttribute('data-edge-mode'), observation, differences });
          await openLayers();
          await page.locator('[data-layer-node="architecture-doors"] [data-layer-mode="visible"]').click();
          await closeLayers();
        }
      }
    }
    await info.attach('c008-live-depth-and-independent-pixels', { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });
    for (const [node, pixels] of visiblePixels) expect(pixels, `Door ${node} must contribute actual foreground pixels across the moving-camera views`).toBeGreaterThan(0);
    console.log(JSON.stringify({ c008Depth: true, source: sha, observations: reports.length,
      visibleDoorPixels: Object.fromEntries(visiblePixels), humanReview: 'NOT_RUN', production }));
  }
  const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
  });
  expect(webgl).toEqual({ available: true, lost: false, error: 0 });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ source: sha, scene: +model.secondFloor, reviewUrl: page.url(), servedRigProfile: model.version === 'V69P12R1' ? await hasServedRigProfile() : null, bindings: await canvas.getAttribute('data-layers-binding-count'), stages: ['ghost', 'IV-visible', 'reset', '1F', 'BOTH', '2F', 'mobile', ...((model.version === 'V68' || model.version === 'V69' || model.version === 'K17_RAIL_HANDRAIL900' || model.version === 'V69P12R1') ? ['actual-object-click'] : [])], webgl, humanReview: 'NOT_RUN', production }));
});
}


