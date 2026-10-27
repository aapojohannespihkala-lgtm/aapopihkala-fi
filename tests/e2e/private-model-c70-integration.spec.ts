import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const C70_SHA = '75b586aaf774bce34cf1dceba5d19e6ae41c112b8717f4cce5ce64458fddc491';

// Public, tiny bootstrap fixture. Private C70 bytes are only supplied on trusted
// main or locally and are selected through the real browser file-input path.
function bootstrapGlb() {
  const binary = Buffer.from(new Float32Array([-1, 0, 0, 1, 0, 0, 0, 2, 0]).buffer);
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0' }, scene: 0,
    scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true }], buffers: [{ byteLength: binary.length }],
    bufferViews: [{ buffer: 0, byteLength: binary.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, 0, 0], max: [1, 2, 0] }],
  }));
  const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const out = Buffer.alloc(28 + padded.length + binary.length);
  out.write('glTF'); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(padded.length, 12); out.write('JSON', 16); padded.copy(out, 20);
  out.writeUInt32LE(binary.length, 20 + padded.length); out.writeUInt32LE(0x004e4942, 24 + padded.length);
  binary.copy(out, 28 + padded.length);
  return out;
}

const openMenu = async (page: Page, id: string) => {
  if (await page.locator(id).getAttribute('open') === null) await page.locator(`${id} > summary`).click();
};

async function viewerModuleUrls(page: Page, origin: string) {
  const scripts = await page.locator('script[type="module"][src]').evaluateAll(elements =>
    elements.map(element => (element as HTMLScriptElement).src));
  // Cloudflare can inject its own module. Only the site's positive /_astro/
  // module set belongs to this build; every selected module still needs SHA parity.
  const own = scripts.filter(src => {
    const url = new URL(src);
    return url.origin === origin && url.pathname.startsWith('/_astro/');
  });
  expect(own.length, 'Published viewer must expose its own actual module bundle').toBeGreaterThan(0);
  return own;
}

function watchModelWrites(page: Page, bytes: Buffer, writes: string[]) {
  page.on('request', request => {
    if (['GET', 'HEAD'].includes(request.method())) return;
    const url = new URL(request.url()), body = request.postDataBuffer();
    // Retain the private endpoint and model-payload gates, including a GLB
    // sent elsewhere, without treating unrelated CDN telemetry as a model upload.
    if (url.pathname.startsWith('/private-model/') || body?.includes(bytes.subarray(0, 64)))
      writes.push(request.method() + ' ' + url.pathname);
  });
}

