import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GLTFLoader, THREE } from '../../src/scripts/threeRuntime';
import { prepareC70Preview, createC70MainViewBridge } from '../../src/scripts/c70_main_view_bridge.mjs';
import { c80Hi12Source, prepareC80Hi12Source } from '../../src/scripts/c80SourceProfiles.mjs';
import { createC80Hi12VisibilityAdapter } from '../../src/scripts/c80Hi12Visibility.mjs';
import { computeVisibleBounds } from '../../src/scripts/privateModelVisibleBounds';
import { selectionSourceLinks } from '../../src/scripts/privateModelSelectionMetadata';
import contract from '../../src/scripts/privateModelC80Hi12Contract.json' with { type: 'json' };
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';
const ID = 'ylisrinne-d-c80-hi12-work-test-20261029';
const PATH = '/private-model/work-test/' + ID + '.glb';
const SHA = '4e5ed14c710c7e04484a8b0a1975afb9933115ca6734b0de772ef096e51fb0f7';
const production = process.env.YLIS_HI12_PRODUCTION === '1';
const source = () => readFileSync(process.env.YLIS_HI12_GLB!);
const prepare = (bytes: Buffer = source()) => prepareC70Preview({ glbBytes: bytes, contract,
  loader: new GLTFLoader(), baseUrl: '/private-model/', previewGate: 'EXPLICIT_WORK_TEST_PREVIEW', sourceKind: 'work-test' });
const fingerprint = (gltf: any) => gltf.scenes.map((root: any) => {
  const result: any[] = [];
  root.traverse((o: any) => result.push([o.uuid, o === root ? null : o.parent?.uuid, o.visible, o.matrix.toArray(),
    o.geometry?.uuid, o.material?.uuid, o.userData]));
  return JSON.stringify(result);
});

test('HI12 protected candidate keeps exact Drive/SHA and legacy candidates', async () => {
  test.skip(production, 'Source-free gate runs before production.');
  const candidate = getPrivateWorkTestCandidateById(ID)!;
  expect(candidate.expectedSize).toBe(11800768); expect(candidate.expectedSha256).toBe(SHA);
  expect(candidate.path).toBe(PATH);
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[ID]).toEqual({ driveFileId: contract.sourceDriveFileId });
  expect(registry.candidates[ID]).not.toHaveProperty('extractScene');
  expect(getPrivateWorkTestCandidateById('ylisrinne-d-c80-source-only-20261028')!.expectedSha256)
    .toBe('c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d');
  expect(getPrivateWorkTestCandidateById('ylisrinne-d-c70-source-only-20261027')!.expectedSha256)
    .toBe('75b586aaf774bce34cf1dceba5d19e6ae41c112b8717f4cce5ce64458fddc491');
  expect(contract.current).toBe(false); expect(contract.canApplyToViewer).toBe(false);
  let parses = 0;
  await expect(prepareC70Preview({ glbBytes: Buffer.alloc(11800768), contract,
    loader: { parseAsync: () => { parses++; } }, baseUrl: '/private-model/',
    previewGate: 'EXPLICIT_WORK_TEST_PREVIEW', sourceKind: 'work-test' })).rejects.toThrow();
  expect(parses).toBe(0);
});

