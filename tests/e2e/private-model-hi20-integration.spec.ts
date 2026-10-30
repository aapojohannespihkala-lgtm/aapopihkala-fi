import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from '../../src/scripts/threeRuntime';
import { prepareC70Preview, createC70MainViewBridge } from '../../src/scripts/c70_main_view_bridge.mjs';
import { verifyC70GLB } from '../../src/scripts/d_floor_router.mjs';
import contract from '../../src/scripts/privateModelC80Hi20Contract.json' with { type: 'json' };
import hi19Contract from '../../src/scripts/privateModelC80Hi19Contract.json' with { type: 'json' };
import hi18Contract from '../../src/scripts/privateModelC80Hi18Contract.json' with { type: 'json' };
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const ID = 'ylisrinne-d-c80-hi20-work-test-20261030';
const PATH = '/private-model/work-test/' + ID + '.glb';
const sourcePath = process.env.YLIS_HI20_GLB;
const production = process.env.YLIS_HI20_PRODUCTION === '1';
const source = () => readFileSync(sourcePath!);
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const prepare = (bytes: Buffer) => prepareC70Preview({
  glbBytes: bytes, contract, loader: new GLTFLoader(), baseUrl: '/private-model/',
  previewGate: 'EXPLICIT_WORK_TEST_PREVIEW', sourceKind: 'work-test',
});

// Unconditionally run this gate on every PR, even when protected Drive bytes are unavailable.
test('HI20 immutable receiver contract and Worker allowlist', () => {
  const candidate = getPrivateWorkTestCandidateById(ID)!;
  expect(candidate).toBeTruthy();
  expect(candidate.expectedSize).toBe(14057136);
  expect(candidate.expectedSha256).toBe(contract.glbSha256);
  expect(candidate.path).toBe(PATH);
  expect(contract.current).toBe(false);
  expect(contract.asBuilt).toBe(false);
  expect(contract.canPublish).toBe(false);
  expect(contract.canApplyToViewer).toBe(false);
  expect(contract.glbDefaultScene).toBe(0);
  expect(contract.sourceSceneCount).toBe(26);
  expect(contract.viewerWholeScene).toBe(23);
  expect(contract.modes.map((row: any) => [row.floor, row.sceneIndex]))
    .toEqual([['BOTH', 25], ['1F', 20], ['2F', 24]]);
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[ID]).toEqual({ driveFileId: contract.sourceDriveFileId });
  expect(registry.candidates[ID]).not.toHaveProperty('extractScene');
});

// The router's exact 26-scene map is validated before byte-length/SHA parsing.
test('HI20 26-scene floor route cannot be rejected as a legacy C80 floor map', async () => {
  await expect(verifyC70GLB(new Uint8Array(0), contract)).rejects.toThrow('GLB length changed');
  // Existing verified HI18/HI19 maps must retain their own accepted scene counts.
  await expect(verifyC70GLB(new Uint8Array(0), hi19Contract)).rejects.toThrow('GLB length changed');
  await expect(verifyC70GLB(new Uint8Array(0), hi18Contract)).rejects.toThrow('GLB length changed');
  expect(contract.modes.map((x: any) => [x.floor, x.sceneIndex])).toEqual([
    ['BOTH',25], ['1F',20], ['2F',24],
  ]);
});

