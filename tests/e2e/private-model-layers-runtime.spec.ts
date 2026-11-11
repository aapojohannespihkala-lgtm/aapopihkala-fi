import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
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
  { version: 'TATE4', sourceEnv: 'YLIS_LAYERS_TATE4_GLB', productionEnv: 'YLIS_LAYERS_TATE4_PRODUCTION',
    candidateId: 'c80-tate-interior-integrated-20261111',
    sha: 'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b',
    bytes: 53872184, firstFloor: '350', secondFloor: '351', bothFloors: '352', upstairsRoof: false },
  { version: 'TATE3', sourceEnv: 'YLIS_LAYERS_TATE3_GLB', productionEnv: 'YLIS_LAYERS_TATE3_PRODUCTION',
    candidateId: 'c80-tate-pk1-pa1-apk-20261111',
    sha: 'bb53c85c96bc645632288c0b89c7231709791da9ee54a67d6ee44623bc0be5b0',
    bytes: 52972084, firstFloor: '347', secondFloor: '348', bothFloors: '349', upstairsRoof: false },
  { version: 'TATE', sourceEnv: 'YLIS_LAYERS_TATE_GLB', productionEnv: 'YLIS_LAYERS_TATE_PRODUCTION',
    candidateId: 'c80-p02-tate-integrated-20261111',
    sha: '69b7adf599d63aa954b5dd93d64ae65baca5c41df7ff3d555bf3236560d9d3b4',
    bytes: 52855944, firstFloor: '344', secondFloor: '345', bothFloors: '346', upstairsRoof: false },
  { version: 'P02', sourceEnv: 'YLIS_LAYERS_P02_GLB', productionEnv: 'YLIS_LAYERS_P02_PRODUCTION',
    candidateId: 'c80-p02-water-integrated-20261111',
    sha: 'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a',
    bytes: 52535692, firstFloor: '338', secondFloor: '339', bothFloors: '340', upstairsRoof: false },
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
  const isTate = model.version === 'TATE4' || model.version === 'TATE' || model.version === 'TATE3';
  const tateSwitchOnly = isTate && process.env.YLIS_TATE_SWITCH_ONLY === '1';
  if (tateSwitchOnly) expect(production, 'Scoped switching uses the protected production viewer').toBe(true);
  let switchedP02Verified = false;
  const depthProbe = model.version === 'V69P12R1' && process.env.YLIS_C008_DEPTH === '1';
  // The depth pass adds 16 independent screenshot pairs to the base lifecycle.
  // Keep its full bounded capture within the trusted job's 30-minute limit.
  test.setTimeout(depthProbe || isTate ? 24 * 60_000 : 540_000);
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
  if (model.version === 'V69P12R1' || model.version === 'TATE4') page.on('response', response => {
    if (response.request().resourceType() === 'script' && new URL(response.url()).origin === origin)
      loadedScripts.push(response.text().catch(() => ''));
  });
  const hasServedRigProfile = async () => {
    const scripts = await Promise.all(loadedScripts);
    if (model.version === 'TATE4') return scripts.some(text => text.includes(sha) && text.includes('EXACT_SOURCE_RECEIPT'));
    return scripts.some(text => text.includes(rigMarker)) &&
      (process.env.YLIS_C008_DEPTH !== '1' ||
        scripts.some(text => text.includes('c80-008-observe')) &&
        scripts.some(text => text.includes('#layers-source-context-visible')) &&
        scripts.some(text => text.includes('C008_PIXEL_FOOTPRINT_V1')));
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
      if (isTate && new URL(route.request().url()).pathname ===
          '/private-model/work-test/c80-p02-water-integrated-20261111.glb') {
        const bytes = await response.body();
        expect(bytes.length).toBe(52535692);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe('db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a');
        switchedP02Verified = true;
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
  const reviewUrl = origin + '/private-model/?review=' + candidateId + '-review' + (depthProbe ? '&c008Depth=1' : '');
  const desktopViewport = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  // A newly merged viewer can be ahead of its normal Cloudflare deployment.
  // Reload only the same authenticated viewer, never an alternate auth route.
  for (let attempt = 0; attempt < (production ? 12 : 1); attempt++) {
    loadedScripts = [];
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
    await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true', { timeout: 120_000 });
    if ((model.version !== 'V69P12R1' && model.version !== 'TATE4' || await hasServedRigProfile()) &&
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
  if (model.version === 'TATE4') expect(await hasServedRigProfile(), 'Deployed source/card receipt must match the new actual GLB').toBe(true);
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
  const verifyTateModelSwitch = async () => {
    const receipts: any[] = [];
    const closeLayers = async () => {
      if (await page.locator('#layers-button').getAttribute('aria-expanded') === 'true')
        await page.locator('#layers-button').click();
    };
    const openModelMenu = async () => {
      await closeLayers();
      if (await page.locator('#model-menu').getAttribute('open') === null)
        await page.locator('#model-menu > summary').click();
    };
    const verifyDFit = async (label: string, expectedSha: string, scene: string) => {
      await expect(canvas).toHaveAttribute('data-layers-source-sha256', expectedSha);
      if (await page.locator('#layers-button').getAttribute('aria-expanded') !== 'true')
        await page.locator('#layers-button').click();
      // Manual source loads deliberately start at Whole building. Select D
      // explicitly before asserting the D-only architecture fit contract.
      await preset.selectOption('d-2f');
      await expect(canvas).toHaveAttribute('data-main-view-area', 'D');
      await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
      await expect(canvas).toHaveAttribute('data-layers-source-scene-index', scene);
      await closeLayers();
      await page.locator('#more-menu > summary').click();
      await page.locator('#fit-button').click();
      for (const viewport of [desktopViewport, { width: 390, height: 844 }, desktopViewport]) {
        await page.setViewportSize(viewport);
        await expect(canvas).toHaveAttribute('data-p02-content-fit', 'source-bound-architecture');
        await expect(canvas).toHaveAttribute('data-layers-source-scene-index', scene);
        await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
        await expect.poll(async () => Number(await canvas.getAttribute('data-fit-radius'))).toBeLessThan(12);
        const box = await canvas.boundingBox();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.width).toBeLessThanOrEqual(viewport.width);
      }
      const receipt = { label, sourceSha256: expectedSha, scene: Number(scene),
        area: await canvas.getAttribute('data-main-view-area'),
        radius: Number(await canvas.getAttribute('data-fit-radius')), desktopMobileResize: true };
      receipts.push(receipt);
      writeFileSync(info.outputPath('tate-model-switch.json'), JSON.stringify({
        proofPhase: tateSwitchOnly ? 'model-switch' : 'full', production, receipts, humanReview: 'NOT_RUN',
      }, null, 2));
      await page.screenshot({ path: info.outputPath('tate-switch-' + label.toLowerCase() + '.png') });
    };
    await verifyDFit('TATE-initial', sha, model.secondFloor);
    await openModelMenu();
    await page.locator('#work-test-select').selectOption('c80-p02-water-integrated-20261111');
    await page.locator('#work-test-button').click();
    await expect(canvas).toHaveAttribute('data-layers-source-sha256', 'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a', { timeout: 120_000 });
    if (production) expect(switchedP02Verified).toBe(true);
    await verifyDFit('P02', 'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a', '339');
    await openModelMenu();
    await page.locator('#current-model-button').click();
    await expect(canvas).toHaveAttribute('data-model-source', 'current', { timeout: 120_000 });
    receipts.push({ label: 'CURRENT', sourceSha256: await canvas.getAttribute('data-layers-source-sha256') });
    await openModelMenu();
    await page.locator('#work-test-select').selectOption(candidateId);
    await page.locator('#work-test-button').click();
    await expect(canvas).toHaveAttribute('data-p137e-loaded-candidate-id', candidateId, { timeout: 120_000 });
    await expect(canvas).toHaveAttribute('data-work-test-review-mode', candidateId + '-review');
    await verifyDFit('TATE-restored', sha, model.secondFloor);
    const webgl = await canvas.evaluate((element: HTMLCanvasElement) => {
      const gl = element.getContext('webgl2');
      return { available: !!gl, lost: gl?.isContextLost(), error: gl?.getError() };
    });
    expect(webgl).toEqual({ available: true, lost: false, error: 0 });
    expect(errors).toEqual([]);
    const result = { proofPhase: tateSwitchOnly ? 'model-switch' : 'full', production,
      sourceSha256: sha, sourceVerified, switchedP02Verified, reviewUrl: page.url(),
      modelSwitch: ['TATE', 'P02', 'CURRENT', 'TATE'], receipts, webgl, pageErrors: errors, humanReview: 'NOT_RUN' };
    writeFileSync(info.outputPath('tate-model-switch.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  };
  if (tateSwitchOnly) {
    // Same trusted-main authentication and full-source readback, only the
    // remaining switching phase. The default full test still runs every gate.
    await verifyTateModelSwitch();
    return;
  }
  await preset.selectOption('d-2f');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(canvas).toHaveAttribute('data-layers-source-scene-index', model.secondFloor);
  // An explicit camera action frames the selected floor before testing that
  // Layers edits themselves preserve it. Do not inherit the site's wide fit.
  await page.locator('#layers-button').click();
  await page.locator('#more-menu > summary').click();
  await page.locator('#fit-button').click();
  if (model.version === 'P02' || isTate) {
    await expect(canvas).toHaveAttribute('data-p02-content-fit', 'source-bound-architecture');
    expect(Number(await canvas.getAttribute('data-fit-radius'))).toBeLessThan(12);
  }
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
  if (model.version === 'V68' || model.version === 'V69' || model.version === 'K17_RAIL_HANDRAIL900' || model.version === 'V69P12R1' || model.version === 'TATE4') {
    await page.setViewportSize(desktopViewport);
    await page.locator('#more-menu > summary').click();
    await page.locator('#fit-button').click();
    await page.locator('#selection-tool-button').click();
    const selection = page.locator('#selection-panel');
    const box = (await canvas.boundingBox())!;
    // Real raycast on the displayed model. No injected selection or scene handle.
    const clicks = [[.5,.5],[.4,.5],[.6,.5],[.5,.4],[.5,.6],[.35,.4],[.65,.6]];
    if (model.version === 'TATE4') for (const y of [.25,.35,.45,.55,.65,.75]) for (const x of [.25,.35,.45,.55,.65]) clicks.push([x,y]);
    for (const [x,y] of clicks) {
      // A previous real hit opens an overlay that can cover the next raycast.
      // Dismiss it through the normal UI before selecting another object.
      if (model.version === 'TATE4' && await selection.isVisible()) {
        await page.locator('#clear-selection-button').click();
        await expect(selection).toBeHidden();
      }
      await canvas.click({position:{x:box.width*x,y:box.height*y},timeout:10_000});
      if (await selection.isVisible() && (model.version !== 'TATE4' ||
          await page.locator('#selection-source-evidence').getAttribute('data-state') === 'matched' &&
          await page.locator('#selection-source-evidence .source-evidence-sources a').count() > 0)) break;
    }
    await expect(selection).toBeVisible();
    await expect(page.locator('#selection-mesh')).not.toHaveText('-');
    const technicalScene = page.locator('#selection-metadata-list dt').filter({hasText:'Tekninen scene'}).locator('xpath=following-sibling::dd[1]');
    const sourceSceneName = model.version === 'V69P12R1' || model.version === 'TATE4'
      ? JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8')).scenes[+model.secondFloor].name
      : model.version + '_2F';
    await expect(technicalScene).toContainText(sourceSceneName);
    await expect(canvas).toHaveAttribute('data-layers-source-sha256',sha);
    if (model.version === 'TATE4') {
      await expect(page.locator('#selection-source-evidence')).toHaveAttribute('data-state','matched');
      const card=page.locator('#selection-source-evidence .source-evidence-card');
      await expect(card).toHaveAttribute('data-source-card-id',/^TATE4:351:/);
      expect(await card.locator('.source-evidence-sources a').count()).toBeGreaterThan(0);
      console.log(JSON.stringify({tate4SourceCard:{sha,scene:351,card:await card.getAttribute('data-source-card-id'),selected:await page.locator('#selection-mesh').innerText(),links:await card.locator('.source-evidence-sources a').evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href)),production}}));
    }
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
    const gltf = JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8'));
    const reports: any[] = [];
    const depthStarted = Date.now();
    const saveDepthProgress = () => writeFileSync(info.outputPath('c008-live-depth-progress.json'), JSON.stringify({
      testedCommit: process.env.D_VIEW_TESTED_COMMIT ?? null, source: sha, production,
      completedPairs: reports.length, expectedPairs: 16, elapsedMs: Date.now() - depthStarted,
      humanReview: 'NOT_RUN', reports,
    }, null, 2));
    saveDepthProgress();
    const visiblePixels = new Map([[8028, 0], [8030, 0]]);
    const coveredOpaqueControls = new Map<string, number>();
    const controlTimeout = 30_000;
    const layersToggle = page.locator('#layers-button');
    const openLayers = async () => {
      if (await layersToggle.getAttribute('aria-expanded', { timeout: controlTimeout }) !== 'true') {
        await layersToggle.press('Enter', { timeout: controlTimeout });
        await expect(layersToggle).toHaveAttribute('aria-expanded', 'true');
      }
    };
    const closeLayers = async () => {
      if (await layersToggle.getAttribute('aria-expanded', { timeout: controlTimeout }) === 'true') {
        await page.locator('#close-layers-button').press('Enter', { timeout: controlTimeout });
        await expect(layersToggle).toHaveAttribute('aria-expanded', 'false');
      }
    };
    const setDoorLayerMode = async (mode: 'visible' | 'hidden') => {
      const control = page.locator(`[data-layer-node="architecture-doors"] [data-layer-mode="${mode}"]`);
      await expect(control).toBeVisible();
      await expect(control).toBeEnabled();
      // A real key activation uses the same Layers button without waiting
      // for Playwright's pointer-position stability frames on software WebGL.
      if (await control.getAttribute('aria-pressed', { timeout: controlTimeout }) !== 'true')
        await control.press('Enter', { timeout: controlTimeout });
      await expect(control).toHaveAttribute('aria-pressed', 'true');
    };
    const waitForCameraRest = async () => {
      // Use the viewer's existing fixed-eye middle-click gesture. It flushes
      // residual orbit inertia without injecting a camera pose or changing the
      // production damping settings. A passive delay depends on render rate.
      const box = (await canvas.boundingBox())!;
      await page.mouse.click(box.x + box.width * .5, box.y + box.height * .5, { button: 'middle' });
      let signature = '', stable = 0;
      await expect.poll(async () => {
        const pose = await readLiveCamera();
        const next = JSON.stringify(['position', 'target', 'direction'].map(key =>
          pose[key].map((value: number) => value.toFixed(11))));
        stable = next === signature ? stable + 1 : 0;
        signature = next;
        return stable;
      }, { timeout: 45_000, intervals: [150, 250, 500] }).toBeGreaterThanOrEqual(2);
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
        // A fixed delay cannot prove rest at the runner's actual render rate.
        await waitForCameraRest();
        await openLayers();
        const context = page.locator('#layers-source-context-visible');
        await expect(context, 'C008 requires the active Layers SOURCE_CONTEXT control').toBeVisible();
        const upstairs = floor === 'd-2f';
        const sceneIndex = upstairs ? 293 : 294;
        const contextNodes = upstairs ? [] : [5741, 6629, 7645];
        for (const contextOn of [true, false]) {
          console.log(JSON.stringify({ c008Stage: 'prepare-visible', floor, view, contextOn }));
          await expect(context).toBeEnabled();
          if (await context.isChecked({ timeout: controlTimeout }) !== contextOn)
            await context.press('Space', { timeout: controlTimeout });
          await expect(context).toBeChecked({ checked: contextOn });
          await setDoorLayerMode('visible');
          await closeLayers();
          const observation = await observe();
          expect(observation.pixelContract).toBe('C008_PIXEL_FOOTPRINT_V1');
          expect(observation.sourceSha256).toBe(sha);
          expect(observation.sceneIndex).toBe(sceneIndex);
          expect(observation.sourceContext).toMatchObject({
            rootNode: upstairs ? 5629 : 7646, enabled: contextOn,
            nodes: contextNodes,
          });
          const mountedNodes = observation.sourceContext.mountedNodes;
          expect(mountedNodes.filter((node: number) => node !== 5741)).toEqual(upstairs ? [] : [6629, 7645]);
          expect(mountedNodes.every((node: number) => contextNodes.includes(node))).toBe(true);
          expect(observation.sourceContext.visibleNodes).toEqual(contextOn ? mountedNodes : []);
          const before = await canvas.screenshot({ path: info.outputPath(`c008-${floor}-${view}-${contextOn}-visible.png`), scale: 'css' });
          await openLayers();
          await setDoorLayerMode('hidden');
          await closeLayers();
          const hiddenObservation = await observe();
          expect(hiddenObservation.pixelContract).toBe(observation.pixelContract);
          expect(hiddenObservation.sourceSha256).toBe(sha);
          expect(hiddenObservation.sceneIndex).toBe(sceneIndex);
          expect(hiddenObservation.sourceContext).toEqual(observation.sourceContext);
          await info.attach(`c008-${floor}-${view}-${contextOn}-live-source-pair`, {
            body: JSON.stringify({ observation, hiddenObservation }, null, 2), contentType: 'application/json',
          });
          for (const key of ['position', 'quaternion', 'projection']) {
            for (let i = 0; i < observation.camera[key].length; i++)
              expect(hiddenObservation.camera[key][i]).toBeCloseTo(observation.camera[key][i], 9);
          }
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
              const { x, y } = sample, offset = (y * a.width + x) * 4;
              if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= a.width || y >= a.height)
                throw Error('C008 ray and screenshot pixel indices must agree');
              const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(a.data[offset + channel] - b.data[offset + channel])));
              return { ...sample, delta };
            }) }));
          }, { before: before.toString('base64'), after: after.toString('base64'), doors: observation.doors });
          for (const door of observation.doors) {
            const hiddenDoor = hiddenObservation.doors.find((item: any) => item.node === door.node);
            const def = gltf.nodes[door.node];
            expect(door.mesh).toBe(def.mesh);
            expect(gltf.nodes[door.parent]?.children).toContain(door.node);
            expect(door.sourceLinks).toEqual(def.extras.sourceLinks);
            expect(hiddenDoor).toMatchObject({ mesh: door.mesh, parent: door.parent, sourceLinks: door.sourceLinks,
              material: door.material, renderOrder: door.renderOrder, ancestorOrders: door.ancestorOrders });
            expect.soft(door.visible).toBe(true);
            expect.soft(door.material.every((m: any) => m.visible && m.depthTest && m.depthWrite && !m.transparent && m.opacity === 1)).toBe(true);
            const pixels = differences.find((item: any) => item.node === door.node).samples;
            visiblePixels.set(door.node, visiblePixels.get(door.node)! + pixels.filter((p: any) => p.frontNode === door.node && p.delta > 3).length);
            const afterSamples = hiddenDoor.samples;
            const opaqueControls = pixels.filter((p: any) => {
              const hidden = afterSamples.find((item: any) => item.x === p.x && item.y === p.y);
              // A nearer surface has to cover the pixel in both frames. A
              // mixed silhouette pixel may contain color from a visible door.
              return p.footprint.length === 5 && hidden?.footprint.length === 5 &&
                p.footprint.every((ray: any, i: number) => {
                  const afterRay = hidden.footprint[i];
                  return ray.frontNode !== null && ![8028, 8030].includes(ray.frontNode) &&
                    afterRay.frontNode === ray.frontNode &&
                    Math.abs(afterRay.frontDistance - ray.frontDistance) < .000001 &&
                    ray.frontDistance < ray.targetDistance - .08;
                });
            });
            const coverageKey = `${floor}/${contextOn}/${door.node}`;
            coveredOpaqueControls.set(coverageKey, (coveredOpaqueControls.get(coverageKey) ?? 0) + opaqueControls.length);
            const opaqueLeaks = opaqueControls.filter((p: any) => p.delta > 3);
            expect.soft(opaqueLeaks, `Door ${door.node} must not paint through a nearer opaque source surface`).toEqual([]);
          }
          reports.push({ floor, view, sourceContext: contextOn,
            edgeMode: await canvas.getAttribute('data-edge-mode'), observation, hiddenObservation, differences });
          saveDepthProgress();
          console.log(JSON.stringify({ c008CapturePair: reports.length, elapsedMs: Date.now() - depthStarted }));
          await openLayers();
        }
        // Keep the real doors visible during each subsequent orbit gesture.
        console.log(JSON.stringify({ c008Stage: 'restore-doors', floor, view }));
        await setDoorLayerMode('visible');
        await closeLayers();
      }
    }
    expect(reports).toHaveLength(16);
    await info.attach('c008-live-depth-and-independent-pixels', { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });
    for (const [node, pixels] of visiblePixels) expect(pixels, `Door ${node} must contribute actual foreground pixels across the moving-camera views`).toBeGreaterThan(0);
    for (const floor of ['d-2f', 'd-apartment']) for (const contextOn of [true, false]) {
      for (const node of [8028, 8030]) {
        const key = `${floor}/${contextOn}/${node}`;
        expect(coveredOpaqueControls.get(key), `C008 requires a fully covered opaque control for ${key}`).toBeGreaterThan(0);
      }
    }
    console.log(JSON.stringify({ c008Depth: true, source: sha, observations: reports.length,
      visibleDoorPixels: Object.fromEntries(visiblePixels), coveredOpaqueControls: Object.fromEntries(coveredOpaqueControls),
      humanReview: 'NOT_RUN', production }));
  }
  if (model.version === 'P02' || isTate) {
    await page.setViewportSize(desktopViewport);
    await expect(canvas).toHaveAttribute('data-work-test-review-mode', candidateId + '-review');
    const gltf = JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8'));
    expect(gltf.scenes).toHaveLength(model.version === 'TATE4' ? 353 : model.version === 'TATE3' ? 350 : isTate ? 347 : 341);
    expect(gltf.asset.extras.viewerFloorScenes).toEqual({'1F':Number(model.firstFloor),'2F':Number(model.secondFloor),BOTH:Number(model.bothFloors)});
    const resolveExactTechnicalNode = model.version === 'TATE4'
      ? (await import('../../src/scripts/privateModelC80TateInteriorLayerSourceProfile.mjs')).resolveTate4TechnicalNode
      : model.version === 'TATE3'
      ? (await import('../../src/scripts/privateModelC80TateThreeDeltaLayerSourceProfile.mjs')).resolveTate3TechnicalNode
      : model.version === 'TATE'
      ? (await import('../../src/scripts/privateModelC80P02TateLayerSourceProfile.mjs')).resolveTateTechnicalNode
      : (await import('../../src/scripts/privateModelC80P02WaterLayerSourceProfile.mjs')).resolveP02TechnicalNode;
    const p02Evidence: any[] = [];
    await page.locator('#layers-button').click();
    for (const [value, floor, index] of [
      ['d-1f', '1F', model.firstFloor], ['d-2f', '2F', model.secondFloor],
      ['d-apartment', 'BOTH', model.bothFloors],
    ]) {
      await preset.selectOption(value);
      await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
      await expect(canvas).toHaveAttribute('data-layers-source-scene-index', index);
      await expect(canvas).toHaveAttribute('data-layers-source-sha256', sha);
      await expect(canvas).toHaveAttribute('data-p02-content-fit', 'source-bound-architecture');
      expect(Number(await canvas.getAttribute('data-fit-radius'))).toBeLessThan(12);
      if (isTate) {
        // Inspect authored material pixels separately from derived edge overlays.
        // The default-edge desktop/mobile lifecycle above remains unchanged.
        await page.locator('#edge-mode-select').selectOption('none');
        await expect(canvas).toHaveAttribute('data-edge-mode','none');
      }
      const active = new Set<number>();
      const walk = (node: number) => {
        if (active.has(node)) return;
        active.add(node);
        for (const child of gltf.nodes[node].children ?? []) walk(child);
      };
      gltf.scenes[Number(index)].nodes.forEach(walk);
      const waterReceipt = model.version === 'TATE4'
        ? JSON.parse(readFileSync('tests/fixtures/c80-tate-interior-source-receipt.json','utf8')) : null;
      if (waterReceipt) expect(waterReceipt.sourceSha256).toBe(sha);
      const additions: number[] = waterReceipt ? waterReceipt.waterConnectionNodes[index]
        : [...active].filter(node => node >= 11678 && node <= 11707);
      for (const node of additions) expect(active.has(node),'Exact source water connection '+node).toBe(true);
      expect(additions).toHaveLength(floor === 'BOTH' ? 30 : 15);
      for (const node of additions) {
        expect(resolveExactTechnicalNode(gltf, Number(index), node)?.id).toBe('technical-water');
      }
      if (isTate) {
        for (const node of active) {
          if (node < 11721 || gltf.nodes[node].mesh === undefined) continue;
          if (model.version === 'TATE4') {
            const profile=await import('../../src/scripts/privateModelC80TateInteriorLayerSourceProfile.mjs');
            const expected=(profile.TATE4_TECHNICAL_NODES as Record<number, Record<number,{id:string}>>)[Number(index)]?.[node];
            if(expected) expect(resolveExactTechnicalNode(gltf,Number(index),node)?.id).toBe(expected.id);
            continue;
          }
          const id = node >= 11900 ? (node === 11909 ? 'technical-electrical' : 'technical-drainage') : node < 11730 ? 'technical-drainage' : node < 11739 ? 'technical-ventilation' : 'technical-electrical';
          expect(resolveExactTechnicalNode(gltf, Number(index), node)?.id, 'Remapped donor '+node).toBe(id);
        }
        if (model.version === 'TATE4' || model.version === 'TATE3') {
          expect([...active].filter(n=>n>=11900&&n<=11906)).toHaveLength(floor==='2F'?0:7);
          expect(active.has(11907)).toBe(floor!=='1F');
          expect(active.has(11908)&&active.has(11909)).toBe(true);
          expect(resolveExactTechnicalNode(gltf,Number(index),11909)?.path).toEqual([11908,11909]);
          for (const n of [10516,10517,11429,11430,11431]) expect(active.has(n),'D7/H25 '+n).toBe(false);
        }
        if (model.version === 'TATE4') {
          for(const n of [11592,11593,11594]) expect(active.has(n),'Old D4 inactive '+n).toBe(false);
          expect(active.has(12076),'Single PK1/MJ64 adapter').toBe(floor!=='2F');
          for(const n of [12043,12053,12057]) expect(active.has(n),'B47K/Savo '+n).toBe(floor!=='1F');
          const panel=gltf.nodes[12057];
          expect(panel.extras.integrationUVOriginCorrection).toBe('VTK_BOTTOM_LEFT_TO_GLTF_TOP_LEFT_V_ONLY');
        }
        for (const node of [10128,11322,11326,11328,11329,10156,10157,10158,10159,11432,11433,11434])
          expect(active.has(node),'Rejected/superseded node '+node).toBe(false);
      }
      const cold = additions.filter(node => /COLD|ISOLATION|VP1|_PK1_|_WC2_/.test(gltf.nodes[node].name));
      const hot = additions.filter(node => /HOT/.test(gltf.nodes[node].name));
      expect(cold.length).toBeGreaterThan(0);
      expect(hot.length).toBeGreaterThan(0);
      await walls.locator('[data-layer-mode="hidden"]').click();
      await page.locator('[data-layer-node="architecture-floors"] [data-layer-mode="hidden"]').click();
      // Keep authored KV/LV materials rather than the unified highlight color.
      const highlight = page.locator('#layers-technical-review-on');
      if (await highlight.isChecked()) await highlight.uncheck();
      const water = page.locator('[data-layer-node="technical-water"]');
      await expect(water).toHaveCount(1);
      await water.locator('[data-layer-mode="visible"]').click();
      await expect(water.locator('[data-layer-mode="visible"]')).toHaveAttribute('aria-pressed','true');
      const beforePose = await canvas.getAttribute('data-layers-camera-pose');
      await page.locator('#layers-button').click();
      const before = await canvas.screenshot({path:info.outputPath('layers-p02-'+floor.toLowerCase()+'-water-visible.png')});
      await page.locator('#layers-button').click();
      await water.locator('[data-layer-mode="hidden"]').click();
      await expect(water.locator('[data-layer-mode="hidden"]')).toHaveAttribute('aria-pressed','true');
      await page.locator('#layers-button').click();
      const after = await canvas.screenshot({path:info.outputPath('layers-p02-'+floor.toLowerCase()+'-water-hidden.png')});
      const pixels = await page.evaluate(async ({before,after}) => {
        const decode = async (base64: string) => {
          const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));
          const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
          const c=new OffscreenCanvas(bitmap.width,bitmap.height);
          const ctx=c.getContext('2d')!;
          ctx.drawImage(bitmap,0,0);bitmap.close();
          return {width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};
        };
        const a=await decode(before),b=await decode(after);
        if(a.width!==b.width||a.height!==b.height) throw Error('P02 viewport drift');
        let changed=0,coldChanged=0,hotChanged=0;
        for(let i=0;i<a.data.length;i+=4){
          if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))<=8) continue;
          changed++;
          const [r,g,blue]=[a.data[i],a.data[i+1],a.data[i+2]];
          if(blue>r*1.25&&blue>g*1.1) coldChanged++;
          if(r>blue*1.25&&r>g*1.1) hotChanged++;
        }
        return {changed,coldChanged,hotChanged};
      },{before:before.toString('base64'),after:after.toString('base64')});
      p02Evidence.push({floor,scene:Number(index),sourceSha256:sha,waterNodes:additions,
        coldNodes:cold,hotNodes:hot,pixels,humanReview:'NOT_RUN'});
      writeFileSync(info.outputPath('p02-water-pixels.json'),JSON.stringify(p02Evidence,null,2));
      expect(pixels.changed).toBeGreaterThan(10);
      expect(pixels.coldChanged,'Actual KV pixels must respond to the water control').toBeGreaterThan(0);
      expect(pixels.hotChanged,'Actual LV pixels must respond to the water control').toBeGreaterThan(0);
      await page.locator('#layers-button').click();
      await water.locator('[data-layer-mode="visible"]').click();
      const beforeCamera=JSON.parse(beforePose!);
      const afterCamera=JSON.parse((await canvas.getAttribute('data-layers-camera-pose'))!);
      for(const key of ['position','quaternion','target']) for(let i=0;i<beforeCamera[key].length;i++)
        expect(afterCamera[key][i]).toBeCloseTo(beforeCamera[key][i],9);
      if (isTate) {
        const systemPixels: Record<string,number> = {};
        for (const id of ['technical-drainage','technical-ventilation','technical-electrical']) {
          const control=page.locator('[data-layer-node="'+id+'"]');
          await expect(control).toHaveCount(1);
          await control.locator('[data-layer-mode="visible"]').click();
          await page.locator('#layers-button').click();
          const visible=await canvas.screenshot({path:info.outputPath('tate-'+floor.toLowerCase()+'-'+id+'-visible.png')});
          await page.locator('#layers-button').click();
          await control.locator('[data-layer-mode="hidden"]').click();
          await page.locator('#layers-button').click();
          const hidden=await canvas.screenshot();
          const changed=await page.evaluate(async ({visible,hidden})=>{
            const decode=async (base64:string)=>{
              const bmp=await createImageBitmap(new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/png'}));
              const out=new OffscreenCanvas(bmp.width,bmp.height),ctx=out.getContext('2d')!;
              ctx.drawImage(bmp,0,0);bmp.close();return ctx.getImageData(0,0,out.width,out.height).data;
            };
            const a=await decode(visible),b=await decode(hidden);let changed=0;
            for(let i=0;i<a.length;i+=4) if(Math.max(...[0,1,2].map(c=>Math.abs(a[i+c]-b[i+c])))>8) changed++;
            return changed;
          },{visible:visible.toString('base64'),hidden:hidden.toString('base64')});
          systemPixels[id]=changed;
          Object.assign(p02Evidence.at(-1),{systemPixels});
          writeFileSync(info.outputPath('tate-system-pixels.json'),JSON.stringify(p02Evidence,null,2));
          expect(changed,id+' must affect actual protected WebGL pixels').toBeGreaterThan(0);
          await page.locator('#layers-button').click();
          await control.locator('[data-layer-mode="visible"]').click();
          await expect(control.locator('[data-layer-mode="visible"]')).toHaveAttribute('aria-pressed','true');
        }
        Object.assign(p02Evidence.at(-1),{systemPixels});
        writeFileSync(info.outputPath('tate-system-pixels.json'),JSON.stringify(p02Evidence,null,2));
      }
      await page.getByRole('button',{name:'Palauta näkyvyys'}).click();
    }
    await page.locator('#layers-button').click();
    if (isTate) {
      await verifyTateModelSwitch();
    } else {
      await page.locator('#model-menu > summary').click();
      await page.locator('#current-model-button').click();
      await expect(canvas).toHaveAttribute('data-model-source','current',{timeout:120_000});
      if(await page.locator('#model-menu').getAttribute('open')===null)
        await page.locator('#model-menu > summary').click();
      await page.locator('#work-test-select').selectOption(candidateId);
      await page.locator('#work-test-button').click();
      await expect(canvas).toHaveAttribute('data-p137e-loaded-candidate-id',candidateId,{timeout:120_000});
      await expect(canvas).toHaveAttribute('data-layers-source-sha256',sha);
      await expect(canvas).toHaveAttribute('data-work-test-review-mode',candidateId+'-review');
    }
    console.log(JSON.stringify({p02Production:production,sourceSha256:sha,floors:p02Evidence,
      modelSwitch:isTate ? ['TATE','P02','CURRENT','TATE'] : ['P02','CURRENT','P02'],humanReview:'NOT_RUN'}));
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