test('actual HI12 cached nodes, primitives, native links and reversible K17/SITE lifecycle', async () => {
  test.skip(production, 'Run once with trusted private source.');
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(process.env.YLIS_HI12_GLB).toBeTruthy();
  test.skip(!process.env.YLIS_HI12_GLB, 'Private HI12 absent: real GLTFLoader NOT_RUN.');
  const session = await prepare(); const gltf = session.gltf;
  const { profile, sourceObjects, associations } = c80Hi12Source(session);
  expect(session.verification.glbSha256).toBe(SHA);
  const original = fingerprint(gltf);
  const mount = new THREE.Group(); mount.add(gltf.scenes[3]);
  const bridge = createC80Hi12VisibilityAdapter({ session, bridge: createC70MainViewBridge({ session,
    setScene: (s: any) => { mount.clear(); mount.add(s); }, readMountedScene: () => mount.children[0],
    previewGate: 'EXPLICIT_WORK_TEST_PREVIEW', sourceKind: 'work-test' }) });
  let selections = 0, links = 0;
  for (let si = 0; si < 4; si++) {
    let meshes = 0;
    gltf.scenes[si].traverse((o: any) => { if (o.isMesh) meshes++;
      const a = associations.get(o);
      if (o.isMesh || (a?.nodes !== undefined && gltf.parser.json.nodes[a.nodes].mesh !== undefined)) {
      const native = selectionSourceLinks(o, gltf.scenes[si]);
      if (native.length) { selections++; links += native.length; }
    } });
    expect(meshes).toBe([1414, 928, 495, 2182][si]);
    const expected = profile.scenes[si], objects = sourceObjects[si];
    expect(objects.get(expected.k17Root).children).toHaveLength(14);
    for (const record of expected.records) expect(associations.get(objects.get(record.node))!.nodes).toBe(record.node);
    if (expected.siteRoots.length) {
      const site = objects.get(expected.siteRoots[0]); expect(site.children).toHaveLength(7);
      expect(site.children[0].isGroup).toBe(true); expect(site.children[0].children).toHaveLength(2);
      expect(site.children[0].children.map((o: any) => associations.get(o)!.primitives)).toEqual([0, 1]);
    }
  }
  expect({ selections, links }).toEqual({ selections: 1224, links: 3681 });
  for (let cycle = 0; cycle < 8; cycle++) for (const [floor, si] of [['BOTH', 0], ['1F', 1], ['2F', 2]] as const) {
    bridge.restore(); expect(bridge.apply(floor).sceneIndex).toBe(si);
    expect(mount.children).toEqual([gltf.scenes[si]]);
    bridge.setFloorShellMode('SOURCE');
    const fit = computeVisibleBounds(gltf.scenes[si], true, true)!;
    bridge.setSourceContextVisible(false);
    const expected = profile.scenes[si], objects = sourceObjects[si];
    for (const id of expected.k17NodeIds) expect(objects.get(id).visible).toBe(true);
    for (const id of expected.siteRoots) expect(objects.get(id).visible).toBe(true);
    for (const id of expected.contextNodeIds) expect(objects.get(id).visible).toBe(false);
    expect(computeVisibleBounds(gltf.scenes[si], true, true)!.equals(fit)).toBe(true);
    bridge.setRoofContextVisible(true); bridge.setSourceContextVisible(true);
    for (const id of expected.contextNodeIds) expect(objects.get(id).visible).toBe(true);
  }
  bridge.restore(); expect(mount.children).toEqual([gltf.scenes[3]]);
  expect(fingerprint(gltf)).toEqual(original);
});

test('HI12 real runtime rejects wrong K17 paths/world and missing SITE primitive', async () => {
  test.skip(production || !process.env.YLIS_HI12_GLB, 'Trusted-source negative runtime gate.');
  for (const mutate of [
    (g: any, b: any) => b.sourceObjects[1].get(5240).position.x += .01,
    (g: any, b: any) => b.sourceObjects[0].get(5100).remove(b.sourceObjects[0].get(5100).children[1]),
    (g: any, b: any) => g.scenes[1].add(b.sourceObjects[1].get(5240)),
  ]) {
    const session = await prepare(); mutate(session.gltf, c80Hi12Source(session));
    await expect(prepareC80Hi12Source(session.gltf)).rejects.toThrow();
  }
  const b = source(); b[b.length - 1] ^= 1;
  await expect(prepare(b)).rejects.toThrow(/SHA256/);
});

const menu = async (page: Page, id: string) => {
  if (await page.locator(id).getAttribute('open') === null) await page.locator(id + ' > summary').click();
};
const closeMenu = async (page: Page, id: string) => {
  if (await page.locator(id).getAttribute('open') !== null) await page.locator(id + ' > summary').click();
};
const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve => {
  let frames = 0; const tick = () => ++frames >= 65 ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick);
}));
const pose = (page: Page) => page.locator('#ai-navigator-readout').getAttribute('data-world-pose').then(raw => JSON.parse(raw!));
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
// An orbit leaves angular damping after pointer-up. Observe the actual pose over
// full render-frame intervals before treating the following gesture as pure pan.
const stableOrbitPose = async (page: Page) => {
  let current = await pose(page);
  await expect(async () => {
    const before = current;
    await settle(page);
    current = await pose(page);
    expect(distance(before.direction, current.direction)).toBeLessThan(.000001);
  }).toPass({ timeout: 90_000, intervals: [0] });
  return current;
};
const frame = (page: Page) => page.locator('#private-model-canvas').evaluate((node: HTMLCanvasElement) =>
  new Promise<{ colored: number; error: number }>(resolve => requestAnimationFrame(() => {
    const gl = node.getContext('webgl2');
    if (!(gl instanceof WebGL2RenderingContext) || gl.isContextLost()) throw Error('Actual WebGL2 unavailable');
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let colored = 0;
    for (let i = 4; i < pixels.length; i += 4)
      if (Math.abs(pixels[i]-pixels[0])+Math.abs(pixels[i+1]-pixels[1])+Math.abs(pixels[i+2]-pixels[2]) > 30) colored++;
    resolve({ colored, error: gl.getError() });
  })));