async function boot(page: Page, preview = true) {
  if (process.env.YLIS_C70_PRODUCTION === '1') {
    const clientId = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const clientSecret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    expect(Boolean(clientId && clientSecret), 'Dedicated production viewer-probe credentials required').toBe(true);
    const sourceIdentities: any[] = [];
    await page.route('https://aapopihkala.fi/private-model/**', async route => {
      // Node-only credentials, exact origin/path and no authenticated redirects.
      // Neither the page nor third-party requests ever receive these secrets.
      const response = await route.fetch({ maxRedirects: 0, headers: {
        ...route.request().headers(), 'cf-access-client-id': clientId!, 'cf-access-client-secret': clientSecret!,
      } });
      if (response.status() >= 300 && response.status() < 400) {
        await route.abort(); throw new Error('Production viewer authentication redirected');
      }
      if (new URL(route.request().url()).pathname === '/private-model/model.glb' && response.ok()) {
        const bytes = await response.body();
        expect(bytes.length).toBeLessThan(12_000_000);
        const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
        sourceIdentities.push({ sha256: createHash('sha256').update(bytes).digest('hex'),
          byteLength: bytes.length, scene: json.scene, sceneCount: json.scenes.length });
      }
      await route.fulfill({ response });
    });
    (page as any).publishedModelIdentities = sourceIdentities;
    await expect(async () => {
      await page.goto('https://aapopihkala.fi/private-model/?c70-preview=1');
      await expect(page.locator('#c70-preview-controls')).toHaveCount(1, { timeout: 5000 });
      const scripts = await viewerModuleUrls(page, 'https://aapopihkala.fi');
      const verifiedBundles: any[] = [];
      for (const src of scripts) {
        const url = new URL(src);
        const local = join(process.cwd(), 'dist', url.pathname);
        expect(existsSync(local), 'Published module must belong to the tested main build').toBe(true);
        const response = await page.request.get(src, { maxRedirects: 0 });
        expect(response.ok()).toBe(true);
        const sha = createHash('sha256').update(await response.body()).digest('hex');
        expect(sha).toBe(createHash('sha256').update(readFileSync(local)).digest('hex'));
        verifiedBundles.push({ path: url.pathname, sha256: sha });
      }
      (page as any).publishedBundles = verifiedBundles;
    }).toPass({ timeout: 240_000, intervals: [10_000, 20_000] });
    await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
    return;
  }
  await page.route('**/private-model/model.glb', r => r.fulfill({ contentType: 'model/gltf-binary', body: bootstrapGlb() }));
  await page.route('**/private-model/work-test/catalog.json', r => r.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', r => r.fulfill({ json: { modules: {} } }));
  await page.goto(`/private-model/${preview ? '?c70-preview=1' : ''}`);
  await expect(page.getByRole('status')).toContainText('Malli ladattu');
}

test('C70 preview needs explicit opt-in, rejects unrelated bytes and never uploads', async ({ page }) => {
  test.skip(process.env.YLIS_C70_PRODUCTION === '1', 'Source-free negative UI test runs on the local build.');
  const writes: string[] = [];
  watchModelWrites(page, bootstrapGlb(), writes);
  await boot(page, false);
  await openMenu(page, '#model-menu');
  await expect(page.locator('#c70-preview-controls')).toBeHidden();
  await page.locator('#c70-preview-input').setInputFiles({ name: 'wrong.glb', mimeType: 'model/gltf-binary', buffer: bootstrapGlb() });
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await boot(page);
  await page.locator('#c70-preview-input').setInputFiles({ name: 'wrong.glb', mimeType: 'model/gltf-binary', buffer: bootstrapGlb() });
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-c70-preview', 'rejected');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  expect(writes).toEqual([]);
});

test('published verifier keeps own modules and private write gates with an injected CDN module', async ({ page }) => {
  test.skip(process.env.YLIS_C70_PRODUCTION === '1', 'Source-free verifier regression.');
  await boot(page);
  await page.route('https://static.cloudflareinsights.com/c70-verifier-fixture.js', r =>
    r.fulfill({ contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: 'export {};' }));
  await page.addScriptTag({ type: 'module', url: 'https://static.cloudflareinsights.com/c70-verifier-fixture.js' });
  const own = await viewerModuleUrls(page, new URL(page.url()).origin);
  expect(own.every(src => !src.includes('cloudflareinsights'))).toBe(true);
  const writes: string[] = [], bytes = bootstrapGlb();
  watchModelWrites(page, bytes, writes);
  for (const path of ['/cdn-cgi/rum', '/private-model/write-fixture', '/payload-fixture'])
    await page.route(`**${path}`, r => r.fulfill({ status: 204 }));
  await page.evaluate(() => fetch('/cdn-cgi/rum', { method: 'POST', body: '{}' }));
  expect(writes).toEqual([]);
  await page.evaluate(() => fetch('/private-model/write-fixture', { method: 'POST', body: '{}' }));
  await page.evaluate(base64 => fetch('/payload-fixture', { method: 'POST',
    body: Uint8Array.from(atob(base64), c => c.charCodeAt(0)) }), bytes.toString('base64'));
  expect(writes).toEqual(['POST /private-model/write-fixture', 'POST /payload-fixture']);
});

for (const width of [1280, 390]) test(`actual C70 GLTFLoader viewer 1F/2F/BOTH/WHOLE, restore and private local file at ${width}px`, async ({ page }, info) => {
  const path = process.env.YLIS_C70_GLB;
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(path, 'Trusted-main C70 source required').toBeTruthy();
  test.skip(!path, 'Private C70 absent: actual-model WebGL NOT_RUN, never PASS.');
  test.setTimeout(process.env.YLIS_C70_PRODUCTION === '1' ? 480_000 : 240_000);
  const bytes = readFileSync(path!);
  expect(bytes.length).toBe(9818932);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(C70_SHA);
  const errors: string[] = [], writes: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  watchModelWrites(page, bytes, writes);
  await page.setViewportSize({ width, height: 900 });
  await boot(page);
  await openMenu(page, '#model-menu');
  await expect(page.locator('#c70-preview-button')).toBeVisible();
  // Same bytes reach File.arrayBuffer -> SHA/route gate -> production GLTFLoader.
  await page.locator('#c70-preview-input').setInputFiles({ name: 'model.glb', mimeType: 'model/gltf-binary', buffer: bytes });
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-c70-preview', 'ready', { timeout: 120_000 });
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256', C70_SHA);
  await expect(page.locator('#model-source-badge')).toHaveText('C70 WORK_TEST');
  const frame = () => canvas.evaluate((c: HTMLCanvasElement) => new Promise<{ colored: number; border: number; hash: number; glError: number; real: boolean }>(resolve => {
    requestAnimationFrame(() => {
      const gl = c.getContext('webgl2')!;
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, p = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p);
      let colored = 0, border = 0, hash = 2166136261;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        hash = Math.imul(hash ^ p[i] ^ (p[i + 1] << 8) ^ (p[i + 2] << 16), 16777619);
        if (Math.abs(p[i] - p[0]) + Math.abs(p[i + 1] - p[1]) + Math.abs(p[i + 2] - p[2]) > 30) {
          colored++; if (x < 4 || x >= w - 4) border++;
        }
      }
      resolve({ colored, border, hash: hash >>> 0, glError: gl.getError(), real: gl instanceof WebGL2RenderingContext && !gl.isContextLost() });
    });
  }));
  const observations: any[] = [];
  for (const [floor, index] of [['1F', 62], ['2F', 52], ['BOTH', 58], ['1F', 62]] as const) {
    await openMenu(page, '#preset-menu');
    await page.locator('#main-view-floor').selectOption(floor);
    await expect(canvas).toHaveAttribute('data-main-view-area', 'D');
    await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
    await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', String(index));
    await expect(canvas).toHaveAttribute('data-main-view-scope-status', 'C70_WORK_TEST_SOURCE_ONLY_HOST_HOLD');
    await expect(page.locator('#other-floor-mode')).toBeDisabled();
    await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
    const pixels = await frame();
    expect(pixels.real).toBe(true); expect(pixels.glError).toBe(0); expect(pixels.colored).toBeGreaterThan(100);
    if (width === 390) expect(pixels.border).toBe(0);
    observations.push({ floor, index, pixels });
    await page.screenshot({ path: info.outputPath(`c70-${floor}-${observations.length}.png`) });
  }
  expect(observations[0].pixels.hash).not.toBe(observations[1].pixels.hash);
  expect(observations[1].pixels.hash).not.toBe(observations[2].pixels.hash);
  // Clip a floor, then switch: clipping must not leak into a different scene.
  await openMenu(page, '#more-menu'); await page.locator('#clip-plane-enabled').check();
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'active');
  await openMenu(page, '#preset-menu'); await page.locator('#main-view-floor').selectOption('2F');
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'inactive');
  // A real user can select geometry, then changing floors clears that selection.
  await page.locator('#selection-tool-button').click();
  const box = (await canvas.boundingBox())!;
  for (const [x, y] of [[.5, .5], [.45, .55], [.6, .55], [.5, .65], [.4, .4]]) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
    if (await page.locator('#selection-panel').isVisible()) break;
  }
  await expect(page.locator('#selection-panel')).toBeVisible();
  await openMenu(page, '#preset-menu'); await page.locator('#main-view-floor').selectOption('1F');
  await expect(page.locator('#selection-panel')).toBeHidden();
  await page.locator('#selection-tool-button').click();
  const beforeOrbit = await canvas.screenshot();
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .55);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .65, box.y + box.height * .45, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await canvas.screenshot()).equals(beforeOrbit)).toBe(false);
  // Live resize retains the chosen source floor and a usable portrait fit.
  await page.setViewportSize({ width: width === 390 ? 1280 : 390, height: 900 });
  await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', '62');
  if (width === 1280) await expect.poll(async () => (await frame()).border).toBe(0);
  await openMenu(page, '#preset-menu'); await page.locator('#main-view-area').selectOption('WHOLE');
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
  await expect(canvas).not.toHaveAttribute('data-main-view-source-scene-index');
  await openMenu(page, '#preset-menu'); await page.locator('#main-view-area').selectOption('D');
  await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', '58');
  await openMenu(page, '#more-menu'); await page.locator('#reset-view-defaults-button').click();
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
  // Same-size corruption reaches the cryptographic gate and preserves the view.
  const corrupt = Buffer.from(bytes); corrupt[corrupt.length - 1] ^= 1;
  await page.locator('#c70-preview-input').setInputFiles({ name: 'bad.glb', mimeType: 'model/gltf-binary', buffer: corrupt });
  await expect(canvas).toHaveAttribute('data-c70-preview', 'rejected');
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256', C70_SHA);
  await openMenu(page, '#model-menu'); await page.locator('#current-model-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).not.toHaveAttribute('data-c70-source-sha256');
  if (process.env.YLIS_C70_PRODUCTION !== '1') await expect(page.locator('#main-view-area')).toBeDisabled();
  const publishedModelIdentities = (page as any).publishedModelIdentities ?? [];
  if (process.env.YLIS_C70_PRODUCTION === '1') {
    expect(publishedModelIdentities.length).toBeGreaterThanOrEqual(2);
    expect(publishedModelIdentities.at(-1)).toEqual(publishedModelIdentities[0]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]); expect(writes).toEqual([]);
  // Allowlisted identity/status metadata only; private model bytes, headers and
  // screenshots remain outside logs and in the existing encrypted evidence path.
  console.log('C70_VIEWER_RESULT ' + JSON.stringify({ width, sourceSha256: C70_SHA,
    target: process.env.YLIS_C70_PRODUCTION === '1' ? 'published' : 'main-build',
    publishedModelIdentities, publishedBundles: (page as any).publishedBundles ?? [],
    modelWrites: writes.length, webgl: 'PASS', sourceLevel: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD' }));
  await info.attach('c70-real-viewer-result', { body: JSON.stringify({ sourceSha256: C70_SHA,
    sourceSceneCount: 70, width, observations, writes, browser: 'REAL_GLTFLOADER_WEBGL2',
    testedCommit: process.env.D_VIEW_TESTED_COMMIT ?? 'local', publishedModelIdentities,
    publishedBundles: (page as any).publishedBundles ?? [],
    production: process.env.YLIS_C70_PRODUCTION === '1' ? 'PUBLISHED_VIEWER_LOCAL_SOURCE_PASS' : 'NOT_RUN',
    stage: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD', canPublish: false, canApplyToViewer: false,
  }), contentType: 'application/json' });
});

for (const width of [1280, 390]) test(`C70 P1 source-only alternatives use the real GLTFLoader/WebGL2 at ${width}px`, async ({ page }) => {
  const path = process.env.YLIS_C70_GLB;
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(path, 'Trusted real C70 source required').toBeTruthy();
  test.skip(!path, 'Private real C70 GLB unavailable; WebGL NOT_RUN, never PASS.');
  test.setTimeout(process.env.YLIS_C70_PRODUCTION === '1' ? 480_000 : 240_000);
  const bytes = readFileSync(path!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(C70_SHA);
  const errors: string[] = [], writes: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  watchModelWrites(page, bytes, writes);
  await page.setViewportSize({ width, height: 900 });
  await boot(page);
  await openMenu(page, '#model-menu');
  await page.locator('#c70-preview-input').setInputFiles({
    name: 'model.glb', mimeType: 'model/gltf-binary', buffer: bytes,
  });
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-c70-preview', 'ready', { timeout: 120_000 });
  await expect(page.locator('#c70-variant-controls')).toBeVisible();
  await expect(page.locator('#c70-scene-variant option')).toHaveCount(14);
  await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', '62');

  // C70's single verified source, no model writes or substitution. Test newly
  // exposed 2F 2015 OPEN/CLOSED, 1F/2F K9, K13/K14 gables and cross-options.
  const variants = width === 1280
    ? [64, 65, 63, 54, 60, 58, 61, 68, 69, 59]
    : [64, 65, 63, 54, 60, 58];
  const seen: number[] = [];
  for (const scene of variants) {
    await openMenu(page, '#model-menu');
    await page.locator('#c70-scene-variant').selectOption(String(scene));
    await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', String(scene));
    await expect(canvas).toHaveAttribute('data-main-view-scope-status',
      'C70_WORK_TEST_SOURCE_ONLY_HOST_HOLD');
    await expect(canvas).toHaveAttribute('data-c70-variant', 'explicit-opt-in');
    await expect(page.locator('#main-view-scope-note')).toContainText('Ei vahvistettu nykytila');
    const pixels = await canvas.evaluate((node: HTMLCanvasElement) => new Promise<{
      real: boolean; count: number; error: number;
    }>(resolve => requestAnimationFrame(() => {
      const gl = node.getContext('webgl2')!;
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const data = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let count = 0;
      for (let i = 4; i < data.length; i += 4)
        if (Math.abs(data[i] - data[0]) + Math.abs(data[i+1] - data[1]) +
            Math.abs(data[i+2] - data[2]) > 30) count++;
      resolve({ real: gl instanceof WebGL2RenderingContext && !gl.isContextLost(),
        count, error: gl.getError() });
    })));
    expect(pixels.real).toBe(true);
    expect(pixels.error).toBe(0);
    expect(pixels.count).toBeGreaterThan(100);
    seen.push(scene);
  }

  // Switching floors through the existing preset selector cancels an
  // incompatible opt-in and returns to the original verified C70 route.
  await openMenu(page, '#model-menu');
  await page.locator('#c70-scene-variant').selectOption('64');
  await openMenu(page, '#preset-menu');
  await page.locator('#main-view-floor').selectOption('1F');
  await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', '62');
  await expect(page.locator('#c70-scene-variant')).toHaveValue('62');
  await openMenu(page, '#preset-menu');
  await page.locator('#main-view-floor').selectOption('2F');
  await expect(canvas).toHaveAttribute('data-main-view-source-scene-index', '52');
  await openMenu(page, '#model-menu');
  await page.locator('#current-model-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#c70-variant-controls')).toBeHidden();
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  console.log('C70_P1_OPTIONAL_VIEW_RESULT ' + JSON.stringify({
    width, sourceSha256: C70_SHA, verifiedSourceScenes: seen,
    mode: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD', modelWrites: 0,
    browser: 'REAL_GLTFLOADER_WEBGL2',
  }));
});