test('HI20 candidate, immutable scene roots, and baseline source provenance', async () => {
  const candidate = getPrivateWorkTestCandidateById(ID)!;
  expect(candidate.expectedSize).toBe(14057136);
  expect(candidate.expectedSha256).toBe(contract.glbSha256);
  expect(candidate.path).toBe(PATH);
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[ID]).toEqual({ driveFileId: contract.sourceDriveFileId });
  expect(registry.candidates[ID]).not.toHaveProperty('extractScene');
  expect(contract.current).toBe(false);
  expect(contract.canPublish).toBe(false);
  expect(contract.canApplyToViewer).toBe(false);
  expect(contract.viewerWholeScene).toBe(23);
  // HI20 differs from HI19 ONLY in new opt-in scenes 24/25; 1F 20 and WHOLE 23 remain exact.
  expect(contract.sourceSceneCount).toBe(26);
  expect(contract.modes.map((row: any) => [row.floor, row.sceneIndex])).toEqual([
    ['BOTH', 25], ['1F', 20], ['2F', 24],
  ]);
  expect(contract.sourceDriveFileId).toBe('1KVt6coeXtd2H3h5M-1eiDpdB6X5TmeFn');
  expect(contract.sourceZipSha256).toBe('0ebe0ed9c0b7a82e754958dae76d48d9c9e2f5ace55e5659279c23e03992ccf1');
  expect(contract.sourceZipByteLength).toBe(1949337);
  expect(contract.glbSha256).toBe('8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d');
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(sourcePath).toBeTruthy();
  test.skip(!sourcePath, 'Exact GLB source not available.');
  const bytes = source();
  expect(bytes.length).toBe(contract.glbByteLength);
  expect(sha(bytes)).toBe(contract.glbSha256);
  const session = await prepare(bytes);
  const gltf = session.gltf;
  const src = gltf.parser.json;
  expect(gltf.scenes).toHaveLength(26);
  expect(gltf.parser.json.scene).toBe(0);
  const expectedAdditions = [
    [24, [5863, 5864, 5865], 21],
    [25, [5869, 5870, 5871], 22],
  ] as const;
  for (const [index, nodes, parentIndex] of expectedAdditions) {
    const target = src.scenes[index];
    expect(target.extras.derivedFromHI19Scene).toBe(parentIndex);
    expect(target.extras.physicalHost).toBe('HOST_HOLD');
    expect(target.extras.humanReview).toBe('NOT_RUN');
    for (const nodeId of nodes) {
      const data = src.nodes[nodeId];
      expect(target.nodes.includes(nodeId)).toBe(true);
      expect(data.extras.sourceHI19GLBSHA256).toBe(
        'b4b31503e64f1228d723f27fe8fe5f68beb0d9d8e6af8c7e64ec06647202882d');
      expect(data.extras.sourceNodes.length).toBeGreaterThan(0);
      expect(data.extras.current).toBe(false);
    }
  }
  let mounted: any = gltf.scenes[23];
  const bridge = createC70MainViewBridge({ session,
    setScene: (root: any) => { mounted = root; },
    readMountedScene: () => mounted,
    previewGate: 'EXPLICIT_WORK_TEST_PREVIEW', sourceKind: 'work-test' });
  for (const row of contract.modes) {
    const sc = gltf.parser.json.scenes[row.sceneIndex];
    expect(sc.name).toBe(row.sceneName);
    expect(sc.nodes.length).toBe(row.rootCount);
    expect(sha(JSON.stringify(sc.nodes))).toBe(row.rootSha256);
    bridge.restore();
    expect(bridge.apply(row.floor).sceneIndex).toBe(row.sceneIndex);
    expect(mounted).toBe(gltf.scenes[row.sceneIndex]);
  }
  bridge.restore();
  expect(mounted).toBe(gltf.scenes[23]);
  const whole = contract.wholeScene;
  expect(src.scenes[whole.sceneIndex].name).toBe(whole.sceneName);
  expect(sha(JSON.stringify(src.scenes[whole.sceneIndex].nodes))).toBe(whole.rootSha256);
  const tampered = Buffer.from(bytes);
  tampered[tampered.length-1] ^= 1;
  await expect(prepare(tampered)).rejects.toThrow(/SHA256/);
});