// Click actual unobstructed rendered model pixels, as in the C70 viewer proof.
const pickSourceLinkedMesh = async (page: Page, bytes: Buffer) => {
  const jsonLength = bytes.readUInt32LE(12);
  const model = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const allowed = new Set<string>();
  const visit = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.sourceLinks)) for (const record of value.sourceLinks)
      if (typeof record?.link === 'string') allowed.add(record.link.trim());
    for (const child of Object.values(value)) if (typeof child === 'object') visit(child);
  };
  visit(model);
  const canvas = page.locator('#private-model-canvas');
  const points = await canvas.evaluate((element: HTMLCanvasElement) => new Promise<Array<{ x: number; y: number; contrast: number }>>(resolve => requestAnimationFrame(() => {
    const gl = element.getContext('webgl2')!;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const rect = element.getBoundingClientRect();
    const points: Array<{ x: number; y: number; contrast: number }> = [];
    for (let row = 1; row < 30; row++) for (let col = 1; col < 24; col++) {
      const x = Math.floor(col * w / 24), y = Math.floor(row * h / 30);
      const i = ((h - 1 - y) * w + x) * 4;
      const contrast = Math.abs(pixels[i] - pixels[0]) + Math.abs(pixels[i + 1] - pixels[1]) + Math.abs(pixels[i + 2] - pixels[2]);
      const clientX = rect.left + x * rect.width / w, clientY = rect.top + y * rect.height / h;
      if (contrast > 40 && document.elementFromPoint(clientX, clientY) === element) points.push({ x: clientX, y: clientY, contrast });
    }
    resolve(points.sort((a, b) => b.contrast - a.contrast).slice(0, 100));
  })));
  expect(points.length).toBeGreaterThan(0);
  await page.locator('#selection-tool-button').click();
  await expect(page.locator('#selection-tool-button')).toHaveAttribute('aria-pressed', 'true');
  for (const point of points) {
    if (await page.locator('#selection-panel').isVisible()) await page.locator('#clear-selection-button').click();
    await page.mouse.click(point.x, point.y);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    if (await page.locator('#selection-panel').isVisible() && await page.locator('#selection-source-links-list a').count()) break;
  }
  await expect(page.locator('#selection-panel')).toBeVisible();
  const links = await page.locator('#selection-source-links-list a').evaluateAll(nodes => nodes.map(node => (node as HTMLAnchorElement).href));
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) expect(allowed.has(link), 'Selected native source link must occur in this exact HI12 source').toBe(true);
  await menu(page, '#selection-source-links');
  return { mesh: await page.locator('#selection-mesh').innerText(), links };
};