for (const width of [1280, 390]) test.describe('HI20 protected WebGL ' + width, () => {
  test.use({ viewport: { width, height: 900 }, hasTouch: width === 390, isMobile: width === 390,
    deviceScaleFactor: width === 390 ? 2 : 1 });
  test('real 1F/2F/BOTH + SHA + legacy scene reset', async ({ page }, info) => {
    if (process.env.YLIS_REQUIRE_REAL === '1') expect(sourcePath).toBeTruthy();
    test.skip(!sourcePath, 'Exact GLB source not available.');
    test.setTimeout(540_000);
    const bytes = source();
    expect(sha(bytes)).toBe(contract.glbSha256);
    const errors: string[] = [];
    let fetchedVerified = false;
    page.on('pageerror', error => errors.push(error.message));
    if (production) {
      const id = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
      const secret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
      expect(Boolean(id && secret)).toBe(true);
      await page.route('https://aapopihkala.fi/private-model/**', async route => {
        const response = await route.fetch({ maxRedirects: 0, headers: {
          ...route.request().headers(), 'cf-access-client-id': id!,
          'cf-access-client-secret': secret!,
        } });
        expect(response.status()).toBeLessThan(300);
        if (new URL(route.request().url()).pathname === PATH && response.ok()) {
          const body = await response.body();
          expect(body.length).toBe(contract.glbByteLength);
          expect(sha(body)).toBe(contract.glbSha256);
          fetchedVerified = true;
        }
        await route.fulfill({ response });
      });
      await page.goto('https://aapopihkala.fi/private-model/?hi20=1');
    } else {
      await page.route('**' + PATH, route => route.fulfill({
        contentType: 'model/gltf-binary', body: bytes,
      }));
      await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
      await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({ json: { candidates: [] } }));
      await page.goto('/private-model/?hi20=1');
    }
    const canvas = page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-c80-preview', 'ready', { timeout: 120_000 });
    await expect(canvas).toHaveAttribute('data-c80-version', 'HI20');
    await expect(canvas).toHaveAttribute('data-c80-source-sha256', contract.glbSha256);
    await expect(canvas).toHaveAttribute('data-c80-source-transport', 'protected-work-test');
    for (const [floor, index] of [['BOTH', 25], ['1F', 20], ['2F', 24]] as const) {
      const menu = page.locator('#preset-menu');
      if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
      await page.locator('#main-view-floor').selectOption(floor);
      await expect(canvas).toHaveAttribute('data-c80-scene-index', String(index));
      expect(Number(await canvas.getAttribute('data-c80-mesh-count'))).toBeGreaterThan(100);
      // C80-044 / HI20 WP7: no artificial per-mesh seams in D BOTH and D 2F.
      // The source meshes and physical silhouettes remain rendered and pixel-tested below.
      if (floor === 'BOTH' || floor === '2F') {
        await expect(canvas).toHaveAttribute('data-edge-mode', 'none');
        await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '0');
      }
      const error = await canvas.evaluate((node: HTMLCanvasElement) => node.getContext('webgl2')?.getError());
      expect(error).toBe(0);
      const colors = await canvas.evaluate((node: HTMLCanvasElement) => new Promise<number>(resolve => requestAnimationFrame(() => {
        const gl = node.getContext('webgl2')!;
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let colored = 0;
        for (let i = 4; i < pixels.length; i += 4) if (Math.abs(pixels[i]-pixels[0]) + Math.abs(pixels[i+1]-pixels[1]) + Math.abs(pixels[i+2]-pixels[2]) > 30) colored++;
        resolve(colored);
      })));
      expect(colors).toBeGreaterThan(100);
      await page.screenshot({ path: info.outputPath('hi20-' + width + '-' + floor + '.png') });
    }
    const menu = page.locator('#preset-menu');
    if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
    await page.locator('#main-view-area').selectOption('WHOLE');
    await expect(canvas).toHaveAttribute('data-c80-scene-index', '23');
    if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
    await page.locator('#main-view-area').selectOption('D');
    await expect(canvas).toHaveAttribute('data-c80-scene-index', '25');
    expect(errors).toEqual([]);
    if (production) expect(fetchedVerified).toBe(true);
  });
});