for (const width of [1280, 390]) test.describe('HI12 WebGL ' + width, () => {
  test.use({ viewport: { width, height: 900 }, hasTouch: width === 390, isMobile: width === 390,
    deviceScaleFactor: width === 390 ? 2 : 1 });
  test('protected HI12 floors/context, gestures, fit and legacy return', async ({ page, context }, info) => {
    if (process.env.YLIS_REQUIRE_REAL === '1') expect(process.env.YLIS_HI12_GLB).toBeTruthy();
    test.skip(!process.env.YLIS_HI12_GLB, 'Private source absent: real browser NOT_RUN.');
    test.setTimeout(540_000);
    const bytes = source(); expect(createHash('sha256').update(bytes).digest('hex')).toBe(SHA);
    const writes: string[] = [], errors: string[] = [], bundles: any[] = [], identities: any[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (!['GET', 'HEAD'].includes(r.method()) &&
      (new URL(r.url()).pathname.startsWith('/private-model/') || r.postDataBuffer()?.includes(bytes.subarray(0, 64)))) writes.push(r.method()); });
    if (production) {
      const clientId = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID, secret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
      expect(Boolean(clientId && secret)).toBe(true);
      await page.route('https://aapopihkala.fi/private-model/**', async route => {
        const response = await route.fetch({ maxRedirects: 0, headers: { ...route.request().headers(),
          'cf-access-client-id': clientId!, 'cf-access-client-secret': secret! } });
        expect(response.status()).not.toBeGreaterThanOrEqual(300); // redirects/errors never reach the viewer
        if (new URL(route.request().url()).pathname === PATH && response.ok()) {
          const actual = await response.body();
          expect(actual.length).toBe(11800768); expect(createHash('sha256').update(actual).digest('hex')).toBe(SHA);
          identities.push({ sha256: SHA, byteLength: actual.length });
        }
        await route.fulfill({ response });
      });
      await expect(async () => {
        await page.goto('https://aapopihkala.fi/private-model/?hi12=1');
        const urls = await page.locator('script[type="module"][src]').evaluateAll(nodes => nodes.map(n => (n as HTMLScriptElement).src));
        const own = urls.filter(src => new URL(src).origin === 'https://aapopihkala.fi' && new URL(src).pathname.startsWith('/_astro/'));
        expect(own.length).toBeGreaterThan(0); bundles.length = 0;
        for (const src of own) {
          const local = join(process.cwd(), 'dist', new URL(src).pathname); expect(existsSync(local)).toBe(true);
          const response = await page.request.get(src, { maxRedirects: 0 }); expect(response.ok()).toBe(true);
          const sha = createHash('sha256').update(await response.body()).digest('hex');
          expect(sha).toBe(createHash('sha256').update(readFileSync(local)).digest('hex')); bundles.push({ path: new URL(src).pathname, sha256: sha });
        }
      }).toPass({ timeout: 240_000, intervals: [10_000, 20_000] });
    } else {
      await page.route('**' + PATH, r => r.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
      await page.route('**/private-model/source-cards.json', r => r.fulfill({ json: { modules: {} } }));
      await page.route('**/private-model/work-test/catalog.json', r => r.fulfill({ json: { candidates: [] } }));
      for (const [id, env] of [['ylisrinne-d-c70-source-only-20261027', 'YLIS_C70_GLB'], ['ylisrinne-d-c80-source-only-20261028', 'YLIS_C80_GLB']])
        if (process.env[env]) await page.route('**/private-model/work-test/' + id + '.glb', r => r.fulfill({ body: readFileSync(process.env[env]!) }));
      await page.goto('/private-model/?hi12=1');
    }
    const canvas = page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-c80-preview', 'ready', { timeout: 120_000 });
    await expect(canvas).toHaveAttribute('data-c80-version', 'HI12');
    await expect(canvas).toHaveAttribute('data-c80-source-sha256', SHA);
    await expect(canvas).toHaveAttribute('data-c80-source-transport', 'protected-work-test');
    const observations: any[] = [];
    for (const [floor, si] of [['BOTH', 0], ['1F', 1], ['2F', 2]] as const) {
      await menu(page, '#preset-menu'); await page.locator('#main-view-floor').selectOption(floor);
      await closeMenu(page, '#preset-menu'); await settle(page);
      await expect(canvas).toHaveAttribute('data-c80-scene-index', String(si));
      await expect(canvas).toHaveAttribute('data-c80-mesh-count', String([1414, 928, 495][si]));
      const pixels = await frame(page); expect(pixels.error).toBe(0); expect(pixels.colored).toBeGreaterThan(100);
      await page.screenshot({ path: info.outputPath('hi12-' + width + '-' + floor + '.png') });
      observations.push({ floor, si, pixels });
      await page.locator('#layers-button').click(); await settle(page);
      const before = await pose(page);
      for (const checked of [false, true]) {
        await page.locator('#c80-source-context-visible').setChecked(checked); await settle(page);
        await expect(canvas).toHaveAttribute('data-c80-source-context-visible', String(checked));
        expect(distance(before.position, (await pose(page)).position)).toBeLessThan(.00001);
      }
      await page.locator('#close-layers-button').click();
    }
    const selection = await pickSourceLinkedMesh(page, bytes);
    await page.screenshot({ path: info.outputPath('hi12-' + width + '-source-selection.png') });
    await menu(page, '#preset-menu'); await page.locator('#main-view-floor').selectOption('1F');
    await expect(page.locator('#selection-panel')).toBeHidden();
    await page.locator('#navigate-tool-button').click();
    await expect(page.locator('#selection-tool-button')).toHaveAttribute('aria-pressed', 'false');
    await menu(page, '#preset-menu'); await page.locator('#main-view-area').selectOption('WHOLE');
    await expect(canvas).toHaveAttribute('data-c80-scene-index', '3');
    await menu(page, '#preset-menu'); await page.locator('#main-view-area').selectOption('D'); await expect(canvas).toHaveAttribute('data-c80-scene-index', '0');
    await closeMenu(page, '#preset-menu'); await settle(page);
    const box = (await canvas.boundingBox())!, x = box.x + box.width * .5, y = box.y + box.height * .5;
    const start = await pose(page);
    if (width === 1280) {
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 25, y + 8, { steps: 10 }); await page.mouse.up(); await settle(page);
      const orbit = await pose(page); expect(distance(start.direction, orbit.direction)).toBeGreaterThan(.001);
      await page.mouse.move(x, y); await page.mouse.down({ button: 'right' }); await page.mouse.move(x + 20, y - 8, { steps: 10 }); await page.mouse.up({ button: 'right' }); await settle(page);
      const pan = await pose(page); expect(distance(orbit.target, pan.target)).toBeGreaterThan(.001);
      await page.mouse.wheel(0, -180); await settle(page); expect(distance(pan.position, (await pose(page)).position)).toBeGreaterThan(.001);
    } else {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] });
      for (let n = 1; n <= 10; n++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + n * 2, y: y + n, id: 0 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(page);
      const orbit = await stableOrbitPose(page);
      expect(distance(start.direction, orbit.direction)).toBeGreaterThan(.001);
      const touch = (points: Array<{ x: number; y: number }>, type: 'touchStart' | 'touchMove' | 'touchEnd') => cdp.send('Input.dispatchTouchEvent', {
        type, touchPoints: points.map((point, id) => ({ ...point, id })) });
      await touch([{ x: x - 25, y }, { x: x + 25, y }], 'touchStart');
      for (let n = 1; n <= 10; n++) await touch([{ x: x - 25 + n, y: y + n }, { x: x + 25 + n, y: y + n }], 'touchMove');
      await touch([], 'touchEnd'); await settle(page);
      const pan = await pose(page);
      expect(distance(orbit.target, pan.target)).toBeGreaterThan(.001);
      expect(distance(orbit.direction, pan.direction)).toBeLessThan(.0001);
      await touch([{ x: x - 25, y }, { x: x + 25, y }], 'touchStart');
      for (let n = 1; n <= 10; n++) await touch([{ x: x - 25 - n, y }, { x: x + 25 + n, y }], 'touchMove');
      await touch([], 'touchEnd'); await settle(page);
      const zoom = await pose(page);
      expect(distance(zoom.position, zoom.target)).toBeLessThan(distance(pan.position, pan.target));
      await cdp.detach();
    }
    await menu(page, '#more-menu'); await page.locator('#fit-button').click(); await settle(page);
    expect((await frame(page)).colored).toBeGreaterThan(100);
    await menu(page, '#more-menu'); await page.locator('#reset-view-defaults-button').click();
    await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
    await expect(canvas).toHaveAttribute('data-c80-scene-index', '3');
    await expect(canvas).toHaveAttribute('data-c80-source-sha256', SHA);
    await settle(page); expect((await frame(page)).error).toBe(0);
    // The separate C70/C80 suite verifies their complete lifecycle/default return.
    // Here the real linked fallback must load C70 rather than retaining HI12.
    if (production || process.env.YLIS_C70_GLB) {
      await menu(page, '#model-menu'); await page.locator('#c70-fallback-link').click();
      await expect(canvas).toHaveAttribute('data-c70-preview', 'ready', { timeout: 120_000 });
      await expect(canvas).not.toHaveAttribute('data-c80-version');
    }
    expect(writes).toEqual([]); expect(errors).toEqual([]);
    if (production) expect(identities.length).toBeGreaterThan(0);
    console.log('HI12_WEBGL_RESULT ' + JSON.stringify({ width, production, sourceSha256: SHA, observations, identities,
      realWebGL2: true, bundles, selection, reset: 'FULL_CONTEXT', mobilePanZoom: width === 390 ? 'PASS' : 'NOT_APPLICABLE', testedCommit: process.env.D_VIEW_TESTED_COMMIT, humanReview: 'NOT_RUN' }));
  });
});

